import { readFile } from "node:fs/promises";
import path from "node:path";

import { test, expect } from "@playwright/test";
import sharp from "sharp";

import { loginAsUser } from "./helpers/auth";
import { getDb } from "./helpers/db";
import {
  createGuest,
  createInvitation,
  createUser,
  cleanupUser,
  publishInvitation,
} from "./helpers/fixtures";

// The published invitation page /thiep/[slug] is PUBLIC (no auth). It resolves a
// slug via prisma.invitation.findFirst({ where: { slug, status: "published" } })
// and calls notFound() when nothing matches (page.tsx line 63).
//
// For the default seeded template ("song-hy-red") ChungDoiDemo renders
// SongHyInvitation, whose opened body — including the "Sổ lưu bút" wish form —
// is present in the DOM behind the 3D WebGL envelope overlay. Tests wait for
// hydration, fill through the overlay, then submit the form programmatically.
//
// Guest Manager v2 renders a global RSVP dialog after the envelope opens. The
// form is shared by every template and supports invitation-specific questions.

// Wish form copy is verbatim from SongHyWishForm in chungdoi-demo.tsx (line ~1614).
const WISH_NAME_PLACEHOLDER = "Nhập tên của bạn*";
const WISH_TEXT_PLACEHOLDER = "Nhập lời chúc của bạn*";
test.describe("published invitation /thiep/[slug]", () => {
  test("owner sees the manage invitation shortcut and can open the dashboard", async ({
    page,
    context,
  }) => {
    const user = createUser();
    try {
      const inv = createInvitation(user.id);
      const slug = publishInvitation(inv.id);
      await loginAsUser(context, user.id);

      await page.goto(`/thiep/${slug}`);
      const manageLink = page.getByRole("link", { name: "Quản lý thiệp" });
      await expect(manageLink).toBeVisible();
      await expect(manageLink).toHaveAttribute("href", "/dashboard");

      await manageLink.click();
      await expect(page).toHaveURL(/\/dashboard$/);
    } finally {
      cleanupUser(user.id);
    }
  });

  test("manage invitation shortcut is hidden from guests and other users", async ({
    page,
    context,
  }) => {
    const owner = createUser();
    const other = createUser();
    try {
      const inv = createInvitation(owner.id);
      const slug = publishInvitation(inv.id);
      await loginAsUser(context, other.id);

      await page.goto(`/thiep/${slug}`);
      await expect(page.getByRole("link", { name: "Quản lý thiệp" })).toHaveCount(0);
    } finally {
      cleanupUser(owner.id);
      cleanupUser(other.id);
    }
  });

  test("published slug renders the couple's full names", async ({ page }) => {
    const user = createUser();
    try {
      const inv = createInvitation(user.id);
      const slug = publishInvitation(inv.id, {
        brideFullName: "Nguyễn Thị Bích",
        groomFullName: "Trần Văn An",
      });

      const res = await page.goto(`/thiep/${slug}`);
      expect(res?.status()).toBe(200);

      // SongHyInvitation renders both full names as headings in the opened body.
      await expect(page.getByText("Trần Văn An")).toBeVisible();
      await expect(page.getByText("Nguyễn Thị Bích")).toBeVisible();
    } finally {
      cleanupUser(user.id);
    }
  });

  test("an old complimentary invitation remains publicly available", async ({ page }) => {
    const user = createUser();
    try {
      const slug = `complimentary-${user.id}`;
      createInvitation(user.id, {
        slug,
        status: "published",
        paid: false,
        complimentary: true,
        publishedAt: new Date("2020-01-01T00:00:00.000Z"),
      });

      const response = await page.goto(`/thiep/${slug}`);
      expect(response?.status()).toBe(200);
      await expect(page.locator("[data-open-invitation-control]")).toBeVisible();
      await expect(page.getByText("Thiệp đã hết hạn dùng thử")).toHaveCount(0);
      await expect(page.getByRole("link", { name: "Gia hạn / Thanh toán" })).toHaveCount(0);
    } finally {
      cleanupUser(user.id);
    }
  });

  test("unknown slug returns 404", async ({ page }) => {
    const res = await page.goto("/thiep/khong-ton-tai-slug-abc123");
    expect(res?.status()).toBe(404);
  });

  test("draft (unpublished) invitation slug returns 404", async ({ page }) => {
    const user = createUser();
    try {
      // Give the draft a real slug but leave status = "draft"; loadPublished
      // filters on status: "published" so it must not resolve.
      const draftSlug = `draft-${Date.now()}`;
      createInvitation(user.id, { slug: draftSlug, status: "draft" });

      const res = await page.goto(`/thiep/${draftSlug}`);
      expect(res?.status()).toBe(404);
    } finally {
      cleanupUser(user.id);
    }
  });

  test("submitting the wish form persists a Wish row", async ({ page }) => {
    const user = createUser();
    try {
      const inv = createInvitation(user.id);
      const slug = publishInvitation(inv.id, {
        brideFullName: "Lê Thị Hoa",
        groomFullName: "Phạm Văn Bình",
      });

      await page.goto(`/thiep/${slug}`);

      const wishName = `Khách Test ${Date.now()}`;
      const wishText = "Chúc hai bạn trăm năm hạnh phúc!";

      const wishForm = page.locator("form", { has: page.getByPlaceholder(WISH_NAME_PLACEHOLDER) });
      await expect(page.getByPlaceholder(WISH_NAME_PLACEHOLDER)).toBeVisible();
      await page.getByPlaceholder(WISH_NAME_PLACEHOLDER).fill(wishName, { force: true });
      await page.getByPlaceholder(WISH_TEXT_PLACEHOLDER).fill(wishText, { force: true });
      await wishForm.evaluate((form) => (form as HTMLFormElement).requestSubmit());

      // submitWish inserts a Wish row (actions.ts) then revalidatePath.
      await expect
        .poll(
          () =>
            getDb()
              .prepare("SELECT COUNT(*) AS n FROM Wish WHERE invitationId = ? AND name = ?")
              .get(inv.id, wishName) as { n: number },
          { timeout: 10_000 },
        )
        .toEqual({ n: 1 });

      const row = getDb()
        .prepare("SELECT name, text FROM Wish WHERE invitationId = ? AND name = ?")
        .get(inv.id, wishName) as { name: string; text: string };
      expect(row.text).toBe(wishText);
    } finally {
      cleanupUser(user.id);
    }
  });

  test("a wish appears immediately and its owner can remove it", async ({ page, context }) => {
    const user = createUser();
    try {
      const inv = createInvitation(user.id);
      const slug = publishInvitation(inv.id);
      const wishName = `Khách kiểm duyệt ${Date.now()}`;
      const wishText = "Chúc mừng hạnh phúc — lời chúc kiểm thử";

      await page.goto(`/thiep/${slug}`);
      const wishForm = page.locator("form", { has: page.getByPlaceholder(WISH_NAME_PLACEHOLDER) });
      await page.getByPlaceholder(WISH_NAME_PLACEHOLDER).fill(wishName, { force: true });
      await page.getByPlaceholder(WISH_TEXT_PLACEHOLDER).fill(wishText, { force: true });
      await wishForm.evaluate((form) => (form as HTMLFormElement).requestSubmit());
      await expect(page.getByText(wishText, { exact: true })).toBeVisible();

      await loginAsUser(context, user.id);
      await page.goto(`/dashboard/${inv.id}/rsvp`);
      await expect(page.getByText(wishText, { exact: true })).toBeVisible();
      await page.getByRole("button", { name: `Xóa: ${wishName}` }).click();
      await page.getByRole("button", { name: "Xóa", exact: true }).click();
      await expect(page.getByText(wishText, { exact: true })).toHaveCount(0);
      expect(getDb().prepare("SELECT COUNT(*) AS n FROM Wish WHERE invitationId = ?").get(inv.id)).toEqual({ n: 0 });
    } finally {
      cleanupUser(user.id);
    }
  });

  test("wedding album lightbox supports desktop zoom and two-finger pinch", async ({ page }) => {
    const user = createUser();
    try {
      const inv = createInvitation(user.id, { templateId: "song-hy-green" });
      const insertPhoto = getDb().prepare(
        "INSERT INTO GalleryPhoto (id, invitationId, url, sortOrder) VALUES (?, ?, ?, ?)",
      );
      insertPhoto.run(
        `gp-${Date.now()}-1`,
        inv.id,
        "/chungdoi/images/gallery/song-hy-red/photo-1.jpg",
        0,
      );
      insertPhoto.run(
        `gp-${Date.now()}-2`,
        inv.id,
        "/chungdoi/images/gallery/song-hy-red/photo-2.jpg",
        1,
      );
      const slug = publishInvitation(inv.id);

      await page.goto(`/thiep/${slug}`);
      await page.locator("[data-open-invitation-control]").evaluate((button) => {
        (button as HTMLButtonElement).click();
      });
      await expect(page.locator("[data-open-invitation-control]")).toHaveCount(0);
      const albumButton = page.getByRole("button", { name: "Wedding photo 1" });
      await albumButton.evaluate((button) => button.scrollIntoView({ block: "center" }));
      await albumButton.click();

      const lightbox = page.getByTestId("wedding-lightbox");
      const image = lightbox.getByTestId("wedding-lightbox-image");
      const track = lightbox.getByTestId("wedding-lightbox-track");
      await expect(lightbox).toBeVisible();
      await expect(image).toHaveAttribute("data-zoom-scale", "1.00");

      await lightbox.getByTestId("wedding-lightbox-zoom-in").click();
      await expect(image).toHaveAttribute("data-zoom-scale", "1.50");
      await lightbox.getByTestId("wedding-lightbox-zoom-out").click();
      await expect(image).toHaveAttribute("data-zoom-scale", "1.00");

      await track.dispatchEvent("wheel", {
        clientX: 640,
        clientY: 360,
        deltaY: -100,
      });
      await expect(image).toHaveAttribute("data-zoom-scale", "1.18");
      await lightbox.getByTestId("wedding-lightbox-zoom-reset").click();
      await expect(image).toHaveAttribute("data-zoom-scale", "1.00");

      await track.evaluate((element) => {
        const pointer = (type: string, pointerId: number, x: number, y: number) => {
          element.dispatchEvent(new PointerEvent(type, {
            bubbles: true,
            cancelable: true,
            clientX: x,
            clientY: y,
            pointerId,
            pointerType: "touch",
          }));
        };
        pointer("pointerdown", 11, 140, 360);
        pointer("pointerdown", 12, 240, 360);
        pointer("pointermove", 11, 100, 360);
        pointer("pointermove", 12, 280, 360);
        pointer("pointerup", 11, 100, 360);
        pointer("pointerup", 12, 280, 360);
      });
      await expect.poll(async () => Number(await image.getAttribute("data-zoom-scale"))).toBeGreaterThan(1.5);

      await page.keyboard.press("0");
      await expect(image).toHaveAttribute("data-zoom-scale", "1.00");
      await page.keyboard.press("Escape");
      await expect(lightbox).toHaveCount(0);
    } finally {
      cleanupUser(user.id);
    }
  });

  test("six guest photos render as four previews with +2, open in a downloadable lightbox, and can be moderated", async ({ page, context }) => {
    const user = createUser();
    try {
      const inv = createInvitation(user.id);
      const slug = publishInvitation(inv.id);
      const fileNames = Array.from(
        { length: 6 },
        (_, index) => `party-${Date.now()}-${index + 1}.${index === 0 ? "heic" : "png"}`,
      );
      const heic = await readFile(path.join(process.cwd(), "tests", "fixtures", "sample.heic"));
      const png = await sharp({
        create: { width: 8, height: 8, channels: 3, background: { r: 210, g: 80, b: 90 } },
      }).png().toBuffer();

      await page.goto(`/thiep/${slug}`);
      await page.locator("[data-open-invitation-control]").evaluate((button) => {
        (button as HTMLButtonElement).click();
      });
      await page.getByRole("button", { name: "Khoảnh khắc" }).click();
      await page.getByLabel("Tên của bạn *").fill("Khách chụp ảnh");
      await page.locator('input[type="file"][name="files"]').setInputFiles(
        fileNames.map((name, index) => (
          index === 0
            ? { name, mimeType: "image/heic", buffer: heic }
            : { name, mimeType: "image/png", buffer: png }
        )),
      );
      await page.getByRole("button", { name: "Đóng góp khoảnh khắc" }).click();

      await expect(page.getByText("Đã chia sẻ thành công. Cảm ơn bạn!")).toBeVisible();
      await expect(page.getByAltText(fileNames[0], { exact: true })).toBeVisible();
      await page.getByRole("button", { name: "Đóng", exact: true }).click();

      const moments = page.getByTestId("guest-moments-section");
      await expect(moments).toBeVisible();
      const previews = moments.locator("[data-guest-moment-index]");
      await expect(previews).toHaveCount(4);
      await expect(moments.getByTestId("guest-moments-extra")).toHaveText("+2");

      await previews.nth(3).click();
      const lightbox = page.getByTestId("guest-moments-lightbox");
      await expect(lightbox).toBeVisible();
      await expect(lightbox.getByTestId("guest-moments-download")).toHaveAttribute("href", /\?download=1$/);
      await expect(lightbox.getByText("4 / 6", { exact: true })).toBeVisible();

      const track = lightbox.getByTestId("guest-moments-track");
      const image = lightbox.getByTestId("guest-moments-image");
      await expect(track.locator("img")).toHaveCount(6);
      await expect(track).toHaveCSS("transition-property", "transform");
      await expect(track).toHaveCSS("transition-duration", "0.32s");
      await expect(track).toHaveAttribute("style", /translate3d\(calc\(-300% \+ 0px\)/);
      await expect(image).toHaveAttribute("data-zoom-scale", "1.00");

      await lightbox.getByTestId("guest-moments-zoom-in").click();
      await expect(image).toHaveAttribute("data-zoom-scale", "1.50");
      await lightbox.getByTestId("guest-moments-zoom-out").click();
      await expect(image).toHaveAttribute("data-zoom-scale", "1.00");
      await lightbox.getByTestId("guest-moments-zoom-in").click();
      await lightbox.getByTestId("guest-moments-zoom-reset").click();
      await expect(image).toHaveAttribute("data-zoom-scale", "1.00");

      await track.evaluate((element) => {
        const pointer = (type: string, pointerId: number, x: number, y: number) => {
          element.dispatchEvent(new PointerEvent(type, {
            bubbles: true,
            cancelable: true,
            clientX: x,
            clientY: y,
            pointerId,
            pointerType: "touch",
          }));
        };
        pointer("pointerdown", 21, 140, 360);
        pointer("pointerdown", 22, 240, 360);
        pointer("pointermove", 21, 100, 360);
        pointer("pointermove", 22, 280, 360);
        pointer("pointerup", 21, 100, 360);
        pointer("pointerup", 22, 280, 360);
      });
      await expect.poll(async () => Number(await image.getAttribute("data-zoom-scale"))).toBeGreaterThan(1.5);
      await expect(lightbox.getByText("4 / 6", { exact: true })).toBeVisible();
      await lightbox.getByTestId("guest-moments-zoom-reset").click();
      await expect(image).toHaveAttribute("data-zoom-scale", "1.00");

      const readTrackX = () => track.evaluate((element) => {
        const transform = getComputedStyle(element).transform;
        const values = transform
          .slice(transform.indexOf("(") + 1, -1)
          .split(",")
          .map(Number);
        return transform.startsWith("matrix3d") ? values[12] : values[4];
      });
      const startX = await readTrackX();
      const trackWidth = await track.evaluate((element) => element.clientWidth);
      const targetX = startX - trackWidth;
      await lightbox.getByRole("button", { name: "Khoảnh khắc tiếp theo" }).click();
      await expect.poll(async () => {
        const currentX = await readTrackX();
        return currentX < startX && currentX > targetX;
      }, {
        intervals: [16, 16, 16, 16, 16, 16, 16, 16],
        timeout: 240,
      }).toBe(true);
      await page.waitForTimeout(360);
      const endX = await readTrackX();

      expect(endX).toBeCloseTo(targetX, 0);
      await expect(lightbox.getByText("5 / 6", { exact: true })).toBeVisible();
      await expect(track).toHaveAttribute("style", /translate3d\(calc\(-400% \+ 0px\)/);

      const row = getDb().prepare(
        "SELECT id FROM GuestMedia WHERE invitationId = ? AND originalName = ?",
      ).get(inv.id, fileNames[0]) as { id: string };
      const download = await page.request.get(`/api/invitations/${slug}/contributions/${row.id}/file?download=1`);
      expect(download.ok()).toBeTruthy();
      expect(download.headers()["content-disposition"]).toContain("attachment");

      await loginAsUser(context, user.id);
      await page.goto(`/dashboard/${inv.id}/rsvp`);
      await page.getByRole("button", { name: `Xóa: ${fileNames[0]}` }).click();
      await page.getByRole("button", { name: "Xóa", exact: true }).click();
      await expect.poll(() => getDb().prepare(
        "SELECT COUNT(*) AS n FROM GuestMedia WHERE invitationId = ?",
      ).get(inv.id)).toEqual({ n: 5 });
    } finally {
      cleanupUser(user.id);
    }
  });

  test("guest-token link (?g=) displays the intended guest on the envelope", async ({ page }) => {
    const user = createUser();
    try {
      const inv = createInvitation(user.id);
      const slug = publishInvitation(inv.id, {
        brideFullName: "Đỗ Thị Mai",
        groomFullName: "Vũ Văn Cường",
      });
      const guest = createGuest(inv.id, "Gia đình anh Hưng");

      const res = await page.goto(`/thiep/${slug}?g=${guest.token}`);
      expect(res?.status()).toBe(200);
      // Envelope3D snapshots this off-screen DOM node into the visible WebGL texture.
      await expect(page.getByText("Gia đình anh Hưng", { exact: true })).toHaveCount(1);
      await expect(page.getByText("Gia đình Anh Mạnh", { exact: true })).toHaveCount(0);
    } finally {
      cleanupUser(user.id);
    }
  });

  test("public link without a guest token uses a generic recipient", async ({ page }) => {
    const user = createUser();
    try {
      const inv = createInvitation(user.id);
      const slug = publishInvitation(inv.id);

      await page.goto(`/thiep/${slug}`);

      await expect(page.getByText("Quý khách", { exact: true })).toHaveCount(1);
      await expect(page.getByText("Gia đình Anh Mạnh", { exact: true })).toHaveCount(0);
    } finally {
      cleanupUser(user.id);
    }
  });

  test("guest can submit RSVP with an invitation-specific question", async ({ page }) => {
    const user = createUser();
    try {
      const inv = createInvitation(user.id);
      const slug = publishInvitation(inv.id);
      const guest = createGuest(inv.id, "Gia đình chị Thu");
      const questionId = `rq${Date.now()}`;
      const now = new Date().toISOString().replace("Z", "+00:00");
      getDb().prepare(
        `INSERT INTO RsvpQuestion (id, invitationId, label, type, required, sortOrder, createdAt, updatedAt)
         VALUES (?, ?, ?, 'boolean', 1, 0, ?, ?)`,
      ).run(questionId, inv.id, "Bạn có cần ghế trẻ em không?", now, now);

      await page.goto(`/thiep/${slug}?g=${guest.token}`);
      await page.locator("[data-open-invitation-control]").evaluate((button) => {
        (button as HTMLButtonElement).click();
      });
      await page.getByRole("button", { name: "Xác nhận tham dự" }).click();
      await page.getByRole("radio", { name: "Có", exact: true }).check();
      await page.getByRole("button", { name: "Gửi xác nhận" }).click();

      await expect(page.getByText("Cảm ơn bạn đã xác nhận!")).toBeVisible();
      await expect.poll(() => {
        return getDb().prepare(
          `SELECT COUNT(*) AS n FROM RsvpAnswer WHERE questionId = ? AND value = 'yes'`,
        ).get(questionId) as { n: number };
      }).toEqual({ n: 1 });
    } finally {
      cleanupUser(user.id);
    }
  });
});

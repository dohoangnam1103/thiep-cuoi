import { test, expect } from "@playwright/test";

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
// NOTE (dead code): src/app/thiep/[slug]/Interactions.tsx exports an RsvpForm,
// but page.tsx never imports/renders it and ChungDoiDemo only consumes the
// wishAction (useWishFormBinding). There is no RSVP <form> on the rendered page,
// so an end-to-end RSVP-submit test through the UI is not possible; submitRsvp
// is a server action, not an HTTP endpoint. Covered indirectly only.

// Wish form copy is verbatim from SongHyWishForm in chungdoi-demo.tsx (line ~1614).
const WISH_NAME_PLACEHOLDER = "Nhập tên của bạn*";
const WISH_TEXT_PLACEHOLDER = "Nhập lời chúc của bạn*";
const WISH_SUBMIT = "GỬI LỜI CHÚC";

test.describe("published invitation /thiep/[slug]", () => {
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

  test("guest-token link (?g=) still renders the published page", async ({ page }) => {
    const user = createUser();
    try {
      const inv = createInvitation(user.id);
      const slug = publishInvitation(inv.id, {
        brideFullName: "Đỗ Thị Mai",
        groomFullName: "Vũ Văn Cường",
      });
      const guest = createGuest(inv.id, "Ông Bà Nội");

      // page.tsx resolves the guest via searchParams `g`; a valid token for this
      // invitation must not break rendering (guest prefill only feeds the unused
      // RsvpForm, so there is no visible guest UI on this template).
      const res = await page.goto(`/thiep/${slug}?g=${guest.token}`);
      expect(res?.status()).toBe(200);
      await expect(page.getByText("Vũ Văn Cường")).toBeVisible();
    } finally {
      cleanupUser(user.id);
    }
  });
});

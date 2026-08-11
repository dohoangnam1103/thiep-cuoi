import { randomUUID } from "node:crypto";
import { readFile, unlink } from "node:fs/promises";
import path from "node:path";

import { devices, test, expect } from "@playwright/test";

import { loginAsUser } from "./helpers/auth";
import { getDb, prismaNow } from "./helpers/db";
import { createUser, createInvitation, cleanupUser } from "./helpers/fixtures";

const EDITOR_UPLOAD_DIR = path.join(process.cwd(), "tests", "e2e", ".data", "editor-uploads");
const VALID_PNG_PATH = path.join(process.cwd(), "public", "chungdoi", "icon.png");
const IPHONE_13 = devices["iPhone 13"];
const MOBILE_EDITOR_DEVICE = {
  userAgent: IPHONE_13.userAgent,
  viewport: IPHONE_13.viewport,
  deviceScaleFactor: IPHONE_13.deviceScaleFactor,
  isMobile: IPHONE_13.isMobile,
  hasTouch: IPHONE_13.hasTouch,
};

// Track every user a test creates so afterEach can tear them down (FK cascade
// removes their invitations + content rows).
const createdUserIds: string[] = [];

function newUser() {
  const user = createUser();
  createdUserIds.push(user.id);
  return user;
}

/** Read a single content column straight from the isolated test.db. */
function readContent(invitationId: string, column: string): string | null {
  const row = getDb()
    .prepare(`SELECT "${column}" AS value FROM InvitationContent WHERE invitationId = ?`)
    .get(invitationId) as { value: string | null } | undefined;
  return row?.value ?? null;
}

/** Seed content columns directly (used to assert the editor hydrates from DB). */
function setContent(invitationId: string, values: Record<string, string>): void {
  const cols = Object.keys(values);
  if (!cols.length) return;
  const setSql = cols.map((c) => `"${c}" = ?`).join(", ");
  getDb()
    .prepare(`UPDATE InvitationContent SET ${setSql} WHERE invitationId = ?`)
    .run(...cols.map((c) => values[c]), invitationId);
}

test.describe("invitation editor", () => {
  test.afterEach(() => {
    while (createdUserIds.length) {
      const id = createdUserIds.pop();
      if (id) cleanupUser(id);
    }
  });

  test("owner opens editor and sees the content fields", async ({ page, context }) => {
    const user = newUser();
    const inv = createInvitation(user.id);
    await loginAsUser(context, user.id);

    const res = await page.goto(`/editor/${inv.id}`);
    expect(res?.ok()).toBeTruthy();

    await expect(page.getByRole("heading", { name: "Chỉnh sửa thiệp" })).toBeVisible();
    await expect(page.locator("#brideFullName")).toBeVisible();
    await expect(page.locator("#groomFullName")).toBeVisible();
    await expect(page.getByRole("button", { name: "Lưu bản nháp" })).toBeVisible();
  });

  test("bank combobox searches without accents and submits the selected bank", async ({ page, context }) => {
    const user = newUser();
    const inv = createInvitation(user.id);
    await loginAsUser(context, user.id);

    await page.goto(`/editor/${inv.id}`);
    await page.getByRole("button", { name: "Thông tin chuyển khoản" }).click();

    const bankTrigger = page.getByRole("combobox", { name: "Ngân hàng chú rể" });
    await bankTrigger.click();
    await bankTrigger.fill("ngoai thuong");
    await expect(page.getByRole("option", { name: /Vietcombank/ })).toBeVisible();
    await page.getByRole("option", { name: /Vietcombank/ }).click();

    await expect(page.getByTestId("bank-select-groomBankName")).toContainText("Vietcombank");
    await expect(page.locator('input[name="groomBankName"]')).toHaveValue("Vietcombank");
  });

  test("bank combobox opens without an empty gap above the visible options", async ({ page, context }) => {
    const user = newUser();
    const inv = createInvitation(user.id);
    await loginAsUser(context, user.id);

    await page.goto(`/editor/${inv.id}`);
    await page.getByRole("button", { name: "Thông tin chuyển khoản" }).click();
    await page.getByRole("combobox", { name: "Ngân hàng chú rể" }).click();

    const list = page.getByRole("listbox");
    await expect(list).toBeVisible();
    const gap = await list.evaluate((element) => {
      const listRect = element.getBoundingClientRect();
      const visibleItems = [...element.querySelectorAll<HTMLElement>('[role="option"]')]
        .map((item) => item.getBoundingClientRect())
        .filter((rect) => rect.bottom > listRect.top && rect.top < listRect.bottom);
      return Math.min(...visibleItems.map((rect) => Math.max(0, rect.top - listRect.top)));
    });

    expect(gap).toBeLessThan(24);
  });

  test("opening the bank combobox does not scroll the editor page", async ({ page, context }) => {
    const user = newUser();
    const inv = createInvitation(user.id);
    await loginAsUser(context, user.id);

    await page.goto(`/editor/${inv.id}`);
    await page.getByRole("button", { name: "Thông tin chuyển khoản" }).click();
    const bankTrigger = page.getByRole("combobox", { name: "Ngân hàng chú rể" });
    await bankTrigger.scrollIntoViewIfNeeded();
    const scrollBeforeOpen = await page.evaluate(() => window.scrollY);

    await bankTrigger.click();
    await expect(page.getByRole("listbox")).toBeVisible();
    await expect
      .poll(async () => Math.abs((await page.evaluate(() => window.scrollY)) - scrollBeforeOpen))
      .toBeLessThan(4);
  });

  test("template picker shows every completed template and scrolls previews on hover", async ({ page, context }) => {
    const user = newUser();
    const inv = createInvitation(user.id);
    await loginAsUser(context, user.id);

    await page.goto(`/editor/${inv.id}`);
    await page.getByRole("button", { name: "Mẫu thiệp" }).click();

    const picker = page.getByTestId("editor-template-picker");
    const cards = picker.locator("button[data-template-id]");
    await expect(cards).toHaveCount(71);

    const firstCard = cards.first();
    const preview = firstCard.locator("img");
    await expect(preview).toHaveCSS("object-position", "50% 0%");

    await firstCard.hover();
    await expect
      .poll(() => preview.evaluate((image) => getComputedStyle(image).objectPosition))
      .not.toBe("50% 0%");
  });

  test("zodiac selectors are template-gated and drive the ordered preview artwork", async ({
    page,
    context,
  }) => {
    const user = newUser();
    const inv = createInvitation(user.id);
    await loginAsUser(context, user.id);

    await page.goto(`/editor/${inv.id}`);
    await expect(page.locator("#brideZodiac")).toHaveCount(0);
    await expect(page.locator("#groomZodiac")).toHaveCount(0);

    await page.getByRole("button", { name: "Mẫu thiệp" }).click();
    const picker = page.getByTestId("editor-template-picker");
    await picker.locator('button[data-template-id="thap-nhi-chi-do"]').click();
    await expect(page.locator("#primaryColor")).toHaveValue("#d4a24a");

    const brideZodiac = page.locator("#brideZodiac");
    const groomZodiac = page.locator("#groomZodiac");
    await expect(brideZodiac).toBeVisible();
    await expect(groomZodiac).toBeVisible();
    await expect(brideZodiac.locator("option")).toHaveCount(13);
    await expect(groomZodiac.locator("option")).toHaveCount(13);
    await brideZodiac.selectOption("meo");
    await groomZodiac.selectOption("rong");
    await page.getByRole("button", { name: "Nhà trai trước" }).click();
    await page.getByRole("button", { name: "Màu chủ đạo" }).click();
    await page.locator("#primaryColor").fill("#0f766e");

    await page.locator("#editor-form").evaluate((form: HTMLFormElement) => {
      form.requestSubmit();
    });
    await expect(page.getByText("Đã lưu bản nháp")).toBeVisible();
    await expect.poll(() => readContent(inv.id, "brideZodiac")).toBe("meo");
    await expect.poll(() => readContent(inv.id, "groomZodiac")).toBe("rong");
    await expect.poll(() => readContent(inv.id, "primaryColor")).toBe("#0f766e");

    await page.reload();
    await expect(page.locator("#brideZodiac")).toHaveValue("meo");
    await expect(page.locator("#groomZodiac")).toHaveValue("rong");

    await page.getByRole("button", { name: "Xem trước", exact: true }).click();
    const renderer = page.locator('[data-template-renderer="thap-nhi-chi-do"]');
    await expect(renderer).toBeAttached({ timeout: 30_000 });
    const artwork = renderer.locator("[data-zodiac-artwork]");
    await expect(artwork).toHaveCount(4);
    await expect(artwork.first()).toHaveCSS("background-color", "rgb(15, 118, 110)");
    await expect
      .poll(() => artwork.evaluateAll((nodes) => (
        nodes.map((node) => node.getAttribute("data-zodiac-artwork"))
      )))
      .toEqual([
        "/chungdoi/images/themes/_decor/thap-nhi-chi-do/zodiac-rong-line.webp",
        "/chungdoi/images/themes/_decor/thap-nhi-chi-do/zodiac-meo-line.webp",
        "/chungdoi/images/themes/_decor/thap-nhi-chi-do/zodiac-rong.webp",
        "/chungdoi/images/themes/_decor/thap-nhi-chi-do/zodiac-meo.webp",
      ]);

    await page.getByRole("button", { name: "Chỉnh sửa", exact: true }).click();
    await page.getByRole("button", { name: "Mẫu thiệp" }).click();
    await picker.locator('button[data-template-id="song-hy-red"]').click();
    await expect(page.locator("#brideZodiac")).toHaveCount(0);
    await expect(page.locator("#groomZodiac")).toHaveCount(0);
  });

  test("music search accepts Vietnamese composition without triggering editor autosave", async ({
    page,
    context,
  }) => {
    const user = newUser();
    const inv = createInvitation(user.id);
    const trackId = `track-${randomUUID()}`;
    const query = "NGÀY CHUNG ĐÔI";
    getDb()
      .prepare(
        `INSERT INTO Track (id, title, artist, duration, url, tags, status, market, addedAt)
         VALUES (?, ?, ?, ?, ?, ?, 'ready', 'vn', ?)`,
      )
      .run(
        trackId,
        `${query} - Bản kiểm thử`,
        "Nghệ sĩ Việt",
        180,
        `https://cdn.example.com/${trackId}.mp3`,
        "[]",
        prismaNow(),
      );
    await loginAsUser(context, user.id);
    try {
      await page.goto(`/editor/${inv.id}`);
      await page.getByRole("button", { name: "Font & Nhạc" }).click();
      await page.getByRole("button", { name: "Chọn nhạc" }).click();

      const search = page.getByPlaceholder("Tìm theo tên bài hát hoặc nghệ sĩ...");
      await search.dispatchEvent("compositionstart", { data: "" });
      await search.fill(query);
      await expect(search).toHaveValue(query);

      const response = page.waitForResponse((candidate) => {
        const url = new URL(candidate.url());
        return url.pathname === "/api/tracks" && url.searchParams.get("q") === query;
      });
      await search.dispatchEvent("compositionend", { data: query });
      await response;

      await expect(page.getByText(/NGÀY CHUNG ĐÔI/).first()).toBeVisible();
      await expect(page.getByTestId("draft-status")).toContainText("Đã lưu vào hệ thống");
    } finally {
      getDb().prepare("DELETE FROM Track WHERE id = ?").run(trackId);
    }
  });

  test("editor hydrates existing content from the database", async ({ page, context }) => {
    const user = newUser();
    const inv = createInvitation(user.id);
    const brideName = `Cô Dâu ${randomUUID().slice(0, 8)}`;
    const groomName = `Chú Rể ${randomUUID().slice(0, 8)}`;
    setContent(inv.id, { brideFullName: brideName, groomFullName: groomName });
    await loginAsUser(context, user.id);

    await page.goto(`/editor/${inv.id}`);

    await expect(page.locator("#brideFullName")).toHaveValue(brideName);
    await expect(page.locator("#groomFullName")).toHaveValue(groomName);
  });

  test("homepage instant create carries bride and groom short names into the editor", async ({ page }) => {
    const brideName = `Cô Dâu ${randomUUID().slice(0, 8)}`;
    const groomName = `Chú Rể ${randomUUID().slice(0, 8)}`;

    await page.goto("/");
    await page.getByLabel("Chú rể").fill(groomName);
    await page.getByLabel("Cô dâu").fill(brideName);
    await page.getByRole("button", { name: "Tạo thiệp của tôi" }).click();
    await page.waitForURL("**/editor/**");

    await expect(page.locator("#brideShortName")).toHaveValue(brideName);
    await expect(page.locator("#groomShortName")).toHaveValue(groomName);
  });

  test("editing bride and groom names saves to the database", async ({ page, context }) => {
    const user = newUser();
    const inv = createInvitation(user.id);
    const brideName = `Quỳnh Anh ${randomUUID().slice(0, 8)}`;
    const groomName = `Gia Khánh ${randomUUID().slice(0, 8)}`;
    await loginAsUser(context, user.id);
    await page.goto(`/editor/${inv.id}`);

    await page.locator("#brideFullName").fill(brideName);
    await page.locator("#groomFullName").fill(groomName);
    await page.getByRole("button", { name: "Lưu bản nháp" }).click();

    // Server action completes before the success toast fires; DB is written by then.
    await expect(page.getByText("Đã lưu bản nháp")).toBeVisible();

    expect(readContent(inv.id, "brideFullName")).toBe(brideName);
    expect(readContent(inv.id, "groomFullName")).toBe(groomName);
  });

  test("publish validation keeps unsaved names when the wedding date is missing", async ({
    page,
    context,
  }) => {
    const user = newUser();
    const inv = createInvitation(user.id);
    const brideName = `Tên Cô Dâu ${randomUUID().slice(0, 8)}`;
    const groomName = `Tên Chú Rể ${randomUUID().slice(0, 8)}`;
    await loginAsUser(context, user.id);
    await page.goto(`/editor/${inv.id}`);

    await page.locator("#brideFullName").fill(brideName);
    await page.locator("#groomFullName").fill(groomName);
    await expect(page.locator("#date")).toHaveAttribute("required", "");

    // Bypass native required validation to exercise the server-error path too.
    await page.locator("#editor-form").evaluate((form: HTMLFormElement) => {
      form.noValidate = true;
    });
    await page.getByRole("button", { name: "Xuất bản thiệp" }).click();

    await expect(
      page.locator("#editor-form").getByText("Cần ngày cưới trước khi xuất bản"),
    ).toBeVisible();
    await expect(page.locator("#brideFullName")).toHaveValue(brideName);
    await expect(page.locator("#groomFullName")).toHaveValue(groomName);

    await page.reload();
    await expect(page.locator("#brideFullName")).toHaveValue(brideName);
    await expect(page.locator("#groomFullName")).toHaveValue(groomName);
  });

  test("an edit survives an immediate reload while the field is still focused", async ({ page, context }) => {
    const user = newUser();
    const inv = createInvitation(user.id);
    const brideName = `Reload ngay ${randomUUID().slice(0, 8)}`;
    const hydrationErrors: string[] = [];
    page.on("console", (message) => {
      const text = message.text();
      if (message.type() === "error" && (text.includes("React error #418") || text.includes("hydration"))) {
        hydrationErrors.push(text);
      }
    });
    await loginAsUser(context, user.id);
    await page.goto(`/editor/${inv.id}`);

    await page.locator("#brideFullName").fill(brideName);
    await page.reload();

    await expect(page.locator("#brideFullName")).toHaveValue(brideName);
    await expect(page.getByTestId("draft-status")).toContainText("Đã khôi phục nội dung chưa lưu");
    expect(hydrationErrors).toEqual([]);
  });

  test("local autosave waits until the user leaves the text field", async ({ page, context }) => {
    const user = newUser();
    const inv = createInvitation(user.id);
    const brideName = `Chỉ lưu khi blur ${randomUUID().slice(0, 8)}`;
    await loginAsUser(context, user.id);
    await page.goto(`/editor/${inv.id}`);

    const brideInput = page.locator("#brideFullName");
    await brideInput.fill(brideName);
    await page.waitForTimeout(500);
    await expect(page.getByTestId("draft-status")).toContainText("Đã lưu vào hệ thống");

    await brideInput.press("Tab");
    await expect(page.getByTestId("draft-status")).toContainText("Đã lưu tạm trên thiết bị");
  });

  test("a newly uploaded gallery image is rendered immediately", async ({ page, context }) => {
    const user = newUser();
    const inv = createInvitation(user.id);
    await loginAsUser(context, user.id);
    await page.goto(`/editor/${inv.id}`);

    let savedName: string | undefined;
    try {
      await page.locator('#editor-form input[type="file"][multiple]').setInputFiles({
        name: "wedding-photo.png",
        mimeType: "image/png",
        buffer: await readFile(VALID_PNG_PATH),
      });

      const storedUrl = page.locator('input[name="galleryUrl"]');
      await expect(storedUrl).toHaveCount(1);
      const url = await storedUrl.inputValue();
      expect(url).toMatch(/^\/uploads\/[\w-]+\.webp$/);
      savedName = url.replace("/uploads/", "");

      const image = page.locator('img[alt="Ảnh album"]');
      await expect(image).toBeVisible();
      await expect
        .poll(() => image.evaluate((element) => (element as HTMLImageElement).naturalWidth))
        .toBeGreaterThan(0);
    } finally {
      if (savedName) {
        await unlink(path.join(EDITOR_UPLOAD_DIR, savedName)).catch(() => {});
      }
    }
  });

  test("a short upload error toast fits its content and stays centered", async ({ page, context }) => {
    const user = newUser();
    const inv = createInvitation(user.id);
    await loginAsUser(context, user.id);
    await page.goto(`/editor/${inv.id}`);

    await page.locator('#editor-form input[type="file"][multiple]').setInputFiles({
      name: "too-large.jpg",
      mimeType: "image/jpeg",
      buffer: Buffer.alloc(5 * 1024 * 1024 + 1),
    });

    const toast = page.locator("[data-sonner-toast]").filter({ hasText: "Ảnh vượt quá 5MB" });
    await expect(toast).toBeVisible();

    const bounds = await toast.boundingBox();
    expect(bounds).not.toBeNull();
    expect(bounds!.width).toBeLessThan(260);
    expect(Math.abs(bounds!.x + bounds!.width / 2 - (await page.evaluate(() => innerWidth)) / 2)).toBeLessThan(2);
  });

  test("a template-only change is restored after reload", async ({ page, context }) => {
    const user = newUser();
    const inv = createInvitation(user.id);
    await loginAsUser(context, user.id);
    await page.goto(`/editor/${inv.id}`);
    await page.getByRole("button", { name: "Mẫu thiệp" }).click();

    const target = page
      .getByTestId("editor-template-picker")
      .locator('button[data-template-id][aria-pressed="false"]')
      .first();
    const templateId = await target.getAttribute("data-template-id");
    expect(templateId).toBeTruthy();
    await target.click();
    await page.reload();
    await page.getByRole("button", { name: "Mẫu thiệp" }).click();

    await expect(
      page.getByTestId("editor-template-picker").locator(`button[data-template-id="${templateId}"]`),
    ).toHaveAttribute("aria-pressed", "true");
  });

  test("every successful save clears its matching local recovery snapshot", async ({
    page,
    context,
  }) => {
    const user = newUser();
    const inv = createInvitation(user.id);
    const firstName = `Lần một ${randomUUID().slice(0, 8)}`;
    const secondName = `Lần hai ${randomUUID().slice(0, 8)}`;
    const serverName = `Từ máy chủ ${randomUUID().slice(0, 8)}`;
    await loginAsUser(context, user.id);
    await page.goto(`/editor/${inv.id}`);

    for (const name of [firstName, secondName]) {
      const brideInput = page.locator("#brideFullName");
      await brideInput.fill(name);
      await brideInput.press("Tab");
      await expect(page.getByTestId("draft-status")).toContainText("Đã lưu tạm trên thiết bị");
      await page.getByRole("button", { name: "Lưu bản nháp" }).click();
      await expect.poll(() => readContent(inv.id, "brideFullName")).toBe(name);
      await expect(page.getByTestId("draft-status")).toContainText("Đã lưu vào hệ thống");
    }

    setContent(inv.id, { brideFullName: serverName });
    await page.reload();
    await expect(page.locator("#brideFullName")).toHaveValue(serverName);
  });

  test("editing the venue address saves to the database", async ({ page, context }) => {
    const user = newUser();
    const inv = createInvitation(user.id);
    const address = `Trung tâm tiệc cưới ${randomUUID().slice(0, 8)}`;
    await loginAsUser(context, user.id);
    await page.goto(`/editor/${inv.id}`);

    await page.locator("#address").fill(address);
    await page.getByRole("button", { name: "Lưu bản nháp" }).click();

    await expect(page.getByText("Đã lưu bản nháp")).toBeVisible();

    expect(readContent(inv.id, "address")).toBe(address);
  });

  test("saved edits survive a reload of the editor", async ({ page, context }) => {
    const user = newUser();
    const inv = createInvitation(user.id);
    const brideName = `Reload Bride ${randomUUID().slice(0, 8)}`;
    await loginAsUser(context, user.id);
    await page.goto(`/editor/${inv.id}`);

    await page.locator("#brideFullName").fill(brideName);
    await page.getByRole("button", { name: "Lưu bản nháp" }).click();
    await expect(page.getByText("Đã lưu bản nháp")).toBeVisible();

    await page.goto(`/editor/${inv.id}`);
    await expect(page.locator("#brideFullName")).toHaveValue(brideName);
  });

  test("preview route renders the saved invitation content", async ({ page, context }) => {
    const user = newUser();
    const inv = createInvitation(user.id);
    const brideName = `Preview Bride ${randomUUID().slice(0, 8)}`;
    const groomName = `Preview Groom ${randomUUID().slice(0, 8)}`;
    setContent(inv.id, {
      brideFullName: brideName,
      groomFullName: groomName,
      date: "2026-12-31",
    });
    await loginAsUser(context, user.id);

    const res = await page.goto(`/editor/${inv.id}/preview`);
    expect(res?.ok()).toBeTruthy();

    // The demo renders the full names in the ceremony section. Assert DOM
    // attachment rather than visibility (content may sit behind the envelope).
    await expect(page.getByText(brideName).first()).toBeAttached();
    await expect(page.getByText(groomName).first()).toBeAttached();
  });

  test("non-owner cannot open another user's editor (404)", async ({ page, context }) => {
    const owner = newUser();
    const other = newUser();
    const inv = createInvitation(owner.id);
    await loginAsUser(context, other.id);

    await page.goto(`/editor/${inv.id}`);
    await expect(page.getByRole("heading", { name: "404" })).toBeVisible();
  });

  test("non-owner cannot open another user's preview (404)", async ({ page, context }) => {
    const owner = newUser();
    const other = newUser();
    const inv = createInvitation(owner.id);
    await loginAsUser(context, other.id);

    await page.goto(`/editor/${inv.id}/preview`);
    await expect(page.getByRole("heading", { name: "404" })).toBeVisible();
  });

  test("unauthenticated visitor is redirected to login", async ({ page }) => {
    const user = newUser();
    const inv = createInvitation(user.id);

    await page.goto(`/editor/${inv.id}`);
    await page.waitForURL("**/login**");
    expect(page.url()).toContain("/login");
  });

  test("unauthenticated visitor cannot reach the preview route", async ({ page }) => {
    const user = newUser();
    const inv = createInvitation(user.id);

    await page.goto(`/editor/${inv.id}/preview`);
    await page.waitForURL("**/login**");
    expect(page.url()).toContain("/login");
  });

  test.describe("mobile editor layout", () => {
    test.use(MOBILE_EDITOR_DEVICE);

    test("never zooms form controls or creates horizontal document overflow", async ({
      page,
      context,
    }) => {
      const user = newUser();
      const inv = createInvitation(user.id, {
        templateId: "thap-nhi-chi-do",
        status: "published",
        paid: true,
        slug: `mobile-editor-${randomUUID().slice(0, 8)}`,
        publishedAt: new Date(),
      });
      setContent(inv.id, {
        brideFullName: "Nguyễn Quỳnh Anh",
        groomFullName: "Trần Gia Khánh",
        date: "2026-11-11",
        time: "18:00",
      });
      getDb()
        .prepare(
          `INSERT INTO ScheduleItem (id, invitationId, time, label, sortOrder)
           VALUES (?, ?, ?, ?, ?)`,
        )
        .run(`schedule-${randomUUID()}`, inv.id, "17:30", "Đón khách", 0);
      await loginAsUser(context, user.id);

      const assertNoHorizontalOverflow = async (state: string) => {
        const measurement = await page.evaluate(() => {
          const viewportWidth = document.documentElement.clientWidth;
          const scrollWidth = document.scrollingElement?.scrollWidth
            ?? document.documentElement.scrollWidth;
          const offenders = [...document.querySelectorAll<HTMLElement>("body *")]
            .map((element) => {
              const rect = element.getBoundingClientRect();
              return {
                tag: element.tagName.toLowerCase(),
                id: element.id,
                className: element.className.toString().slice(0, 180),
                left: Math.round(rect.left),
                right: Math.round(rect.right),
              };
            })
            .filter((item) => item.left < -1 || item.right > viewportWidth + 1)
            .slice(0, 12);
          return { viewportWidth, scrollWidth, offenders };
        });

        expect(
          measurement.scrollWidth,
          `${state}: ${JSON.stringify(measurement.offenders)}`,
        ).toBeLessThanOrEqual(measurement.viewportWidth + 1);
      };

      const assertControlsCannotTriggerIosZoom = async (state: string) => {
        const controlsUnder16px = await page
          .locator('input:not([type="hidden"]), textarea, select')
          .evaluateAll((controls) => controls.map((control) => {
            const element = control as HTMLInputElement;
            return {
              id: element.id,
              name: element.name,
              type: element.type,
              fontSize: Number.parseFloat(getComputedStyle(element).fontSize),
            };
          }).filter((control) => control.fontSize < 16));

        expect(controlsUnder16px, state).toEqual([]);
      };

      await page.goto(`/editor/${inv.id}`);
      await expect(page.locator("body")).toHaveClass(/editor-page/);
      await page.locator("#brideFullName").focus();
      await assertControlsCannotTriggerIosZoom("portrait editor controls");
      await assertNoHorizontalOverflow("portrait editor");
      expect(await page.evaluate(() => window.visualViewport?.scale ?? 1)).toBe(1);

      for (const width of [320, 360, 390, 412]) {
        await page.setViewportSize({ width, height: 844 });
        await assertNoHorizontalOverflow(`${width}px editor`);
      }

      await page.setViewportSize({ width: 844, height: 390 });
      await assertControlsCannotTriggerIosZoom("landscape editor controls");
      await assertNoHorizontalOverflow("landscape editor");

      await page.setViewportSize({ width: 320, height: 844 });
      await page.getByRole("button", { name: "Thông tin chuyển khoản" }).click();
      const bankCombobox = page.getByRole("combobox", { name: "Ngân hàng chú rể" });
      await bankCombobox.click();
      await expect(page.getByRole("listbox")).toBeVisible();
      await assertControlsCannotTriggerIosZoom("bank combobox");
      await assertNoHorizontalOverflow("bank combobox");
      await page.keyboard.press("Escape");

      await page.getByRole("button", { name: "Xem trước", exact: true }).click();
      await expect(page.locator('[data-template-renderer="thap-nhi-chi-do"]')).toBeAttached({
        timeout: 30_000,
      });
      await assertNoHorizontalOverflow("invitation preview");

      await page.getByRole("button", { name: "Chỉnh sửa", exact: true }).click();
      await page.getByRole("button", { name: "Chia sẻ", exact: true }).click();
      await expect(page.getByRole("dialog", { name: "Chia sẻ thiệp" })).toBeVisible();
      await assertControlsCannotTriggerIosZoom("share dialog");
      await assertNoHorizontalOverflow("share dialog");
    });
  });
});

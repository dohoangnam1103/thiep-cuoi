import { randomUUID } from "node:crypto";

import { test, expect } from "@playwright/test";

import { loginAsUser } from "./helpers/auth";
import { getDb, prismaNow } from "./helpers/db";
import { createUser, createInvitation, cleanupUser } from "./helpers/fixtures";

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
    await expect(cards).toHaveCount(39);

    const firstCard = cards.first();
    const preview = firstCard.locator("img");
    await expect(preview).toHaveCSS("object-position", "50% 0%");

    await firstCard.hover();
    await expect
      .poll(() => preview.evaluate((image) => getComputedStyle(image).objectPosition))
      .not.toBe("50% 0%");
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

  test("an edit survives an immediate reload before the debounce finishes", async ({ page, context }) => {
    const user = newUser();
    const inv = createInvitation(user.id);
    const brideName = `Reload ngay ${randomUUID().slice(0, 8)}`;
    await loginAsUser(context, user.id);
    await page.goto(`/editor/${inv.id}`);

    await page.locator("#brideFullName").fill(brideName);
    await page.reload();

    await expect(page.locator("#brideFullName")).toHaveValue(brideName);
    await expect(page.getByTestId("draft-status")).toContainText("Đã khôi phục nội dung chưa lưu");
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
      await page.locator("#brideFullName").fill(name);
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
});

import { randomUUID } from "node:crypto";

import { test, expect } from "@playwright/test";

import { loginAsUser } from "./helpers/auth";
import { getDb } from "./helpers/db";
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

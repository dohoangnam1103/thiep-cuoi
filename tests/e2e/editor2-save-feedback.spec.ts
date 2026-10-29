import { mkdir } from "node:fs/promises";
import { expect, test, type BrowserContext, type Page } from "@playwright/test";
import { loginAsUser } from "./helpers/auth";
import { cleanupUser, createInvitation, createUser, publishInvitation } from "./helpers/fixtures";
import { getDb } from "./helpers/db";

test.use({ actionTimeout: 15_000 });

const users: string[] = [];
const saveStatus = (page: Page) => page.locator(".e2-publish-actions .e2-save-state");
const toast = (page: Page) => page.locator("[data-sonner-toast]");

test.afterEach(() => { while (users.length) cleanupUser(users.pop()!); });

async function openPublished(page: Page, context: BrowserContext) {
  const user = createUser(); users.push(user.id);
  const invitation = createInvitation(user.id, { templateId: "song-hy-red" });
  publishInvitation(invitation.id, { brideFullName: "Nguyễn Mai", groomFullName: "Trần Nam", date: "2026-11-29" });
  await loginAsUser(context, user.id);
  await page.goto(`/editor2/${invitation.id}`);
  await expect(page.getByRole("button", { name: "Lưu", exact: true })).toBeVisible();
  await expect(saveStatus(page)).toHaveText("Đã lưu");
  return invitation.id;
}

async function editAddress(page: Page, message: string) {
  await page.getByRole("button", { name: "Nội dung", exact: true }).click();
  await page.getByRole("button", { name: "Địa điểm tổ chức", exact: true }).click();
  await page.getByLabel("Địa chỉ địa điểm", { exact: true }).fill(message);
  await page.getByRole("button", { name: "Xong", exact: true }).click();
  await expect(page.locator(".e2-dialog")).toHaveCount(0);
}

for (const width of [1440, 390]) test(`manual save shows loading then a confirmed success toast at ${width}px`, async ({ page, context }) => {
  await page.setViewportSize({ width, height: 900 });
  const id = await openPublished(page, context);
  let release!: () => void;
  const ready = new Promise<void>(resolve => { release = resolve; });
  let started = false;
  await page.route(`**/editor2/${id}`, async route => {
    if (route.request().method() === "POST") { started = true; await ready; }
    await route.continue();
  });
  try {
    await editAddress(page, "Trân trọng mời bạn chung vui ngày cưới");
    await page.getByRole("button", { name: "Lưu", exact: true }).click();
    await expect.poll(() => started).toBe(true);
    await expect(toast(page)).toHaveAttribute("data-type", "loading");
    await expect(toast(page)).toContainText("Đang lưu");
    await expect(page.getByRole("button", { name: /Đang lưu/ })).toBeDisabled();
    expect((getDb().prepare("SELECT address FROM InvitationContent WHERE invitationId = ?").get(id) as { address: string }).address)
      .not.toBe("Trân trọng mời bạn chung vui ngày cưới");
  } finally { release(); }
  await expect(toast(page)).toHaveAttribute("data-type", "success");
  await expect(toast(page)).toContainText("Đã lưu thiệp thành công.");
  await expect(saveStatus(page)).toHaveText("Đã lưu");
  expect(getDb().prepare("SELECT address FROM InvitationContent WHERE invitationId = ?").get(id))
    .toEqual({ address: "Trân trọng mời bạn chung vui ngày cưới" });
  await expect(toast(page)).toHaveCSS("opacity", "1");
  await expect(toast(page)).toHaveCSS("transform", "matrix(1, 0, 0, 1, 0, 0)");
  const bounds = (await toast(page).boundingBox())!;
  expect(bounds.y).toBeGreaterThanOrEqual(0);
  expect(bounds.x).toBeGreaterThanOrEqual(0);
  expect(bounds.x + bounds.width).toBeLessThanOrEqual(width);
  await mkdir("/tmp/editor2-evidence", { recursive: true });
  await page.screenshot({ path: `/tmp/editor2-evidence/save-success-${width}.png` });
  await page.reload();
  await expect(saveStatus(page)).toHaveText("Đã lưu");
});

test("autosave stays quiet on success and unchanged manual saves still acknowledge every click", async ({ page, context }) => {
  await openPublished(page, context);
  await editAddress(page, "Kính mời bạn tới dự tiệc cưới");
  await expect(saveStatus(page)).toHaveText("Đã lưu");
  await expect(toast(page)).toHaveCount(0);
  let writes = 0;
  page.on("request", request => { if (request.method() === "POST" && request.headers()["next-action"]) writes++; });
  for (let index = 0; index < 3; index++) {
    await page.getByRole("button", { name: "Lưu", exact: true }).click();
    await expect(toast(page)).toHaveAttribute("data-type", "success");
    await expect(toast(page)).toContainText("Đã lưu thiệp thành công.");
    await expect(toast(page)).toHaveCount(1);
  }
  expect(writes).toBe(0);
});

test("network save failure shows an error toast and retry confirms the persisted changes", async ({ page, context }) => {
  const id = await openPublished(page, context);
  await page.route(`**/editor2/${id}`, async route => {
    if (route.request().method() === "POST") await route.abort("failed");
    else await route.continue();
  });
  await editAddress(page, "Mời bạn tới dự lễ thành hôn");
  await page.getByRole("button", { name: "Lưu", exact: true }).click();
  await expect(toast(page)).toHaveAttribute("data-type", "error");
  await expect(toast(page)).toContainText("Không lưu được thiệp. Vui lòng thử lại.");
  await expect(saveStatus(page)).toHaveText("Chưa lưu được. Nội dung vẫn còn trong phiên chỉnh sửa này.");
  await expect(page.getByRole("button", { name: "Lưu", exact: true })).toBeEnabled();
  await page.unroute(`**/editor2/${id}`);
  await page.getByRole("button", { name: "Lưu", exact: true }).click();
  await expect(toast(page)).toHaveAttribute("data-type", "success");
  expect(getDb().prepare("SELECT address FROM InvitationContent WHERE invitationId = ?").get(id))
    .toEqual({ address: "Mời bạn tới dự lễ thành hôn" });
  await expect(toast(page)).toHaveCount(1);
});

test("server rejection during autosave is visible with the specific failure reason", async ({ page, context }) => {
  await openPublished(page, context);
  await context.clearCookies();
  await editAddress(page, "Lời mời chưa được lưu khi phiên hết hạn");
  await expect(toast(page)).toHaveAttribute("data-type", "error");
  await expect(toast(page)).toContainText("Không lưu được thiệp. Vui lòng thử lại.");
  await expect(toast(page)).toContainText("Không tìm thấy thiệp");
  await expect(saveStatus(page)).toHaveText("Chưa lưu được. Nội dung vẫn còn trong phiên chỉnh sửa này.");
});

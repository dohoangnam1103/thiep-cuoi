import { expect, test, type Page } from "@playwright/test";
import { loginAsAdmin, loginAsUser } from "./helpers/auth";
import { cleanupUser, createInvitation, createUser, seededAdminId } from "./helpers/fixtures";
import { getDb } from "./helpers/db";

const template = "minimalism-green";
function font(id: string) {
  return (getDb().prepare("SELECT fontFamily FROM InvitationContent WHERE invitationId = ?").get(id) as { fontFamily: string }).fontFamily;
}
async function setFont(page: Page, family: string) {
  await page.getByText("Font & Nhạc", { exact: true }).click();
  await page.getByRole("combobox", { name: "Font chữ", exact: true }).fill(family);
  await page.getByRole("option", { name: family, exact: true }).click();
  if (new URL(page.url()).pathname.startsWith("/admin/demos/")) {
    await page.getByRole("button", { name: "Lưu bản nháp", exact: true }).click();
  }
}
async function expectNames(page: Page, family: string) {
  const names = page.locator('[data-testid="minimalism-green-template"] [data-couple-name]');
  await expect(names).toHaveCount(4);
  for (const name of await names.all()) {
    const tag = await name.evaluate((element) => element.tagName);
    await expect(name).toHaveCSS("font-family", new RegExp(tag === "P" ? "Fz Aghita" : family));
  }
}

test("demo font renders publicly and new invitations take independent font snapshots", async ({ page, context }) => {
  test.setTimeout(90000);
  const db = getDb();
  const user = createUser();
  const demo = createInvitation(user.id, { templateId: template, isDemo: true });
  db.prepare("UPDATE InvitationContent SET groomShortName = ?, brideShortName = ?, groomFullName = ?, brideFullName = ?, date = ? WHERE invitationId = ?").run("Minh Khang", "Thùy Linh", "Nguyễn Minh Khang", "Trần Thùy Linh", "2027-12-12", demo.id);
  try {
    await loginAsAdmin(context, seededAdminId());
    await loginAsUser(context, user.id);
    await page.goto(`/admin/demos/${demo.id}`);
    await setFont(page, "Fz Aghita");
    await expect.poll(() => font(demo.id)).toBe("Fz Aghita");
    await page.getByRole("button", { name: "Xem trước", exact: true }).click();
    await expectNames(page, "Fz Aghita");
    await page.goto("/mau-thiep/minimalism-xanh/demo/capture");
    await expectNames(page, "Fz Aghita");

    await page.goto("/mau-thiep/minimalism-xanh/demo");
    await expect(page.locator("[data-envelope-card-content] > div > span").first()).toHaveCSS("font-family", /Fz Aghita/);
    await page.locator('form[data-ga-event="select_template"] button[type="submit"]').click();
    await expect(page).toHaveURL(/\/editor\/[^/]+$/);
    const id = new URL(page.url()).pathname.split("/").at(-1)!;
    expect(font(id)).toBe("Fz Aghita");
    await setFont(page, "Fz Qellia");
    await expect.poll(() => font(id)).toBe("Fz Qellia");
    expect(font(demo.id)).toBe("Fz Aghita");
    await page.getByRole("button", { name: "Xem trước", exact: true }).click();
    await expectNames(page, "Fz Qellia");

    await page.goto(`/admin/demos/${demo.id}`);
    await setFont(page, "Pattaya");
    await expect.poll(() => font(demo.id)).toBe("Pattaya");
    expect(font(id)).toBe("Fz Qellia");
    await page.goto(`/admin/users/${user.id}`);
    await page.getByRole("button", { name: "Tạo thiệp mới", exact: true }).click();
    await page.locator(`button[data-template-id="${template}"]`).click();
    await expect(page).toHaveURL(/\/admin\/invitations\/[^/]+\/edit$/);
    const adminCreatedId = new URL(page.url()).pathname.split("/").at(-2)!;
    expect(font(adminCreatedId)).toBe("Pattaya");
    expect(font(id)).toBe("Fz Qellia");
  } finally {
    db.prepare("DELETE FROM AdminAuditLog WHERE targetUserId = ?").run(user.id);
    cleanupUser(user.id);
  }
});

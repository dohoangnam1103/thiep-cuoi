import { randomUUID } from "node:crypto";

import { expect, test, type Page } from "@playwright/test";

import { getDb } from "./helpers/db";
import { cleanupUser, createInvitation, createUser } from "./helpers/fixtures";

const BRAND_LINK = 'a[href*="thiepmungonline.com"]';

async function openInvitation(page: Page) {
  const control = page.locator("[data-open-invitation-control]");
  await expect(control).toBeEnabled({ timeout: 45_000 });
  await control.evaluate((button: HTMLButtonElement) => button.click());
}

test("trial invitations explain the footer watermark; paid invitations hide it", async ({ page }) => {
  const user = createUser();
  const slug = `branding-${randomUUID().slice(0, 8)}`;
  const invitation = createInvitation(user.id, {
    templateId: "song-hy-red",
    status: "published",
    slug,
    publishedAt: new Date(),
  });
  try {
    await page.goto(`/thiep/${slug}`, { waitUntil: "domcontentloaded" });
    await openInvitation(page);

    const brand = page.locator(BRAND_LINK).first();
    await brand.scrollIntoViewIfNeeded();
    await expect(brand).toBeVisible();
    await brand.click();

    const dialog = page.getByRole("dialog");
    await expect(dialog.getByRole("heading", { name: "Dòng thiepmungonline.com" })).toBeVisible();
    await expect(dialog.getByText("Thiệp chưa thanh toán", { exact: true })).toBeVisible();
    expect(new URL(page.url()).pathname).toBe(`/thiep/${slug}`);
    await dialog.getByRole("button", { name: "Đã hiểu" }).last().click();
    await expect(dialog).toHaveCount(0);

    getDb().prepare("UPDATE Invitation SET paid = 1 WHERE id = ?").run(invitation.id);
    await page.reload({ waitUntil: "domcontentloaded" });
    await openInvitation(page);
    await expect(page.locator(BRAND_LINK).first()).toBeHidden();
  } finally {
    cleanupUser(user.id);
  }
});

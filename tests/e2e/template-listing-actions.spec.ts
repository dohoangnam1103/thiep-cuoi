import { expect, test } from "@playwright/test";

test("template cards expose only preview and demo actions", async ({ page }) => {
  await page.goto("/mau-thiep");

  const firstCard = page.locator("main article").first();
  await expect(firstCard.getByRole("button", { name: "CHỌN THIỆP" })).toBeVisible();
  await expect(firstCard.getByRole("link", { name: "XEM MẪU THIỆP" })).toBeVisible();
  await expect(firstCard.getByRole("link", { name: "Xem chi tiết" })).toHaveCount(0);
});

import { expect, test } from "@playwright/test";

test("Rạp Hỷ Sài Gòn renders translated copy and localized required validation", async ({ page }) => {
  await page.goto("/mau-thiep/rap-hy-sai-gon/demo?capture=1");

  const invitation = page.locator('[data-template-renderer="rap-hy-sai-gon"]');
  await expect(invitation).toContainText("và");
  await expect(invitation).not.toContainText("invitationTemplate.and");

  const nameInput = invitation.locator('input[name="name"]');
  await expect(nameInput).toHaveCount(1);
  await page.getByRole("button", { name: "Gửi lời chúc" }).click();
  await expect(invitation).toContainText("Vui lòng nhập tên của bạn.");
});

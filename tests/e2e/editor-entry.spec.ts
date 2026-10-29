import { expect, test } from "@playwright/test";

for (const width of [390, 1440]) {
  for (const entry of ["header", "hero"] as const) {
    test(`create invitation opens editor2 from ${entry} at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.goto("/");
      const link = entry === "header"
        ? page.getByRole("link", { name: "Tạo ngay", exact: true })
        : page.getByRole("link", { name: "TẠO THIỆP NGAY", exact: true });

      await expect(link).toHaveAttribute("href", "/editor2");
      await link.click();
      await expect(page).toHaveURL(/\/editor2$/);
      await expect(page.getByLabel("Họ tên cô dâu", { exact: true })).toBeVisible();
      await expect(page.getByLabel("Họ tên chú rể", { exact: true })).toBeVisible();
      await expect(page.getByLabel("Ngày cưới", { exact: true })).toBeVisible();
    });
  }
}

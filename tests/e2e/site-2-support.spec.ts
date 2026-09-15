import { test, expect } from "@playwright/test";

// Help center, legal pages and system states: search-first help, readable
// policies with site-2 facts only, and one recovery action per failure state.

test("help search finds a site 2 editor guide", async ({ page }) => {
  await page.goto("/huong-dan");
  await page.getByRole("searchbox").fill("xuất bản");
  await expect(page.getByRole("link", { name: /Xuất bản thiệp/ })).toBeVisible();
});

test("legal pages explain site 2 policies", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("link", { name: "Chính sách bảo mật" }).click();
  await expect(page).toHaveURL(/\/chinh-sach-bao-mat/);
  await expect(
    page.getByRole("heading", { level: 1, name: "Chính sách bảo mật" }),
  ).toBeVisible();

  await page.goto("/dieu-khoan-su-dung");
  await expect(
    page.getByRole("heading", { level: 1, name: "Điều khoản sử dụng" }),
  ).toBeVisible();

  await page.goto("/chinh-sach-hoan-tien");
  await expect(
    page.getByRole("heading", { level: 1, name: "Chính sách hoàn tiền" }),
  ).toBeVisible();
});

test("unknown route recovers to the catalog", async ({ page }) => {
  await page.goto("/khong-co-trang-nay");
  await expect(page.getByText("404")).toBeVisible();
  const recovery = page.getByRole("link", { name: "Về danh sách mẫu" });
  await recovery.focus();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\/mau-thiep/);
});

test("help search works without a mouse", async ({ page }) => {
  await page.goto("/huong-dan");
  const search = page.getByRole("searchbox");
  await search.focus();
  await search.pressSequentially("đăng ký");
  await expect(
    page.getByRole("link", { name: /Tạo thiệp đầu tiên/ }),
  ).toBeVisible();
});

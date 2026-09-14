import { test, expect } from "@playwright/test";

// Site-2 MVP acceptance (runs against the isolated site-2 server, never master).
// Covered: Signature-only listing, master-only URL rejection, and the full
// authenticated create → edit → publish → public view flow.

test("site 2 lists only Signature templates", async ({ page }) => {
  await page.goto("/mau-thiep");
  await expect(page.getByTestId("template-card")).toHaveCount(2);
  await expect(page.getByText("Mai Lan Trắng")).toBeVisible();
  await expect(page.getByText("Hoa Lụa Nâu")).toBeVisible();
});

test("site 2 rejects a master-only template URL", async ({ page }) => {
  const response = await page.goto("/mau-thiep/song-hy-red/demo");
  expect(response?.status()).toBe(404);
});

test("site 2 creates, edits, publishes and publicly renders an invitation", async ({
  page,
}) => {
  const email = `site2-${Date.now()}@example.com`;

  await page.goto("/dang-nhap?mode=register");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Mật khẩu").fill("matkhau123");
  await page.getByRole("button", { name: "Đăng ký" }).click();
  await expect(page).toHaveURL(/\/dashboard/);

  await page.getByLabel("Tạo thiệp mới").selectOption("jasmine-white");
  await page.getByRole("button", { name: "Tạo thiệp" }).click();
  await expect(page).toHaveURL(/\/editor\//);

  await page.getByLabel("Tên cô dâu").fill("Nguyễn Mai Lan");
  await page.getByLabel("Tên chú rể").fill("Trần Đức Minh");
  await page.getByRole("button", { name: "Lưu" }).click();
  await expect(page.getByText("Đã lưu thay đổi.")).toBeVisible();

  await page.getByRole("button", { name: "Xuất bản" }).click();
  await expect(page.getByText("Đã xuất bản.")).toBeVisible();

  const publicLink = page.getByText("/thiep/");
  await expect(publicLink).toBeVisible();
  await publicLink.click();
  await expect(page).toHaveURL(/\/thiep\//);
  await expect(page.getByText("Nguyễn Mai Lan").first()).toBeVisible();
  await expect(page.getByText("Trần Đức Minh").first()).toBeVisible();
});

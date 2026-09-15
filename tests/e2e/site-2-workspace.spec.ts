import { test, expect } from "@playwright/test";

// Dashboard acceptance: project-first hierarchy, real statuses and contextual
// actions for a fresh account and for a returning account with work in flight.

test("dashboard welcomes a fresh account toward the catalog", async ({
  page,
}) => {
  await page.goto("/dang-nhap?mode=register");
  await page.getByLabel("Email").fill(`site2-dash-${Date.now()}@example.com`);
  await page.getByLabel("Mật khẩu").fill("matkhau123");
  await page.getByRole("button", { name: "Đăng ký" }).click();
  await expect(page).toHaveURL(/\/dashboard/);

  await expect(
    page.getByRole("link", { name: "Xem mẫu thiệp" }),
  ).toHaveAttribute("href", "/mau-thiep");
});

test("dashboard surfaces draft and published projects with actions", async ({
  page,
}) => {
  await page.goto("/dang-nhap?mode=register");
  await page.getByLabel("Email").fill(`site2-proj-${Date.now()}@example.com`);
  await page.getByLabel("Mật khẩu").fill("matkhau123");
  await page.getByRole("button", { name: "Đăng ký" }).click();
  await expect(page).toHaveURL(/\/dashboard/);

  await page.getByLabel("Tạo thiệp mới").selectOption("jasmine-white");
  await page.getByRole("button", { name: "Tạo thiệp" }).click();
  await expect(page).toHaveURL(/\/editor\//);
  const editorUrl = page.url();
  await page.goto("/dashboard");

  const card = page.getByTestId("invitation-card").first();
  await expect(card.locator('[data-s2-status="draft"]')).toContainText(
    "Nháp",
  );
  await expect(
    card.getByRole("link", { name: "Mở editor" }),
  ).toHaveAttribute("href", new URL(editorUrl).pathname);

  await page.goto(editorUrl);
  await page.getByLabel("Tên cô dâu").fill("Nguyễn Mai Lan");
  await page.getByLabel("Tên chú rể").fill("Trần Đức Minh");
  await page.getByRole("button", { name: "Lưu" }).click();
  await expect(page.getByText("Đã lưu thay đổi.")).toBeVisible();
  await page.getByRole("button", { name: "Xuất bản" }).click();
  await expect(page.getByText("Đã xuất bản.")).toBeVisible();

  await page.goto("/dashboard");
  const published = page.getByTestId("invitation-card").first();
  await expect(published.locator('[data-s2-status="published"]')).toContainText(
    "Đã xuất bản",
  );
  await expect(published.getByText("Nguyễn Mai Lan")).toBeVisible();
  const publicLink = published.getByRole("link", {
    name: "Xem trang công khai",
  });
  await expect(publicLink).toHaveAttribute("href", /\/thiep\//);
  await publicLink.click();
  await expect(page).toHaveURL(/\/thiep\//);
});

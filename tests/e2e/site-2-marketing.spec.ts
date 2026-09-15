import { test, expect } from "@playwright/test";

// Homepage acceptance: one clear browse intent, real template imagery, real
// numbers only, and a guided path from hero to register.

test("homepage presents one clear browse intent and real template imagery", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Một lời mời đáng nhớ.",
  );
  await expect(
    page.getByRole("link", { name: "Xem mẫu thiệp" }),
  ).toHaveAttribute("href", "/mau-thiep");
  await expect.poll(() => page.locator("main img").count()).toBeGreaterThan(0);
  await expect(page.getByText(/110\+|99\.9%|50\.000/)).toHaveCount(0);
});

test("homepage guides visitors from hero to register", async ({ page }) => {
  await page.goto("/");
  await expect(
    page.getByRole("link", { name: "Tạo thiệp ngay" }),
  ).toHaveAttribute("href", "/dang-nhap?mode=register");
  await expect(
    page.getByRole("link", { name: "Bắt đầu miễn phí" }),
  ).toHaveAttribute("href", "/dang-nhap?mode=register");
});

test("catalog searches, empties and clears the filter", async ({ page }) => {
  await page.goto("/mau-thiep");
  const search = page.getByRole("searchbox");
  await search.fill("Mai Lan");
  await expect
    .poll(() => page.getByTestId("template-card").count())
    .toBeGreaterThan(0);

  await search.fill("zzz-khong-co-mau-nao");
  await expect(page.getByText("Không tìm thấy mẫu nào")).toBeVisible();
  const clear = page.getByRole("button", { name: "Xóa bộ lọc" });
  await expect(clear).toBeVisible();
  await clear.click();
  await expect(search).toHaveValue("");
  await expect
    .poll(() => page.getByTestId("template-card").count())
    .toBeGreaterThan(100);
});

test("catalog filter drawer works on mobile", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/mau-thiep");
  const trigger = page.getByRole("button", { name: "Bộ lọc" });
  await expect(trigger).toBeVisible();
  await trigger.click();
  const panel = page.getByTestId("catalog-filter-panel");
  await expect(panel).toBeVisible();
  await expect(
    panel.getByRole("button", { name: "Tất cả" }),
  ).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(panel).toHaveCount(0);
});

test("catalog card navigates straight to the template demo", async ({
  page,
}) => {
  await page.goto("/mau-thiep");
  await page.getByTestId("template-card").first().getByRole("link").first().click();
  await expect(page).toHaveURL(/\/mau-thiep\/.+\/demo/);
  await expect(page.locator('[data-open-btn="true"]')).toBeVisible();
});

test("pricing shows contact sales with no invented price", async ({
  page,
}) => {
  await page.goto("/bang-gia");
  await expect(page.getByText("Liên hệ")).toBeVisible();
  await expect(page.locator("main")).not.toContainText("₫");
  await expect(
    page.getByRole("link", { name: "Tạo thiệp ngay" }),
  ).toHaveAttribute("href", "/dang-nhap?mode=register");
});

test("pricing faq toggles with mouse and keyboard", async ({ page }) => {
  await page.goto("/bang-gia");
  const questions = page.locator("main").getByRole("button");
  await expect.poll(() => questions.count()).toBeGreaterThan(0);
  const first = questions.first();
  await expect(first).toHaveAttribute("aria-expanded", "true");
  await first.click();
  await expect(first).toHaveAttribute("aria-expanded", "false");
  const second = questions.nth(1);
  await second.focus();
  await page.keyboard.press("Enter");
  await expect(second).toHaveAttribute("aria-expanded", "true");
});

test("auth form keeps labels and returns to the intended page", async ({
  page,
}) => {
  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/dang-nhap\?next=/);
  await page
    .getByRole("link", { name: "Chưa có tài khoản? Đăng ký" })
    .click();
  await expect(page).toHaveURL(/mode=register/);

  await page.route("**/dang-nhap**", async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 800));
    await route.continue();
  });
  const email = `site2-redirect-${Date.now()}@example.com`;
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Mật khẩu").fill("matkhau123");
  await page.getByRole("button", { name: "Đăng ký" }).click();
  await expect(page.getByRole("button", { name: /Đang xử lý/ })).toBeDisabled();
  await expect(page).toHaveURL(/\/dashboard/);
});

test("auth page offers no third party login", async ({ page }) => {
  await page.goto("/dang-nhap");
  await expect(page.getByRole("button", { name: /google/i })).toHaveCount(0);
});

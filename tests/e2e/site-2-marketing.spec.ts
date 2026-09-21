import { test, expect } from "@playwright/test";

// Homepage acceptance: one clear browse intent, real template imagery, real
// numbers only, and a guided path from hero to templates.

test("homepage presents one clear browse intent and real template imagery", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    /Muôn vẻ lời mời/,
  );
  await expect(
    page.getByRole("link", { name: "Xem mẫu thiệp" }),
  ).toHaveAttribute("href", "/mau-thiep");
  await expect.poll(() => page.locator("main img").count()).toBeGreaterThan(0);
  await expect(page.getByText(/110\+|99\.9%|50\.000/)).toHaveCount(0);
});

test("homepage guides visitors from hero to templates first", async ({ page }) => {
  await page.goto("/");
  await expect(
    page.locator("main").getByRole("link", { name: "Tạo thiệp ngay", exact: true }),
  ).toHaveAttribute("href", "#bo-suu-tap");
  await expect(
    page.getByRole("link", { name: "Bắt đầu tạo thiệp" }),
  ).toHaveAttribute("href", "/mau-thiep");
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

test("pricing shows the fixed plan price from config", async ({
  page,
}) => {
  await page.goto("/bang-gia");
  await expect(page.getByText("99.000 ₫")).toBeVisible();
  await expect(
    page.locator("main").getByRole("link", { name: "Tạo thiệp ngay", exact: true }),
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

// Copy-only hero acceptance. Shared marketing navigation is unchanged.

test("home page renders copy-only hero and product information", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator(".s2-home-exhibition")).toHaveCount(0);
  // Live preview section
  await expect(page.getByRole("heading", { name: "Thử viết tên mình lên thiệp." })).toBeVisible();
  // Gallery section
  await expect(page.getByRole("heading", { name: "Tìm thấy thiệp của hai bạn." })).toBeVisible();
  // Steps section
  await expect(page.getByRole("heading", { name: "Từ lời thương đến lời mời." })).toBeVisible();
  // Story section
  await expect(page.getByRole("heading", { name: "Một lời mời. Đủ mọi điều cần biết." })).toBeVisible();
  // Finale CTA
  await expect(page.getByRole("heading", { name: "Một ngày đáng nhớ. Một lời mời xứng đáng." })).toBeVisible();
});

test("home gallery uses optimized image URLs", async ({ page }) => {
  await page.goto("/");
  const galleryImages = page.locator("[data-home-gallery] img");
  await expect.poll(() => galleryImages.count()).toBeGreaterThan(0);
  const firstSrc = await galleryImages.first().getAttribute("src");
  expect(firstSrc).toMatch(/\/home-exhibition\/.+-640\.webp$/);
});

test("shared navigation remains available alongside the new Home", async ({ page }) => {
  await page.goto("/");
  // Nav should have glass treatment
  await expect(page.locator(".s2-glass-nav").first()).toBeVisible();
  await expect(page.locator(".s2-home-preview")).toBeVisible();
});

test("live preview updates on typing", async ({ page }) => {
  await page.goto("/");
  const brideInput = page.getByLabel("Tên cô dâu");
  await brideInput.fill("Test Bride");
  // Preview card should show the typed name
  await expect(page.getByText("Test Bride")).toBeVisible();
});

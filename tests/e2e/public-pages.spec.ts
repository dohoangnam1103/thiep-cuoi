import { test, expect } from "@playwright/test";

// Public marketing pages are static-ish and require the `vi` locale prefix.
// Strings asserted below are taken verbatim from messages/vi.json and
// src/data/chungdoi-content.ts so selectors stay resilient to markup churn.

test.describe("public pages — navigation & content", () => {
  test("home (/vi) loads with hero heading", async ({ page }) => {
    const res = await page.goto("/vi");
    expect(res?.ok()).toBeTruthy();

    await expect(
      page.getByRole("heading", { name: "Tạo thiệp cưới online, miễn phí trong 10 phút" }),
    ).toBeVisible();

    // Site chrome should render the nav on desktop.
    await expect(page.getByRole("navigation")).toBeVisible();
  });

  test("popular templates can be dragged without opening a template", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");

    const carousel = page.getByTestId("template-carousel");
    await carousel.scrollIntoViewIfNeeded();
    const box = await carousel.boundingBox();
    expect(box).not.toBeNull();
    if (!box) return;

    const initialScroll = await carousel.evaluate((element) => element.scrollLeft);
    await page.mouse.move(box.x + box.width * 0.7, box.y + box.height * 0.5);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width * 0.35, box.y + box.height * 0.5, { steps: 8 });
    await page.mouse.up();

    const finalScroll = await carousel.evaluate((element) => element.scrollLeft);
    expect(finalScroll - initialScroll).toBeGreaterThan(200);
    await expect(carousel).toHaveAttribute("data-dragging", "false");
    expect(new URL(page.url()).pathname).toBe("/");
  });

  test("pricing (/vi/pricing) shows title and price", async ({ page }) => {
    const res = await page.goto("/vi/pricing");
    expect(res?.ok()).toBeTruthy();

    await expect(
      page.getByRole("heading", { name: "Giá đơn giản, không phí ẩn" }),
    ).toBeVisible();
    await expect(page.getByText("199.000đ")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Câu hỏi thường gặp" })).toBeVisible();
  });

  test("tools (/vi/tools) lists the wedding tools", async ({ page }) => {
    const res = await page.goto("/vi/tools");
    expect(res?.ok()).toBeTruthy();

    await expect(page.getByRole("heading", { name: "Công cụ cưới miễn phí" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Tạo ảnh Save the Date" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Tạo mã QR" })).toBeVisible();
  });

  test("help (/vi/help) shows title and popular section", async ({ page }) => {
    const res = await page.goto("/vi/help");
    expect(res?.ok()).toBeTruthy();

    await expect(page.getByRole("heading", { name: "Trung tâm trợ giúp" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Bài viết phổ biến" })).toBeVisible();
    await expect(page.getByPlaceholder("Tìm kiếm câu hỏi...")).toBeVisible();
  });
});

test.describe("public pages — policies", () => {
  test("privacy-policy (/vi/privacy-policy)", async ({ page }) => {
    const res = await page.goto("/vi/privacy-policy");
    expect(res?.ok()).toBeTruthy();

    await expect(page.getByRole("heading", { name: "Chính sách bảo mật" })).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Thông tin chúng tôi thu thập" }),
    ).toBeVisible();
  });

  test("terms-of-service (/vi/terms-of-service)", async ({ page }) => {
    const res = await page.goto("/vi/terms-of-service");
    expect(res?.ok()).toBeTruthy();

    await expect(page.getByRole("heading", { name: "Điều khoản sử dụng" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Chấp nhận điều khoản" })).toBeVisible();
  });

  test("refund-policy (/vi/refund-policy)", async ({ page }) => {
    const res = await page.goto("/vi/refund-policy");
    expect(res?.ok()).toBeTruthy();

    await expect(page.getByRole("heading", { name: "Chính sách hoàn tiền" })).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Trường hợp được hoàn tiền" }),
    ).toBeVisible();
  });
});

test.describe("public pages — blog", () => {
  test("blog list (/vi/blog) shows posts", async ({ page }) => {
    const res = await page.goto("/vi/blog");
    expect(res?.ok()).toBeTruthy();

    await expect(
      page.getByRole("heading", { name: "Kinh nghiệm và xu hướng thiệp cưới mới nhất" }),
    ).toBeVisible();

    // At least one known post link should be present.
    await expect(
      page.getByRole("link", { name: "Cách lập danh sách khách mời đám cưới Việt" }),
    ).toBeVisible();
  });

  test("clicking a blog post reaches its detail page", async ({ page }) => {
    await page.goto("/vi/blog");

    await page
      .getByRole("link", { name: "Cách lập danh sách khách mời đám cưới Việt" })
      .click();

    // Default-locale nav uses unprefixed localized URLs (no /vi).
    await page.waitForURL("**/blog/cach-lap-danh-sach-khach-moi-dam-cuoi");
    await expect(
      page.getByRole("heading", { name: "Cách lập danh sách khách mời đám cưới Việt" }),
    ).toBeVisible();
    // Back-to-blog link confirms detail chrome rendered.
    await expect(page.getByRole("link", { name: "← Quay lại Blog" })).toBeVisible();
  });

  test("blog detail direct load (/vi/blog/[slug])", async ({ page }) => {
    const res = await page.goto("/vi/blog/xu-huong-chu-de-dam-cuoi-2026");
    expect(res?.ok()).toBeTruthy();

    await expect(page.getByRole("heading", { name: "Bài viết liên quan" })).toBeVisible();
  });

  test("unknown blog slug returns 404", async ({ page }) => {
    const res = await page.goto("/vi/blog/khong-ton-tai-slug-xyz");
    expect(res?.status()).toBe(404);
  });
});

test.describe("public pages — cross-page nav", () => {
  test("header nav links move between pages", async ({ page }) => {
    await page.goto("/vi");

    await page.getByRole("navigation").getByRole("link", { name: "Bảng giá" }).click();
    await page.waitForURL("**/bang-gia");
    await expect(
      page.getByRole("heading", { name: "Giá đơn giản, không phí ẩn" }),
    ).toBeVisible();
  });
});

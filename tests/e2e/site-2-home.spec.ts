import { expect, test } from "@playwright/test";

test("copy-only hero keeps no art and gallery images load", async ({ page }, testInfo) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  await page.evaluate(() => document.fonts.ready);
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(page.locator(".s2-home-exhibition")).toHaveCount(0);
  await expect(page.locator(".s2-home-hero img")).toHaveCount(0);
  for (const y of [0, 200, 480, 0]) {
    await page.evaluate((top) => window.scrollTo({ top, behavior: "instant" }), y);
    expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1);
  }
  const galleryImages = page.locator("[data-home-gallery-card] img");
  await expect.poll(() => galleryImages.count()).toBeGreaterThan(0);
  for (const image of await galleryImages.all()) {
    await expect.poll(() => image.evaluate((el: HTMLImageElement) => el.complete && el.naturalWidth > 0)).toBe(true);
  }
  await expect(page.locator(".s2-home-hero").getByRole("link", { name: "Tạo thiệp ngay", exact: true })).toHaveAttribute("href", "#bo-suu-tap");
  await page.screenshot({ path: testInfo.outputPath("hero.png") });
  for (const section of [".s2-home-gallery", ".s2-home-preview", ".s2-home-rsvp", ".s2-home-details", ".s2-home-finale"]) {
    await page.locator(section).scrollIntoViewIfNeeded();
    await page.screenshot({ path: testInfo.outputPath(`${section.slice(1)}.png`) });
  }
  expect(errors).toEqual([]);
});

test("gallery feature, rail and controls reveal real demos without changing page width", async ({ page }, testInfo) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  const stage = page.locator("#home-gallery-stage");
  const gallery = page.locator(".s2-home-gallery");
  const feature = gallery.locator('[data-home-gallery-feature="true"]');
  await stage.scrollIntoViewIfNeeded();
  await page.screenshot({ path: testInfo.outputPath("gallery-initial.png") });
  await expect(feature).toHaveCount(1);
  await expect(gallery.locator('[data-home-gallery-thumb="true"]')).toHaveCount(3);
  const first = await feature.getAttribute("href");
  await page.getByRole("button", { name: "Xem các mẫu tiếp theo" }).click();
  await expect(feature).not.toHaveAttribute("href", first!);
  await expect(gallery.getByRole("heading", { level: 3 })).not.toBeEmpty();
  await page.getByRole("button", { name: "Xem các mẫu trước" }).click();
  await expect(feature).toHaveAttribute("href", first!);
  await gallery.locator('[data-home-gallery-thumb="true"]').first().click();
  await expect(feature).not.toHaveAttribute("href", first!);
  const railed = await feature.getAttribute("href");
  await stage.focus();
  await page.keyboard.press("ArrowRight");
  await expect(feature).not.toHaveAttribute("href", railed!);
  await page.keyboard.press("Home");
  await expect(feature).toHaveAttribute("href", first!);
  for (const image of await gallery.locator(".s2-home-gallery-image img, .s2-home-gallery-thumb-art img").all()) {
    await expect.poll(() => image.evaluate((el: HTMLImageElement) => el.complete && el.naturalWidth > 0)).toBe(true);
  }
  expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1);
  expect(errors).toEqual([]);
  await gallery.screenshot({ path: testInfo.outputPath("gallery-verified.png") });
});

test("gallery autoplay advances, holds on hover and resumes after", async ({ page }) => {
  await page.goto("/");
  const gallery = page.locator(".s2-home-gallery");
  const feature = gallery.locator('[data-home-gallery-feature="true"]');
  await gallery.scrollIntoViewIfNeeded();
  const first = await feature.getAttribute("href");
  await expect.poll(async () => feature.getAttribute("href"), { timeout: 15000 }).not.toBe(first);
  await gallery.hover();
  const held = await feature.getAttribute("href");
  await page.waitForTimeout(7000);
  await expect(feature).toHaveAttribute("href", held!);
  await page.mouse.move(5, 5);
  await expect.poll(async () => feature.getAttribute("href"), { timeout: 15000 }).not.toBe(held);
});

test("preview names and colors update; RSVP demonstration and FAQ are keyboard accessible", async ({ page }) => {
  await page.goto("/");
  await page.getByLabel("Tên cô dâu", { exact: true }).fill("Ngọc Ánh");
  await page.getByLabel("Tên chú rể", { exact: true }).fill("Hoàng Nam");
  const paper = page.getByLabel("Thiệp minh hoạ của bạn", { exact: true });
  await expect(paper).toContainText("Ngọc Ánh");
  await expect(paper).toContainText("Hoàng Nam");
  const before = await paper.evaluate((el) => getComputedStyle(el).backgroundColor);
  await page.getByRole("button", { name: "Đỏ son", exact: true }).click();
  await expect(page.getByRole("button", { name: "Đỏ son", exact: true })).toHaveAttribute("aria-pressed", "true");
  await expect.poll(() => paper.evaluate((el) => getComputedStyle(el).backgroundColor)).not.toBe(before);
  await page.getByLabel("Tên cô dâu", { exact: true }).fill(" ");
  await expect(paper).not.toContainText("Ngọc Ánh");
  await expect(paper).toContainText("…");
  const rsvp = page.getByRole("button", { name: "Thử xác nhận tham dự" });
  await rsvp.focus();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("status")).toContainText("2 người tham dự");
  await page.getByRole("button", { name: "Đã xác nhận", exact: true }).click();
  await expect(page.getByRole("status")).toContainText("Đang chờ phản hồi");
  const summary = page.locator(".s2-home-faq summary").first();
  await summary.focus();
  await page.keyboard.press("Enter");
  await expect(page.locator(".s2-home-faq details").first()).toHaveAttribute("open", "");
  await page.keyboard.press("Enter");
  await expect(page.locator(".s2-home-faq details").first()).not.toHaveAttribute("open", "");
});

test("core content, art and FAQ remain usable without JavaScript", async ({ browser, baseURL }) => {
  const context = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 390, height: 844 } });
  const page = await context.newPage();
  await page.goto(baseURL!);
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(page.locator("[data-home-gallery-card] img").first()).toBeVisible();
  await page.locator(".s2-home-faq summary").first().click();
  await expect(page.locator(".s2-home-faq details").first()).toHaveAttribute("open", "");
  await context.close();
});

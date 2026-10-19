import { expect, test, type Page } from "@playwright/test";

test.use({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });

const fanSelection = (page: Page) => page.locator('.coverflow-dot[aria-selected="true"]').getAttribute("aria-label");
const carouselSelection = (page: Page) => page.locator('.home-carousel-card[aria-current="true"]').innerText();

async function expectBackgroundMotionStopped(page: Page) {
  // Allow an already-started transition to settle, then cover both autoplay
  // periods (2.8s and 4.2s). Ignore unrelated animations such as falling petals.
  await page.waitForTimeout(1000);
  const writes = await page.evaluate(async () => {
    let count = 0;
    const observer = new MutationObserver((records) => { count += records.length; });
    for (const node of document.querySelectorAll(".stack-fan-stage, .home-carousel-slide")) {
      observer.observe(node, { attributes: true, subtree: true, attributeFilter: ["style"] });
    }
    await new Promise((resolve) => setTimeout(resolve, 5000));
    observer.disconnect();
    return count;
  });
  expect(writes).toBe(0);
}

test("Home pauses offscreen autoplay and resumes each visible gallery", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator(".home-hero-shiny")).toHaveAttribute("data-sheen-paused", "false");
  const initialFan = await fanSelection(page);
  await expect.poll(() => fanSelection(page), { timeout: 5000 }).not.toBe(initialFan);

  await page.evaluate(() => window.scrollTo(0, 2400));
  await expect(page.locator(".home-hero-shiny")).toHaveAttribute("data-sheen-paused", "true");
  await expectBackgroundMotionStopped(page);

  const carousel = page.locator("section").filter({ has: page.locator(".home-carousel-slide") });
  await carousel.scrollIntoViewIfNeeded();
  const initialSlide = await carouselSelection(page);
  await expect.poll(() => carouselSelection(page), { timeout: 6500 }).not.toBe(initialSlide);
  await expect(page.locator('.home-carousel-card[aria-current="true"]')).toHaveCSS("opacity", "1");
  const dynamicPaint = await page.locator(".home-carousel-slide").evaluateAll((slides) => slides.some(
    (slide) => Array.from(slide.querySelectorAll<HTMLElement>("*"))
      .some((node) => node.style.boxShadow !== "" || node.style.filter !== ""),
  ));
  expect(dynamicPaint).toBe(false);
  await page.screenshot({ path: test.info().outputPath("home-mobile-carousel.png") });

  await page.evaluate(() => window.scrollTo(0, 0));
  const resumedFan = await fanSelection(page);
  await expect.poll(() => fanSelection(page), { timeout: 5000 }).not.toBe(resumedFan);
});

test("Home stops hidden-tab motion and honours reduced motion without losing controls", async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => {
    Object.defineProperty(document, "visibilityState", { configurable: true, get: () => "hidden" });
    document.dispatchEvent(new Event("visibilitychange"));
  });
  await expect(page.locator(".home-hero-shiny")).toHaveAttribute("data-sheen-paused", "true");
  await expectBackgroundMotionStopped(page);
  await page.evaluate(() => {
    Reflect.deleteProperty(document, "visibilityState");
    document.dispatchEvent(new Event("visibilitychange"));
  });
  await expect(page.locator(".home-hero-shiny")).toHaveAttribute("data-sheen-paused", "false");
  await expect(page.locator(".home-hero-shiny")).toHaveCSS("animation-iteration-count", "2");
  await expect.poll(() => page.locator(".home-hero-shiny").evaluate((node) =>
    node.getAnimations().every((animation) => animation.playState === "finished"),
  ), { timeout: 13000 }).toBe(true);

  await page.emulateMedia({ reducedMotion: "reduce" });
  const carousel = page.locator("section").filter({ has: page.locator(".home-carousel-slide") });
  await carousel.scrollIntoViewIfNeeded();
  await expectBackgroundMotionStopped(page);
  const first = await carouselSelection(page);
  await page.getByRole("button", { name: "Mẫu tiếp theo", exact: true }).click();
  await expect.poll(() => carouselSelection(page)).not.toBe(first);
  await page.getByRole("button", { name: "Mẫu trước", exact: true }).click();
  await expect.poll(() => carouselSelection(page)).toBe(first);
  await page.locator('.home-carousel-card[aria-current="true"]').click();
  await expect(page.getByRole("dialog")).toBeVisible();
});

test("mobile Home keeps touch swiping and pauses autoplay during preview", async ({ page, context }) => {
  await page.goto("/");
  await page.locator("section").filter({ has: page.locator(".home-carousel-slide") }).scrollIntoViewIfNeeded();
  const first = await carouselSelection(page);
  const card = page.locator('.home-carousel-card[aria-current="true"]');
  const bounds = await card.boundingBox();
  expect(bounds).not.toBeNull();
  const y = Math.min(700, Math.max(100, bounds!.y + bounds!.height / 2));
  const session = await context.newCDPSession(page);
  await session.send("Input.dispatchTouchEvent", {
    type: "touchStart", touchPoints: [{ x: 320, y }],
  });
  for (let step = 1; step <= 8; step += 1) {
    await session.send("Input.dispatchTouchEvent", {
      type: "touchMove", touchPoints: [{ x: 320 - step * 32, y }],
    });
    await page.waitForTimeout(35);
  }
  await session.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
  await session.detach();
  await expect.poll(() => carouselSelection(page)).not.toBe(first);
  await card.click();
  await expect(page.getByRole("dialog")).toBeVisible();
  const previewSlide = await carouselSelection(page);
  await page.waitForTimeout(5000);
  expect(await carouselSelection(page)).toBe(previewSlide);
});

test.describe("desktop Home", () => {
  test.use({ viewport: { width: 1366, height: 900 }, isMobile: false, hasTouch: false });

  test("carousel pauses on hover and manual navigation still opens a preview", async ({ page }) => {
    await page.goto("/");
    const carousel = page.locator("section").filter({ has: page.locator(".home-carousel-slide") });
    await carousel.scrollIntoViewIfNeeded();
    await carousel.hover();
    await page.waitForTimeout(1000);
    const hoveredSlide = await carouselSelection(page);
    await page.waitForTimeout(5000);
    expect(await carouselSelection(page)).toBe(hoveredSlide);
    await page.getByRole("button", { name: "Mẫu tiếp theo", exact: true }).click();
    await expect.poll(() => carouselSelection(page)).not.toBe(hoveredSlide);
    await page.screenshot({ path: test.info().outputPath("home-desktop-carousel.png") });
    await page.locator('.home-carousel-card[aria-current="true"]').click();
    await expect(page.getByRole("dialog")).toBeVisible();
  });
});

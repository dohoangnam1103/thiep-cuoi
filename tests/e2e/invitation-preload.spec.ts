import { expect, test, type Page } from "@playwright/test";
import { getVietnameseTemplateSlug } from "@/data/template-route-slugs";

// Next dev's existing allowlist uses localhost, not the numeric loopback host.
test.use({ baseURL: `http://localhost:${process.env.E2E_PORT ?? 3100}` });

const demo = "/mau-thiep/long-phung-v3-do/demo";
const detail = "[data-invitation-detail]";
const coverAsset = /\/longphung-v3-red\/phung-cover(?:-mobile)?\.webp/;
const heroAsset = "/gallery/dragon-phoenix-v3-red/photo-";

async function openCover(page: Page) {
  const control = page.locator("[data-open-invitation-control]");
  await expect(control).toBeEnabled({ timeout: 30_000 });
  // Keyboard activates the actual accessible control (the 3D renderer's visual
  // button may be a texture rather than a clickable DOM button).
  await control.focus();
  await page.keyboard.press("Enter");
}

test.beforeEach(async ({ page }) => {
  await page.route(/googletagmanager|google-analytics/, (route) => route.abort());
});

test("detail waits for the cover, then warms invisibly before opening", async ({ page }) => {
  let release!: () => void;
  const held = new Promise<void>((resolve) => { release = resolve; });
  let coverRequested = false;
  const detailRequests: string[] = [];
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("request", (request) => {
    if (request.url().includes(heroAsset)) detailRequests.push(request.url());
  });
  await page.route(coverAsset, async (route) => {
    coverRequested = true;
    await held;
    await route.continue();
  });
  try {
    await page.goto(demo, { waitUntil: "domcontentloaded" });
    await expect.poll(() => coverRequested).toBe(true);
    await expect(page.locator(detail)).toHaveAttribute("data-invitation-detail", "waiting");
    // Give hydration and background work several frame opportunities while the
    // cover request is deliberately held. This is a negative ordering check.
    await page.evaluate(() => new Promise<void>((resolve) => setTimeout(resolve, 600)));
    expect(detailRequests).toEqual([]);
    await expect(page.locator(`${detail} img`)).toHaveCount(0);
    release();
    await expect(page.locator("[data-cover-assets-ready=true]")).toHaveCount(1, { timeout: 40_000 });
    await expect(page.locator(detail)).toHaveAttribute("data-invitation-detail", "preparing");
    await expect.poll(() => detailRequests.length).toBeGreaterThan(0);
    const hero = page.getByTestId("dragon-phoenix-v3-hero-photo").locator("img");
    await expect.poll(() => hero.evaluate((image: HTMLImageElement) => image.complete && image.naturalWidth > 0)).toBe(true);
    await expect(hero).toBeHidden();
    expect(await page.locator("audio").getAttribute("src")).toBeNull();
    expect(await page.locator(`${detail} iframe[src]`).count()).toBe(0);
    expect(await page.evaluate(() => document.documentElement.scrollHeight <= innerHeight + 1)).toBe(true);
    await hero.evaluate((image) => image.setAttribute("data-preloaded-identity", "same-node"));
    const beforeOpen = detailRequests.length;
    await openCover(page);
    await expect(hero).toBeVisible({ timeout: 15_000 });
    await expect(hero).toHaveAttribute("data-preloaded-identity", "same-node");
    expect(detailRequests.length).toBe(beforeOpen);
    await expect(page.locator(`${detail} iframe`)).toHaveAttribute("src", /google/);
    expect(errors).toEqual([]);
  } finally {
    release();
  }
});

test("a failed cover image does not block preparation or opening", async ({ page }) => {
  await page.route(coverAsset, (route) => route.abort());
  await page.goto(demo, { waitUntil: "domcontentloaded" });
  await expect(page.locator(detail)).toHaveAttribute("data-invitation-detail", "preparing", { timeout: 40_000 });
  await openCover(page);
  await expect(page.getByTestId("dragon-phoenix-v3-hero")).toBeVisible({ timeout: 15_000 });
});

test("cover fonts also gate background work", async ({ page }) => {
  let release!: () => void;
  let requested = false;
  const held = new Promise<void>((resolve) => { release = resolve; });
  await page.route(/\/fonts\/Fz_Qellia_Fix\.ttf/, async (route) => {
    requested = true;
    await held;
    await route.continue();
  });
  try {
    await page.goto(demo, { waitUntil: "domcontentloaded" });
    await expect.poll(() => requested).toBe(true);
    await page.evaluate(() => new Promise<void>((resolve) => setTimeout(resolve, 600)));
    await expect(page.locator(detail)).toHaveAttribute("data-invitation-detail", "waiting");
    release();
    await expect(page.locator(detail)).toHaveAttribute("data-invitation-detail", "preparing", { timeout: 40_000 });
  } finally { release(); }
});

test("an early 2D open starts detail immediately without waiting for cover images", async ({ page }) => {
  let release!: () => void;
  const held = new Promise<void>((resolve) => { release = resolve; });
  await page.route(coverAsset, async (route) => { await held; await route.continue(); });
  try {
    await page.goto(demo, { waitUntil: "domcontentloaded" });
    const is3d = await page.locator('[data-envelope-renderer="3d"]').count();
    test.skip(is3d > 0, "3D intentionally waits for its interactive texture; this case covers 2D");
    // The guest can click while assets load, but only after the app's event
    // handlers are hydrated. The existing cover effect locks body scrolling.
    await expect.poll(() => page.evaluate(() => document.body.style.overflow)).toBe("hidden");
    await page.locator("[data-open-btn]").click();
    await expect(page.locator(detail)).toHaveAttribute("data-invitation-detail", "preparing");
    await expect(page.getByTestId("dragon-phoenix-v3-hero")).toBeVisible({ timeout: 15_000 });
  } finally { release(); }
});

test("capture renders detail directly without a cover or background phase", async ({ page }) => {
  await page.goto(`${demo}/capture`);
  await expect(page.locator(detail)).toHaveAttribute("data-invitation-detail", "visible");
  await expect(page.getByTestId("dragon-phoenix-v3-hero")).toBeVisible();
  await expect(page.locator("[data-open-invitation-control]")).toHaveCount(0);
});

test.describe("mobile", () => {
  test.use({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
  test("detail images warm behind the cover on a small screen", async ({ page }) => {
    await page.goto(demo, { waitUntil: "domcontentloaded" });
    await expect(page.locator(detail)).toHaveAttribute("data-invitation-detail", "preparing", { timeout: 40_000 });
    const hero = page.getByTestId("dragon-phoenix-v3-hero-photo").locator("img");
    await expect.poll(() => hero.evaluate((image: HTMLImageElement) => image.complete && image.naturalWidth > 0)).toBe(true);
    await expect(hero).toBeHidden();
    await openCover(page);
    await expect(hero).toBeVisible({ timeout: 15_000 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  });
});

for (const slug of ["crystal-floral-red", "boho-floral-pink"]) {
  const route = getVietnameseTemplateSlug(slug);
  test(`background preparation and reveal: ${route}`, async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto(`/mau-thiep/${route}/demo`, { waitUntil: "domcontentloaded" });
    await expect(page.locator(detail)).toHaveAttribute("data-invitation-detail", "preparing", { timeout: 40_000 });
    await expect.poll(() => page.locator(`${detail} img`).count()).toBeGreaterThan(0);
    await openCover(page);
    await expect(page.locator(detail)).toHaveAttribute("data-invitation-detail", "visible");
    expect(errors).toEqual([]);
  });
}

test.describe("physical covers on disposable published fixtures", () => {
  test.skip(process.env.PRELOAD_PHYSICAL_FIXTURES !== "1", "Requires isolated preload-* invitations, never production data");
  for (const slug of ["long-phung-gatefold", "nguyet-anh-sleeve", "doraemon-door", "detective-conan-casebook"]) {
    test(`${slug}: CSS fallback prepares after the cover and opens`, async ({ page }) => {
      const errors: string[] = [];
      page.on("pageerror", (error) => errors.push(error.message));
      await page.addInitScript(() => {
        const original = HTMLCanvasElement.prototype.getContext;
        Object.defineProperty(HTMLCanvasElement.prototype, "getContext", {
          value: function (this: HTMLCanvasElement, context: string, ...args: unknown[]) {
            if (/webgl/i.test(context)) return null;
            return Reflect.apply(original, this, [context, ...args]);
          },
        });
      });
      await page.goto(`/thiep/preload-${slug}`, { waitUntil: "domcontentloaded" });
      const stage = page.getByTestId(`${slug}-stage`);
      await expect(stage).toHaveAttribute("data-cover-assets-ready", "true", { timeout: 40_000 });
      await expect(page.locator('[data-invitation-detail="preparing"]')).toHaveCount(1);
      await page.getByTestId(`${slug}-open`).click();
      await expect(page.locator('[data-invitation-detail="preparing"]')).toHaveCount(0, { timeout: 20_000 });
      await expect(page.locator('[data-invitation-detail="visible"]').first()).toBeAttached();
      expect(errors).toEqual([]);
    });
  }
});

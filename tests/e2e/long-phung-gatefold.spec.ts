import { expect, test, type Page } from "@playwright/test";

const LAB_PATH = "/lab/long-phung-gatefold";
const DEMO_PATH = "/mau-thiep/long-phung-gatefold/demo";

async function loadGatefoldLab(page: Page) {
  await page.goto(LAB_PATH, { timeout: 60_000 });

  const openControl = page.getByTestId("long-phung-gatefold-open");
  await expect(openControl).toBeEnabled({ timeout: 45_000 });
  await expect(page.getByTestId("long-phung-gatefold-stage")).toHaveAttribute(
    "data-gatefold-state",
    "closed",
  );

  return openControl;
}

async function expectOpenedGatefold(page: Page) {
  const stage = page.getByTestId("long-phung-gatefold-stage");
  await expect(stage).toHaveAttribute("data-gatefold-state", "opened", { timeout: 4_000 });
  await expect(stage).toHaveAttribute("data-gatefold-progress", "100");
  await expect(page.getByTestId("long-phung-gatefold-canvas")).toHaveCount(0);
  await expect(page.getByTestId("long-phung-gatefold-dom-hero")).toBeFocused();
}

test.describe("Long Phụng Gatefold lab", () => {
  test.describe.configure({ mode: "serial" });

  test("desktop preserves the physical-opening state machine from a clasp drag", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await loadGatefoldLab(page);

    const stage = page.getByTestId("long-phung-gatefold-stage");
    const clasp = page.getByTestId("long-phung-gatefold-clasp-gesture");
    const claspBox = await clasp.boundingBox();
    if (!claspBox) throw new Error("gatefold clasp hit target has no layout box");

    await page.mouse.move(claspBox.x + claspBox.width / 2, claspBox.y + claspBox.height / 2);
    await page.mouse.down();
    await page.mouse.move(claspBox.x + claspBox.width / 2 + 20, claspBox.y + claspBox.height / 2, {
      steps: 3,
    });
    await page.mouse.up();

    await expect(stage).toHaveAttribute("data-gatefold-state", "opening");
    await expect(stage).toHaveAttribute("data-gatefold-pose-captured", "true");
    await expect(stage).toHaveAttribute("data-gatefold-phase", /unfold|reveal|settle|handoff/);
    await expectOpenedGatefold(page);
  });

  test("mobile opening stays inside the viewport", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    const openControl = await loadGatefoldLab(page);

    await expect(page).toHaveTitle(/Long Phụng Gatefold/);
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);

    await openControl.click();
    await expectOpenedGatefold(page);
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  });

  test("reduced motion still performs the meaningful handoff", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.setViewportSize({ width: 390, height: 844 });
    const openControl = await loadGatefoldLab(page);

    await expect(page.getByText("Reduced motion đang hoạt động")).toBeVisible();
    await openControl.click();
    await expectOpenedGatefold(page);
  });

  test("CSS fallback keeps a two-sided carrier and opens without WebGL", async ({ page }) => {
    await page.addInitScript(() => {
      Object.defineProperty(HTMLCanvasElement.prototype, "getContext", {
        configurable: true,
        value: () => null,
      });
    });
    await page.setViewportSize({ width: 390, height: 844 });
    const openControl = await loadGatefoldLab(page);

    const fallback = page.getByTestId("long-phung-gatefold-fallback");
    await expect(fallback).toBeVisible();
    await expect(fallback).toHaveAttribute("data-gatefold-fallback-flipped", "false");

    const flipControl = page.getByTestId("long-phung-gatefold-back-face");
    await expect(flipControl).toHaveAttribute("aria-pressed", "false");
    await flipControl.click();
    await expect(fallback).toHaveAttribute("data-gatefold-fallback-flipped", "true");
    await expect(flipControl).toHaveAttribute("aria-pressed", "true");
    await expect(openControl).toBeDisabled();

    await flipControl.click();
    await expect(fallback).toHaveAttribute("data-gatefold-fallback-flipped", "false");
    await expect(flipControl).toHaveAttribute("aria-pressed", "false");

    await openControl.click();
    await expect(fallback).toHaveAttribute("data-gatefold-fallback-opening", "true");
    await expectOpenedGatefold(page);
  });

  test("production demo keeps the physical opening before mounting the registered document", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(DEMO_PATH, { timeout: 60_000 });

    const stage = page.getByTestId("long-phung-gatefold-stage");
    await expect(stage).toHaveAttribute("data-gatefold-state", "closed", { timeout: 45_000 });
    await expect(page.locator('[data-template-renderer="long-phung-gatefold"]')).toHaveCount(0);

    await page.getByTestId("long-phung-gatefold-open").click();

    await expect(page.locator('[data-template-renderer="long-phung-gatefold"]')).toBeVisible({
      timeout: 5_000,
    });
    await expect(page.locator("[data-template-footer]")).toBeVisible();
    await expect(page.getByTestId("long-phung-gatefold-canvas")).toHaveCount(0);

    await page.getByTestId("long-phung-gatefold-replay-cover").click();
    await expect(stage).toHaveAttribute("data-gatefold-state", "closed");
    await expect(page.locator('[data-template-renderer="long-phung-gatefold"]')).toHaveCount(0);
  });

  test("production capture bypasses the opening while retaining the full document", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(`${DEMO_PATH}?capture=1`, { timeout: 60_000 });

    await expect(page.getByTestId("long-phung-gatefold-stage")).toHaveCount(0);
    await expect(page.locator('[data-template-renderer="long-phung-gatefold"]')).toBeVisible();
    await expect(page.locator("[data-template-footer]")).toBeVisible();
    await expect(page.locator("[data-gatefold-chapter-nav]")).toHaveCount(0);
    await expect(page.locator("[data-copy-address]")).toHaveCount(2);
  });
});

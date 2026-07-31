import { expect, test, type Page } from "@playwright/test";

const LAB_PATH = "/lab/nguyet-anh-sleeve";
const DEMO_PATH = "/mau-thiep/nguyet-anh-sleeve/demo";

async function loadSleeveLab(page: Page) {
  await page.goto(LAB_PATH, { timeout: 60_000 });

  const openControl = page.getByTestId("nguyet-anh-sleeve-open");
  await expect(openControl).toBeEnabled({ timeout: 45_000 });
  await expect(page.getByTestId("nguyet-anh-sleeve-stage")).toHaveAttribute(
    "data-sleeve-state",
    "closed",
  );

  return openControl;
}

async function expectOpenedSleeve(page: Page) {
  const stage = page.getByTestId("nguyet-anh-sleeve-stage");
  await expect(stage).toHaveAttribute("data-sleeve-state", "opened", {
    timeout: 6_000,
  });
  await expect(stage).toHaveAttribute("data-sleeve-progress", "100");
  await expect(page.getByTestId("nguyet-anh-sleeve-canvas")).toHaveCount(0);
  await expect(page.getByTestId("nguyet-anh-sleeve-dom-hero")).toBeFocused();
}

test.describe("Nguyệt Ảnh Sleeve lab", () => {
  test.describe.configure({ mode: "serial" });

  test("desktop opens only from the explicit open button", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    const openControl = await loadSleeveLab(page);

    const stage = page.getByTestId("nguyet-anh-sleeve-stage");
    const canvas = page.getByTestId("nguyet-anh-sleeve-canvas");
    const canvasBox = await canvas.boundingBox();
    if (!canvasBox) throw new Error("sleeve canvas has no layout box");

    await page.mouse.click(
      canvasBox.x + canvasBox.width / 2,
      canvasBox.y + canvasBox.height / 2,
    );
    await expect(stage).toHaveAttribute("data-sleeve-state", "closed");
    await expect(openControl).toBeEnabled();

    await openControl.click();
    await expectOpenedSleeve(page);
    await expect(stage).toHaveAttribute("data-sleeve-pose-captured", "true");
  });

  test("mobile opening stays inside the viewport", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    const openControl = await loadSleeveLab(page);

    await expect(page).toHaveTitle(/Nguyệt Ảnh Sleeve/);
    await expect.poll(() => page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    )).toBe(true);

    await openControl.click();
    await expectOpenedSleeve(page);
    await expect.poll(() => page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    )).toBe(true);
  });

  test("reduced motion still performs the meaningful handoff", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.setViewportSize({ width: 390, height: 844 });
    const openControl = await loadSleeveLab(page);

    await expect(page.getByText("Reduced motion đang hoạt động")).toBeVisible();
    await openControl.click();
    await expectOpenedSleeve(page);
  });

  test("CSS fallback keeps a two-sided carrier and opens without WebGL", async ({ page }) => {
    await page.addInitScript(() => {
      Object.defineProperty(HTMLCanvasElement.prototype, "getContext", {
        configurable: true,
        value: () => null,
      });
    });
    await page.setViewportSize({ width: 390, height: 844 });
    const openControl = await loadSleeveLab(page);

    const stage = page.getByTestId("nguyet-anh-sleeve-stage");
    const fallback = page.getByTestId("nguyet-anh-sleeve-fallback");
    await expect(fallback).toBeVisible();
    await expect(fallback.locator("[data-motion]")).toHaveAttribute(
      "data-motion",
      "mobile",
    );

    const flipControl = page.getByTestId("nguyet-anh-sleeve-back-face");
    await expect(flipControl).toHaveAttribute("aria-pressed", "false");
    await flipControl.click();
    await expect(flipControl).toHaveAttribute("aria-pressed", "true");
    await expect(openControl).toBeDisabled();
    await fallback.click({ force: true, position: { x: 120, y: 180 } });
    await expect(stage).toHaveAttribute("data-sleeve-state", "closed");

    await flipControl.click();
    await expect(flipControl).toHaveAttribute("aria-pressed", "false");

    await openControl.click();
    await expect(stage).toHaveAttribute("data-sleeve-state", "opening");
    await expectOpenedSleeve(page);
  });

  test("production demo keeps the sleeve opening before mounting the registered document", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(DEMO_PATH, { timeout: 60_000 });

    const stage = page.getByTestId("nguyet-anh-sleeve-stage");
    await expect(stage).toHaveAttribute("data-sleeve-state", "closed", {
      timeout: 45_000,
    });
    await expect(
      page.locator('[data-template-renderer="nguyet-anh-sleeve"]'),
    ).toHaveCount(0);

    await page.getByTestId("nguyet-anh-sleeve-open").click();

    await expect(
      page.locator('[data-template-renderer="nguyet-anh-sleeve"]'),
    ).toBeVisible({ timeout: 6_000 });
    await expect(page.locator("[data-template-footer]")).toBeVisible();
    await expect(page.getByTestId("nguyet-anh-sleeve-canvas")).toHaveCount(0);

    await page.getByTestId("nguyet-anh-sleeve-replay-cover").click();
    await expect(stage).toHaveAttribute("data-sleeve-state", "closed");
    await expect(
      page.locator('[data-template-renderer="nguyet-anh-sleeve"]'),
    ).toHaveCount(0);
  });

  test("production capture bypasses the opening while retaining the full document", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(`${DEMO_PATH}?capture=1`, { timeout: 60_000 });

    await expect(page.getByTestId("nguyet-anh-sleeve-stage")).toHaveCount(0);
    await expect(
      page.locator('[data-template-renderer="nguyet-anh-sleeve"]'),
    ).toBeVisible();
    await expect(page.locator("[data-template-footer]")).toBeVisible();
    await expect(page.locator("[data-sleeve-invitation-body]")).toBeVisible();
    await expect(page.locator("[data-copy-address]")).toHaveCount(2);
  });
});

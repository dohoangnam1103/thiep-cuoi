import { expect, test } from "@playwright/test";

const LAB_PATH = "/lab/flow-demo";

test.describe("Motion engine flow lab", () => {
  test("focus and compare expose every engine for one choreography", async ({
    page,
  }) => {
    const consoleErrors: string[] = [];
    page.on("console", (message) => {
      if (message.type() === "error") consoleErrors.push(message.text());
    });
    await page.goto(LAB_PATH);

    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.locator(".petal-field")).toHaveCount(0);
    await expect(page.locator('[data-motion-engine="waapi"]')).toHaveCount(1);

    await page.getByTestId("flow-demo-view-compare").click();
    const grid = page.getByTestId("flow-demo-compare-grid");
    await expect(grid.locator("[data-motion-engine]")).toHaveCount(5);

    await page.getByTestId("flow-demo-choreography-ribbonSweep").click();
    await page.getByTestId("flow-demo-replay").click();
    await expect(
      grid.locator('[data-motion-choreography="ribbonSweep"]'),
    ).toHaveCount(5);
    await expect(grid.locator('[data-motion-state="complete"]')).toHaveCount(5);

    const webglDemo = grid.locator('[data-motion-engine="webgl"]');
    await expect(webglDemo.locator("canvas")).toBeVisible();
    await expect(webglDemo).toHaveAttribute("data-motion-state", "complete");
    expect(consoleErrors).toEqual([]);
  });

  test("focus selects each technology and reduced motion fits mobile", async ({
    page,
  }) => {
    const consoleErrors: string[] = [];
    page.on("console", (message) => {
      if (message.type() === "error") consoleErrors.push(message.text());
    });
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(LAB_PATH);

    await page.getByTestId("flow-demo-reduced-motion").check();
    await page.getByTestId("flow-demo-engine-css").click();

    const cssDemo = page.locator('[data-motion-engine="css"]');
    await expect(cssDemo).toHaveAttribute("data-reduced-motion", "true");
    expect(
      await cssDemo.locator('[data-motion-actor="accentLeft"]').evaluate(
        (element) => getComputedStyle(element).animationName,
      ),
    ).toBe("none");
    expect(
      await cssDemo.locator('[data-motion-actor="reveal"]').evaluate(
        (element) => getComputedStyle(element).animationDuration,
      ),
    ).toBe("0.15s");

    await page.getByTestId("flow-demo-engine-canvas").click();
    await page.getByTestId("flow-demo-replay").click();

    const canvasDemo = page.locator('[data-motion-engine="canvas"]');
    await expect(canvasDemo).toHaveCount(1);
    await expect(canvasDemo).toHaveAttribute("data-reduced-motion", "true");
    await expect(canvasDemo).toHaveAttribute("data-motion-state", "complete");
    await expect(canvasDemo.locator("canvas")).toBeVisible();

    expect(
      await page.evaluate(() => document.documentElement.scrollWidth),
    ).toBeLessThanOrEqual(390);
    expect(consoleErrors).toEqual([]);
  });
});

import { expect, test } from "@playwright/test";

for (const reduce of [false, true] as const) {
  test(`gate cost ${reduce ? "reduced" : "desktop"}`, async ({ page }) => {
    if (reduce) await page.emulateMedia({ reducedMotion: "reduce" });
    await page.setViewportSize({ height: 720, width: 1280 });
    await page.goto("/lab/forest-wedding-journey");
    await expect(page.getByTestId("forest-journey-enter")).toBeEnabled();
    await page.getByTestId("forest-journey-canvas").evaluate((element) => {
      const w = window as typeof window & { __ticks: number[] };
      w.__ticks = [];
      const tick = () => {
        w.__ticks.push(performance.now());
        element.dispatchEvent(
          new PointerEvent("pointermove", { bubbles: true, clientX: 10 }),
        );
        requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });
    await page.waitForTimeout(6_000);
    const report = await page.evaluate(() => {
      const w = window as typeof window & { __ticks: number[] };
      const gaps = w.__ticks
        .slice(1)
        .map((value, index) => Math.round(value - w.__ticks[index]!))
        .slice(2);
      const sorted = [...gaps].sort((a, b) => a - b);
      return {
        frames: gaps.length,
        median: sorted[Math.floor(sorted.length / 2)] ?? 0,
      };
    });
    console.log(`MEASURE ${reduce ? "reduced" : "desktop"} ${JSON.stringify(report)}`);
  });
}

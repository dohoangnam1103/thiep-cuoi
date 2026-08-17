import { expect, test } from "@playwright/test";

test("measure travel stall", async ({ page }) => {
  await page.goto("/lab/forest-wedding-journey");
  const stage = page.getByTestId("forest-journey-stage");
  const entry = page.getByTestId("forest-journey-enter");
  await expect(entry).toBeEnabled();

  await page.evaluate(() => {
    const w = window as typeof window & {
      __frames: number[];
      __phases: [string, number][];
      __clickAt: number;
    };
    w.__frames = [];
    w.__phases = [];
    w.__clickAt = 0;
    const tick = () => {
      w.__frames.push(Math.round(performance.now()));
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
    const stageEl = document.querySelector<HTMLElement>(
      '[data-testid="forest-journey-stage"]',
    );
    if (stageEl) {
      new MutationObserver(() => {
        w.__phases.push([
          stageEl.dataset.journeyPhase ?? "?",
          Math.round(performance.now()),
        ]);
      }).observe(stageEl, {
        attributeFilter: ["data-journey-phase"],
        attributes: true,
      });
    }
    document.addEventListener("click", () => {
      w.__clickAt = Math.round(performance.now());
    }, { capture: true, once: true });
  });

  await entry.click();
  await expect(stage).toHaveAttribute("data-journey-phase", "settled", {
    timeout: 20_000,
  });
  const report = await page.evaluate(() => {
    const w = window as typeof window & {
      __frames: number[];
      __phases: [string, number][];
      __clickAt: number;
    };
    return {
      clickAt: w.__clickAt,
      frames: w.__frames,
      phases: w.__phases,
    };
  });
  console.log(`MEASURE ${JSON.stringify(report)}`);
});

import { expect, test, type Locator, type Page, type TestInfo } from "@playwright/test";
import sharp from "sharp";

/**
 * Budget and appearance gate for the beach journey lab. Modelled on
 * `forest-wedding-journey-visual.spec.ts`: statistics, not golden images. The
 * beach world uses demand rendering, wind drift, an adaptive quality sampler
 * and a planar water reflection, so a golden image would be flaky while a
 * colour/contrast profile still catches the regressions we care about — black
 * water, a washed-out sky, sand that has lost its detail.
 *
 * This suite requires `BEACH_RUNTIME_DIAGNOSTICS=1`; the `beach` Playwright
 * project passes it through to the dev server.
 *
 * The frame-time win over the forest lab (449 ms median at the same scene) is
 * this whole change's premise, so the last describe measures frame cost with
 * the water reflection on and off and prints both.
 */
const LAB_PATH = "/lab/beach-wedding-journey";
const FOREST_BASELINE_FRAME_MS = 449;
/**
 * A generous ceiling. The point is to fail loudly if the beach ever regresses
 * to forest-class frame cost, not to pin the measured 18 ms.
 */
const BEACH_FRAME_BUDGET_MS = 120;
const FRAME_SAMPLE_MS = 6_000;

const DESKTOP_VIEWPORT = { height: 900, width: 1440 } as const;
const MOBILE_VIEWPORT = { height: 844, width: 390 } as const;

/** Global Constraints, verbatim from the plan. */
const BUDGETS = {
  desktop: { calls: 120, triangles: 250_000 },
  entryCompressedBytes: 4_000_000,
  mobile: { calls: 80, triangles: 150_000 },
  sharedCompressedBytes: 12_000_000,
  totalDecodedRgbaMipBytes: 64_000_000,
} as const;

/** Bands sampled from the canvas, top-down: sky, open water, near sand. */
const SKY_BAND = { heightRatio: 0.28, topRatio: 0 } as const;
/**
 * The horizon strip, where the sun puts its warmth. The zenith stays blue under
 * a 12.8deg sun, so warmth is asserted as a gradient between these two bands
 * rather than as a red-over-blue claim about the sky as a whole.
 */
const HORIZON_BAND = { heightRatio: 0.1, topRatio: 0.3 } as const;
const WATER_BAND = { heightRatio: 0.22, topRatio: 0.4 } as const;
const SAND_BAND = { heightRatio: 0.26, topRatio: 0.72 } as const;

type BeachRuntimeSnapshot = {
  readonly adaptiveReductionCount: number;
  readonly ambientCount: number;
  readonly assets: {
    readonly entryCompressedBytes: number;
    readonly entryDecodedRgbaMipBytes: number;
    readonly sharedCompressedBytes: number;
    readonly sharedDecodedRgbaMipBytes: number;
  };
  readonly tables: { readonly instanceCount: number };
  readonly frames: {
    readonly instanceCount: number;
    readonly modelFallbackCount: number;
  };
  readonly hiddenAmbientCount: number;
  readonly photos: {
    readonly decodedRgbaMipBytes: number;
    readonly textureCount: number;
    readonly unmeasuredCount: number;
  };
  readonly qualityTier: "desktop" | "mobile" | "reduced";
  readonly renderer: {
    readonly calls: number;
    readonly dpr: number;
    readonly frame: number;
    readonly geometries: number;
    readonly textures: number;
    readonly triangles: number;
  };
  readonly scene: {
    readonly id: string;
    readonly index: number;
    readonly phase: string;
    readonly targetId: string | null;
    readonly targetIndex: number | null;
    readonly type: string;
  };
  readonly totalEstimatedDecodedRgbaMipBytes: number;
  readonly viewport: "desktop" | "mobile";
  readonly water: {
    readonly reflectionEnabled: boolean;
    readonly reflectionSize: number;
  };
  readonly worldMode: string;
};

type BandStatistics = {
  readonly brightPixelRatio: number;
  readonly luminanceRange: number;
  readonly luminanceStandardDeviation: number;
  readonly meanBlue: number;
  readonly meanGreen: number;
  readonly meanLuminance: number;
  readonly meanRed: number;
  readonly nearBlackPixelRatio: number;
};

async function readBeachRuntimeDiagnostics(page: Page): Promise<BeachRuntimeSnapshot> {
  return page.evaluate(() => {
    // The `declare global` for this reader lives in the lab's canvas module,
    // which the test tsconfig does not include, so read it through a cast.
    const reader = (window as unknown as {
      __beachWeddingJourneyDiagnostics?: () => unknown;
    }).__beachWeddingJourneyDiagnostics;
    if (typeof reader !== "function") {
      throw new Error(
        "window.__beachWeddingJourneyDiagnostics is missing — run this suite with BEACH_RUNTIME_DIAGNOSTICS=1",
      );
    }
    return reader();
  }) as Promise<BeachRuntimeSnapshot>;
}

/**
 * Asserts every Global Constraints budget that the runtime can measure. The
 * forest's `environment.*`, `chunks`, `petals`, `wildlife` and photo-lease
 * assertions have no beach counterpart — the photoreal world reports reception
 * tables, hanging frames and the water reflection instead.
 */
function expectBeachRuntimeBudget(
  snapshot: BeachRuntimeSnapshot,
  { mobile }: { mobile: boolean },
) {
  const limits = mobile ? BUDGETS.mobile : BUDGETS.desktop;

  expect(snapshot.viewport).toBe(mobile ? "mobile" : "desktop");
  expect(snapshot.worldMode).toBe("photoreal");
  expect(snapshot.renderer.dpr).toBe(mobile ? 1 : 1.25);

  expect(snapshot.renderer.calls).toBeGreaterThan(0);
  expect(snapshot.renderer.calls).toBeLessThanOrEqual(limits.calls);
  expect(snapshot.renderer.triangles).toBeGreaterThan(0);
  expect(snapshot.renderer.triangles).toBeLessThanOrEqual(limits.triangles);
  expect(snapshot.renderer.frame).toBeGreaterThan(0);
  expect(snapshot.renderer.geometries).toBeGreaterThan(0);
  expect(snapshot.renderer.textures).toBeGreaterThan(0);

  expect(snapshot.water.reflectionSize).toBe(256);
  expect(snapshot.frames.instanceCount).toBe(3);
  expect(snapshot.tables.instanceCount).toBeGreaterThan(0);

  // Three live gallery photographs at most, and every one of them measured —
  // an unmeasured texture would make the ceiling below meaningless.
  expect(snapshot.photos.textureCount).toBeLessThanOrEqual(3);
  expect(snapshot.photos.unmeasuredCount).toBe(0);

  expect(snapshot.assets.entryCompressedBytes).toBeLessThanOrEqual(
    BUDGETS.entryCompressedBytes,
  );
  expect(snapshot.assets.sharedCompressedBytes).toBeLessThanOrEqual(
    BUDGETS.sharedCompressedBytes,
  );
  expect(snapshot.assets.sharedCompressedBytes).toBeGreaterThan(
    snapshot.assets.entryCompressedBytes,
  );

  expect(snapshot.totalEstimatedDecodedRgbaMipBytes).toBeLessThanOrEqual(
    BUDGETS.totalDecodedRgbaMipBytes,
  );
}

function formatBudgetLine(label: string, snapshot: BeachRuntimeSnapshot): string {
  return [
    `BEACH BUDGET ${label}`,
    `scene=${snapshot.scene.id}`,
    `tier=${snapshot.qualityTier}`,
    `reflection=${snapshot.water.reflectionEnabled}`,
    `adaptiveReductions=${snapshot.adaptiveReductionCount}`,
    `dpr=${snapshot.renderer.dpr}`,
    `calls=${snapshot.renderer.calls}`,
    `triangles=${snapshot.renderer.triangles}`,
    `photoBytes=${snapshot.photos.decodedRgbaMipBytes}`,
    `decodedBytes=${snapshot.totalEstimatedDecodedRgbaMipBytes}`,
    `entryCompressed=${snapshot.assets.entryCompressedBytes}`,
    `sharedCompressed=${snapshot.assets.sharedCompressedBytes}`,
  ].join(" ");
}

async function readBandStatistics(
  locator: Locator,
  band?: { readonly heightRatio: number; readonly topRatio: number },
): Promise<BandStatistics> {
  const png = await locator.screenshot({ animations: "disabled" });
  let image = sharp(png);

  if (band) {
    const metadata = await image.metadata();
    const width = metadata.width ?? 0;
    const height = metadata.height ?? 0;
    image = sharp(png).extract({
      height: Math.max(1, Math.round(height * band.heightRatio)),
      left: 0,
      top: Math.round(height * band.topRatio),
      width,
    });
  }

  const { data, info } = await image
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const pixelCount = info.width * info.height;
  let brightPixels = 0;
  let nearBlackPixels = 0;
  let luminanceSum = 0;
  let luminanceSquaredSum = 0;
  let minimumLuminance = Number.POSITIVE_INFINITY;
  let maximumLuminance = Number.NEGATIVE_INFINITY;
  let redSum = 0;
  let greenSum = 0;
  let blueSum = 0;

  for (let index = 0; index < data.length; index += info.channels) {
    const red = data[index] ?? 0;
    const green = data[index + 1] ?? 0;
    const blue = data[index + 2] ?? 0;
    const luminance = red * 0.2126 + green * 0.7152 + blue * 0.0722;

    if (luminance >= 12) brightPixels += 1;
    if (luminance < 2) nearBlackPixels += 1;
    luminanceSum += luminance;
    luminanceSquaredSum += luminance * luminance;
    minimumLuminance = Math.min(minimumLuminance, luminance);
    maximumLuminance = Math.max(maximumLuminance, luminance);
    redSum += red;
    greenSum += green;
    blueSum += blue;
  }

  const meanLuminance = luminanceSum / pixelCount;

  return {
    brightPixelRatio: brightPixels / pixelCount,
    luminanceRange: maximumLuminance - minimumLuminance,
    luminanceStandardDeviation: Math.sqrt(
      Math.max(0, luminanceSquaredSum / pixelCount - meanLuminance * meanLuminance),
    ),
    meanBlue: blueSum / pixelCount,
    meanGreen: greenSum / pixelCount,
    meanLuminance,
    meanRed: redSum / pixelCount,
    nearBlackPixelRatio: nearBlackPixels / pixelCount,
  };
}

/**
 * The world renders on demand, so a passive page produces no frames. Drive it
 * with a pointer move per animation frame and time the gaps between frames.
 * The first two gaps are dropped — they carry the recorder's own setup cost.
 */
async function measureFrameCost(page: Page) {
  await page.getByTestId("beach-journey-canvas").evaluate((element) => {
    const scope = window as typeof window & { __beachFrameTicks?: number[] };
    scope.__beachFrameTicks = [];
    const tick = () => {
      scope.__beachFrameTicks?.push(performance.now());
      element.dispatchEvent(
        new PointerEvent("pointermove", { bubbles: true, clientX: 10 }),
      );
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });

  await page.waitForTimeout(FRAME_SAMPLE_MS);

  return page.evaluate(() => {
    const scope = window as typeof window & { __beachFrameTicks?: number[] };
    const ticks = scope.__beachFrameTicks ?? [];
    const gaps = ticks
      .slice(1)
      .map((value, index) => Math.round(value - (ticks[index] ?? value)))
      .slice(2);
    const sorted = [...gaps].sort((first, second) => first - second);
    return {
      frames: gaps.length,
      medianMs: sorted[Math.floor(sorted.length / 2)] ?? 0,
      p90Ms: sorted[Math.floor(sorted.length * 0.9)] ?? 0,
    };
  });
}

async function bootToGate(page: Page) {
  await page.goto(LAB_PATH);
  const canvas = page.getByTestId("beach-journey-canvas");
  await expect(canvas).toHaveAttribute("data-world-ready", "true");
  await expect(page.getByTestId("beach-journey-enter")).toBeEnabled();
  return canvas;
}

async function enterBeach(page: Page) {
  await page.getByTestId("beach-journey-enter").click();
  await expect(page.getByTestId("beach-journey-stage")).toHaveAttribute(
    "data-journey-phase",
    "settled",
  );
}

/** Walks Next until the scene id satisfies `matches`, then returns that id. */
async function walkUntil(page: Page, matches: (sceneId: string) => boolean) {
  const stage = page.getByTestId("beach-journey-stage");

  for (let step = 0; step < 20; step += 1) {
    const sceneId = await stage.getAttribute("data-current-scene-id");
    if (sceneId && matches(sceneId)) return sceneId;
    await page.getByTestId("beach-journey-next").click();
    await expect(stage).toHaveAttribute("data-journey-phase", "settled");
  }

  throw new Error("Walked the whole beach rail without matching the target scene");
}

async function captureSceneScreenshot(
  canvas: Locator,
  testInfo: TestInfo,
  label: string,
) {
  const path = testInfo.outputPath(`beach-${label}.png`);
  await canvas.screenshot({ animations: "disabled", path });
  await testInfo.attach(`beach-${label}`, { contentType: "image/png", path });
}

test.describe("beach desktop budgets", () => {
  test.use({ deviceScaleFactor: 2, viewport: DESKTOP_VIEWPORT });

  test("the gate, a gallery scene and the finale all stay inside budget", async ({
    page,
  }, testInfo) => {
    const canvas = await bootToGate(page);

    const gate = await readBeachRuntimeDiagnostics(page);
    console.log(formatBudgetLine("gate", gate));
    expectBeachRuntimeBudget(gate, { mobile: false });
    expect(gate.scene.id).toBe("cover-gate");
    // No gallery photograph has been leased at the threshold.
    expect(gate.photos.decodedRgbaMipBytes).toBe(0);
    expect(gate.photos.textureCount).toBe(0);
    await captureSceneScreenshot(canvas, testInfo, "gate");

    await enterBeach(page);

    const galleryId = await walkUntil(page, (id) => id.startsWith("gallery-photo"));
    const gallery = await readBeachRuntimeDiagnostics(page);
    console.log(formatBudgetLine(`gallery(${galleryId})`, gallery));
    expectBeachRuntimeBudget(gallery, { mobile: false });
    expect(gallery.scene.type).toBe("gallery-photo");
    // The photo cap is the reason this scene fits: uncapped uploads of the
    // 1363x2048 source cost 44.6 MB for three and broke the 64 MB ceiling.
    expect(gallery.photos.decodedRgbaMipBytes).toBeGreaterThan(0);
    expect(gallery.photos.decodedRgbaMipBytes).toBeLessThanOrEqual(20_000_000);
    await captureSceneScreenshot(canvas, testInfo, "gallery");

    await walkUntil(page, (id) => id === "finale");
    const finale = await readBeachRuntimeDiagnostics(page);
    console.log(formatBudgetLine("finale", finale));
    expectBeachRuntimeBudget(finale, { mobile: false });
    expect(finale.scene.id).toBe("finale");
    await captureSceneScreenshot(canvas, testInfo, "finale");
  });

  test("every hanging frame renders as a real wooden object, never a placeholder", async ({
    page,
  }) => {
    await bootToGate(page);
    await enterBeach(page);
    await walkUntil(page, (id) => id.startsWith("gallery-photo"));

    const snapshot = await readBeachRuntimeDiagnostics(page);
    console.log(
      `BEACH FRAMES instances=${snapshot.frames.instanceCount} modelFallbacks=${snapshot.frames.modelFallbackCount}`,
    );
    expect(snapshot.frames.instanceCount).toBe(3);
    expect(snapshot.frames.modelFallbackCount).toBe(0);
  });

  test("the shoreline is a bright sunrise over white sand", async ({
    page,
  }) => {
    const canvas = await bootToGate(page);
    await enterBeach(page);
    await walkUntil(page, (id) => id === "venue");

    const sky = await readBandStatistics(canvas, SKY_BAND);
    const horizon = await readBandStatistics(canvas, HORIZON_BAND);
    const water = await readBandStatistics(canvas, WATER_BAND);
    const sand = await readBandStatistics(canvas, SAND_BAND);
    console.log(`BEACH BAND sky ${JSON.stringify(sky)}`);
    console.log(`BEACH BAND horizon ${JSON.stringify(horizon)}`);
    console.log(`BEACH BAND water ${JSON.stringify(water)}`);
    console.log(`BEACH BAND sand ${JSON.stringify(sand)}`);

    // A *bright* sunrise, not the dim golden hour the coastal HDRI gave: the
    // measured sky mean is 204 where the old scene's floor was 40. A sky that
    // fell back under 150 would mean the exposure or the HDRI had regressed.
    expect(sky.meanLuminance).toBeGreaterThan(150);
    expect(sky.brightPixelRatio).toBeGreaterThan(0.9);
    // The zenith still reads blue. A red-dominant zenith would mean the whole
    // sky had been tinted rather than lit.
    expect(sky.meanBlue).toBeGreaterThan(sky.meanRed);
    // ...and the warmth still concentrates at the horizon, where the sun is.
    expect(horizon.meanRed).toBeGreaterThan(horizon.meanBlue);
    expect(horizon.meanRed - horizon.meanBlue).toBeGreaterThan(
      sky.meanRed - sky.meanBlue,
    );

    // The sun has to be *visible*, not merely present as light: a disk clipping
    // toward white puts the band's brightest pixel far above its mean. The
    // measured sky range is 252.7 of a possible 255.
    expect(sky.luminanceRange).toBeGreaterThan(200);

    // The water must reflect the sky, not swallow it. A black sea was the
    // failure mode the forest lab's ACES toe produced.
    expect(water.meanLuminance).toBeGreaterThan(20);
    expect(water.nearBlackPixelRatio).toBeLessThan(0.02);

    // White sand, and still textured. The measured sand mean is 132 against the
    // old scene's 25 floor — the whole point of regrading `sand_03` — and the
    // standard deviation proves it is grain rather than a flat fill.
    expect(sand.meanLuminance).toBeGreaterThan(100);
    expect(sand.luminanceStandardDeviation).toBeGreaterThan(4);
    expect(sand.nearBlackPixelRatio).toBeLessThan(0.02);
  });
});

test.describe("beach mobile budgets", () => {
  test.use({ deviceScaleFactor: 3, viewport: MOBILE_VIEWPORT });

  test("mobile holds the tighter draw-call and triangle budgets", async ({ page }) => {
    await bootToGate(page);

    const gate = await readBeachRuntimeDiagnostics(page);
    console.log(formatBudgetLine("mobile-gate", gate));
    expectBeachRuntimeBudget(gate, { mobile: true });

    await enterBeach(page);
    const galleryId = await walkUntil(page, (id) => id.startsWith("gallery-photo"));
    const gallery = await readBeachRuntimeDiagnostics(page);
    console.log(formatBudgetLine(`mobile-gallery(${galleryId})`, gallery));
    expectBeachRuntimeBudget(gallery, { mobile: true });

    // The mobile world thins its scatter rather than its content: 12 tables
    // against the desktop tier's 18.
    expect(gallery.tables.instanceCount).toBeLessThan(18);
    expect(gallery.frames.instanceCount).toBe(3);
  });
});

test.describe("beach frame cost", () => {
  test.use({ deviceScaleFactor: 2, viewport: DESKTOP_VIEWPORT });

  test("frame cost and the water reflection's share of it", async ({ browser }) => {
    const measure = async (reducedMotion: "no-preference" | "reduce") => {
      const context = await browser.newContext({
        deviceScaleFactor: 2,
        reducedMotion,
        viewport: DESKTOP_VIEWPORT,
      });
      const page = await context.newPage();
      try {
        await bootToGate(page);
        const snapshot = await readBeachRuntimeDiagnostics(page);
        const cost = await measureFrameCost(page);
        return {
          cost,
          reflectionEnabled: snapshot.water.reflectionEnabled,
          tier: snapshot.qualityTier,
        };
      } finally {
        await context.close();
      }
    };

    const withReflection = await measure("no-preference");
    const withoutReflection = await measure("reduce");

    console.log(
      `BEACH FRAME reflection=on tier=${withReflection.tier} ${
        JSON.stringify(withReflection.cost)
      }`,
    );
    console.log(
      `BEACH FRAME reflection=off tier=${withoutReflection.tier} ${
        JSON.stringify(withoutReflection.cost)
      }`,
    );
    console.log(
      `BEACH FRAME reflectionCostMs=${
        withReflection.cost.medianMs - withoutReflection.cost.medianMs
      } forestBaselineMs=${FOREST_BASELINE_FRAME_MS}`,
    );

    expect(withReflection.reflectionEnabled).toBe(true);
    expect(withoutReflection.reflectionEnabled).toBe(false);

    // The premise of this whole change is that a shoreline is dramatically
    // cheaper than a forest. If this ever fails, the finding is about the
    // premise, not about the threshold.
    expect(withReflection.cost.frames).toBeGreaterThan(60);
    expect(withReflection.cost.medianMs).toBeGreaterThan(0);
    expect(withReflection.cost.medianMs).toBeLessThanOrEqual(BEACH_FRAME_BUDGET_MS);
    expect(withReflection.cost.medianMs).toBeLessThan(FOREST_BASELINE_FRAME_MS / 2);

    // Turning the reflection off must not cost more than leaving it on.
    expect(withoutReflection.cost.medianMs).toBeLessThanOrEqual(
      withReflection.cost.medianMs,
    );
  });
});

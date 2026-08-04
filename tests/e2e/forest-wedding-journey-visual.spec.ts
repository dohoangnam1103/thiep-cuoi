import { expect, test } from "@playwright/test";
import sharp from "sharp";

/**
 * Visual smoke checks for the photoreal forest world. These deliberately assert
 * *statistics* of the rendered frame rather than pixel-exact snapshots: the
 * hybrid world uses demand rendering, wind drift, and adaptive DPR, so a golden
 * image would be flaky while a colour/contrast profile still catches the
 * regressions we care about — a black canvas, a flat untextured ground, a grey
 * (non-emerald) canopy, unreadable ivory paper, or a neighbouring scene leaking
 * into the active clearing.
 */
const LAB_PATH = "/lab/forest-wedding-journey";
const FOREST_SCENE_IDS = [
  "cover-gate",
  "families",
  "opening-message",
  "calendar",
  "schedule",
  "gallery-photo:memory-01",
  "gallery-photo:memory-02",
  "gallery-photo:memory-03",
  "dress-code",
  "venue",
  "map",
  "rsvp",
  "wishes",
  "gift",
  "finale",
] as const;

type ForestVisualSceneId = (typeof FOREST_SCENE_IDS)[number];

/** Canopy band: the upper frame, where conifer foliage must dominate. */
const CANOPY_BAND = { heightRatio: 0.35, topRatio: 0 } as const;
/** Ground band: the lower frame, where terrain and grass detail must appear. */
const GROUND_BAND = { heightRatio: 0.3, topRatio: 0.7 } as const;

type ForestBandStatistics = {
  readonly brightPixelRatio: number;
  readonly luminanceRange: number;
  readonly luminanceStandardDeviation: number;
  readonly meanBlue: number;
  readonly meanGreen: number;
  readonly meanLuminance: number;
  readonly meanRed: number;
  readonly nearBlackPixelRatio: number;
};

async function readBandStatistics(
  locator: import("@playwright/test").Locator,
  band?: { readonly heightRatio: number; readonly topRatio: number },
): Promise<ForestBandStatistics> {
  const screenshot = await locator.screenshot({ animations: "disabled" });
  let image = sharp(screenshot);

  if (band) {
    const metadata = await image.metadata();
    const sourceWidth = metadata.width ?? 0;
    const sourceHeight = metadata.height ?? 0;
    const top = Math.round(sourceHeight * band.topRatio);
    const height = Math.max(1, Math.min(
      sourceHeight - top,
      Math.round(sourceHeight * band.heightRatio),
    ));
    image = image.extract({ height, left: 0, top, width: sourceWidth });
  }

  const { data, info } = await image
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  let brightPixels = 0;
  let nearBlackPixels = 0;
  let luminanceSum = 0;
  let luminanceSquareSum = 0;
  let maximum = 0;
  let minimum = 255;
  let blueSum = 0;
  let greenSum = 0;
  let redSum = 0;

  for (let offset = 0; offset < data.length; offset += info.channels) {
    const red = data[offset]!;
    const green = data[offset + 1]!;
    const blue = data[offset + 2]!;
    const luminance = red * 0.2126 + green * 0.7152 + blue * 0.0722;
    brightPixels += luminance >= 12 ? 1 : 0;
    nearBlackPixels += luminance < 2 ? 1 : 0;
    luminanceSum += luminance;
    luminanceSquareSum += luminance * luminance;
    maximum = Math.max(maximum, luminance);
    minimum = Math.min(minimum, luminance);
    blueSum += blue;
    greenSum += green;
    redSum += red;
  }

  const pixelCount = info.width * info.height;
  const meanLuminance = luminanceSum / pixelCount;
  return {
    brightPixelRatio: brightPixels / pixelCount,
    luminanceRange: maximum - minimum,
    luminanceStandardDeviation: Math.sqrt(Math.max(
      0,
      luminanceSquareSum / pixelCount - meanLuminance * meanLuminance,
    )),
    meanBlue: blueSum / pixelCount,
    meanGreen: greenSum / pixelCount,
    meanLuminance,
    meanRed: redSum / pixelCount,
    nearBlackPixelRatio: nearBlackPixels / pixelCount,
  };
}

async function enterForestJourney(page: import("@playwright/test").Page) {
  await page.goto(LAB_PATH);
  const canvas = page.getByTestId("forest-journey-canvas");
  await expect(canvas).toHaveAttribute("data-world-ready", "true");
  await expect(canvas).toHaveAttribute("data-world-mode", "hybrid");
  await expect(canvas).toHaveAttribute(
    "data-world-skin",
    "forest-wedding-photoreal",
  );
  return canvas;
}

async function navigateToForestScene(
  page: import("@playwright/test").Page,
  expectedSceneId: ForestVisualSceneId,
) {
  const stage = page.getByTestId("forest-journey-stage");
  const targetIndex = FOREST_SCENE_IDS.indexOf(expectedSceneId);

  for (let attempt = 0; attempt < FOREST_SCENE_IDS.length; attempt += 1) {
    const currentSceneId = await stage.getAttribute("data-current-scene-id");
    if (currentSceneId === expectedSceneId) return;
    const currentIndex = FOREST_SCENE_IDS.indexOf(
      currentSceneId as ForestVisualSceneId,
    );
    expect(currentIndex).toBeGreaterThanOrEqual(0);
    await page
      .getByTestId(`forest-journey-${currentIndex < targetIndex ? "next" : "previous"}`)
      .click();
    await expect(stage).toHaveAttribute("data-journey-phase", "settled");
  }

  throw new Error(`Could not navigate to forest scene ${expectedSceneId}`);
}

function expectPaintedForestFrame(
  statistics: ForestBandStatistics,
  label: string,
) {
  expect(statistics.meanLuminance, `${label} must not be a black frame`)
    .toBeGreaterThan(8);
  expect(statistics.brightPixelRatio, `${label} must contain painted pixels`)
    .toBeGreaterThan(0.08);
  expect(statistics.luminanceRange, `${label} must not be a flat fill`)
    .toBeGreaterThan(16);
}

function expectEmeraldCanopy(
  statistics: ForestBandStatistics,
  label: string,
) {
  // The design target is a dense emerald conifer garden, so foliage must read
  // green rather than the grey a missing/failed albedo texture would produce.
  expect(statistics.meanGreen, `${label} canopy must be green-dominant over red`)
    .toBeGreaterThan(statistics.meanRed);
  expect(statistics.meanGreen, `${label} canopy must be green-dominant over blue`)
    .toBeGreaterThan(statistics.meanBlue);
  // Whatever the camera pitch, the frame above the canopy must resolve to sky
  // haze. Pure black there means the scene atmosphere never installed, or the
  // camera cleared the backdrop's open top rim into the renderer's clear
  // colour — both of which read as a hole punched in the forest.
  expect(
    statistics.nearBlackPixelRatio,
    `${label} canopy must not expose a black void above the treeline`,
  ).toBeLessThan(0.02);
}

function expectTexturedGround(
  statistics: ForestBandStatistics,
  label: string,
) {
  // A procedural flat-colour ground has almost no local variation; PBR terrain
  // plus grass and wildflowers keeps the deviation well above this floor.
  expect(
    statistics.luminanceStandardDeviation,
    `${label} ground must show terrain and grass detail`,
  ).toBeGreaterThan(6);
}

async function expectSingleInteractiveClearing(
  page: import("@playwright/test").Page,
  expectedSceneId: ForestVisualSceneId,
) {
  const interactiveSurfaces = page.locator(
    '[data-forest-interactive="true"][data-forest-scene-id]',
  );
  await expect(interactiveSurfaces).toHaveCount(1);
  await expect(interactiveSurfaces).toHaveAttribute(
    "data-forest-scene-id",
    expectedSceneId,
  );
  // Neighbouring clearings stay mounted for depth, but must never leak an
  // interactive or focusable surface into the active scene.
  expect(await page.locator("[data-forest-scene-id]").evaluateAll((surfaces, activeId) => (
    surfaces.every((surface) => (
      surface.getAttribute("data-forest-scene-id") === activeId
      || (surface.getAttribute("aria-hidden") === "true" && surface.hasAttribute("inert"))
    ))
  ), expectedSceneId)).toBe(true);
}

async function expectReadableIvoryPaper(
  page: import("@playwright/test").Page,
  label: string,
) {
  // Measured on the heading rather than the whole surface: a gallery clearing is
  // deliberately dominated by its wedding photograph, so a surface-wide mean
  // would track the photo's exposure instead of the paper's legibility.
  const heading = page.locator(
    '[data-forest-interactive="true"][data-forest-scene-id] h2',
  );
  const statistics = await readBandStatistics(heading);
  expect(statistics.meanLuminance, `${label} paper must stay bright ivory`)
    .toBeGreaterThan(120);
  expect(statistics.luminanceRange, `${label} paper must keep legible ink contrast`)
    .toBeGreaterThan(80);
}

const FOREST_VISUAL_VIEWPORTS = [
  { height: 900, label: "desktop", width: 1_440 },
  { height: 844, label: "mobile", width: 390 },
] as const;

for (const viewport of FOREST_VISUAL_VIEWPORTS) {
  test.describe(`${viewport.label} photoreal forest look`, () => {
    test.use({ viewport: { height: viewport.height, width: viewport.width } });

    test("the gate frame paints an emerald canopy over textured ground", async ({
      page,
    }) => {
      const canvas = await enterForestJourney(page);

      expectPaintedForestFrame(await readBandStatistics(canvas), "gate frame");
      expectEmeraldCanopy(
        await readBandStatistics(canvas, CANOPY_BAND),
        "gate",
      );
      expectTexturedGround(
        await readBandStatistics(canvas, GROUND_BAND),
        "gate",
      );
    });

    test("families, gallery, RSVP, and finale keep depth and readable paper", async ({
      page,
    }) => {
      // Walking a third of the rail costs one settle per scene, well past the
      // suite-wide allowance.
      test.setTimeout(180_000);
      const canvas = await enterForestJourney(page);
      await page.getByTestId("forest-journey-enter").click();
      await expect(page.getByTestId("forest-journey-stage")).toHaveAttribute(
        "data-journey-phase",
        "settled",
      );

      for (const sceneId of [
        "families",
        "gallery-photo:memory-01",
        "rsvp",
        "finale",
      ] as const) {
        await navigateToForestScene(page, sceneId);
        await expectSingleInteractiveClearing(page, sceneId);
        expectPaintedForestFrame(await readBandStatistics(canvas), `${sceneId} frame`);
        expectEmeraldCanopy(
          await readBandStatistics(canvas, CANOPY_BAND),
          sceneId,
        );
        expectTexturedGround(
          await readBandStatistics(canvas, GROUND_BAND),
          sceneId,
        );
        await expectReadableIvoryPaper(page, sceneId);
      }
    });
  });
}

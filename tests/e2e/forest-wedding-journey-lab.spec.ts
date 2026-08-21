import { expect, test } from "@playwright/test";
import sharp from "sharp";

const LAB_PATH = "/lab/forest-wedding-journey";
/**
 * Hybrid mode blocks entry on the photoreal PBR set, so readiness and
 * blocking-failure contracts have to intercept those requests rather than the
 * legacy `materials/` atlases, which only load once the photoreal boundary
 * falls back to the textured world.
 */
const FOREST_PHOTOREAL_BLOCKING_ASSET_GLOB =
  "**/chungdoi/labs/forest-wedding-journey/photoreal/ground-color.webp";
const FOREST_LEGACY_BLOCKING_ASSET_GLOB =
  "**/chungdoi/labs/forest-wedding-journey/materials/foliage-atlas.webp";
const FOREST_RUNTIME_DIAGNOSTICS_ENABLED = process.env.FOREST_RUNTIME_DIAGNOSTICS === "1";
const TASK_TEN_PHYSICAL_SCENES = [
  { id: "families", name: "Hai bên gia đình", type: "families" },
  { id: "opening-message", name: "Lời ngỏ", type: "opening-message" },
  { id: "calendar", name: "Lịch ngày vui", type: "calendar" },
  { id: "schedule", name: "Lịch trình", type: "schedule" },
  { id: "gallery-photo:memory-01", name: "Khoảnh khắc", type: "gallery-photo" },
  { id: "gallery-photo:memory-02", name: "Khoảnh khắc", type: "gallery-photo" },
  { id: "gallery-photo:memory-03", name: "Khoảnh khắc", type: "gallery-photo" },
  { id: "dress-code", name: "Trang phục", type: "dress-code" },
  { id: "venue", name: "Địa điểm", type: "venue" },
] as const;
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

type ForestCameraSample = {
  progress: number;
  renderedYaw: number;
  x: number;
  y: number;
  z: number;
};

type ForestRuntimeDiagnosticsSnapshot = {
  readonly adaptiveReductionCount: number;
  readonly ambientCount: number;
  readonly assets: {
    readonly entryCompressedBytes: number;
    readonly entryDecodedRgbaMipBytes: number;
    readonly sharedCompressedBytes: number;
    readonly sharedDecodedRgbaMipBytes: number;
  };
  readonly chunks: {
    readonly count: number;
    readonly lodTreeCounts: {
      readonly hero: number;
      readonly impostor: number;
      readonly mid: number;
    };
    readonly residentIndices: readonly number[];
  };
  readonly environment: {
    readonly decodedRgbaMipBytes: number;
    readonly mode: "hybrid" | "procedural" | "textured";
    readonly textures: readonly {
      readonly decodedRgbaMipBytes: number;
      readonly height: number;
      readonly id: string;
      readonly src: string;
      readonly width: number;
    }[];
  };
  readonly hiddenAmbientCount: number;
  readonly petals: {
    readonly instanceCount: number;
    readonly transformHash: string;
  };
  readonly photos: {
    readonly activeLeases: number;
    readonly decodedRgbaMipBytes: number;
    readonly liveCount: number;
    readonly retainedCount: number;
    readonly textures: readonly {
      readonly decodedRgbaMipBytes: number | null;
      readonly height: number | null;
      readonly leases: number;
      readonly retained: boolean;
      readonly src: string;
      readonly width: number | null;
    }[];
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
  readonly wildlife: {
    readonly optionalActorCount: number;
  };
  readonly worldMode: "hybrid" | "loading" | "procedural" | "textured";
};

/** Hybrid entry pack: seven PBR/backdrop textures, exact mip summation. */
const HYBRID_ENVIRONMENT_DECODED_BYTES = 15_379_116;
/** Three live gallery photos, measured from the decoded texture cache. */
const GALLERY_PHOTO_DECODED_BYTES = 44_649_828;
/** Manifest-estimated ceilings from the design spec. */
const ENTRY_PAYLOAD_COMPRESSED_CEILING = 4_000_000;
const SHARED_PAYLOAD_COMPRESSED_CEILING = 12_000_000;
/** Ambient roster (5) plus the scripted rabbits and doves (7). */
const WILDLIFE_ACTOR_COUNT = 12;

async function readForestRuntimeDiagnostics(
  page: import("@playwright/test").Page,
): Promise<ForestRuntimeDiagnosticsSnapshot> {
  return page.evaluate(() => {
    const diagnosticWindow = window as typeof window & {
      __forestWeddingJourneyDiagnostics?: () => ForestRuntimeDiagnosticsSnapshot;
    };
    if (typeof diagnosticWindow.__forestWeddingJourneyDiagnostics !== "function") {
      throw new Error("Forest runtime diagnostics API is unavailable");
    }
    return diagnosticWindow.__forestWeddingJourneyDiagnostics();
  });
}

function expectForestRuntimeBudget(
  snapshot: ForestRuntimeDiagnosticsSnapshot,
  viewport: "desktop" | "mobile",
) {
  const mobile = viewport === "mobile";
  expect(snapshot.viewport).toBe(viewport);
  expect(snapshot.renderer.dpr).toBe(mobile ? 1 : 1.25);
  expect(snapshot.renderer.calls).toBeGreaterThan(0);
  expect(snapshot.renderer.calls).toBeLessThanOrEqual(mobile ? 80 : 120);
  expect(snapshot.renderer.triangles).toBeGreaterThan(0);
  expect(snapshot.renderer.triangles).toBeLessThanOrEqual(
    mobile ? 150_000 : 250_000,
  );
  expect(snapshot.renderer.frame).toBeGreaterThan(0);
  expect(snapshot.renderer.geometries).toBeGreaterThan(0);
  expect(snapshot.renderer.textures).toBeGreaterThan(0);
  expect(snapshot.photos.retainedCount).toBeLessThanOrEqual(3);
  expect(snapshot.photos.liveCount).toBeLessThanOrEqual(3);
  expect(snapshot.worldMode).toBe("hybrid");
  expect(snapshot.environment.mode).toBe("hybrid");
  expect(snapshot.environment.textures).toHaveLength(7);
  expect(snapshot.environment.textures.every(({ height, width }) => (
    height <= 1_024 && width <= 1_024
  ))).toBe(true);

  // Only the entry group may block readiness, so its payload carries the
  // tighter ceiling; the optional wildlife atlas rides in the shared total.
  expect(snapshot.assets.entryCompressedBytes).toBeLessThanOrEqual(
    ENTRY_PAYLOAD_COMPRESSED_CEILING,
  );
  expect(snapshot.assets.sharedCompressedBytes).toBeLessThanOrEqual(
    SHARED_PAYLOAD_COMPRESSED_CEILING,
  );
  expect(snapshot.assets.sharedCompressedBytes).toBeGreaterThan(
    snapshot.assets.entryCompressedBytes,
  );
  expect(snapshot.assets.sharedDecodedRgbaMipBytes).toBeGreaterThan(
    snapshot.assets.entryDecodedRgbaMipBytes,
  );

  // Chunk residency is what bounds alpha-foliage fill rate. Trees carry a
  // wider window than undergrowth so the corridor stays closed past the
  // impostor band — desktop keeps three chunks either side, mobile two — and a
  // hop long enough to separate the two neighbourhoods keeps `radius + 1`
  // chunks at each end instead of the whole rail between them.
  expect(snapshot.chunks.count).toBeGreaterThan(0);
  expect(snapshot.chunks.residentIndices.length).toBeGreaterThan(0);
  expect(snapshot.chunks.residentIndices.length).toBeLessThanOrEqual(
    mobile ? 6 : 8,
  );
  expect(snapshot.chunks.residentIndices).toEqual(
    [...snapshot.chunks.residentIndices].sort((first, second) => first - second),
  );
  expect(snapshot.chunks.residentIndices.every((index) => (
    index >= 0 && index < snapshot.chunks.count
  ))).toBe(true);
  const treeTotal = snapshot.chunks.lodTreeCounts.hero
    + snapshot.chunks.lodTreeCounts.impostor
    + snapshot.chunks.lodTreeCounts.mid;
  expect(treeTotal).toBeGreaterThan(0);

  expect(snapshot.petals.instanceCount).toBeGreaterThan(0);
  expect(snapshot.petals.transformHash).toMatch(/^[0-9a-f]{8}$/);
  // Five ambient actors plus the seven scripted ones (two rabbits, two gate
  // doves, three finale doves) that replaced the sphere-built animals. This is a
  // live census of what is mounted, so a failed atlas reports zero.
  expect(snapshot.wildlife.optionalActorCount).toBe(WILDLIFE_ACTOR_COUNT);

  if (mobile) {
    expect(snapshot.totalEstimatedDecodedRgbaMipBytes).toBeLessThanOrEqual(
      64_000_000,
    );
  }
}

async function captureForestRuntimeBudgetJourney(
  page: import("@playwright/test").Page,
) {
  await page.goto(LAB_PATH);
  const canvas = page.getByTestId("forest-journey-canvas");
  const stage = page.getByTestId("forest-journey-stage");
  await expect(canvas).toHaveAttribute("data-world-ready", "true");
  await expect(page.getByTestId("forest-journey-enter")).toBeEnabled();

  const gate = await readForestRuntimeDiagnostics(page);
  await page.getByTestId("forest-journey-enter").click();
  await expect(stage).toHaveAttribute("data-journey-phase", "settled");
  await navigateToForestScene(page, "gallery-photo:memory-02");
  await expect.poll(async () => (
    await readForestRuntimeDiagnostics(page)
  ).photos.decodedRgbaMipBytes).toBe(GALLERY_PHOTO_DECODED_BYTES);
  const gallery = await readForestRuntimeDiagnostics(page);

  await navigateToForestScene(page, "gift");
  const gift = await readForestRuntimeDiagnostics(page);
  await navigateToForestScene(page, "finale");
  const finale = await readForestRuntimeDiagnostics(page);
  return { finale, gallery, gate, gift };
}

async function installForestCameraRecorder(
  page: import("@playwright/test").Page,
) {
  await page.getByTestId("forest-journey-canvas").evaluate((element) => {
    const cameraWindow = window as typeof window & {
      __forestCameraCuePeak: number;
      __forestCameraSamples: ForestCameraSample[];
      __forestTaskNineCanvas: HTMLCanvasElement | null;
    };
    const attributes = [
      "data-camera-x",
      "data-camera-y",
      "data-camera-z",
      "data-rendered-look-yaw",
      "data-travel-progress",
    ];
    cameraWindow.__forestCameraCuePeak = 0;
    cameraWindow.__forestCameraSamples = [];
    cameraWindow.__forestTaskNineCanvas = element.querySelector("canvas");

    const capture = () => {
      const stage = element.closest<HTMLElement>(
        '[data-testid="forest-journey-stage"]',
      );
      if (stage?.dataset.journeyPhase !== "travelling") return;
      if (!attributes.every((attribute) => element.hasAttribute(attribute))) return;
      const sample = {
        progress: Number(element.getAttribute("data-travel-progress")),
        renderedYaw: Number(element.getAttribute("data-rendered-look-yaw")),
        x: Number(element.getAttribute("data-camera-x")),
        y: Number(element.getAttribute("data-camera-y")),
        z: Number(element.getAttribute("data-camera-z")),
      };
      if (Object.values(sample).every(Number.isFinite)) {
        cameraWindow.__forestCameraSamples.push(sample);
      }
      cameraWindow.__forestCameraCuePeak = Math.max(
        cameraWindow.__forestCameraCuePeak,
        Number(element.getAttribute("data-cue-dove-flight")) || 0,
        Number(element.getAttribute("data-cue-petal-gust")) || 0,
        Number(element.getAttribute("data-cue-rabbit-guide")) || 0,
        Number(element.getAttribute("data-cue-voile-lift")) || 0,
        Number(element.getAttribute("data-cue-wind-strength")) || 0,
      );
    };

    new MutationObserver(capture).observe(element, {
      attributeFilter: [
        ...attributes,
        "data-cue-dove-flight",
        "data-cue-petal-gust",
        "data-cue-rabbit-guide",
        "data-cue-voile-lift",
        "data-cue-wind-strength",
      ],
      attributes: true,
    });
  });
}

async function readForestCameraRecording(
  page: import("@playwright/test").Page,
) {
  return page.evaluate(() => {
    const cameraWindow = window as typeof window & {
      __forestCameraCuePeak: number;
      __forestCameraSamples: ForestCameraSample[];
    };
    return {
      cuePeak: cameraWindow.__forestCameraCuePeak,
      samples: cameraWindow.__forestCameraSamples,
    };
  });
}

async function forceWebglFallback(page: import("@playwright/test").Page) {
  await page.addInitScript(() => {
    Object.defineProperty(HTMLCanvasElement.prototype, "getContext", {
      configurable: true,
      value: () => null,
    });
  });
}

async function findGesturePoint(
  page: import("@playwright/test").Page,
  verticalFractions: readonly number[] = [0.75, 0.2, 0.88, 0.12],
) {
  const gestureSurface = page.getByTestId("forest-journey-gesture-surface");
  return gestureSurface.evaluate((element, fractions) => {
    const bounds = element.getBoundingClientRect();

    for (const verticalFraction of fractions) {
      for (const horizontalFraction of [0.5, 0.25, 0.75, 0.08, 0.92]) {
        const x = bounds.left + bounds.width * horizontalFraction;
        const y = bounds.top + bounds.height * verticalFraction;
        const hit = document.elementFromPoint(x, y);

        if (hit === element || (hit !== null && element.contains(hit))) {
          return { x, y };
        }
      }
    }

    throw new Error("No hit-tested point belongs to the forest gesture surface");
  }, verticalFractions);
}

async function enterFallback(page: import("@playwright/test").Page) {
  await forceWebglFallback(page);
  await page.goto(LAB_PATH);
  await expect(page.getByTestId("forest-journey-fallback")).toBeVisible();
  await expect(page.getByTestId("forest-journey-enter")).toBeEnabled();
  await page.getByTestId("forest-journey-enter").click();
  await expect(page.getByTestId("forest-journey-stage")).toHaveAttribute(
    "data-journey-phase",
    "fallback-settled",
  );
}

async function enterWebgl(page: import("@playwright/test").Page) {
  await page.goto(LAB_PATH);
  const stage = page.getByTestId("forest-journey-stage");
  await expect(stage).toHaveAttribute("data-renderer", "webgl");
  await expect(page.getByTestId("forest-journey-enter")).toBeEnabled();
  await page.getByTestId("forest-journey-enter").click();
  await expect(stage).toHaveAttribute("data-journey-phase", "settled");
  await expect(stage).toHaveAttribute("data-current-scene-id", "families");
}

async function advanceForestScene(
  page: import("@playwright/test").Page,
  expectedSceneId: string,
) {
  const stage = page.getByTestId("forest-journey-stage");
  await page.getByTestId("forest-journey-next").click();
  await expect(stage).toHaveAttribute("data-journey-phase", /^(?:fallback-)?settled$/);
  await expect(stage).toHaveAttribute("data-current-scene-id", expectedSceneId);
}

async function navigateToForestScene(
  page: import("@playwright/test").Page,
  expectedSceneId: (typeof FOREST_SCENE_IDS)[number],
) {
  const stage = page.getByTestId("forest-journey-stage");
  const targetIndex = FOREST_SCENE_IDS.indexOf(expectedSceneId);
  expect(targetIndex).toBeGreaterThanOrEqual(0);

  for (let attempt = 0; attempt < FOREST_SCENE_IDS.length; attempt += 1) {
    const currentSceneId = await stage.getAttribute("data-current-scene-id");
    if (currentSceneId === expectedSceneId) return;

    const currentIndex = FOREST_SCENE_IDS.indexOf(
      currentSceneId as (typeof FOREST_SCENE_IDS)[number],
    );
    expect(currentIndex).toBeGreaterThanOrEqual(0);
    const direction = currentIndex < targetIndex ? "next" : "previous";
    await page.getByTestId(`forest-journey-${direction}`).click();
    await expect(stage).toHaveAttribute(
      "data-journey-phase",
      /^(?:fallback-)?settled$/,
    );
  }

  throw new Error(`Could not navigate to forest scene ${expectedSceneId}`);
}

async function expectActivePhysicalScene(
  page: import("@playwright/test").Page,
  sceneType: string,
  expectedName?: string,
) {
  const activeSurface = page.locator(
    `[data-testid="forest-scene-${sceneType}"][data-forest-interactive="true"]`,
  );
  await expect(activeSurface).toHaveCount(1);
  await expect(activeSurface).toHaveAttribute("aria-hidden", "false");
  await expect(activeSurface.locator("h2")).toHaveCount(1);
  await expect(activeSurface.locator("h2")).toHaveAttribute("tabindex", "-1");
  if (expectedName) await expect(activeSurface.locator("h2")).toHaveText(expectedName);

  const offSceneHeadings = page.locator(
    '[data-testid^="forest-scene-"]:not([data-forest-interactive="true"]) h2',
  );
  expect(await offSceneHeadings.evaluateAll((headings) => headings.every((heading) => (
    heading instanceof HTMLElement
    && heading.tabIndex < 0
    && !heading.hasAttribute("tabindex")
    && heading.closest('[aria-hidden="true"][inert]') !== null
  )))).toBe(true);
}

async function readScreenshotLuminance(
  locator: import("@playwright/test").Locator,
  crop?: {
    readonly heightRatio: number;
    readonly leftRatio: number;
    readonly topRatio: number;
    readonly widthRatio: number;
  },
) {
  const screenshot = await locator.screenshot({ animations: "disabled" });
  let image = sharp(screenshot);

  if (crop) {
    const metadata = await image.metadata();
    const sourceWidth = metadata.width ?? 0;
    const sourceHeight = metadata.height ?? 0;
    const left = Math.round(sourceWidth * crop.leftRatio);
    const top = Math.round(sourceHeight * crop.topRatio);
    const width = Math.max(1, Math.min(
      sourceWidth - left,
      Math.round(sourceWidth * crop.widthRatio),
    ));
    const height = Math.max(1, Math.min(
      sourceHeight - top,
      Math.round(sourceHeight * crop.heightRatio),
    ));
    image = image.extract({ height, left, top, width });
  }

  const { data, info } = await image
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  let brightPixels = 0;
  let maximum = 0;
  let minimum = 255;
  let total = 0;

  for (let offset = 0; offset < data.length; offset += info.channels) {
    const luminance = (
      data[offset]! * 0.2126
      + data[offset + 1]! * 0.7152
      + data[offset + 2]! * 0.0722
    );
    brightPixels += luminance >= 12 ? 1 : 0;
    maximum = Math.max(maximum, luminance);
    minimum = Math.min(minimum, luminance);
    total += luminance;
  }

  const pixelCount = info.width * info.height;
  return {
    brightPixelRatio: brightPixels / pixelCount,
    luminanceRange: maximum - minimum,
    meanLuminance: total / pixelCount,
  };
}

async function advanceToFirstGallery(page: import("@playwright/test").Page) {
  for (const sceneId of [
    "opening-message",
    "calendar",
    "schedule",
    "gallery-photo:memory-01",
  ]) {
    await advanceForestScene(page, sceneId);
  }
}

async function expectCanvasFrameIsPainted(
  canvas: import("@playwright/test").Locator,
  navigation: "forward" | "reverse",
) {
  const luminance = await readScreenshotLuminance(canvas);
  expect(
    luminance.meanLuminance,
    `${navigation} canvas screenshot must not be black`,
  ).toBeGreaterThan(8);
  expect(
    luminance.brightPixelRatio,
    `${navigation} canvas screenshot must contain painted pixels`,
  ).toBeGreaterThan(0.08);
  expect(
    luminance.luminanceRange,
    `${navigation} canvas screenshot must not be a blank flat frame`,
  ).toBeGreaterThan(16);
}

async function walkTaskTenPhysicalScenes(page: import("@playwright/test").Page) {
  await page.getByTestId("forest-journey-reduced-motion").click();
  for (let index = 0; index < TASK_TEN_PHYSICAL_SCENES.length; index += 1) {
    const expectedScene = TASK_TEN_PHYSICAL_SCENES[index]!;
    if (index > 0) await advanceForestScene(page, expectedScene.id);
    await expectActivePhysicalScene(page, expectedScene.type, expectedScene.name);
  }

  for (const sceneId of ["map", "rsvp", "wishes", "gift", "finale"]) {
    await advanceForestScene(page, sceneId);
  }
  await expectActivePhysicalScene(page, "finale", "Lời cảm ơn");
  await expect(page.getByTestId("forest-journey-next")).toBeDisabled();
}

async function readVoileProjection(page: import("@playwright/test").Page) {
  const canvasBoundary = page.getByTestId("forest-journey-canvas");
  await expect(canvasBoundary).toHaveAttribute("data-world-ready", "true");
  await expect.poll(() => canvasBoundary.evaluate((element) => [
    "data-voile-projected-left",
    "data-voile-projected-top",
    "data-voile-projected-width",
    "data-voile-projected-height",
  ].every((attribute) => {
    const value = element.getAttribute(attribute);
    return value !== null && value.trim() !== "" && Number.isFinite(Number(value));
  }))).toBe(true);

  return canvasBoundary.evaluate((element) => {
    const voile = document.querySelector<HTMLElement>(
      '[data-testid="forest-journey-voile"]',
    );
    if (!voile) throw new Error("Native forest voile is missing");

    const nativeRect = voile.getBoundingClientRect();
    const physical = {
      height: Number(element.getAttribute("data-voile-projected-height")),
      left: Number(element.getAttribute("data-voile-projected-left")),
      top: Number(element.getAttribute("data-voile-projected-top")),
      width: Number(element.getAttribute("data-voile-projected-width")),
    };

    return {
      native: {
        centerX: nativeRect.left + nativeRect.width / 2,
        centerY: nativeRect.top + nativeRect.height / 2,
        height: nativeRect.height,
        width: nativeRect.width,
      },
      physical: {
        centerX: physical.left + physical.width / 2,
        centerY: physical.top + physical.height / 2,
        height: physical.height,
        width: physical.width,
      },
    };
  });
}

test("fallback enters and walks the generated semantic scene list", async ({ page }) => {
  await enterFallback(page);
  const stage = page.getByTestId("forest-journey-stage");
  await expect(stage).toHaveAttribute(
    "data-scene",
    "families",
  );
  await page.getByTestId("forest-journey-next").click();
  await expect(stage).toHaveAttribute("data-journey-phase", "travelling");
  await expect(stage).toHaveAttribute("data-scene", "opening-message");
  await expect(stage).toHaveAttribute("data-scene-id", "opening-message");
  await expect(stage).toHaveAttribute("data-scene-index", "2");
  await expect(stage).toHaveAttribute("data-current-scene-id", "families");
  await expect(stage).toHaveAttribute("data-current-scene-index", "1");
  await expect(stage).toHaveAttribute("data-target-scene-id", "opening-message");
  await expect(stage).toHaveAttribute("data-target-scene-index", "2");
  await expect(stage).toHaveAttribute(
    "data-journey-phase",
    "fallback-settled",
  );
  await expect(stage).toHaveAttribute("data-scene", "opening-message");
  await expect(stage).toHaveAttribute("data-current-scene-id", "opening-message");
  await expect(stage).toHaveAttribute("data-current-scene-index", "2");
  await expect(stage).toHaveAttribute("data-target-scene-id", "");
  await expect(stage).toHaveAttribute("data-target-scene-index", "");
  await page.getByTestId("forest-journey-previous").click();
  await expect(stage).toHaveAttribute(
    "data-journey-phase",
    "travelling",
  );
  await expect(stage).toHaveAttribute(
    "data-journey-phase",
    "fallback-settled",
  );
  await expect(stage).toHaveAttribute(
    "data-scene",
    "families",
  );
});

test("physical static scenes expose one active heading and scene marker", async ({ page }) => {
  await enterFallback(page);
  await walkTaskTenPhysicalScenes(page);
});

test("WebGL canvas names the active scene with localized copy", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await enterWebgl(page);

  const canvas = page.getByTestId("forest-journey-canvas");
  await expect(canvas).toHaveAttribute("aria-label", "Hai bên gia đình");
  await page.getByTestId("forest-journey-next").click();
  await expect(page.getByTestId("forest-journey-stage")).toHaveAttribute(
    "data-current-scene-id",
    "opening-message",
  );
  await expect(canvas).toHaveAttribute("aria-label", "Lời ngỏ");
});

test("WebGL physical static scenes keep translated HTML context", async ({ page }) => {
  const pageErrors: string[] = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  await enterWebgl(page);
  await walkTaskTenPhysicalScenes(page);
  expect(pageErrors).toEqual([]);
});

test("gallery residency requests and mounts only neighboring photo resources", async ({
  page,
}) => {
  const requestedPhotos = new Map<string, number>();
  await page.route("**/chungdoi/images/gallery/qasr-green/photo-*.webp", async (route) => {
    const pathname = new URL(route.request().url()).pathname;
    requestedPhotos.set(pathname, (requestedPhotos.get(pathname) ?? 0) + 1);
    await route.continue();
  });

  await enterWebgl(page);
  expect(Object.fromEntries(requestedPhotos)).toEqual({});
  await page.getByTestId("forest-journey-reduced-motion").click();

  for (const sceneId of ["opening-message", "calendar"]) {
    await advanceForestScene(page, sceneId);
    expect(Object.fromEntries(requestedPhotos)).toEqual({});
  }
  await advanceForestScene(page, "schedule");
  await expect.poll(() => Object.fromEntries(requestedPhotos)).toEqual({
    "/chungdoi/images/gallery/qasr-green/photo-1.webp": 1,
  });

  await advanceForestScene(page, "gallery-photo:memory-01");
  await expectActivePhysicalScene(page, "gallery-photo");
  await expect.poll(() => Object.fromEntries(requestedPhotos)).toEqual({
    "/chungdoi/images/gallery/qasr-green/photo-1.webp": 1,
    "/chungdoi/images/gallery/qasr-green/photo-2.webp": 1,
  });
  const mountedGallerySurfaces = page.locator('[data-testid="forest-scene-gallery-photo"]');
  await expect(mountedGallerySurfaces).toHaveCount(2);
  expect(await mountedGallerySurfaces.evaluateAll((surfaces) => surfaces.map(
    (surface) => surface.getAttribute("data-forest-scene-id"),
  ).sort())).toEqual([
    "gallery-photo:memory-01",
    "gallery-photo:memory-02",
  ]);
  await expect.poll(async () => Number(
    await page.getByTestId("forest-journey-canvas").getAttribute("data-photo-texture-count"),
  )).toBeGreaterThan(0);
  expect(Number(
    await page.getByTestId("forest-journey-canvas").getAttribute("data-photo-texture-count"),
  )).toBeLessThanOrEqual(2);

  await advanceForestScene(page, "gallery-photo:memory-02");
  await expect.poll(() => Object.fromEntries(requestedPhotos)).toEqual({
    "/chungdoi/images/gallery/qasr-green/photo-1.webp": 1,
    "/chungdoi/images/gallery/qasr-green/photo-2.webp": 1,
    "/chungdoi/images/gallery/qasr-green/photo-3.webp": 1,
  });
  await expect(mountedGallerySurfaces).toHaveCount(3);
  expect(await mountedGallerySurfaces.evaluateAll((surfaces) => surfaces.map(
    (surface) => surface.getAttribute("data-forest-scene-id"),
  ).sort())).toEqual([
    "gallery-photo:memory-01",
    "gallery-photo:memory-02",
    "gallery-photo:memory-03",
  ]);
  await expect.poll(async () => Number(
    await page.getByTestId("forest-journey-canvas").getAttribute("data-photo-texture-count"),
  )).toBe(3);

  await advanceForestScene(page, "gallery-photo:memory-03");
  await expect(mountedGallerySurfaces).toHaveCount(2);
  expect(await mountedGallerySurfaces.evaluateAll((surfaces) => surfaces.map(
    (surface) => surface.getAttribute("data-forest-scene-id"),
  ).sort())).toEqual([
    "gallery-photo:memory-02",
    "gallery-photo:memory-03",
  ]);
  expect(Object.fromEntries(requestedPhotos)).toEqual({
    "/chungdoi/images/gallery/qasr-green/photo-1.webp": 1,
    "/chungdoi/images/gallery/qasr-green/photo-2.webp": 1,
    "/chungdoi/images/gallery/qasr-green/photo-3.webp": 1,
  });
  expect(Number(
    await page.getByTestId("forest-journey-canvas").getAttribute("data-photo-texture-count"),
  )).toBeLessThanOrEqual(3);

  await advanceForestScene(page, "dress-code");
  await expect(mountedGallerySurfaces).toHaveCount(1);
  await expect(mountedGallerySurfaces).toHaveAttribute(
    "data-forest-scene-id",
    "gallery-photo:memory-03",
  );
});

test("ready WebGL gallery paints the photo instead of a black material", async ({ page }) => {
  await enterWebgl(page);
  await page.getByTestId("forest-journey-reduced-motion").click();
  await advanceToFirstGallery(page);

  const activeGallery = page.locator(
    '[data-testid="forest-scene-gallery-photo"][data-forest-interactive="true"]',
  );
  await expect(activeGallery).toHaveAttribute("data-forest-photo-status", "ready");
  const easel = activeGallery.getByTestId("forest-gallery-easel");
  await expect(easel).toBeVisible();
  await page.evaluate(() => new Promise<void>((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
  }));

  const luminance = await readScreenshotLuminance(easel, {
    heightRatio: 0.64,
    leftRatio: 0.18,
    topRatio: 0.08,
    widthRatio: 0.64,
  });
  expect(
    luminance.meanLuminance,
    `ready gallery print must contain the loaded photo: ${JSON.stringify(luminance)}`,
  ).toBeGreaterThan(30);
  expect(luminance.brightPixelRatio).toBeGreaterThan(0.2);
  expect(luminance.luminanceRange).toBeGreaterThan(24);
});

test("successful gallery keeps one shared label and a decorative fallback image", async ({
  page,
}) => {
  await enterWebgl(page);
  await page.getByTestId("forest-journey-reduced-motion").click();
  await advanceToFirstGallery(page);

  const webglGallery = page.locator(
    '[data-testid="forest-scene-gallery-photo"][data-forest-interactive="true"]',
  );
  await expect(webglGallery).toHaveAttribute("data-forest-photo-status", "ready");
  const webglEasel = webglGallery.getByTestId("forest-gallery-easel");
  const webglLabel = await webglEasel.getAttribute("aria-label");
  expect(webglLabel).toBe("Khoảnh khắc cưới");
  await expect(webglGallery.locator('[aria-label="Khoảnh khắc cưới"]')).toHaveCount(1);

  await forceWebglFallback(page);
  await page.goto(LAB_PATH);
  await expect(page.getByTestId("forest-journey-fallback")).toBeVisible();
  await expect(page.getByTestId("forest-journey-enter")).toBeEnabled();
  await page.getByTestId("forest-journey-enter").click();
  await expect(page.getByTestId("forest-journey-stage")).toHaveAttribute(
    "data-journey-phase",
    "fallback-settled",
  );
  await page.getByTestId("forest-journey-reduced-motion").click();
  await advanceToFirstGallery(page);

  const fallbackGallery = page.locator(
    '[data-testid="forest-scene-gallery-photo"][data-forest-interactive="true"]',
  );
  await expect(fallbackGallery).toHaveAttribute("data-forest-photo-status", "ready");
  const fallbackEasel = fallbackGallery.getByTestId("forest-gallery-easel");
  await expect(fallbackEasel).toHaveAttribute("aria-label", webglLabel ?? "");
  await expect(fallbackGallery.locator('[aria-label="Khoảnh khắc cưới"]')).toHaveCount(1);
  await expect(fallbackEasel.locator('img[alt=""]')).toHaveCount(1);
  await expect(fallbackEasel.locator('img[alt="Khoảnh khắc cưới"]')).toHaveCount(0);
});

test("failed gallery photo keeps its easel through reverse navigation", async ({ page }) => {
  const pageErrors: string[] = [];
  let failedPhotoRequestCount = 0;
  page.on("pageerror", (error) => pageErrors.push(
    `${error.name}: ${error.message}\n${error.stack ?? ""}`,
  ));
  await page.route(
    "**/chungdoi/images/gallery/qasr-green/photo-2.webp",
    (route) => {
      failedPhotoRequestCount += 1;
      return route.abort("failed");
    },
  );
  await enterWebgl(page);
  const canvas = page.getByTestId("forest-journey-canvas").locator("canvas");
  await canvas.evaluate((element) => {
    (window as typeof window & { __forestTaskTenCanvas: HTMLCanvasElement })
      .__forestTaskTenCanvas = element as HTMLCanvasElement;
  });
  await page.getByTestId("forest-journey-reduced-motion").click();

  for (const sceneId of [
    "opening-message",
    "calendar",
    "schedule",
    "gallery-photo:memory-01",
    "gallery-photo:memory-02",
  ]) {
    await advanceForestScene(page, sceneId);
  }

  const failedSurface = page.locator(
    '[data-testid="forest-scene-gallery-photo"][data-forest-interactive="true"]',
  );
  await expect(failedSurface).toHaveAttribute("data-forest-photo-status", "error");
  await expect(failedSurface.getByTestId("forest-gallery-easel")).toBeVisible();
  await expect(failedSurface.getByText("Ảnh đang được cập nhật.")).toBeVisible();
  await expect(page.getByTestId("forest-journey-stage")).toHaveAttribute(
    "data-renderer",
    "webgl",
  );

  await page.getByTestId("forest-journey-previous").click();
  await expect(page.getByTestId("forest-journey-stage")).toHaveAttribute(
    "data-journey-phase",
    "settled",
  );
  await expect(page.getByTestId("forest-journey-stage")).toHaveAttribute(
    "data-current-scene-id",
    "gallery-photo:memory-01",
  );
  await expectCanvasFrameIsPainted(canvas, "reverse");
  await advanceForestScene(page, "gallery-photo:memory-02");
  await expect(failedSurface).toHaveAttribute("data-forest-photo-status", "error");
  await expect(failedSurface.getByTestId("forest-gallery-easel")).toBeVisible();
  await expect(page.getByTestId("forest-journey-stage")).toHaveAttribute(
    "data-renderer",
    "webgl",
  );
  await expect(page.getByTestId("forest-journey-canvas")).toHaveAttribute(
    "data-world-ready",
    "true",
  );
  await expect(canvas).toBeVisible();
  expect(await canvas.evaluate((element) => element === (
    window as typeof window & { __forestTaskTenCanvas: HTMLCanvasElement }
  ).__forestTaskTenCanvas)).toBe(true);
  await expectCanvasFrameIsPainted(canvas, "forward");
  await advanceForestScene(page, "gallery-photo:memory-03");
  await expect(page.locator(
    '[data-testid="forest-scene-gallery-photo"][data-forest-interactive="true"]',
  )).toHaveAttribute("data-forest-photo-status", "ready");
  expect(failedPhotoRequestCount).toBe(1);
  expect(pageErrors).toEqual([]);
});

test("fallback failed photo keeps one semantic label and its physical easel scaffold", async ({
  page,
}) => {
  const failedPhotoPath = "/chungdoi/images/gallery/qasr-green/photo-1.webp";
  await page.route(
    (url) => url.pathname === failedPhotoPath
      || (url.pathname === "/_next/image" && url.searchParams.get("url") === failedPhotoPath),
    (route) => route.abort("failed"),
  );
  await enterFallback(page);
  await page.getByTestId("forest-journey-reduced-motion").click();

  for (const sceneId of [
    "opening-message",
    "calendar",
    "schedule",
    "gallery-photo:memory-01",
  ]) {
    await advanceForestScene(page, sceneId);
  }

  const activeGallery = page.locator(
    '[data-testid="forest-scene-gallery-photo"][data-forest-interactive="true"]',
  );
  const easel = activeGallery.getByTestId("forest-gallery-easel");
  await expect(activeGallery).toHaveAttribute("data-forest-photo-status", "error");
  await expect(easel).toHaveAttribute("aria-label", "Khoảnh khắc cưới");
  await expect(easel.locator('img[alt=""]')).toHaveCount(0);
  await expect(activeGallery.locator('[aria-label="Khoảnh khắc cưới"]')).toHaveCount(1);
  await expect(activeGallery.locator('img[alt="Khoảnh khắc cưới"]')).toHaveCount(0);
  await expect(easel.locator('[data-forest-gallery-part="light-oak-frame"]')).toBeVisible();
  await expect(easel.locator('[data-forest-gallery-part="grass-contact"]')).toBeVisible();
  await expect(easel.locator('[data-forest-gallery-part="wildflower-cluster"]')).toBeVisible();
  await expect(easel.getByRole("status")).toHaveText("Ảnh đang được cập nhật.");
});

test("fallback threshold hides its physical scene until native voile entry completes", async ({
  page,
}) => {
  await forceWebglFallback(page);
  await page.goto(LAB_PATH);

  const stage = page.getByTestId("forest-journey-stage");
  const fallback = page.getByTestId("forest-journey-fallback");
  const physicalSurface = fallback.locator(
    '[data-testid="forest-fallback-physical-surface"][data-forest-visible="true"]',
  );
  const voile = page.getByTestId("forest-journey-voile");

  await expect(stage).toHaveAttribute("data-renderer", "fallback");
  await expect(stage).toHaveAttribute("data-journey-phase", "threshold");
  await expect(physicalSurface).toBeHidden();
  await expect(voile).toBeVisible();
  await expect(page.getByTestId("forest-journey-couple")).toHaveCount(1);
  await expect(page.locator("time")).toHaveCount(1);

  await page.getByTestId("forest-journey-enter").click();
  await expect(stage).toHaveAttribute("data-journey-phase", "fallback-settled");
  await expect(stage).toHaveAttribute("data-current-scene-id", "families");
  await expect(physicalSurface).toBeVisible();
  expect(await physicalSurface.evaluate((element) => element.closest("[inert]") === null)).toBe(
    true,
  );
});

test("WebGL1-only capability falls back because the journey requires WebGL2", async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(HTMLCanvasElement.prototype, "getContext", {
      configurable: true,
      value(contextId: string) {
        return contextId === "webgl" ? {} : null;
      },
    });
  });
  await page.goto(LAB_PATH);

  await expect(page.getByTestId("forest-journey-fallback")).toBeVisible();
  await expect(page.getByTestId("forest-journey-enter")).toBeEnabled();
});

test("a successful WebGL2 capability probe releases its temporary context", async ({ page }) => {
  await page.addInitScript(() => {
    const probeWindow = window as typeof window & { __forestProbeReleased: boolean };
    probeWindow.__forestProbeReleased = false;
    const nativeGetContext = HTMLCanvasElement.prototype.getContext;
    let probeIntercepted = false;
    const webgl2Context = {
      getExtension(name: string) {
        return name === "WEBGL_lose_context"
          ? { loseContext: () => { probeWindow.__forestProbeReleased = true; } }
          : null;
      },
    };

    Object.defineProperty(HTMLCanvasElement.prototype, "getContext", {
      configurable: true,
      value(this: HTMLCanvasElement, contextId: string, ...args: unknown[]) {
        if (!probeIntercepted && contextId === "webgl2") {
          probeIntercepted = true;
          return webgl2Context;
        }
        return Reflect.apply(nativeGetContext, this, [contextId, ...args]);
      },
    });
  });
  await page.goto(LAB_PATH);

  await expect.poll(() => page.evaluate(
    () => (window as typeof window & { __forestProbeReleased: boolean }).__forestProbeReleased,
  )).toBe(true);
  await expect(page.getByTestId("forest-journey-fallback")).toHaveCount(0);
  await expect(page.getByTestId("forest-journey-enter")).toBeEnabled();
});

test("renderer creation failure switches to the DOM fallback", async ({ page }) => {
  await page.addInitScript(() => {
    const nativeGetContext = HTMLCanvasElement.prototype.getContext;
    let webgl2Calls = 0;

    Object.defineProperty(HTMLCanvasElement.prototype, "getContext", {
      configurable: true,
      value(this: HTMLCanvasElement, contextId: string, ...args: unknown[]) {
        if (contextId === "webgl2") {
          webgl2Calls += 1;
          if (webgl2Calls === 1) {
            return {
              getExtension: () => ({ loseContext() {} }),
            };
          }
          throw new Error("forced renderer creation failure");
        }
        return Reflect.apply(nativeGetContext, this, [contextId, ...args]);
      },
    });
  });

  await page.goto(LAB_PATH);
  await expect(page.getByTestId("forest-journey-fallback")).toBeVisible();
  await expect(page.getByTestId("forest-journey-stage")).toHaveAttribute(
    "data-renderer",
    "fallback",
  );
  await expect(page.getByTestId("forest-journey-enter")).toBeEnabled();
});

test("entry waits for runtime and world readiness", async ({ page }) => {
  let releaseTexture = () => {};
  let markTextureRequested = () => {};
  const textureRelease = new Promise<void>((resolve) => {
    releaseTexture = resolve;
  });
  const textureRequested = new Promise<void>((resolve) => {
    markTextureRequested = resolve;
  });

  await page.route(FOREST_PHOTOREAL_BLOCKING_ASSET_GLOB, async (route) => {
    markTextureRequested();
    await textureRelease;
    await route.continue();
  });

  await page.goto(LAB_PATH, { waitUntil: "domcontentloaded" });
  const canvasBoundary = page.getByTestId("forest-journey-canvas");
  const entry = page.getByTestId("forest-journey-enter");
  try {
    await textureRequested;
    await expect(canvasBoundary).toHaveAttribute("data-runtime-ready", "true");
    await expect(canvasBoundary).toHaveAttribute("data-world-ready", "false");
    await expect(entry).toBeDisabled();
  } finally {
    releaseTexture();
  }

  await expect(canvasBoundary).toHaveAttribute("data-world-ready", "true");
  await expect(entry).toBeEnabled();
});

test("the WebGL forest keeps its photoreal skin and readiness across entry", async ({ page }) => {
  await page.goto(LAB_PATH);

  const canvasBoundary = page.getByTestId("forest-journey-canvas");
  await expect(canvasBoundary).toHaveAttribute("data-world-mode", "hybrid");
  await expect(canvasBoundary).toHaveAttribute("data-world-skin", "forest-wedding-photoreal");
  await expect(canvasBoundary).toHaveAttribute("data-quality-tier", "desktop");
  await expect(canvasBoundary).toHaveAttribute("data-scene-total", "15");
  await expect(canvasBoundary).toHaveAttribute("data-runtime-ready", "true");
  await expect(canvasBoundary).toHaveAttribute("data-world-ready", "true");

  const stage = page.getByTestId("forest-journey-stage");
  await stage.evaluate((element) => {
    element.scrollTop = 160;
  });
  expect(await stage.evaluate((element) => element.scrollTop)).toBe(0);

  const canvas = canvasBoundary.locator("canvas");
  await canvas.evaluate((element) => {
    (window as typeof window & { __forestTaskSevenCanvas: HTMLCanvasElement })
      .__forestTaskSevenCanvas = element as HTMLCanvasElement;
  });
  await page.getByTestId("forest-journey-enter").click();
  await expect(stage).toHaveAttribute(
    "data-journey-phase",
    "settled",
  );
  await expect(canvasBoundary).toHaveAttribute("data-world-ready", "true");
  expect(await canvas.evaluate((element) => element === (
    window as typeof window & { __forestTaskSevenCanvas: HTMLCanvasElement }
  ).__forestTaskSevenCanvas)).toBe(true);
  const canvasLayout = await canvasBoundary.evaluate((element) => {
    const stage = element.closest('[data-testid="forest-journey-stage"]');
    const boundaryRect = element.getBoundingClientRect();
    const stageRect = stage?.getBoundingClientRect();
    return {
      boundaryHeight: boundaryRect.height,
      boundaryTop: boundaryRect.top,
      stageHeight: stageRect?.height ?? 0,
      stageTop: stageRect?.top ?? 0,
    };
  });
  expect(Math.abs(canvasLayout.boundaryTop - canvasLayout.stageTop)).toBeLessThan(1);
  expect(Math.abs(canvasLayout.boundaryHeight - canvasLayout.stageHeight)).toBeLessThan(1);
});

test("finite rail exposes early and late progress while preserving canvas identity", async ({ page }) => {
  await page.goto(LAB_PATH);

  const stage = page.getByTestId("forest-journey-stage");
  const canvasBoundary = page.getByTestId("forest-journey-canvas");
  const canvas = canvasBoundary.locator("canvas");
  const entry = page.getByTestId("forest-journey-enter");
  await expect(entry).toBeVisible();
  await expect(entry).toBeEnabled();
  expect(await entry.evaluate((element) => (
    element instanceof HTMLButtonElement && !element.disabled
  ))).toBe(true);
  await expect(canvasBoundary).toHaveAttribute("data-camera-x", /-?\d/);
  await expect(canvasBoundary).toHaveAttribute("data-camera-y", /-?\d/);
  await expect(canvasBoundary).toHaveAttribute("data-camera-z", /-?\d/);
  await expect(canvasBoundary).toHaveAttribute("data-rendered-look-yaw", /-?\d/);
  await installForestCameraRecorder(page);
  await stage.evaluate((element) => {
    const cameraWindow = window as typeof window & {
      __forestFirstArrivalAt: number;
      __forestSawTravelling: boolean;
    };
    cameraWindow.__forestFirstArrivalAt = 0;
    cameraWindow.__forestSawTravelling = false;
    new MutationObserver(() => {
      const phase = element.getAttribute("data-journey-phase");
      if (phase === "travelling") cameraWindow.__forestSawTravelling = true;
      if (
        phase === "settled"
        && cameraWindow.__forestSawTravelling
        && cameraWindow.__forestFirstArrivalAt === 0
      ) {
        cameraWindow.__forestFirstArrivalAt = Date.now();
      }
    }).observe(element, {
      attributeFilter: ["data-journey-phase"],
      attributes: true,
    });
  });

  const entryBounds = await entry.boundingBox();
  if (entryBounds === null || entryBounds.width <= 0 || entryBounds.height <= 0) {
    throw new Error("The visible forest entry button has no clickable bounds");
  }
  await entry.evaluate((element) => {
    const cameraWindow = window as typeof window & {
      __forestEntryClickAt: number;
    };
    cameraWindow.__forestEntryClickAt = 0;
    element.addEventListener("click", () => {
      cameraWindow.__forestEntryClickAt = Date.now();
    }, { once: true });
  });

  const startedAt = Date.now();
  await page.mouse.click(
    entryBounds.x + entryBounds.width / 2,
    entryBounds.y + entryBounds.height / 2,
  );
  await expect(stage).toHaveAttribute("data-journey-phase", "travelling");
  await expect(stage).toHaveAttribute("data-journey-phase", "settled", {
    timeout: 2_400,
  });
  const { clickAt, firstArrivalAt } = await page.evaluate(() => {
    const cameraWindow = window as typeof window & {
      __forestEntryClickAt: number;
      __forestFirstArrivalAt: number;
    };
    return {
      clickAt: cameraWindow.__forestEntryClickAt,
      firstArrivalAt: cameraWindow.__forestFirstArrivalAt,
    };
  });
  expect(clickAt).toBeGreaterThanOrEqual(startedAt);
  expect(firstArrivalAt).toBeGreaterThanOrEqual(clickAt);
  expect(firstArrivalAt).toBeGreaterThan(0);
  expect(firstArrivalAt - startedAt).toBeLessThan(2_400);

  const recording = await readForestCameraRecording(page);
  expect(recording.samples.some(({ progress }) => (
    progress > 0.05 && progress < 0.45
  ))).toBe(true);
  expect(recording.samples.some(({ progress }) => (
    progress > 0.55 && progress < 0.98
  ))).toBe(true);
  expect(recording.cuePeak).toBeGreaterThan(0);
  expect(await canvas.evaluate((element) => element === (
    window as typeof window & { __forestTaskNineCanvas: HTMLCanvasElement | null }
  ).__forestTaskNineCanvas)).toBe(true);
});

test("cannot skip generated scenes with repeated navigation during a finite rail", async ({ page }) => {
  await page.goto(LAB_PATH);

  const stage = page.getByTestId("forest-journey-stage");
  await expect(page.getByTestId("forest-journey-enter")).toBeEnabled();
  await page.getByTestId("forest-journey-enter").click();
  await expect(stage).toHaveAttribute("data-journey-phase", "travelling");
  await page.keyboard.press("ArrowRight");
  await page.keyboard.press("ArrowDown");
  await page.mouse.wheel(0, 120);
  await expect(stage).toHaveAttribute("data-journey-phase", "settled");
  await expect(stage).toHaveAttribute("data-current-scene-index", "1");

  await page.getByTestId("forest-journey-next").click();
  await expect(stage).toHaveAttribute("data-journey-phase", "travelling");
  await expect(stage).toHaveAttribute("data-target-scene-index", "2");
  await page.keyboard.press("ArrowRight");
  await page.keyboard.press("ArrowRight");
  await page.mouse.wheel(0, 120);
  await page.mouse.wheel(0, 120);
  await expect(stage).toHaveAttribute("data-journey-phase", "settled");
  await expect(stage).toHaveAttribute("data-current-scene-index", "2");
});

test("recenter preserves the live free-look pose before rail progress begins", async ({ page }) => {
  await page.goto(LAB_PATH);

  const stage = page.getByTestId("forest-journey-stage");
  const canvasBoundary = page.getByTestId("forest-journey-canvas");
  await expect(page.getByTestId("forest-journey-enter")).toBeEnabled();
  await page.getByTestId("forest-journey-enter").click();
  await expect(stage).toHaveAttribute("data-journey-phase", "settled");

  const bounds = await canvasBoundary.boundingBox();
  expect(bounds).not.toBeNull();
  if (!bounds) return;
  const startX = bounds.x + bounds.width * 0.32;
  const startY = bounds.y + bounds.height * 0.28;
  await page.mouse.move(startX, startY);
  await page.mouse.down();
  await page.mouse.move(startX + 120, startY + 4, { steps: 6 });
  await page.mouse.up();
  await expect.poll(async () => Number(
    await canvasBoundary.getAttribute("data-rendered-look-yaw"),
  )).toBeGreaterThan(1);
  const startPosition = await canvasBoundary.evaluate((element) => ({
    x: Number(element.getAttribute("data-camera-x")),
    y: Number(element.getAttribute("data-camera-y")),
    z: Number(element.getAttribute("data-camera-z")),
  }));

  await installForestCameraRecorder(page);
  await page.getByTestId("forest-journey-next").click();
  await expect(stage).toHaveAttribute("data-journey-phase", "travelling");
  await expect(stage).toHaveAttribute("data-journey-phase", "settled");

  const { samples } = await readForestCameraRecording(page);
  const recenterIndex = samples.findIndex((sample) => (
    sample.progress === 0
    && sample.renderedYaw > 1
    && sample.renderedYaw < 19
    && Math.abs(sample.x - startPosition.x) <= 0.003
    && Math.abs(sample.y - startPosition.y) <= 0.003
    && Math.abs(sample.z - startPosition.z) <= 0.003
  ));
  expect(recenterIndex).toBeGreaterThanOrEqual(0);
  const railIndex = samples.findIndex(({ progress }, index) => (
    index > recenterIndex && progress > 0
  ));
  expect(railIndex).toBeGreaterThan(recenterIndex);
  expect(samples.slice(recenterIndex, railIndex).every(({ progress }) => (
    progress === 0
  ))).toBe(true);
  expect(samples.slice(recenterIndex + 1, railIndex).some((sample) => (
    sample.renderedYaw < samples[recenterIndex]!.renderedYaw - 0.2
    && Math.abs(sample.x - startPosition.x) <= 0.003
    && Math.abs(sample.y - startPosition.y) <= 0.003
    && Math.abs(sample.z - startPosition.z) <= 0.003
  ))).toBe(true);
});

test("the WebGL threshold exposes one centered authored gate and its actors", async ({ page }) => {
  await page.goto(LAB_PATH);

  const canvasBoundary = page.getByTestId("forest-journey-canvas");
  const voile = page.getByTestId("forest-journey-voile");
  await expect(canvasBoundary).toHaveAttribute("data-world-ready", "true");
  await expect(canvasBoundary).toHaveAttribute("data-gate-count", "1");
  await expect(canvasBoundary).toHaveAttribute("data-voile-count", "1");
  await expect(canvasBoundary).toHaveAttribute("data-rabbit-count", "2");
  await expect(canvasBoundary).toHaveAttribute("data-gate-dove-count", "2");
  await expect(canvasBoundary).toHaveAttribute("data-finale-dove-count", "3");
  await expect(canvasBoundary).toHaveAttribute("data-active-petal-instances", "72");
  await expect(voile).toBeVisible();
  await expect(page.getByTestId("forest-journey-couple")).toBeVisible();
  await expect(page.getByTestId("forest-journey-enter")).toBeEnabled();

  const layout = await voile.evaluate((element) => {
    const rect = element.getBoundingClientRect();
    return {
      bottom: rect.bottom,
      centerX: rect.left + rect.width / 2,
      centerY: rect.top + rect.height / 2,
      height: rect.height,
      right: rect.right,
      viewportHeight: window.innerHeight,
      viewportWidth: window.innerWidth,
      width: rect.width,
    };
  });
  expect(Math.abs(layout.centerX - layout.viewportWidth / 2)).toBeLessThanOrEqual(3);
  expect(Math.abs(layout.centerY - layout.viewportHeight / 2)).toBeLessThanOrEqual(3);
  expect(Math.abs(layout.width - 344)).toBeLessThanOrEqual(4);
  expect(Math.abs(layout.height - 432)).toBeLessThanOrEqual(4);
  expect(layout.right).toBeLessThanOrEqual(layout.viewportWidth);
  expect(layout.bottom).toBeLessThanOrEqual(layout.viewportHeight);

  const projection = await readVoileProjection(page);
  expect(Math.abs(projection.physical.centerX - projection.native.centerX)).toBeLessThanOrEqual(3);
  expect(Math.abs(projection.physical.centerY - projection.native.centerY)).toBeLessThanOrEqual(3);
  expect(Math.abs(projection.physical.width - projection.native.width)).toBeLessThanOrEqual(4);
  expect(Math.abs(projection.physical.height - projection.native.height)).toBeLessThanOrEqual(4);
});

test.describe("short landscape WebGL threshold", () => {
  test.use({ viewport: { height: 375, width: 667 } });

  test("keeps the full native veil invitation inside its projected veil", async ({ page }) => {
    await page.goto(LAB_PATH);

    const canvasBoundary = page.getByTestId("forest-journey-canvas");
    const voile = page.getByTestId("forest-journey-voile");
    const entry = page.getByTestId("forest-journey-enter");
    await expect(canvasBoundary).toHaveAttribute("data-world-ready", "true");
    await expect(voile).toBeVisible();
    await expect(entry).toBeVisible();
    await expect(entry).toBeEnabled();

    const layout = await voile.evaluate((element) => {
      const rect = element.getBoundingClientRect();
      const rectFor = (selector: string) => {
        const child = element.querySelector<HTMLElement>(selector);
        if (!child) throw new Error(`Missing veil content: ${selector}`);
        const childRect = child.getBoundingClientRect();
        return {
          bottom: childRect.bottom,
          height: childRect.height,
          left: childRect.left,
          right: childRect.right,
          top: childRect.top,
          width: childRect.width,
        };
      };

      return {
        body: rectFor("p:last-of-type"),
        button: rectFor('[data-testid="forest-journey-enter"]'),
        date: rectFor("time"),
        heading: rectFor("h1"),
        kicker: rectFor("p:first-of-type"),
        viewport: { height: window.innerHeight, width: window.innerWidth },
        voile: {
          bottom: rect.bottom,
          left: rect.left,
          right: rect.right,
          top: rect.top,
        },
      };
    });

    expect(layout.voile.left).toBeGreaterThanOrEqual(24);
    expect(layout.voile.top).toBeGreaterThanOrEqual(24);
    expect(layout.voile.right).toBeLessThanOrEqual(layout.viewport.width - 24);
    expect(layout.voile.bottom).toBeLessThanOrEqual(layout.viewport.height - 24);

    for (const content of [
      layout.kicker,
      layout.heading,
      layout.date,
      layout.body,
      layout.button,
    ]) {
      expect(content.left).toBeGreaterThanOrEqual(layout.voile.left);
      expect(content.top).toBeGreaterThanOrEqual(layout.voile.top);
      expect(content.right).toBeLessThanOrEqual(layout.voile.right);
      expect(content.bottom).toBeLessThanOrEqual(layout.voile.bottom);
      expect(content.left).toBeGreaterThanOrEqual(0);
      expect(content.top).toBeGreaterThanOrEqual(0);
      expect(content.right).toBeLessThanOrEqual(layout.viewport.width);
      expect(content.bottom).toBeLessThanOrEqual(layout.viewport.height);
    }
    expect(layout.button.height).toBeGreaterThanOrEqual(44);

    const projection = await readVoileProjection(page);
    expect(Math.abs(projection.physical.centerX - projection.native.centerX)).toBeLessThanOrEqual(3);
    expect(Math.abs(projection.physical.centerY - projection.native.centerY)).toBeLessThanOrEqual(3);
    expect(Math.abs(projection.physical.width - projection.native.width)).toBeLessThanOrEqual(4);
    expect(Math.abs(projection.physical.height - projection.native.height)).toBeLessThanOrEqual(4);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(
      await page.evaluate(() => window.innerWidth),
    );
  });
});

test("the rendered WebGL world reports a clear walking corridor", async ({ page }) => {
  await page.goto(LAB_PATH);

  const canvasBoundary = page.getByTestId("forest-journey-canvas");
  await expect(canvasBoundary).toHaveAttribute("data-world-ready", "true");
  await expect(canvasBoundary).toHaveAttribute("data-corridor-clear", "true");

  const minimumHeroPathDistance = Number(
    await canvasBoundary.getAttribute("data-min-hero-path-distance"),
  );
  const minimumWildflowerPathDistance = Number(
    await canvasBoundary.getAttribute("data-min-wildflower-path-distance"),
  );
  expect(minimumHeroPathDistance).toBeGreaterThanOrEqual(2.6);
  expect(minimumWildflowerPathDistance).toBeGreaterThanOrEqual(1.55);
});

test("development exposes one on-demand renderer snapshot without render data attributes", async ({
  page,
}) => {
  test.skip(
    !FOREST_RUNTIME_DIAGNOSTICS_ENABLED,
    "development runtime diagnostics run only in the explicit diagnostic suite",
  );
  await page.goto(LAB_PATH);

  const canvasBoundary = page.getByTestId("forest-journey-canvas");
  await expect(canvasBoundary).toHaveAttribute("data-world-ready", "true");
  await expect(canvasBoundary).not.toHaveAttribute("data-render-calls", /.+/);
  await expect(canvasBoundary).not.toHaveAttribute("data-render-triangles", /.+/);

  const snapshot = await readForestRuntimeDiagnostics(page);
  expect(snapshot.scene).toEqual({
    id: "cover-gate",
    index: 0,
    phase: "threshold",
    targetId: null,
    targetIndex: null,
    type: "cover-gate",
  });
  expect(snapshot.renderer.calls).toBeGreaterThan(0);
  expect(snapshot.renderer.triangles).toBeGreaterThan(0);
  expect(snapshot.renderer.frame).toBeGreaterThan(0);
  expect(snapshot.worldMode).toBe("hybrid");
  expect(snapshot.environment.mode).toBe("hybrid");
  expect(snapshot.environment.decodedRgbaMipBytes).toBe(
    HYBRID_ENVIRONMENT_DECODED_BYTES,
  );
  expect(snapshot.photos.retainedCount).toBe(0);
  expect(snapshot.totalEstimatedDecodedRgbaMipBytes).toBe(
    HYBRID_ENVIRONMENT_DECODED_BYTES,
  );

  // Manifest estimates are static, so they pin the exact download and decode
  // cost the hybrid boundary commits to before it reports readiness. The
  // compressed figures fell when the asset pack was regenerated — most of it
  // from `backdrop.webp` (166_970 -> 33_682 bytes), where baking in aerial
  // perspective lifted the tonal floor and removed the noisy near-black region
  // WebP had been spending bits on. Decode cost is unchanged because it follows
  // dimensions, not entropy. `forest-asset-manifest.test.ts` is what holds these
  // totals to the bytes actually on disk; this only pins what the reader reports.
  expect(snapshot.assets).toEqual({
    entryCompressedBytes: 719_946,
    entryDecodedRgbaMipBytes: 15_379_118,
    sharedCompressedBytes: 809_070,
    sharedDecodedRgbaMipBytes: 18_655_918,
  });
  expect(snapshot.wildlife.optionalActorCount).toBe(WILDLIFE_ACTOR_COUNT);

  // At the gate the window is clamped to the start of the rail, so chunk 0 plus
  // the three ahead of it are resident, and the near band is still
  // hero-quality.
  expect(snapshot.chunks.residentIndices).toEqual([0, 1, 2, 3]);
  expect(snapshot.chunks.lodTreeCounts.hero).toBeGreaterThan(0);
  expect(snapshot.petals.instanceCount).toBe(72);
  const petalHash = snapshot.petals.transformHash;
  expect(petalHash).toMatch(/^[0-9a-f]{8}$/);
  expect((await readForestRuntimeDiagnostics(page)).petals.transformHash)
    .toBe(petalHash);

  await page.getByTestId("forest-journey-enter").click();
  await expect(page.getByTestId("forest-journey-stage")).toHaveAttribute(
    "data-journey-phase",
    "travelling",
  );
  const travelling = await readForestRuntimeDiagnostics(page);
  expect(travelling.scene).toEqual({
    id: "cover-gate",
    index: 0,
    phase: "travelling",
    targetId: "families",
    targetIndex: 1,
    type: "cover-gate",
  });
});

test("development removes the on-demand diagnostics reader after WebGL fallback", async ({
  page,
}) => {
  test.skip(
    !FOREST_RUNTIME_DIAGNOSTICS_ENABLED,
    "development runtime diagnostics run only in the explicit diagnostic suite",
  );
  await page.goto(LAB_PATH);
  const canvas = page.getByTestId("forest-journey-canvas").locator("canvas");
  await expect(page.getByTestId("forest-journey-enter")).toBeEnabled();
  expect(await page.evaluate(() => typeof (
    window as typeof window & { __forestWeddingJourneyDiagnostics?: unknown }
  ).__forestWeddingJourneyDiagnostics)).toBe("function");

  await canvas.evaluate((element) => {
    element.dispatchEvent(new Event("webglcontextlost", { cancelable: true }));
  });
  await expect(page.getByTestId("forest-journey-fallback")).toBeVisible();
  await expect.poll(() => page.evaluate(() => typeof (
    window as typeof window & { __forestWeddingJourneyDiagnostics?: unknown }
  ).__forestWeddingJourneyDiagnostics)).toBe("undefined");
});

test("the default suite omits the forest runtime diagnostics API", async ({ page }) => {
  test.skip(
    FOREST_RUNTIME_DIAGNOSTICS_ENABLED,
    "this negative contract runs only when diagnostics are not opted in",
  );
  await page.goto(LAB_PATH);
  await expect(page.getByTestId("forest-journey-enter")).toBeEnabled();
  expect(await page.evaluate(() => typeof (
    window as typeof window & { __forestWeddingJourneyDiagnostics?: unknown }
  ).__forestWeddingJourneyDiagnostics)).toBe("undefined");
});

test.describe("desktop forest runtime budgets", () => {
  test.use({
    deviceScaleFactor: 2,
    viewport: { height: 900, width: 1_440 },
  });

  test("gate gallery gift and finale stay within measured desktop ceilings", async ({
    page,
  }) => {
    test.skip(
      !FOREST_RUNTIME_DIAGNOSTICS_ENABLED,
      "development runtime diagnostics run only in the explicit diagnostic suite",
    );
    // Walking the whole rail to the finale costs one settle per scene, so this
    // budget sweep needs more than the suite-wide 60s allowance.
    test.setTimeout(180_000);
    await page.emulateMedia({ reducedMotion: "no-preference" });
    const snapshots = await captureForestRuntimeBudgetJourney(page);

    expect(snapshots.gate.scene.id).toBe("cover-gate");
    expect(snapshots.gate.photos.activeLeases).toBe(0);
    expect(snapshots.gate.photos.liveCount).toBe(0);
    expect(snapshots.gate.photos.decodedRgbaMipBytes).toBe(0);
    expect(snapshots.gate.totalEstimatedDecodedRgbaMipBytes).toBe(
      HYBRID_ENVIRONMENT_DECODED_BYTES,
    );
    for (const [sceneId, snapshot] of [
      ["gallery-photo:memory-02", snapshots.gallery],
      ["gift", snapshots.gift],
      ["finale", snapshots.finale],
    ] as const) {
      expect(snapshot.scene.id).toBe(sceneId);
      expect(snapshot.photos.retainedCount).toBe(3);
      expect(snapshot.photos.decodedRgbaMipBytes).toBe(GALLERY_PHOTO_DECODED_BYTES);
      expect(snapshot.photos.unmeasuredCount).toBe(0);
      expect(snapshot.totalEstimatedDecodedRgbaMipBytes).toBe(
        HYBRID_ENVIRONMENT_DECODED_BYTES + GALLERY_PHOTO_DECODED_BYTES,
      );
    }
    expect(snapshots.gallery.photos.activeLeases).toBe(3);
    expect(snapshots.gallery.photos.liveCount).toBe(3);
    for (const snapshot of [snapshots.gift, snapshots.finale]) {
      expect(snapshot.photos.activeLeases).toBe(0);
      expect(snapshot.photos.liveCount).toBe(3);
    }
    for (const snapshot of Object.values(snapshots)) {
      expectForestRuntimeBudget(snapshot, "desktop");
    }
  });
});

test.describe("mobile forest runtime budgets", () => {
  test.use({
    deviceScaleFactor: 3,
    viewport: { height: 844, width: 390 },
  });

  test("gate gallery gift and finale stay within measured mobile ceilings", async ({
    page,
  }) => {
    test.skip(
      !FOREST_RUNTIME_DIAGNOSTICS_ENABLED,
      "development runtime diagnostics run only in the explicit diagnostic suite",
    );
    // Same rail walk as the desktop sweep, so it needs the same extended budget.
    test.setTimeout(180_000);
    await page.emulateMedia({ reducedMotion: "no-preference" });
    const snapshots = await captureForestRuntimeBudgetJourney(page);

    expect(snapshots.gate.scene.id).toBe("cover-gate");
    expect(snapshots.gate.photos.activeLeases).toBe(0);
    expect(snapshots.gate.photos.liveCount).toBe(0);
    expect(snapshots.gate.photos.decodedRgbaMipBytes).toBe(0);
    expect(snapshots.gate.totalEstimatedDecodedRgbaMipBytes).toBe(
      HYBRID_ENVIRONMENT_DECODED_BYTES,
    );
    for (const [sceneId, snapshot] of [
      ["gallery-photo:memory-02", snapshots.gallery],
      ["gift", snapshots.gift],
      ["finale", snapshots.finale],
    ] as const) {
      expect(snapshot.scene.id).toBe(sceneId);
      expect(snapshot.photos.retainedCount).toBe(3);
      expect(snapshot.photos.decodedRgbaMipBytes).toBe(GALLERY_PHOTO_DECODED_BYTES);
      expect(snapshot.photos.unmeasuredCount).toBe(0);
      expect(snapshot.totalEstimatedDecodedRgbaMipBytes).toBe(
        HYBRID_ENVIRONMENT_DECODED_BYTES + GALLERY_PHOTO_DECODED_BYTES,
      );
    }
    expect(snapshots.gallery.photos.activeLeases).toBe(3);
    expect(snapshots.gallery.photos.liveCount).toBe(3);
    for (const snapshot of [snapshots.gift, snapshots.finale]) {
      expect(snapshot.photos.activeLeases).toBe(0);
      expect(snapshot.photos.liveCount).toBe(3);
    }
    for (const snapshot of Object.values(snapshots)) {
      expectForestRuntimeBudget(snapshot, "mobile");
    }
  });
});

test("a hidden forest tab stops ambient invalidation entirely", async ({
  context,
  page,
}, testInfo) => {
  test.skip(
    !FOREST_RUNTIME_DIAGNOSTICS_ENABLED,
    "development runtime diagnostics run only in the explicit diagnostic suite",
  );
  await page.goto(LAB_PATH);
  await expect(page.getByTestId("forest-journey-canvas")).toHaveAttribute(
    "data-world-ready",
    "true",
  );

  const foregroundPage = await context.newPage();
  await foregroundPage.goto("about:blank");
  await foregroundPage.bringToFront();
  const nativeVisibility = await page.evaluate(() => document.visibilityState);
  const visibilityMode = nativeVisibility === "hidden"
    ? "native-tab-visibility"
    : "deterministic-visibility-override";
  testInfo.annotations.push({
    description: visibilityMode,
    type: "forest-visibility-contract",
  });

  const before = await page.evaluate((useOverride) => {
    const diagnosticWindow = window as typeof window & {
      __forestWeddingJourneyDiagnostics?: () => ForestRuntimeDiagnosticsSnapshot;
    };
    const snapshot = diagnosticWindow.__forestWeddingJourneyDiagnostics?.();
    if (!snapshot) throw new Error("Forest runtime diagnostics API is unavailable");
    if (useOverride) {
      Object.defineProperty(document, "visibilityState", {
        configurable: true,
        get: () => "hidden",
      });
      document.dispatchEvent(new Event("visibilitychange"));
    }
    return snapshot;
  }, visibilityMode === "deterministic-visibility-override");

  await page.waitForTimeout(300);
  const hidden = await readForestRuntimeDiagnostics(page);
  expect(hidden.ambientCount).toBe(before.ambientCount);
  expect(hidden.hiddenAmbientCount).toBe(0);

  if (visibilityMode === "deterministic-visibility-override") {
    await page.evaluate(() => {
      Reflect.deleteProperty(document, "visibilityState");
      document.dispatchEvent(new Event("visibilitychange"));
    });
  } else {
    await page.bringToFront();
    await expect.poll(() => page.evaluate(() => document.visibilityState)).toBe("visible");
  }
  await foregroundPage.close();
});

test("sustained slow browser timestamps trigger exactly one adaptive reduction", async ({
  page,
}) => {
  test.skip(
    !FOREST_RUNTIME_DIAGNOSTICS_ENABLED,
    "development runtime diagnostics run only in the explicit diagnostic suite",
  );
  await page.goto(LAB_PATH);
  const canvas = page.getByTestId("forest-journey-canvas");
  await expect(canvas).toHaveAttribute("data-world-ready", "true");
  const before = await readForestRuntimeDiagnostics(page);
  expect(before.adaptiveReductionCount).toBe(0);
  expect(before.qualityTier).toBe("desktop");

  await page.evaluate(() => {
    const nativeRequestAnimationFrame = window.requestAnimationFrame.bind(window);
    let syntheticTimestamp = performance.now();
    window.requestAnimationFrame = (callback: FrameRequestCallback) => (
      nativeRequestAnimationFrame(() => {
        syntheticTimestamp += 25;
        callback(syntheticTimestamp);
      })
    );
  });

  await expect.poll(async () => (
    await readForestRuntimeDiagnostics(page)
  ).adaptiveReductionCount).toBe(1);
  await expect.poll(async () => (
    await readForestRuntimeDiagnostics(page)
  ).qualityTier).toBe("reduced");
  await expect(canvas).toHaveAttribute("data-ambient-frame-interval", String(1_000 / 20));
  await page.waitForTimeout(600);
  const after = await readForestRuntimeDiagnostics(page);
  expect(after.adaptiveReductionCount).toBe(1);
  expect(after.qualityTier).toBe("reduced");
});

test.describe("mobile WebGL quality", () => {
  test.use({ viewport: { height: 844, width: 390 } });

  test("starts at the mobile forest density tier without delaying readiness", async ({ page }) => {
    await page.goto(LAB_PATH);

    const canvasBoundary = page.getByTestId("forest-journey-canvas");
    await expect(canvasBoundary).toHaveAttribute("data-world-skin", "forest-wedding-photoreal");
    await expect(canvasBoundary).toHaveAttribute("data-quality-tier", "mobile");
    await expect(canvasBoundary).toHaveAttribute("data-scene-total", "15");
    await expect(canvasBoundary).toHaveAttribute("data-world-ready", "true");
    await expect(page.getByTestId("forest-journey-enter")).toBeEnabled();
    await expect(canvasBoundary).toHaveAttribute("data-active-petal-instances", "42");

    const rect = await page.getByTestId("forest-journey-voile").evaluate((element) => {
      const bounds = element.getBoundingClientRect();
      return {
        centerX: bounds.left + bounds.width / 2,
        centerY: bounds.top + bounds.height / 2,
        height: bounds.height,
        left: bounds.left,
        right: bounds.right,
        width: bounds.width,
      };
    });
    expect(Math.abs(rect.centerX - 195)).toBeLessThanOrEqual(3);
    expect(Math.abs(rect.centerY - 422)).toBeLessThanOrEqual(3);
    expect(rect.left).toBeGreaterThanOrEqual(24);
    expect(rect.right).toBeLessThanOrEqual(366);
    expect(Math.abs(rect.width / rect.height - 344 / 432)).toBeLessThan(0.01);

    const projection = await readVoileProjection(page);
    expect(Math.abs(projection.physical.centerX - projection.native.centerX)).toBeLessThanOrEqual(3);
    expect(Math.abs(projection.physical.centerY - projection.native.centerY)).toBeLessThanOrEqual(3);
    expect(Math.abs(projection.physical.width - projection.native.width)).toBeLessThanOrEqual(4);
    expect(Math.abs(projection.physical.height - projection.native.height)).toBeLessThanOrEqual(4);
  });
});

test("failed blocking materials choose terminal procedural WebGL", async ({ page }) => {
  for (const glob of [
    FOREST_PHOTOREAL_BLOCKING_ASSET_GLOB,
    FOREST_LEGACY_BLOCKING_ASSET_GLOB,
  ]) {
    await page.route(glob, (route) => route.abort("failed"));
  }
  await page.goto(LAB_PATH);

  const canvasBoundary = page.getByTestId("forest-journey-canvas");
  await expect(canvasBoundary).toHaveAttribute("data-world-mode", "procedural");
  await expect(canvasBoundary).toHaveAttribute("data-world-ready", "true");
  await expect(page.getByTestId("forest-journey-fallback")).toHaveCount(0);
  await expect(canvasBoundary).toHaveAttribute("data-gate-count", "1");
  await expect(canvasBoundary).toHaveAttribute("data-voile-count", "1");
  await expect(canvasBoundary).toHaveAttribute("data-rabbit-count", "2");
  await expect(canvasBoundary).toHaveAttribute("data-gate-dove-count", "2");
  await expect(canvasBoundary).toHaveAttribute("data-active-petal-instances", "72");
  await expect(page.getByTestId("forest-journey-voile")).toBeVisible();
  await expect(page.getByTestId("forest-journey-enter")).toBeEnabled();
});

test("failed photoreal materials fall back to legacy textured WebGL", async ({ page }) => {
  await page.route(
    FOREST_PHOTOREAL_BLOCKING_ASSET_GLOB,
    (route) => route.abort("failed"),
  );
  await page.goto(LAB_PATH);

  const canvasBoundary = page.getByTestId("forest-journey-canvas");
  await expect(canvasBoundary).toHaveAttribute("data-world-mode", "textured");
  await expect(canvasBoundary).toHaveAttribute("data-world-skin", "forest-wedding-daylight");
  await expect(canvasBoundary).toHaveAttribute("data-world-ready", "true");
  await expect(page.getByTestId("forest-journey-fallback")).toHaveCount(0);
  await expect(page.getByTestId("forest-journey-enter")).toBeEnabled();
});

test("a failed optional wildlife atlas keeps the photoreal world ready", async ({ page }) => {
  await page.route(
    "**/chungdoi/labs/forest-wedding-journey/photoreal/wildlife.webp",
    (route) => route.abort("failed"),
  );
  await page.goto(LAB_PATH);

  const canvasBoundary = page.getByTestId("forest-journey-canvas");
  await expect(canvasBoundary).toHaveAttribute("data-world-mode", "hybrid");
  await expect(canvasBoundary).toHaveAttribute("data-world-skin", "forest-wedding-photoreal");
  await expect(canvasBoundary).toHaveAttribute("data-world-ready", "true");
  await expect(page.getByTestId("forest-journey-fallback")).toHaveCount(0);
  await expect(page.getByTestId("forest-journey-enter")).toBeEnabled();

  // The census counts mounted layers, so a rejected atlas must report nothing —
  // both the ambient sightings and the scripted rabbits and doves ride on it.
  // While this number came from a module constant it read 5 here regardless,
  // which made everything above the only thing this test really checked.
  expect((await readForestRuntimeDiagnostics(page)).wildlife.optionalActorCount)
    .toBe(0);
});

test("reduced WebGL freezes every threshold cue and keeps deterministic petals", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto(LAB_PATH);

  const canvasBoundary = page.getByTestId("forest-journey-canvas");
  await expect(canvasBoundary).toHaveAttribute("data-world-ready", "true");
  await expect(canvasBoundary).toHaveAttribute("data-quality-tier", "reduced");
  await expect(canvasBoundary).toHaveAttribute("data-active-petal-instances", "18");

  for (const attribute of [
    "data-cue-dove-flight",
    "data-cue-petal-gust",
    "data-cue-rabbit-guide",
    "data-cue-voile-lift",
    "data-cue-wind-strength",
    "data-travel-progress",
  ]) {
    await expect(canvasBoundary).toHaveAttribute(attribute, "0");
  }
  await page.waitForTimeout(120);
  for (const attribute of [
    "data-cue-dove-flight",
    "data-cue-petal-gust",
    "data-cue-rabbit-guide",
    "data-cue-voile-lift",
    "data-cue-wind-strength",
    "data-travel-progress",
  ]) {
    expect(Number(await canvasBoundary.getAttribute(attribute))).toBe(0);
  }
});

test("the threshold voile becomes inert during first travel and never remounts", async ({ page }) => {
  await forceWebglFallback(page);
  await page.goto(LAB_PATH);

  const stage = page.getByTestId("forest-journey-stage");
  const entry = page.getByTestId("forest-journey-enter");
  const voile = page.getByTestId("forest-journey-voile");
  await expect(entry).toBeEnabled();
  await entry.click();
  await expect(stage).toHaveAttribute("data-journey-phase", "travelling");
  await expect(voile).toHaveAttribute("inert", "");
  await expect(entry).toBeDisabled();
  await expect(stage).toHaveAttribute("data-journey-phase", "fallback-settled");
  await expect(voile).toHaveCount(0);

  await page.getByTestId("forest-journey-previous").click();
  await expect(stage).toHaveAttribute("data-journey-phase", "fallback-settled");
  await expect(stage).toHaveAttribute("data-current-scene-id", "cover-gate");
  await expect(voile).toHaveCount(0);
});

test("non-loader world render failures switch to the DOM fallback", async ({ page }) => {
  await page.addInitScript(() => {
    const faultWindow = window as typeof window & {
      __forestForcedWorldRenderError: boolean;
      __forestSawProceduralReady: boolean;
    };
    faultWindow.__forestForcedWorldRenderError = false;
    faultWindow.__forestSawProceduralReady = false;

    new MutationObserver(() => {
      const canvasBoundary = document.querySelector<HTMLElement>(
        '[data-testid="forest-journey-canvas"]',
      );
      if (
        canvasBoundary?.dataset.worldMode === "procedural"
        && canvasBoundary.dataset.worldReady === "true"
      ) {
        faultWindow.__forestSawProceduralReady = true;
      }
    }).observe(document, {
      attributeFilter: ["data-world-mode", "data-world-ready"],
      attributes: true,
      childList: true,
      subtree: true,
    });

    const nativeIterator = Array.prototype[Symbol.iterator];
    Object.defineProperty(Array.prototype, Symbol.iterator, {
      configurable: true,
      /**
       * Every world variant iterates a small array of loaded textures while
       * building its materials: the hybrid photoreal terrain walks its three
       * PBR maps, and the legacy textured world destructures its four atlases.
       * Throwing there injects a render-time failure that is not an asset load
       * error, so no asset boundary may absorb it.
       */
      value: function forestTextureIterator(this: unknown[]) {
        const isLoadedForestTextureSet = this.length >= 3
          && this.length <= 4
          && this.every((item) => (
            typeof item === "object"
            && item !== null
            && (item as { isTexture?: unknown }).isTexture === true
          ));
        if (isLoadedForestTextureSet) {
          faultWindow.__forestForcedWorldRenderError = true;
          throw new Error("forced non-loader forest world render failure");
        }
        return nativeIterator.call(this);
      },
    });
  });

  await page.goto(LAB_PATH);
  await expect.poll(() => page.evaluate(() => (
    window as typeof window & { __forestForcedWorldRenderError: boolean }
  ).__forestForcedWorldRenderError)).toBe(true);
  await expect(page.getByTestId("forest-journey-stage")).toHaveAttribute(
    "data-renderer",
    "fallback",
  );
  await expect(page.getByTestId("forest-journey-fallback")).toBeVisible();
  expect(await page.evaluate(() => (
    window as typeof window & { __forestSawProceduralReady: boolean }
  ).__forestSawProceduralReady)).toBe(false);
});

test("context loss preserves the active semantic scene in fallback", async ({ page }) => {
  await page.goto(LAB_PATH);

  const canvasBoundary = page.getByTestId("forest-journey-canvas");
  const canvas = canvasBoundary.locator("canvas");
  const stage = page.getByTestId("forest-journey-stage");
  await expect(page.getByTestId("forest-journey-enter")).toBeEnabled();
  await canvas.evaluate((element) => {
    const forestWindow = window as typeof window & {
      __forestCanvas: HTMLCanvasElement;
      __forestFallbackTransitions: number;
    };
    forestWindow.__forestCanvas = element as HTMLCanvasElement;
    forestWindow.__forestFallbackTransitions = 0;
    new MutationObserver((records) => {
      for (const record of records) {
        if (
          record.attributeName === "data-renderer"
          && (record.target as HTMLElement).dataset.renderer === "fallback"
        ) {
          forestWindow.__forestFallbackTransitions += 1;
        }
      }
    }).observe(document.querySelector('[data-testid="forest-journey-stage"]')!, {
      attributeFilter: ["data-renderer"],
      attributes: true,
    });
  });

  await page.getByTestId("forest-journey-enter").click();
  await expect(stage).toHaveAttribute("data-journey-phase", "settled");
  await expect(stage).toHaveAttribute("data-scene", "families");
  expect(await canvas.evaluate((element) => (
    element === (window as typeof window & { __forestCanvas: HTMLCanvasElement }).__forestCanvas
  ))).toBe(true);

  const contextLoss = await canvas.evaluate((element) => {
    const first = new Event("webglcontextlost", { cancelable: true });
    const second = new Event("webglcontextlost", { cancelable: true });
    element.dispatchEvent(first);
    element.dispatchEvent(second);
    return {
      firstDefaultPrevented: first.defaultPrevented,
      secondDefaultPrevented: second.defaultPrevented,
    };
  });
  expect(contextLoss).toEqual({
    firstDefaultPrevented: true,
    secondDefaultPrevented: true,
  });

  await expect(page.getByTestId("forest-journey-fallback")).toBeVisible();
  await expect(stage).toHaveAttribute("data-scene", "families");
  await expect(stage).toHaveAttribute("data-current-scene-id", "families");
  await expect.poll(() => page.evaluate(() => (
    window as typeof window & { __forestFallbackTransitions: number }
  ).__forestFallbackTransitions)).toBe(1);
});

test("settled context loss hands free look to fallback without a yaw reset", async ({ page }) => {
  await page.goto(LAB_PATH);

  const canvasBoundary = page.getByTestId("forest-journey-canvas");
  const canvas = canvasBoundary.locator("canvas");
  const stage = page.getByTestId("forest-journey-stage");
  await expect(page.getByTestId("forest-journey-enter")).toBeEnabled();
  await page.getByTestId("forest-journey-enter").click();
  await expect(stage).toHaveAttribute("data-journey-phase", "settled");
  await expect(stage).toHaveAttribute("data-scene", "families");

  const canvasBounds = await canvasBoundary.boundingBox();
  expect(canvasBounds).not.toBeNull();
  if (!canvasBounds) return;
  const startX = canvasBounds.x + canvasBounds.width * 0.32;
  const startY = canvasBounds.y + canvasBounds.height * 0.28;
  await page.mouse.move(startX, startY);
  await page.mouse.down();
  await page.mouse.move(startX + 180, startY + 4, { steps: 6 });
  await page.mouse.up();
  await expect.poll(async () => Number(await stage.getAttribute("data-look-yaw"))).toBeGreaterThan(15);
  const yawBeforeLoss = Number(await stage.getAttribute("data-look-yaw"));

  await canvas.evaluate((element) => {
    element.dispatchEvent(new Event("webglcontextlost", { cancelable: true }));
  });
  await expect(page.getByTestId("forest-journey-fallback")).toBeVisible();
  await expect(stage).toHaveAttribute("data-scene", "families");
  await expect.poll(async () => Number(await stage.getAttribute("data-look-yaw"))).toBe(yawBeforeLoss);

  const gesturePoint = await findGesturePoint(page);
  await page.mouse.move(gesturePoint.x, gesturePoint.y);
  await page.mouse.down();
  await page.mouse.move(gesturePoint.x + 30, gesturePoint.y + 2, { steps: 3 });
  await page.mouse.up();
  await expect.poll(async () => Number(await stage.getAttribute("data-look-yaw"))).toBeGreaterThanOrEqual(yawBeforeLoss);
});

test("system reduced motion owns the 180ms fallback travel contract", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await forceWebglFallback(page);
  await page.goto(LAB_PATH);
  await expect(page.getByTestId("forest-journey-enter")).toBeEnabled();
  const stage = page.getByTestId("forest-journey-stage");
  const reducedMotion = page.getByTestId("forest-journey-reduced-motion");

  await page.getByTestId("forest-journey-enter").click();
  await expect(stage).toHaveAttribute("data-journey-phase", "travelling");
  const reducedAnimation = await page
    .locator('[data-testid="forest-fallback-physical-surface"][data-forest-visible="true"]')
    .evaluate((element) => {
    const animation = element.getAnimations().find((candidate) => (
      candidate instanceof CSSAnimation
      && candidate.animationName.includes("fallbackSceneFade")
    ));
    return {
      duration: Number(animation?.effect?.getTiming().duration ?? 0),
      name: animation instanceof CSSAnimation ? animation.animationName : "",
    };
    });
  expect(reducedAnimation.duration).toBe(180);
  expect(reducedAnimation.name).toContain("fallbackSceneFade");
  await expect(stage).toHaveAttribute("data-journey-phase", "fallback-settled", {
    timeout: 450,
  });
  await expect(reducedMotion).toHaveAttribute("aria-pressed", "true");

  await reducedMotion.click();
  await expect(reducedMotion).toHaveAttribute("aria-pressed", "true");
  await reducedMotion.click();
  await expect(reducedMotion).toHaveAttribute("aria-pressed", "true");
});

test("system reduced WebGL arrives within 600ms with look and authored cues frozen", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto(LAB_PATH);

  const canvas = page.getByTestId("forest-journey-canvas");
  const stage = page.getByTestId("forest-journey-stage");
  const reducedMotion = page.getByTestId("forest-journey-reduced-motion");
  await expect(canvas).toHaveAttribute("data-world-ready", "true");
  await installForestCameraRecorder(page);

  const travel = await stage.evaluate((element) => new Promise<{
    disabledDuringTravel: boolean;
    durationMs: number;
  }>((resolve, reject) => {
    const startedAt = performance.now();
    let sawTravel = false;
    let disabledDuringTravel = false;
    const timeout = window.setTimeout(() => {
      observer.disconnect();
      reject(new Error("Reduced WebGL entry did not settle within 600ms"));
    }, 600);
    const inspect = () => {
      const phase = element.dataset.journeyPhase;
      const control = element.querySelector<HTMLButtonElement>(
        '[data-testid="forest-journey-reduced-motion"]',
      );
      if (phase === "travelling") {
        sawTravel = true;
        disabledDuringTravel ||= control?.disabled === true;
      }
      if (sawTravel && phase === "settled") {
        window.clearTimeout(timeout);
        observer.disconnect();
        resolve({
          disabledDuringTravel,
          durationMs: performance.now() - startedAt,
        });
      }
    };
    const observer = new MutationObserver(inspect);
    observer.observe(element, {
      attributeFilter: ["data-journey-phase"],
      attributes: true,
      childList: true,
      subtree: true,
    });
    element.querySelector<HTMLButtonElement>(
      '[data-testid="forest-journey-enter"]',
    )?.click();
    inspect();
  }));

  expect(travel.durationMs).toBeLessThanOrEqual(600);
  expect(travel.disabledDuringTravel).toBe(true);
  await expect(stage).toHaveAttribute("data-look-pitch", "0");
  await expect(stage).toHaveAttribute("data-look-yaw", "0");
  const recording = await readForestCameraRecording(page);
  expect(recording.cuePeak).toBe(0);
  for (const attribute of [
    "data-cue-dove-flight",
    "data-cue-petal-gust",
    "data-cue-rabbit-guide",
    "data-cue-voile-lift",
    "data-cue-wind-strength",
    "data-travel-progress",
  ]) {
    await expect(canvas).toHaveAttribute(attribute, "0");
  }

  await expect(reducedMotion).toHaveAttribute("aria-pressed", "true");
  await reducedMotion.click();
  await expect(reducedMotion).toHaveAttribute("aria-pressed", "true");
});

test("entry and navigation buttons focus only the arrived scene heading", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await forceWebglFallback(page);
  await page.goto(LAB_PATH);

  const stage = page.getByTestId("forest-journey-stage");
  await page.getByTestId("forest-journey-enter").click();
  await expect(stage).toHaveAttribute("data-current-scene-id", "families");
  const familiesHeading = page.locator(
    '[data-forest-scene-id="families"][data-forest-interactive="true"] h2',
  );
  await expect(familiesHeading).toBeFocused();
  await expect.poll(() => familiesHeading.evaluate(
    (element) => getComputedStyle(element).outlineStyle,
  )).not.toBe("none");

  await page.getByTestId("forest-journey-next").click();
  await expect(stage).toHaveAttribute("data-current-scene-id", "opening-message");
  const openingHeading = page.locator(
    '[data-forest-scene-id="opening-message"][data-forest-interactive="true"] h2',
  );
  await expect(openingHeading).toBeFocused();
  await expect.poll(() => openingHeading.evaluate(
    (element) => getComputedStyle(element).outlineStyle,
  )).not.toBe("none");
  await expect(page.locator(
    '[data-forest-scene-id]:not([data-forest-interactive="true"]) h2:focus',
  )).toHaveCount(0);
});

test("a focused active scene heading keeps Arrow navigation ownership", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await forceWebglFallback(page);
  await page.goto(LAB_PATH);

  const stage = page.getByTestId("forest-journey-stage");
  await page.getByTestId("forest-journey-enter").click();
  await expect(stage).toHaveAttribute("data-current-scene-id", "families");
  const familiesHeading = page.locator(
    '[data-forest-scene-id="families"][data-forest-interactive="true"] h2',
  );
  await familiesHeading.focus();
  await familiesHeading.press("ArrowRight");

  await expect(stage).toHaveAttribute("data-current-scene-id", "opening-message");
  await expect(page.locator(
    '[data-forest-scene-id="opening-message"][data-forest-interactive="true"] h2',
  )).toBeFocused();
});

test("wheel and gesture arrivals preserve the existing persistent focus source", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await forceWebglFallback(page);
  await page.goto(LAB_PATH);

  const stage = page.getByTestId("forest-journey-stage");
  await page.getByTestId("forest-journey-enter").click();
  await expect(stage).toHaveAttribute("data-current-scene-id", "families");
  const gestureSurface = page.getByTestId("forest-journey-gesture-surface");
  await page.locator("body").evaluate((element) => {
    element.tabIndex = -1;
    element.focus();
  });

  await gestureSurface.dispatchEvent("wheel", { deltaY: 120 });
  await expect(stage).toHaveAttribute("data-current-scene-id", "opening-message");
  await expect(page.locator("body")).toBeFocused();

  const point = await findGesturePoint(page);
  await gestureSurface.dispatchEvent("pointerdown", {
    button: 0,
    clientX: point.x,
    clientY: point.y,
    isPrimary: true,
    pointerId: 71,
    pointerType: "touch",
  });
  await gestureSurface.dispatchEvent("pointermove", {
    clientX: point.x,
    clientY: point.y + 80,
    isPrimary: true,
    pointerId: 71,
    pointerType: "touch",
  });
  await gestureSurface.dispatchEvent("pointerup", {
    clientX: point.x,
    clientY: point.y + 80,
    isPrimary: true,
    pointerId: 71,
    pointerType: "touch",
  });
  await expect(stage).toHaveAttribute("data-current-scene-id", "families");
  await expect(page.locator("body")).toBeFocused();
});

test("fallback atlas bands use bounded decorative cells", async ({ page }) => {
  await forceWebglFallback(page);
  await page.goto(LAB_PATH);

  const fallback = page.getByTestId("forest-journey-fallback");
  const foliage = fallback.locator('[data-fallback-atlas="foliage"]');
  const wildflowers = fallback.locator('[data-fallback-atlas="wildflower"]');
  const petals = fallback.locator('[data-fallback-atlas="petal"]');
  await expect(foliage).toHaveCount(12);
  await expect(wildflowers).toHaveCount(7);
  await expect(petals).toHaveCount(8);

  for (const bandName of ["far-trees", "mid-trees", "near-foliage"]) {
    const bandStyle = await fallback.locator(`[data-fallback-band="${bandName}"]`).evaluate(
      (element) => {
        const style = getComputedStyle(element);
        return { image: style.backgroundImage, repeat: style.backgroundRepeat };
      },
    );
    expect(bandStyle.image).toBe("none");
    expect(bandStyle.repeat).toBe("no-repeat");
  }

  const grassStyle = await fallback.locator('[data-fallback-band="grass"]').evaluate(
    (element) => {
      const style = getComputedStyle(element);
      return { image: style.backgroundImage, repeat: style.backgroundRepeat };
    },
  );
  expect(grassStyle.image).toContain("ground-detail.webp");
  expect(grassStyle.repeat).toContain("repeat");

  for (const [sprites, atlasName, backgroundSize] of [
    [foliage, "foliage-atlas.webp", "200% 400%"],
    [wildflowers, "wildflower-atlas.webp", "400% 300%"],
    [petals, "petal-atlas.webp", "400% 400%"],
  ] as const) {
    const styles = await sprites.evaluateAll((elements) => elements.map((element) => {
      const style = getComputedStyle(element);
      return {
        image: style.backgroundImage,
        positionX: Number.parseFloat(style.backgroundPositionX),
        positionY: Number.parseFloat(style.backgroundPositionY),
        repeat: style.backgroundRepeat,
        size: style.backgroundSize,
      };
    }));
    expect(styles.every((style) => style.image.includes(atlasName))).toBe(true);
    expect(styles.every((style) => style.repeat === "no-repeat")).toBe(true);
    expect(styles.every((style) => style.size === backgroundSize)).toBe(true);
    expect(styles.every((style) => (
      style.positionX >= 0 && style.positionX <= 100
      && style.positionY >= 0 && style.positionY <= 100
    ))).toBe(true);
  }
});

test("fallback travel animates the destination and keeps it inert until arrival", async ({ page }) => {
  await enterFallback(page);
  const stage = page.getByTestId("forest-journey-stage");
  const physicalSurface = page.locator(
    '[data-testid="forest-fallback-physical-surface"][data-forest-visible="true"]',
  );

  await page.getByTestId("forest-journey-next").click();
  await expect(stage).toHaveAttribute("data-journey-phase", "travelling");
  await expect(stage).toHaveAttribute("data-current-scene-id", "families");
  expect(await physicalSurface.getAttribute("data-scene-type")).toBe("opening-message");

  const fullMotionAnimation = await physicalSurface.evaluate((element) => {
    const animation = element.getAnimations()[0];
    return {
      duration: Number(animation?.effect?.getTiming().duration ?? 0),
      inertAncestor: element.closest("[inert]") !== null,
      name: animation instanceof CSSAnimation ? animation.animationName : "",
    };
  });
  expect(fullMotionAnimation.duration).toBe(650);
  expect(fullMotionAnimation.inertAncestor).toBe(true);
  expect(fullMotionAnimation.name).toContain("fallbackSceneTravel");

  await expect(stage).toHaveAttribute("data-journey-phase", "fallback-settled");
  expect(
    await physicalSurface.evaluate((element) => element.closest("[inert]") !== null),
  ).toBe(false);
  await expect.poll(
    async () => physicalSurface.evaluate((element) => element.getAnimations().length),
  ).toBe(0);

  await page.getByTestId("forest-journey-reduced-motion").click();
  await page.getByTestId("forest-journey-next").click();
  await expect(stage).toHaveAttribute("data-journey-phase", "travelling");

  const reducedAnimation = await physicalSurface.evaluate((element) => {
    const animation = element.getAnimations()[0];
    return {
      duration: Number(animation?.effect?.getTiming().duration ?? 0),
      inertAncestor: element.closest("[inert]") !== null,
      name: animation instanceof CSSAnimation ? animation.animationName : "",
    };
  });
  expect(reducedAnimation.duration).toBe(180);
  expect(reducedAnimation.inertAncestor).toBe(true);
  expect(reducedAnimation.name).toContain("fallbackSceneFade");
  expect(reducedAnimation.name).not.toBe(fullMotionAnimation.name);

  await expect(stage).toHaveAttribute("data-journey-phase", "fallback-settled");
  expect(
    await physicalSurface.evaluate((element) => element.closest("[inert]") !== null),
  ).toBe(false);
});

test.describe("mobile fallback input", () => {
  test.use({ viewport: { height: 844, width: 390 } });

  test("one upward pointer swipe advances exactly one scene", async ({ page }) => {
    await enterFallback(page);
    const stage = page.getByTestId("forest-journey-stage");
    const point = await findGesturePoint(page, [0.82, 0.74, 0.2, 0.12]);

    await page.mouse.move(point.x, point.y);
    await page.mouse.down();
    await page.mouse.move(point.x + 4, point.y - 90, { steps: 4 });
    await page.mouse.up();

    await expect(stage).toHaveAttribute("data-journey-phase", "travelling");
    await expect(stage).toHaveAttribute("data-journey-phase", "fallback-settled");
    await expect(stage).toHaveAttribute("data-scene-index", "2");
  });

  test("horizontal pointer drag changes look without changing scenes", async ({ page }) => {
    await enterFallback(page);
    const stage = page.getByTestId("forest-journey-stage");
    const point = await findGesturePoint(page, [0.2, 0.12, 0.82, 0.74]);
    const endX = Math.min(point.x + 80, 380);

    await page.mouse.move(point.x, point.y);
    await page.mouse.down();
    await page.mouse.move(endX, point.y + 5, { steps: 4 });
    await page.mouse.up();

    await expect(stage).toHaveAttribute("data-scene-index", "1");
    await expect.poll(async () => Number(await stage.getAttribute("data-look-yaw"))).toBeGreaterThan(0);
  });

  test("one signed wheel burst advances exactly one scene", async ({ page }) => {
    await enterFallback(page);
    const stage = page.getByTestId("forest-journey-stage");
    const point = await findGesturePoint(page);

    await page.mouse.move(point.x, point.y);
    await page.mouse.wheel(0, 70);
    await page.mouse.wheel(0, 40);
    await page.mouse.wheel(0, -2);

    await expect(stage).toHaveAttribute("data-journey-phase", "travelling");
    await expect(stage).toHaveAttribute("data-journey-phase", "fallback-settled");
    await expect(stage).toHaveAttribute("data-scene-index", "2");
  });

  test("controls and touch ownership stay mobile-safe", async ({ page }) => {
    await forceWebglFallback(page);
    await page.goto(LAB_PATH);
    const stage = page.getByTestId("forest-journey-stage");
    const gestureSurface = page.getByTestId("forest-journey-gesture-surface");
    await expect(page.getByTestId("forest-journey-enter")).toBeEnabled();

    const thresholdTouchAction = await stage.evaluate(
      (element) => getComputedStyle(element).touchAction,
    );
    expect(thresholdTouchAction).toBe("auto");
    expect(
      await gestureSurface.evaluate((element) => getComputedStyle(element).touchAction),
    ).toBe("auto");
    const entryBox = await page.getByTestId("forest-journey-enter").boundingBox();
    expect(entryBox?.width).toBeGreaterThanOrEqual(44);
    expect(entryBox?.height).toBeGreaterThanOrEqual(44);

    await page.getByTestId("forest-journey-enter").click();
    await expect(stage).toHaveAttribute("data-journey-phase", "fallback-settled");
    expect(await stage.evaluate((element) => getComputedStyle(element).touchAction)).toBe("auto");
    expect(
      await gestureSurface.evaluate((element) => getComputedStyle(element).touchAction),
    ).toBe("none");
    expect(
      await page.locator("[data-forest-interactive]").evaluate(
        (element) => getComputedStyle(element).touchAction,
      ),
    ).toBe("auto");

    for (const testId of [
      "forest-journey-previous",
      "forest-journey-next",
      "forest-journey-reduced-motion",
    ]) {
      const box = await page.getByTestId(testId).boundingBox();
      expect(box?.width).toBeGreaterThanOrEqual(44);
      expect(box?.height).toBeGreaterThanOrEqual(44);
    }

    const reducedMotion = page.getByTestId("forest-journey-reduced-motion");
    await expect(reducedMotion).toHaveAttribute("aria-pressed", "false");
    await reducedMotion.click();
    await expect(reducedMotion).toHaveAttribute("aria-pressed", "true");

    await page.getByTestId("forest-journey-next").click();
    await expect(stage).toHaveAttribute("data-journey-phase", "travelling");
    expect(
      await gestureSurface.evaluate((element) => getComputedStyle(element).touchAction),
    ).toBe("auto");
    await expect(stage).toHaveAttribute("data-journey-phase", "fallback-settled");
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(
      await page.evaluate(() => window.innerWidth),
    );
  });

  test("physical paper and native controls keep gestures away from journey input", async ({ page }) => {
    await enterFallback(page);
    const stage = page.getByTestId("forest-journey-stage");
    const physicalSurface = page.locator("[data-forest-interactive]");
    const surfaceBox = await physicalSurface.boundingBox();
    expect(surfaceBox).not.toBeNull();
    if (!surfaceBox) return;

    const initialYaw = await stage.getAttribute("data-look-yaw") ?? "0";
    const initialIndex = await stage.getAttribute("data-scene-index") ?? "1";
    const paperX = surfaceBox.x + surfaceBox.width / 2;
    const paperY = surfaceBox.y + surfaceBox.height / 2;
    await page.mouse.move(paperX, paperY);
    await page.mouse.down();
    await page.mouse.move(paperX + 65, paperY - 70, { steps: 4 });
    await page.mouse.up();
    await page.mouse.move(paperX, paperY);
    await page.mouse.wheel(0, 90);
    await page.waitForTimeout(180);
    await expect(stage).toHaveAttribute("data-look-yaw", initialYaw);
    await expect(stage).toHaveAttribute("data-scene-index", initialIndex);

    const next = page.getByTestId("forest-journey-next");
    const nextBox = await next.boundingBox();
    expect(nextBox).not.toBeNull();
    if (!nextBox) return;
    await page.mouse.move(
      nextBox.x + nextBox.width / 2,
      nextBox.y + nextBox.height / 2,
    );
    await page.mouse.wheel(0, 90);
    await page.waitForTimeout(180);
    await expect(stage).toHaveAttribute("data-scene-index", initialIndex);

    await next.click();
    await expect(stage).toHaveAttribute("data-journey-phase", "travelling");
    await expect(stage).toHaveAttribute("data-journey-phase", "fallback-settled");
    await expect(stage).toHaveAttribute("data-scene-index", "2");
  });

  test("a second pointer cannot steal the active primary gesture", async ({ page }) => {
    await enterFallback(page);
    const stage = page.getByTestId("forest-journey-stage");
    const gestureSurface = page.getByTestId("forest-journey-gesture-surface");

    await gestureSurface.dispatchEvent("pointerdown", {
      button: 0,
      clientX: 190,
      clientY: 620,
      isPrimary: true,
      pointerId: 21,
      pointerType: "touch",
    });
    await gestureSurface.dispatchEvent("pointerdown", {
      button: 0,
      clientX: 80,
      clientY: 430,
      isPrimary: false,
      pointerId: 22,
      pointerType: "touch",
    });
    await gestureSurface.dispatchEvent("pointermove", {
      clientX: 192,
      clientY: 520,
      isPrimary: true,
      pointerId: 21,
      pointerType: "touch",
    });
    await gestureSurface.dispatchEvent("pointerup", {
      clientX: 192,
      clientY: 520,
      isPrimary: true,
      pointerId: 21,
      pointerType: "touch",
    });

    await expect(stage).toHaveAttribute("data-journey-phase", "travelling");
    await expect(stage).toHaveAttribute("data-journey-phase", "fallback-settled");
    await expect(stage).toHaveAttribute("data-scene-index", "2");
  });
});

test("RSVP validates locally, isolates wheel input, and preserves a successful draft", async ({
  page,
}) => {
  await enterFallback(page);
  await page.getByTestId("forest-journey-reduced-motion").click();
  await navigateToForestScene(page, "rsvp");

  const stage = page.getByTestId("forest-journey-stage");
  const form = page.getByTestId("forest-rsvp-form");
  await expect(form).toHaveAttribute("data-forest-interactive", "true");
  await expect(form.locator('input[name="guestName"]')).toHaveValue("");
  await expect(form.locator('select[name="attendance"]')).toHaveValue("yes");
  await expect(form.locator('input[name="partySize"]')).toHaveValue("1");

  await form.getByRole("button", { name: "Gửi xác nhận" }).click();
  await expect(form.getByRole("status")).toHaveText("Vui lòng nhập tên của bạn.");

  await form.locator('input[name="guestName"]').fill("  Khách mời thử nghiệm  ");
  await form.locator('select[name="attendance"]').selectOption("no");
  await form.locator('input[name="partySize"]').fill("3");
  await form.locator('textarea[name="notes"]').fill("  Hẹn gặp hai bạn sau lễ cưới.  ");
  const sceneIndex = await stage.getAttribute("data-current-scene-index");
  const wheelWasPrevented = await form.locator('textarea[name="notes"]').evaluate((element) => {
    const event = new WheelEvent("wheel", { bubbles: true, cancelable: true, deltaY: 120 });
    element.dispatchEvent(event);
    return event.defaultPrevented;
  });
  expect(wheelWasPrevented).toBe(false);
  await page.waitForTimeout(180);
  await expect(stage).toHaveAttribute("data-current-scene-index", sceneIndex ?? "11");

  await form.getByRole("button", { name: "Gửi xác nhận" }).click();
  await expect(form.getByRole("status")).toHaveText("Cảm ơn bạn đã xác nhận.");
  await expect(form.getByTestId("forest-rsvp-submission")).toContainText(
    "Khách mời thử nghiệm",
  );

  await navigateToForestScene(page, "wishes");
  await navigateToForestScene(page, "rsvp");
  await expect(form.locator('input[name="guestName"]')).toHaveValue(
    "  Khách mời thử nghiệm  ",
  );
  await expect(form.locator('select[name="attendance"]')).toHaveValue("no");
  await expect(form.locator('input[name="partySize"]')).toHaveValue("3");
  await expect(form.locator('textarea[name="notes"]')).toHaveValue(
    "  Hẹn gặp hai bạn sau lễ cưới.  ",
  );
  await expect(form.getByRole("status")).toHaveText("Cảm ơn bạn đã xác nhận.");
});

test("RSVP rejects an out-of-range party size without replacing the draft", async ({ page }) => {
  await enterFallback(page);
  await page.getByTestId("forest-journey-reduced-motion").click();
  await navigateToForestScene(page, "rsvp");

  const form = page.getByTestId("forest-rsvp-form");
  await form.locator('input[name="guestName"]').fill("Khách kiểm thử");
  await form.locator('input[name="partySize"]').fill("11");
  await form.getByRole("button", { name: "Gửi xác nhận" }).click();

  await expect(form.getByRole("status")).toHaveText(
    "Vui lòng nhập số khách hợp lệ.",
  );
  await expect(form.locator('input[name="guestName"]')).toHaveValue("Khách kiểm thử");
  await expect(form.locator('input[name="partySize"]')).toHaveValue("11");
  await expect(form.getByTestId("forest-rsvp-submission")).toHaveCount(0);
});

test("RSVP sentinel announces a recoverable local failure and preserves every field", async ({
  page,
}) => {
  await enterFallback(page);
  await page.getByTestId("forest-journey-reduced-motion").click();
  await navigateToForestScene(page, "rsvp");

  const form = page.getByTestId("forest-rsvp-form");
  await form.locator('input[name="guestName"]').fill("__forest_lab_failure__");
  await form.locator('select[name="attendance"]').selectOption("no");
  await form.locator('input[name="partySize"]').fill("4");
  await form.locator('textarea[name="notes"]').fill("Giữ nguyên bản nháp này");
  await form.getByRole("button", { name: "Gửi xác nhận" }).click();

  await expect(form.getByRole("status")).toHaveText(
    "Không thể gửi biểu mẫu lúc này. Vui lòng thử lại.",
  );
  await expect(form.locator('input[name="guestName"]')).toHaveValue(
    "__forest_lab_failure__",
  );
  await expect(form.locator('select[name="attendance"]')).toHaveValue("no");
  await expect(form.locator('input[name="partySize"]')).toHaveValue("4");
  await expect(form.locator('textarea[name="notes"]')).toHaveValue(
    "Giữ nguyên bản nháp này",
  );
  await expect(form.getByTestId("forest-rsvp-submission")).toHaveCount(0);
});

test("wish guestbook starts with two notes, isolates scrolling, and persists local additions", async ({
  page,
}) => {
  await enterFallback(page);
  await page.getByTestId("forest-journey-reduced-motion").click();
  await navigateToForestScene(page, "wishes");

  const stage = page.getByTestId("forest-journey-stage");
  const guestbook = page.getByTestId("forest-wishes-guestbook");
  const notes = guestbook.getByTestId("forest-wish-note");
  await expect(guestbook).toHaveAttribute("data-forest-interactive", "true");
  await expect(notes).toHaveCount(2);
  await expect(notes.nth(0)).toContainText("Nguyễn Thanh Hà");
  await expect(notes.nth(1)).toContainText("Trần Minh Đức");

  await guestbook.locator('input[name="wishName"]').fill("  Mai Anh  ");
  await guestbook.locator('textarea[name="wishMessage"]').fill(
    "  Chúc hai bạn luôn hạnh phúc!  ",
  );
  const sceneIndex = await stage.getAttribute("data-current-scene-index");
  const wheelWasPrevented = await guestbook.getByTestId("forest-wish-notes").evaluate(
    (element) => {
      const event = new WheelEvent("wheel", { bubbles: true, cancelable: true, deltaY: 140 });
      element.dispatchEvent(event);
      return event.defaultPrevented;
    },
  );
  expect(wheelWasPrevented).toBe(false);
  await page.waitForTimeout(180);
  await expect(stage).toHaveAttribute("data-current-scene-index", sceneIndex ?? "12");

  await guestbook.getByRole("button", { name: "Gửi lời chúc" }).click();
  await expect(guestbook.getByRole("status")).toHaveText("Cảm ơn lời chúc của bạn.");
  await expect(notes).toHaveCount(3);
  await expect(notes.nth(2)).toContainText("Mai Anh");
  await expect(notes.nth(2)).toContainText("Chúc hai bạn luôn hạnh phúc!");
  await expect(guestbook.locator('input[name="wishName"]')).toHaveValue("");
  await expect(guestbook.locator('textarea[name="wishMessage"]')).toHaveValue("");

  await navigateToForestScene(page, "gift");
  await navigateToForestScene(page, "wishes");
  await expect(notes).toHaveCount(3);
  await expect(notes.nth(2)).toContainText("Mai Anh");
});

test("wish guestbook rejects empty and sentinel submissions without losing its draft", async ({
  page,
}) => {
  await enterFallback(page);
  await page.getByTestId("forest-journey-reduced-motion").click();
  await navigateToForestScene(page, "wishes");

  const guestbook = page.getByTestId("forest-wishes-guestbook");
  const notes = guestbook.getByTestId("forest-wish-note");
  await guestbook.getByRole("button", { name: "Gửi lời chúc" }).click();
  await expect(guestbook.getByRole("status")).toHaveText("Vui lòng viết lời chúc.");
  await expect(notes).toHaveCount(2);

  await guestbook.locator('input[name="wishName"]').fill("Khách kiểm thử");
  await guestbook.locator('textarea[name="wishMessage"]').fill("__forest_lab_failure__");
  await guestbook.getByRole("button", { name: "Gửi lời chúc" }).click();
  await expect(guestbook.getByRole("status")).toHaveText(
    "Không thể gửi biểu mẫu lúc này. Vui lòng thử lại.",
  );
  await expect(guestbook.locator('input[name="wishName"]')).toHaveValue(
    "Khách kiểm thử",
  );
  await expect(guestbook.locator('textarea[name="wishMessage"]')).toHaveValue(
    "__forest_lab_failure__",
  );
  await expect(notes).toHaveCount(2);
});

test("map disclosure keeps the full local query, native directions URL, and journey isolation", async ({
  page,
}) => {
  await enterFallback(page);
  await page.getByTestId("forest-journey-reduced-motion").click();
  await navigateToForestScene(page, "map");

  const stage = page.getByTestId("forest-journey-stage");
  const map = page.getByTestId("forest-map-paper");
  const disclosure = map.getByTestId("forest-map-disclosure");
  const query = "Trung Tâm Tiệc Cưới Thung Lũng Cá, 25 Phan Chu Trinh, Đà Lạt";
  const expectedUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
  await expect(map).toHaveAttribute("data-forest-interactive", "true");
  await expect(map).toContainText(query);
  await expect(map.locator("iframe")).toHaveCount(0);
  const directions = map.getByRole("link", { name: "Chỉ đường" });
  await expect(directions).toHaveAttribute("href", expectedUrl);
  await expect(directions).toHaveAttribute("target", "_blank");
  await expect(directions).toHaveAttribute("rel", "noreferrer");

  const sceneIndex = await stage.getAttribute("data-current-scene-index");
  await disclosure.locator("summary").click();
  await expect(disclosure).toHaveAttribute("open", "");
  await expect(stage).toHaveAttribute("data-current-scene-index", sceneIndex ?? "10");

  await navigateToForestScene(page, "rsvp");
  await navigateToForestScene(page, "map");
  await expect(disclosure).toHaveAttribute("open", "");
});

test("gift envelopes follow groom-first order, isolate interaction, and restore opener focus", async ({
  page,
}) => {
  await enterFallback(page);
  await page.getByTestId("forest-journey-reduced-motion").click();
  await navigateToForestScene(page, "gift");

  const stage = page.getByTestId("forest-journey-stage");
  const gifts = page.getByTestId("forest-gift-envelopes");
  const envelopes = gifts.getByTestId("forest-gift-envelope");
  await expect(gifts).toHaveAttribute("data-forest-interactive", "true");
  await expect(envelopes).toHaveCount(2);
  await expect(envelopes.nth(0)).toHaveAttribute("data-gift-side", "groom");
  await expect(envelopes.nth(1)).toHaveAttribute("data-gift-side", "bride");
  expect(await envelopes.evaluateAll((elements) => elements.every(
    (element) => element instanceof HTMLButtonElement,
  ))).toBe(true);
  await expect(gifts.getByTestId("forest-gift-details")).toHaveCount(0);

  const sceneIndex = await stage.getAttribute("data-current-scene-index");
  const groomEnvelope = envelopes.nth(0);
  await groomEnvelope.click();
  const groomDetails = gifts.getByTestId("forest-gift-details");
  await expect(groomDetails).toHaveAttribute("data-gift-side", "groom");
  await expect(groomDetails).toContainText("Trần Minh Quân");
  await expect(groomDetails).toContainText("111111111");
  const wheelWasPrevented = await groomDetails.evaluate((element) => {
    const event = new WheelEvent("wheel", { bubbles: true, cancelable: true, deltaY: 100 });
    element.dispatchEvent(event);
    return event.defaultPrevented;
  });
  expect(wheelWasPrevented).toBe(false);
  await gifts.getByRole("button", { name: "Đóng phong bao" }).click();
  await expect(groomEnvelope).toBeFocused();
  await expect(stage).toHaveAttribute("data-current-scene-index", sceneIndex ?? "13");

  await envelopes.nth(1).click();
  const brideDetails = gifts.getByTestId("forest-gift-details");
  await expect(brideDetails).toHaveAttribute("data-gift-side", "bride");
  await expect(brideDetails).toContainText("Nguyễn Bảo Trân");
  await expect(brideDetails).toContainText("000000000");
  await expect(gifts.locator("[data-forest-qr], canvas, img")).toHaveCount(0);
  await gifts.getByRole("button", { name: "Đóng phong bao" }).click();
  await expect(envelopes.nth(1)).toBeFocused();
});

test("WebGL interactive clearings expose the shared map, RSVP, wishes, and gift controls", async ({
  page,
}) => {
  await enterWebgl(page);
  await page.getByTestId("forest-journey-reduced-motion").click();

  await navigateToForestScene(page, "map");
  await expectActivePhysicalScene(page, "map", "Bản đồ");
  await expect(page.getByTestId("forest-map-paper")).toBeVisible();

  await navigateToForestScene(page, "rsvp");
  await expectActivePhysicalScene(page, "rsvp", "Xác nhận tham dự");
  await expect(page.getByTestId("forest-rsvp-form")).toBeVisible();

  await navigateToForestScene(page, "wishes");
  await expectActivePhysicalScene(page, "wishes", "Lời chúc");
  await expect(page.getByTestId("forest-wishes-guestbook")).toBeVisible();

  await navigateToForestScene(page, "gift");
  await expectActivePhysicalScene(page, "gift", "Phong bao mừng cưới");
  await expect(page.getByTestId("forest-gift-envelopes")).toBeVisible();
});

test("desktop WebGL RSVP initially keeps its submit button inside the physical surface", async ({
  page,
}) => {
  await page.setViewportSize({ height: 900, width: 1440 });
  await enterWebgl(page);
  await page.getByTestId("forest-journey-reduced-motion").click();
  await navigateToForestScene(page, "rsvp");

  const surface = page.locator(
    '[data-testid="forest-scene-rsvp"][data-forest-interactive="true"]',
  );
  const submit = surface.getByRole("button", { name: "Gửi xác nhận" });
  await expect(surface).toBeVisible();
  await expect(submit).toBeVisible();
  expect(await surface.evaluate((element) => element.scrollTop)).toBe(0);

  const surfaceBox = await surface.boundingBox();
  const submitBox = await submit.boundingBox();
  if (!surfaceBox || !submitBox) {
    throw new Error("RSVP surface and submit button must expose measurable bounds");
  }

  const tolerance = 1;
  expect(submitBox.x).toBeGreaterThanOrEqual(surfaceBox.x - tolerance);
  expect(submitBox.y).toBeGreaterThanOrEqual(surfaceBox.y - tolerance);
  expect(submitBox.x + submitBox.width).toBeLessThanOrEqual(
    surfaceBox.x + surfaceBox.width + tolerance,
  );
  expect(submitBox.y + submitBox.height).toBeLessThanOrEqual(
    surfaceBox.y + surfaceBox.height + tolerance,
  );
  expect(submitBox.x).toBeGreaterThanOrEqual(0);
  expect(submitBox.y).toBeGreaterThanOrEqual(0);
  expect(submitBox.x + submitBox.width).toBeLessThanOrEqual(1440);
  expect(submitBox.y + submitBox.height).toBeLessThanOrEqual(900);
});

test("interactive RSVP state survives a WebGL context-loss handoff to fallback", async ({
  page,
}) => {
  await enterWebgl(page);
  await page.getByTestId("forest-journey-reduced-motion").click();
  await navigateToForestScene(page, "rsvp");

  const stage = page.getByTestId("forest-journey-stage");
  const form = page.getByTestId("forest-rsvp-form");
  await form.locator('input[name="guestName"]').fill("Khách qua fallback");
  await form.locator('select[name="attendance"]').selectOption("yes");
  await form.locator('input[name="partySize"]').fill("2");
  await form.locator('textarea[name="notes"]').fill("Giữ trạng thái khi đổi renderer");
  await form.getByRole("button", { name: "Gửi xác nhận" }).click();
  await expect(form.getByRole("status")).toHaveText("Cảm ơn bạn đã xác nhận.");

  await page.getByTestId("forest-journey-canvas").locator("canvas").evaluate((element) => {
    element.dispatchEvent(new Event("webglcontextlost", { cancelable: true }));
  });

  await expect(stage).toHaveAttribute("data-renderer", "fallback");
  await expect(stage).toHaveAttribute("data-current-scene-id", "rsvp");
  await expect(page.getByTestId("forest-journey-fallback")).toBeVisible();
  await expect(form.locator('input[name="guestName"]')).toHaveValue("Khách qua fallback");
  await expect(form.locator('select[name="attendance"]')).toHaveValue("yes");
  await expect(form.locator('input[name="partySize"]')).toHaveValue("2");
  await expect(form.locator('textarea[name="notes"]')).toHaveValue(
    "Giữ trạng thái khi đổi renderer",
  );
  await expect(form.getByRole("status")).toHaveText("Cảm ơn bạn đã xác nhận.");
});

test("native controls cover journey, calendar, map, forms, wishes, and gift actions", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await forceWebglFallback(page);
  await page.goto(LAB_PATH);

  const entry = page.getByTestId("forest-journey-enter");
  expect(await entry.evaluate((element) => element instanceof HTMLButtonElement)).toBe(true);
  await entry.click();
  for (const testId of ["forest-journey-previous", "forest-journey-next"]) {
    expect(await page.getByTestId(testId).evaluate(
      (element) => element instanceof HTMLButtonElement,
    )).toBe(true);
  }

  await navigateToForestScene(page, "calendar");
  expect(await page.locator(
    '[data-forest-scene-id="calendar"][data-forest-interactive="true"] a',
  ).evaluate((element) => element instanceof HTMLAnchorElement)).toBe(true);

  await navigateToForestScene(page, "map");
  const map = page.getByTestId("forest-map-paper");
  expect(await map.locator("summary").evaluate(
    (element) => element instanceof HTMLElement && element.tagName === "SUMMARY",
  )).toBe(true);
  expect(await map.getByRole("link", { name: "Chỉ đường" }).evaluate(
    (element) => element instanceof HTMLAnchorElement,
  )).toBe(true);

  await navigateToForestScene(page, "rsvp");
  const rsvp = page.getByTestId("forest-rsvp-form");
  expect(await rsvp.evaluate((element) => element instanceof HTMLFormElement)).toBe(true);
  expect(await rsvp.locator('input[name="guestName"]').evaluate(
    (element) => element instanceof HTMLInputElement,
  )).toBe(true);
  expect(await rsvp.locator('select[name="attendance"]').evaluate(
    (element) => element instanceof HTMLSelectElement,
  )).toBe(true);
  expect(await rsvp.locator('textarea[name="notes"]').evaluate(
    (element) => element instanceof HTMLTextAreaElement,
  )).toBe(true);
  expect(await rsvp.locator('button[type="submit"]').evaluate(
    (element) => element instanceof HTMLButtonElement,
  )).toBe(true);

  await navigateToForestScene(page, "wishes");
  const wishForm = page.getByTestId("forest-wishes-guestbook").locator("form");
  expect(await wishForm.evaluate((element) => element instanceof HTMLFormElement)).toBe(true);
  expect(await wishForm.locator('input[name="wishName"]').evaluate(
    (element) => element instanceof HTMLInputElement,
  )).toBe(true);
  expect(await wishForm.locator('textarea[name="wishMessage"]').evaluate(
    (element) => element instanceof HTMLTextAreaElement,
  )).toBe(true);
  expect(await wishForm.locator('button[type="submit"]').evaluate(
    (element) => element instanceof HTMLButtonElement,
  )).toBe(true);

  await navigateToForestScene(page, "gift");
  expect(await page.getByTestId("forest-gift-envelope").evaluateAll(
    (elements) => elements.every((element) => element instanceof HTMLButtonElement),
  )).toBe(true);
  await page.getByTestId("forest-gift-envelope").first().click();
  expect(await page.getByTestId("forest-gift-details").locator("button").evaluate(
    (element) => element instanceof HTMLButtonElement,
  )).toBe(true);
});

test("renderer parity preserves every scene heading, action label, boundary, and form draft", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto(LAB_PATH);

  const stage = page.getByTestId("forest-journey-stage");
  await expect(stage).toHaveAttribute("data-current-scene-id", "cover-gate");
  await page.getByTestId("forest-journey-enter").click();
  await expect(stage).toHaveAttribute("data-current-scene-id", "families");

  type RendererSceneRecord = {
    readonly buttonLabels: readonly string[];
    readonly heading: string;
    readonly id: string;
    readonly nextDisabled: boolean;
    readonly previousDisabled: boolean;
  };
  const readActiveRecord = async (): Promise<RendererSceneRecord> => {
    const id = await stage.getAttribute("data-current-scene-id");
    if (!id) throw new Error("Active forest scene must expose a stable ID");
    const active = page.locator(
      `[data-forest-scene-id="${id}"][data-forest-interactive="true"]`,
    );
    await expect(active).toHaveCount(1);
    return {
      buttonLabels: await active.locator("button").evaluateAll((buttons) => (
        buttons.map((button) => button.textContent?.trim() ?? "")
      )),
      heading: (await active.locator("h2").textContent())?.trim() ?? "",
      id,
      nextDisabled: await page.getByTestId("forest-journey-next").isDisabled(),
      previousDisabled: await page.getByTestId("forest-journey-previous").isDisabled(),
    };
  };

  const webglRecords: RendererSceneRecord[] = [];
  for (let index = 1; index < FOREST_SCENE_IDS.length; index += 1) {
    const id = FOREST_SCENE_IDS[index];
    await expect(stage).toHaveAttribute("data-current-scene-id", id);
    if (id === "rsvp") {
      const form = page.getByTestId("forest-rsvp-form");
      await form.locator('input[name="guestName"]').fill("Bản nháp parity");
      await form.locator('select[name="attendance"]').selectOption("no");
      await form.locator('input[name="partySize"]').fill("4");
      await form.locator('textarea[name="notes"]').fill("Giữ nguyên khi đổi renderer");
    }
    if (id === "wishes") {
      const guestbook = page.getByTestId("forest-wishes-guestbook");
      await guestbook.locator('input[name="wishName"]').fill("Khách parity");
      await guestbook.locator('textarea[name="wishMessage"]').fill("Lời chúc parity");
    }
    webglRecords.push(await readActiveRecord());
    if (index < FOREST_SCENE_IDS.length - 1) {
      await page.getByTestId("forest-journey-next").click();
      await expect(stage).toHaveAttribute("data-journey-phase", "settled");
    }
  }

  await page.getByTestId("forest-journey-canvas").locator("canvas").evaluate((element) => {
    element.dispatchEvent(new Event("webglcontextlost", { cancelable: true }));
  });
  await expect(stage).toHaveAttribute("data-renderer", "fallback");
  await expect(stage).toHaveAttribute("data-current-scene-id", "finale");

  const fallbackRecords: RendererSceneRecord[] = [];
  for (let index = FOREST_SCENE_IDS.length - 1; index >= 1; index -= 1) {
    const id = FOREST_SCENE_IDS[index];
    await expect(stage).toHaveAttribute("data-current-scene-id", id);
    fallbackRecords.push(await readActiveRecord());
    if (id === "rsvp") {
      const form = page.getByTestId("forest-rsvp-form");
      await expect(form.locator('input[name="guestName"]')).toHaveValue("Bản nháp parity");
      await expect(form.locator('select[name="attendance"]')).toHaveValue("no");
      await expect(form.locator('input[name="partySize"]')).toHaveValue("4");
      await expect(form.locator('textarea[name="notes"]')).toHaveValue(
        "Giữ nguyên khi đổi renderer",
      );
    }
    if (id === "wishes") {
      const guestbook = page.getByTestId("forest-wishes-guestbook");
      await expect(guestbook.locator('input[name="wishName"]')).toHaveValue("Khách parity");
      await expect(guestbook.locator('textarea[name="wishMessage"]')).toHaveValue(
        "Lời chúc parity",
      );
    }
    if (index > 1) {
      await page.getByTestId("forest-journey-previous").click();
      await expect(stage).toHaveAttribute("data-journey-phase", "fallback-settled");
    }
  }

  expect(fallbackRecords.reverse()).toEqual(webglRecords);
  expect(["cover-gate", ...webglRecords.map(({ id }) => id)]).toEqual(
    FOREST_SCENE_IDS,
  );
  expect(webglRecords.at(-1)).toMatchObject({
    id: "finale",
    nextDisabled: true,
    previousDisabled: false,
  });
  await page.getByTestId("forest-journey-previous").click();
  await expect(stage).toHaveAttribute("data-current-scene-id", "cover-gate");
  await expect(page.getByTestId("forest-journey-previous")).toBeDisabled();
  await expect(page.getByTestId("forest-journey-next")).toBeEnabled();
});

test("long-copy fixture keeps mobile papers and native controls inside the viewport", async ({
  page,
}) => {
  await page.setViewportSize({ height: 844, width: 390 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await forceWebglFallback(page);
  await page.goto(`${LAB_PATH}?fixture=long-copy`);

  const stage = page.getByTestId("forest-journey-stage");
  await page.getByTestId("forest-journey-enter").click();
  await expect(stage).toHaveAttribute("data-current-scene-id", "families");

  const assertContained = async (sceneId: (typeof FOREST_SCENE_IDS)[number]) => {
    await navigateToForestScene(page, sceneId);
    const surface = page.locator(
      `[data-forest-scene-id="${sceneId}"][data-forest-interactive="true"]`,
    );
    await expect(surface).toBeVisible();
    const metrics = await surface.evaluate((element) => {
      const surfaceBounds = element.getBoundingClientRect();
      const parentBounds = element.parentElement?.getBoundingClientRect();
      const surfaceStyle = getComputedStyle(element);
      const containedControls = Array.from(element.querySelectorAll(
        "a, button, input, select, textarea",
      )).every((control) => {
        const bounds = control.getBoundingClientRect();
        return bounds.left >= surfaceBounds.left - 1
          && bounds.right <= surfaceBounds.right + 1;
      });
      const textNodes = Array.from(element.querySelectorAll(
        "address, article, dd, dt, label > span, p, summary",
      ));
      const overflowingText = textNodes
        .filter((node) => node.scrollWidth > node.clientWidth + 1)
        .map((node) => `${node.tagName}:${node.textContent?.slice(0, 48) ?? ""}`);
      return {
        containedControls,
        documentScrollWidth: document.documentElement.scrollWidth,
        overflowingText,
        parentLeft: parentBounds?.left ?? null,
        parentRight: parentBounds?.right ?? null,
        parentWidth: parentBounds?.width ?? null,
        surfaceLeft: surfaceBounds.left,
        surfaceRight: surfaceBounds.right,
        surfaceTransform: surfaceStyle.transform,
        surfaceWidth: surfaceBounds.width,
        surfaceWidthStyle: surfaceStyle.width,
        viewportWidth: window.innerWidth,
      };
    });
    expect(metrics.documentScrollWidth).toBeLessThanOrEqual(metrics.viewportWidth);
    expect(metrics.surfaceLeft).toBeGreaterThanOrEqual(0);
    expect(metrics.surfaceRight, JSON.stringify(metrics)).toBeLessThanOrEqual(
      metrics.viewportWidth,
    );
    expect(metrics.containedControls).toBe(true);
    expect(metrics.overflowingText).toEqual([]);
    return surface;
  };

  const families = await assertContained("families");
  await expect(families).toContainText("ChuỗiTênĐạiDiệnGiaĐìnhRấtDài");
  const venue = await assertContained("venue");
  await expect(venue).toContainText("KhuVựcĐónKháchNgoàiTrờiCóTênRấtDài");
  const rsvp = await assertContained("rsvp");
  await expect(rsvp).toContainText("nhiều người đồng hành thân yêu");
  const wishes = await assertContained("wishes");
  await expect(wishes).toContainText("lời chúc thật dài và đầy đủ ý nghĩa");
});

test("the private forest route renders a localized noindex threshold", async ({ page }) => {
  await page.goto(LAB_PATH);

  await expect(page).toHaveTitle(/rừng cưới|Forest Wedding/i);
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
    "content",
    /noindex/,
  );
  await expect(page.locator(".petal-field")).toHaveCount(0);

  const stage = page.getByTestId("forest-journey-stage");
  await expect(stage).toHaveAttribute("data-journey-phase", "threshold");
  await expect(stage).toHaveAttribute("data-scene", "cover-gate");
  const entry = page.getByTestId("forest-journey-enter");
  await expect(entry).toBeVisible();
  expect(await entry.evaluate((element) => element instanceof HTMLButtonElement)).toBe(true);
  await expect(entry).toBeEnabled();
});

test("the threshold follows the demo couple's groom-first ordering", async ({ page }) => {
  await page.goto(LAB_PATH);

  await expect(page.getByTestId("forest-journey-couple")).toHaveText(
    /Trần Minh Quân\s*&\s*Nguyễn Bảo Trân/,
  );
});

test("the threshold shows one localized reception date", async ({ page }) => {
  await page.goto(LAB_PATH);

  const dates = page.getByTestId("forest-journey-stage").locator("time");
  await expect(dates).toHaveCount(1);
  await expect(dates).toHaveAttribute("datetime", "2026-08-02");
  await expect(dates).not.toHaveText("2026-08-02 · 2026-08-02");
  await expect(dates).not.toHaveText("2026-08-02");
});

test("the threshold leaves touch actions available to the browser", async ({ page }) => {
  await page.goto(LAB_PATH);

  const touchAction = await page
    .getByTestId("forest-journey-stage")
    .evaluate((element) => getComputedStyle(element).touchAction);
  expect(touchAction).toBe("auto");
});

test.describe("timezone-stable threshold dates", () => {
  test.use({ timezoneId: "Asia/Tokyo" });

  test("keeps the reception date on August 2 when its formatter uses UTC", async ({ page }) => {
    await page.addInitScript(() => {
      const NativeDateTimeFormat = Intl.DateTimeFormat;

      Object.defineProperty(Intl, "DateTimeFormat", {
        configurable: true,
        value: function DateTimeFormat(
          locales?: Intl.LocalesArgument,
          options?: Intl.DateTimeFormatOptions,
        ) {
          return new NativeDateTimeFormat(locales, {
            ...options,
            timeZone: options?.timeZone ?? "UTC",
          });
        },
      });
    });
    await page.goto(LAB_PATH);

    const date = page.getByTestId("forest-journey-stage").locator("time");
    const expected = await page.evaluate(() =>
      new Intl.DateTimeFormat("vi-VN", {
        day: "numeric",
        month: "long",
        timeZone: "UTC",
        year: "numeric",
      }).format(new Date(Date.UTC(2026, 7, 2))),
    );

    await expect(date).toHaveCount(1);
    await expect(date).toHaveAttribute("datetime", "2026-08-02");
    await expect(date).toHaveText(expected);
  });
});

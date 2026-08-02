import { expect, test, type Page } from "@playwright/test";

import * as dalatMistWorld from "../../src/components/dalat-journey/dalat-mist-world";

const {
  DALAT_TERRAIN_STRIPS,
  DALAT_WORLD_PLACEMENT_Z_BOUNDS,
  createDalatWorldPlacements,
  getDalatWorldDensity,
  sampleAdaptiveQualityDelta,
} = dalatMistWorld;

const LAB_PATH = "/lab/dalat-journey";

type CameraDiagnosticSample = {
  progress: number;
  x: number;
  y: number;
  z: number;
};

async function startCameraDiagnosticCapture(page: Page) {
  await page.getByTestId("dalat-journey-canvas").evaluate((element) => {
    const trackedWindow = window as Window & {
      __dalatJourneyCameraObserver?: MutationObserver;
      __dalatJourneyCameraSamples?: CameraDiagnosticSample[];
    };
    trackedWindow.__dalatJourneyCameraObserver?.disconnect();
    trackedWindow.__dalatJourneyCameraSamples = [];

    const record = () => {
      const sample = {
        progress: Number(element.getAttribute("data-travel-progress")),
        x: Number(element.getAttribute("data-camera-x")),
        y: Number(element.getAttribute("data-camera-y")),
        z: Number(element.getAttribute("data-camera-z")),
      };
      if (Object.values(sample).every(Number.isFinite)) {
        trackedWindow.__dalatJourneyCameraSamples?.push(sample);
      }
    };
    const observer = new MutationObserver(record);
    observer.observe(element, {
      attributeFilter: [
        "data-camera-x",
        "data-camera-y",
        "data-camera-z",
        "data-travel-progress",
      ],
      attributes: true,
    });
    trackedWindow.__dalatJourneyCameraObserver = observer;
    record();
  });
}

async function readCameraDiagnosticSamples(
  page: Page,
): Promise<CameraDiagnosticSample[]> {
  return page.evaluate(() => {
    const trackedWindow = window as Window & {
      __dalatJourneyCameraSamples?: CameraDiagnosticSample[];
    };
    return trackedWindow.__dalatJourneyCameraSamples ?? [];
  });
}

async function forceWebglFallback(page: Page) {
  await page.addInitScript(() => {
    Object.defineProperty(HTMLCanvasElement.prototype, "getContext", {
      configurable: true,
      value: () => null,
    });
  });
}

async function forceWebgl1Only(page: Page) {
  await page.addInitScript(() => {
    const originalGetContext = HTMLCanvasElement.prototype.getContext;
    Object.defineProperty(HTMLCanvasElement.prototype, "getContext", {
      configurable: true,
      value(
        this: HTMLCanvasElement,
        contextId: string,
        ...args: unknown[]
      ) {
        if (contextId === "webgl2") return null;
        return Reflect.apply(originalGetContext, this, [contextId, ...args]);
      },
    });
  });
}

async function trackFallbackImagePreloads(page: Page) {
  await page.addInitScript(() => {
    const imagePrototype = HTMLImageElement.prototype;
    const srcDescriptor = Object.getOwnPropertyDescriptor(imagePrototype, "src");
    const trackedWindow = window as Window & {
      __dalatJourneyImageSrcLog?: string[];
    };

    const srcGetter = srcDescriptor?.get;
    const srcSetter = srcDescriptor?.set;

    if (!srcGetter || !srcSetter) {
      throw new Error("Missing HTMLImageElement.src descriptor");
    }

    trackedWindow.__dalatJourneyImageSrcLog = [];
    Object.defineProperty(imagePrototype, "src", {
      configurable: true,
      get() {
        return srcGetter.call(this);
      },
      set(value: string) {
        trackedWindow.__dalatJourneyImageSrcLog?.push(String(value));
        srcSetter.call(this, value);
      },
    });
  });
}

function expectClearCorridor(
  placements: ReturnType<typeof createDalatWorldPlacements>,
) {
  for (const placement of placements.pines) {
    expect(Math.abs(placement.position[0])).toBeGreaterThanOrEqual(
      placement.far ? 6.4 : 2.6,
    );
  }
  for (const placement of placements.flowers) {
    expect(Math.abs(placement.position[0])).toBeGreaterThanOrEqual(
      placement.far ? 4.8 : 1.75,
    );
  }
  for (const placement of placements.lights) {
    expect(Math.abs(placement.position[0])).toBeGreaterThanOrEqual(
      placement.far ? 5.2 : 1.65,
    );
  }
}

test.describe("Dalat Journey Task 7 regressions", () => {
  test("desktop and mobile densities stay deterministic with a clear corridor", () => {
    const desktopDensity = getDalatWorldDensity("desktop", "desktop");
    const mobileDensity = getDalatWorldDensity("mobile", "mobile");

    expect(desktopDensity).toMatchObject({
      flowerInstances: 220,
      lightInstances: 92,
      pineInstances: 140,
    });
    expect(mobileDensity).toMatchObject({
      flowerInstances: 120,
      lightInstances: 56,
      pineInstances: 80,
    });

    for (const density of [desktopDensity, mobileDensity]) {
      const placements = createDalatWorldPlacements(density);
      expect(createDalatWorldPlacements(density)).toEqual(placements);
      expectClearCorridor(placements);
    }
  });

  test("five connected terrain strips cover the full placement z range", () => {
    expect(DALAT_TERRAIN_STRIPS).toHaveLength(5);
    const stripBounds = DALAT_TERRAIN_STRIPS.map(({ centerZ, depth }) => ({
      far: centerZ - depth / 2,
      near: centerZ + depth / 2,
    }));

    expect(stripBounds[0]?.near).toBeGreaterThanOrEqual(
      DALAT_WORLD_PLACEMENT_Z_BOUNDS.near,
    );
    for (let index = 1; index < stripBounds.length; index += 1) {
      expect(stripBounds[index - 1]?.far).toBeCloseTo(
        stripBounds[index]?.near ?? Number.NaN,
      );
    }
    expect(stripBounds.at(-1)?.far).toBeLessThanOrEqual(
      DALAT_WORLD_PLACEMENT_Z_BOUNDS.far,
    );
  });

  test("reduced density retains every near and primary placement", () => {
    for (const baseTier of ["desktop", "mobile"] as const) {
      const baseDensity = getDalatWorldDensity(baseTier, baseTier);
      const reducedDensity = getDalatWorldDensity(baseTier, "reduced");
      const base = createDalatWorldPlacements(baseDensity);
      const reduced = createDalatWorldPlacements(reducedDensity);

      expect(reducedDensity).toMatchObject(
        baseTier === "desktop"
          ? { flowerInstances: 165, lightInstances: 56, pineInstances: 98 }
          : { flowerInstances: 90, lightInstances: 36, pineInstances: 56 },
      );

      expect(reduced.pines.slice(0, reducedDensity.pineNearInstances)).toEqual(
        base.pines.slice(0, baseDensity.pineNearInstances),
      );
      expect(
        reduced.flowers.slice(0, reducedDensity.flowerNearInstances),
      ).toEqual(base.flowers.slice(0, baseDensity.flowerNearInstances));
      expect(
        reduced.lights.slice(0, reducedDensity.lightPrimaryInstances),
      ).toEqual(base.lights.slice(0, baseDensity.lightPrimaryInstances));

      expect(reduced.pines.slice(reducedDensity.pineNearInstances)).toEqual(
        base.pines.slice(
          baseDensity.pineNearInstances,
          baseDensity.pineNearInstances +
            reduced.pines.length -
            reducedDensity.pineNearInstances,
        ),
      );
      expect(
        reduced.flowers.slice(reducedDensity.flowerNearInstances),
      ).toEqual(
        base.flowers.slice(
          baseDensity.flowerNearInstances,
          baseDensity.flowerNearInstances +
            reduced.flowers.length -
            reducedDensity.flowerNearInstances,
        ),
      );
    }
  });

  test("slow sampling resets on a fast frame and counts long deltas", () => {
    const initial: dalatMistWorld.AdaptiveQualitySample = {
      reduced: false,
      slowDurationMs: 0,
    };
    const longFrame = sampleAdaptiveQualityDelta(initial, 300);
    expect(longFrame).toEqual({ reduced: false, slowDurationMs: 300 });

    const reset = sampleAdaptiveQualityDelta(longFrame, 16);
    expect(reset).toEqual({ reduced: false, slowDurationMs: 0 });
    expect(sampleAdaptiveQualityDelta(reset, 1_000)).toEqual({
      reduced: false,
      slowDurationMs: 1_000,
    });
  });

  test("slow sampling reduces once at exactly 2000 milliseconds", () => {
    let sample: dalatMistWorld.AdaptiveQualitySample = {
      reduced: false,
      slowDurationMs: 0,
    };
    let reductionCount = 0;

    for (let index = 0; index < 79; index += 1) {
      const next = sampleAdaptiveQualityDelta(sample, 25);
      if (!sample.reduced && next.reduced) reductionCount += 1;
      sample = next;
    }
    expect(sample).toEqual({ reduced: false, slowDurationMs: 1_975 });

    const threshold = sampleAdaptiveQualityDelta(sample, 25);
    if (!sample.reduced && threshold.reduced) reductionCount += 1;
    expect(threshold).toEqual({ reduced: true, slowDurationMs: 2_000 });

    const afterReduction = sampleAdaptiveQualityDelta(threshold, 500);
    if (!threshold.reduced && afterReduction.reduced) reductionCount += 1;
    expect(afterReduction).toBe(threshold);
    expect(reductionCount).toBe(1);
  });
});

test.describe("Dalat Journey lab", () => {
  test("private route exposes its threshold without global petals", async ({
    page,
  }) => {
    const consoleErrors: string[] = [];
    page.on("console", (message) => {
      if (message.type() === "error") consoleErrors.push(message.text());
    });

    await page.goto(LAB_PATH);
    await expect(page).toHaveTitle(/Đà Lạt|Dalat/i);
    const stage = page.getByTestId("dalat-journey-stage");
    await expect(stage).toHaveAttribute(
      "data-journey-phase",
      "threshold",
    );
    await expect(stage).toHaveAttribute(
      "data-renderer",
      /loading|webgl/,
    );
    await expect(stage).toHaveAttribute("data-invitation-template", "qasr-green");
    await expect(stage).toHaveAttribute("data-invitation-id", "minhquan-baotran-qasr");
    await expect(page.getByTestId("dalat-journey-cover-couple")).toContainText(
      "Nguyễn Bảo Trân",
    );
    await expect(page.getByTestId("dalat-journey-cover-couple")).toContainText(
      "Trần Minh Quân",
    );
    await expect(page.getByTestId("dalat-journey-cover-date")).toContainText(
      "02/08/2026",
    );
    const canvas = page.getByTestId("dalat-journey-canvas");
    await expect(canvas).toBeVisible();
    await expect(canvas).toHaveAttribute("data-world-skin", "dalat-mist");
    await expect(canvas).toHaveAttribute("data-world-ready", "true");
    const qualitySnapshot = await canvas.evaluate((element) => ({
      flowerInstances: element.getAttribute("data-active-flower-instances"),
      lightInstances: element.getAttribute("data-active-light-instances"),
      pineInstances: element.getAttribute("data-active-pine-instances"),
      qualityTier: element.getAttribute("data-quality-tier"),
    }));
    expect(qualitySnapshot.qualityTier).toMatch(/^(desktop|reduced)$/);
    if (
      qualitySnapshot.qualityTier !== "desktop" &&
      qualitySnapshot.qualityTier !== "reduced"
    ) {
      throw new Error(
        `Unexpected desktop quality tier: ${qualitySnapshot.qualityTier}`,
      );
    }
    const expectedDensity = getDalatWorldDensity(
      "desktop",
      qualitySnapshot.qualityTier,
    );
    expect(qualitySnapshot).toEqual({
      flowerInstances: String(expectedDensity.flowerInstances),
      lightInstances: String(expectedDensity.lightInstances),
      pineInstances: String(expectedDensity.pineInstances),
      qualityTier: qualitySnapshot.qualityTier,
    });
    await expect(page.getByTestId("dalat-journey-enter")).toBeEnabled();
    await expect(page.locator(".petal-field")).toHaveCount(0);
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
      "content",
      /noindex/,
    );
    expect(consoleErrors).toEqual([]);
  });

  test("WebGL turns the authored Dalat plates into layered 2.5D scenes", async ({
    page,
  }) => {
    await page.goto(LAB_PATH);

    const stage = page.getByTestId("dalat-journey-stage");
    const canvas = page.getByTestId("dalat-journey-canvas");
    const backdrop = page.getByTestId("dalat-journey-artwork-backdrop");
    await expect(backdrop).toBeVisible();
    await expect(backdrop).toHaveAttribute("data-depth-mode", "layered-2.5d");
    await expect(backdrop).toHaveAttribute("data-backdrop-checkpoint", "mistGate");
    const activePlate = backdrop.locator('[data-backdrop-layer="active"]');
    await expect(activePlate.locator('[data-depth-layer]')).toHaveCount(3);
    await expect(activePlate.locator('[data-depth-layer="far"]')).toHaveAttribute(
      "style",
      /mist-gate\.webp/,
    );
    await expect(canvas).toHaveAttribute("data-backdrop-mode", "plate-first");

    await page.getByTestId("dalat-journey-enter").click();
    await expect(stage).toHaveAttribute("data-checkpoint", "memoryPines");
    await expect(stage).toHaveAttribute("data-journey-phase", "settled", {
      timeout: 2_500,
    });
    await expect(backdrop).toHaveAttribute("data-backdrop-checkpoint", "memoryPines");
    await expect(backdrop).toHaveAttribute("data-backdrop-state", "settled");
    await expect(backdrop.locator('[data-backdrop-layer="active"] [data-depth-layer="far"]')).toHaveAttribute(
      "style",
      /memory-pines\.webp/,
    );
  });

  test("entry stays locked until the final material branch renders", async ({
    page,
  }) => {
    let releaseMaterialRequests = () => {};
    const materialRequestsReleased = new Promise<void>((resolve) => {
      releaseMaterialRequests = resolve;
    });
    let heldMaterialRequestCount = 0;
    let finishedMaterialRequestCount = 0;

    page.on("requestfinished", (request) => {
      if (request.url().includes("/dalat-journey/materials/")) {
        finishedMaterialRequestCount += 1;
      }
    });

    await page.route(
      "**/chungdoi/labs/dalat-journey/materials/*.webp",
      async (route) => {
        heldMaterialRequestCount += 1;
        await materialRequestsReleased;
        await route.continue();
      },
    );

    await page.goto(LAB_PATH, { waitUntil: "domcontentloaded" });
    const canvas = page.getByTestId("dalat-journey-canvas");
    const enter = page.getByTestId("dalat-journey-enter");

    try {
      await expect.poll(() => heldMaterialRequestCount).toBe(2);
      await expect(canvas).toHaveAttribute("data-world-ready", "false");
      await expect(enter).toBeDisabled();
    } finally {
      releaseMaterialRequests();
    }

    await expect.poll(() => finishedMaterialRequestCount).toBe(2);
    await expect(canvas).toHaveAttribute("data-world-ready", "true");
    await expect(enter).toBeEnabled();
  });

  test("WebGL1-only capability falls back without renderer errors", async ({
    page,
  }) => {
    const consoleErrors: string[] = [];
    const pageErrors: string[] = [];
    page.on("console", (message) => {
      if (message.type() === "error") consoleErrors.push(message.text());
    });
    page.on("pageerror", (error) => pageErrors.push(error.message));
    await forceWebgl1Only(page);

    await page.goto(LAB_PATH);

    const stage = page.getByTestId("dalat-journey-stage");
    await expect(stage).toHaveAttribute("data-renderer", "fallback");
    await expect(page.getByTestId("dalat-journey-canvas")).toHaveCount(0);
    await expect(page.getByTestId("dalat-journey-enter")).toBeEnabled();

    await page.getByTestId("dalat-journey-enter").click();
    await expect(stage).toHaveAttribute("data-checkpoint", "memoryPines");
    await expect(stage).toHaveAttribute("data-journey-phase", "fallback-settled");
    expect(consoleErrors).toEqual([]);
    expect(pageErrors).toEqual([]);
  });

  test("entry follows a real camera rail and settles at memory pines within 2.5 seconds", async ({
    page,
  }) => {
    const consoleErrors: string[] = [];
    page.on("console", (message) => {
      if (message.type() === "error") consoleErrors.push(message.text());
    });

    await page.goto(LAB_PATH);
    const stage = page.getByTestId("dalat-journey-stage");
    const canvas = page.getByTestId("dalat-journey-canvas");
    await startCameraDiagnosticCapture(page);
    await page.getByTestId("dalat-journey-enter").click();
    const startedAt = Date.now();
    await expect(stage).toHaveAttribute(
      "data-journey-phase",
      "travelling",
      { timeout: 750 },
    );
    await expect(page.getByTestId("dalat-journey-previous")).toBeDisabled();
    await expect(page.getByTestId("dalat-journey-next")).toBeDisabled();
    await expect(canvas).toBeVisible();
    await expect(stage).toHaveAttribute("data-renderer", "webgl");

    await stage.dispatchEvent("keydown", {
      bubbles: true,
      code: "ArrowDown",
      key: "ArrowDown",
    });
    await stage.dispatchEvent("wheel", {
      bubbles: true,
      cancelable: true,
      deltaY: 120,
    });

    await expect.poll(
      async () => {
        const samples = await readCameraDiagnosticSamples(page);
        return {
          earlyRail: samples.some(
            (sample) =>
              sample.progress > 0.05
              && sample.progress < 0.45
              && sample.z < 8.4,
          ),
          lateRail: samples.some(
            (sample) =>
              sample.progress > 0.55
              && sample.progress < 0.98
              && sample.z > -0.9,
          ),
        };
      },
      { intervals: [20, 40, 80], timeout: 2_000 },
    ).toEqual({ earlyRail: true, lateRail: true });

    const remainingArrivalTime = Math.max(100, 2_500 - (Date.now() - startedAt));
    await expect(stage).toHaveAttribute(
      "data-checkpoint",
      "memoryPines",
      { timeout: remainingArrivalTime },
    );
    await expect(stage).toHaveAttribute(
      "data-journey-phase",
      "settled",
      { timeout: remainingArrivalTime },
    );
    expect(Date.now() - startedAt).toBeLessThan(2_500);
    await expect(canvas).toHaveAttribute("data-travel-progress", "1.000");
    await expect(canvas).toHaveAttribute("data-camera-z", "-1.000");
    await expect(stage).toHaveAttribute(
      "data-look-yaw",
      "0.00",
    );
    await expect(page.getByTestId("dalat-journey-fallback")).toHaveCount(0);
    expect(consoleErrors).toEqual([]);
  });

  test("repeated input cannot skip checkpoints and the final checkpoint stays settled", async ({
    page,
  }) => {
    await page.goto(LAB_PATH);
    const stage = page.getByTestId("dalat-journey-stage");
    await page.getByTestId("dalat-journey-enter").click();
    await expect(stage).toHaveAttribute("data-checkpoint", "memoryPines");
    await expect(stage).toHaveAttribute("data-journey-phase", "settled");

    const reducedMotion = page.getByTestId("dalat-journey-reduced-motion");
    await reducedMotion.click();
    await expect(reducedMotion).toHaveAttribute("aria-pressed", "true");

    for (const checkpoint of [
      "timeGlasshouse",
      "lakePavilion",
      "wishValley",
    ]) {
      await page.getByTestId("dalat-journey-next").click();
      await expect(stage).toHaveAttribute("data-journey-phase", "travelling", {
        timeout: 750,
      });
      await expect(page.getByTestId("dalat-journey-next")).toBeDisabled();
      await stage.dispatchEvent("keydown", {
        bubbles: true,
        code: "ArrowDown",
        key: "ArrowDown",
      });
      await stage.dispatchEvent("wheel", {
        bubbles: true,
        cancelable: true,
        deltaY: 120,
      });
      await expect(stage).toHaveAttribute("data-checkpoint", checkpoint, {
        timeout: 800,
      });
      await expect(stage).toHaveAttribute("data-journey-phase", "settled");
    }

    await expect(page.getByTestId("dalat-journey-next")).toBeDisabled();
    await stage.dispatchEvent("keydown", {
      bubbles: true,
      code: "ArrowDown",
      key: "ArrowDown",
    });
    await stage.dispatchEvent("wheel", {
      bubbles: true,
      cancelable: true,
      deltaY: 120,
    });
    await page.waitForTimeout(250);
    await expect(stage).toHaveAttribute("data-checkpoint", "wishValley");
    await expect(stage).toHaveAttribute("data-journey-phase", "settled");
  });

  test("horizontal drag updates rendered yaw before pointerup and never exceeds 20 degrees", async ({
    page,
  }) => {
    await page.goto(LAB_PATH);
    const stage = page.getByTestId("dalat-journey-stage");
    const canvas = page.getByTestId("dalat-journey-canvas");
    await page.getByTestId("dalat-journey-enter").click();
    await expect(stage).toHaveAttribute("data-journey-phase", "settled");

    const box = await stage.boundingBox();
    if (!box) throw new Error("dalat-journey-stage has no layout box");
    const centerX = box.x + box.width / 2;
    const centerY = box.y + box.height / 2;

    await page.mouse.move(centerX, centerY);
    await page.mouse.down();
    await page.mouse.move(centerX + 100, centerY, { steps: 6 });

    await expect.poll(
      async () => Number(await canvas.getAttribute("data-rendered-look-yaw")),
      { timeout: 1_000 },
    ).toBeGreaterThan(0);
    await expect(stage).toHaveAttribute("data-look-yaw", "10.00", {
      timeout: 1_000,
    });

    await page.mouse.move(centerX + 300, centerY, { steps: 6 });
    await expect.poll(
      async () => Number(await canvas.getAttribute("data-rendered-look-yaw")),
      { timeout: 1_000 },
    ).toBe(20);
    expect(
      Math.abs(Number(await canvas.getAttribute("data-rendered-look-pitch"))),
    ).toBeLessThanOrEqual(8);

    await page.mouse.up();
    await expect(stage).toHaveAttribute("data-look-yaw", "20.00");
    await expect(stage).toHaveAttribute("data-checkpoint", "memoryPines");
    await expect(stage).toHaveAttribute("data-journey-phase", "settled");
  });

  test("invitation copy hides in transit, pauses for the scene, then reveals on glass", async ({
    page,
  }) => {
    await page.goto(LAB_PATH);
    const stage = page.getByTestId("dalat-journey-stage");
    await page.getByTestId("dalat-journey-enter").click();
    const contentLayer = page.getByTestId("dalat-journey-invitation-content");
    await expect(contentLayer).toHaveAttribute("data-content-state", "hidden");
    await expect(stage).toHaveAttribute("data-journey-phase", "settled");
    await expect(contentLayer).toHaveAttribute(
      "data-content-state",
      "scenic-pause",
    );
    await expect(contentLayer).toHaveAttribute("data-content-state", "visible", {
      timeout: 1_200,
    });
    await expect(page.getByTestId("dalat-invitation-album")).toContainText(
      "7 khoảnh khắc",
    );
    await expect(stage).toHaveCSS("touch-action", "auto");

    const surfaces = page.locator('[data-diegetic-surface="true"]');
    await expect(surfaces).toHaveCount(5);
    const expectedSurfaces = {
      mistGate: "stone",
      memoryPines: "glass",
      timeGlasshouse: "greenhouse",
      lakePavilion: "pavilion",
      wishValley: "book",
    } as const;
    for (const [id, surfaceKind] of Object.entries(expectedSurfaces)) {
      const surface = page.getByTestId(`dalat-diegetic-${id}`);
      const active = id === "memoryPines";
      await expect(surface).toHaveAttribute("data-surface-kind", surfaceKind);
      await expect(surface).toHaveAttribute(
        "data-content-role",
        /intro|album|schedule|map|wishes/,
      );
      await expect(surface).toHaveAttribute("aria-hidden", String(!active));
      await expect(surface).toHaveAttribute("tabindex", active ? "0" : "-1");
      await expect(surface).toHaveCSS("pointer-events", active ? "auto" : "none");
      if (active) {
        await expect(surface).toHaveCSS("touch-action", "pan-y");
      }
    }

    const reducedMotion = page.getByTestId("dalat-journey-reduced-motion");
    await reducedMotion.click();
    await expect(reducedMotion).toHaveAttribute("aria-pressed", "true");
    for (const checkpoint of [
      "timeGlasshouse",
      "lakePavilion",
      "wishValley",
    ]) {
      await page.getByTestId("dalat-journey-next").click();
      await expect(contentLayer).toHaveAttribute("data-content-state", "hidden");
      await expect(stage).toHaveAttribute("data-checkpoint", checkpoint, {
        timeout: 800,
      });
      await expect(contentLayer).toHaveAttribute(
        "data-content-state",
        "scenic-pause",
      );
      await expect(contentLayer).toHaveAttribute("data-content-state", "visible", {
        timeout: 1_200,
      });

      if (checkpoint === "timeGlasshouse") {
        await expect(page.getByTestId("dalat-invitation-schedule")).toContainText(
          "02/08/2026",
        );
        await expect(page.getByTestId("dalat-invitation-calendar")).toHaveCount(1);
      }
      if (checkpoint === "lakePavilion") {
        await expect(page.getByTestId("dalat-invitation-map")).toContainText(
          "Đà Lạt",
        );
        await expect(page.getByTestId("dalat-invitation-map").locator("iframe")).toHaveCount(1);
      }
      if (checkpoint === "wishValley") {
        await expect(page.getByTestId("dalat-invitation-wishes")).toHaveCount(1);
        await expect(page.getByTestId("dalat-invitation-gift")).toHaveCount(1);
      }
    }

    const wishSection = page.getByTestId("dalat-invitation-wishes");
    const wishSubmit = wishSection.getByRole("button", { name: "Gửi lời chúc" });
    await expect(wishSubmit).toHaveCount(1);
    await expect(wishSubmit).toHaveAttribute("type", "submit");
    await expect(wishSubmit.locator("xpath=ancestor::form")).toHaveCount(1);
  });

  test("settled ambience advances scene time and reduced motion stops it", async ({
    page,
  }) => {
    await page.goto(LAB_PATH);
    const stage = page.getByTestId("dalat-journey-stage");
    const canvas = page.getByTestId("dalat-journey-canvas");
    await page.getByTestId("dalat-journey-enter").click();
    await expect(stage).toHaveAttribute("data-journey-phase", "settled");

    const firstSceneTime = Number(await canvas.getAttribute("data-scene-time"));
    await page.waitForTimeout(180);
    const ambientSceneTime = Number(await canvas.getAttribute("data-scene-time"));
    expect(ambientSceneTime).toBeGreaterThan(firstSceneTime);

    await page.evaluate(() => {
      Object.defineProperty(document, "visibilityState", {
        configurable: true,
        value: "hidden",
      });
      document.dispatchEvent(new Event("visibilitychange"));
    });
    const hiddenSceneTime = await canvas.getAttribute("data-scene-time");
    await page.waitForTimeout(180);
    await expect(canvas).toHaveAttribute("data-scene-time", hiddenSceneTime ?? "");

    await page.evaluate(() => {
      Object.defineProperty(document, "visibilityState", {
        configurable: true,
        value: "visible",
      });
      document.dispatchEvent(new Event("visibilitychange"));
    });
    await page.waitForTimeout(180);
    expect(Number(await canvas.getAttribute("data-scene-time"))).toBeGreaterThan(
      Number(hiddenSceneTime),
    );

    await page.getByTestId("dalat-journey-reduced-motion").click();
    await expect(page.getByTestId("dalat-journey-reduced-motion")).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    await page.waitForTimeout(80);
    const reducedSceneTime = await canvas.getAttribute("data-scene-time");
    await page.waitForTimeout(220);
    await expect(canvas).toHaveAttribute("data-scene-time", reducedSceneTime ?? "");
  });

  test("the fallback shares the layered scene and delayed invitation panel", async ({
    page,
  }) => {
    await forceWebglFallback(page);
    await page.goto(LAB_PATH);
    await page.getByTestId("dalat-journey-enter").click();

    const fallback = page.getByTestId("dalat-journey-fallback");
    const activePanorama = fallback.locator('[data-backdrop-layer="active"]');
    const targetPanorama = fallback.locator('[data-backdrop-layer="target"]');
    const contentLayer = page.getByTestId("dalat-journey-invitation-content");

    await expect(fallback).toHaveCSS("background-image", "none");
    await expect(activePanorama).toHaveCount(1);
    await expect(activePanorama.locator('[data-depth-layer]')).toHaveCount(3);
    await expect(targetPanorama.locator('[data-depth-layer]')).toHaveCount(3);

    await expect(page.getByTestId("dalat-journey-stage")).toHaveAttribute(
      "data-journey-phase",
      "fallback-settled",
    );
    await expect(targetPanorama).toHaveCount(0);
    await expect(contentLayer).toHaveAttribute(
      "data-content-state",
      "scenic-pause",
    );
    await expect(contentLayer).toHaveAttribute("data-content-state", "visible", {
      timeout: 1_200,
    });
  });

  test("backward travel prewarms its target without expanding the preload budget", async ({
    page,
  }) => {
    await trackFallbackImagePreloads(page);
    await forceWebglFallback(page);
    await page.goto(LAB_PATH);
    await page.getByTestId("dalat-journey-enter").click();

    const stage = page.getByTestId("dalat-journey-stage");
    await expect(stage).toHaveAttribute("data-checkpoint", "memoryPines");
    await expect(stage).toHaveAttribute("data-journey-phase", "fallback-settled");

    await page.evaluate(() => {
      const trackedWindow = window as Window & {
        __dalatJourneyImageSrcLog?: string[];
      };
      trackedWindow.__dalatJourneyImageSrcLog = [];
    });

    await page.getByTestId("dalat-journey-previous").click();
    await expect(stage).toHaveAttribute("data-journey-phase", "travelling");

    const preloadedFallbackImages = await page.evaluate(() => {
      const trackedWindow = window as Window & {
        __dalatJourneyImageSrcLog?: string[];
      };
      const imageSrcs = trackedWindow.__dalatJourneyImageSrcLog ?? [];
      return Array.from(
        new Set(
          imageSrcs.filter((src) =>
            src.includes("/chungdoi/labs/dalat-journey/fallback/"),
          ),
        ),
      );
    });

    expect(preloadedFallbackImages).toHaveLength(2);
    expect(preloadedFallbackImages).toContain(
      "/chungdoi/labs/dalat-journey/fallback/memory-pines.webp",
    );
    expect(preloadedFallbackImages).toContain(
      "/chungdoi/labs/dalat-journey/fallback/mist-gate.webp",
    );
    expect(preloadedFallbackImages).not.toContain(
      "/chungdoi/labs/dalat-journey/fallback/time-glasshouse.webp",
    );
  });

  test("zero-delta and nested-control wheel events do not navigate", async ({
    page,
  }) => {
    await forceWebglFallback(page);
    await page.goto(LAB_PATH);
    await page.getByTestId("dalat-journey-enter").click();
    await page.clock.install();

    const stage = page.getByTestId("dalat-journey-stage");
    await expect(stage).toHaveAttribute("data-checkpoint", "memoryPines");
    await expect(stage).toHaveAttribute("data-journey-phase", "fallback-settled");

    const zeroDeltaPrevented = await page.evaluate(() => {
      const next = document.querySelector<HTMLElement>(
        '[data-testid="dalat-journey-next"]',
      );
      if (!next) throw new Error("Missing next control");

      const child = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      child.dataset.testid = "dalat-journey-next-control-child";
      child.setAttribute("height", "24");
      child.setAttribute("viewBox", "0 0 120 24");
      child.setAttribute("width", "120");
      child.innerHTML = '<rect height="24" width="120" />';
      next.append(child);

      const zeroDeltaEvent = new WheelEvent("wheel", {
        bubbles: true,
        cancelable: true,
        deltaY: 0,
      });
      next.dispatchEvent(zeroDeltaEvent);
      return zeroDeltaEvent.defaultPrevented;
    });
    expect(zeroDeltaPrevented).toBe(false);

    const nestedWheelPrevented = await page.getByTestId(
      "dalat-journey-next-control-child",
    ).evaluate((element) => {
      const nestedWheelEvent = new WheelEvent("wheel", {
        bubbles: true,
        cancelable: true,
        deltaY: 96,
      });
      element.dispatchEvent(nestedWheelEvent);
      return nestedWheelEvent.defaultPrevented;
    });

    expect(nestedWheelPrevented).toBe(false);
    await page.clock.fastForward(200);
    await expect(stage).toHaveAttribute("data-checkpoint", "memoryPines");
    await expect(stage).toHaveAttribute("data-journey-phase", "fallback-settled");
  });

  test("rapid synchronous horizontal drags accumulate both look deltas", async ({
    page,
  }) => {
    await forceWebglFallback(page);
    await page.goto(LAB_PATH);
    await page.getByTestId("dalat-journey-enter").click();

    const stage = page.getByTestId("dalat-journey-stage");
    await expect(stage).toHaveAttribute("data-checkpoint", "memoryPines");
    await expect(stage).toHaveAttribute("data-journey-phase", "fallback-settled");

    await stage.evaluate((element) => {
      const stageElement = element as HTMLElement;
      const { left, top, width, height } = stageElement.getBoundingClientRect();
      const centerX = left + width / 2;
      const centerY = top + height / 2;

      const dispatchHorizontalLook = (pointerId: number) => {
        stageElement.dispatchEvent(
          new PointerEvent("pointerdown", {
            bubbles: true,
            button: 0,
            clientX: centerX,
            clientY: centerY,
            pointerId,
            pointerType: "mouse",
          }),
        );
        stageElement.dispatchEvent(
          new PointerEvent("pointermove", {
            bubbles: true,
            clientX: centerX + 100,
            clientY: centerY,
            pointerId,
            pointerType: "mouse",
          }),
        );
        stageElement.dispatchEvent(
          new PointerEvent("pointerup", {
            bubbles: true,
            button: 0,
            clientX: centerX + 100,
            clientY: centerY,
            pointerId,
            pointerType: "mouse",
          }),
        );
      };

      dispatchHorizontalLook(1);
      dispatchHorizontalLook(2);
    });

    await expect(stage).toHaveAttribute("data-look-yaw", "20.00");
    await expect(stage).toHaveAttribute("data-look-pitch", "0.00");
    await expect(stage).toHaveAttribute("data-checkpoint", "memoryPines");
    await expect(stage).toHaveAttribute("data-journey-phase", "fallback-settled");
  });

  test("ArrowDown from a focused nested control child does not navigate", async ({
    page,
  }) => {
    await forceWebglFallback(page);
    await page.goto(LAB_PATH);
    await page.getByTestId("dalat-journey-enter").click();

    const stage = page.getByTestId("dalat-journey-stage");
    await expect(stage).toHaveAttribute("data-checkpoint", "memoryPines");
    await expect(stage).toHaveAttribute("data-journey-phase", "fallback-settled");
    await page.evaluate(() => {
      const next = document.querySelector<HTMLElement>(
        '[data-testid="dalat-journey-next"]',
      );
      if (!next) throw new Error("Missing next control");

      const child = document.createElement("span");
      child.dataset.testid = "dalat-journey-next-keyboard-child";
      child.tabIndex = -1;
      next.append(child);
    });

    await page.getByTestId("dalat-journey-next-keyboard-child").focus();
    await page.keyboard.press("ArrowDown");
    await expect(stage).toHaveAttribute("data-checkpoint", "memoryPines");
    await expect(stage).toHaveAttribute("data-journey-phase", "fallback-settled");
  });

  test("forced WebGL failure keeps the fallback journey navigable", async ({
    page,
  }) => {
    const consoleErrors: string[] = [];
    page.on("console", (message) => {
      if (message.type() === "error") consoleErrors.push(message.text());
    });
    await forceWebglFallback(page);
    await page.goto(LAB_PATH);

    const stage = page.getByTestId("dalat-journey-stage");
    await expect(stage).toHaveAttribute("data-renderer", "fallback");
    await page.getByTestId("dalat-journey-enter").click();

    const fallback = page.getByTestId("dalat-journey-fallback");
    await expect(fallback).toBeVisible();
    await expect(stage).toHaveAttribute("data-checkpoint", "memoryPines");
    await expect(stage).toHaveAttribute("data-journey-phase", "fallback-settled");

    const previous = page.getByTestId("dalat-journey-previous");
    const next = page.getByTestId("dalat-journey-next");
    await expect(previous).toBeEnabled();
    await expect(next).toBeEnabled();

    await next.click();
    await expect(stage).toHaveAttribute("data-checkpoint", "timeGlasshouse");
    await expect(fallback).toHaveAttribute("data-checkpoint", "timeGlasshouse");

    await previous.click();
    await expect(stage).toHaveAttribute("data-checkpoint", "memoryPines");

    await previous.click();
    await expect(stage).toHaveAttribute("data-checkpoint", "mistGate");
    await expect(previous).toBeDisabled();

    await next.click();
    await expect(stage).toHaveAttribute("data-checkpoint", "memoryPines");
    await next.click();
    await expect(stage).toHaveAttribute("data-checkpoint", "timeGlasshouse");
    await next.click();
    await expect(stage).toHaveAttribute("data-checkpoint", "lakePavilion");
    await next.click();
    await expect(stage).toHaveAttribute("data-checkpoint", "wishValley");
    await expect(stage).toHaveAttribute("data-journey-phase", "fallback-settled");
    await expect(next).toBeDisabled();

    await previous.click();
    await expect(stage).toHaveAttribute("data-checkpoint", "lakePavilion");
    expect(consoleErrors).toEqual([]);
  });

  test("real canvas context loss falls back without console errors and preserves the intended checkpoint", async ({
    page,
  }) => {
    const consoleErrors: string[] = [];
    page.on("console", (message) => {
      if (message.type() === "error") consoleErrors.push(message.text());
    });

    await page.goto(LAB_PATH);

    const stage = page.getByTestId("dalat-journey-stage");
    await page.getByTestId("dalat-journey-enter").click();
    await expect(page.getByTestId("dalat-journey-canvas")).toBeVisible();
    await expect(stage).toHaveAttribute("data-renderer", "webgl");
    await expect(stage).toHaveAttribute("data-checkpoint", "memoryPines");
    await expect(stage).toHaveAttribute("data-journey-phase", "settled");

    await page.getByTestId("dalat-journey-next").click();
    await expect(stage).toHaveAttribute("data-journey-phase", "travelling");

    const defaultPrevented = await page
      .getByTestId("dalat-journey-canvas")
      .locator("canvas")
      .evaluate((canvas) => {
        const event = new Event("webglcontextlost", { cancelable: true });
        canvas.dispatchEvent(event);
        return event.defaultPrevented;
      });

    expect(defaultPrevented).toBe(true);
    await expect(stage).toHaveAttribute("data-renderer", "fallback");
    await expect(stage).toHaveAttribute("data-checkpoint", "timeGlasshouse");
    await expect(stage).toHaveAttribute("data-journey-phase", "fallback-settled");
    await expect(page.getByTestId("dalat-journey-fallback")).toBeVisible();
    expect(consoleErrors).toEqual([]);
  });

  test("a vertical swipe advances and a horizontal look changes yaw only", async ({
    page,
  }) => {
    await forceWebglFallback(page);
    await page.goto(LAB_PATH);
    await page.getByTestId("dalat-journey-enter").click();

    const stage = page.getByTestId("dalat-journey-stage");
    await expect(stage).toHaveAttribute("data-checkpoint", "memoryPines");

    const box = await stage.boundingBox();
    if (!box) {
      throw new Error("dalat-journey-stage has no layout box");
    }
    const centerX = box.x + box.width / 2;
    const centerY = box.y + box.height / 2;

    await page.mouse.move(centerX, centerY);
    await page.mouse.down();
    await page.mouse.move(centerX, centerY - 120, { steps: 6 });
    await page.mouse.up();
    await expect(stage).toHaveAttribute("data-checkpoint", "timeGlasshouse");
    await expect(stage).toHaveAttribute("data-journey-phase", "fallback-settled");

    await page.mouse.move(centerX, centerY);
    await page.mouse.down();
    await page.mouse.move(centerX + 100, centerY, { steps: 6 });
    await page.mouse.up();
    await expect(stage).toHaveAttribute("data-look-yaw", "10.00");
    await expect(stage).toHaveAttribute("data-checkpoint", "timeGlasshouse");
    await expect(stage).toHaveAttribute("data-journey-phase", "fallback-settled");
  });

  test("threshold shows the mist gate panorama behind the entry", async ({
    page,
  }) => {
    await forceWebglFallback(page);
    await page.goto(LAB_PATH);

    const stage = page.getByTestId("dalat-journey-stage");
    await expect(stage).toHaveAttribute("data-renderer", "fallback");
    const panorama = page.getByTestId("dalat-journey-artwork-backdrop");
    await expect(panorama).toBeVisible();
    await expect(panorama).toHaveAttribute(
      "data-backdrop-checkpoint",
      "mistGate",
    );
    await expect(panorama).toHaveAttribute("data-backdrop-state", "settled");
    await expect(page.getByTestId("dalat-journey-enter")).toBeVisible();

    await page.getByTestId("dalat-journey-enter").click();
    await expect(stage).toHaveAttribute("data-checkpoint", "memoryPines");
    await expect(panorama).toHaveAttribute(
      "data-backdrop-checkpoint",
      "memoryPines",
    );
  });

  test("a small vertical drag looks pitch only without navigating", async ({
    page,
  }) => {
    await forceWebglFallback(page);
    await page.goto(LAB_PATH);
    await page.getByTestId("dalat-journey-enter").click();

    const stage = page.getByTestId("dalat-journey-stage");
    await expect(stage).toHaveAttribute("data-checkpoint", "memoryPines");
    await expect(stage).toHaveAttribute("data-journey-phase", "fallback-settled");

    const box = await stage.boundingBox();
    if (!box) {
      throw new Error("dalat-journey-stage has no layout box");
    }
    const centerX = box.x + box.width / 2;
    const centerY = box.y + box.height / 2;

    await page.mouse.move(centerX, centerY);
    await page.mouse.down();
    await page.mouse.move(centerX, centerY - 30, { steps: 4 });
    await page.mouse.up();

    await expect(stage).toHaveAttribute("data-look-pitch", "3.00");
    await expect(stage).toHaveAttribute("data-look-yaw", "0.00");
    await expect(stage).toHaveAttribute("data-checkpoint", "memoryPines");
    await expect(stage).toHaveAttribute("data-journey-phase", "fallback-settled");
  });

  test("successive horizontal drags accumulate look rather than reset", async ({
    page,
  }) => {
    await forceWebglFallback(page);
    await page.goto(LAB_PATH);
    await page.getByTestId("dalat-journey-enter").click();

    const stage = page.getByTestId("dalat-journey-stage");
    await expect(stage).toHaveAttribute("data-checkpoint", "memoryPines");
    await expect(stage).toHaveAttribute("data-journey-phase", "fallback-settled");

    const box = await stage.boundingBox();
    if (!box) {
      throw new Error("dalat-journey-stage has no layout box");
    }
    const centerX = box.x + box.width / 2;
    const centerY = box.y + box.height / 2;

    await page.mouse.move(centerX, centerY);
    await page.mouse.down();
    await page.mouse.move(centerX + 100, centerY, { steps: 6 });
    await page.mouse.up();
    await expect(stage).toHaveAttribute("data-look-yaw", "10.00");

    await page.mouse.move(centerX, centerY);
    await page.mouse.down();
    await page.mouse.move(centerX + 100, centerY, { steps: 6 });
    await page.mouse.up();
    await expect(stage).toHaveAttribute("data-look-yaw", "20.00");

    await page.mouse.move(centerX, centerY);
    await page.mouse.down();
    await page.mouse.move(centerX + 100, centerY, { steps: 6 });
    await page.mouse.up();
    await expect(stage).toHaveAttribute("data-look-yaw", "20.00");
    await expect(stage).toHaveAttribute("data-checkpoint", "memoryPines");
    await expect(stage).toHaveAttribute("data-journey-phase", "fallback-settled");
  });

  test("mobile viewport fits without overflow and exposes adequate controls", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await forceWebglFallback(page);
    await page.goto(LAB_PATH);

    const stage = page.getByTestId("dalat-journey-stage");
    const enter = page.getByTestId("dalat-journey-enter");
    await expect(enter).toBeEnabled();
    const enterBox = await enter.boundingBox();
    expect(enterBox).not.toBeNull();
    if (enterBox) {
      expect(enterBox.width).toBeGreaterThanOrEqual(44);
      expect(enterBox.height).toBeGreaterThanOrEqual(44);
    }

    await enter.click();
    await expect(stage).toHaveAttribute("data-checkpoint", "memoryPines");
    await expect(page.getByTestId("dalat-journey-fallback")).toBeVisible();

    for (const testId of [
      "dalat-journey-previous",
      "dalat-journey-next",
      "dalat-journey-reduced-motion",
    ]) {
      const control = page.getByTestId(testId);
      await expect(control).toBeVisible();
      const box = await control.boundingBox();
      expect(box).not.toBeNull();
      if (box) {
        expect(box.width).toBeGreaterThanOrEqual(44);
        expect(box.height).toBeGreaterThanOrEqual(44);
      }
    }

    expect(
      await page.evaluate(() => document.documentElement.scrollWidth),
    ).toBeLessThanOrEqual(390);
  });
});

import { expect, test } from "@playwright/test";

/**
 * Behavioural coverage for the private beach journey lab. Modelled on
 * `forest-wedding-journey-lab.spec.ts` — the two labs share their journey
 * mechanics, so the navigation, focus, fallback and reduced-motion contracts
 * are deliberately parallel. Fixes to a shared contract belong in both files.
 *
 * Where the beach diverges the assertions diverge with it:
 * - the world mode is `photoreal` (skin `beach-wedding-photoreal`), so there is
 *   no `environment.mode` / `environment.textures` diagnostic to assert;
 * - the authored cues are water sparkle and wind strength only, not the
 *   forest's five;
 * - there is no recenter button — recentring is the camera's first travel
 *   phase, so it is observed through the camera recording;
 * - `beach-journey-gesture-surface` exists only in the DOM fallback, so WebGL
 *   drags target the stage and must avoid `[data-beach-interactive]`, which
 *   `isBeachJourneyInteractiveElement` deliberately swallows.
 */
const LAB_PATH = "/lab/beach-wedding-journey";
const BEACH_SCENE_IDS = [
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

type BeachSceneId = (typeof BEACH_SCENE_IDS)[number];

/**
 * The physical scenes that must render a paper surface. `cover-gate` is the
 * threshold itself and never renders one, so it is absent by design.
 */
const BEACH_PHYSICAL_SCENES = [
  { id: "families", name: "Hai bên gia đình", type: "families" },
  { id: "opening-message", name: "Lời ngỏ", type: "opening-message" },
  { id: "calendar", name: "Lịch ngày vui", type: "calendar" },
  { id: "schedule", name: "Lịch trình", type: "schedule" },
  { id: "gallery-photo:memory-01", name: "Khoảnh khắc", type: "gallery-photo" },
  { id: "dress-code", name: "Trang phục", type: "dress-code" },
  { id: "venue", name: "Địa điểm", type: "venue" },
  { id: "map", name: "Bản đồ", type: "map" },
  { id: "rsvp", name: "Xác nhận tham dự", type: "rsvp" },
  { id: "wishes", name: "Lời chúc", type: "wishes" },
  { id: "gift", name: "Phong bao mừng cưới", type: "gift" },
  { id: "finale", name: "Lời cảm ơn", type: "finale" },
] as const;

/** Localized scene names, to prove the canvas labels the active scene per locale. */
const BEACH_LOCALE_SCENE_NAMES = {
  en: { enter: "Walk out", families: "Our families" },
  ja: { enter: "海辺へ", families: "両家のご紹介" },
  ko: { enter: "해변으로", families: "양가 소개" },
  zh: { enter: "走向海边", families: "双方家庭" },
} as const;

/** Free-look clamps, from `beachWeddingJourneyDefinition.look`. */
const LOOK_YAW_LIMIT_DEGREES = 20;
const LOOK_PITCH_LIMIT_DEGREES = 8;
/** `use-beach-journey-input.ts` debounces wheel bursts over this window. */
const WHEEL_BURST_SETTLE_MS = 260;

async function gotoLab(page: import("@playwright/test").Page) {
  await page.goto(LAB_PATH);
}

async function forceWebglFallback(page: import("@playwright/test").Page) {
  await page.addInitScript(() => {
    Object.defineProperty(HTMLCanvasElement.prototype, "getContext", {
      configurable: true,
      value: () => null,
    });
  });
}

/**
 * The fallback gesture surface sits under the resident scene papers, so a fixed
 * fraction can land on a paper instead. Hit-test until a point genuinely
 * belongs to the surface.
 */
async function findGesturePoint(
  page: import("@playwright/test").Page,
  verticalFractions: readonly number[] = [0.75, 0.2, 0.88, 0.12],
) {
  const gestureSurface = page.getByTestId("beach-journey-gesture-surface");
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

    throw new Error("No hit-tested point belongs to the beach gesture surface");
  }, verticalFractions);
}

/**
 * In WebGL there is no gesture surface — the stage owns the pointer listeners.
 * `isBeachJourneyInteractiveElement` swallows drags that start on the active
 * paper, so pick a point on the stage that no interactive element claims.
 */
async function findStageDragPoint(page: import("@playwright/test").Page) {
  return page.getByTestId("beach-journey-stage").evaluate((element) => {
    const bounds = element.getBoundingClientRect();

    for (const verticalFraction of [0.85, 0.12, 0.7, 0.25]) {
      for (const horizontalFraction of [0.08, 0.92, 0.2, 0.8]) {
        const x = bounds.left + bounds.width * horizontalFraction;
        const y = bounds.top + bounds.height * verticalFraction;
        const hit = document.elementFromPoint(x, y);

        if (
          hit instanceof HTMLElement
          && element.contains(hit)
          && hit.closest(
            "button, a, input, textarea, select, [contenteditable], [data-beach-interactive]",
          ) === null
        ) {
          return { x, y };
        }
      }
    }

    throw new Error("No draggable point on the beach stage escapes interactive elements");
  });
}

async function enterFallback(page: import("@playwright/test").Page) {
  await forceWebglFallback(page);
  await gotoLab(page);
  await expect(page.getByTestId("beach-journey-fallback")).toBeVisible();
  await expect(page.getByTestId("beach-journey-enter")).toBeEnabled();
  await page.getByTestId("beach-journey-enter").click();
  await expect(page.getByTestId("beach-journey-stage")).toHaveAttribute(
    "data-journey-phase",
    "fallback-settled",
  );
}

async function enterWebgl(page: import("@playwright/test").Page) {
  await gotoLab(page);
  const stage = page.getByTestId("beach-journey-stage");
  await expect(stage).toHaveAttribute("data-renderer", "webgl");
  await expect(page.getByTestId("beach-journey-canvas")).toHaveAttribute(
    "data-world-ready",
    "true",
  );
  await expect(page.getByTestId("beach-journey-enter")).toBeEnabled();
  await page.getByTestId("beach-journey-enter").click();
  await expect(stage).toHaveAttribute("data-journey-phase", "settled");
  await expect(stage).toHaveAttribute("data-current-scene-id", "families");
}

async function advanceBeachScene(
  page: import("@playwright/test").Page,
  expectedSceneId: string,
) {
  const stage = page.getByTestId("beach-journey-stage");
  await page.getByTestId("beach-journey-next").click();
  await expect(stage).toHaveAttribute("data-journey-phase", /^(?:fallback-)?settled$/);
  await expect(stage).toHaveAttribute("data-current-scene-id", expectedSceneId);
}

async function navigateToBeachScene(
  page: import("@playwright/test").Page,
  expectedSceneId: BeachSceneId,
) {
  const stage = page.getByTestId("beach-journey-stage");
  const targetIndex = BEACH_SCENE_IDS.indexOf(expectedSceneId);
  expect(targetIndex).toBeGreaterThanOrEqual(0);

  for (let attempt = 0; attempt < BEACH_SCENE_IDS.length; attempt += 1) {
    const currentSceneId = await stage.getAttribute("data-current-scene-id");
    if (currentSceneId === expectedSceneId) return;

    const currentIndex = BEACH_SCENE_IDS.indexOf(currentSceneId as BeachSceneId);
    expect(currentIndex).toBeGreaterThanOrEqual(0);
    const direction = currentIndex < targetIndex ? "next" : "previous";
    await page.getByTestId(`beach-journey-${direction}`).click();
    await expect(stage).toHaveAttribute(
      "data-journey-phase",
      /^(?:fallback-)?settled$/,
    );
  }

  throw new Error(`Could not navigate to beach scene ${expectedSceneId}`);
}

async function expectActivePhysicalScene(
  page: import("@playwright/test").Page,
  sceneType: string,
  expectedName?: string,
) {
  const activeSurface = page.locator(
    `[data-testid="beach-scene-${sceneType}"][data-beach-interactive="true"]`,
  );
  await expect(activeSurface).toHaveCount(1);
  await expect(activeSurface).toHaveAttribute("aria-hidden", "false");
  await expect(activeSurface.locator("h2")).toHaveCount(1);
  await expect(activeSurface.locator("h2")).toHaveAttribute("tabindex", "-1");
  if (expectedName) await expect(activeSurface.locator("h2")).toHaveText(expectedName);

  const offSceneHeadings = page.locator(
    '[data-testid^="beach-scene-"]:not([data-beach-interactive="true"]) h2',
  );
  expect(await offSceneHeadings.evaluateAll((headings) => headings.every((heading) => (
    heading instanceof HTMLElement
    && heading.tabIndex < 0
    && !heading.hasAttribute("tabindex")
    && heading.closest('[aria-hidden="true"][inert]') !== null
  )))).toBe(true);
}

test.describe("beach lab threshold", () => {
  test("the private beach route renders a localized noindex threshold", async ({ page }) => {
    await gotoLab(page);

    await expect(page).toHaveTitle(/biển cưới|Beach Wedding/i);
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
      "content",
      /noindex/,
    );

    const stage = page.getByTestId("beach-journey-stage");
    await expect(stage).toHaveAttribute("data-journey-phase", "threshold");
    await expect(stage).toHaveAttribute("data-scene", "cover-gate");
    await expect(stage).toHaveAttribute("data-scene-total", "15");

    const entry = page.getByTestId("beach-journey-enter");
    await expect(entry).toBeVisible();
    expect(await entry.evaluate((element) => element instanceof HTMLButtonElement)).toBe(true);
    await expect(entry).toBeEnabled();
  });

  test("the threshold follows the demo couple's groom-first ordering", async ({ page }) => {
    await gotoLab(page);

    await expect(page.getByTestId("beach-journey-couple")).toHaveText(
      /Trần Minh Quân\s*&\s*Nguyễn Bảo Trân/,
    );
  });

  test("the threshold shows one localized reception date", async ({ page }) => {
    await gotoLab(page);

    const dates = page.getByTestId("beach-journey-stage").locator("time");
    await expect(dates).toHaveCount(1);
    await expect(dates).toHaveAttribute("datetime", "2026-08-02");
    await expect(dates).not.toHaveText("2026-08-02");
  });

  test("the threshold leaves touch actions available to the browser", async ({ page }) => {
    await gotoLab(page);

    const touchAction = await page
      .getByTestId("beach-journey-stage")
      .evaluate((element) => getComputedStyle(element).touchAction);
    expect(touchAction).toBe("auto");
  });

  test("the voile departs and goes inert once the walk begins", async ({ page }) => {
    await enterWebgl(page);

    const voile = page.getByTestId("beach-journey-voile");
    if (await voile.count() > 0) {
      await expect(voile).toHaveAttribute("data-departing", "true");
      expect(await voile.evaluate((element) => element.hasAttribute("inert"))).toBe(true);
    }
    await expect(page.getByTestId("beach-journey-enter")).toBeHidden();
  });
});

test.describe("beach WebGL navigation", () => {
  test("entry waits for the renderer and the world before enabling the walk", async ({ page }) => {
    await gotoLab(page);

    const canvas = page.getByTestId("beach-journey-canvas");
    await expect(canvas).toHaveAttribute("data-world-ready", "true");
    await expect(canvas).toHaveAttribute("data-world-mode", "photoreal");
    await expect(canvas).toHaveAttribute(
      "data-world-skin",
      "beach-wedding-photoreal",
    );
    await expect(canvas).toHaveAttribute("data-runtime-ready", "true");
    await expect(page.getByTestId("beach-journey-enter")).toBeEnabled();
  });

  test("Next and Previous walk the rail and gate at both ends", async ({ page }) => {
    await enterWebgl(page);
    const stage = page.getByTestId("beach-journey-stage");
    const previous = page.getByTestId("beach-journey-previous");
    const next = page.getByTestId("beach-journey-next");

    await advanceBeachScene(page, "opening-message");
    await page.getByTestId("beach-journey-previous").click();
    await expect(stage).toHaveAttribute("data-journey-phase", "settled");
    await expect(stage).toHaveAttribute("data-current-scene-id", "families");

    await navigateToBeachScene(page, "cover-gate");
    await expect(previous).toBeDisabled();

    await navigateToBeachScene(page, "finale");
    await expect(next).toBeDisabled();
    await expect(previous).toBeEnabled();
  });

  test("travel exposes the target scene before it settles", async ({ page }) => {
    await enterWebgl(page);
    const stage = page.getByTestId("beach-journey-stage");

    await page.getByTestId("beach-journey-next").click();
    await expect(stage).toHaveAttribute("data-target-scene-id", "opening-message");
    await expect(stage).toHaveAttribute("data-journey-phase", "settled");
    await expect(stage).toHaveAttribute("data-target-scene-id", "");
    await expect(stage).toHaveAttribute("data-current-scene-id", "opening-message");
  });

  test("keyboard arrows walk the rail in both directions", async ({ page }) => {
    await enterWebgl(page);
    const stage = page.getByTestId("beach-journey-stage");

    await page.keyboard.press("ArrowDown");
    await expect(stage).toHaveAttribute("data-journey-phase", "settled");
    await expect(stage).toHaveAttribute("data-current-scene-id", "opening-message");

    await page.keyboard.press("ArrowRight");
    await expect(stage).toHaveAttribute("data-journey-phase", "settled");
    await expect(stage).toHaveAttribute("data-current-scene-id", "calendar");

    await page.keyboard.press("ArrowUp");
    await expect(stage).toHaveAttribute("data-journey-phase", "settled");
    await expect(stage).toHaveAttribute("data-current-scene-id", "opening-message");
  });

  test("a wheel burst advances exactly one scene", async ({ page }) => {
    await enterWebgl(page);
    const stage = page.getByTestId("beach-journey-stage");
    const point = await findStageDragPoint(page);

    await page.mouse.move(point.x, point.y);
    await page.mouse.wheel(0, 70);
    await page.mouse.wheel(0, 40);
    await page.mouse.wheel(0, -2);
    await expect(stage).toHaveAttribute("data-journey-phase", "settled");
    await expect(stage).toHaveAttribute("data-current-scene-id", "opening-message");

    await page.waitForTimeout(WHEEL_BURST_SETTLE_MS);
    await expect(stage).toHaveAttribute("data-current-scene-id", "opening-message");
  });

  test("free look pans within the authored clamps and survives navigation", async ({ page }) => {
    await enterWebgl(page);
    const stage = page.getByTestId("beach-journey-stage");
    const point = await findStageDragPoint(page);

    await page.mouse.move(point.x, point.y);
    await page.mouse.down();
    await page.mouse.move(point.x + 400, point.y + 4, { steps: 8 });
    await page.mouse.up();

    await expect
      .poll(() => stage.getAttribute("data-look-yaw").then(Number))
      .toBeGreaterThan(0);
    const yaw = Number(await stage.getAttribute("data-look-yaw"));
    const pitch = Number(await stage.getAttribute("data-look-pitch"));
    expect(yaw).toBeLessThanOrEqual(LOOK_YAW_LIMIT_DEGREES);
    expect(Math.abs(pitch)).toBeLessThanOrEqual(LOOK_PITCH_LIMIT_DEGREES);
    // A horizontal drag must not advance the rail.
    await expect(stage).toHaveAttribute("data-current-scene-id", "families");
  });

  test("recentring runs as the opening slice of travel, not as a pose reset", async ({ page }) => {
    await enterWebgl(page);
    const stage = page.getByTestId("beach-journey-stage");
    const point = await findStageDragPoint(page);

    await page.mouse.move(point.x, point.y);
    await page.mouse.down();
    await page.mouse.move(point.x + 400, point.y + 4, { steps: 8 });
    await page.mouse.up();
    await expect
      .poll(() => stage.getAttribute("data-look-yaw").then(Number))
      .toBeGreaterThan(0);

    const canvas = page.getByTestId("beach-journey-canvas");
    // The camera's live pose is written to the canvas boundary. Recentring must
    // start from the free-look yaw and glide to zero, not snap.
    const yawBeforeTravel = Number(await canvas.getAttribute("data-rendered-look-yaw"));
    expect(yawBeforeTravel).toBeGreaterThan(0);

    await page.getByTestId("beach-journey-next").click();
    await expect(stage).toHaveAttribute("data-journey-phase", "settled");
    await expect(stage).toHaveAttribute("data-look-yaw", "0");
    await expect(canvas).toHaveAttribute("data-rendered-look-yaw", "0.000");
  });

  test("each physical scene exposes exactly one interactive paper", async ({ page }) => {
    await enterWebgl(page);

    for (const scene of BEACH_PHYSICAL_SCENES) {
      await navigateToBeachScene(page, scene.id);
      await expectActivePhysicalScene(page, scene.type, scene.name);
    }
  });

  test("button navigation moves focus to the arriving scene heading", async ({ page }) => {
    await enterWebgl(page);

    await page.getByTestId("beach-journey-next").click();
    await expect(page.getByTestId("beach-journey-stage")).toHaveAttribute(
      "data-current-scene-id",
      "opening-message",
    );

    await expect
      .poll(() => page.evaluate(() => {
        const active = document.activeElement;
        if (!(active instanceof HTMLElement)) return null;
        const surface = active.closest("[data-beach-scene-id]");
        return surface instanceof HTMLElement
          ? `${active.tagName}:${surface.dataset.beachSceneId}`
          : active.tagName;
      }))
      .toBe("H2:opening-message");
  });
});

test.describe("beach localisation", () => {
  for (const [locale, copy] of Object.entries(BEACH_LOCALE_SCENE_NAMES)) {
    test(`the ${locale} canvas names the active scene with localized copy`, async ({ page }) => {
      await page.goto(`/${locale}${LAB_PATH}`);
      // `src/proxy.ts` folds foreign locale prefixes back onto the Vietnamese
      // path everywhere except its journey-lab allowlist. Pin the served locale
      // so a missing allowlist entry fails here rather than silently serving vi.
      await expect(page.locator("html")).toHaveAttribute("lang", locale);
      const enter = page.getByTestId("beach-journey-enter");
      await expect(enter).toHaveText(copy.enter);
      await expect(enter).toBeEnabled();
      await enter.click();

      const stage = page.getByTestId("beach-journey-stage");
      await expect(stage).toHaveAttribute("data-journey-phase", "settled");
      await expect(page.getByTestId("beach-journey-canvas")).toHaveAttribute(
        "aria-label",
        copy.families,
      );
    });
  }
});

test.describe("beach DOM fallback", () => {
  test("fallback walks the generated semantic scene list", async ({ page }) => {
    await enterFallback(page);
    const stage = page.getByTestId("beach-journey-stage");
    await expect(stage).toHaveAttribute("data-renderer", "fallback");
    await expect(page.getByTestId("beach-journey-canvas")).toHaveCount(0);

    for (const sceneId of BEACH_SCENE_IDS.slice(2)) {
      await advanceBeachScene(page, sceneId);
    }
    await expect(page.getByTestId("beach-journey-next")).toBeDisabled();
  });

  test("the fallback stage paints its four beach bands", async ({ page }) => {
    await enterFallback(page);

    for (const band of ["sky", "sea", "wet-sand", "tables"]) {
      const layer = page.locator(`[data-fallback-band="${band}"]`);
      await expect(layer).toHaveCount(1);
      await expect(layer).toHaveAttribute("aria-hidden", "true");
    }
  });

  test("fallback exposes one interactive paper per scene", async ({ page }) => {
    await enterFallback(page);

    for (const scene of BEACH_PHYSICAL_SCENES.slice(0, 5)) {
      await navigateToBeachScene(page, scene.id);
      await expectActivePhysicalScene(page, scene.type, scene.name);
    }
  });

  test("a vertical drag on the fallback surface advances the walk", async ({ page }) => {
    await enterFallback(page);
    const stage = page.getByTestId("beach-journey-stage");
    const point = await findGesturePoint(page);

    await page.mouse.move(point.x, point.y);
    await page.mouse.down();
    await page.mouse.move(point.x + 4, point.y - 90, { steps: 4 });
    await page.mouse.up();

    await expect(stage).toHaveAttribute("data-journey-phase", "fallback-settled");
    await expect(stage).toHaveAttribute("data-current-scene-id", "opening-message");
  });

  test("a horizontal drag on the fallback surface only looks", async ({ page }) => {
    await enterFallback(page);
    const stage = page.getByTestId("beach-journey-stage");
    const point = await findGesturePoint(page);

    await page.mouse.move(point.x, point.y);
    await page.mouse.down();
    await page.mouse.move(point.x + 120, point.y + 5, { steps: 4 });
    await page.mouse.up();

    await expect(stage).toHaveAttribute("data-current-scene-id", "families");
    expect(Number(await stage.getAttribute("data-look-yaw"))).toBeGreaterThan(0);
  });

  test("context loss preserves the active scene and hands input to the fallback", async ({
    page,
  }) => {
    await enterWebgl(page);
    await navigateToBeachScene(page, "calendar");
    const stage = page.getByTestId("beach-journey-stage");

    const canvas = page.getByTestId("beach-journey-canvas").locator("canvas");
    const preventedDefaults = await canvas.evaluate((element) => {
      const first = new Event("webglcontextlost", { cancelable: true });
      element.dispatchEvent(first);
      return [first.defaultPrevented];
    });
    expect(preventedDefaults).toEqual([true]);

    await expect(page.getByTestId("beach-journey-fallback")).toBeVisible();
    await expect(stage).toHaveAttribute("data-renderer", "fallback");
    await expect(stage).toHaveAttribute("data-current-scene-id", "calendar");
    await expectActivePhysicalScene(page, "calendar");

    const point = await findGesturePoint(page);
    await page.mouse.move(point.x, point.y);
    await page.mouse.down();
    await page.mouse.move(point.x + 4, point.y - 90, { steps: 4 });
    await page.mouse.up();
    await expect(stage).toHaveAttribute("data-current-scene-id", "schedule");
  });
});

test.describe("beach reduced motion", () => {
  test("system reduced motion owns the 180ms fallback travel contract", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await enterFallback(page);
    const stage = page.getByTestId("beach-journey-stage");

    await page.getByTestId("beach-journey-next").click();

    const visiblePaper = page.locator(
      '[data-testid="beach-fallback-physical-surface"][data-beach-visible="true"]',
    );
    const fadeDurations = await visiblePaper.first().evaluate((element) => element
      .getAnimations()
      .filter((animation) => (
        animation instanceof CSSAnimation
        && animation.animationName.includes("fallbackSceneFade")
      ))
      .map((animation) => animation.effect?.getTiming().duration ?? null));
    expect(fadeDurations).toContain(180);

    await expect(stage).toHaveAttribute(
      "data-journey-phase",
      "fallback-settled",
      { timeout: 450 },
    );
    await expect(stage).toHaveAttribute("data-current-scene-id", "opening-message");
  });

  test("system reduced WebGL arrives within 600ms with the pose and cues frozen", async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await gotoLab(page);
    await expect(page.getByTestId("beach-journey-canvas")).toHaveAttribute(
      "data-world-ready",
      "true",
    );
    await expect(page.getByTestId("beach-journey-enter")).toBeEnabled();

    const arrival = await page.evaluate(async () => {
      const stage = document.querySelector<HTMLElement>(
        '[data-testid="beach-journey-stage"]',
      );
      const enter = document.querySelector<HTMLButtonElement>(
        '[data-testid="beach-journey-enter"]',
      );
      if (!stage || !enter) throw new Error("beach stage or enter button missing");

      let sawTravel = false;
      let disabledDuringTravel = false;
      const started = performance.now();

      const durationMs = await new Promise<number>((resolve, reject) => {
        const failed = window.setTimeout(() => {
          observer.disconnect();
          reject(new Error(
            `reduced WebGL entry never settled (phase=${stage.dataset.journeyPhase})`,
          ));
        }, 5_000);
        const inspect = () => {
          const phase = stage.dataset.journeyPhase;
          const live = stage.querySelector<HTMLButtonElement>(
            '[data-testid="beach-journey-enter"]',
          );
          if (phase === "travelling") {
            sawTravel = true;
            disabledDuringTravel ||= live?.disabled === true;
          }
          if (sawTravel && phase === "settled") {
            window.clearTimeout(failed);
            observer.disconnect();
            resolve(performance.now() - started);
          }
        };
        const observer = new MutationObserver(inspect);
        observer.observe(stage, {
          attributeFilter: ["data-journey-phase"],
          attributes: true,
          childList: true,
          subtree: true,
        });
        enter.click();
        inspect();
      });

      return { disabledDuringTravel, durationMs };
    });

    expect(arrival.durationMs).toBeLessThanOrEqual(600);
    expect(arrival.disabledDuringTravel).toBe(true);

    const stage = page.getByTestId("beach-journey-stage");
    await expect(stage).toHaveAttribute("data-look-pitch", "0");
    await expect(stage).toHaveAttribute("data-look-yaw", "0");

    const canvas = page.getByTestId("beach-journey-canvas");
    for (const attribute of [
      "data-cue-water-sparkle",
      "data-cue-wind-strength",
      "data-travel-progress",
    ]) {
      await expect(canvas).toHaveAttribute(attribute, "0");
    }
  });

  test("the reduced-motion toggle reflects and inverts the journey preference", async ({
    page,
  }) => {
    await enterWebgl(page);
    const toggle = page.getByTestId("beach-journey-reduced-motion");

    await expect(toggle).toHaveAttribute("aria-pressed", "false");
    await toggle.click();
    await expect(toggle).toHaveAttribute("aria-pressed", "true");
    await toggle.click();
    await expect(toggle).toHaveAttribute("aria-pressed", "false");
  });
});

test.describe("beach mobile", () => {
  test.use({ viewport: { height: 844, width: 390 } });

  test("mobile WebGL never introduces horizontal overflow", async ({ page }) => {
    await enterWebgl(page);

    for (const sceneId of ["families", "gallery-photo:memory-01", "map", "finale"] as const) {
      await navigateToBeachScene(page, sceneId);
      const metrics = await page.evaluate(() => ({
        innerWidth: window.innerWidth,
        scrollWidth: document.documentElement.scrollWidth,
      }));
      expect(metrics.scrollWidth).toBeLessThanOrEqual(metrics.innerWidth);
    }
  });

  test("mobile fallback keeps papers and native controls inside the viewport", async ({
    page,
  }) => {
    await forceWebglFallback(page);
    await page.goto(`${LAB_PATH}?fixture=long-copy`);
    await expect(page.getByTestId("beach-journey-enter")).toBeEnabled();
    await page.getByTestId("beach-journey-enter").click();
    await expect(page.getByTestId("beach-journey-stage")).toHaveAttribute(
      "data-journey-phase",
      "fallback-settled",
    );

    for (const sceneId of ["families", "venue", "rsvp"] as const) {
      await navigateToBeachScene(page, sceneId);
      const metrics = await page.evaluate(() => ({
        innerWidth: window.innerWidth,
        scrollWidth: document.documentElement.scrollWidth,
      }));
      expect(metrics.scrollWidth).toBeLessThanOrEqual(metrics.innerWidth);
    }

    const controls = await page
      .getByTestId("beach-journey-next")
      .evaluate((element) => {
        const bounds = element.getBoundingClientRect();
        return { height: bounds.height, width: bounds.width };
      });
    expect(controls.height).toBeGreaterThanOrEqual(44);
    expect(controls.width).toBeGreaterThanOrEqual(44);
  });

  test("the fallback gesture surface claims touch only after entry", async ({ page }) => {
    await forceWebglFallback(page);
    await gotoLab(page);

    const stageTouchAction = await page
      .getByTestId("beach-journey-stage")
      .evaluate((element) => getComputedStyle(element).touchAction);
    expect(stageTouchAction).toBe("auto");

    await expect(page.getByTestId("beach-journey-enter")).toBeEnabled();
    await page.getByTestId("beach-journey-enter").click();
    await expect(page.getByTestId("beach-journey-stage")).toHaveAttribute(
      "data-journey-phase",
      "fallback-settled",
    );

    const surfaceTouchAction = await page
      .getByTestId("beach-journey-gesture-surface")
      .evaluate((element) => getComputedStyle(element).touchAction);
    expect(surfaceTouchAction).toBe("none");
  });
});

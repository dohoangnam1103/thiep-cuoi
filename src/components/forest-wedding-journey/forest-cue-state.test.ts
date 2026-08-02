import assert from "node:assert/strict";
import test from "node:test";
import { PerspectiveCamera, Vector3 } from "three";

import {
  createInitialForestJourneyCueState,
  evaluateForestCue,
  type ForestCueValues,
} from "./forest-cue-state";
import {
  FOREST_GATE_DOVE_PLACEMENTS,
  FOREST_FINALE_DOVE_PLACEMENTS,
  FOREST_RABBIT_PLACEMENTS,
  getForestOpeningAnimalHorizontalScale,
} from "./forest-animals";
import {
  FOREST_GATE_POST_X,
  FOREST_GATE_WOOD_SEGMENTS,
  FOREST_VOILE_PROJECTED_SIZE,
  getForestVoileWorldSize,
} from "./forest-gate";
import * as forestGate from "./forest-gate";

const ZERO_CUE: ForestCueValues = {
  doveFlight: 0,
  petalGust: 0,
  rabbitGuide: 0,
  voileLift: 0,
  windStrength: 0,
};

function projectFromThreshold(
  point: readonly [number, number, number],
  viewport: { readonly height: number; readonly width: number },
): Vector3 {
  const camera = new PerspectiveCamera(50, viewport.width / viewport.height, 0.1, 160);
  camera.position.set(0, 1.62, 8);
  camera.lookAt(0, 1.35, 3.5);
  camera.updateMatrixWorld(true);
  return new Vector3(...point).project(camera);
}

function assertBoundedFiniteCue(cue: ForestCueValues) {
  for (const value of Object.values(cue)) {
    assert.ok(Number.isFinite(value));
    assert.ok(value >= 0 && value <= 1);
  }
}

test("the initial mutable cue state starts at exact rest values", () => {
  const first = createInitialForestJourneyCueState();
  const second = createInitialForestJourneyCueState();

  assert.deepEqual(first, {
    ...ZERO_CUE,
    sceneTime: 0,
    travelProgress: 0,
  });
  assert.notEqual(first, second);
  first.sceneTime = 2;
  assert.equal(second.sceneTime, 0);
});

test("entry cues start at rest, peak during travel, and finish bounded", () => {
  const samples = [0, 0.6, 1].map((progress) => evaluateForestCue({
    phase: "travelling",
    progress,
    reducedMotion: false,
    sourceType: "cover-gate",
    targetType: "families",
  }));

  assert.deepEqual(samples[0], ZERO_CUE);
  for (const cue of samples) assertBoundedFiniteCue(cue);
  const middle = samples[1]!;
  assert.ok(middle.voileLift > 0);
  assert.ok(middle.doveFlight > 0);
  assert.ok(middle.petalGust > 0);
  assert.ok(middle.rabbitGuide > 0);
  assert.ok(middle.windStrength > 0);
});

test("ordinary travel only produces a smaller wind and petal pulse", () => {
  const ordinary = evaluateForestCue({
    phase: "travelling",
    progress: 0.6,
    reducedMotion: false,
    sourceType: "calendar",
    targetType: "schedule",
  });
  const entry = evaluateForestCue({
    phase: "travelling",
    progress: 0.6,
    reducedMotion: false,
    sourceType: "cover-gate",
    targetType: "families",
  });

  assert.equal(ordinary.doveFlight, 0);
  assert.equal(ordinary.rabbitGuide, 0);
  assert.equal(ordinary.voileLift, 0);
  assert.ok(ordinary.petalGust > 0 && ordinary.petalGust < entry.petalGust);
  assert.ok(ordinary.windStrength > 0 && ordinary.windStrength < entry.windStrength);
});

test("travelling into the finale may launch doves and petals", () => {
  const cue = evaluateForestCue({
    phase: "travelling",
    progress: 0.6,
    reducedMotion: false,
    sourceType: "gift",
    targetType: "finale",
  });

  assert.ok(cue.doveFlight > 0);
  assert.ok(cue.petalGust > 0);
  assert.equal(cue.rabbitGuide, 0);
  assert.equal(cue.voileLift, 0);
  assertBoundedFiniteCue(cue);
});

test("reverse travel from families to the gate never replays entry actors", () => {
  const cue = evaluateForestCue({
    phase: "travelling",
    progress: 0.6,
    reducedMotion: false,
    sourceType: "families",
    targetType: "cover-gate",
  });

  assert.equal(cue.doveFlight, 0);
  assert.equal(cue.rabbitGuide, 0);
  assert.equal(cue.voileLift, 0);
  assert.ok(cue.petalGust >= 0);
  assert.ok(cue.windStrength >= 0);
});

test("every reduced-motion case returns exact zero values", () => {
  for (const [phase, progress, sourceType, targetType] of [
    ["threshold", 0, "cover-gate", "cover-gate"],
    ["travelling", 0.6, "cover-gate", "families"],
    ["travelling", 1, "gift", "finale"],
    ["settled", 1, "families", "families"],
  ] as const) {
    assert.deepEqual(evaluateForestCue({
      phase,
      progress,
      reducedMotion: true,
      sourceType,
      targetType,
    }), ZERO_CUE);
  }
});

test("non-finite and out-of-range progress never escapes the cue bounds", () => {
  for (const progress of [Number.NaN, Number.POSITIVE_INFINITY, -2, 4]) {
    assertBoundedFiniteCue(evaluateForestCue({
      phase: "travelling",
      progress,
      reducedMotion: false,
      sourceType: "calendar",
      targetType: "schedule",
    }));
  }
});

test("the voile projection contract derives world dimensions from FOV and distance", () => {
  const size = getForestVoileWorldSize({
    distance: Math.hypot(4.5, 0.27),
    fovDegrees: 50,
    projectedHeightPx: FOREST_VOILE_PROJECTED_SIZE.height,
    projectedWidthPx: FOREST_VOILE_PROJECTED_SIZE.width,
    viewportHeightPx: 720,
  });

  assert.ok(Math.abs(size.width - 2.01) < 0.03);
  assert.ok(Math.abs(size.height - 2.53) < 0.03);
  assert.equal(size.width / size.height, 344 / 432);
});

test("the projected voile uses the tighter padded viewport dimension without changing its aspect", () => {
  type ProjectedSize = {
    readonly height: number;
    readonly width: number;
  };
  type ProjectedSizeHelper = (viewport: {
    readonly height: number;
    readonly width: number;
  }) => ProjectedSize;
  const getProjectedSize = (
    forestGate as typeof forestGate & {
      readonly getForestVoileProjectedSize?: ProjectedSizeHelper;
    }
  ).getForestVoileProjectedSize;

  assert.ok(getProjectedSize, "the projected veil size helper is available");

  const desktop = getProjectedSize({ height: 720, width: 1280 });
  assert.deepEqual(desktop, { height: 432, width: 344 });

  const mobile = getProjectedSize({ height: 844, width: 390 });
  assert.equal(mobile.width, 342);
  assert.equal(mobile.height, 342 * 432 / 344);

  const shortLandscape = getProjectedSize({ height: 375, width: 667 });
  assert.equal(shortLandscape.height, 327);
  assert.ok(Math.abs(shortLandscape.width - 327 * 344 / 432) < 0.000001);

  for (const size of [desktop, mobile, shortLandscape]) {
    assert.ok(Math.abs(size.width / size.height - 344 / 432) < 0.000001);
  }
});

test("authored gate and animal placements keep the opening centered and bounded", () => {
  assert.deepEqual(FOREST_GATE_POST_X, [-1.38, 1.38]);
  assert.equal(FOREST_RABBIT_PLACEMENTS.length, 2);
  assert.deepEqual(
    FOREST_RABBIT_PLACEMENTS.map(({ position }) => position),
    [[-0.9, 0.03, 3.7], [0.86, 0.03, 3.55]],
  );
  assert.equal(FOREST_GATE_DOVE_PLACEMENTS.length, 2);
  assert.deepEqual(
    FOREST_GATE_DOVE_PLACEMENTS.map(({ position }) => position),
    [[-0.58, 3.05, 3.5], [0.7, 2.95, 3.5]],
  );
  assert.equal(FOREST_FINALE_DOVE_PLACEMENTS.length, 3);
});

test("opening animals keep their desktop spread and compress mobile rabbit silhouettes into view", () => {
  const desktopScale = getForestOpeningAnimalHorizontalScale({ height: 900, width: 1440 });
  const mobileViewport = { height: 844, width: 390 } as const;
  const mobileScale = getForestOpeningAnimalHorizontalScale(mobileViewport);

  assert.equal(desktopScale, 1);
  assert.ok(mobileScale >= 0.56 && mobileScale <= 0.62);
  for (const { position } of FOREST_RABBIT_PLACEMENTS) {
    const outerX = position[0] * mobileScale + Math.sign(position[0]) * 0.245;
    const projected = projectFromThreshold(
      [outerX, position[1] + 0.58, position[2]],
      mobileViewport,
    );
    assert.ok(Math.abs(projected.x) <= 0.9);
  }
});

test("gate dove bodies clear the threshold camera's upper projection boundary", () => {
  const desktopViewport = { height: 900, width: 1440 } as const;

  for (const { position } of FOREST_GATE_DOVE_PLACEMENTS) {
    const projectedTop = projectFromThreshold(
      [position[0], position[1] + 0.125, position[2]],
      desktopViewport,
    );
    assert.ok(projectedTop.y <= 0.9);
  }
});

test("the slender gate keeps its structural opening and buried branch contract", () => {
  const diameters = FOREST_GATE_WOOD_SEGMENTS.map(({ radius }) => radius * 2);
  const verticalValues = FOREST_GATE_WOOD_SEGMENTS.flatMap(({ start, end }) => [
    start[1],
    end[1],
  ]);
  const postClearOpening = FOREST_GATE_POST_X[1]
    - FOREST_GATE_WOOD_SEGMENTS[1]!.radius
    - (FOREST_GATE_POST_X[0] + FOREST_GATE_WOOD_SEGMENTS[0]!.radius);

  assert.ok(Math.min(...diameters) >= 0.07);
  assert.ok(Math.max(...diameters) <= 0.11);
  assert.equal(Math.min(...verticalValues), -0.05);
  assert.equal(Math.max(...verticalValues), 3.4);
  assert.ok(postClearOpening >= 2.65 && postClearOpening <= 2.75);
});

// Copied from src/components/forest-wedding-journey/forest-cue-state.test.ts. Fixes to journey
// mechanics must be applied to both.

import assert from "node:assert/strict";
import test from "node:test";

import {
  createInitialBeachJourneyCueState,
  evaluateBeachCue,
  type BeachCueValues,
} from "./beach-cue-state";

const ZERO_CUE: BeachCueValues = {
  waterSparkle: 0,
  windStrength: 0,
};

function assertBoundedFiniteCue(cue: BeachCueValues) {
  for (const value of Object.values(cue)) {
    assert.ok(Number.isFinite(value));
    assert.ok(value >= 0 && value <= 1);
  }
}

test("the initial mutable cue state starts at exact rest values", () => {
  const first = createInitialBeachJourneyCueState();
  const second = createInitialBeachJourneyCueState();

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
  const samples = [0, 0.6, 1].map((progress) => evaluateBeachCue({
    phase: "travelling",
    progress,
    reducedMotion: false,
    sourceType: "cover-gate",
    targetType: "families",
  }));

  assert.deepEqual(samples[0], ZERO_CUE);
  assert.deepEqual(samples[2], ZERO_CUE);
  for (const cue of samples) assertBoundedFiniteCue(cue);
  const middle = samples[1]!;
  assert.ok(middle.waterSparkle > 0);
  assert.ok(middle.windStrength > 0);
});

test("ordinary travel only produces a smaller wind and sparkle pulse", () => {
  const ordinary = evaluateBeachCue({
    phase: "travelling",
    progress: 0.6,
    reducedMotion: false,
    sourceType: "calendar",
    targetType: "schedule",
  });
  const entry = evaluateBeachCue({
    phase: "travelling",
    progress: 0.6,
    reducedMotion: false,
    sourceType: "cover-gate",
    targetType: "families",
  });

  assert.ok(ordinary.waterSparkle > 0 && ordinary.waterSparkle < entry.waterSparkle);
  assert.ok(ordinary.windStrength > 0 && ordinary.windStrength < entry.windStrength);
});

test("travelling into the finale is its own branch between ordinary and entry", () => {
  const finale = evaluateBeachCue({
    phase: "travelling",
    progress: 0.6,
    reducedMotion: false,
    sourceType: "gift",
    targetType: "finale",
  });
  const ordinary = evaluateBeachCue({
    phase: "travelling",
    progress: 0.6,
    reducedMotion: false,
    sourceType: "calendar",
    targetType: "schedule",
  });
  const entry = evaluateBeachCue({
    phase: "travelling",
    progress: 0.6,
    reducedMotion: false,
    sourceType: "cover-gate",
    targetType: "families",
  });

  assert.ok(finale.waterSparkle > ordinary.waterSparkle);
  assert.ok(finale.waterSparkle < entry.waterSparkle);
  assert.ok(finale.windStrength > ordinary.windStrength);
  assert.ok(finale.windStrength < entry.windStrength);
  assertBoundedFiniteCue(finale);
});

test("reverse travel from families to the gate never replays the entry branch", () => {
  const reverse = evaluateBeachCue({
    phase: "travelling",
    progress: 0.6,
    reducedMotion: false,
    sourceType: "families",
    targetType: "cover-gate",
  });
  const ordinary = evaluateBeachCue({
    phase: "travelling",
    progress: 0.6,
    reducedMotion: false,
    sourceType: "calendar",
    targetType: "schedule",
  });
  const entry = evaluateBeachCue({
    phase: "travelling",
    progress: 0.6,
    reducedMotion: false,
    sourceType: "cover-gate",
    targetType: "families",
  });

  assert.deepEqual(reverse, ordinary);
  assert.notDeepEqual(reverse, entry);
  assertBoundedFiniteCue(reverse);
});

test("the entry branch needs both endpoints, not either one", () => {
  const ordinary = evaluateBeachCue({
    phase: "travelling",
    progress: 0.6,
    reducedMotion: false,
    sourceType: "calendar",
    targetType: "schedule",
  });
  const entry = evaluateBeachCue({
    phase: "travelling",
    progress: 0.6,
    reducedMotion: false,
    sourceType: "cover-gate",
    targetType: "families",
  });

  // Arriving at families from a later scene is ordinary backward travel, not a
  // second arrival through the gate, so it must not replay the entry burst.
  assert.deepEqual(evaluateBeachCue({
    phase: "travelling",
    progress: 0.6,
    reducedMotion: false,
    sourceType: "calendar",
    targetType: "families",
  }), ordinary);
  // Leaving the gate for anything other than families is likewise ordinary.
  assert.deepEqual(evaluateBeachCue({
    phase: "travelling",
    progress: 0.6,
    reducedMotion: false,
    sourceType: "cover-gate",
    targetType: "calendar",
  }), ordinary);
  assert.notDeepEqual(ordinary, entry);
});

test("every reduced-motion case returns exact zero values", () => {
  for (const [phase, progress, sourceType, targetType] of [
    ["threshold", 0, "cover-gate", "cover-gate"],
    ["travelling", 0.6, "cover-gate", "families"],
    ["travelling", 1, "gift", "finale"],
    ["settled", 1, "families", "families"],
  ] as const) {
    assert.deepEqual(evaluateBeachCue({
      phase,
      progress,
      reducedMotion: true,
      sourceType,
      targetType,
    }), ZERO_CUE);
  }
});

test("cues rest outside the travelling phase", () => {
  for (const phase of ["threshold", "settled", "fallback-settled"] as const) {
    assert.deepEqual(evaluateBeachCue({
      phase,
      progress: 0.6,
      reducedMotion: false,
      sourceType: "cover-gate",
      targetType: "families",
    }), ZERO_CUE);
  }
});

test("non-finite and out-of-range progress never escapes the cue bounds", () => {
  for (const progress of [Number.NaN, Number.POSITIVE_INFINITY, -2, 4]) {
    assertBoundedFiniteCue(evaluateBeachCue({
      phase: "travelling",
      progress,
      reducedMotion: false,
      sourceType: "calendar",
      targetType: "schedule",
    }));
  }
});

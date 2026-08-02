import assert from "node:assert/strict";
import test from "node:test";

import {
  createInitialJourneyState,
  journeyReducer,
} from "./journey-controller";

test("initial state starts at the mist gate threshold", () => {
  assert.deepEqual(createInitialJourneyState(false), {
    currentIndex: 0,
    look: { pitchDegrees: 0, yawDegrees: 0 },
    phase: "threshold",
    reducedMotion: false,
    renderMode: "webgl",
    targetIndex: null,
  });
});

test("entry travels from mist gate to memory pines", () => {
  const travelling = journeyReducer(createInitialJourneyState(false), {
    type: "enter",
  });

  assert.equal(travelling.phase, "travelling");
  assert.equal(travelling.currentIndex, 0);
  assert.equal(travelling.targetIndex, 1);
});

test("navigation is ignored while travelling", () => {
  const travelling = journeyReducer(createInitialJourneyState(false), {
    type: "enter",
  });

  assert.deepEqual(
    journeyReducer(travelling, { type: "next" }),
    travelling,
  );
  assert.deepEqual(
    journeyReducer(travelling, { type: "previous" }),
    travelling,
  );
  assert.deepEqual(
    journeyReducer(travelling, { type: "enter" }),
    travelling,
  );
});

test("arrival settles at the requested checkpoint", () => {
  const travelling = journeyReducer(createInitialJourneyState(false), {
    type: "enter",
  });
  const settled = journeyReducer(travelling, { type: "arrive" });

  assert.equal(settled.phase, "settled");
  assert.equal(settled.currentIndex, 1);
  assert.equal(settled.targetIndex, null);
  assert.deepEqual(journeyReducer(settled, { type: "arrive" }), settled);
});

test("renderer failure preserves the intended checkpoint", () => {
  const travelling = journeyReducer(createInitialJourneyState(false), {
    type: "enter",
  });
  const fallback = journeyReducer(travelling, { type: "rendererFallback" });

  assert.equal(fallback.renderMode, "fallback");
  assert.equal(fallback.phase, "fallback-settled");
  assert.equal(fallback.currentIndex, 1);
  assert.equal(fallback.targetIndex, null);
});

test("fallback at the threshold still allows explicit entry", () => {
  const fallback = journeyReducer(createInitialJourneyState(false), {
    type: "rendererFallback",
  });

  assert.equal(fallback.phase, "threshold");
  assert.equal(fallback.renderMode, "fallback");
  assert.equal(
    journeyReducer(fallback, { type: "enter" }).targetIndex,
    1,
  );
});

test("navigation respects checkpoint bounds", () => {
  const initial = createInitialJourneyState(false);
  assert.deepEqual(journeyReducer(initial, { type: "previous" }), initial);

  const atLastCheckpoint = {
    ...initial,
    currentIndex: 4,
    phase: "settled" as const,
  };
  assert.deepEqual(
    journeyReducer(atLastCheckpoint, { type: "next" }),
    atLastCheckpoint,
  );
});

test("look is clamped while either renderer is settled", () => {
  const settled = {
    ...createInitialJourneyState(false),
    phase: "settled" as const,
  };
  const looked = journeyReducer(settled, {
    type: "look",
    pitchDegrees: -99,
    yawDegrees: 99,
  });

  assert.deepEqual(looked.look, { pitchDegrees: -8, yawDegrees: 20 });

  const fallbackSettled = {
    ...looked,
    phase: "fallback-settled" as const,
    renderMode: "fallback" as const,
  };
  assert.deepEqual(
    journeyReducer(fallbackSettled, {
      type: "look",
      pitchDegrees: 99,
      yawDegrees: -99,
    }).look,
    { pitchDegrees: 8, yawDegrees: -20 },
  );
});

test("look is ignored during travel and reset before a new leg", () => {
  const looked = {
    ...createInitialJourneyState(false),
    look: { pitchDegrees: 4, yawDegrees: 12 },
    phase: "settled" as const,
  };
  const travelling = journeyReducer(looked, { type: "next" });

  assert.deepEqual(travelling.look, { pitchDegrees: 0, yawDegrees: 0 });
  assert.deepEqual(
    journeyReducer(travelling, {
      type: "look",
      pitchDegrees: 5,
      yawDegrees: 5,
    }),
    travelling,
  );
});

test("look reset and reduced-motion preference update independently", () => {
  const state = {
    ...createInitialJourneyState(false),
    look: { pitchDegrees: 3, yawDegrees: -7 },
  };
  const reset = journeyReducer(state, { type: "resetLook" });
  const reduced = journeyReducer(reset, {
    type: "setReducedMotion",
    value: true,
  });

  assert.deepEqual(reset.look, { pitchDegrees: 0, yawDegrees: 0 });
  assert.equal(reduced.reducedMotion, true);
});

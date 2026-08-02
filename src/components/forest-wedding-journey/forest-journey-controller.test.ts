import assert from "node:assert/strict";
import test from "node:test";

import {
  createInitialForestJourneyState,
  forestJourneyReducer,
  type ForestJourneyAction,
} from "./forest-journey-controller";

test("entry targets the first dynamic content scene", () => {
  const travelling = forestJourneyReducer(
    createInitialForestJourneyState(13, false),
    { source: "button", type: "enter" },
  );

  assert.equal(travelling.phase, "travelling");
  assert.equal(travelling.currentIndex, 0);
  assert.equal(travelling.targetIndex, 1);
  assert.equal(travelling.navigationSource, "button");
});

test("threshold gate rejects direct next and previous navigation", () => {
  const threshold = createInitialForestJourneyState(4, false);

  assert.strictEqual(
    forestJourneyReducer(threshold, { source: "button", type: "next" }),
    threshold,
  );
  assert.strictEqual(
    forestJourneyReducer(threshold, { source: "button", type: "previous" }),
    threshold,
  );
});

test("travel lock rejects navigation and reduced-motion changes", () => {
  const travelling = forestJourneyReducer(
    createInitialForestJourneyState(13, false),
    { source: "button", type: "enter" },
  );

  assert.strictEqual(
    forestJourneyReducer(travelling, { source: "keyboard", type: "next" }),
    travelling,
  );
  assert.strictEqual(
    forestJourneyReducer(travelling, { type: "setReducedMotion", value: true }),
    travelling,
  );
});

test("fallback during entry lands immediately at the requested scene", () => {
  const travelling = forestJourneyReducer(
    createInitialForestJourneyState(7, false),
    { source: "gesture", type: "enter" },
  );
  const fallback = forestJourneyReducer(travelling, { type: "rendererFallback" });

  assert.equal(fallback.currentIndex, 1);
  assert.equal(fallback.targetIndex, null);
  assert.equal(fallback.phase, "fallback-settled");
  assert.equal(fallback.renderMode, "fallback");
});

test("last scene navigation uses the supplied scene count", () => {
  const initial = createInitialForestJourneyState(4, false);
  const atLastScene = { ...initial, currentIndex: 3, phase: "settled" as const };

  assert.strictEqual(
    forestJourneyReducer(atLastScene, { source: "button", type: "next" }),
    atLastScene,
  );
});

test("arrival settles at the requested scene and clears its target", () => {
  const travelling = forestJourneyReducer(
    createInitialForestJourneyState(4, false),
    { source: "button", type: "enter" },
  );
  const settled = forestJourneyReducer(travelling, { type: "arrive" });

  assert.equal(settled.currentIndex, 1);
  assert.equal(settled.targetIndex, null);
  assert.equal(settled.phase, "settled");
  assert.strictEqual(forestJourneyReducer(settled, { type: "arrive" }), settled);
});

test("arrival ignores a synthetic target outside travel", () => {
  const settledWithTarget = {
    ...createInitialForestJourneyState(4, false),
    currentIndex: 1,
    phase: "settled" as const,
    targetIndex: 2,
  };

  assert.strictEqual(
    forestJourneyReducer(settledWithTarget, { type: "arrive" }),
    settledWithTarget,
  );
});

test("previous travels from a settled dynamic scene", () => {
  const initial = createInitialForestJourneyState(4, false);
  const atSecondScene = { ...initial, currentIndex: 2, phase: "settled" as const };
  const travelling = forestJourneyReducer(atSecondScene, {
    source: "keyboard",
    type: "previous",
  });

  assert.equal(travelling.targetIndex, 1);
  assert.equal(travelling.navigationSource, "keyboard");
});

test("threshold fallback keeps the threshold available for entry", () => {
  const fallback = forestJourneyReducer(createInitialForestJourneyState(4, false), {
    type: "rendererFallback",
  });

  assert.equal(fallback.phase, "threshold");
  assert.equal(fallback.renderMode, "fallback");
  assert.equal(
    forestJourneyReducer(fallback, { source: "button", type: "enter" }).targetIndex,
    1,
  );
});

test("settled renderer fallback keeps the synchronous live-look handoff", () => {
  const settled = {
    ...createInitialForestJourneyState(4, false),
    currentIndex: 1,
    phase: "settled" as const,
  };
  const fallback = forestJourneyReducer(settled, {
    look: { pitchDegrees: -3, yawDegrees: 17 },
    type: "rendererFallback",
  } as ForestJourneyAction);

  assert.equal(fallback.phase, "fallback-settled");
  assert.deepEqual(fallback.look, { pitchDegrees: -3, yawDegrees: 17 });
});

test("renderer fallback resets a threshold or travelling look handoff", () => {
  const threshold = forestJourneyReducer(createInitialForestJourneyState(4, false), {
    look: { pitchDegrees: -3, yawDegrees: 17 },
    type: "rendererFallback",
  } as ForestJourneyAction);
  const travelling = forestJourneyReducer({
    ...createInitialForestJourneyState(4, false),
    look: { pitchDegrees: 4, yawDegrees: 15 },
    phase: "travelling" as const,
    targetIndex: 1,
  }, {
    look: { pitchDegrees: -3, yawDegrees: 17 },
    type: "rendererFallback",
  } as ForestJourneyAction);

  assert.deepEqual(threshold.look, { pitchDegrees: 0, yawDegrees: 0 });
  assert.deepEqual(travelling.look, { pitchDegrees: 0, yawDegrees: 0 });
});

test("look clamps to the definition limits and reset clears it", () => {
  const initial = createInitialForestJourneyState(4, false);
  const settled = { ...initial, phase: "settled" as const };
  const looked = forestJourneyReducer(settled, {
    pitchDegrees: -99,
    type: "look",
    yawDegrees: 99,
  });

  assert.deepEqual(looked.look, { pitchDegrees: -8, yawDegrees: 20 });
  assert.deepEqual(forestJourneyReducer(looked, { type: "resetLook" }).look, {
    pitchDegrees: 0,
    yawDegrees: 0,
  });
});

test("initialization rejects a journey without a gate and finale", () => {
  assert.throws(
    () => createInitialForestJourneyState(1, false),
    /Forest journey requires gate and finale/,
  );
});

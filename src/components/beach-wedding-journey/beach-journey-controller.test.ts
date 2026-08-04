// Copied from src/components/forest-wedding-journey/forest-journey-controller.test.ts. Fixes to journey
// mechanics must be applied to both.

import assert from "node:assert/strict";
import test from "node:test";

import {
  createInitialBeachJourneyState,
  beachJourneyReducer,
  type BeachJourneyAction,
} from "./beach-journey-controller";

test("entry targets the first dynamic content scene", () => {
  const travelling = beachJourneyReducer(
    createInitialBeachJourneyState(13, false),
    { source: "button", type: "enter" },
  );

  assert.equal(travelling.phase, "travelling");
  assert.equal(travelling.currentIndex, 0);
  assert.equal(travelling.targetIndex, 1);
  assert.equal(travelling.navigationSource, "button");
});

test("threshold gate rejects direct next and previous navigation", () => {
  const threshold = createInitialBeachJourneyState(4, false);

  assert.strictEqual(
    beachJourneyReducer(threshold, { source: "button", type: "next" }),
    threshold,
  );
  assert.strictEqual(
    beachJourneyReducer(threshold, { source: "button", type: "previous" }),
    threshold,
  );
});

test("travel lock rejects navigation and reduced-motion changes", () => {
  const travelling = beachJourneyReducer(
    createInitialBeachJourneyState(13, false),
    { source: "button", type: "enter" },
  );

  assert.strictEqual(
    beachJourneyReducer(travelling, { source: "keyboard", type: "next" }),
    travelling,
  );
  assert.strictEqual(
    beachJourneyReducer(travelling, { type: "setReducedMotion", value: true }),
    travelling,
  );
});

test("fallback during entry lands immediately at the requested scene", () => {
  const travelling = beachJourneyReducer(
    createInitialBeachJourneyState(7, false),
    { source: "gesture", type: "enter" },
  );
  const fallback = beachJourneyReducer(travelling, { type: "rendererFallback" });

  assert.equal(fallback.currentIndex, 1);
  assert.equal(fallback.targetIndex, null);
  assert.equal(fallback.phase, "fallback-settled");
  assert.equal(fallback.renderMode, "fallback");
});

test("last scene navigation uses the supplied scene count", () => {
  const initial = createInitialBeachJourneyState(4, false);
  const atLastScene = { ...initial, currentIndex: 3, phase: "settled" as const };

  assert.strictEqual(
    beachJourneyReducer(atLastScene, { source: "button", type: "next" }),
    atLastScene,
  );
});

test("arrival settles at the requested scene and clears its target", () => {
  const travelling = beachJourneyReducer(
    createInitialBeachJourneyState(4, false),
    { source: "button", type: "enter" },
  );
  const settled = beachJourneyReducer(travelling, { type: "arrive" });

  assert.equal(settled.currentIndex, 1);
  assert.equal(settled.targetIndex, null);
  assert.equal(settled.phase, "settled");
  assert.strictEqual(beachJourneyReducer(settled, { type: "arrive" }), settled);
});

test("arrival ignores a synthetic target outside travel", () => {
  const settledWithTarget = {
    ...createInitialBeachJourneyState(4, false),
    currentIndex: 1,
    phase: "settled" as const,
    targetIndex: 2,
  };

  assert.strictEqual(
    beachJourneyReducer(settledWithTarget, { type: "arrive" }),
    settledWithTarget,
  );
});

test("previous travels from a settled dynamic scene", () => {
  const initial = createInitialBeachJourneyState(4, false);
  const atSecondScene = { ...initial, currentIndex: 2, phase: "settled" as const };
  const travelling = beachJourneyReducer(atSecondScene, {
    source: "keyboard",
    type: "previous",
  });

  assert.equal(travelling.targetIndex, 1);
  assert.equal(travelling.navigationSource, "keyboard");
});

test("threshold fallback keeps the threshold available for entry", () => {
  const fallback = beachJourneyReducer(createInitialBeachJourneyState(4, false), {
    type: "rendererFallback",
  });

  assert.equal(fallback.phase, "threshold");
  assert.equal(fallback.renderMode, "fallback");
  assert.equal(
    beachJourneyReducer(fallback, { source: "button", type: "enter" }).targetIndex,
    1,
  );
});

test("settled renderer fallback keeps the synchronous live-look handoff", () => {
  const settled = {
    ...createInitialBeachJourneyState(4, false),
    currentIndex: 1,
    phase: "settled" as const,
  };
  const fallback = beachJourneyReducer(settled, {
    look: { pitchDegrees: -3, yawDegrees: 17 },
    type: "rendererFallback",
  } as BeachJourneyAction);

  assert.equal(fallback.phase, "fallback-settled");
  assert.deepEqual(fallback.look, { pitchDegrees: -3, yawDegrees: 17 });
});

test("renderer fallback resets a threshold or travelling look handoff", () => {
  const threshold = beachJourneyReducer(createInitialBeachJourneyState(4, false), {
    look: { pitchDegrees: -3, yawDegrees: 17 },
    type: "rendererFallback",
  } as BeachJourneyAction);
  const travelling = beachJourneyReducer({
    ...createInitialBeachJourneyState(4, false),
    look: { pitchDegrees: 4, yawDegrees: 15 },
    phase: "travelling" as const,
    targetIndex: 1,
  }, {
    look: { pitchDegrees: -3, yawDegrees: 17 },
    type: "rendererFallback",
  } as BeachJourneyAction);

  assert.deepEqual(threshold.look, { pitchDegrees: 0, yawDegrees: 0 });
  assert.deepEqual(travelling.look, { pitchDegrees: 0, yawDegrees: 0 });
});

test("look clamps to the definition limits and reset clears it", () => {
  const initial = createInitialBeachJourneyState(4, false);
  const settled = { ...initial, phase: "settled" as const };
  const looked = beachJourneyReducer(settled, {
    pitchDegrees: -99,
    type: "look",
    yawDegrees: 99,
  });

  assert.deepEqual(looked.look, { pitchDegrees: -8, yawDegrees: 20 });
  assert.deepEqual(beachJourneyReducer(looked, { type: "resetLook" }).look, {
    pitchDegrees: 0,
    yawDegrees: 0,
  });
});

test("initialization rejects a journey without a gate and finale", () => {
  assert.throws(
    () => createInitialBeachJourneyState(1, false),
    /Beach journey requires gate and finale/,
  );
});

test("a navigation request while travelling is ignored", () => {
  const initial = createInitialBeachJourneyState(14, false);
  const travelling = beachJourneyReducer(initial, {
    source: "button",
    type: "enter",
  });
  assert.equal(travelling.phase, "travelling");
  assert.equal(travelling.targetIndex, 1);

  // A wheel flick or a second button press mid-flight must not retarget the
  // camera, or the journey would skip a checkpoint it never arrived at.
  for (const action of [
    { source: "wheel", type: "next" },
    { source: "keyboard", type: "previous" },
    { source: "gesture", type: "enter" },
  ] as const) {
    const during = beachJourneyReducer(travelling, action);
    assert.strictEqual(during, travelling);
    assert.equal(during.targetIndex, 1);
  }
});

test("arriving in fallback render mode settles into the fallback phase", () => {
  const initial = createInitialBeachJourneyState(14, false);
  const travelling = beachJourneyReducer(initial, {
    source: "button",
    type: "enter",
  });
  const fellBack = beachJourneyReducer(travelling, {
    type: "rendererFallback",
  });
  assert.equal(fellBack.renderMode, "fallback");
  assert.equal(fellBack.phase, "fallback-settled");

  const nexted = beachJourneyReducer(fellBack, {
    source: "button",
    type: "next",
  });
  assert.equal(nexted.phase, "travelling");

  // Once WebGL is gone the journey must stay on the fallback branch; settling
  // back into "settled" would hand control to the renderer that already failed.
  const arrived = beachJourneyReducer(nexted, { type: "arrive" });
  assert.equal(arrived.phase, "fallback-settled");
  assert.equal(arrived.currentIndex, 2);
  assert.equal(arrived.targetIndex, null);
});

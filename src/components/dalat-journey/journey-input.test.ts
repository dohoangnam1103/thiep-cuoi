import assert from "node:assert/strict";
import test from "node:test";

import {
  classifyJourneyGesture,
  resolveLivePointerLook,
  resolveWheelNavigation,
  resolvePointerGesture,
} from "./use-journey-input";

test("vertical gestures navigate and horizontal gestures look", () => {
  assert.deepEqual(classifyJourneyGesture(4, -72), { type: "next" });
  assert.deepEqual(classifyJourneyGesture(-5, 68), { type: "previous" });
  assert.deepEqual(classifyJourneyGesture(55, 8), {
    type: "look",
    deltaX: 55,
    deltaY: 8,
  });
  assert.deepEqual(classifyJourneyGesture(8, 9), { type: "none" });
});

test("vertical navigation honors its exact threshold", () => {
  assert.deepEqual(classifyJourneyGesture(0, -42), { type: "next" });
  assert.deepEqual(classifyJourneyGesture(0, 42), { type: "previous" });
  assert.deepEqual(classifyJourneyGesture(0, -41), { type: "none" });
  assert.deepEqual(classifyJourneyGesture(0, 41), { type: "none" });
});

test("horizontal look honors its exact threshold", () => {
  assert.deepEqual(classifyJourneyGesture(18, 0), {
    type: "look",
    deltaX: 18,
    deltaY: 0,
  });
  assert.deepEqual(classifyJourneyGesture(-30, 0), {
    type: "look",
    deltaX: -30,
    deltaY: 0,
  });
  assert.deepEqual(classifyJourneyGesture(17, 0), { type: "none" });
});

test("diagonal gestures resolve by dominant axis ratio", () => {
  assert.deepEqual(classifyJourneyGesture(10, -60), { type: "next" });
  assert.deepEqual(classifyJourneyGesture(-12, 55), { type: "previous" });
  assert.deepEqual(classifyJourneyGesture(60, 10), {
    type: "look",
    deltaX: 60,
    deltaY: 10,
  });
});

test("ties and balanced diagonals are ignored", () => {
  assert.deepEqual(classifyJourneyGesture(50, 50), { type: "none" });
  assert.deepEqual(classifyJourneyGesture(-40, 46), { type: "none" });
  assert.deepEqual(classifyJourneyGesture(0, 0), { type: "none" });
});

test("wheel navigation ignores zero delta and keeps its direction explicit", () => {
  assert.equal(resolveWheelNavigation(0), null);
  assert.equal(resolveWheelNavigation(24), "next");
  assert.equal(resolveWheelNavigation(-24), "previous");
});

test("horizontal-locked gestures stay a look with a small clamped pitch", () => {
  assert.deepEqual(resolvePointerGesture(60, 45, "horizontal"), {
    type: "look",
    deltaX: 60,
    deltaY: 10,
  });
  assert.deepEqual(resolvePointerGesture(18, -10, "horizontal"), {
    type: "look",
    deltaX: 18,
    deltaY: -10,
  });
  assert.deepEqual(resolvePointerGesture(-30, -80, "horizontal"), {
    type: "look",
    deltaX: -30,
    deltaY: -10,
  });
  assert.deepEqual(resolvePointerGesture(15, 9, "horizontal"), { type: "none" });
});

test("horizontal look emits accumulated live deltas before pointer release", () => {
  assert.equal(
    resolveLivePointerLook(12, 3, "horizontal", {
      deltaX: 0,
      deltaY: 0,
      started: false,
    }),
    null,
  );
  assert.deepEqual(
    resolveLivePointerLook(24, 4, "horizontal", {
      deltaX: 0,
      deltaY: 0,
      started: false,
    }),
    { deltaX: 24, deltaY: 4 },
  );
  assert.deepEqual(
    resolveLivePointerLook(60, 42, "horizontal", {
      deltaX: 24,
      deltaY: 4,
      started: true,
    }),
    { deltaX: 36, deltaY: 6 },
  );
  assert.equal(
    resolveLivePointerLook(60, 42, "horizontal", {
      deltaX: 60,
      deltaY: 10,
      started: true,
    }),
    null,
  );
});

test("live look never steals a vertically locked gesture", () => {
  assert.equal(
    resolveLivePointerLook(80, -30, "vertical", {
      deltaX: 0,
      deltaY: 0,
      started: false,
    }),
    null,
  );
});

test("vertical-locked small drags look pitch only and larger ones navigate", () => {
  assert.deepEqual(resolvePointerGesture(0, -30, "vertical"), {
    type: "look",
    deltaX: 0,
    deltaY: -30,
  });
  assert.deepEqual(resolvePointerGesture(0, 20, "vertical"), {
    type: "look",
    deltaX: 0,
    deltaY: 20,
  });
  assert.deepEqual(resolvePointerGesture(0, -42, "vertical"), { type: "next" });
  assert.deepEqual(resolvePointerGesture(0, 50, "vertical"), {
    type: "previous",
  });
  assert.deepEqual(resolvePointerGesture(0, -8, "vertical"), { type: "none" });
});

test("unlocked gestures fall through to the pure classifier", () => {
  assert.deepEqual(resolvePointerGesture(4, -72, "none"), { type: "next" });
  assert.deepEqual(resolvePointerGesture(-5, 68, "none"), { type: "previous" });
  assert.deepEqual(resolvePointerGesture(55, 8, "none"), {
    type: "look",
    deltaX: 55,
    deltaY: 8,
  });
  assert.deepEqual(resolvePointerGesture(8, 9, "none"), { type: "none" });
});

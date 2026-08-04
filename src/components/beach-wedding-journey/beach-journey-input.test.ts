// Copied from src/components/forest-wedding-journey/forest-journey-input.test.ts. Fixes to journey
// mechanics must be applied to both.

import assert from "node:assert/strict";
import test from "node:test";

import {
  classifyBeachJourneyGesture,
  resolveBeachPointerGesture,
  resolveBeachWheelBurstNavigation,
  resolveBeachWheelNavigation,
} from "./use-beach-journey-input";
import * as beachJourneyInput from "./use-beach-journey-input";

test("vertical gestures navigate and horizontal gestures look", () => {
  assert.deepEqual(classifyBeachJourneyGesture(4, -72), { type: "next" });
  assert.deepEqual(classifyBeachJourneyGesture(-5, 68), { type: "previous" });
  assert.deepEqual(classifyBeachJourneyGesture(55, 8), {
    deltaX: 55,
    deltaY: 8,
    type: "look",
  });
  assert.deepEqual(classifyBeachJourneyGesture(8, 9), { type: "none" });
});

test("wheel navigation has an explicit direction and ignores zero", () => {
  assert.equal(resolveBeachWheelNavigation(20), "next");
  assert.equal(resolveBeachWheelNavigation(-20), "previous");
  assert.equal(resolveBeachWheelNavigation(0), null);
});

test("wheel bursts use signed accumulated direction", () => {
  assert.equal(resolveBeachWheelBurstNavigation(80 + 30 - 1), "next");
  assert.equal(resolveBeachWheelBurstNavigation(-80 - 30 + 1), "previous");
  assert.equal(resolveBeachWheelBurstNavigation(20 - 20), null);
});

test("locked vertical intent navigates despite later horizontal drift", () => {
  assert.deepEqual(resolveBeachPointerGesture(40, -42, "vertical"), {
    type: "next",
  });
  assert.deepEqual(resolveBeachPointerGesture(-40, 42, "vertical"), {
    type: "previous",
  });
});

test("locked vertical intent preserves small pitch looks before navigation", () => {
  assert.deepEqual(resolveBeachPointerGesture(0, 9, "vertical"), {
    type: "none",
  });
  assert.deepEqual(resolveBeachPointerGesture(30, -10, "vertical"), {
    deltaX: 0,
    deltaY: -10,
    type: "look",
  });
  assert.deepEqual(resolveBeachPointerGesture(-30, 41, "vertical"), {
    deltaX: 0,
    deltaY: 41,
    type: "look",
  });
});

test("locked horizontal intent never becomes navigation", () => {
  assert.deepEqual(resolveBeachPointerGesture(90, -90, "horizontal"), {
    deltaX: 90,
    deltaY: -10,
    type: "look",
  });
});

test("the horizontal look dead zone holds until the threshold is crossed", () => {
  // Below the threshold a drag is hand tremor, not intent: emitting a look
  // there makes the camera jitter under a stationary finger.
  for (const deltaX of [0, 1, 9, 17, -17]) {
    assert.deepEqual(
      resolveBeachPointerGesture(deltaX, 0, "horizontal"),
      { type: "none" },
      `${deltaX}px must stay inside the look dead zone`,
    );
    assert.deepEqual(
      classifyBeachJourneyGesture(deltaX, 0),
      { type: "none" },
      `${deltaX}px must not classify as a look`,
    );
  }

  // At the threshold it becomes a look, and the sign is preserved.
  assert.deepEqual(resolveBeachPointerGesture(18, 0, "horizontal"), {
    deltaX: 18,
    deltaY: 0,
    type: "look",
  });
  assert.deepEqual(resolveBeachPointerGesture(-18, 0, "horizontal"), {
    deltaX: -18,
    deltaY: 0,
    type: "look",
  });
  assert.deepEqual(classifyBeachJourneyGesture(18, 0), {
    deltaX: 18,
    deltaY: 0,
    type: "look",
  });
});

test("keyboard isolation owns native controls but not a scene heading", () => {
  const predicate = "isBeachJourneyNativeControlElement" in beachJourneyInput
    ? beachJourneyInput.isBeachJourneyNativeControlElement
    : undefined;
  assert.equal(typeof predicate, "function");
  if (typeof predicate !== "function") return;

  const NativeElement = globalThis.Element;
  class TestElement {
    constructor(private readonly matchingSelector: string | null) {}

    closest(selector: string): TestElement | null {
      return this.matchingSelector && selector.includes(this.matchingSelector)
        ? this
        : null;
    }
  }
  Object.defineProperty(globalThis, "Element", {
    configurable: true,
    value: TestElement,
  });

  try {
    assert.equal(
      predicate(new TestElement("[data-beach-interactive]") as unknown as EventTarget),
      false,
    );
    assert.equal(
      predicate(new TestElement("input") as unknown as EventTarget),
      true,
    );
    assert.equal(
      predicate(new TestElement("button") as unknown as EventTarget),
      true,
    );
  } finally {
    Object.defineProperty(globalThis, "Element", {
      configurable: true,
      value: NativeElement,
    });
  }
});

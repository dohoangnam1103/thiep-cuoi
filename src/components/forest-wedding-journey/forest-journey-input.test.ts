import assert from "node:assert/strict";
import test from "node:test";

import {
  classifyForestJourneyGesture,
  resolveForestPointerGesture,
  resolveForestWheelBurstNavigation,
  resolveForestWheelNavigation,
} from "./use-forest-journey-input";
import * as forestJourneyInput from "./use-forest-journey-input";

test("vertical gestures navigate and horizontal gestures look", () => {
  assert.deepEqual(classifyForestJourneyGesture(4, -72), { type: "next" });
  assert.deepEqual(classifyForestJourneyGesture(-5, 68), { type: "previous" });
  assert.deepEqual(classifyForestJourneyGesture(55, 8), {
    deltaX: 55,
    deltaY: 8,
    type: "look",
  });
  assert.deepEqual(classifyForestJourneyGesture(8, 9), { type: "none" });
});

test("wheel navigation has an explicit direction and ignores zero", () => {
  assert.equal(resolveForestWheelNavigation(20), "next");
  assert.equal(resolveForestWheelNavigation(-20), "previous");
  assert.equal(resolveForestWheelNavigation(0), null);
});

test("wheel bursts use signed accumulated direction", () => {
  assert.equal(resolveForestWheelBurstNavigation(80 + 30 - 1), "next");
  assert.equal(resolveForestWheelBurstNavigation(-80 - 30 + 1), "previous");
  assert.equal(resolveForestWheelBurstNavigation(20 - 20), null);
});

test("locked vertical intent navigates despite later horizontal drift", () => {
  assert.deepEqual(resolveForestPointerGesture(40, -42, "vertical"), {
    type: "next",
  });
  assert.deepEqual(resolveForestPointerGesture(-40, 42, "vertical"), {
    type: "previous",
  });
});

test("locked vertical intent preserves small pitch looks before navigation", () => {
  assert.deepEqual(resolveForestPointerGesture(0, 9, "vertical"), {
    type: "none",
  });
  assert.deepEqual(resolveForestPointerGesture(30, -10, "vertical"), {
    deltaX: 0,
    deltaY: -10,
    type: "look",
  });
  assert.deepEqual(resolveForestPointerGesture(-30, 41, "vertical"), {
    deltaX: 0,
    deltaY: 41,
    type: "look",
  });
});

test("locked horizontal intent never becomes navigation", () => {
  assert.deepEqual(resolveForestPointerGesture(90, -90, "horizontal"), {
    deltaX: 90,
    deltaY: -10,
    type: "look",
  });
});

test("keyboard isolation owns native controls but not a scene heading", () => {
  const predicate = "isForestJourneyNativeControlElement" in forestJourneyInput
    ? forestJourneyInput.isForestJourneyNativeControlElement
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
      predicate(new TestElement("[data-forest-interactive]") as unknown as EventTarget),
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

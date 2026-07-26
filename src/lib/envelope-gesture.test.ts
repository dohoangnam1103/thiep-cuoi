import assert from "node:assert/strict";
import test from "node:test";

import {
  beginEnvelopePointerGesture,
  shouldOpenEnvelopeFromGesture,
  updateEnvelopePointerGesture,
  type EnvelopeButtonUv,
} from "./envelope-gesture";

const button: EnvelopeButtonUv = {
  u0: 0.35,
  u1: 0.65,
  v0: 0.08,
  v1: 0.18,
};

test("a stationary pointer on the open button opens the envelope", () => {
  const gesture = beginEnvelopePointerGesture({
    pointerId: 1,
    clientX: 100,
    clientY: 200,
    uv: { u: 0.5, v: 0.12 },
    button,
  });

  assert.equal(
    shouldOpenEnvelopeFromGesture({
      gesture,
      pointerId: 1,
      clientX: 102,
      clientY: 201,
      uv: { u: 0.51, v: 0.12 },
      button,
    }),
    true,
  );
});

test("a drag that returns near its starting point does not open the envelope", () => {
  const gesture = beginEnvelopePointerGesture({
    pointerId: 1,
    clientX: 100,
    clientY: 200,
    uv: { u: 0.5, v: 0.12 },
    button,
  });
  const draggedGesture = updateEnvelopePointerGesture(gesture, {
    pointerId: 1,
    clientX: 150,
    clientY: 200,
  });

  assert.equal(
    shouldOpenEnvelopeFromGesture({
      gesture: draggedGesture,
      pointerId: 1,
      clientX: 102,
      clientY: 200,
      uv: { u: 0.5, v: 0.12 },
      button,
    }),
    false,
  );
});

test("a gesture that starts outside the button cannot open after the card rotates underneath it", () => {
  const gesture = beginEnvelopePointerGesture({
    pointerId: 1,
    clientX: 100,
    clientY: 200,
    uv: { u: 0.2, v: 0.4 },
    button,
  });

  assert.equal(
    shouldOpenEnvelopeFromGesture({
      gesture,
      pointerId: 1,
      clientX: 100,
      clientY: 200,
      uv: { u: 0.5, v: 0.12 },
      button,
    }),
    false,
  );
});

test("a multi-pointer gesture cannot open the envelope", () => {
  const gesture = beginEnvelopePointerGesture({
    pointerId: 1,
    clientX: 100,
    clientY: 200,
    uv: { u: 0.5, v: 0.12 },
    button,
  });
  const multiPointerGesture = updateEnvelopePointerGesture(gesture, {
    pointerId: 2,
    clientX: 110,
    clientY: 205,
  });

  assert.equal(
    shouldOpenEnvelopeFromGesture({
      gesture: multiPointerGesture,
      pointerId: 1,
      clientX: 100,
      clientY: 200,
      uv: { u: 0.5, v: 0.12 },
      button,
    }),
    false,
  );
});

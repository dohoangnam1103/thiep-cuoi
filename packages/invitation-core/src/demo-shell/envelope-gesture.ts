export type EnvelopeButtonUv = {
  u0: number;
  u1: number;
  v0: number;
  v1: number;
};

export type EnvelopeUvPoint = {
  u: number;
  v: number;
};

export type EnvelopePointerGesture = {
  pointerId: number;
  startX: number;
  startY: number;
  maxMovement: number;
  startedOnButton: boolean;
  hadMultiplePointers: boolean;
};

const TAP_MOVEMENT_LIMIT_PX = 6;

function isInsideButton(point: EnvelopeUvPoint, button: EnvelopeButtonUv) {
  return (
    point.u >= button.u0 &&
    point.u <= button.u1 &&
    point.v >= button.v0 &&
    point.v <= button.v1
  );
}

export function beginEnvelopePointerGesture({
  pointerId,
  clientX,
  clientY,
  uv,
  button,
}: {
  pointerId: number;
  clientX: number;
  clientY: number;
  uv: EnvelopeUvPoint | null;
  button: EnvelopeButtonUv | null;
}): EnvelopePointerGesture {
  return {
    pointerId,
    startX: clientX,
    startY: clientY,
    maxMovement: 0,
    startedOnButton: Boolean(uv && button && isInsideButton(uv, button)),
    hadMultiplePointers: false,
  };
}

export function updateEnvelopePointerGesture(
  gesture: EnvelopePointerGesture,
  {
    pointerId,
    clientX,
    clientY,
  }: {
    pointerId: number;
    clientX: number;
    clientY: number;
  },
): EnvelopePointerGesture {
  if (pointerId !== gesture.pointerId) {
    return { ...gesture, hadMultiplePointers: true };
  }

  const movement = Math.hypot(clientX - gesture.startX, clientY - gesture.startY);
  if (movement <= gesture.maxMovement) return gesture;
  return { ...gesture, maxMovement: movement };
}

export function shouldOpenEnvelopeFromGesture({
  gesture,
  pointerId,
  clientX,
  clientY,
  uv,
  button,
}: {
  gesture: EnvelopePointerGesture | null;
  pointerId: number;
  clientX: number;
  clientY: number;
  uv: EnvelopeUvPoint | null;
  button: EnvelopeButtonUv | null;
}) {
  if (
    !gesture ||
    pointerId !== gesture.pointerId ||
    gesture.hadMultiplePointers ||
    !gesture.startedOnButton ||
    !uv ||
    !button
  ) {
    return false;
  }

  const finalGesture = updateEnvelopePointerGesture(gesture, {
    pointerId,
    clientX,
    clientY,
  });
  return (
    finalGesture.maxMovement <= TAP_MOVEMENT_LIMIT_PX &&
    isInsideButton(uv, button)
  );
}

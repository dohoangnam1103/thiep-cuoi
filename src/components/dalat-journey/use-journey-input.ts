"use client";

import { useEffect, useLayoutEffect, useRef, type RefObject } from "react";

export type JourneyGesture =
  | { type: "look"; deltaX: number; deltaY: number }
  | { type: "next" }
  | { type: "none" }
  | { type: "previous" };

const LOOK_LOCK_THRESHOLD_PX = 10;
const WHEEL_BURST_MS = 120;
const PIXELS_PER_DEGREE = 10;

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.max(minimum, Math.min(maximum, value));
}

export function classifyJourneyGesture(
  deltaX: number,
  deltaY: number,
): JourneyGesture {
  const absX = Math.abs(deltaX);
  const absY = Math.abs(deltaY);
  if (absY >= 42 && absY > absX * 1.15) {
    return { type: deltaY < 0 ? "next" : "previous" };
  }
  if (absX >= 18 && absX > absY * 1.15) {
    return { type: "look", deltaX, deltaY };
  }
  return { type: "none" };
}

export function resolveWheelNavigation(
  deltaY: number,
): "next" | "previous" | null {
  if (deltaY === 0) return null;
  return deltaY > 0 ? "next" : "previous";
}

export type JourneyInputHandlers = {
  enabled: boolean;
  onLook: (pitchDegrees: number, yawDegrees: number) => void;
  onNavigate: (gesture: "next" | "previous") => void;
};

export type PointerOrientation = "horizontal" | "none" | "vertical";

export type DispatchedPointerLook = {
  deltaX: number;
  deltaY: number;
  started: boolean;
};

export function resolveLivePointerLook(
  deltaX: number,
  deltaY: number,
  orientation: PointerOrientation,
  dispatched: DispatchedPointerLook,
): { deltaX: number; deltaY: number } | null {
  if (orientation !== "horizontal") return null;

  const clampedDeltaY = clamp(
    deltaY,
    -LOOK_LOCK_THRESHOLD_PX,
    LOOK_LOCK_THRESHOLD_PX,
  );
  if (!dispatched.started && Math.abs(deltaX) < 18) return null;

  const liveDeltaX = deltaX - dispatched.deltaX;
  const liveDeltaY = clampedDeltaY - dispatched.deltaY;
  if (liveDeltaX === 0 && liveDeltaY === 0) return null;

  return { deltaX: liveDeltaX, deltaY: liveDeltaY };
}

export function resolvePointerGesture(
  deltaX: number,
  deltaY: number,
  orientation: PointerOrientation,
): JourneyGesture {
  if (orientation === "horizontal") {
    const smallDeltaY = clamp(
      deltaY,
      -LOOK_LOCK_THRESHOLD_PX,
      LOOK_LOCK_THRESHOLD_PX,
    );
    const gesture = classifyJourneyGesture(deltaX, smallDeltaY);
    if (gesture.type === "look") {
      return { type: "look", deltaX, deltaY: smallDeltaY };
    }
    return { type: "none" };
  }

  const gesture = classifyJourneyGesture(deltaX, deltaY);
  if (
    gesture.type === "next" ||
    gesture.type === "previous" ||
    gesture.type === "look"
  ) {
    return gesture;
  }

  if (orientation === "vertical" && Math.abs(deltaY) >= LOOK_LOCK_THRESHOLD_PX) {
    return { type: "look", deltaX: 0, deltaY };
  }

  return { type: "none" };
}

type PointerSession = {
  active: boolean;
  dx: number;
  dy: number;
  look: DispatchedPointerLook;
  orientation: PointerOrientation;
  pointerId: number;
  startX: number;
  startY: number;
};

function isInteractiveTarget(target: EventTarget | null): boolean {
  if (!(target instanceof Element)) return false;
  return target.closest(
    "button, a, input, textarea, select, [tabindex]:not([tabindex='-1']), [contenteditable]:not([contenteditable='false'])",
  ) !== null;
}

export function useJourneyInput(
  stageRef: RefObject<HTMLElement | null>,
  handlers: JourneyInputHandlers,
): void {
  const handlersRef = useRef(handlers);

  useLayoutEffect(() => {
    handlersRef.current = handlers;
  });

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;

    let wheelTimer: ReturnType<typeof setTimeout> | null = null;
    let pendingWheel: "next" | "previous" | null = null;
    const session: PointerSession = {
      active: false,
      dx: 0,
      dy: 0,
      look: { deltaX: 0, deltaY: 0, started: false },
      orientation: "none",
      pointerId: -1,
      startX: 0,
      startY: 0,
    };

    const navigate = (gesture: "next" | "previous") => {
      if (!handlersRef.current.enabled) return;
      handlersRef.current.onNavigate(gesture);
    };

    const dispatchLook = (deltaX: number, deltaY: number): boolean => {
      if (!handlersRef.current.enabled) return false;
      handlersRef.current.onLook(
        -deltaY / PIXELS_PER_DEGREE,
        deltaX / PIXELS_PER_DEGREE,
      );
      return true;
    };

    const handleWheel = (event: WheelEvent) => {
      const gesture = resolveWheelNavigation(event.deltaY);
      if (
        gesture === null
        || isInteractiveTarget(event.target)
        || !handlersRef.current.enabled
      ) return;
      event.preventDefault();
      pendingWheel = gesture;
      if (wheelTimer !== null) clearTimeout(wheelTimer);
      wheelTimer = setTimeout(() => {
        wheelTimer = null;
        if (pendingWheel !== null) {
          const gesture = pendingWheel;
          pendingWheel = null;
          navigate(gesture);
        }
      }, WHEEL_BURST_MS);
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.repeat) return;
      if (isInteractiveTarget(event.target)) return;
      if (!handlersRef.current.enabled) return;
      if (event.key === "ArrowRight" || event.key === "ArrowDown") {
        event.preventDefault();
        navigate("next");
      } else if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
        event.preventDefault();
        navigate("previous");
      }
    };

    const handlePointerDown = (event: PointerEvent) => {
      if (event.pointerType === "mouse" && event.button !== 0) return;
      if (isInteractiveTarget(event.target)) return;
      if (!handlersRef.current.enabled) return;
      session.active = true;
      session.dx = 0;
      session.dy = 0;
      session.look = { deltaX: 0, deltaY: 0, started: false };
      session.orientation = "none";
      session.pointerId = event.pointerId;
      session.startX = event.clientX;
      session.startY = event.clientY;
      stage.setPointerCapture(event.pointerId);
    };

    const dispatchLiveLook = () => {
      const liveLook = resolveLivePointerLook(
        session.dx,
        session.dy,
        session.orientation,
        session.look,
      );
      if (liveLook === null) return;

      if (!dispatchLook(liveLook.deltaX, liveLook.deltaY)) return;
      session.look.deltaX += liveLook.deltaX;
      session.look.deltaY += liveLook.deltaY;
      session.look.started = true;
    };

    const updatePointerSession = (event: PointerEvent) => {
      session.dx = event.clientX - session.startX;
      session.dy = event.clientY - session.startY;
      if (session.orientation === "none") {
        if (
          Math.abs(session.dx) >= LOOK_LOCK_THRESHOLD_PX
          || Math.abs(session.dy) >= LOOK_LOCK_THRESHOLD_PX
        ) {
          session.orientation = Math.abs(session.dx) >= Math.abs(session.dy)
            ? "horizontal"
            : "vertical";
        }
      }
      dispatchLiveLook();
    };

    const handlePointerMove = (event: PointerEvent) => {
      if (!session.active || event.pointerId !== session.pointerId) return;
      updatePointerSession(event);
    };

    const finishPointer = () => {
      if (!session.active) return;
      session.active = false;
      if (session.orientation === "horizontal") {
        dispatchLiveLook();
        return;
      }

      const gesture = resolvePointerGesture(
        session.dx,
        session.dy,
        session.orientation,
      );
      if (gesture.type === "next") {
        navigate("next");
      } else if (gesture.type === "previous") {
        navigate("previous");
      } else if (gesture.type === "look") {
        dispatchLook(gesture.deltaX, gesture.deltaY);
      }
    };

    const handlePointerUp = (event: PointerEvent) => {
      if (!session.active || event.pointerId !== session.pointerId) return;
      updatePointerSession(event);
      if (stage.hasPointerCapture(event.pointerId)) {
        stage.releasePointerCapture(event.pointerId);
      }
      finishPointer();
    };

    const handlePointerCancel = (event: PointerEvent) => {
      if (!session.active || event.pointerId !== session.pointerId) return;
      if (stage.hasPointerCapture(event.pointerId)) {
        stage.releasePointerCapture(event.pointerId);
      }
      session.active = false;
    };

    stage.addEventListener("wheel", handleWheel, { passive: false });
    stage.addEventListener("pointerdown", handlePointerDown);
    stage.addEventListener("pointermove", handlePointerMove);
    stage.addEventListener("pointerup", handlePointerUp);
    stage.addEventListener("pointercancel", handlePointerCancel);
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      if (wheelTimer !== null) clearTimeout(wheelTimer);
      stage.removeEventListener("wheel", handleWheel);
      stage.removeEventListener("pointerdown", handlePointerDown);
      stage.removeEventListener("pointermove", handlePointerMove);
      stage.removeEventListener("pointerup", handlePointerUp);
      stage.removeEventListener("pointercancel", handlePointerCancel);
      window.removeEventListener("keydown", handleKeyDown);
      if (session.active && stage.hasPointerCapture(session.pointerId)) {
        stage.releasePointerCapture(session.pointerId);
      }
    };
  }, [stageRef]);
}

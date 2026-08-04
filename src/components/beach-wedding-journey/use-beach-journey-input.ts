"use client";

// Copied from src/components/forest-wedding-journey/use-forest-journey-input.ts. Fixes to journey
// mechanics must be applied to both.

import { useEffect, useLayoutEffect, useRef, type RefObject } from "react";

import type { BeachNavigationSource } from "./beach-journey-controller";

const LOOK_LOCK_THRESHOLD_PX = 10;
const NAVIGATION_THRESHOLD_PX = 42;
const LOOK_THRESHOLD_PX = 18;
const PIXELS_PER_DEGREE = 10;
const WHEEL_BURST_MS = 120;

export type BeachJourneyGesture =
  | { deltaX: number; deltaY: number; type: "look" }
  | { type: "next" }
  | { type: "none" }
  | { type: "previous" };

export type BeachJourneyInputHandlers = {
  enabled: boolean;
  onLook: (pitchDeltaDegrees: number, yawDeltaDegrees: number) => void;
  onNavigate: (
    direction: "next" | "previous",
    source: BeachNavigationSource,
  ) => void;
};

export type BeachPointerOrientation = "horizontal" | "none" | "vertical";

type PointerSession = {
  active: boolean;
  appliedLookDeltaX: number;
  appliedLookDeltaY: number;
  deltaX: number;
  deltaY: number;
  hasStartedLook: boolean;
  orientation: BeachPointerOrientation;
  pointerId: number;
  startX: number;
  startY: number;
};

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.max(minimum, Math.min(maximum, value));
}

export function classifyBeachJourneyGesture(
  deltaX: number,
  deltaY: number,
): BeachJourneyGesture {
  const absoluteX = Math.abs(deltaX);
  const absoluteY = Math.abs(deltaY);

  if (
    absoluteY >= NAVIGATION_THRESHOLD_PX &&
    absoluteY > absoluteX * 1.15
  ) {
    return { type: deltaY < 0 ? "next" : "previous" };
  }

  if (absoluteX >= LOOK_THRESHOLD_PX && absoluteX > absoluteY * 1.15) {
    return { deltaX, deltaY, type: "look" };
  }

  return { type: "none" };
}

export function resolveBeachWheelNavigation(
  deltaY: number,
): "next" | "previous" | null {
  if (deltaY === 0) {
    return null;
  }

  return deltaY > 0 ? "next" : "previous";
}

export function resolveBeachWheelBurstNavigation(
  totalDeltaY: number,
): "next" | "previous" | null {
  return resolveBeachWheelNavigation(totalDeltaY);
}

export function resolveBeachPointerGesture(
  deltaX: number,
  deltaY: number,
  orientation: BeachPointerOrientation,
): BeachJourneyGesture {
  if (orientation === "vertical") {
    const absoluteDeltaY = Math.abs(deltaY);
    if (absoluteDeltaY >= NAVIGATION_THRESHOLD_PX) {
      return { type: deltaY < 0 ? "next" : "previous" };
    }

    if (absoluteDeltaY >= LOOK_LOCK_THRESHOLD_PX) {
      return { deltaX: 0, deltaY, type: "look" };
    }

    return { type: "none" };
  }

  if (orientation === "horizontal") {
    if (Math.abs(deltaX) < LOOK_THRESHOLD_PX) {
      return { type: "none" };
    }

    return {
      deltaX,
      deltaY: clamp(deltaY, -LOOK_LOCK_THRESHOLD_PX, LOOK_LOCK_THRESHOLD_PX),
      type: "look",
    };
  }

  return classifyBeachJourneyGesture(deltaX, deltaY);
}

export function isBeachJourneyInteractiveElement(target: EventTarget | null): boolean {
  if (typeof Element === "undefined" || !(target instanceof Element)) {
    return false;
  }

  return target.closest(
    "button, a, input, textarea, select, [contenteditable], [data-beach-interactive]",
  ) !== null;
}

export function isBeachJourneyNativeControlElement(
  target: EventTarget | null,
): boolean {
  if (typeof Element === "undefined" || !(target instanceof Element)) {
    return false;
  }

  return target.closest(
    "button, a, input, textarea, select, option, summary, [contenteditable]",
  ) !== null;
}

function releasePointerCapture(stage: HTMLElement, pointerId: number): void {
  try {
    if (stage.hasPointerCapture(pointerId)) {
      stage.releasePointerCapture(pointerId);
    }
  } catch {
    // A browser may release capture automatically before a cancel or unmount.
  }
}

export function useBeachJourneyInput(
  stageRef: RefObject<HTMLElement | null>,
  handlers: BeachJourneyInputHandlers,
): void {
  const handlersRef = useRef(handlers);

  useLayoutEffect(() => {
    handlersRef.current = handlers;
  });

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) {
      return;
    }

    let wheelTimer: ReturnType<typeof setTimeout> | null = null;
    let wheelDeltaY = 0;
    const session: PointerSession = {
      active: false,
      appliedLookDeltaX: 0,
      appliedLookDeltaY: 0,
      deltaX: 0,
      deltaY: 0,
      hasStartedLook: false,
      orientation: "none",
      pointerId: -1,
      startX: 0,
      startY: 0,
    };

    const navigate = (direction: "next" | "previous", source: BeachNavigationSource) => {
      if (handlersRef.current.enabled) {
        handlersRef.current.onNavigate(direction, source);
      }
    };

    const dispatchLiveLook = () => {
      if (session.orientation !== "horizontal" || !handlersRef.current.enabled) {
        return;
      }
      if (!session.hasStartedLook && Math.abs(session.deltaX) < LOOK_THRESHOLD_PX) {
        return;
      }

      const limitedDeltaY = clamp(
        session.deltaY,
        -LOOK_LOCK_THRESHOLD_PX,
        LOOK_LOCK_THRESHOLD_PX,
      );
      const deltaX = session.deltaX - session.appliedLookDeltaX;
      const deltaY = limitedDeltaY - session.appliedLookDeltaY;
      if (deltaX === 0 && deltaY === 0) {
        return;
      }

      handlersRef.current.onLook(
        -deltaY / PIXELS_PER_DEGREE,
        deltaX / PIXELS_PER_DEGREE,
      );
      session.appliedLookDeltaX += deltaX;
      session.appliedLookDeltaY += deltaY;
      session.hasStartedLook = true;
    };

    const dispatchVerticalLook = (deltaY: number) => {
      if (!handlersRef.current.enabled) {
        return;
      }

      handlersRef.current.onLook(-deltaY / PIXELS_PER_DEGREE, 0);
    };

    const updatePointerSession = (event: PointerEvent) => {
      session.deltaX = event.clientX - session.startX;
      session.deltaY = event.clientY - session.startY;

      if (
        session.orientation === "none" &&
        (Math.abs(session.deltaX) >= LOOK_LOCK_THRESHOLD_PX ||
          Math.abs(session.deltaY) >= LOOK_LOCK_THRESHOLD_PX)
      ) {
        session.orientation =
          Math.abs(session.deltaX) >= Math.abs(session.deltaY)
            ? "horizontal"
            : "vertical";
      }

      dispatchLiveLook();
    };

    const handleWheel = (event: WheelEvent) => {
      if (
        event.deltaY === 0 ||
        !handlersRef.current.enabled ||
        isBeachJourneyInteractiveElement(event.target)
      ) {
        return;
      }

      event.preventDefault();
      wheelDeltaY += event.deltaY;
      if (wheelTimer !== null) {
        clearTimeout(wheelTimer);
      }
      wheelTimer = setTimeout(() => {
        wheelTimer = null;
        const navigation = resolveBeachWheelBurstNavigation(wheelDeltaY);
        wheelDeltaY = 0;
        if (navigation !== null) {
          navigate(navigation, "wheel");
        }
      }, WHEEL_BURST_MS);
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (
        event.repeat ||
        !handlersRef.current.enabled ||
        isBeachJourneyNativeControlElement(event.target)
      ) {
        return;
      }

      if (event.key === "ArrowDown" || event.key === "ArrowRight") {
        event.preventDefault();
        navigate("next", "keyboard");
      } else if (event.key === "ArrowUp" || event.key === "ArrowLeft") {
        event.preventDefault();
        navigate("previous", "keyboard");
      }
    };

    const handlePointerDown = (event: PointerEvent) => {
      if (
        session.active ||
        !event.isPrimary ||
        (event.pointerType === "mouse" && event.button !== 0) ||
        !handlersRef.current.enabled ||
        isBeachJourneyInteractiveElement(event.target)
      ) {
        return;
      }

      session.active = true;
      session.appliedLookDeltaX = 0;
      session.appliedLookDeltaY = 0;
      session.deltaX = 0;
      session.deltaY = 0;
      session.hasStartedLook = false;
      session.orientation = "none";
      session.pointerId = event.pointerId;
      session.startX = event.clientX;
      session.startY = event.clientY;

      try {
        stage.setPointerCapture(event.pointerId);
      } catch {
        // Capture can fail when a browser has already retired the pointer.
      }
    };

    const handlePointerMove = (event: PointerEvent) => {
      if (!session.active || event.pointerId !== session.pointerId) {
        return;
      }

      updatePointerSession(event);
    };

    const finishPointerSession = () => {
      if (!session.active) {
        return;
      }

      session.active = false;
      const gesture = resolveBeachPointerGesture(
        session.deltaX,
        session.deltaY,
        session.orientation,
      );
      if (gesture.type === "look") {
        if (session.orientation === "vertical") {
          dispatchVerticalLook(gesture.deltaY);
        } else {
          dispatchLiveLook();
        }
        return;
      }

      if (gesture.type === "next" || gesture.type === "previous") {
        navigate(gesture.type, "gesture");
      }
    };

    const handlePointerUp = (event: PointerEvent) => {
      if (!session.active || event.pointerId !== session.pointerId) {
        return;
      }

      updatePointerSession(event);
      releasePointerCapture(stage, event.pointerId);
      finishPointerSession();
    };

    const handlePointerCancel = (event: PointerEvent) => {
      if (!session.active || event.pointerId !== session.pointerId) {
        return;
      }

      releasePointerCapture(stage, event.pointerId);
      session.active = false;
    };

    stage.addEventListener("wheel", handleWheel, { passive: false });
    stage.addEventListener("pointerdown", handlePointerDown);
    stage.addEventListener("pointermove", handlePointerMove);
    stage.addEventListener("pointerup", handlePointerUp);
    stage.addEventListener("pointercancel", handlePointerCancel);
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      if (wheelTimer !== null) {
        clearTimeout(wheelTimer);
      }
      wheelDeltaY = 0;
      stage.removeEventListener("wheel", handleWheel);
      stage.removeEventListener("pointerdown", handlePointerDown);
      stage.removeEventListener("pointermove", handlePointerMove);
      stage.removeEventListener("pointerup", handlePointerUp);
      stage.removeEventListener("pointercancel", handlePointerCancel);
      window.removeEventListener("keydown", handleKeyDown);
      if (session.active) {
        releasePointerCapture(stage, session.pointerId);
      }
    };
  }, [stageRef]);
}

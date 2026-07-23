"use client";

import { Minus, Plus, RotateCcw } from "lucide-react";
import {
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
  type WheelEvent,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";

const MIN_SCALE = 1;
const MAX_SCALE = 5;
const BUTTON_ZOOM_STEP = 0.5;

type Point = {
  pointerType: string;
  x: number;
  y: number;
};

type Pan = {
  x: number;
  y: number;
};

type SwipeGesture = {
  kind: "swipe";
  pointerId: number;
  startX: number;
  startY: number;
  dragging: boolean;
};

type PanGesture = {
  kind: "pan";
  pointerId: number;
  startX: number;
  startY: number;
  startPan: Pan;
};

type PinchGesture = {
  kind: "pinch";
  pointerIds: [number, number];
  startDistance: number;
  startMidpoint: Pan;
  startPan: Pan;
  startScale: number;
};

type Gesture = SwipeGesture | PanGesture | PinchGesture;

export type LightboxZoomLabels = {
  zoomIn: string;
  zoomOut: string;
  resetZoom: string;
};

export const VI_LIGHTBOX_ZOOM_LABELS: LightboxZoomLabels = {
  zoomIn: "Phóng to",
  zoomOut: "Thu nhỏ",
  resetZoom: "Đặt lại mức thu phóng",
};

type UseLightboxZoomOptions = {
  enabled: boolean;
  onSwipe: (direction: -1 | 1) => void;
  swipeThreshold?: number;
};

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function distance(a: Point, b: Point): number {
  return Math.hypot(b.x - a.x, b.y - a.y);
}

function midpoint(a: Point, b: Point): Pan {
  return {
    x: (a.x + b.x) / 2,
    y: (a.y + b.y) / 2,
  };
}

export function useLightboxZoom({
  enabled,
  onSwipe,
  swipeThreshold = 60,
}: UseLightboxZoomOptions) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const pointersRef = useRef(new Map<number, Point>());
  const gestureRef = useRef<Gesture | null>(null);
  const onSwipeRef = useRef(onSwipe);
  const scaleRef = useRef(MIN_SCALE);
  const panRef = useRef<Pan>({ x: 0, y: 0 });
  const [scale, setScale] = useState(MIN_SCALE);
  const [pan, setPan] = useState<Pan>({ x: 0, y: 0 });
  const [imageAnimating, setImageAnimating] = useState(false);
  const [trackDrag, setTrackDrag] = useState(0);
  const [trackAnimating, setTrackAnimating] = useState(true);

  useLayoutEffect(() => {
    onSwipeRef.current = onSwipe;
  }, [onSwipe]);

  const clampPan = useCallback((candidate: Pan, nextScale: number): Pan => {
    const viewport = viewportRef.current;
    const image = imageRef.current;
    if (!viewport || !image || nextScale <= MIN_SCALE) return { x: 0, y: 0 };

    const containRatio = image.naturalWidth > 0 && image.naturalHeight > 0
      ? Math.min(
          image.clientWidth / image.naturalWidth,
          image.clientHeight / image.naturalHeight,
        )
      : 1;
    const visibleWidth = image.naturalWidth > 0
      ? image.naturalWidth * containRatio
      : image.clientWidth;
    const visibleHeight = image.naturalHeight > 0
      ? image.naturalHeight * containRatio
      : image.clientHeight;
    const maxX = Math.max(0, (visibleWidth * nextScale - viewport.clientWidth) / 2);
    const maxY = Math.max(0, (visibleHeight * nextScale - viewport.clientHeight) / 2);
    return {
      x: clamp(candidate.x, -maxX, maxX),
      y: clamp(candidate.y, -maxY, maxY),
    };
  }, []);

  const commitTransform = useCallback((
    nextScaleValue: number,
    nextPanValue: Pan,
    animate: boolean,
  ) => {
    const nextScale = clamp(nextScaleValue, MIN_SCALE, MAX_SCALE);
    const nextPan = clampPan(nextPanValue, nextScale);
    scaleRef.current = nextScale;
    panRef.current = nextPan;
    setScale(nextScale);
    setPan(nextPan);
    setImageAnimating(animate);
  }, [clampPan]);

  const resetZoom = useCallback((animate = true) => {
    pointersRef.current.clear();
    gestureRef.current = null;
    setTrackDrag(0);
    setTrackAnimating(true);
    commitTransform(MIN_SCALE, { x: 0, y: 0 }, animate);
  }, [commitTransform]);

  const zoomAt = useCallback((
    nextScaleValue: number,
    clientPoint?: Pan,
    animate = true,
  ) => {
    if (!enabled) return;
    const currentScale = scaleRef.current;
    const nextScale = clamp(nextScaleValue, MIN_SCALE, MAX_SCALE);
    if (Math.abs(nextScale - currentScale) < 0.001) return;

    const viewportRect = viewportRef.current?.getBoundingClientRect();
    const anchor = clientPoint && viewportRect
      ? {
          x: clientPoint.x - (viewportRect.left + viewportRect.width / 2),
          y: clientPoint.y - (viewportRect.top + viewportRect.height / 2),
        }
      : { x: 0, y: 0 };
    const ratio = nextScale / currentScale;
    const currentPan = panRef.current;
    commitTransform(
      nextScale,
      {
        x: anchor.x - (anchor.x - currentPan.x) * ratio,
        y: anchor.y - (anchor.y - currentPan.y) * ratio,
      },
      animate,
    );
  }, [commitTransform, enabled]);

  const zoomIn = useCallback(() => {
    zoomAt(scaleRef.current + BUTTON_ZOOM_STEP);
  }, [zoomAt]);

  const zoomOut = useCallback(() => {
    zoomAt(scaleRef.current - BUTTON_ZOOM_STEP);
  }, [zoomAt]);

  const startPinch = useCallback(() => {
    const touches = [...pointersRef.current.entries()]
      .filter(([, point]) => point.pointerType === "touch")
      .slice(0, 2);
    if (!enabled || touches.length < 2) return false;

    const [[firstId, first], [secondId, second]] = touches;
    gestureRef.current = {
      kind: "pinch",
      pointerIds: [firstId, secondId],
      startDistance: Math.max(1, distance(first, second)),
      startMidpoint: midpoint(first, second),
      startPan: panRef.current,
      startScale: scaleRef.current,
    };
    setTrackDrag(0);
    setTrackAnimating(true);
    setImageAnimating(false);
    return true;
  }, [enabled]);

  const onPointerDown = useCallback((event: ReactPointerEvent<HTMLElement>) => {
    if (event.pointerType === "mouse" && event.button !== 0) return;

    try {
      event.currentTarget.setPointerCapture(event.pointerId);
    } catch {
      // Synthetic browser tests do not create a native pointer capture session.
    }

    pointersRef.current.set(event.pointerId, {
      pointerType: event.pointerType,
      x: event.clientX,
      y: event.clientY,
    });

    if (startPinch()) {
      event.preventDefault();
      return;
    }

    setImageAnimating(false);
    if (enabled && scaleRef.current > MIN_SCALE) {
      gestureRef.current = {
        kind: "pan",
        pointerId: event.pointerId,
        startX: event.clientX,
        startY: event.clientY,
        startPan: panRef.current,
      };
      event.preventDefault();
      return;
    }

    gestureRef.current = {
      kind: "swipe",
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      dragging: false,
    };
    setTrackDrag(0);
    setTrackAnimating(false);
  }, [enabled, startPinch]);

  const onPointerMove = useCallback((event: ReactPointerEvent<HTMLElement>) => {
    if (!pointersRef.current.has(event.pointerId)) return;
    pointersRef.current.set(event.pointerId, {
      pointerType: event.pointerType,
      x: event.clientX,
      y: event.clientY,
    });

    if (gestureRef.current?.kind === "pinch" || startPinch()) {
      const pinch = gestureRef.current;
      if (!pinch || pinch.kind !== "pinch") return;
      const first = pointersRef.current.get(pinch.pointerIds[0]);
      const second = pointersRef.current.get(pinch.pointerIds[1]);
      if (!first || !second) return;

      const nextMidpoint = midpoint(first, second);
      const nextScale = clamp(
        pinch.startScale * distance(first, second) / pinch.startDistance,
        MIN_SCALE,
        MAX_SCALE,
      );
      const viewportRect = viewportRef.current?.getBoundingClientRect();
      const viewportCenter = viewportRect
        ? {
            x: viewportRect.left + viewportRect.width / 2,
            y: viewportRect.top + viewportRect.height / 2,
          }
        : { x: 0, y: 0 };
      const startAnchor = {
        x: pinch.startMidpoint.x - viewportCenter.x,
        y: pinch.startMidpoint.y - viewportCenter.y,
      };
      const nextAnchor = {
        x: nextMidpoint.x - viewportCenter.x,
        y: nextMidpoint.y - viewportCenter.y,
      };
      const imagePoint = {
        x: (startAnchor.x - pinch.startPan.x) / pinch.startScale,
        y: (startAnchor.y - pinch.startPan.y) / pinch.startScale,
      };
      commitTransform(
        nextScale,
        {
          x: nextAnchor.x - imagePoint.x * nextScale,
          y: nextAnchor.y - imagePoint.y * nextScale,
        },
        false,
      );
      event.preventDefault();
      return;
    }

    const gesture = gestureRef.current;
    if (!gesture) return;

    if (gesture.kind === "pan" && gesture.pointerId === event.pointerId) {
      commitTransform(
        scaleRef.current,
        {
          x: gesture.startPan.x + event.clientX - gesture.startX,
          y: gesture.startPan.y + event.clientY - gesture.startY,
        },
        false,
      );
      event.preventDefault();
      return;
    }

    if (gesture.kind === "swipe" && gesture.pointerId === event.pointerId) {
      const dx = event.clientX - gesture.startX;
      const dy = event.clientY - gesture.startY;
      if (!gesture.dragging && Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 8) {
        gesture.dragging = true;
      }
      if (gesture.dragging) {
        setTrackDrag(dx);
        event.preventDefault();
      }
    }
  }, [commitTransform, startPinch]);

  const finishPointer = useCallback((
    event: ReactPointerEvent<HTMLElement>,
    cancelled: boolean,
  ) => {
    const gesture = gestureRef.current;
    pointersRef.current.delete(event.pointerId);

    try {
      if (event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId);
      }
    } catch {
      // See the matching setPointerCapture fallback above.
    }

    if (gesture?.kind === "pinch") {
      const remaining = [...pointersRef.current.entries()][0];
      if (remaining && scaleRef.current > MIN_SCALE) {
        const [pointerId, point] = remaining;
        gestureRef.current = {
          kind: "pan",
          pointerId,
          startX: point.x,
          startY: point.y,
          startPan: panRef.current,
        };
      } else {
        gestureRef.current = null;
        if (scaleRef.current <= MIN_SCALE) resetZoom();
      }
      return;
    }

    if (gesture?.kind === "pan" && gesture.pointerId === event.pointerId) {
      gestureRef.current = null;
      return;
    }

    if (gesture?.kind === "swipe" && gesture.pointerId === event.pointerId) {
      const dx = event.clientX - gesture.startX;
      gestureRef.current = null;
      setTrackAnimating(true);
      setTrackDrag(0);
      if (!cancelled && gesture.dragging && Math.abs(dx) > swipeThreshold) {
        resetZoom(false);
        onSwipeRef.current(dx < 0 ? 1 : -1);
      }
    }

    if (pointersRef.current.size === 0) gestureRef.current = null;
  }, [resetZoom, swipeThreshold]);

  const onPointerUp = useCallback((event: ReactPointerEvent<HTMLElement>) => {
    finishPointer(event, false);
  }, [finishPointer]);

  const onPointerCancel = useCallback((event: ReactPointerEvent<HTMLElement>) => {
    finishPointer(event, true);
  }, [finishPointer]);

  const onWheel = useCallback((event: WheelEvent<HTMLElement>) => {
    if (!enabled || event.deltaY === 0) return;
    event.preventDefault();
    const factor = event.deltaY < 0 ? 1.18 : 1 / 1.18;
    zoomAt(
      scaleRef.current * factor,
      { x: event.clientX, y: event.clientY },
      false,
    );
  }, [enabled, zoomAt]);

  const onDoubleClick = useCallback((event: ReactPointerEvent<HTMLImageElement>) => {
    if (!enabled) return;
    event.preventDefault();
    event.stopPropagation();
    if (scaleRef.current > MIN_SCALE + 0.01) {
      resetZoom();
    } else {
      zoomAt(2, { x: event.clientX, y: event.clientY });
    }
  }, [enabled, resetZoom, zoomAt]);

  useEffect(() => {
    if (!enabled) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "+" || event.key === "=") {
        event.preventDefault();
        zoomIn();
      } else if (event.key === "-") {
        event.preventDefault();
        zoomOut();
      } else if (event.key === "0") {
        event.preventDefault();
        resetZoom();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [enabled, resetZoom, zoomIn, zoomOut]);

  const imageStyle: CSSProperties = {
    cursor: scale > MIN_SCALE ? "grab" : "zoom-in",
    transform: `translate3d(${pan.x}px, ${pan.y}px, 0) scale(${scale})`,
    transformOrigin: "center center",
    transition: imageAnimating ? "transform 180ms ease-out" : "none",
    willChange: "transform",
  };

  return {
    imageRef,
    imageStyle,
    onDoubleClick,
    onPointerCancel,
    onPointerDown,
    onPointerMove,
    onPointerUp,
    onWheel,
    resetZoom,
    scale,
    trackAnimating,
    trackDrag,
    viewportRef,
    zoomIn,
    zoomOut,
  };
}

export function LightboxZoomControls({
  className = "",
  labels,
  resetZoom,
  scale,
  testIdPrefix,
  zoomIn,
  zoomOut,
}: {
  className?: string;
  labels: LightboxZoomLabels;
  resetZoom: () => void;
  scale: number;
  testIdPrefix: string;
  zoomIn: () => void;
  zoomOut: () => void;
}) {
  const percentage = Math.round(scale * 100);

  return (
    <div
      className={`flex items-center gap-1 rounded-full bg-black/55 p-1 text-white shadow-lg backdrop-blur-md ${className}`}
      onClick={(event) => event.stopPropagation()}
      onPointerDown={(event) => event.stopPropagation()}
    >
      <button
        type="button"
        data-testid={`${testIdPrefix}-zoom-out`}
        aria-label={labels.zoomOut}
        disabled={scale <= MIN_SCALE}
        onClick={zoomOut}
        className="grid size-10 place-items-center rounded-full transition hover:bg-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white disabled:cursor-not-allowed disabled:opacity-35"
      >
        <Minus className="size-4" aria-hidden />
      </button>
      <button
        type="button"
        data-testid={`${testIdPrefix}-zoom-reset`}
        aria-label={`${labels.resetZoom}: ${percentage}%`}
        disabled={scale <= MIN_SCALE}
        onClick={resetZoom}
        className="flex h-10 min-w-14 items-center justify-center gap-1 rounded-full px-2 text-xs font-semibold tabular-nums transition hover:bg-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white disabled:cursor-default disabled:opacity-65"
      >
        {scale > MIN_SCALE ? <RotateCcw className="size-3.5" aria-hidden /> : null}
        {percentage}%
      </button>
      <button
        type="button"
        data-testid={`${testIdPrefix}-zoom-in`}
        aria-label={labels.zoomIn}
        disabled={scale >= MAX_SCALE}
        onClick={zoomIn}
        className="grid size-10 place-items-center rounded-full transition hover:bg-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white disabled:cursor-not-allowed disabled:opacity-35"
      >
        <Plus className="size-4" aria-hidden />
      </button>
    </div>
  );
}

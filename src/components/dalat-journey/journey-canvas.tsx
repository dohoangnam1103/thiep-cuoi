"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import {
  Component,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type MutableRefObject,
  type ReactNode,
  type RefObject,
} from "react";

import {
  dalatJourneyDefinition,
  type DalatJourneyCopy,
} from "@/data/dalat-journey";

import {
  DalatMistWorld,
  getDalatWorldDensity,
  type DalatWorldBaseTier,
  type DalatWorldDensity,
  type DalatWorldQualityTier,
  type JourneyCueState,
} from "./dalat-mist-world";
import {
  JourneyCamera,
  type JourneyInvalidateBridge,
} from "./journey-camera";
import { DalatArtworkBackdrop } from "./dalat-backdrop";
import type { JourneyPhase } from "./journey-controller";

const MOBILE_QUERY = "(max-width: 767px)";

function subscribeToMobileViewport(onStoreChange: () => void): () => void {
  const mediaQuery = window.matchMedia(MOBILE_QUERY);
  mediaQuery.addEventListener("change", onStoreChange);
  return () => mediaQuery.removeEventListener("change", onStoreChange);
}

function mobileViewportSnapshot(): boolean {
  return window.matchMedia(MOBILE_QUERY).matches;
}

function serverMobileViewportSnapshot(): boolean {
  return false;
}

function useMobileViewport(): boolean {
  return useSyncExternalStore(
    subscribeToMobileViewport,
    mobileViewportSnapshot,
    serverMobileViewportSnapshot,
  );
}

function supportsJourneyWebgl(): boolean {
  try {
    const canvas = document.createElement("canvas");
    const webgl2 = canvas.getContext("webgl2");
    if (webgl2) {
      webgl2.getExtension("WEBGL_lose_context")?.loseContext();
      return true;
    }

    const webgl1 = canvas.getContext("webgl");
    webgl1?.getExtension("WEBGL_lose_context")?.loseContext();
    return false;
  } catch {
    return false;
  }
}

export type JourneyQualityTier = DalatWorldQualityTier;

export type JourneyCanvasProps = {
  copy: DalatJourneyCopy;
  currentIndex: number;
  look: { pitchDegrees: number; yawDegrees: number };
  lookRef: MutableRefObject<{ pitchDegrees: number; yawDegrees: number }>;
  onArrive: () => void;
  onInvalidateReady: (invalidate: (() => void) | null) => void;
  onReady: () => void;
  onUnavailable: () => void;
  phase: JourneyPhase;
  reducedMotion: boolean;
  targetIndex: number | null;
};

type JourneyCanvasBoundaryProps = {
  children: ReactNode;
  onError: () => void;
};

type JourneyCanvasBoundaryState = {
  failed: boolean;
};

class JourneyCanvasBoundary extends Component<
  JourneyCanvasBoundaryProps,
  JourneyCanvasBoundaryState
> {
  state: JourneyCanvasBoundaryState = { failed: false };

  static getDerivedStateFromError(): JourneyCanvasBoundaryState {
    return { failed: true };
  }

  componentDidCatch() {
    this.props.onError();
  }

  render() {
    return this.state.failed ? null : this.props.children;
  }
}

type JourneyRuntimeBridgeProps = Pick<
  JourneyCanvasProps,
  "onInvalidateReady" | "onReady"
> & {
  invalidateBridgeRef: JourneyInvalidateBridge;
  reportUnavailable: () => void;
};

function JourneyRuntimeBridge({
  invalidateBridgeRef,
  onInvalidateReady,
  onReady,
  reportUnavailable,
}: JourneyRuntimeBridgeProps) {
  const { gl, invalidate } = useThree();
  const readyFrameRef = useRef<number | null>(null);
  const readyReportedRef = useRef(false);

  useFrame(() => {
    if (readyReportedRef.current) return;
    readyReportedRef.current = true;
    readyFrameRef.current = window.requestAnimationFrame(() => {
      readyFrameRef.current = null;
      onReady();
    });
  });

  useEffect(() => {
    invalidateBridgeRef.current = invalidate;
    onInvalidateReady(invalidate);
    invalidate();

    return () => {
      if (readyFrameRef.current !== null) {
        window.cancelAnimationFrame(readyFrameRef.current);
        readyFrameRef.current = null;
      }
      if (invalidateBridgeRef.current === invalidate) {
        invalidateBridgeRef.current = null;
      }
      onInvalidateReady(null);
    };
  }, [invalidate, invalidateBridgeRef, onInvalidateReady]);

  useEffect(() => {
    const canvas = gl.domElement;
    const handleContextLost = (event: Event) => {
      event.preventDefault();
      reportUnavailable();
    };

    canvas.addEventListener("webglcontextlost", handleContextLost);
    return () => {
      canvas.removeEventListener("webglcontextlost", handleContextLost);
    };
  }, [gl, reportUnavailable]);

  return null;
}

type JourneyAmbientInvalidationProps = {
  active: boolean;
  frameIntervalMs: number;
};

function JourneyAmbientInvalidation({
  active,
  frameIntervalMs,
}: JourneyAmbientInvalidationProps) {
  const { invalidate } = useThree();

  useEffect(() => {
    if (!active) return;

    let animationFrameId: number | null = null;
    let previousInvalidationAt: number | null = null;

    const schedule = () => {
      if (animationFrameId === null && document.visibilityState === "visible") {
        animationFrameId = window.requestAnimationFrame(tick);
      }
    };

    const tick = (timestamp: number) => {
      animationFrameId = null;
      if (document.visibilityState !== "visible") return;

      if (
        previousInvalidationAt === null
        || frameIntervalMs === 0
        || timestamp - previousInvalidationAt >= frameIntervalMs
      ) {
        previousInvalidationAt = timestamp;
        invalidate();
      }
      schedule();
    };

    const handleVisibilityChange = () => {
      previousInvalidationAt = null;
      if (document.visibilityState !== "visible") {
        if (animationFrameId !== null) {
          window.cancelAnimationFrame(animationFrameId);
          animationFrameId = null;
        }
        return;
      }
      schedule();
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    schedule();

    return () => {
      if (animationFrameId !== null) {
        window.cancelAnimationFrame(animationFrameId);
      }
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [active, frameIntervalMs, invalidate]);

  return null;
}

function getAmbientFrameIntervalMs(
  isMobile: boolean,
  qualityTier: JourneyQualityTier,
): number {
  if (qualityTier === "reduced") return 1_000 / 20;
  if (isMobile) return 1_000 / 30;
  return 0;
}

export function JourneyCanvas({
  copy,
  currentIndex,
  look,
  lookRef,
  onArrive,
  onInvalidateReady,
  onReady,
  onUnavailable,
  phase,
  reducedMotion,
  targetIndex,
}: JourneyCanvasProps) {
  const isMobile = useMobileViewport();
  const [supported] = useState(() => supportsJourneyWebgl());
  const [adaptivelyReduced, setAdaptivelyReduced] = useState(false);
  const [runtimeReady, setRuntimeReady] = useState(false);
  const [worldReady, setWorldReady] = useState(false);
  const unavailableReportedRef = useRef(false);
  const readyReportedRef = useRef(false);
  const diagnosticsRef = useRef<HTMLDivElement>(null);
  const invalidateBridgeRef = useRef<(() => void) | null>(null);
  const cueRef = useRef<JourneyCueState>({
    glow: 0,
    mistOpen: 0,
    sceneTime: 0,
    travelProgress: 1,
  });

  const reportUnavailable = useCallback(() => {
    if (unavailableReportedRef.current) return;
    unavailableReportedRef.current = true;
    onInvalidateReady(null);
    onUnavailable();
  }, [onInvalidateReady, onUnavailable]);

  useEffect(() => {
    if (!supported) reportUnavailable();
  }, [reportUnavailable, supported]);

  useEffect(() => {
    if (targetIndex !== null) {
      cueRef.current.travelProgress = 0;
      return;
    }
    const checkpoint = dalatJourneyDefinition.checkpoints[currentIndex];
    cueRef.current.glow = checkpoint.sceneCue;
    cueRef.current.mistOpen = currentIndex === 0 ? 0 : 1;
    cueRef.current.travelProgress = 1;
  }, [currentIndex, targetIndex]);

  const handleQualityReduce = useCallback(() => {
    setAdaptivelyReduced(true);
  }, []);

  const handleWorldReady = useCallback(() => {
    setWorldReady(true);
  }, []);

  const handleRuntimeReady = useCallback(() => {
    setRuntimeReady(true);
  }, []);

  useEffect(() => {
    if (!runtimeReady || !worldReady || readyReportedRef.current) return;
    readyReportedRef.current = true;
    onReady();
  }, [onReady, runtimeReady, worldReady]);

  const baseQualityTier: DalatWorldBaseTier = isMobile ? "mobile" : "desktop";
  const qualityTier: JourneyQualityTier = adaptivelyReduced
    ? "reduced"
    : baseQualityTier;
  const density: DalatWorldDensity = useMemo(
    () => getDalatWorldDensity(baseQualityTier, qualityTier),
    [baseQualityTier, qualityTier],
  );

  if (!supported) return null;

  const activeCheckpoint = dalatJourneyDefinition.checkpoints[currentIndex];
  const activeCopy = copy.checkpoints[activeCheckpoint.id];
  const targetCheckpoint =
    targetIndex === null
      ? null
      : dalatJourneyDefinition.checkpoints[targetIndex];

  return (
    <div
      aria-label={activeCopy.name}
      className="absolute inset-0 touch-none"
      data-active-flower-instances={density.flowerInstances}
      data-active-light-instances={density.lightInstances}
      data-active-pine-instances={density.pineInstances}
      data-quality-tier={qualityTier}
      data-testid="dalat-journey-canvas"
      data-runtime-ready={runtimeReady ? "true" : "false"}
      data-backdrop-mode="plate-first"
      data-world-ready={worldReady ? "true" : "false"}
      data-world-skin="dalat-mist"
      ref={diagnosticsRef}
      role="group"
    >
      <DalatArtworkBackdrop
        activeCheckpoint={activeCheckpoint}
        look={look}
        reducedMotion={reducedMotion}
        targetCheckpoint={targetCheckpoint}
      />
      <JourneyCanvasBoundary onError={reportUnavailable}>
        <Canvas
          camera={{
            fov: dalatJourneyDefinition.camera.fovDegrees,
            near: 0.1,
            far: 90,
            position: dalatJourneyDefinition.checkpoints[0].cameraPosition,
          }}
          dpr={qualityTier === "desktop" ? [1, 1.25] : 1}
          frameloop="demand"
          gl={{
            alpha: true,
            antialias: true,
            powerPreference: "high-performance",
          }}
          shadows={false}
        >
          <JourneyRuntimeBridge
            invalidateBridgeRef={invalidateBridgeRef}
            onInvalidateReady={onInvalidateReady}
            onReady={handleRuntimeReady}
            reportUnavailable={reportUnavailable}
          />
          <JourneyCamera
            cueRef={cueRef}
            currentIndex={currentIndex}
            diagnosticsRef={diagnosticsRef as RefObject<HTMLElement | null>}
            invalidateBridgeRef={invalidateBridgeRef}
            lookRef={lookRef}
            onArrive={onArrive}
            reducedMotion={reducedMotion}
            targetIndex={targetIndex}
          />
          <DalatMistWorld
            cueRef={cueRef}
            density={density}
            onQualityReduce={handleQualityReduce}
            onReady={handleWorldReady}
            plateFirst
            qualityMonitorEnabled={!reducedMotion}
            qualityTier={qualityTier}
          />
          <JourneyAmbientInvalidation
            active={phase === "settled" && !reducedMotion}
            frameIntervalMs={getAmbientFrameIntervalMs(isMobile, qualityTier)}
          />
        </Canvas>
      </JourneyCanvasBoundary>
    </div>
  );
}

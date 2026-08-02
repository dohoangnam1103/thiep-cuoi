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
} from "react";
import {
  WebGLRenderer,
  type WebGLRendererParameters,
} from "three";

import {
  forestWeddingJourneyDefinition,
  type ForestJourneyContent,
  type ForestJourneyScene,
} from "@/data/forest-wedding-journey";

import type { ForestJourneyPhase } from "./forest-journey-controller";
import type {
  ForestJourneySceneNames,
  ForestSceneLabels,
} from "./forest-scene-content";
import type { ForestJourneyLocalInteractions } from "./forest-interactive-scenes";
import {
  FOREST_FINALE_DOVE_PLACEMENTS,
  FOREST_GATE_DOVE_PLACEMENTS,
  FOREST_RABBIT_PLACEMENTS,
} from "./forest-animals";
import {
  createInitialForestJourneyCueState,
  type ForestJourneyCueState,
} from "./forest-cue-state";
import {
  ForestJourneyCamera,
  type ForestJourneyInvalidateBridge,
} from "./forest-journey-camera";
import { FOREST_GATE_ASSEMBLIES } from "./forest-gate";
import {
  createForestAdaptiveQualitySampler,
  createForestWorldPlacements,
  getForestEnvironmentRuntimeEstimate,
  getForestWorldDensity,
  getForestWorldDiagnostics,
  getInitialForestWorldQualityTier,
  type ForestWorldQualityTier,
} from "./forest-world-data";
import type { ForestPhotoTextureCacheDiagnostics } from "./forest-photo-texture-cache";
import { createForestCameraScenes } from "./forest-scene-framing";
import {
  ForestWeddingWorld,
  type ForestWeddingWorldMode,
} from "./forest-wedding-world";
import styles from "./forest-wedding-journey.module.css";

const MOBILE_QUERY = "(max-width: 767px)";
const FOREST_RUNTIME_DIAGNOSTICS_ENABLED = process.env.NODE_ENV !== "production";

type ForestRuntimeDiagnosticCounters = {
  adaptiveReductionCount: number;
  ambientCount: number;
  hiddenAmbientCount: number;
};

export type ForestRuntimeDiagnosticsSnapshot = {
  readonly adaptiveReductionCount: number;
  readonly ambientCount: number;
  readonly environment: ReturnType<typeof getForestEnvironmentRuntimeEstimate>;
  readonly hiddenAmbientCount: number;
  readonly photos: ForestPhotoTextureCacheDiagnostics;
  readonly qualityTier: ForestWorldQualityTier;
  readonly renderer: {
    readonly calls: number;
    readonly dpr: number;
    readonly frame: number;
    readonly geometries: number;
    readonly textures: number;
    readonly triangles: number;
  };
  readonly scene: {
    readonly id: string;
    readonly index: number;
    readonly phase: ForestJourneyPhase;
    readonly targetId: string | null;
    readonly targetIndex: number | null;
    readonly type: ForestJourneyScene["type"];
  };
  readonly totalEstimatedDecodedRgbaMipBytes: number;
  readonly viewport: "desktop" | "mobile";
  readonly worldMode: ForestWeddingWorldMode | "loading";
};

declare global {
  interface Window {
    __forestWeddingJourneyDiagnostics?: () => ForestRuntimeDiagnosticsSnapshot;
  }
}

const EMPTY_PHOTO_DIAGNOSTICS: ForestPhotoTextureCacheDiagnostics = {
  activeLeases: 0,
  decodedRgbaMipBytes: 0,
  liveCount: 0,
  retainedCount: 0,
  textures: [],
  unmeasuredCount: 0,
};

type RendererFactoryProps = Omit<WebGLRendererParameters, "canvas"> & {
  readonly canvas: NonNullable<WebGLRendererParameters["canvas"]>;
};

function subscribeToMobileViewport(onStoreChange: () => void): () => void {
  const query = window.matchMedia(MOBILE_QUERY);
  query.addEventListener("change", onStoreChange);
  return () => query.removeEventListener("change", onStoreChange);
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

export type ForestJourneyCanvasProps = {
  readonly activeIndex: number;
  readonly content: ForestJourneyContent;
  readonly interactions: ForestJourneyLocalInteractions;
  readonly labels: ForestSceneLabels;
  readonly lookRef: MutableRefObject<{
    pitchDegrees: number;
    yawDegrees: number;
  }>;
  readonly onArrive: () => void;
  readonly onInvalidateReady: (invalidate: (() => void) | null) => void;
  readonly onReady: () => void;
  readonly onUnavailable: () => void;
  readonly phase: ForestJourneyPhase;
  readonly reducedMotion: boolean;
  readonly sceneNames: ForestJourneySceneNames;
  readonly scenes: readonly ForestJourneyScene[];
  readonly targetIndex: number | null;
};

type ForestCanvasErrorBoundaryProps = {
  readonly children: ReactNode;
  readonly onError: () => void;
};

type ForestCanvasErrorBoundaryState = {
  readonly failed: boolean;
};

class ForestCanvasErrorBoundary extends Component<
  ForestCanvasErrorBoundaryProps,
  ForestCanvasErrorBoundaryState
> {
  state: ForestCanvasErrorBoundaryState = { failed: false };

  static getDerivedStateFromError(): ForestCanvasErrorBoundaryState {
    return { failed: true };
  }

  componentDidCatch() {
    this.props.onError();
  }

  render() {
    return this.state.failed ? null : this.props.children;
  }
}

function JourneyRuntimeBridge({
  invalidateBridgeRef,
  onInvalidateReady,
  onReady,
  reportUnavailable,
}: {
  readonly invalidateBridgeRef: ForestJourneyInvalidateBridge;
  readonly onInvalidateReady: ForestJourneyCanvasProps["onInvalidateReady"];
  readonly onReady: () => void;
  readonly reportUnavailable: () => void;
}) {
  const { gl, invalidate } = useThree();
  const completionFrameRef = useRef<number | null>(null);
  const reportedRef = useRef(false);

  useEffect(() => {
    invalidateBridgeRef.current = invalidate;
    onInvalidateReady(invalidate);
    invalidate();

    return () => {
      if (completionFrameRef.current !== null) {
        window.cancelAnimationFrame(completionFrameRef.current);
        completionFrameRef.current = null;
      }
      if (invalidateBridgeRef.current === invalidate) {
        invalidateBridgeRef.current = null;
      }
      onInvalidateReady(null);
      reportedRef.current = false;
    };
  }, [invalidate, invalidateBridgeRef, onInvalidateReady]);

  useFrame(() => {
    if (reportedRef.current) return;
    reportedRef.current = true;
    completionFrameRef.current = window.requestAnimationFrame(() => {
      completionFrameRef.current = null;
      onReady();
    });
  });

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

function getAmbientFrameIntervalMs(
  isMobile: boolean,
  adaptivelyReduced: boolean,
): number {
  if (adaptivelyReduced) return 1_000 / 20;
  return isMobile ? 1_000 / 30 : 0;
}

function JourneyAmbientInvalidation({
  active,
  diagnosticCountersRef,
  frameIntervalMs,
  onSustainedSlow,
}: {
  readonly active: boolean;
  readonly diagnosticCountersRef: MutableRefObject<
    ForestRuntimeDiagnosticCounters | null
  >;
  readonly frameIntervalMs: number;
  readonly onSustainedSlow: () => void;
}) {
  const invalidate = useThree(({ invalidate: requestFrame }) => requestFrame);
  const qualitySampler = useMemo(
    () => createForestAdaptiveQualitySampler(onSustainedSlow),
    [onSustainedSlow],
  );

  useEffect(() => {
    if (!active) {
      qualitySampler.reset();
      return;
    }

    let animationFrameId: number | null = null;
    let previousInvalidationAt: number | null = null;

    const schedule = () => {
      if (animationFrameId === null && document.visibilityState === "visible") {
        animationFrameId = window.requestAnimationFrame(tick);
      }
    };

    const tick = (timestamp: number) => {
      animationFrameId = null;
      if (document.visibilityState !== "visible") {
        if (diagnosticCountersRef.current) {
          diagnosticCountersRef.current.hiddenAmbientCount += 1;
        }
        return;
      }
      qualitySampler.sample(timestamp);

      if (
        previousInvalidationAt === null
        || frameIntervalMs === 0
        || timestamp - previousInvalidationAt >= frameIntervalMs
      ) {
        previousInvalidationAt = timestamp;
        if (diagnosticCountersRef.current) {
          diagnosticCountersRef.current.ambientCount += 1;
        }
        invalidate();
      }
      schedule();
    };

    const handleVisibilityChange = () => {
      previousInvalidationAt = null;
      qualitySampler.reset();
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
      qualitySampler.reset();
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [active, diagnosticCountersRef, frameIntervalMs, invalidate, qualitySampler]);

  return null;
}

function JourneyRuntimeDiagnostics({
  activeIndex,
  countersRef,
  isMobile,
  phase,
  photoDiagnosticsReaderRef,
  qualityTier,
  scenes,
  targetIndex,
  worldMode,
}: {
  readonly activeIndex: number;
  readonly countersRef: MutableRefObject<ForestRuntimeDiagnosticCounters | null>;
  readonly isMobile: boolean;
  readonly phase: ForestJourneyPhase;
  readonly photoDiagnosticsReaderRef: MutableRefObject<
    (() => ForestPhotoTextureCacheDiagnostics) | null
  >;
  readonly qualityTier: ForestWorldQualityTier;
  readonly scenes: readonly ForestJourneyScene[];
  readonly targetIndex: number | null;
  readonly worldMode: ForestWeddingWorldMode | "loading";
}) {
  const renderer = useThree(({ gl }) => gl);

  useEffect(() => {
    const readSnapshot = (): ForestRuntimeDiagnosticsSnapshot => {
      const scene = scenes[activeIndex] ?? scenes[0];
      if (!scene) {
        throw new Error("Forest runtime diagnostics require at least one scene");
      }
      const targetScene = targetIndex === null
        ? null
        : scenes[targetIndex] ?? null;
      const environment = getForestEnvironmentRuntimeEstimate(
        worldMode === "textured" ? "textured" : "procedural",
      );
      const photos = photoDiagnosticsReaderRef.current?.()
        ?? EMPTY_PHOTO_DIAGNOSTICS;
      const counters = countersRef.current;

      return {
        adaptiveReductionCount: counters?.adaptiveReductionCount ?? 0,
        ambientCount: counters?.ambientCount ?? 0,
        environment,
        hiddenAmbientCount: counters?.hiddenAmbientCount ?? 0,
        photos,
        qualityTier,
        renderer: {
          calls: renderer.info.render.calls,
          dpr: renderer.getPixelRatio(),
          frame: renderer.info.render.frame,
          geometries: renderer.info.memory.geometries,
          textures: renderer.info.memory.textures,
          triangles: renderer.info.render.triangles,
        },
        scene: {
          id: scene.id,
          index: activeIndex,
          phase,
          targetId: targetScene?.id ?? null,
          targetIndex,
          type: scene.type,
        },
        totalEstimatedDecodedRgbaMipBytes:
          environment.decodedRgbaMipBytes + photos.decodedRgbaMipBytes,
        viewport: isMobile ? "mobile" : "desktop",
        worldMode,
      };
    };

    window.__forestWeddingJourneyDiagnostics = readSnapshot;
    return () => {
      if (window.__forestWeddingJourneyDiagnostics === readSnapshot) {
        delete window.__forestWeddingJourneyDiagnostics;
      }
    };
  }, [
    activeIndex,
    countersRef,
    isMobile,
    phase,
    photoDiagnosticsReaderRef,
    qualityTier,
    renderer,
    scenes,
    targetIndex,
    worldMode,
  ]);

  return null;
}

function JourneyCueDiagnostics({
  cueRef,
  reducedMotion,
  wrapperRef,
}: {
  readonly cueRef: MutableRefObject<ForestJourneyCueState>;
  readonly reducedMotion: boolean;
  readonly wrapperRef: MutableRefObject<HTMLDivElement | null>;
}) {
  const lastWrapperRef = useRef<HTMLDivElement | null>(null);
  const valuesRef = useRef({
    cueDoveFlight: Number.NaN,
    cuePetalGust: Number.NaN,
    cueRabbitGuide: Number.NaN,
    cueVoileLift: Number.NaN,
    cueWindStrength: Number.NaN,
    travelProgress: Number.NaN,
  });

  useFrame(() => {
    const cue = cueRef.current;
    const wrapper = wrapperRef.current;
    if (!wrapper) return;
    const values = valuesRef.current;
    if (lastWrapperRef.current !== wrapper) {
      lastWrapperRef.current = wrapper;
      values.cueDoveFlight = Number.NaN;
      values.cuePetalGust = Number.NaN;
      values.cueRabbitGuide = Number.NaN;
      values.cueVoileLift = Number.NaN;
      values.cueWindStrength = Number.NaN;
      values.travelProgress = Number.NaN;
    }
    const cueDoveFlight = reducedMotion || !Number.isFinite(cue.doveFlight)
      ? 0
      : cue.doveFlight;
    const cuePetalGust = reducedMotion || !Number.isFinite(cue.petalGust)
      ? 0
      : cue.petalGust;
    const cueRabbitGuide = reducedMotion || !Number.isFinite(cue.rabbitGuide)
      ? 0
      : cue.rabbitGuide;
    const cueVoileLift = reducedMotion || !Number.isFinite(cue.voileLift)
      ? 0
      : cue.voileLift;
    const cueWindStrength = reducedMotion || !Number.isFinite(cue.windStrength)
      ? 0
      : cue.windStrength;
    const travelProgress = reducedMotion || !Number.isFinite(cue.travelProgress)
      ? 0
      : cue.travelProgress;

    if (values.cueDoveFlight !== cueDoveFlight) {
      values.cueDoveFlight = cueDoveFlight;
      wrapper.dataset.cueDoveFlight = String(cueDoveFlight);
    }
    if (values.cuePetalGust !== cuePetalGust) {
      values.cuePetalGust = cuePetalGust;
      wrapper.dataset.cuePetalGust = String(cuePetalGust);
    }
    if (values.cueRabbitGuide !== cueRabbitGuide) {
      values.cueRabbitGuide = cueRabbitGuide;
      wrapper.dataset.cueRabbitGuide = String(cueRabbitGuide);
    }
    if (values.cueVoileLift !== cueVoileLift) {
      values.cueVoileLift = cueVoileLift;
      wrapper.dataset.cueVoileLift = String(cueVoileLift);
    }
    if (values.cueWindStrength !== cueWindStrength) {
      values.cueWindStrength = cueWindStrength;
      wrapper.dataset.cueWindStrength = String(cueWindStrength);
    }
    if (values.travelProgress !== travelProgress) {
      values.travelProgress = travelProgress;
      wrapper.dataset.travelProgress = String(travelProgress);
    }
  });

  return null;
}

export function ForestJourneyCanvas({
  activeIndex,
  content,
  interactions,
  labels,
  lookRef,
  onArrive,
  onInvalidateReady,
  onReady,
  onUnavailable,
  phase,
  reducedMotion,
  sceneNames,
  scenes,
  targetIndex,
}: ForestJourneyCanvasProps) {
  const isMobile = useMobileViewport();
  const [runtimeReady, setRuntimeReady] = useState(false);
  const [worldReady, setWorldReady] = useState(false);
  const [worldMode, setWorldMode] = useState<ForestWeddingWorldMode | "loading">(
    "loading",
  );
  const [adaptivelyReduced, setAdaptivelyReduced] = useState(false);
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const invalidateBridgeRef = useRef<(() => void) | null>(null);
  const photoDiagnosticsReaderRef = useRef<
    (() => ForestPhotoTextureCacheDiagnostics) | null
  >(null);
  const diagnosticCountersRef = useRef<ForestRuntimeDiagnosticCounters | null>(
    FOREST_RUNTIME_DIAGNOSTICS_ENABLED
      ? {
          adaptiveReductionCount: 0,
          ambientCount: 0,
          hiddenAmbientCount: 0,
        }
      : null,
  );
  const cueRef = useRef<ForestJourneyCueState>(createInitialForestJourneyCueState());
  const gateDepartedRef = useRef(false);
  const readyReportedRef = useRef(false);
  const unavailableReportedRef = useRef(false);
  const initialQualityTier = getInitialForestWorldQualityTier(
    isMobile ? "mobile" : "desktop",
  );
  const qualityTier: ForestWorldQualityTier = reducedMotion || adaptivelyReduced
    ? "reduced"
    : initialQualityTier;
  const ambientFrameIntervalMs = getAmbientFrameIntervalMs(
    isMobile,
    adaptivelyReduced,
  );
  const worldDensity = useMemo(() => getForestWorldDensity(
    isMobile ? "mobile" : "desktop",
    qualityTier,
  ), [isMobile, qualityTier]);
  const worldPlacements = useMemo(
    () => createForestWorldPlacements(scenes.length, worldDensity),
    [scenes.length, worldDensity],
  );
  const cameraScenes = useMemo(
    () => createForestCameraScenes(scenes, worldPlacements.clearings),
    [scenes, worldPlacements.clearings],
  );
  const worldDiagnostics = useMemo(
    () => getForestWorldDiagnostics(worldPlacements),
    [worldPlacements],
  );
  const finaleCueActive = phase === "travelling"
    && targetIndex !== null
    && scenes[targetIndex]?.type === "finale";
  const accessibleScene = scenes[targetIndex ?? activeIndex] ?? scenes[activeIndex] ?? scenes[0];

  const reportUnavailable = useCallback(() => {
    if (unavailableReportedRef.current) return;
    unavailableReportedRef.current = true;
    invalidateBridgeRef.current = null;
    onInvalidateReady(null);
    setRuntimeReady(false);
    setWorldReady(false);
    onUnavailable();
  }, [onInvalidateReady, onUnavailable]);
  const handleRuntimeReady = useCallback(() => {
    setRuntimeReady(true);
  }, []);
  const handleWorldReady = useCallback((mode: ForestWeddingWorldMode) => {
    setWorldMode(mode);
    setWorldReady(true);
  }, []);
  const handlePhotoDiagnosticsReaderChange = useCallback((
    reader: (() => ForestPhotoTextureCacheDiagnostics) | null,
  ) => {
    photoDiagnosticsReaderRef.current = reader;
  }, []);
  const handleSustainedSlow = useCallback(() => {
    if (diagnosticCountersRef.current) {
      diagnosticCountersRef.current.adaptiveReductionCount += 1;
    }
    setAdaptivelyReduced(true);
  }, []);
  const createRenderer = useCallback(async (defaultProps: RendererFactoryProps) => {
    try {
      return new WebGLRenderer({
        ...defaultProps,
        alpha: false,
        antialias: true,
        powerPreference: "high-performance",
      });
    } catch {
      reportUnavailable();
      return new Promise<WebGLRenderer>(() => {});
    }
  }, [reportUnavailable]);

  useEffect(() => {
    if (!runtimeReady || !worldReady || readyReportedRef.current) return;
    readyReportedRef.current = true;
    onReady();
  }, [onReady, runtimeReady, worldReady]);

  useEffect(() => {
    if (activeIndex <= 0 || gateDepartedRef.current) return;
    gateDepartedRef.current = true;
  }, [activeIndex]);

  return (
    <div
      aria-label={accessibleScene ? sceneNames[accessibleScene.type] : undefined}
      className={styles.canvasShell}
      data-active-index={activeIndex}
      data-ambient-frame-interval={ambientFrameIntervalMs}
      data-corridor-clear={worldDiagnostics.corridorClear ? "true" : "false"}
      data-camera-x={scenes[0]?.cameraPosition[0] ?? 0}
      data-camera-y={scenes[0]?.cameraPosition[1] ?? 1.62}
      data-camera-z={scenes[0]?.cameraPosition[2] ?? 8}
      data-cue-dove-flight={0}
      data-cue-petal-gust={0}
      data-cue-rabbit-guide={0}
      data-cue-voile-lift={0}
      data-cue-wind-strength={0}
      data-active-petal-instances={worldPlacements.petals.length}
      data-finale-dove-count={FOREST_FINALE_DOVE_PLACEMENTS.length}
      data-gate-count={FOREST_GATE_ASSEMBLIES.length}
      data-gate-dove-count={FOREST_GATE_DOVE_PLACEMENTS.length}
      data-min-hero-path-distance={worldDiagnostics.minimumHeroPathDistance}
      data-min-wildflower-path-distance={worldDiagnostics.minimumWildflowerPathDistance}
      data-quality-tier={qualityTier}
      data-rabbit-count={FOREST_RABBIT_PLACEMENTS.length}
      data-runtime-ready={runtimeReady ? "true" : "false"}
      data-rendered-look-pitch={0}
      data-rendered-look-yaw={0}
      data-scene-total={scenes.length}
      data-testid="forest-journey-canvas"
      data-travel-progress={0}
      data-voile-count={1}
      data-world-mode={worldMode}
      data-world-ready={worldReady ? "true" : "false"}
      data-world-skin="forest-wedding-daylight"
      ref={wrapperRef}
      role="group"
    >
      <ForestCanvasErrorBoundary onError={reportUnavailable}>
        <Canvas
          camera={{
            far: forestWeddingJourneyDefinition.camera.far,
            fov: forestWeddingJourneyDefinition.camera.fovDegrees,
            near: forestWeddingJourneyDefinition.camera.near,
            position: scenes[0]?.cameraPosition ?? [0, 1.62, 8],
          }}
          dpr={isMobile ? 1 : [1, 1.25]}
          frameloop="demand"
          gl={createRenderer}
          shadows={false}
        >
          <JourneyRuntimeBridge
            invalidateBridgeRef={invalidateBridgeRef}
            onInvalidateReady={onInvalidateReady}
            onReady={handleRuntimeReady}
            reportUnavailable={reportUnavailable}
          />
          <ForestJourneyCamera
            cueRef={cueRef}
            currentIndex={activeIndex}
            diagnosticsRef={wrapperRef}
            invalidateBridgeRef={invalidateBridgeRef}
            lookRef={lookRef}
            onArrive={onArrive}
            reducedMotion={reducedMotion}
            scenes={cameraScenes}
            targetIndex={targetIndex}
          />
          <ForestWeddingWorld
            activeIndex={activeIndex}
            content={content}
            cueRef={cueRef}
            diagnosticsRef={wrapperRef}
            finaleCueActive={finaleCueActive}
            gateDepartedRef={gateDepartedRef}
            interactions={interactions}
            onReady={handleWorldReady}
            phase={phase}
            onPhotoDiagnosticsReaderChange={handlePhotoDiagnosticsReaderChange}
            placements={worldPlacements}
            reducedMotion={reducedMotion}
            labels={labels}
            sceneNames={sceneNames}
            scenes={scenes}
            targetIndex={targetIndex}
          />
          <JourneyAmbientInvalidation
            active={phase !== "travelling" && !reducedMotion}
            diagnosticCountersRef={diagnosticCountersRef}
            frameIntervalMs={ambientFrameIntervalMs}
            onSustainedSlow={handleSustainedSlow}
          />
          <JourneyCueDiagnostics
            cueRef={cueRef}
            reducedMotion={reducedMotion}
            wrapperRef={wrapperRef}
          />
          {FOREST_RUNTIME_DIAGNOSTICS_ENABLED ? (
            <JourneyRuntimeDiagnostics
              activeIndex={activeIndex}
              countersRef={diagnosticCountersRef}
              isMobile={isMobile}
              phase={phase}
              photoDiagnosticsReaderRef={photoDiagnosticsReaderRef}
              qualityTier={qualityTier}
              scenes={scenes}
              targetIndex={targetIndex}
              worldMode={worldMode}
            />
          ) : null}
        </Canvas>
      </ForestCanvasErrorBoundary>
    </div>
  );
}

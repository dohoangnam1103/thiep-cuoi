"use client";

/*
 * Twin file: src/components/forest-wedding-journey/forest-journey-canvas.tsx
 *
 * The WebGL host: creates the renderer, publishes `invalidate`, drives ambient
 * frames under `frameloop="demand"`, reports ready or unavailable, and exposes
 * the runtime diagnostics snapshot the E2E budget suite reads. All of that
 * mechanism is the forest twin's, unchanged — fixes belong in both.
 *
 * Three things differ, and all three follow from what this world actually is:
 *
 * 1. The world resolves its own quality tier and owns its own adaptive-quality
 *    watcher (see `BeachWeddingWorld`), so this file neither computes a tier nor
 *    passes one down. It still reads the tier back out of the world's
 *    diagnostics, because the wrapper's `data-quality-tier` attribute and the
 *    snapshot both have to report the tier that is actually rendering.
 * 2. The diagnostics snapshot reports water, frames and dune grass where the
 *    forest reports chunks, petals, wildlife and environment. The shared fields
 *    — renderer, scene, assets, qualityTier, photos, viewport,
 *    adaptiveReductionCount, worldMode — keep their names and shapes so the
 *    budget assertions read the same way in both labs.
 * 3. The cue payload is two fields, `waterSparkle` and `windStrength`, against
 *    the forest's five.
 */

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
  beachWeddingJourneyDefinition,
  type BeachJourneyContent,
  type BeachJourneyScene,
} from "@/data/beach-wedding-journey";

import type { BeachJourneyPhase } from "./beach-journey-controller";
import type {
  BeachJourneySceneNames,
  BeachSceneLabels,
} from "./beach-scene-content";
import type { BeachJourneyLocalInteractions } from "./beach-interactive-scenes";
import {
  createInitialBeachJourneyCueState,
  type BeachJourneyCueState,
} from "./beach-cue-state";
import {
  BeachJourneyCamera,
  type BeachJourneyInvalidateBridge,
} from "./beach-journey-camera";
import {
  createBeachAdaptiveQualitySampler,
  type BeachWorldQualityTier,
  type BeachWorldViewport,
} from "./beach-world-data";
import { getBeachPhotorealAssetEstimate } from "./photoreal/beach-asset-manifest";
import type { BeachPhotoDiagnostics } from "./photoreal/beach-photo-frames";
import { BEACH_WATER_REFLECTION_SIZE } from "./photoreal/beach-water";
import { createBeachCameraScenes } from "./beach-scene-framing";
import { residentSceneIndices } from "./beach-scene-residency";
import { BeachScenePanel } from "./beach-scene-panels";
import {
  BeachWeddingWorld,
  type BeachWeddingWorldDiagnostics,
  type BeachWeddingWorldMode,
} from "./beach-wedding-world";
import styles from "./beach-wedding-journey.module.css";

const MOBILE_QUERY = "(max-width: 767px)";

type BeachRuntimeDiagnosticCounters = {
  adaptiveReductionCount: number;
  ambientCount: number;
  hiddenAmbientCount: number;
};

export type BeachRuntimeDiagnosticsSnapshot = {
  readonly adaptiveReductionCount: number;
  readonly ambientCount: number;
  readonly assets: {
    readonly entryCompressedBytes: number;
    readonly entryDecodedRgbaMipBytes: number;
    readonly sharedCompressedBytes: number;
    readonly sharedDecodedRgbaMipBytes: number;
  };
  readonly frames: {
    readonly instanceCount: number;
    readonly modelFallbackCount: number;
  };
  readonly hiddenAmbientCount: number;
  readonly photos: BeachPhotoDiagnostics;
  readonly qualityTier: BeachWorldQualityTier;
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
    readonly phase: BeachJourneyPhase;
    readonly targetId: string | null;
    readonly targetIndex: number | null;
    readonly type: BeachJourneyScene["type"];
  };
  readonly tables: {
    readonly instanceCount: number;
  };
  readonly totalEstimatedDecodedRgbaMipBytes: number;
  readonly viewport: BeachWorldViewport;
  readonly water: {
    readonly reflectionEnabled: boolean;
    readonly reflectionSize: number;
  };
  readonly worldMode: BeachWeddingWorldMode | "loading";
};

declare global {
  interface Window {
    __beachWeddingJourneyDiagnostics?: () => BeachRuntimeDiagnosticsSnapshot;
  }
}

const EMPTY_PHOTO_DIAGNOSTICS: BeachPhotoDiagnostics = {
  decodedRgbaMipBytes: 0,
  textureCount: 0,
  unmeasuredCount: 0,
};

/**
 * The tier and counts to report before the world has published its reader.
 *
 * The snapshot is readable from the first frame — the E2E suite may sample
 * during boot — so it needs a defined answer for the window between the canvas
 * mounting and the world's diagnostics callback landing. Zeroed counts and a
 * disabled reflection describe exactly that state: nothing is in the scene yet.
 */
function getPendingWorldDiagnostics(
  viewport: BeachWorldViewport,
  reducedMotion: boolean,
): BeachWeddingWorldDiagnostics {
  return {
    frameInstanceCount: 0,
    framesWithoutWoodMaps: 0,
    photos: null,
    postInstanceCount: 0,
    qualityTier: reducedMotion ? "reduced" : viewport,
    reflectionEnabled: false,
    tableInstanceCount: 0,
    worldMode: "photoreal",
  };
}

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

export type BeachJourneyCanvasProps = {
  readonly activeIndex: number;
  readonly content: BeachJourneyContent;
  /**
   * Publishes the on-demand runtime snapshot reader. Resolved on the server so
   * a production build can still opt in for the diagnostic E2E suite, and stays
   * absent for real visitors.
   */
  readonly diagnosticsEnabled: boolean;
  readonly interactions: BeachJourneyLocalInteractions;
  readonly labels: BeachSceneLabels;
  readonly lookRef: MutableRefObject<{
    pitchDegrees: number;
    yawDegrees: number;
  }>;
  readonly onArrive: () => void;
  readonly onInvalidateReady: (invalidate: (() => void) | null) => void;
  readonly onReady: () => void;
  readonly onUnavailable: () => void;
  readonly phase: BeachJourneyPhase;
  readonly reducedMotion: boolean;
  readonly sceneNames: BeachJourneySceneNames;
  readonly scenes: readonly BeachJourneyScene[];
  readonly targetIndex: number | null;
};

type BeachCanvasErrorBoundaryProps = {
  readonly children: ReactNode;
  readonly onError: () => void;
};

type BeachCanvasErrorBoundaryState = {
  readonly failed: boolean;
};

class BeachCanvasErrorBoundary extends Component<
  BeachCanvasErrorBoundaryProps,
  BeachCanvasErrorBoundaryState
> {
  state: BeachCanvasErrorBoundaryState = { failed: false };

  static getDerivedStateFromError(): BeachCanvasErrorBoundaryState {
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
  readonly invalidateBridgeRef: BeachJourneyInvalidateBridge;
  readonly onInvalidateReady: BeachJourneyCanvasProps["onInvalidateReady"];
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
    BeachRuntimeDiagnosticCounters | null
  >;
  readonly frameIntervalMs: number;
  readonly onSustainedSlow: () => void;
}) {
  const invalidate = useThree(({ invalidate: requestFrame }) => requestFrame);
  const qualitySampler = useMemo(
    () => createBeachAdaptiveQualitySampler(onSustainedSlow),
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
  reducedMotion,
  scenes,
  targetIndex,
  worldDiagnosticsReaderRef,
  worldMode,
}: {
  readonly activeIndex: number;
  readonly countersRef: MutableRefObject<BeachRuntimeDiagnosticCounters | null>;
  readonly isMobile: boolean;
  readonly phase: BeachJourneyPhase;
  readonly reducedMotion: boolean;
  readonly scenes: readonly BeachJourneyScene[];
  readonly targetIndex: number | null;
  readonly worldDiagnosticsReaderRef: MutableRefObject<
    (() => BeachWeddingWorldDiagnostics) | null
  >;
  readonly worldMode: BeachWeddingWorldMode | "loading";
}) {
  const renderer = useThree(({ gl }) => gl);

  useEffect(() => {
    const readSnapshot = (): BeachRuntimeDiagnosticsSnapshot => {
      const scene = scenes[activeIndex] ?? scenes[0];
      if (!scene) {
        throw new Error("Beach runtime diagnostics require at least one scene");
      }
      const targetScene = targetIndex === null
        ? null
        : scenes[targetIndex] ?? null;
      const viewport: BeachWorldViewport = isMobile ? "mobile" : "desktop";
      const world = worldDiagnosticsReaderRef.current?.()
        ?? getPendingWorldDiagnostics(viewport, reducedMotion);
      const photos = world.photos ?? EMPTY_PHOTO_DIAGNOSTICS;
      const counters = countersRef.current;
      const entryAssets = getBeachPhotorealAssetEstimate("entry");
      const sharedAssets = getBeachPhotorealAssetEstimate("shared");

      return {
        adaptiveReductionCount: counters?.adaptiveReductionCount ?? 0,
        ambientCount: counters?.ambientCount ?? 0,
        assets: {
          entryCompressedBytes: entryAssets.compressedBytes,
          entryDecodedRgbaMipBytes: entryAssets.decodedRgbaMipBytes,
          sharedCompressedBytes: sharedAssets.compressedBytes,
          sharedDecodedRgbaMipBytes: sharedAssets.decodedRgbaMipBytes,
        },
        frames: {
          instanceCount: world.frameInstanceCount,
          modelFallbackCount: world.framesWithoutWoodMaps,
        },
        hiddenAmbientCount: counters?.hiddenAmbientCount ?? 0,
        photos,
        qualityTier: world.qualityTier,
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
        tables: {
          instanceCount: world.tableInstanceCount,
        },
        // The world's own textures are measured from the manifest rather than
        // from the live renderer, because `renderer.info.memory.textures` counts
        // handles and says nothing about decoded bytes.
        totalEstimatedDecodedRgbaMipBytes:
          sharedAssets.decodedRgbaMipBytes + photos.decodedRgbaMipBytes,
        viewport,
        water: {
          reflectionEnabled: world.reflectionEnabled,
          reflectionSize: BEACH_WATER_REFLECTION_SIZE,
        },
        worldMode,
      };
    };

    window.__beachWeddingJourneyDiagnostics = readSnapshot;
    return () => {
      if (window.__beachWeddingJourneyDiagnostics === readSnapshot) {
        delete window.__beachWeddingJourneyDiagnostics;
      }
    };
  }, [
    activeIndex,
    countersRef,
    isMobile,
    phase,
    reducedMotion,
    renderer,
    scenes,
    targetIndex,
    worldDiagnosticsReaderRef,
    worldMode,
  ]);

  return null;
}

function JourneyCueDiagnostics({
  cueRef,
  reducedMotion,
  wrapperRef,
}: {
  readonly cueRef: MutableRefObject<BeachJourneyCueState>;
  readonly reducedMotion: boolean;
  readonly wrapperRef: MutableRefObject<HTMLDivElement | null>;
}) {
  const lastWrapperRef = useRef<HTMLDivElement | null>(null);
  const valuesRef = useRef({
    cueWaterSparkle: Number.NaN,
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
      values.cueWaterSparkle = Number.NaN;
      values.cueWindStrength = Number.NaN;
      values.travelProgress = Number.NaN;
    }
    const cueWaterSparkle = reducedMotion || !Number.isFinite(cue.waterSparkle)
      ? 0
      : cue.waterSparkle;
    const cueWindStrength = reducedMotion || !Number.isFinite(cue.windStrength)
      ? 0
      : cue.windStrength;
    const travelProgress = reducedMotion || !Number.isFinite(cue.travelProgress)
      ? 0
      : cue.travelProgress;

    if (values.cueWaterSparkle !== cueWaterSparkle) {
      values.cueWaterSparkle = cueWaterSparkle;
      wrapper.dataset.cueWaterSparkle = String(cueWaterSparkle);
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

/**
 * The readable content of the scenes near the camera.
 *
 * Only a window of scenes is mounted — see `residentSceneIndices` — because a
 * `<Html transform>` panel is a real DOM subtree with real layout cost, and the
 * journey has thirteen of them. The cover gate is excluded: its copy lives in
 * the lab's entry overlay, not in the world.
 */
function BeachScenePanels({
  activeIndex,
  content,
  interactions,
  labels,
  phase,
  sceneNames,
  scenes,
  targetIndex,
}: {
  readonly activeIndex: number;
  readonly content: BeachJourneyContent;
  readonly interactions: BeachJourneyLocalInteractions;
  readonly labels: BeachSceneLabels;
  readonly phase: BeachJourneyPhase;
  readonly sceneNames: BeachJourneySceneNames;
  readonly scenes: readonly BeachJourneyScene[];
  readonly targetIndex: number | null;
}) {
  const residentIndices = residentSceneIndices(
    activeIndex,
    targetIndex,
    scenes.length,
  );
  const displayedIndex = targetIndex ?? activeIndex;
  const settled = phase === "settled";

  return residentIndices.map((index) => {
    const scene = scenes[index];
    if (!scene || scene.type === "cover-gate") return null;

    return (
      <BeachScenePanel
        active={index === displayedIndex}
        content={content}
        interactions={interactions}
        key={scene.id}
        labels={labels}
        scene={scene}
        sceneName={sceneNames[scene.type]}
        settled={settled}
      />
    );
  });
}

export function BeachJourneyCanvas({
  activeIndex,
  content,
  diagnosticsEnabled,
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
}: BeachJourneyCanvasProps) {
  const isMobile = useMobileViewport();
  const [runtimeReady, setRuntimeReady] = useState(false);
  const [worldReady, setWorldReady] = useState(false);
  const [worldMode, setWorldMode] = useState<BeachWeddingWorldMode | "loading">(
    "loading",
  );
  const [adaptivelyReduced, setAdaptivelyReduced] = useState(false);
  const [renderedQualityTier, setRenderedQualityTier] = useState<
    BeachWorldQualityTier | null
  >(null);
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const invalidateBridgeRef = useRef<(() => void) | null>(null);
  const worldDiagnosticsReaderRef = useRef<
    (() => BeachWeddingWorldDiagnostics) | null
  >(null);
  const diagnosticCountersRef = useRef<BeachRuntimeDiagnosticCounters | null>(
    diagnosticsEnabled
      ? {
          adaptiveReductionCount: 0,
          ambientCount: 0,
          hiddenAmbientCount: 0,
        }
      : null,
  );
  const cueRef = useRef<BeachJourneyCueState>(createInitialBeachJourneyCueState());
  const readyReportedRef = useRef(false);
  const unavailableReportedRef = useRef(false);
  const viewport: BeachWorldViewport = isMobile ? "mobile" : "desktop";
  const ambientFrameIntervalMs = getAmbientFrameIntervalMs(
    isMobile,
    adaptivelyReduced,
  );
  const cameraScenes = useMemo(
    () => createBeachCameraScenes(scenes),
    [scenes],
  );
  const accessibleScene = scenes[targetIndex ?? activeIndex]
    ?? scenes[activeIndex]
    ?? scenes[0];

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
  const handleWorldReady = useCallback((mode: BeachWeddingWorldMode) => {
    setWorldMode(mode);
    setWorldReady(true);
  }, []);
  const handleWorldDiagnosticsReaderChange = useCallback((
    reader: (() => BeachWeddingWorldDiagnostics) | null,
  ) => {
    worldDiagnosticsReaderRef.current = reader;
    // The tier the world settled on drives the wrapper attribute the E2E suite
    // asserts, and the world is the only component that knows it.
    setRenderedQualityTier(reader ? reader().qualityTier : null);
  }, []);
  const handleAdaptiveReduction = useCallback(() => {
    if (diagnosticCountersRef.current) {
      diagnosticCountersRef.current.adaptiveReductionCount += 1;
    }
    setAdaptivelyReduced(true);
  }, []);
  const handleSustainedSlow = useCallback(() => {
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

  return (
    <div
      aria-label={accessibleScene ? sceneNames[accessibleScene.type] : undefined}
      className={styles.canvasShell}
      data-active-index={activeIndex}
      data-ambient-frame-interval={ambientFrameIntervalMs}
      data-camera-x={scenes[0]?.cameraPosition[0] ?? 0}
      data-camera-y={scenes[0]?.cameraPosition[1] ?? 1.62}
      data-camera-z={scenes[0]?.cameraPosition[2] ?? 8}
      data-cue-water-sparkle={0}
      data-cue-wind-strength={0}
      data-quality-tier={
        renderedQualityTier
          ?? (reducedMotion || adaptivelyReduced ? "reduced" : viewport)
      }
      data-runtime-ready={runtimeReady ? "true" : "false"}
      data-rendered-look-pitch={0}
      data-rendered-look-yaw={0}
      data-scene-total={scenes.length}
      data-testid="beach-journey-canvas"
      data-travel-progress={0}
      data-viewport={viewport}
      data-world-mode={worldMode}
      data-world-ready={worldReady ? "true" : "false"}
      data-world-skin={
        worldMode === "photoreal"
          ? "beach-wedding-photoreal"
          : "beach-wedding-simple"
      }
      ref={wrapperRef}
      role="group"
    >
      <BeachCanvasErrorBoundary onError={reportUnavailable}>
        <Canvas
          camera={{
            far: beachWeddingJourneyDefinition.camera.far,
            fov: beachWeddingJourneyDefinition.camera.fovDegrees,
            near: beachWeddingJourneyDefinition.camera.near,
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
          <BeachJourneyCamera
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
          <BeachWeddingWorld
            cueRef={cueRef}
            onAdaptiveReduction={handleAdaptiveReduction}
            onDiagnosticsReaderChange={handleWorldDiagnosticsReaderChange}
            onReady={handleWorldReady}
            phase={phase}
            reducedMotion={reducedMotion}
            scenes={scenes}
            viewport={viewport}
          />
          <BeachScenePanels
            activeIndex={activeIndex}
            content={content}
            interactions={interactions}
            labels={labels}
            phase={phase}
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
          {diagnosticsEnabled ? (
            <JourneyRuntimeDiagnostics
              activeIndex={activeIndex}
              countersRef={diagnosticCountersRef}
              isMobile={isMobile}
              phase={phase}
              reducedMotion={reducedMotion}
              scenes={scenes}
              targetIndex={targetIndex}
              worldDiagnosticsReaderRef={worldDiagnosticsReaderRef}
              worldMode={worldMode}
            />
          ) : null}
        </Canvas>
      </BeachCanvasErrorBoundary>
    </div>
  );
}

"use client";

import { useFrame, useThree } from "@react-three/fiber";
import {
  Component,
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type MutableRefObject,
  type ReactNode,
} from "react";

import type { BeachJourneyScene } from "@/data/beach-wedding-journey";

import type { BeachJourneyCueState } from "./beach-cue-state";
import type { BeachJourneyPhase } from "./beach-journey-controller";
import {
  createBeachAdaptiveQualitySampler,
  getBeachWorldDensity,
  type BeachWorldDensity,
  type BeachWorldQualityTier,
  type BeachWorldViewport,
} from "./beach-world-data";
import { BEACH_PHOTOREAL_ASSETS } from "./photoreal/beach-asset-manifest";
import {
  BEACH_SUN_TINT,
  BEACH_SUN_WORLD_DIRECTION,
  BeachLighting,
} from "./photoreal/beach-lighting";
import {
  BeachPhotoFrames,
  type BeachPhotoDiagnostics,
} from "./photoreal/beach-photo-frames";
import {
  BeachPropAssetBoundary,
  BeachProps,
  useBeachPropTextures,
  type BeachPropTextures,
} from "./photoreal/beach-props";
import { BeachTerrain } from "./photoreal/beach-terrain";
import { BeachWater } from "./photoreal/beach-water";

/**
 * The two ways the beach can render.
 *
 * `photoreal` is the intended world: PBR sand, the HDRI sky driving both the
 * background and the environment light, and a planar water reflection. `simple`
 * is what survives when an entry asset or the HDRI fails — flat materials, no
 * HDRI, no reflection. Two modes rather than the forest's three, because the
 * beach's entry assets load as one blocking group: either the sand and sky
 * arrived, or the world has no PBR inputs at all.
 */
export type BeachWeddingWorldMode = "photoreal" | "simple";

/** Colours for the simple mode, which has no maps and no HDRI to sample. */
export const BEACH_SIMPLE_SKY_COLOR = "#f2c9a0";
export const BEACH_SIMPLE_SAND_COLOR = "#d9bd94";
export const BEACH_SIMPLE_WATER_COLOR = "#2f6a70";

/** Light intensities for the simple mode, standing in for the missing HDRI. */
const SIMPLE_AMBIENT_INTENSITY = 1.15;
const SIMPLE_SUN_INTENSITY = 1.9;

/** Extent of the simple mode's flat ground and sea planes, in metres. */
const SIMPLE_GROUND_EXTENT_METRES = 260;

/** Alongshore centre of the walk, used to centre the simple mode's planes. */
const SIMPLE_GROUND_CENTER_X_METRES = 45;

/**
 * The tier at which the planar water reflection is switched off.
 *
 * The reflection re-renders the whole scene into a second target every frame. At
 * the reduced tier the device has already reported that it cannot hold the frame
 * budget, and a second scene pass is the largest single thing available to give
 * up.
 */
export const BEACH_REFLECTION_DISABLED_TIER: BeachWorldQualityTier = "reduced";

export function isBeachReflectionEnabled(
  qualityTier: BeachWorldQualityTier,
): boolean {
  return qualityTier !== BEACH_REFLECTION_DISABLED_TIER;
}

const ENTRY_ASSET_SRCS = BEACH_PHOTOREAL_ASSETS
  .filter((asset) => asset.group === "entry")
  .map((asset) => asset.src);

/**
 * Whether a thrown value is an entry asset failing to load.
 *
 * The entry assets load through three's own `TextureLoader` and drei's
 * `Environment`, neither of which tags its failures — and wrapping them in a
 * marker-tagged loader subclass the way the props do is not available here,
 * because `useLoader` caches per loader class, so a tagged subclass would decode
 * the 1k sand set a second time and the decoded-texture budget has no room for
 * that.
 *
 * So the classification is made from what each loader actually throws.
 * `FileLoader` — under `RGBELoader` for the sky — throws an `Error` whose message
 * carries the requested URL, so an `Error` is an asset failure only when its
 * message names one of the entry sources. `ImageLoader` — under `TextureLoader`
 * for the sand and water normal — rejects with the image element's DOM
 * `ErrorEvent`, which is not an `Error` at all; React and the scene graph always
 * throw real `Error`s, so a non-`Error` reaching this boundary can only have come
 * from an image load.
 */
export function isBeachEntryAssetError(error: unknown): boolean {
  if (error instanceof Error) {
    return ENTRY_ASSET_SRCS.some((src) => error.message.includes(src));
  }
  return true;
}

type EntryBoundaryProps = {
  readonly children: ReactNode;
  readonly fallback: ReactNode;
  readonly onFallback: () => void;
};

type EntryBoundaryState = {
  readonly assetFailed: boolean;
  readonly errorToPropagate: unknown;
  readonly shouldPropagate: boolean;
};

/**
 * Switches the world to `simple` when an entry asset fails, and rethrows
 * everything else so a scene-graph bug cannot hide as a plainer beach.
 */
export class BeachEntryAssetBoundary extends Component<
  EntryBoundaryProps,
  EntryBoundaryState
> {
  override state: EntryBoundaryState = {
    assetFailed: false,
    errorToPropagate: null,
    shouldPropagate: false,
  };

  static getDerivedStateFromError(error: unknown): EntryBoundaryState {
    if (isBeachEntryAssetError(error)) {
      return {
        assetFailed: true,
        errorToPropagate: null,
        shouldPropagate: false,
      };
    }
    return {
      assetFailed: false,
      errorToPropagate: error,
      shouldPropagate: true,
    };
  }

  override componentDidCatch(error: unknown) {
    if (isBeachEntryAssetError(error)) this.props.onFallback();
  }

  override render() {
    if (this.state.shouldPropagate) throw this.state.errorToPropagate;
    return this.state.assetFailed ? this.props.fallback : this.props.children;
  }
}

export type BeachWeddingWorldDiagnostics = {
  readonly duneGrassInstanceCount: number;
  readonly frameInstanceCount: number;
  readonly framesWithoutWoodMaps: number;
  readonly photos: BeachPhotoDiagnostics | null;
  readonly postInstanceCount: number;
  readonly qualityTier: BeachWorldQualityTier;
  readonly reflectionEnabled: boolean;
  readonly worldMode: BeachWeddingWorldMode;
};

export type BeachWeddingWorldProps = {
  readonly cueRef: MutableRefObject<BeachJourneyCueState>;
  readonly onAdaptiveReduction: () => void;
  readonly onDiagnosticsReaderChange: (
    reader: (() => BeachWeddingWorldDiagnostics) | null,
  ) => void;
  readonly onReady: (mode: BeachWeddingWorldMode) => void;
  readonly phase: BeachJourneyPhase;
  readonly reducedMotion: boolean;
  readonly scenes: readonly BeachJourneyScene[];
  readonly viewport: BeachWorldViewport;
};

/**
 * Counts the frames the world will actually hang.
 *
 * A gallery scene with no photograph hangs nothing — see
 * `resolveBeachFramePlacements` — so the diagnostics count has to apply the same
 * filter or it would report frames that are not in the scene.
 */
export function countBeachFramePlacements(
  scenes: readonly BeachJourneyScene[],
): number {
  return scenes.filter(
    (scene) => scene.type === "gallery-photo" && scene.photo !== null,
  ).length;
}

/**
 * The tier a world renders at.
 *
 * Fully derived rather than stored: the viewport, the motion preference and the
 * one-way adaptive reduction are three independent inputs, and holding the
 * result in state meant an effect had to re-derive it on every viewport change
 * while guarding against undoing a reduction. `deviceReduced` wins because it
 * means the device has already failed to hold the frame budget — a later resize
 * does not make it faster.
 */
export function resolveBeachQualityTier(
  viewport: BeachWorldViewport,
  reducedMotion: boolean,
  deviceReduced: boolean,
): BeachWorldQualityTier {
  if (deviceReduced || reducedMotion) return "reduced";
  return viewport;
}

/**
 * Reports the world as ready one frame after it first renders.
 *
 * Copied from `WorldReadyReporter` in
 * `src/components/forest-wedding-journey/forest-wedding-world.tsx`; fixes must be
 * applied to both. `invalidate()` on mount is what draws the first frame at all
 * under `frameloop="demand"`, and the deferred callback is what makes "ready"
 * mean the frame reached the screen rather than that React committed.
 */
function WorldReadyReporter({
  mode,
  onReady,
}: {
  readonly mode: BeachWeddingWorldMode;
  readonly onReady: (mode: BeachWeddingWorldMode) => void;
}) {
  const invalidate = useThree(({ invalidate: fn }) => fn);
  const reportedRef = useRef(false);
  const completionFrameRef = useRef<number | null>(null);

  useEffect(() => {
    invalidate();
    return () => {
      if (completionFrameRef.current !== null) {
        window.cancelAnimationFrame(completionFrameRef.current);
        completionFrameRef.current = null;
      }
      reportedRef.current = false;
    };
  }, [invalidate]);

  useFrame(() => {
    if (reportedRef.current) return;
    reportedRef.current = true;
    completionFrameRef.current = window.requestAnimationFrame(() => {
      completionFrameRef.current = null;
      onReady(mode);
    });
  });

  return null;
}

/**
 * Drops the quality tier when frames stay slow.
 *
 * The sampler owns the outlier and streak policy; this only feeds it timestamps,
 * resets it when the tab is hidden — a deschedule is not a slow device — and
 * forwards the one reduction it ever reports.
 */
function AdaptiveQualityWatcher({
  onReduce,
}: {
  readonly onReduce: () => void;
}) {
  const sampler = useMemo(
    () => createBeachAdaptiveQualitySampler(onReduce),
    [onReduce],
  );

  useEffect(() => {
    const reset = () => sampler.reset();
    document.addEventListener("visibilitychange", reset);
    return () => document.removeEventListener("visibilitychange", reset);
  }, [sampler]);

  useFrame(({ clock }) => {
    sampler.sample(clock.getElapsedTime() * 1000);
  });

  return null;
}

/** Flat stand-in world: no HDRI, no PBR maps, no reflection. */
function SimpleBeachWorld() {
  return (
    <group data-beach-simple-world>
      <color args={[BEACH_SIMPLE_SKY_COLOR]} attach="background" />
      <ambientLight intensity={SIMPLE_AMBIENT_INTENSITY} />
      <directionalLight
        castShadow={false}
        color={BEACH_SUN_TINT}
        intensity={SIMPLE_SUN_INTENSITY}
        position={[
          BEACH_SUN_WORLD_DIRECTION[0] * 120,
          BEACH_SUN_WORLD_DIRECTION[1] * 120 + 30,
          BEACH_SUN_WORLD_DIRECTION[2] * 120,
        ]}
      />
      <mesh
        position={[SIMPLE_GROUND_CENTER_X_METRES, 0, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <planeGeometry
          args={[SIMPLE_GROUND_EXTENT_METRES, SIMPLE_GROUND_EXTENT_METRES]}
        />
        <meshStandardMaterial color={BEACH_SIMPLE_SAND_COLOR} roughness={1} />
      </mesh>
      <mesh
        position={[SIMPLE_GROUND_CENTER_X_METRES, -0.02, -160]}
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <planeGeometry
          args={[SIMPLE_GROUND_EXTENT_METRES * 4, SIMPLE_GROUND_EXTENT_METRES]}
        />
        <meshStandardMaterial
          color={BEACH_SIMPLE_WATER_COLOR}
          metalness={0.3}
          roughness={0.35}
        />
      </mesh>
    </group>
  );
}

type PropsShellProps = {
  readonly cueRef: MutableRefObject<BeachJourneyCueState>;
  readonly density: BeachWorldDensity;
  readonly onPropTexturesChange: (textures: BeachPropTextures | null) => void;
  readonly reducedMotion: boolean;
  readonly scenes: readonly BeachJourneyScene[];
};

function BeachPropsWithMaps({
  cueRef,
  density,
  onPropTexturesChange,
  reducedMotion,
  scenes,
}: PropsShellProps) {
  const textures = useBeachPropTextures();

  useEffect(() => {
    onPropTexturesChange(textures);
    return () => onPropTexturesChange(null);
  }, [onPropTexturesChange, textures]);

  return (
    <BeachProps
      cueRef={cueRef}
      density={density}
      reducedMotion={reducedMotion}
      scenes={scenes}
      textures={textures}
    />
  );
}

function BeachPropsWithoutMaps({
  cueRef,
  density,
  onPropTexturesChange,
  reducedMotion,
  scenes,
}: PropsShellProps) {
  useEffect(() => {
    onPropTexturesChange(null);
  }, [onPropTexturesChange]);

  return (
    <BeachProps
      cueRef={cueRef}
      density={density}
      reducedMotion={reducedMotion}
      scenes={scenes}
      textures={null}
    />
  );
}

/**
 * Terrain, water, lighting, frames and props at the photoreal tier.
 *
 * The prop maps load inside their own boundary because they are non-blocking: a
 * missing wood texture must degrade the moulding and the pier to flat colour
 * while the sand, sea, sky and — the point of the whole scene — the couple's
 * photographs stay. The photographs load in a third, separate `Suspense` for the
 * same reason: nothing about the shore furniture may hold them back or take them
 * away.
 */
function PhotorealBeachWorld({
  cueRef,
  density,
  onPhotoDiagnosticsChange,
  onPropTexturesChange,
  qualityTier,
  reducedMotion,
  scenes,
  woodMaps,
}: {
  readonly cueRef: MutableRefObject<BeachJourneyCueState>;
  readonly density: BeachWorldDensity;
  readonly onPhotoDiagnosticsChange: (
    reader: (() => BeachPhotoDiagnostics) | null,
  ) => void;
  readonly onPropTexturesChange: (textures: BeachPropTextures | null) => void;
  readonly qualityTier: BeachWorldQualityTier;
  readonly reducedMotion: boolean;
  readonly scenes: readonly BeachJourneyScene[];
  readonly woodMaps: BeachPropTextures | null;
}) {
  const propsShell: PropsShellProps = {
    cueRef,
    density,
    onPropTexturesChange,
    reducedMotion,
    scenes,
  };
  const flatProps = <BeachPropsWithoutMaps {...propsShell} />;

  return (
    <>
      <BeachLighting qualityTier={qualityTier} />
      <BeachTerrain qualityTier={qualityTier} />
      <BeachWater
        qualityTier={qualityTier}
        reflectionEnabled={isBeachReflectionEnabled(qualityTier)}
        sunDirection={BEACH_SUN_WORLD_DIRECTION}
      />
      <BeachPropAssetBoundary fallback={flatProps}>
        <Suspense fallback={flatProps}>
          <BeachPropsWithMaps {...propsShell} />
        </Suspense>
      </BeachPropAssetBoundary>
      <Suspense fallback={null}>
        <BeachPhotoFrames
          cueRef={cueRef}
          onPhotoDiagnosticsChange={onPhotoDiagnosticsChange}
          reducedMotion={reducedMotion}
          scenes={scenes}
          woodMaps={woodMaps ? woodMaps.frames : null}
        />
      </Suspense>
    </>
  );
}

/**
 * The beach world.
 *
 * Copied from `ForestWeddingWorld` in
 * `src/components/forest-wedding-journey/forest-wedding-world.tsx`; fixes to the
 * boundary nesting or the ready reporting must be applied to both.
 */
export function BeachWeddingWorld({
  cueRef,
  onAdaptiveReduction,
  onDiagnosticsReaderChange,
  onReady,
  phase,
  reducedMotion,
  scenes,
  viewport,
}: BeachWeddingWorldProps) {
  const [deviceReduced, setDeviceReduced] = useState(false);
  const [worldMode, setWorldMode] = useState<BeachWeddingWorldMode>("photoreal");
  const [propTextures, setPropTextures] = useState<BeachPropTextures | null>(null);
  const photoReaderRef = useRef<(() => BeachPhotoDiagnostics) | null>(null);

  const qualityTier = resolveBeachQualityTier(
    viewport,
    reducedMotion,
    deviceReduced,
  );

  const density = useMemo(
    () => getBeachWorldDensity(viewport, qualityTier),
    [qualityTier, viewport],
  );

  const handleAdaptiveReduction = useCallback(() => {
    setDeviceReduced(true);
    onAdaptiveReduction();
  }, [onAdaptiveReduction]);

  const handleEntryAssetFallback = useCallback(() => {
    setWorldMode("simple");
  }, []);

  const handlePhotoDiagnosticsChange = useCallback(
    (reader: (() => BeachPhotoDiagnostics) | null) => {
      photoReaderRef.current = reader;
    },
    [],
  );

  const frameCount = useMemo(
    () => countBeachFramePlacements(scenes),
    [scenes],
  );

  const readDiagnostics = useCallback(
    (): BeachWeddingWorldDiagnostics => ({
      duneGrassInstanceCount: density.duneGrass,
      frameInstanceCount: worldMode === "photoreal" ? frameCount : 0,
      // Either every frame has the wood maps or none does — they load as one
      // group — so this is the frame count or zero, never a partial tally.
      framesWithoutWoodMaps: worldMode === "photoreal" && propTextures === null
        ? frameCount
        : 0,
      photos: photoReaderRef.current ? photoReaderRef.current() : null,
      postInstanceCount: density.posts,
      qualityTier,
      reflectionEnabled: worldMode === "photoreal"
        && isBeachReflectionEnabled(qualityTier),
      worldMode,
    }),
    [
      density.duneGrass,
      density.posts,
      frameCount,
      propTextures,
      qualityTier,
      worldMode,
    ],
  );

  useEffect(() => {
    onDiagnosticsReaderChange(readDiagnostics);
    return () => onDiagnosticsReaderChange(null);
  }, [onDiagnosticsReaderChange, readDiagnostics]);

  // The threshold shows the cover gate only. Mounting the grass, the pier and
  // the frames behind it would pay for a world nobody has looked at yet, on the
  // one frame where the guest is waiting for a tap to respond.
  const worldMounted = phase !== "threshold";

  return (
    <>
      <WorldReadyReporter mode={worldMode} onReady={onReady} />
      <AdaptiveQualityWatcher onReduce={handleAdaptiveReduction} />
      <BeachEntryAssetBoundary
        fallback={<SimpleBeachWorld />}
        onFallback={handleEntryAssetFallback}
      >
        <Suspense fallback={<SimpleBeachWorld />}>
          {worldMounted ? (
            <PhotorealBeachWorld
              cueRef={cueRef}
              density={density}
              onPhotoDiagnosticsChange={handlePhotoDiagnosticsChange}
              onPropTexturesChange={setPropTextures}
              qualityTier={qualityTier}
              reducedMotion={reducedMotion}
              scenes={scenes}
              woodMaps={propTextures}
            />
          ) : (
            <BeachLighting qualityTier={qualityTier} />
          )}
        </Suspense>
      </BeachEntryAssetBoundary>
    </>
  );
}

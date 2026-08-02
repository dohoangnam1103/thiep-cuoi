"use client";

import { useFrame, useLoader, useThree } from "@react-three/fiber";
import {
  Component,
  Suspense,
  useEffect,
  useMemo,
  useRef,
  type MutableRefObject,
  type ReactNode,
} from "react";
import {
  RepeatWrapping,
  SRGBColorSpace,
  TextureLoader,
  type Texture,
} from "three";

import {
  type ForestJourneyContent,
  type ForestJourneyScene,
} from "@/data/forest-wedding-journey";

import { ForestAnimals } from "./forest-animals";
import type { ForestJourneyCueState } from "./forest-cue-state";
import {
  ForestEnvironment,
  type ForestMaterialTexturePack,
} from "./forest-environment";
import { ForestGate } from "./forest-gate";
import {
  ForestGalleryScene,
  ForestPhotoTextureCache,
} from "./forest-gallery-scene";
import { ForestPetals } from "./forest-petals";
import type { ForestJourneyPhase } from "./forest-journey-controller";
import {
  type ForestJourneySceneNames,
  type ForestSceneLabels,
} from "./forest-scene-content";
import type { ForestJourneyLocalInteractions } from "./forest-interactive-scenes";
import { residentSceneIndices } from "./forest-scene-residency";
import { ForestStaticScene } from "./forest-static-scenes";
import type { ForestPhotoTextureCacheDiagnostics } from "./forest-photo-texture-cache";
import {
  FOREST_ENVIRONMENT_RUNTIME_TEXTURE_SPECS,
  type ForestWorldPlacements,
} from "./forest-world-data";

export const FOREST_MATERIAL_PATHS: string[] = [
  FOREST_ENVIRONMENT_RUNTIME_TEXTURE_SPECS.foliage.src,
  FOREST_ENVIRONMENT_RUNTIME_TEXTURE_SPECS.wildflower.src,
  FOREST_ENVIRONMENT_RUNTIME_TEXTURE_SPECS.petal.src,
  FOREST_ENVIRONMENT_RUNTIME_TEXTURE_SPECS.ground.src,
];

export type ForestWeddingWorldMode = "procedural" | "textured";

export type ForestWeddingWorldProps = {
  readonly activeIndex: number;
  readonly content: ForestJourneyContent;
  readonly cueRef: MutableRefObject<ForestJourneyCueState>;
  readonly diagnosticsRef: MutableRefObject<HTMLDivElement | null>;
  readonly finaleCueActive: boolean;
  readonly gateDepartedRef: MutableRefObject<boolean>;
  readonly interactions: ForestJourneyLocalInteractions;
  readonly onPhotoDiagnosticsReaderChange: (
    reader: (() => ForestPhotoTextureCacheDiagnostics) | null,
  ) => void;
  readonly onReady: (mode: ForestWeddingWorldMode) => void;
  readonly phase: ForestJourneyPhase;
  readonly placements: ForestWorldPlacements;
  readonly reducedMotion: boolean;
  readonly sceneNames: ForestJourneySceneNames;
  readonly scenes: readonly ForestJourneyScene[];
  readonly labels: ForestSceneLabels;
  readonly targetIndex: number | null;
};

type MaterialAssetBoundaryProps = {
  readonly children: ReactNode;
  readonly fallback: ReactNode;
};

type MaterialAssetBoundaryState = {
  readonly assetFailed: boolean;
  readonly errorToPropagate: unknown;
  readonly shouldPropagate: boolean;
};

const FOREST_MATERIAL_ASSET_ERROR_MARKER = "forest-material-asset-load";

class ForestMaterialAssetError extends Error {
  constructor(url: string, error: unknown) {
    const detail = error instanceof Error ? error.message : String(error);
    super(`[${FOREST_MATERIAL_ASSET_ERROR_MARKER}] ${url}: ${detail}`);
    this.name = "ForestMaterialAssetError";
  }
}

class ForestMaterialTextureLoader extends TextureLoader {
  override load(
    url: string,
    onLoad?: (texture: Texture<HTMLImageElement>) => void,
    onProgress?: (event: ProgressEvent) => void,
    onError?: (error: unknown) => void,
  ): Texture<HTMLImageElement> {
    return super.load(url, (texture) => {
      texture.colorSpace = SRGBColorSpace;
      if (url.endsWith("/ground-detail.webp")) {
        texture.wrapS = RepeatWrapping;
        texture.wrapT = RepeatWrapping;
      }
      onLoad?.(texture);
    }, onProgress, (error) => {
      onError?.(new ForestMaterialAssetError(url, error));
    });
  }
}

function isForestMaterialAssetError(error: unknown): boolean {
  return error instanceof ForestMaterialAssetError
    || (error instanceof Error
      && error.message.includes(`[${FOREST_MATERIAL_ASSET_ERROR_MARKER}]`));
}

class MaterialAssetBoundary extends Component<
  MaterialAssetBoundaryProps,
  MaterialAssetBoundaryState
> {
  state: MaterialAssetBoundaryState = {
    assetFailed: false,
    errorToPropagate: null,
    shouldPropagate: false,
  };

  static getDerivedStateFromError(error: unknown): MaterialAssetBoundaryState {
    if (isForestMaterialAssetError(error)) {
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

  render() {
    if (this.state.shouldPropagate) {
      throw this.state.errorToPropagate;
    }

    return this.state.assetFailed ? this.props.fallback : this.props.children;
  }
}

function WorldReadyReporter({
  mode,
  onReady,
}: {
  readonly mode: ForestWeddingWorldMode;
  readonly onReady: ForestWeddingWorldProps["onReady"];
}) {
  const invalidate = useThree(({ invalidate: requestFrame }) => requestFrame);
  const completionFrameRef = useRef<number | null>(null);
  const reportedRef = useRef(false);

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

function ForestThresholdActors({
  cueRef,
  diagnosticsRef,
  finaleCueActive,
  gateDepartedRef,
  placements,
  reducedMotion,
  texturePack,
}: Pick<
  ForestWeddingWorldProps,
  | "cueRef"
  | "diagnosticsRef"
  | "finaleCueActive"
  | "gateDepartedRef"
  | "placements"
  | "reducedMotion"
> & {
  readonly texturePack: ForestMaterialTexturePack | null;
}) {
  return (
    <>
      <ForestGate
        cueRef={cueRef}
        departedRef={gateDepartedRef}
        diagnosticsRef={diagnosticsRef}
        reducedMotion={reducedMotion}
      />
      <ForestPetals
        cueRef={cueRef}
        placements={placements.petals}
        reducedMotion={reducedMotion}
        texture={texturePack?.petals ?? null}
      />
      <ForestAnimals
        cueRef={cueRef}
        finaleCueActive={finaleCueActive}
        gateDepartedRef={gateDepartedRef}
        reducedMotion={reducedMotion}
      />
    </>
  );
}

function ProvisionalProceduralWorld(props: ForestWeddingWorldProps) {
  return (
    <group>
      <mesh position={[0, -0.04, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[14, 32]} />
        <meshStandardMaterial color="#70845a" roughness={1} />
      </mesh>
      <ForestThresholdActors {...props} texturePack={null} />
    </group>
  );
}

function TerminalProceduralWorld(props: ForestWeddingWorldProps) {
  const { onReady, placements, reducedMotion } = props;
  return (
    <group>
      <ForestEnvironment
        cueRef={props.cueRef}
        placements={placements}
        reducedMotion={reducedMotion}
        texturePack={null}
      />
      <ForestThresholdActors {...props} texturePack={null} />
      <WorldReadyReporter mode="procedural" onReady={onReady} />
    </group>
  );
}

function TexturedForestWorld(props: ForestWeddingWorldProps) {
  const { onReady, placements, reducedMotion } = props;
  const textures = useLoader(
    ForestMaterialTextureLoader,
    FOREST_MATERIAL_PATHS,
  ) as [Texture, Texture, Texture, Texture];
  const [foliage, wildflowers, petals, ground] = textures;
  const renderer = useThree(({ gl }) => gl);
  const texturePack = useMemo<ForestMaterialTexturePack>(() => ({
    foliage,
    ground,
    petals,
    wildflowers,
  }), [foliage, ground, petals, wildflowers]);

  useEffect(() => {
    textures.forEach((texture) => renderer.initTexture(texture));
  }, [renderer, textures]);

  return (
    <group>
      <ForestEnvironment
        cueRef={props.cueRef}
        placements={placements}
        reducedMotion={reducedMotion}
        texturePack={texturePack}
      />
      <ForestThresholdActors {...props} texturePack={texturePack} />
      <WorldReadyReporter mode="textured" onReady={onReady} />
    </group>
  );
}

function ForestSceneAssemblies({
  activeIndex,
  content,
  interactions,
  labels,
  phase,
  photoCache,
  placements,
  sceneNames,
  scenes,
  targetIndex,
}: Pick<
  ForestWeddingWorldProps,
  "activeIndex" | "phase" | "placements" | "scenes" | "targetIndex"
> & {
  readonly content: ForestJourneyContent;
  readonly interactions: ForestJourneyLocalInteractions;
  readonly labels: ForestSceneLabels;
  readonly photoCache: ForestPhotoTextureCache;
  readonly sceneNames: ForestJourneySceneNames;
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
    const clearing = placements.clearings[index];
    if (!scene || !clearing) return null;
    const sharedProps = {
      active: index === displayedIndex,
      clearing,
      content,
      interactions,
      labels,
      scene,
      sceneName: sceneNames[scene.type],
      settled,
    };

    return scene.type === "gallery-photo" ? (
      <ForestGalleryScene
        {...sharedProps}
        cache={photoCache}
        key={scene.id}
      />
    ) : (
      <ForestStaticScene {...sharedProps} key={scene.id} />
    );
  });
}

export function ForestWeddingWorld(props: ForestWeddingWorldProps) {
  const { diagnosticsRef, onPhotoDiagnosticsReaderChange } = props;
  const photoDiagnosticsRef = useRef<HTMLDivElement | null>(null);
  const photoCache = useMemo(() => new ForestPhotoTextureCache(), []);

  useEffect(() => {
    photoDiagnosticsRef.current = diagnosticsRef.current;
    const readPhotoDiagnostics = () => photoCache.getDiagnostics();
    onPhotoDiagnosticsReaderChange(readPhotoDiagnostics);
    photoCache.setSizeReporter((size) => {
      const diagnostics = photoDiagnosticsRef.current;
      if (diagnostics) diagnostics.dataset.photoTextureCount = String(size);
    });
    return () => {
      photoCache.dispose();
      photoCache.setSizeReporter(() => {});
      onPhotoDiagnosticsReaderChange(null);
      photoDiagnosticsRef.current = null;
    };
  }, [diagnosticsRef, onPhotoDiagnosticsReaderChange, photoCache]);

  return (
    <>
      <color args={["#c9ddbd"]} attach="background" />
      <fog attach="fog" args={["#c9ddbd", 24, 112]} />
      <hemisphereLight args={["#fff5cf", "#596f54", 1.22]} />
      <ambientLight color="#fff3d4" intensity={0.42} />
      <directionalLight color="#fff2c5" intensity={1.55} position={[7, 11, 5]} />
      <group>
        <MaterialAssetBoundary
          fallback={<TerminalProceduralWorld {...props} />}
        >
          <Suspense fallback={<ProvisionalProceduralWorld {...props} />}>
            <TexturedForestWorld {...props} />
          </Suspense>
        </MaterialAssetBoundary>
      </group>
      {props.phase !== "threshold" ? (
        <ForestSceneAssemblies
          activeIndex={props.activeIndex}
          content={props.content}
          interactions={props.interactions}
          labels={props.labels}
          phase={props.phase}
          photoCache={photoCache}
          placements={props.placements}
          sceneNames={props.sceneNames}
          scenes={props.scenes}
          targetIndex={props.targetIndex}
        />
      ) : null}
    </>
  );
}

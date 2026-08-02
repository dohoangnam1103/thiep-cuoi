"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useTexture } from "@react-three/drei";
import {
  Component,
  Suspense,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  type MutableRefObject,
  type ReactNode,
} from "react";
import {
  AdditiveBlending,
  DataTexture,
  DoubleSide,
  Group,
  InstancedMesh,
  LinearFilter,
  MathUtils,
  MeshBasicMaterial,
  MeshStandardMaterial,
  Object3D,
  RepeatWrapping,
  RGBAFormat,
  SRGBColorSpace,
  Texture,
  UnsignedByteType,
} from "three";

const FOLIAGE_ATLAS_PATH =
  "/chungdoi/labs/dalat-journey/materials/foliage-atlas.webp";
const FOG_NOISE_PATH =
  "/chungdoi/labs/dalat-journey/materials/fog-noise.webp";
const WORLD_SEED = 0x0da1a7;
const SLOW_FRAME_THRESHOLD_MS = 24;
const SLOW_STREAK_THRESHOLD_MS = 2_000;

export type JourneyCueState = {
  glow: number;
  mistOpen: number;
  sceneTime: number;
  travelProgress: number;
};

export type DalatWorldBaseTier = "desktop" | "mobile";
export type DalatWorldQualityTier = DalatWorldBaseTier | "reduced";

export type DalatWorldDensity = {
  flowerInstances: number;
  flowerNearInstances: number;
  lightInstances: number;
  lightPrimaryInstances: number;
  pineInstances: number;
  pineNearInstances: number;
};

type Placement = {
  far: boolean;
  position: readonly [number, number, number];
  rotationY: number;
  scale: number;
};

export type DalatWorldPlacements = {
  flowers: readonly Placement[];
  lights: readonly Placement[];
  pines: readonly Placement[];
};

export type AdaptiveQualitySample = {
  reduced: boolean;
  slowDurationMs: number;
};

type DalatMistWorldProps = {
  cueRef: MutableRefObject<JourneyCueState>;
  density: DalatWorldDensity;
  onQualityReduce: () => void;
  onReady: () => void;
  plateFirst?: boolean;
  qualityMonitorEnabled: boolean;
  qualityTier: DalatWorldQualityTier;
};

type NatureProps = {
  cueRef: MutableRefObject<JourneyCueState>;
  placements: DalatWorldPlacements;
};

type NatureReadyReporterProps = {
  onReady: () => void;
};

type MaterialAssetBoundaryProps = {
  children: ReactNode;
  fallback: ReactNode;
};

type MaterialAssetBoundaryState = {
  failed: boolean;
};

const BASE_DENSITY = {
  desktop: {
    flowerFar: 110,
    flowerNear: 110,
    lightPrimary: 56,
    lightSecondary: 36,
    pineFar: 84,
    pineNear: 56,
  },
  mobile: {
    flowerFar: 60,
    flowerNear: 60,
    lightPrimary: 36,
    lightSecondary: 20,
    pineFar: 48,
    pineNear: 32,
  },
} as const;

export const DALAT_WORLD_PLACEMENT_Z_BOUNDS = {
  far: -40.5,
  near: 7.5,
} as const;

export const DALAT_TERRAIN_STRIPS = [
  { centerZ: 4.5, depth: 9 },
  { centerZ: -4.5, depth: 9 },
  { centerZ: -13.5, depth: 9 },
  { centerZ: -22.5, depth: 9 },
  { centerZ: -33.75, depth: 13.5 },
] as const;
const MIST_PLANE_Z = [2.7, -13.2, -28.4] as const;

function createMistGradientAlphaMap(): DataTexture {
  const width = 4;
  const height = 64;
  const data = new Uint8Array(width * height * 4);

  for (let row = 0; row < height; row += 1) {
    const progress = row / (height - 1);
    const alpha = Math.round(Math.sin(progress * Math.PI) * 255);
    for (let column = 0; column < width; column += 1) {
      const offset = (row * width + column) * 4;
      data[offset] = alpha;
      data[offset + 1] = alpha;
      data[offset + 2] = alpha;
      data[offset + 3] = 255;
    }
  }

  const texture = new DataTexture(
    data,
    width,
    height,
    RGBAFormat,
    UnsignedByteType,
  );
  texture.magFilter = LinearFilter;
  texture.minFilter = LinearFilter;
  texture.needsUpdate = true;
  return texture;
}

const PROCEDURAL_MIST_ALPHA_MAP = createMistGradientAlphaMap();

export function mulberry32(seed: number): () => number {
  let value = seed;
  return () => {
    value += 0x6d2b79f5;
    let result = value;
    result = Math.imul(result ^ (result >>> 15), result | 1);
    result ^= result + Math.imul(result ^ (result >>> 7), result | 61);
    return ((result ^ (result >>> 14)) >>> 0) / 4_294_967_296;
  };
}

export function getDalatWorldDensity(
  baseTier: DalatWorldBaseTier,
  qualityTier: DalatWorldQualityTier,
): DalatWorldDensity {
  const base = BASE_DENSITY[baseTier];
  const reduced = qualityTier === "reduced";
  const pineFar = reduced ? Math.ceil(base.pineFar / 2) : base.pineFar;
  const flowerFar = reduced ? Math.ceil(base.flowerFar / 2) : base.flowerFar;
  const lightSecondary = reduced ? 0 : base.lightSecondary;

  return {
    flowerInstances: base.flowerNear + flowerFar,
    flowerNearInstances: base.flowerNear,
    lightInstances: base.lightPrimary + lightSecondary,
    lightPrimaryInstances: base.lightPrimary,
    pineInstances: base.pineNear + pineFar,
    pineNearInstances: base.pineNear,
  };
}

function createSidePosition(
  random: () => number,
  corridorHalfWidth: number,
  spread: number,
): number {
  const side = random() < 0.5 ? -1 : 1;
  return side * (corridorHalfWidth + random() * spread);
}

function createPlacements(
  count: number,
  nearCount: number,
  random: () => number,
  nearCorridor: number,
  nearSpread: number,
  farCorridor: number,
  farSpread: number,
  scaleRange: readonly [number, number],
): Placement[] {
  return Array.from({ length: count }, (_, index) => {
    const far = index >= nearCount;
    const scale = MathUtils.lerp(scaleRange[0], scaleRange[1], random());
    return {
      far,
      position: [
        createSidePosition(
          random,
          far ? farCorridor : nearCorridor,
          far ? farSpread : nearSpread,
        ),
        0,
        MathUtils.lerp(
          DALAT_WORLD_PLACEMENT_Z_BOUNDS.near,
          DALAT_WORLD_PLACEMENT_Z_BOUNDS.far,
          random(),
        ),
      ],
      rotationY: random() * Math.PI * 2,
      scale,
    };
  });
}

export function createDalatWorldPlacements(
  density: DalatWorldDensity,
  seed = WORLD_SEED,
): DalatWorldPlacements {
  const pineRandom = mulberry32(seed ^ 0x243f6a88);
  const flowerRandom = mulberry32(seed ^ 0x85a308d3);
  const lightRandom = mulberry32(seed ^ 0x13198a2e);
  const lightHeightRandom = mulberry32(seed ^ 0x03707344);
  const pines = createPlacements(
    density.pineInstances,
    density.pineNearInstances,
    pineRandom,
    2.6,
    3.6,
    6.4,
    5.8,
    [0.72, 1.35],
  );
  const flowers = createPlacements(
    density.flowerInstances,
    density.flowerNearInstances,
    flowerRandom,
    1.75,
    2.8,
    4.8,
    4.8,
    [0.68, 1.35],
  );
  const lights = createPlacements(
    density.lightInstances,
    density.lightPrimaryInstances,
    lightRandom,
    1.65,
    3.4,
    5.2,
    4.4,
    [0.65, 1.45],
  ).map((placement) => ({
    ...placement,
    position: [
      placement.position[0],
      MathUtils.lerp(0.35, 2.25, lightHeightRandom()),
      placement.position[2],
    ] as const,
  }));

  return { flowers, lights, pines };
}

export function sampleAdaptiveQualityDelta(
  sample: AdaptiveQualitySample,
  deltaMs: number,
): AdaptiveQualitySample {
  if (sample.reduced) {
    return sample;
  }
  if (deltaMs <= SLOW_FRAME_THRESHOLD_MS) {
    return { reduced: false, slowDurationMs: 0 };
  }

  const slowDurationMs = sample.slowDurationMs + deltaMs;
  return {
    reduced: slowDurationMs >= SLOW_STREAK_THRESHOLD_MS,
    slowDurationMs,
  };
}

class MaterialAssetBoundary extends Component<
  MaterialAssetBoundaryProps,
  MaterialAssetBoundaryState
> {
  state: MaterialAssetBoundaryState = { failed: false };

  static getDerivedStateFromError(): MaterialAssetBoundaryState {
    return { failed: true };
  }

  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

function NatureReadyReporter({ onReady }: NatureReadyReporterProps) {
  const invalidate = useThree(({ invalidate: requestFrame }) => requestFrame);
  const completionFrameRef = useRef<number | null>(null);
  const reportedRef = useRef(false);

  useEffect(() => {
    invalidate();
  }, [invalidate]);

  useFrame(() => {
    if (reportedRef.current) return;
    reportedRef.current = true;
    completionFrameRef.current = window.requestAnimationFrame(() => {
      completionFrameRef.current = null;
      onReady();
    });
  });

  useEffect(() => () => {
    if (completionFrameRef.current !== null) {
      window.cancelAnimationFrame(completionFrameRef.current);
      completionFrameRef.current = null;
    }
    reportedRef.current = false;
  }, []);

  return null;
}

function AdaptiveQualityMonitor({
  enabled,
  onQualityReduce,
  qualityTier,
}: Pick<DalatMistWorldProps, "onQualityReduce" | "qualityTier"> & {
  enabled: boolean;
}) {
  const reducedRef = useRef(qualityTier === "reduced");

  useEffect(() => {
    if (!enabled) return;
    if (reducedRef.current || qualityTier === "reduced") {
      reducedRef.current = true;
      return;
    }

    let frameId: number | null = null;
    let previousTimestamp: number | null = null;
    let sample: AdaptiveQualitySample = {
      reduced: false,
      slowDurationMs: 0,
    };

    function scheduleNextFrame() {
      if (frameId === null && !reducedRef.current) {
        frameId = window.requestAnimationFrame(handleAnimationFrame);
      }
    }

    function handleAnimationFrame(timestamp: number) {
      frameId = null;
      if (document.visibilityState !== "visible") {
        previousTimestamp = null;
        sample = { reduced: false, slowDurationMs: 0 };
        return;
      }

      if (previousTimestamp !== null) {
        const nextSample = sampleAdaptiveQualityDelta(
          sample,
          timestamp - previousTimestamp,
        );
        if (!sample.reduced && nextSample.reduced) {
          sample = nextSample;
          reducedRef.current = true;
          onQualityReduce();
          return;
        }
        sample = nextSample;
      }

      previousTimestamp = timestamp;
      scheduleNextFrame();
    }

    function handleVisibilityChange() {
      previousTimestamp = null;
      sample = { reduced: false, slowDurationMs: 0 };

      if (document.visibilityState !== "visible") {
        if (frameId !== null) {
          window.cancelAnimationFrame(frameId);
          frameId = null;
        }
        return;
      }

      scheduleNextFrame();
    }

    document.addEventListener("visibilitychange", handleVisibilityChange);
    if (document.visibilityState === "visible") {
      scheduleNextFrame();
    }

    return () => {
      if (frameId !== null) {
        window.cancelAnimationFrame(frameId);
      }
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [enabled, onQualityReduce, qualityTier]);

  return null;
}

function DalatTerrain() {
  return (
    <group>
      {DALAT_TERRAIN_STRIPS.map(({ centerZ, depth }, index) => (
        <mesh
          key={centerZ}
          position={[0, -0.12 - (index % 2) * 0.015, centerZ]}
          rotation={[-Math.PI / 2, 0, 0]}
        >
          <planeGeometry args={[28, depth, 6, 2]} />
          <meshStandardMaterial
            color={index % 2 === 0 ? "#20372c" : "#263d31"}
            flatShading
            roughness={1}
          />
        </mesh>
      ))}
      <mesh position={[0, -0.055, -13.5]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[3.25, 45, 1, 15]} />
        <meshStandardMaterial color="#8a7b61" flatShading roughness={1} />
      </mesh>
    </group>
  );
}

function PineForest({
  foliageTexture,
  placements,
}: {
  foliageTexture: Texture | null;
  placements: readonly Placement[];
}) {
  const trunkRef = useRef<InstancedMesh>(null);
  const crownRef = useRef<InstancedMesh>(null);

  useLayoutEffect(() => {
    const trunks = trunkRef.current;
    const crowns = crownRef.current;
    if (!trunks || !crowns) return;

    const transform = new Object3D();
    placements.forEach((placement, index) => {
      const [x, , z] = placement.position;
      const trunkHeight = 2.15 * placement.scale;
      transform.position.set(x, trunkHeight / 2, z);
      transform.rotation.set(0, placement.rotationY, 0);
      transform.scale.set(
        0.16 * placement.scale,
        trunkHeight,
        0.16 * placement.scale,
      );
      transform.updateMatrix();
      trunks.setMatrixAt(index, transform.matrix);

      transform.position.set(x, trunkHeight + 0.9 * placement.scale, z);
      transform.scale.set(
        1.05 * placement.scale,
        2.35 * placement.scale,
        1.05 * placement.scale,
      );
      transform.updateMatrix();
      crowns.setMatrixAt(index, transform.matrix);
    });

    trunks.instanceMatrix.needsUpdate = true;
    crowns.instanceMatrix.needsUpdate = true;
    trunks.computeBoundingSphere();
    crowns.computeBoundingSphere();
  }, [placements]);

  return (
    <group>
      <instancedMesh
        args={[undefined, undefined, placements.length]}
        ref={trunkRef}
      >
        <cylinderGeometry args={[1, 1, 1, 5]} />
        <meshStandardMaterial color="#48382b" roughness={1} />
      </instancedMesh>
      <instancedMesh
        args={[undefined, undefined, placements.length]}
        ref={crownRef}
      >
        <coneGeometry args={[1, 1, 7]} />
        <meshStandardMaterial
          alphaTest={foliageTexture ? 0.12 : 0}
          color={foliageTexture ? "#d8ead5" : "#294f3a"}
          map={foliageTexture}
          roughness={0.92}
          transparent={Boolean(foliageTexture)}
        />
      </instancedMesh>
    </group>
  );
}

function FlowerHeads({ placements }: { placements: readonly Placement[] }) {
  const flowersRef = useRef<InstancedMesh>(null);

  useLayoutEffect(() => {
    const flowers = flowersRef.current;
    if (!flowers) return;

    const transform = new Object3D();
    placements.forEach((placement, index) => {
      const [x, , z] = placement.position;
      transform.position.set(x, 0.12 + placement.scale * 0.08, z);
      transform.rotation.set(0, placement.rotationY, 0);
      transform.scale.setScalar(placement.scale);
      transform.updateMatrix();
      flowers.setMatrixAt(index, transform.matrix);
    });
    flowers.instanceMatrix.needsUpdate = true;
    flowers.computeBoundingSphere();
  }, [placements]);

  return (
    <instancedMesh
      args={[undefined, undefined, placements.length]}
      ref={flowersRef}
    >
      <dodecahedronGeometry args={[0.12, 0]} />
      <meshStandardMaterial
        color="#e6b7b0"
        emissive="#713b43"
        emissiveIntensity={0.18}
        roughness={0.86}
      />
    </instancedMesh>
  );
}

function LightPoints({
  cueRef,
  placements,
}: {
  cueRef: MutableRefObject<JourneyCueState>;
  placements: readonly Placement[];
}) {
  const groupRef = useRef<Group>(null);
  const lightsRef = useRef<InstancedMesh>(null);
  const materialRef = useRef<MeshBasicMaterial>(null);

  useLayoutEffect(() => {
    const lights = lightsRef.current;
    if (!lights) return;

    const transform = new Object3D();
    placements.forEach((placement, index) => {
      const [x, y, z] = placement.position;
      transform.position.set(x, y, z);
      transform.rotation.set(0, placement.rotationY, 0);
      transform.scale.setScalar(placement.scale);
      transform.updateMatrix();
      lights.setMatrixAt(index, transform.matrix);
    });
    lights.instanceMatrix.needsUpdate = true;
    lights.computeBoundingSphere();
  }, [placements]);

  useFrame(() => {
    const cue = cueRef.current;
    if (groupRef.current) {
      groupRef.current.position.y = Math.sin(cue.sceneTime * 0.6) * 0.035;
    }
    if (materialRef.current) {
      materialRef.current.opacity = MathUtils.clamp(
        0.48 + cue.glow * 0.42,
        0.35,
        0.95,
      );
    }
  });

  return (
    <group ref={groupRef}>
      <instancedMesh
        args={[undefined, undefined, placements.length]}
        ref={lightsRef}
      >
        <sphereGeometry args={[0.055, 5, 4]} />
        <meshBasicMaterial
          blending={AdditiveBlending}
          color="#f4d98c"
          depthWrite={false}
          opacity={0.55}
          ref={materialRef}
          transparent
        />
      </instancedMesh>
    </group>
  );
}

function MistLayers({
  alphaMap,
  cueRef,
  subtle = false,
}: {
  alphaMap: Texture;
  cueRef: MutableRefObject<JourneyCueState>;
  subtle?: boolean;
}) {
  const groupRef = useRef<Group>(null);
  const materialRefs = useRef<Array<MeshBasicMaterial | null>>([]);

  useFrame(() => {
    const cue = cueRef.current;
    if (groupRef.current) {
      groupRef.current.position.x = cue.mistOpen * 0.4;
      groupRef.current.position.y = Math.sin(cue.sceneTime * 0.24) * 0.06;
    }
    materialRefs.current.forEach((material, index) => {
      if (!material) return;
      const openAmount = index === 0 ? cue.mistOpen * 0.16 : 0;
      const baseOpacity = subtle ? 0.15 : 0.32;
      material.opacity = MathUtils.clamp(
        baseOpacity - openAmount + Math.sin(cue.sceneTime * 0.2 + index) * 0.018,
        subtle ? 0.06 : 0.12,
        subtle ? 0.2 : 0.38,
      );
    });
  });

  return (
    <group ref={groupRef}>
      {MIST_PLANE_Z.map((z, index) => (
        <mesh
          key={z}
          position={[index % 2 === 0 ? -0.5 : 0.65, 2.1, z]}
          rotation={[0, index % 2 === 0 ? 0.08 : -0.08, 0]}
        >
          <planeGeometry args={[16, 4.8, 1, 1]} />
          <meshBasicMaterial
            alphaMap={alphaMap}
            color={subtle ? "#d7e5dc" : "#c3d0c8"}
            depthWrite={false}
            opacity={0.3}
            ref={(material) => {
              materialRefs.current[index] = material;
            }}
            side={DoubleSide}
            transparent
          />
        </mesh>
      ))}
    </group>
  );
}

function ProceduralNature({ cueRef, placements }: NatureProps) {
  return (
    <group>
      <PineForest foliageTexture={null} placements={placements.pines} />
      <FlowerHeads placements={placements.flowers} />
      <MistLayers alphaMap={PROCEDURAL_MIST_ALPHA_MAP} cueRef={cueRef} />
    </group>
  );
}

function ReadyProceduralNature({
  cueRef,
  onReady,
  placements,
}: NatureProps & NatureReadyReporterProps) {
  return (
    <group>
      <ProceduralNature cueRef={cueRef} placements={placements} />
      <NatureReadyReporter onReady={onReady} />
    </group>
  );
}

function TexturedNature({
  cueRef,
  onReady,
  placements,
}: NatureProps & NatureReadyReporterProps) {
  const [sourceFoliageTexture, sourceFogTexture] = useTexture([
    FOLIAGE_ATLAS_PATH,
    FOG_NOISE_PATH,
  ]) as [Texture, Texture];
  const [foliageTexture, fogTexture] = useMemo(() => {
    const foliage = sourceFoliageTexture.clone();
    const fog = sourceFogTexture.clone();
    foliage.colorSpace = SRGBColorSpace;
    foliage.needsUpdate = true;
    fog.wrapS = RepeatWrapping;
    fog.wrapT = RepeatWrapping;
    fog.repeat.set(1.5, 1);
    fog.needsUpdate = true;
    return [foliage, fog] as const;
  }, [sourceFogTexture, sourceFoliageTexture]);

  useEffect(() => () => {
    foliageTexture.dispose();
    fogTexture.dispose();
  }, [fogTexture, foliageTexture]);

  return (
    <group>
      <PineForest
        foliageTexture={foliageTexture}
        placements={placements.pines}
      />
      <FlowerHeads placements={placements.flowers} />
      <MistLayers alphaMap={fogTexture} cueRef={cueRef} />
      <NatureReadyReporter onReady={onReady} />
    </group>
  );
}

function MistGate({ cueRef }: { cueRef: MutableRefObject<JourneyCueState> }) {
  const leftGateRef = useRef<Group>(null);
  const rightGateRef = useRef<Group>(null);

  useFrame(() => {
    const opening = MathUtils.clamp(cueRef.current.mistOpen, 0, 1);
    if (leftGateRef.current) leftGateRef.current.position.x = -opening * 0.55;
    if (rightGateRef.current) rightGateRef.current.position.x = opening * 0.55;
  });

  return (
    <group position={[0, 0, 4]}>
      <group ref={leftGateRef}>
        <mesh position={[-2, 1.2, 0]}>
          <boxGeometry args={[0.55, 2.4, 0.65]} />
          <meshStandardMaterial color="#65756a" flatShading roughness={1} />
        </mesh>
      </group>
      <group ref={rightGateRef}>
        <mesh position={[2, 1.2, 0]}>
          <boxGeometry args={[0.55, 2.4, 0.65]} />
          <meshStandardMaterial color="#65756a" flatShading roughness={1} />
        </mesh>
      </group>
      <mesh position={[0, 2.28, 0]}>
        <torusGeometry args={[2.04, 0.25, 4, 12, Math.PI]} />
        <meshStandardMaterial color="#718078" flatShading roughness={1} />
      </mesh>
      <mesh position={[-1.35, 1.24, 0.28]}>
        <boxGeometry args={[1.4, 1.5, 0.22]} />
        <meshStandardMaterial color="#59675f" flatShading roughness={1} />
      </mesh>
    </group>
  );
}

function MemoryPines() {
  return (
    <group position={[0, 0, -6]}>
      <mesh position={[-1.25, 0.48, 0]} rotation={[0, 0.2, 0]}>
        <boxGeometry args={[1.45, 0.95, 0.28]} />
        <meshStandardMaterial color="#59675d" flatShading roughness={1} />
      </mesh>
      <mesh position={[1.1, 0.62, -0.35]} rotation={[0, -0.18, 0]}>
        <boxGeometry args={[1.25, 1.2, 0.28]} />
        <meshStandardMaterial color="#4d5e53" flatShading roughness={1} />
      </mesh>
      <mesh position={[0, 0.11, 0.45]}>
        <cylinderGeometry args={[1.2, 1.35, 0.22, 7]} />
        <meshStandardMaterial color="#756d5b" flatShading roughness={1} />
      </mesh>
    </group>
  );
}

function TimeGlasshouse() {
  return (
    <group position={[0, 0, -15]}>
      <mesh position={[0, 1.25, 0]}>
        <boxGeometry args={[4.4, 2.5, 3.4]} />
        <meshStandardMaterial
          color="#a8c1b5"
          depthWrite={false}
          opacity={0.22}
          roughness={0.4}
          transparent
        />
      </mesh>
      {[-2.2, 2.2].flatMap((x) =>
        [-1.7, 1.7].map((z) => (
          <mesh key={`${x}-${z}`} position={[x, 1.25, z]}>
            <boxGeometry args={[0.12, 2.6, 0.12]} />
            <meshStandardMaterial color="#b5a773" roughness={0.75} />
          </mesh>
        )),
      )}
      <mesh position={[0, 2.72, 0]} rotation={[0, Math.PI / 4, 0]}>
        <coneGeometry args={[3.15, 1.15, 4]} />
        <meshStandardMaterial
          color="#829b91"
          opacity={0.35}
          roughness={0.5}
          transparent
        />
      </mesh>
    </group>
  );
}

function LakePavilion() {
  return (
    <group position={[0, 0, -25]}>
      <mesh position={[0, -0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[7.2, 24]} />
        <meshBasicMaterial
          color="#355f61"
          depthWrite={false}
          opacity={0.72}
          transparent
        />
      </mesh>
      <mesh position={[0, 0.12, 0]}>
        <cylinderGeometry args={[2.2, 2.35, 0.24, 8]} />
        <meshStandardMaterial color="#75634c" flatShading roughness={1} />
      </mesh>
      {[-1.5, 1.5].flatMap((x) =>
        [-0.9, 0.9].map((z) => (
          <mesh key={`${x}-${z}`} position={[x, 1.35, z]}>
            <cylinderGeometry args={[0.1, 0.13, 2.5, 6]} />
            <meshStandardMaterial color="#72563f" roughness={0.9} />
          </mesh>
        )),
      )}
      <mesh position={[0, 1.28, 1.02]}>
        <boxGeometry args={[2.3, 1.35, 0.12]} />
        <meshStandardMaterial color="#614b38" flatShading roughness={0.92} />
      </mesh>
      <mesh position={[0, 2.75, 0]} rotation={[0, Math.PI / 4, 0]}>
        <coneGeometry args={[3.2, 1.2, 4]} />
        <meshStandardMaterial color="#5a4439" flatShading roughness={1} />
      </mesh>
    </group>
  );
}

function WishValley({ cueRef }: { cueRef: MutableRefObject<JourneyCueState> }) {
  const glowMaterialRef = useRef<MeshStandardMaterial>(null);

  useFrame(() => {
    if (!glowMaterialRef.current) return;
    glowMaterialRef.current.emissiveIntensity = MathUtils.clamp(
      0.2 + cueRef.current.glow * 1.15,
      0.2,
      1.35,
    );
  });

  return (
    <group position={[0, 0, -36]}>
      <mesh position={[0, 0.62, 0]}>
        <cylinderGeometry args={[1.45, 1.75, 1.25, 7]} />
        <meshStandardMaterial color="#716b58" flatShading roughness={1} />
      </mesh>
      <mesh position={[0, 1.4, 0]} rotation={[-0.28, 0, 0]}>
        <boxGeometry args={[1.7, 0.16, 1.15]} />
        <meshStandardMaterial
          color="#ddc57f"
          emissive="#b98a45"
          emissiveIntensity={0.2}
          ref={glowMaterialRef}
          roughness={0.72}
        />
      </mesh>
      <mesh position={[0, 2.8, -0.7]}>
        <torusGeometry args={[2.8, 0.18, 5, 16, Math.PI]} />
        <meshStandardMaterial color="#887d65" flatShading roughness={1} />
      </mesh>
    </group>
  );
}

export function DalatMistWorld({
  cueRef,
  density,
  onQualityReduce,
  onReady,
  plateFirst = true,
  qualityMonitorEnabled,
  qualityTier,
}: DalatMistWorldProps) {
  const placements = useMemo(
    () => createDalatWorldPlacements(density),
    [density],
  );

  const proceduralNature = (
    <ProceduralNature cueRef={cueRef} placements={placements} />
  );
  const readyProceduralNature = (
    <ReadyProceduralNature
      cueRef={cueRef}
      onReady={onReady}
      placements={placements}
    />
  );

  return (
    <group>
      <fog attach="fog" args={["#a8b7ad", 11, 56]} />
      <ambientLight color="#b8c6ba" intensity={0.85} />
      <directionalLight
        color="#e4d4a5"
        intensity={1.05}
        position={[5, 9, 5]}
      />
      {plateFirst ? null : (
        <>
          <DalatTerrain />
          <MistGate cueRef={cueRef} />
          <MemoryPines />
          <TimeGlasshouse />
          <LakePavilion />
          <WishValley cueRef={cueRef} />
        </>
      )}
      {plateFirst ? (
        <MistLayers
          alphaMap={PROCEDURAL_MIST_ALPHA_MAP}
          cueRef={cueRef}
          subtle
        />
      ) : null}
      <LightPoints cueRef={cueRef} placements={placements.lights} />
      <group visible={!plateFirst}>
        <MaterialAssetBoundary fallback={readyProceduralNature}>
          <Suspense fallback={proceduralNature}>
            <TexturedNature
              cueRef={cueRef}
              onReady={onReady}
              placements={placements}
            />
          </Suspense>
        </MaterialAssetBoundary>
      </group>
      <AdaptiveQualityMonitor
        enabled={qualityMonitorEnabled}
        onQualityReduce={onQualityReduce}
        qualityTier={qualityTier}
      />
    </group>
  );
}

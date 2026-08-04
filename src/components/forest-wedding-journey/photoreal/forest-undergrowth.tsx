"use client";

import { useFrame } from "@react-three/fiber";
import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  type MutableRefObject,
} from "react";
import {
  BufferGeometry,
  Color,
  DoubleSide,
  IcosahedronGeometry,
  InstancedBufferAttribute,
  InstancedMesh,
  MeshStandardMaterial,
  Object3D,
  type Texture,
} from "three";

import type { ForestJourneyCueState } from "../forest-cue-state";
import type {
  ForestTreePlacement,
  ForestWorldPlacement,
} from "../forest-world-data";
import {
  createForestCrossedCardGeometry,
  FOREST_CONIFER_CELL_COUNT,
} from "./forest-card-geometry";
import {
  groupForestPlacementsByChunk,
  residentForestChunkIndices,
} from "./forest-environment-chunks";
import {
  FOREST_ALPHA_FOLIAGE_MATERIAL_POLICY,
  FOREST_FOLIAGE_TRANSLUCENCY_POLICY,
  FOREST_PBR_SURFACE_POLICIES,
} from "./forest-material-policy";
import { attachForestWind, driveForestWind } from "./forest-wind-material";

export type ForestUndergrowthProps = {
  readonly activeIndex: number;
  readonly chunkCount: number;
  readonly coniferArm: Texture;
  readonly coniferColor: Texture;
  readonly coniferNormal: Texture;
  readonly cueRef: MutableRefObject<ForestJourneyCueState>;
  readonly grass: readonly ForestWorldPlacement[];
  readonly groundArm: Texture;
  readonly groundColor: Texture;
  readonly groundNormal: Texture;
  readonly reducedMotion: boolean;
  readonly roots: readonly ForestWorldPlacement[];
  readonly shrubs: readonly ForestWorldPlacement[];
  readonly stones: readonly ForestWorldPlacement[];
  readonly targetIndex: number | null;
  readonly wildflowers: readonly ForestTreePlacement[];
};

type CardInstance = {
  readonly position: readonly [number, number, number];
  readonly rotationY: number;
  readonly scale: readonly [number, number, number];
  readonly tint: number;
  readonly windPhase: number;
};

type SolidInstance = {
  readonly position: readonly [number, number, number];
  readonly rotation: readonly [number, number, number];
  readonly scale: readonly [number, number, number];
  readonly tint: number;
};

const GRASS_WIND_HEIGHT = 0.9;
const FERN_WIND_HEIGHT = 1.35;

type ConiferMaps = {
  readonly arm: Texture;
  readonly color: Texture;
  readonly normal: Texture;
};

function createFoliageSurface(
  maps: ConiferMaps,
  aoMapIntensity: number,
  windHeight: number,
) {
  const material = new MeshStandardMaterial({
    // No `alphaMap` — see the note in forest-tree-layers.tsx: alphaMap reads the
    // green channel, so aiming it at the albedo throws away the atlas's real
    // cutout and shreds the cards.
    alphaTest: FOREST_ALPHA_FOLIAGE_MATERIAL_POLICY.alphaTest,
    aoMap: maps.arm,
    aoMapIntensity,
    depthWrite: FOREST_ALPHA_FOLIAGE_MATERIAL_POLICY.depthWrite,
    // Backlit leaf transmission; see FOREST_FOLIAGE_TRANSLUCENCY_POLICY. Fern
    // and grass blades are thinner than needles, but they are lit by the same
    // hemisphere and crushed by the same tone curve.
    emissive: new Color(FOREST_FOLIAGE_TRANSLUCENCY_POLICY.emissiveColor),
    emissiveIntensity: FOREST_FOLIAGE_TRANSLUCENCY_POLICY.emissiveIntensity,
    emissiveMap: maps.color,
    map: maps.color,
    metalness: FOREST_PBR_SURFACE_POLICIES.conifer.metalness,
    normalMap: maps.normal,
    roughness: FOREST_PBR_SURFACE_POLICIES.conifer.roughness,
    roughnessMap: maps.arm,
    side: DoubleSide,
    transparent: FOREST_ALPHA_FOLIAGE_MATERIAL_POLICY.transparent,
  });

  return { material, wind: attachForestWind(material, windHeight) };
}

function useCardCell(
  instances: readonly CardInstance[],
  geometry: BufferGeometry,
) {
  const meshRef = useRef<InstancedMesh | null>(null);

  useLayoutEffect(() => {
    const mesh = meshRef.current;
    if (!mesh) return;
    const object = new Object3D();
    const color = new Color();
    const windValues = new Float32Array(Math.max(1, instances.length));

    instances.forEach((instance, index) => {
      object.position.set(...instance.position);
      object.rotation.set(0, instance.rotationY, 0);
      object.scale.set(...instance.scale);
      object.updateMatrix();
      mesh.setMatrixAt(index, object.matrix);
      mesh.setColorAt(index, color.setHex(instance.tint));
      windValues[index] = instance.windPhase;
    });

    geometry.setAttribute(
      "instanceWindPhase",
      new InstancedBufferAttribute(windValues, 1),
    );
    mesh.count = instances.length;
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    mesh.computeBoundingSphere();
  }, [geometry, instances]);

  return meshRef;
}

function CardCell({
  atlasCell,
  atlasName,
  instances,
  material,
}: {
  readonly atlasCell: number;
  readonly atlasName: "conifer" | "wildflower";
  readonly instances: readonly CardInstance[];
  readonly material: MeshStandardMaterial;
}) {
  const geometry = useMemo(
    () => createForestCrossedCardGeometry(atlasName, atlasCell),
    [atlasCell, atlasName],
  );
  const meshRef = useCardCell(instances, geometry);

  useEffect(() => () => geometry.dispose(), [geometry]);

  if (instances.length === 0) return null;
  return (
    <instancedMesh
      args={[geometry, material, instances.length]}
      castShadow={false}
      receiveShadow={false}
      ref={meshRef}
    />
  );
}

function SolidCluster({
  geometry,
  instances,
  material,
}: {
  readonly geometry: BufferGeometry;
  readonly instances: readonly SolidInstance[];
  readonly material: MeshStandardMaterial;
}) {
  const meshRef = useRef<InstancedMesh | null>(null);

  useLayoutEffect(() => {
    const mesh = meshRef.current;
    if (!mesh) return;
    const object = new Object3D();
    const color = new Color();

    instances.forEach((instance, index) => {
      object.position.set(...instance.position);
      object.rotation.set(...instance.rotation);
      object.scale.set(...instance.scale);
      object.updateMatrix();
      mesh.setMatrixAt(index, object.matrix);
      mesh.setColorAt(index, color.setHex(instance.tint));
    });

    mesh.count = instances.length;
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    mesh.computeBoundingSphere();
  }, [instances]);

  if (instances.length === 0) return null;
  return (
    <instancedMesh
      args={[geometry, material, instances.length]}
      castShadow={false}
      receiveShadow={false}
      ref={meshRef}
    />
  );
}

function distributeCards(
  items: readonly ForestWorldPlacement[],
  cellCount: number,
  toInstance: (item: ForestWorldPlacement, index: number) => CardInstance,
  cellOf: (item: ForestWorldPlacement, index: number) => number,
): readonly (readonly CardInstance[])[] {
  const perCell: CardInstance[][] = Array.from(
    { length: cellCount },
    () => [],
  );
  items.forEach((item, index) => {
    perCell[cellOf(item, index) % cellCount]!.push(toInstance(item, index));
  });
  return perCell;
}

/**
 * Undergrowth is the heaviest alpha layer in the scene, so it follows the same
 * residency window as the conifer chunks: only the clearing the guest stands in
 * and its immediate neighbours carry grass, ferns, flowers and litter. Distant
 * chunks would be hidden behind the mid-forest anyway, and paying their
 * fill-rate cost is what pushes software renderers below interactive frame
 * rates.
 */
function useResidentPlacements<Placement extends ForestWorldPlacement>(
  placements: readonly Placement[],
  activeIndex: number,
  targetIndex: number | null,
  chunkCount: number,
): readonly Placement[] {
  const chunks = useMemo(
    () => groupForestPlacementsByChunk(placements, chunkCount),
    [chunkCount, placements],
  );
  const resident = useMemo(
    () => residentForestChunkIndices(activeIndex, targetIndex, chunkCount),
    [activeIndex, chunkCount, targetIndex],
  );

  return useMemo(
    () => resident.flatMap((index) => chunks[index] ?? []),
    [chunks, resident],
  );
}

export function ForestPhotorealUndergrowth({
  activeIndex,
  chunkCount,
  coniferArm,
  coniferColor,
  coniferNormal,
  cueRef,
  grass: allGrass,
  groundArm,
  groundColor,
  groundNormal,
  reducedMotion,
  roots: allRoots,
  shrubs: allShrubs,
  stones: allStones,
  targetIndex,
  wildflowers: allWildflowers,
}: ForestUndergrowthProps) {
  const grass = useResidentPlacements(
    allGrass,
    activeIndex,
    targetIndex,
    chunkCount,
  );
  const shrubs = useResidentPlacements(
    allShrubs,
    activeIndex,
    targetIndex,
    chunkCount,
  );
  const wildflowers = useResidentPlacements(
    allWildflowers,
    activeIndex,
    targetIndex,
    chunkCount,
  );
  const stones = useResidentPlacements(
    allStones,
    activeIndex,
    targetIndex,
    chunkCount,
  );
  const roots = useResidentPlacements(
    allRoots,
    activeIndex,
    targetIndex,
    chunkCount,
  );

  const grassSurface = useMemo(
    () => createFoliageSurface(
      { arm: coniferArm, color: coniferColor, normal: coniferNormal },
      0.6,
      GRASS_WIND_HEIGHT,
    ),
    [coniferArm, coniferColor, coniferNormal],
  );

  const fernSurface = useMemo(
    () => createFoliageSurface(
      { arm: coniferArm, color: coniferColor, normal: coniferNormal },
      0.78,
      FERN_WIND_HEIGHT,
    ),
    [coniferArm, coniferColor, coniferNormal],
  );

  const grassMaterial = grassSurface.material;
  const fernMaterial = fernSurface.material;

  const litterMaterial = useMemo(() => new MeshStandardMaterial({
    aoMap: groundArm,
    aoMapIntensity: 0.9,
    emissiveIntensity: FOREST_PBR_SURFACE_POLICIES.ground.emissiveIntensity,
    map: groundColor,
    metalness: FOREST_PBR_SURFACE_POLICIES.ground.metalness,
    normalMap: groundNormal,
    roughness: FOREST_PBR_SURFACE_POLICIES.ground.roughness,
    roughnessMap: groundArm,
  }), [groundArm, groundColor, groundNormal]);

  const stoneGeometry = useMemo(() => new IcosahedronGeometry(0.5, 0), []);
  const rootGeometry = useMemo(() => new IcosahedronGeometry(0.5, 0), []);

  const grassCells = useMemo(
    () => distributeCards(
      grass,
      FOREST_CONIFER_CELL_COUNT,
      (item, index) => ({
        position: [item.position[0], item.position[1], item.position[2]],
        rotationY: item.rotation[1] + index * 0.37,
        scale: [
          0.86 * item.scale,
          (0.72 + (index % 4) * 0.09) * item.scale,
          0.86 * item.scale,
        ],
        tint: item.tint,
        windPhase: item.windPhase,
      }),
      (_item, index) => index,
    ),
    [grass],
  );

  const fernCells = useMemo(
    () => distributeCards(
      shrubs,
      FOREST_CONIFER_CELL_COUNT,
      (item, index) => ({
        position: [item.position[0], item.position[1], item.position[2]],
        rotationY: item.rotation[1] + index * 0.83,
        scale: [
          1.44 * item.scale,
          (1.06 + (index % 3) * 0.14) * item.scale,
          1.44 * item.scale,
        ],
        tint: item.tint,
        windPhase: item.windPhase,
      }),
      (_item, index) => index + 2,
    ),
    [shrubs],
  );

  const wildflowerCells = useMemo(() => {
    const perCell: CardInstance[][] = Array.from({ length: 12 }, () => []);
    wildflowers.forEach((flower, index) => {
      perCell[flower.atlasCell % 12]!.push({
        position: [flower.position[0], flower.position[1], flower.position[2]],
        rotationY: flower.rotation[1] + index * 0.51,
        scale: [
          0.74 * flower.scale,
          0.92 * flower.scale,
          0.74 * flower.scale,
        ],
        tint: flower.tint,
        windPhase: flower.windPhase,
      });
    });
    return perCell;
  }, [wildflowers]);

  const stoneInstances = useMemo<readonly SolidInstance[]>(
    () => stones.map((item) => ({
      position: [
        item.position[0],
        item.position[1] + 0.16 * item.scale,
        item.position[2],
      ],
      rotation: item.rotation,
      scale: [1.28 * item.scale, 0.62 * item.scale, 1.06 * item.scale],
      tint: item.tint,
    })),
    [stones],
  );

  const rootInstances = useMemo<readonly SolidInstance[]>(
    () => roots.map((item) => ({
      position: [item.position[0], item.position[1] + 0.05, item.position[2]],
      rotation: [item.rotation[0] * 0.4, item.rotation[1], Math.PI / 2],
      scale: [0.36 * item.scale, 1.7 * item.scale, 0.34 * item.scale],
      tint: 0xa78a6c,
    })),
    [roots],
  );

  useEffect(() => () => {
    stoneGeometry.dispose();
    rootGeometry.dispose();
  }, [rootGeometry, stoneGeometry]);

  useEffect(() => () => {
    grassMaterial.dispose();
    fernMaterial.dispose();
    litterMaterial.dispose();
  }, [fernMaterial, grassMaterial, litterMaterial]);

  useFrame(({ clock }) => {
    const time = clock.getElapsedTime();
    const cueWind = cueRef.current.windStrength;
    driveForestWind(
      grassSurface.wind,
      time,
      0.05 + cueWind * 0.042,
      reducedMotion,
    );
    driveForestWind(
      fernSurface.wind,
      time,
      0.03 + cueWind * 0.026,
      reducedMotion,
    );
  });

  return (
    <group name="forest-photoreal-undergrowth">
      {grassCells.map((instances, atlasCell) => (
        <CardCell
          atlasCell={atlasCell}
          atlasName="conifer"
          instances={instances}
          key={`grass-${atlasCell}`}
          material={grassMaterial}
        />
      ))}
      {fernCells.map((instances, atlasCell) => (
        <CardCell
          atlasCell={atlasCell}
          atlasName="conifer"
          instances={instances}
          key={`fern-${atlasCell}`}
          material={fernMaterial}
        />
      ))}
      {wildflowerCells.map((instances, atlasCell) => (
        <CardCell
          atlasCell={atlasCell}
          atlasName="wildflower"
          instances={instances}
          key={`flower-${atlasCell}`}
          material={fernMaterial}
        />
      ))}
      <SolidCluster
        geometry={stoneGeometry}
        instances={stoneInstances}
        material={litterMaterial}
      />
      <SolidCluster
        geometry={rootGeometry}
        instances={rootInstances}
        material={litterMaterial}
      />
    </group>
  );
}

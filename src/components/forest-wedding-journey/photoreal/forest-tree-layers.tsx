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
  InstancedBufferAttribute,
  InstancedMesh,
  MeshStandardMaterial,
  Object3D,
  type Texture,
} from "three";

import type { ForestJourneyCueState } from "../forest-cue-state";
import type {
  ForestFarTreePlacement,
  ForestTreePlacement,
  ForestWorldQualityTier,
} from "../forest-world-data";
import {
  createForestCrossedCardGeometry,
  createForestTrunkGeometry,
  FOREST_CONIFER_CELL_COUNT,
} from "./forest-card-geometry";
import { planForestConiferChunks, type ForestConiferChunkPlan } from "./forest-chunk-plan";
import type { ForestLod } from "./forest-lod-policy";
import {
  FOREST_ALPHA_FOLIAGE_MATERIAL_POLICY,
  FOREST_FOLIAGE_TRANSLUCENCY_POLICY,
  FOREST_PBR_SURFACE_POLICIES,
} from "./forest-material-policy";
import {
  attachForestWind,
  driveForestWind,
} from "./forest-wind-material";

export type ForestTreeLayersProps = {
  readonly activeIndex: number;
  readonly armMap: Texture;
  readonly chunkCount: number;
  readonly colorMap: Texture;
  readonly cueRef: MutableRefObject<ForestJourneyCueState>;
  readonly farTrees: readonly ForestFarTreePlacement[];
  readonly heroTrees: readonly ForestTreePlacement[];
  readonly midTrees: readonly ForestTreePlacement[];
  readonly normalMap: Texture;
  readonly qualityTier: ForestWorldQualityTier;
  readonly reducedMotion: boolean;
  readonly targetIndex: number | null;
};

type BranchInstance = {
  readonly position: readonly [number, number, number];
  readonly rotationY: number;
  readonly scale: readonly [number, number, number];
  readonly tilt: number;
  readonly tint: number;
  readonly windPhase: number;
};

type BranchTier = {
  readonly lift: number;
  readonly reach: number;
  readonly span: number;
};

const TRUNK_HEIGHT = 5.1;
const BRANCH_WIND_HEIGHT = 5;
const TRUNK_WIND_HEIGHT = 5.1;

/**
 * Card height as a fraction of its span.
 *
 * Held constant across every tier and LOD because the atlas depends on it: a
 * branch subject fills its square cell anisotropically during preparation, and
 * this is the factor that displays the square cell wider than tall and so undoes
 * that squash. Changing it per tier would smear the needles on some cards. See
 * `BRANCH_MAX_SUBJECT_SQUASH` in scripts/prepare-forest-photoreal-assets.mjs.
 */
const BRANCH_CARD_ASPECT = 0.74;

/**
 * Bottom skirt is widest; the crown tapers to a spire.
 *
 * Each LOD's ladder has to carry cards up to roughly `TRUNK_HEIGHT`, or the
 * trunk continues past the canopy as a bare spike — the "only the lower half
 * renders" silhouette. The hero ladder already reached 4.85 m, which is why the
 * defect only showed on the mid and impostor bands.
 */
const HERO_BRANCH_TIERS: readonly BranchTier[] = [
  { lift: 0.94, reach: 0.62, span: 2.46 },
  { lift: 1.86, reach: 0.54, span: 2.08 },
  { lift: 2.72, reach: 0.44, span: 1.68 },
  { lift: 3.52, reach: 0.32, span: 1.24 },
  { lift: 4.24, reach: 0.18, span: 0.82 },
];

const MID_BRANCH_TIERS: readonly BranchTier[] = [
  { lift: 0.95, reach: 0.48, span: 2.14 },
  { lift: 2, reach: 0.4, span: 1.78 },
  { lift: 2.95, reach: 0.3, span: 1.34 },
  { lift: 4.05, reach: 0.16, span: 0.9 },
];

/**
 * Impostors keep one card per tier so silhouettes stay cheap at range, but they
 * still need three tiers: a single card covered barely a third of the trunk.
 */
const IMPOSTOR_BRANCH_TIERS: readonly BranchTier[] = [
  { lift: 0.8, reach: 0, span: 2.5 },
  { lift: 2.35, reach: 0, span: 2 },
  { lift: 3.75, reach: 0, span: 1.4 },
];

const CARDS_PER_TIER_BY_LOD: Readonly<Record<ForestLod, number>> = {
  hero: 3,
  impostor: 1,
  mid: 2,
};

const TIERS_BY_LOD: Readonly<Record<ForestLod, readonly BranchTier[]>> = {
  hero: HERO_BRANCH_TIERS,
  impostor: IMPOSTOR_BRANCH_TIERS,
  mid: MID_BRANCH_TIERS,
};

function buildBranchInstances(
  trees: readonly ForestTreePlacement[],
  lod: ForestLod,
): readonly (readonly BranchInstance[])[] {
  const tiers = TIERS_BY_LOD[lod];
  const cardsPerTier = CARDS_PER_TIER_BY_LOD[lod];
  const perCell: BranchInstance[][] = Array.from(
    { length: FOREST_CONIFER_CELL_COUNT },
    () => [],
  );

  trees.forEach((tree, treeIndex) => {
    tiers.forEach((tier, tierIndex) => {
      for (let card = 0; card < cardsPerTier; card += 1) {
        const sequence = treeIndex * 7 + tierIndex * 3 + card;
        const cell =
          (tree.atlasCell + tierIndex + card) % FOREST_CONIFER_CELL_COUNT;
        const rotationY =
          tree.rotation[1]
          + card * ((Math.PI * 2) / cardsPerTier)
          + tierIndex * 0.62;
        const reach = tier.reach * tree.scale * (0.78 + (sequence % 3) * 0.12);
        const span = tier.span * tree.scale * (0.9 + (sequence % 4) * 0.06);

        perCell[cell]!.push({
          position: [
            tree.position[0] + Math.sin(rotationY) * reach,
            tree.position[1] + tier.lift * tree.scale,
            tree.position[2] + Math.cos(rotationY) * reach,
          ],
          rotationY,
          scale: [span, span * BRANCH_CARD_ASPECT, span],
          tilt: -0.2 - (sequence % 3) * 0.05,
          tint: tree.tint,
          windPhase: tree.windPhase + card * 0.6 + tierIndex * 0.31,
        });
      }
    });
  });

  return perCell;
}

function BranchCardCell({
  atlasCell,
  instances,
  material,
}: {
  readonly atlasCell: number;
  readonly instances: readonly BranchInstance[];
  readonly material: MeshStandardMaterial;
}) {
  const meshRef = useRef<InstancedMesh | null>(null);
  const geometry = useMemo(
    () => createForestCrossedCardGeometry("conifer", atlasCell),
    [atlasCell],
  );

  useLayoutEffect(() => {
    const mesh = meshRef.current;
    if (!mesh) return;
    const object = new Object3D();
    const color = new Color();
    const windValues = new Float32Array(Math.max(1, instances.length));

    instances.forEach((instance, index) => {
      object.position.set(...instance.position);
      object.rotation.set(instance.tilt, instance.rotationY, 0);
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

function TrunkLayer({
  geometry: trunkTemplate,
  material,
  taper,
  trees,
}: {
  readonly geometry: BufferGeometry;
  readonly material: MeshStandardMaterial;
  readonly taper: number;
  readonly trees: readonly ForestTreePlacement[];
}) {
  const meshRef = useRef<InstancedMesh | null>(null);
  // `instanceWindPhase` lives on the geometry, so every InstancedMesh needs its
  // own copy: the template is shared across each resident chunk and both LODs,
  // and a shared buffer means the last layer to mount overwrites every earlier
  // layer's phases — and, where its tree count is lower, leaves the attribute
  // shorter than the draw count so the shader reads past its end. The clone is
  // cheap (a 6-8 segment cylinder) and the pose/UV work stays in the template.
  const geometry = useMemo(() => trunkTemplate.clone(), [trunkTemplate]);

  useEffect(() => () => geometry.dispose(), [geometry]);

  useLayoutEffect(() => {
    const mesh = meshRef.current;
    if (!mesh) return;
    const object = new Object3D();
    const color = new Color();
    const windValues = new Float32Array(Math.max(1, trees.length));

    trees.forEach((tree, index) => {
      object.position.set(...tree.position);
      object.rotation.set(
        tree.rotation[0] * 0.3,
        tree.rotation[1],
        tree.rotation[2] * 0.3,
      );
      object.scale.set(
        tree.scale * taper,
        tree.scale * TRUNK_HEIGHT,
        tree.scale * taper,
      );
      object.updateMatrix();
      mesh.setMatrixAt(index, object.matrix);
      mesh.setColorAt(index, color.setHex(0xb8a184));
      windValues[index] = tree.windPhase;
    });

    geometry.setAttribute(
      "instanceWindPhase",
      new InstancedBufferAttribute(windValues, 1),
    );
    mesh.count = trees.length;
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    mesh.computeBoundingSphere();
  }, [geometry, taper, trees]);

  if (trees.length === 0) return null;
  return (
    <instancedMesh
      args={[geometry, material, trees.length]}
      castShadow={false}
      receiveShadow={false}
      ref={meshRef}
    />
  );
}

function ConiferBand({
  branchMaterial,
  lod,
  taper,
  trees,
  trunkGeometry,
  trunkMaterial,
}: {
  readonly branchMaterial: MeshStandardMaterial;
  readonly lod: ForestLod;
  readonly taper: number;
  readonly trees: readonly ForestTreePlacement[];
  readonly trunkGeometry: BufferGeometry;
  readonly trunkMaterial: MeshStandardMaterial;
}) {
  const branchCells = useMemo(
    () => buildBranchInstances(trees, lod),
    [lod, trees],
  );

  if (trees.length === 0) return null;
  return (
    <group>
      <TrunkLayer
        geometry={trunkGeometry}
        material={trunkMaterial}
        taper={taper}
        trees={trees}
      />
      {branchCells.map((instances, atlasCell) => (
        <BranchCardCell
          atlasCell={atlasCell}
          instances={instances}
          key={atlasCell}
          material={branchMaterial}
        />
      ))}
    </group>
  );
}

/** Trunk width relative to a hero trunk, per silhouette band. */
const TRUNK_TAPERS = Object.freeze({ far: 0.5, hero: 1, mid: 0.66 });

type ConiferBandGroup = {
  readonly key: string;
  readonly lod: ForestLod;
  readonly taper: number;
  readonly trees: readonly ForestTreePlacement[];
};

/**
 * Merges every resident chunk into one instanced band per (silhouette, LOD)
 * pair, so draw calls scale with the number of distinct LODs on screen rather
 * than with residency. Per-chunk meshes cost one trunk plus four branch-cell
 * draws each, which is what capped residency at a single neighbour and left the
 * corridor looking like a thin copse; merged, a seven-chunk window issues the
 * same handful of calls as a three-chunk one.
 *
 * Chunk plans arrive in ascending index order, so concatenation stays
 * deterministic and instance ordering survives a reload.
 */
function groupConiferBands(
  plans: readonly ForestConiferChunkPlan[],
): readonly ConiferBandGroup[] {
  const bands = new Map<string, {
    lod: ForestLod;
    taper: number;
    trees: ForestTreePlacement[];
  }>();

  const add = (
    silhouette: keyof typeof TRUNK_TAPERS,
    lod: ForestLod,
    trees: readonly ForestTreePlacement[],
  ) => {
    if (trees.length === 0) return;
    const key = `${silhouette}-${lod}`;
    const existing = bands.get(key);
    if (existing) {
      existing.trees.push(...trees);
      return;
    }
    bands.set(key, {
      lod,
      taper: TRUNK_TAPERS[silhouette],
      trees: [...trees],
    });
  };

  for (const plan of plans) {
    add("hero", plan.heroLod, plan.heroTrees);
    add("mid", plan.midLod, plan.midTrees);
    add("far", "impostor", plan.farTrees);
  }

  return Object.freeze(
    [...bands].map(([key, band]) => Object.freeze({ key, ...band })),
  );
}

export function ForestPhotorealTreeLayers({
  activeIndex,
  armMap,
  chunkCount,
  colorMap,
  cueRef,
  farTrees,
  heroTrees,
  midTrees,
  normalMap,
  qualityTier,
  reducedMotion,
  targetIndex,
}: ForestTreeLayersProps) {
  const trunkGeometry = useMemo(
    () => createForestTrunkGeometry(qualityTier === "desktop" ? 8 : 6, 3.2),
    [qualityTier],
  );

  const chunkPlans = useMemo(
    () => planForestConiferChunks({
      activeIndex,
      chunkCount,
      farTrees,
      heroTrees,
      midTrees,
      targetIndex,
      tier: qualityTier,
    }),
    [
      activeIndex,
      chunkCount,
      farTrees,
      heroTrees,
      midTrees,
      qualityTier,
      targetIndex,
    ],
  );

  const bands = useMemo(() => groupConiferBands(chunkPlans), [chunkPlans]);

  const branchSurface = useMemo(() => {
    const material = new MeshStandardMaterial({
      // No `alphaMap`: three.js samples alphaMap's *green* channel, so pointing
      // it at the albedo replaces the atlas's real foliage mask with the
      // albedo's green luminance (~0.25 mean) and alphaTest then discards most
      // of every needle card, punching holes through the canopy.
      alphaTest: FOREST_ALPHA_FOLIAGE_MATERIAL_POLICY.alphaTest,
      aoMap: armMap,
      aoMapIntensity: 0.72,
      depthWrite: FOREST_ALPHA_FOLIAGE_MATERIAL_POLICY.depthWrite,
      // Backlit needle transmission; see FOREST_FOLIAGE_TRANSLUCENCY_POLICY.
      // Bound to the albedo so the canopy underside glows with the atlas's own
      // needle detail instead of resolving to a black silhouette.
      emissive: new Color(FOREST_FOLIAGE_TRANSLUCENCY_POLICY.emissiveColor),
      emissiveIntensity: FOREST_FOLIAGE_TRANSLUCENCY_POLICY.emissiveIntensity,
      emissiveMap: colorMap,
      map: colorMap,
      metalness: FOREST_PBR_SURFACE_POLICIES.conifer.metalness,
      normalMap,
      roughness: FOREST_PBR_SURFACE_POLICIES.conifer.roughness,
      roughnessMap: armMap,
      side: DoubleSide,
      transparent: FOREST_ALPHA_FOLIAGE_MATERIAL_POLICY.transparent,
    });
    return {
      material,
      wind: attachForestWind(material, BRANCH_WIND_HEIGHT),
    };
  }, [armMap, colorMap, normalMap]);

  const trunkSurface = useMemo(() => {
    const material = new MeshStandardMaterial({
      aoMap: armMap,
      aoMapIntensity: 0.9,
      emissiveIntensity: FOREST_PBR_SURFACE_POLICIES.conifer.emissiveIntensity,
      map: colorMap,
      metalness: FOREST_PBR_SURFACE_POLICIES.conifer.metalness,
      normalMap,
      roughness: FOREST_PBR_SURFACE_POLICIES.conifer.roughness,
      roughnessMap: armMap,
    });
    return {
      material,
      wind: attachForestWind(material, TRUNK_WIND_HEIGHT),
    };
  }, [armMap, colorMap, normalMap]);

  const branchMaterial = branchSurface.material;
  const trunkMaterial = trunkSurface.material;

  useEffect(() => () => trunkGeometry.dispose(), [trunkGeometry]);
  useEffect(() => () => {
    branchMaterial.dispose();
    trunkMaterial.dispose();
  }, [branchMaterial, trunkMaterial]);

  useFrame(({ clock }) => {
    const time = clock.getElapsedTime();
    const cueWind = cueRef.current.windStrength;
    driveForestWind(
      branchSurface.wind,
      time,
      0.011 + cueWind * 0.013,
      reducedMotion,
    );
    driveForestWind(
      trunkSurface.wind,
      time,
      0.0014 + cueWind * 0.0019,
      reducedMotion,
    );
  });

  return (
    <group name="forest-photoreal-tree-layers">
      {bands.map((band) => (
        <group key={band.key} name={`forest-photoreal-band-${band.key}`}>
          <ConiferBand
            branchMaterial={branchMaterial}
            lod={band.lod}
            taper={band.taper}
            trees={band.trees}
            trunkGeometry={trunkGeometry}
            trunkMaterial={trunkMaterial}
          />
        </group>
      ))}
    </group>
  );
}

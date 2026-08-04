"use client";

import { useFrame, useThree } from "@react-three/fiber";
import {
  Suspense,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  type MutableRefObject,
} from "react";
import {
  DoubleSide,
  DynamicDrawUsage,
  InstancedMesh,
  MeshStandardMaterial,
  Object3D,
  PlaneGeometry,
  type BufferGeometry,
  type Camera,
  type Texture,
} from "three";

import type { ForestJourneyCueState } from "../forest-cue-state";
import { getForestOpeningAnimalHorizontalScale } from "../forest-animals";
import { getForestAtlasUvRect } from "../forest-world-data";
import { FOREST_ALPHA_FOLIAGE_MATERIAL_POLICY } from "./forest-material-policy";
import {
  ForestPhotorealAssetBoundary,
  useForestWildlifeTexture,
} from "./forest-photoreal-assets";
import {
  FOREST_SCRIPTED_WILDLIFE_ACTORS,
  getForestScriptedWildlifeCells,
  sampleForestScriptedWildlifeActor,
  type ForestScriptedWildlifeActor,
} from "./forest-scripted-wildlife";
import {
  FOREST_WILDLIFE_ACTORS,
  sampleForestWildlifeActor,
  type ForestWildlifeActor,
  type ForestWildlifeCue,
  type ForestWildlifeSample,
} from "./forest-wildlife-behavior";

/**
 * Metres of the billboard's tallest side. Actors are already scaled below one,
 * so this keeps even a perched dove well under the branch cards around it.
 */
const WILDLIFE_CARD_HEIGHT = 0.72;

/** Distance at which an actor has faded out entirely, in metres. */
const WILDLIFE_FADE_DISTANCE = 26;

type WildlifeCellGroup = {
  readonly actors: readonly ForestWildlifeActor[];
  readonly cell: number;
};

type ScriptedWildlifeCellGroup = {
  readonly actors: readonly ForestScriptedWildlifeActor[];
  readonly cell: number;
};

/**
 * Neutral cue used only for the mount-time pose survey, which needs the wind
 * and dove fields at rest and ignores everything else.
 */
const ZERO_CUE: ForestWildlifeCue = {
  doveFlight: 0,
  windStrength: 0,
};

/**
 * One plane per atlas cell, UV-locked to that cell so a whole species pose can
 * be drawn in a single instanced call without a custom shader.
 */
function createWildlifeGeometry(cell: number): BufferGeometry {
  const rect = getForestAtlasUvRect("wildlife", cell);
  const geometry = new PlaneGeometry(1, 1);
  const uv = geometry.getAttribute("uv");

  for (let index = 0; index < uv.count; index += 1) {
    uv.setXY(
      index,
      rect.offset[0] + uv.getX(index) * rect.repeat[0],
      rect.offset[1] + uv.getY(index) * rect.repeat[1],
    );
  }

  uv.needsUpdate = true;
  geometry.setAttribute("uv1", uv);
  geometry.computeBoundingSphere();
  return geometry;
}

/**
 * Groups the roster by the atlas cells each actor's script actually reaches, so
 * every pose gets its own UV-locked geometry. An actor appears in several groups
 * and is only drawn in the group matching its current pose. Probing the script
 * keeps the grouping honest when a species gains a pose, and costs one cheap
 * pass at mount time.
 */
function groupActorsByCell(): readonly WildlifeCellGroup[] {
  const cells = new Map<number, ForestWildlifeActor[]>();

  for (const actor of FOREST_WILDLIFE_ACTORS) {
    for (let step = 0; step < Math.ceil(actor.period * 10); step += 1) {
      const { atlasCell, opacity } = sampleForestWildlifeActor(
        actor,
        step * 0.1,
        ZERO_CUE,
        false,
      );
      if (opacity === 0) continue;
      const bucket = cells.get(atlasCell);
      if (bucket) {
        if (!bucket.includes(actor)) bucket.push(actor);
      } else {
        cells.set(atlasCell, [actor]);
      }
    }
  }

  return [...cells.entries()]
    .sort(([left], [right]) => left - right)
    .map(([cell, actors]) => ({ actors, cell }));
}

function groupScriptedActorsByCell(): readonly ScriptedWildlifeCellGroup[] {
  const cells = new Map<number, ForestScriptedWildlifeActor[]>();

  for (const actor of FOREST_SCRIPTED_WILDLIFE_ACTORS) {
    for (const cell of getForestScriptedWildlifeCells(actor)) {
      const bucket = cells.get(cell);
      if (bucket) bucket.push(actor);
      else cells.set(cell, [actor]);
    }
  }

  return [...cells.entries()]
    .sort(([left], [right]) => left - right)
    .map(([cell, actors]) => ({ actors, cell }));
}

/**
 * Places one sampled actor into the mesh's next instance slot, or leaves the
 * slot untouched and returns `visible` unchanged when the actor is too far to
 * matter. Shared by both rosters so distance fade, billboarding and the
 * ground-anchored pivot stay identical between them.
 */
function writeWildlifeInstance(
  mesh: InstancedMesh,
  scratch: Object3D,
  camera: Camera,
  sample: ForestWildlifeSample,
  visible: number,
): number {
  const [x, y, z] = sample.position;
  const distance = Math.hypot(
    camera.position.x - x,
    camera.position.y - y,
    camera.position.z - z,
  );
  if (distance >= WILDLIFE_FADE_DISTANCE) return visible;

  // Faded actors shrink rather than turning translucent, because the whole
  // cell shares one alpha-tested material with no per-instance alpha.
  const fade = sample.opacity
    * (1 - Math.max(0, distance / WILDLIFE_FADE_DISTANCE - 0.7) / 0.3);
  if (fade <= 0.02) return visible;

  const height = WILDLIFE_CARD_HEIGHT * sample.scale * fade;
  scratch.position.set(x, y + height * 0.5, z);
  // Billboards yaw toward the camera but keep the scripted facing as a bias, so
  // a running squirrel still reads as moving along its path.
  scratch.rotation.set(
    0,
    Math.atan2(camera.position.x - x, camera.position.z - z)
      + sample.rotationY * 0.35,
    0,
  );
  scratch.scale.set(height, height, height);
  scratch.updateMatrix();
  mesh.setMatrixAt(visible, scratch.matrix);
  return visible + 1;
}

function WildlifeCell({
  actors,
  cell,
  cueRef,
  material,
  reducedMotion,
}: {
  readonly actors: readonly ForestWildlifeActor[];
  readonly cell: number;
  readonly cueRef: MutableRefObject<ForestJourneyCueState>;
  readonly material: MeshStandardMaterial;
  readonly reducedMotion: boolean;
}) {
  const meshRef = useRef<InstancedMesh | null>(null);
  const geometry = useMemo(() => createWildlifeGeometry(cell), [cell]);
  const scratch = useMemo(() => new Object3D(), []);

  useLayoutEffect(() => {
    meshRef.current?.instanceMatrix.setUsage(DynamicDrawUsage);
  }, []);

  useEffect(() => () => geometry.dispose(), [geometry]);

  useFrame(({ camera, clock }) => {
    const mesh = meshRef.current;
    if (!mesh) return;

    const time = clock.getElapsedTime();
    const cue = cueRef.current;
    let visible = 0;

    for (const actor of actors) {
      const sample = sampleForestWildlifeActor(actor, time, cue, reducedMotion);
      if (sample.atlasCell !== cell || sample.opacity === 0) continue;
      visible = writeWildlifeInstance(mesh, scratch, camera, sample, visible);
    }

    mesh.count = visible;
    mesh.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh
      args={[geometry, material, actors.length]}
      castShadow={false}
      count={0}
      frustumCulled={false}
      name={`forest-wildlife-cell-${cell}`}
      receiveShadow={false}
      ref={meshRef}
    />
  );
}

/**
 * Same billboard writer as `WildlifeCell`, but driven by the journey's cue
 * rather than by each actor's own clock. Kept as a separate cell component
 * because the two rosters answer to different inputs: an ambient actor is a
 * function of time, a scripted one is a function of the cue and the gate state.
 */
function ScriptedWildlifeCell({
  actors,
  cell,
  cueRef,
  finaleCueActive,
  gateDepartedRef,
  material,
  reducedMotion,
}: {
  readonly actors: readonly ForestScriptedWildlifeActor[];
  readonly cell: number;
  readonly cueRef: MutableRefObject<ForestJourneyCueState>;
  readonly finaleCueActive: boolean;
  readonly gateDepartedRef: MutableRefObject<boolean>;
  readonly material: MeshStandardMaterial;
  readonly reducedMotion: boolean;
}) {
  const meshRef = useRef<InstancedMesh | null>(null);
  const geometry = useMemo(() => createWildlifeGeometry(cell), [cell]);
  const scratch = useMemo(() => new Object3D(), []);
  const viewportSize = useThree(({ size }) => size);
  const openingHorizontalScale
    = getForestOpeningAnimalHorizontalScale(viewportSize);

  useLayoutEffect(() => {
    meshRef.current?.instanceMatrix.setUsage(DynamicDrawUsage);
  }, []);

  useEffect(() => () => geometry.dispose(), [geometry]);

  useFrame(({ camera, clock }) => {
    const mesh = meshRef.current;
    if (!mesh) return;

    const options = {
      finaleCueActive,
      gateDeparted: gateDepartedRef.current,
      openingHorizontalScale,
      reducedMotion,
    };
    let visible = 0;

    for (const actor of actors) {
      const sample = sampleForestScriptedWildlifeActor(
        actor,
        clock.getElapsedTime(),
        cueRef.current,
        options,
      );
      if (sample.atlasCell !== cell || sample.opacity === 0) continue;
      visible = writeWildlifeInstance(mesh, scratch, camera, sample, visible);
    }

    mesh.count = visible;
    mesh.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh
      args={[geometry, material, actors.length]}
      castShadow={false}
      count={0}
      frustumCulled={false}
      name={`forest-scripted-wildlife-cell-${cell}`}
      receiveShadow={false}
      ref={meshRef}
    />
  );
}

/**
 * Live census of the wildlife actually mounted, keyed per layer so several
 * canvases (or a remount mid-transition) cannot corrupt the tally.
 *
 * Diagnostics used to report `FOREST_WILDLIFE_ACTORS.length`, a module constant
 * that reads the same whether the atlas loaded, failed, or was never requested
 * because the world fell back to a procedural mode — which made the
 * failed-atlas E2E assertion vacuous. This counts what is on screen instead.
 */
const MOUNTED_WILDLIFE_LAYERS = new Map<symbol, number>();

export function getForestPhotorealWildlifeMountedActorCount(): number {
  let total = 0;
  for (const count of MOUNTED_WILDLIFE_LAYERS.values()) total += count;
  return total;
}

function useWildlifeCensus(actorCount: number): void {
  const layerId = useMemo(() => Symbol("forest-wildlife-layer"), []);

  useEffect(() => {
    MOUNTED_WILDLIFE_LAYERS.set(layerId, actorCount);
    return () => {
      MOUNTED_WILDLIFE_LAYERS.delete(layerId);
    };
  }, [actorCount, layerId]);
}

function WildlifeActors({
  cueRef,
  finaleCueActive,
  gateDepartedRef,
  reducedMotion,
  texture,
}: {
  readonly cueRef: MutableRefObject<ForestJourneyCueState>;
  readonly finaleCueActive: boolean;
  readonly gateDepartedRef: MutableRefObject<boolean>;
  readonly reducedMotion: boolean;
  readonly texture: Texture;
}) {
  const groups = useMemo(() => groupActorsByCell(), []);
  const scriptedGroups = useMemo(() => groupScriptedActorsByCell(), []);
  const material = useMemo(
    () => new MeshStandardMaterial({
      // No `alphaMap` — see the note in forest-tree-layers.tsx: alphaMap reads
      // the green channel, not the texture's alpha.
      alphaTest: FOREST_ALPHA_FOLIAGE_MATERIAL_POLICY.alphaTest,
      depthWrite: FOREST_ALPHA_FOLIAGE_MATERIAL_POLICY.depthWrite,
      map: texture,
      metalness: 0,
      roughness: 0.78,
      side: DoubleSide,
      transparent: FOREST_ALPHA_FOLIAGE_MATERIAL_POLICY.transparent,
    }),
    [texture],
  );

  useEffect(() => () => material.dispose(), [material]);

  useWildlifeCensus(
    FOREST_WILDLIFE_ACTORS.length + FOREST_SCRIPTED_WILDLIFE_ACTORS.length,
  );

  return (
    <group name="forest-photoreal-wildlife">
      {groups.map(({ actors, cell }) => (
        <WildlifeCell
          actors={actors}
          cell={cell}
          cueRef={cueRef}
          key={cell}
          material={material}
          reducedMotion={reducedMotion}
        />
      ))}
      {scriptedGroups.map(({ actors, cell }) => (
        <ScriptedWildlifeCell
          actors={actors}
          cell={cell}
          cueRef={cueRef}
          finaleCueActive={finaleCueActive}
          gateDepartedRef={gateDepartedRef}
          key={`scripted-${cell}`}
          material={material}
          reducedMotion={reducedMotion}
        />
      ))}
    </group>
  );
}

function WildlifeTextureGate({
  cueRef,
  finaleCueActive,
  gateDepartedRef,
  reducedMotion,
}: ForestPhotorealWildlifeProps) {
  const texture = useForestWildlifeTexture();
  return (
    <WildlifeActors
      cueRef={cueRef}
      finaleCueActive={finaleCueActive}
      gateDepartedRef={gateDepartedRef}
      reducedMotion={reducedMotion}
      texture={texture}
    />
  );
}

export type ForestPhotorealWildlifeProps = {
  readonly cueRef: MutableRefObject<ForestJourneyCueState>;
  readonly finaleCueActive: boolean;
  readonly gateDepartedRef: MutableRefObject<boolean>;
  readonly reducedMotion: boolean;
};

/**
 * Optional layer. The wildlife atlas is the only non-blocking asset in the
 * manifest, so a failed or slow load renders nothing at all rather than
 * downgrading the world mode.
 *
 * Note this carries the journey's scripted animals too, so in the photoreal
 * path a missing atlas costs the gate doves and the finale release as well as
 * the ambient sightings. That is the intended trade: the alternative is falling
 * back to the sphere-built animals the upgrade set out to remove.
 */
export function ForestPhotorealWildlife({
  cueRef,
  finaleCueActive,
  gateDepartedRef,
  reducedMotion,
}: ForestPhotorealWildlifeProps) {
  return (
    <ForestPhotorealAssetBoundary fallback={null}>
      <Suspense fallback={null}>
        <WildlifeTextureGate
          cueRef={cueRef}
          finaleCueActive={finaleCueActive}
          gateDepartedRef={gateDepartedRef}
          reducedMotion={reducedMotion}
        />
      </Suspense>
    </ForestPhotorealAssetBoundary>
  );
}

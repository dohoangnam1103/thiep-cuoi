"use client";

import { useLoader } from "@react-three/fiber";
import { useEffect, useMemo } from "react";
import {
  ClampToEdgeWrapping,
  DoubleSide,
  Float32BufferAttribute,
  MeshStandardMaterial,
  NoColorSpace,
  PlaneGeometry,
  RepeatWrapping,
  SRGBColorSpace,
  TextureLoader,
  type BufferGeometry,
  type Texture,
} from "three";

import {
  BEACH_WATER_LEVEL_Y,
  shorelineOffsetAt,
  waterDepthAt,
} from "../beach-shoreline";
import type { BeachWorldQualityTier } from "../beach-world-data";
import { BEACH_PHOTOREAL_ASSETS } from "./beach-asset-manifest";

/**
 * The walked rail sits at z 7 to 7.9 and the scenes run x -8 to about 94, so
 * the sand has to cover that strip plus enough sea to reach full depth and
 * enough backshore that the dunes read as a horizon rather than a wall.
 */
export const BEACH_SAND_X_MIN_METRES = -26;
export const BEACH_SAND_X_MAX_METRES = 116;
export const BEACH_SAND_Z_MIN_METRES = -34;
export const BEACH_SAND_Z_MAX_METRES = 30;

/**
 * One tile of the sand maps spans this much ground. The maps are 1024px, so
 * roughly 3m per tile is the tiling frequency that substitutes for a 2K map:
 * close enough that grain reads at walking distance, far enough apart that the
 * repeat does not pattern across the frame.
 */
export const BEACH_SAND_TILE_METRES = 3;

/**
 * `sand-color.webp` and `sand-arm.webp` carry a damp band baked along the
 * tile's V axis by `scripts/prepare-beach-photoreal-assets.mjs`: dry below
 * 0.62, feathering to fully wet by 0.78. Tiling V would stripe the beach with
 * a damp band every 3m, so those two maps read a second, shore-relative UV set
 * whose V places that band once, at the waterline. U still tiles — the band
 * runs along V only, so repeating U repeats grain without repeating the band.
 */
export const BEACH_WET_BAND_START_V = 0.62;

/** How far landward of the waterline the swash still darkens the sand. */
const BEACH_SWASH_LANDWARD_METRES = 1.5;

/** How far seaward of the waterline the band reaches fully wet. */
const BEACH_WET_BAND_SEAWARD_METRES = 6;

/** Rise of the foreshore between the waterline and the back of the beach. */
const BEACH_FORESHORE_RISE_METRES = 0.22;

/** Distance landward over which the foreshore reaches its full rise. */
const BEACH_FORESHORE_RUN_METRES = 14;

/** Landward distance at which the dune field starts climbing. */
const BEACH_DUNE_ONSET_METRES = 12;

/** Distance over which the dunes reach their crest height. */
const BEACH_DUNE_RUN_METRES = 16;

/** Crest height of the dunes at the back of the beach. */
const BEACH_DUNE_CREST_METRES = 2.6;

/** Along-shore period of the dune crest, so the field is not one ridge. */
const BEACH_DUNE_PERIOD_METRES = 41;

/** Fraction by which the crest varies along shore. */
const BEACH_DUNE_CREST_VARIATION = 0.35;

/** Amplitude of the low ripples across the open foreshore. */
const BEACH_RIPPLE_AMPLITUDE_METRES = 0.06;

/** Along-shore period of the foreshore ripples. */
const BEACH_RIPPLE_PERIOD_X_METRES = 17;

/** Cross-shore period of the foreshore ripples. */
const BEACH_RIPPLE_PERIOD_Z_METRES = 9;

const SEGMENTS: Record<
  BeachWorldQualityTier,
  { readonly x: number; readonly z: number }
> = {
  desktop: { x: 192, z: 96 },
  mobile: { x: 128, z: 64 },
  reduced: { x: 80, z: 40 },
};

function smoothstep01(value: number): number {
  const t = Math.min(Math.max(value, 0), 1);
  return t * t * (3 - 2 * t);
}

/**
 * Height of the dry beach at `landwardMetres` behind the waterline.
 *
 * Zero at the waterline, so it meets `-waterDepthAt` continuously, and it
 * depends on x as well as distance — without that the dunes read as one
 * extruded ridge running the length of the shore.
 *
 * The rail runs at z 7 to 7.9 and the shoreline swings +/-2.4m, so the camera
 * walks between 4.628m and 10.295m landward. Over that band the dune term is
 * still zero (it starts at 12m) and the foreshore plus ripples peak at 0.1963m
 * (at x 103.6), leaving 0.304m of margin under the 0.5m the rail allows and
 * 1.424m of clearance under the 1.62m eye height.
 */
export function beachDuneSwellAt(x: number, landwardMetres: number): number {
  if (landwardMetres <= 0) return 0;

  const foreshoreRamp = smoothstep01(
    landwardMetres / BEACH_FORESHORE_RUN_METRES,
  );
  const foreshore = BEACH_FORESHORE_RISE_METRES * foreshoreRamp;

  const ripple = BEACH_RIPPLE_AMPLITUDE_METRES
    * Math.sin((x / BEACH_RIPPLE_PERIOD_X_METRES) * Math.PI * 2)
    * Math.sin((landwardMetres / BEACH_RIPPLE_PERIOD_Z_METRES) * Math.PI * 2)
    * foreshoreRamp;

  const duneRamp = smoothstep01(
    (landwardMetres - BEACH_DUNE_ONSET_METRES) / BEACH_DUNE_RUN_METRES,
  );
  const crest = BEACH_DUNE_CREST_METRES
    * (1
      + BEACH_DUNE_CREST_VARIATION
        * Math.sin((x / BEACH_DUNE_PERIOD_METRES) * Math.PI * 2 + 0.7));

  return foreshore + ripple + crest * duneRamp;
}

/** Ground height at a point: sea bed below the waterline, beach above it. */
export function beachGroundHeightAt(x: number, z: number): number {
  const seawardMetres = shorelineOffsetAt(x) - z;
  if (seawardMetres > 0) {
    return BEACH_WATER_LEVEL_Y - waterDepthAt(x, z);
  }
  return BEACH_WATER_LEVEL_Y + beachDuneSwellAt(x, -seawardMetres);
}

/**
 * V of the shore-relative UV set at a point.
 *
 * Fully wet (1.0) from `BEACH_WET_BAND_SEAWARD_METRES` out to sea, dropping
 * through the baked feather to `BEACH_WET_BAND_START_V` at
 * `BEACH_SWASH_LANDWARD_METRES` behind the waterline and continuing down into
 * the dry part of the tile inland. It is clamped at 0 rather than wrapped, so
 * the deep backshore reads the driest row instead of wrapping back into wet.
 */
export function beachShoreBandV(x: number, z: number): number {
  const seawardMetres = shorelineOffsetAt(x) - z;
  const span = BEACH_SWASH_LANDWARD_METRES + BEACH_WET_BAND_SEAWARD_METRES;
  const ramp = (seawardMetres + BEACH_SWASH_LANDWARD_METRES) / span;
  const v = BEACH_WET_BAND_START_V + (1 - BEACH_WET_BAND_START_V) * ramp;
  return Math.min(Math.max(v, 0), 1);
}

/**
 * Sand geometry for a quality tier.
 *
 * Carries two UV sets: `uv` tiles the grain at roughly
 * `BEACH_SAND_TILE_METRES` per tile and is read by the normal map, which has
 * no baked band; `uv1` tiles U at the same frequency but places the baked damp
 * band once at the waterline along V, and is read by the colour and ARM maps.
 */
export function createBeachSandGeometry(
  qualityTier: BeachWorldQualityTier,
): BufferGeometry {
  const segments = SEGMENTS[qualityTier];
  const width = BEACH_SAND_X_MAX_METRES - BEACH_SAND_X_MIN_METRES;
  const depth = BEACH_SAND_Z_MAX_METRES - BEACH_SAND_Z_MIN_METRES;

  const geometry = new PlaneGeometry(width, depth, segments.x, segments.z);
  geometry.rotateX(-Math.PI / 2);
  geometry.translate(
    (BEACH_SAND_X_MIN_METRES + BEACH_SAND_X_MAX_METRES) / 2,
    0,
    (BEACH_SAND_Z_MIN_METRES + BEACH_SAND_Z_MAX_METRES) / 2,
  );

  const positions = geometry.getAttribute("position");
  const vertexCount = positions.count;
  const tiledUv = new Float32Array(vertexCount * 2);
  const shoreUv = new Float32Array(vertexCount * 2);

  for (let index = 0; index < vertexCount; index += 1) {
    const x = positions.getX(index);
    const z = positions.getZ(index);
    positions.setY(index, beachGroundHeightAt(x, z));

    const tiledU = (x - BEACH_SAND_X_MIN_METRES) / BEACH_SAND_TILE_METRES;
    tiledUv[index * 2] = tiledU;
    tiledUv[index * 2 + 1] = (z - BEACH_SAND_Z_MIN_METRES)
      / BEACH_SAND_TILE_METRES;

    shoreUv[index * 2] = tiledU;
    shoreUv[index * 2 + 1] = beachShoreBandV(x, z);
  }

  positions.needsUpdate = true;
  geometry.setAttribute("uv", new Float32BufferAttribute(tiledUv, 2));
  geometry.setAttribute("uv1", new Float32BufferAttribute(shoreUv, 2));
  geometry.computeVertexNormals();
  geometry.computeBoundingSphere();

  return geometry;
}

const SAND_ASSET_IDS = ["sandColor", "sandNormal", "sandArm"] as const;

const SAND_ASSET_SRCS = SAND_ASSET_IDS.map((id) => {
  const asset = BEACH_PHOTOREAL_ASSETS.find((entry) => entry.id === id);
  if (!asset) throw new Error(`Beach sand asset "${id}" is missing`);
  return asset.src;
});

/**
 * `channel` selects which UV attribute a map reads: 0 is `uv`, 1 is `uv1`.
 * The normal map keeps the tiled set; colour and ARM take the shore-relative
 * one so the damp band lands at the waterline exactly once.
 */
export const TILED_UV_CHANNEL = 0;
export const SHORE_UV_CHANNEL = 1;

export const BEACH_SAND_ANISOTROPY = 4;

/**
 * Applies the sand texture set's colour space, wrap modes and UV channels.
 *
 * Exported and kept free of React so the channel split and the clamped band
 * wrap can be asserted on real `Texture` objects; the hook below is only the
 * `useLoader` plumbing around it.
 */
export function configureBeachSandTextures(set: {
  readonly arm: Texture;
  readonly color: Texture;
  readonly normal: Texture;
}): void {
  const { arm, color, normal } = set;

  color.colorSpace = SRGBColorSpace;
  normal.colorSpace = NoColorSpace;
  arm.colorSpace = NoColorSpace;

  // The normal map carries no baked band, so it may tile freely.
  normal.wrapS = RepeatWrapping;
  normal.wrapT = RepeatWrapping;
  normal.channel = TILED_UV_CHANNEL;

  // Colour and ARM carry the damp band baked down V. Tiling V would stripe the
  // beach with repeated waterlines, so V clamps and reads the shore-relative
  // UV set instead.
  for (const banded of [color, arm]) {
    banded.wrapS = RepeatWrapping;
    banded.wrapT = ClampToEdgeWrapping;
    banded.channel = SHORE_UV_CHANNEL;
  }

  for (const texture of [color, normal, arm]) {
    texture.anisotropy = BEACH_SAND_ANISOTROPY;
    texture.needsUpdate = true;
  }
}

function useBeachSandTextures(): {
  readonly arm: Texture;
  readonly color: Texture;
  readonly normal: Texture;
} {
  const textures = useLoader(TextureLoader, SAND_ASSET_SRCS) as Texture[];

  return useMemo(() => {
    const [color, normal, arm] = textures as [Texture, Texture, Texture];
    const set = { arm, color, normal };

    // Textures come back from `useLoader`'s cache uninitialised; configuring
    // them in place is how three expects it and how the forest scene does it.
    // The mutation is idempotent and confined to this memo.
    configureBeachSandTextures(set);

    return set;
  }, [textures]);
}

export type BeachTerrainProps = {
  readonly qualityTier: BeachWorldQualityTier;
};

export function BeachTerrain({ qualityTier }: BeachTerrainProps) {
  const { arm, color, normal } = useBeachSandTextures();
  const geometry = useMemo(
    () => createBeachSandGeometry(qualityTier),
    [qualityTier],
  );

  const material = useMemo(
    () =>
      new MeshStandardMaterial({
        aoMap: arm,
        map: color,
        metalness: 0,
        metalnessMap: arm,
        normalMap: normal,
        roughness: 1,
        roughnessMap: arm,
        // The sea bed is seen through the water plane from above the surface,
        // but the shore also rises past the camera at the frame edges; drawing
        // both faces avoids a hole where the dunes cut the near plane.
        side: DoubleSide,
      }),
    [arm, color, normal],
  );

  useEffect(() => () => geometry.dispose(), [geometry]);
  useEffect(() => () => material.dispose(), [material]);

  return (
    <group data-beach-photoreal-terrain>
      <mesh
        args={[geometry, material]}
        castShadow={false}
        receiveShadow={false}
      />
    </group>
  );
}

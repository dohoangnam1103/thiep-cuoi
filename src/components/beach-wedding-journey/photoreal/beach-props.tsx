"use client";

import { useFrame, useLoader, useThree } from "@react-three/fiber";
import {
  Component,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  type MutableRefObject,
  type ReactNode,
} from "react";
import {
  BufferGeometry,
  Color,
  CylinderGeometry,
  DoubleSide,
  Float32BufferAttribute,
  InstancedBufferAttribute,
  MeshStandardMaterial,
  NoColorSpace,
  Object3D,
  RepeatWrapping,
  SRGBColorSpace,
  TextureLoader,
  type InstancedMesh,
  type Texture,
} from "three";

import type { BeachJourneyScene } from "@/data/beach-wedding-journey";

import type { BeachJourneyCueState } from "../beach-cue-state";
import { getBeachFrameGeometry } from "../beach-frame-geometry";
import type { BeachWorldDensity } from "../beach-world-data";
import { BEACH_PHOTOREAL_ASSETS } from "./beach-asset-manifest";
import {
  BEACH_SAND_X_MAX_METRES,
  beachGroundHeightAt,
} from "./beach-terrain";

/**
 * Shore dressing: the driftwood posts the frames hang between, and the
 * white-clothed reception tables set out along the sand.
 *
 * Two constraints shaped this file. First, every prop map in
 * `beach-asset-manifest.ts` is `group: "props"` and non-blocking, so a load
 * failure here must degrade to flat colour instead of removing the shore
 * furniture. Second, the decoded texture budget is the binding limit, so the
 * tables and their flowers are built from geometry and vertex colour and carry no
 * maps at all: linen reads as an untextured white dielectric anyway, and the
 * flowers are far too small on screen to resolve a petal texture.
 */

/** Height of a driftwood post above the sand, in metres. */
export const BEACH_POST_HEIGHT_METRES = 2.15;

/** Radius of a post at its base and at its top, in metres. */
export const BEACH_POST_BASE_RADIUS_METRES = 0.075;
export const BEACH_POST_TOP_RADIUS_METRES = 0.055;

/** Radial segments per post. Eight reads round in silhouette at 2m and up. */
const BEACH_POST_RADIAL_SEGMENTS = 8;

/** How far the posts stand beyond the first and last frame, in metres. */
export const BEACH_POST_LINE_MARGIN_METRES = 6;

/** Radius of a table's top, in metres. */
export const BEACH_TABLE_RADIUS_METRES = 0.62;

/** Height of a table's top above the sand, in metres. */
export const BEACH_TABLE_HEIGHT_METRES = 0.74;

/**
 * How far the cloth's hem flares beyond the top, in metres.
 *
 * Linen over a round table does not fall vertically; the hem stands off the base.
 * A straight cylinder skirt reads as a drum, so the hem is wider than the top.
 */
export const BEACH_TABLE_HEM_FLARE_METRES = 0.11;

/** Radial segments per table. Twenty-four keeps the hem's curve smooth. */
const BEACH_TABLE_RADIAL_SEGMENTS = 24;

/**
 * Seaward and landward edges of the band the tables stand in, in metres of z.
 *
 * The walked rail runs z 7 to 7.9 and the frames hang at roughly z 6.3 to 7.2,
 * so the seaward band sits in front of both, between the frames and the water,
 * where the camera's down-shore view actually looks. The waterline swings between
 * z -2.4 and +2.4, so the seaward edge at 3.2 keeps every table on dry sand.
 */
export const BEACH_TABLE_SEAWARD_Z_MIN_METRES = 3.2;
export const BEACH_TABLE_SEAWARD_Z_MAX_METRES = 5.6;

/** The second, landward band, set back behind the walk. */
export const BEACH_TABLE_LANDWARD_Z_MIN_METRES = 9.6;
export const BEACH_TABLE_LANDWARD_Z_MAX_METRES = 13.4;

/** Fraction of the tables placed in the seaward band, nearest the camera. */
export const BEACH_TABLE_SEAWARD_SHARE = 0.55;

/**
 * Alongshore span the tables are scattered across, in metres of x.
 *
 * The seaward edge stops exactly at `BEACH_SAND_X_MAX_METRES`: a table past the
 * terrain edge would stand on nothing. Reaching the edge rather than stopping
 * short matters at the finale, whose camera sits at x 111 looking to x 115.5 —
 * an earlier 114m limit put the last table behind that pose, so the closing
 * scene showed an empty beach on the narrow mobile frustum.
 */
export const BEACH_TABLE_X_MIN_METRES = -14;
export const BEACH_TABLE_X_MAX_METRES = BEACH_SAND_X_MAX_METRES;

/** Radius of a centrepiece's bloom cluster, in metres. */
export const BEACH_FLOWER_CLUSTER_RADIUS_METRES = 0.19;

/** Height of a centrepiece above the cloth, in metres. */
export const BEACH_FLOWER_HEIGHT_METRES = 0.23;

/** Blooms per centrepiece. */
export const BEACH_FLOWER_BLOOMS_PER_CLUSTER = 9;

/** Petals per bloom. */
const BEACH_FLOWER_PETALS_PER_BLOOM = 5;

/** Height the centrepieces ramp their sway over, in metres. */
export const BEACH_FLOWER_WIND_HEIGHT = BEACH_FLOWER_HEIGHT_METRES;

/**
 * Base wind strength with no cue, and the gain at full cue.
 *
 * Weaker than the dune grass this replaced: a cut stem in a vase on a table has
 * far less travel than a marram blade rooted in sand, and a centrepiece that
 * swayed like grass would read as a rubber prop.
 */
export const BEACH_FLOWER_WIND_BASE = 0.022;
export const BEACH_FLOWER_WIND_CUE_GAIN = 0.019;

const POST_FALLBACK_COLOR = "#a08464";

/**
 * Linen white, not paper white.
 *
 * Pure `#ffffff` under a 12.8deg sun and a high-key sky tone-maps to a flat
 * clipped patch with no fold visible. A little under white leaves the ACES curve
 * room to show the drape.
 */
const TABLE_CLOTH_COLOR = "#f4f1ea";

/** Bloom tints, and the foliage the blooms sit in. */
const FLOWER_TINTS = [0xffffff, 0xfdeaf0, 0xf7d9c4, 0xf6c9d4, 0xfff4d8] as const;
const FOLIAGE_TINT = 0x6f7f5a;

/** Wood UV repeats along a post's height, so the grain does not stretch. */
const POST_UV_REPEAT_Y = 3;

// ---------------------------------------------------------------------------
// Wind
// ---------------------------------------------------------------------------

export type BeachWindUniforms = {
  readonly uTime: { value: number };
  readonly uWindHeight: { value: number };
  readonly uWindStrength: { value: number };
};

/**
 * Per-instance sway injected into the lit PBR path.
 *
 * Copied from `src/components/forest-wedding-journey/photoreal/forest-wind-material.ts`.
 * Fixes to the sway maths must be applied to both. The cache key differs so the
 * two labs never share a compiled program.
 */
export function attachBeachWind(
  material: MeshStandardMaterial,
  windHeight: number,
): BeachWindUniforms {
  const uniforms: BeachWindUniforms = {
    uTime: { value: 0 },
    uWindHeight: { value: windHeight },
    uWindStrength: { value: 0 },
  };

  material.onBeforeCompile = (shader) => {
    shader.uniforms.uTime = uniforms.uTime;
    shader.uniforms.uWindHeight = uniforms.uWindHeight;
    shader.uniforms.uWindStrength = uniforms.uWindStrength;
    shader.vertexShader = shader.vertexShader
      .replace(
        "#include <common>",
        `#include <common>
attribute float instanceWindPhase;
uniform float uTime;
uniform float uWindHeight;
uniform float uWindStrength;`,
      )
      .replace(
        "#include <begin_vertex>",
        `#include <begin_vertex>
float beachWindRamp = clamp(transformed.y / max(uWindHeight, 0.0001), 0.0, 1.0);
beachWindRamp *= beachWindRamp;
float beachWindSway = sin(uTime * 0.74 + instanceWindPhase)
  + 0.42 * sin(uTime * 1.63 + instanceWindPhase * 1.7);
transformed.x += beachWindSway * uWindStrength * beachWindRamp * uWindHeight;
transformed.z += cos(uTime * 0.61 + instanceWindPhase)
  * uWindStrength * beachWindRamp * uWindHeight * 0.55;`,
      );
  };

  material.customProgramCacheKey = () => "beach-wind";
  return uniforms;
}

export function driveBeachWind(
  uniforms: BeachWindUniforms | null,
  time: number,
  strength: number,
  reducedMotion: boolean,
) {
  if (!uniforms) return;
  if (reducedMotion) {
    // Both, not just the strength: leaving `uTime` advancing would keep the
    // shader re-evaluating a zero-amplitude sway and would resume mid-phase the
    // moment the strength came back.
    uniforms.uTime.value = 0;
    uniforms.uWindStrength.value = 0;
    return;
  }

  uniforms.uTime.value = time;
  uniforms.uWindStrength.value = strength;
}

// ---------------------------------------------------------------------------
// Prop textures
// ---------------------------------------------------------------------------

export type BeachPropMapSet = {
  readonly arm: Texture;
  readonly color: Texture;
  readonly normal: Texture;
};

export type BeachPropTextures = {
  readonly driftwood: BeachPropMapSet;
  readonly frames: readonly [BeachPropMapSet, BeachPropMapSet];
};

export const BEACH_PROP_ASSET_ERROR_MARKER = "beach-prop-asset-load";

const PROP_ASSET_IDS = [
  "driftwoodColor",
  "driftwoodNormal",
  "driftwoodArm",
  "frame01Color",
  "frame01Normal",
  "frame01Arm",
  "frame02Color",
  "frame02Normal",
  "frame02Arm",
] as const;

const COLOR_PROP_ASSET_IDS = new Set<string>([
  "driftwoodColor",
  "frame01Color",
  "frame02Color",
]);

/** The prop assets, in `PROP_ASSET_IDS` order. */
export const BEACH_PROP_ASSETS = PROP_ASSET_IDS.map((id) => {
  const asset = BEACH_PHOTOREAL_ASSETS.find((entry) => entry.id === id);
  if (!asset) {
    throw new Error(`Beach prop asset "${id}" is missing from the manifest`);
  }
  return asset;
});

const BEACH_PROP_ASSET_SRCS = BEACH_PROP_ASSETS.map(({ src }) => src);

class BeachPropAssetError extends Error {
  constructor(url: string, error: unknown) {
    const detail = error instanceof Error ? error.message : String(error);
    super(`[${BEACH_PROP_ASSET_ERROR_MARKER}] ${url}: ${detail}`);
    this.name = "BeachPropAssetError";
  }
}

/**
 * Loads a prop map and tags its failures so the boundary below can tell a
 * missing wood texture apart from a bug in the scene graph.
 */
class BeachPropTextureLoader extends TextureLoader {
  override load(
    url: string,
    onLoad?: (texture: Texture<HTMLImageElement>) => void,
    onProgress?: (event: ProgressEvent) => void,
    onError?: (error: unknown) => void,
  ): Texture<HTMLImageElement> {
    const asset = BEACH_PROP_ASSETS.find((entry) => entry.src === url);
    return super.load(
      url,
      (texture) => {
        texture.colorSpace = asset && COLOR_PROP_ASSET_IDS.has(asset.id)
          ? SRGBColorSpace
          : NoColorSpace;
        texture.wrapS = RepeatWrapping;
        texture.wrapT = RepeatWrapping;
        texture.anisotropy = 4;
        onLoad?.(texture);
      },
      onProgress,
      (error) => {
        onError?.(new BeachPropAssetError(url, error));
      },
    );
  }
}

export function isBeachPropAssetError(error: unknown): boolean {
  return error instanceof BeachPropAssetError
    || (error instanceof Error
      && error.message.includes(`[${BEACH_PROP_ASSET_ERROR_MARKER}]`));
}

type BoundaryProps = {
  readonly children: ReactNode;
  readonly fallback: ReactNode;
};

type BoundaryState = {
  readonly assetFailed: boolean;
  readonly errorToPropagate: unknown;
  readonly shouldPropagate: boolean;
};

/**
 * Swallows prop-map load failures and nothing else.
 *
 * A non-asset error rethrows: a boundary that ate every error would turn a
 * scene-graph bug into a silently plainer beach.
 */
export class BeachPropAssetBoundary extends Component<
  BoundaryProps,
  BoundaryState
> {
  override state: BoundaryState = {
    assetFailed: false,
    errorToPropagate: null,
    shouldPropagate: false,
  };

  static getDerivedStateFromError(error: unknown): BoundaryState {
    if (isBeachPropAssetError(error)) {
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

  override render() {
    if (this.state.shouldPropagate) throw this.state.errorToPropagate;
    return this.state.assetFailed ? this.props.fallback : this.props.children;
  }
}

/** Groups the flat loader result into the sets each prop consumes. */
export function groupBeachPropTextures(
  textures: readonly Texture[],
): BeachPropTextures {
  if (textures.length !== BEACH_PROP_ASSETS.length) {
    throw new Error(
      `Expected ${BEACH_PROP_ASSETS.length} beach prop textures, got ${textures.length}`,
    );
  }

  const byId = new Map<string, Texture>(
    BEACH_PROP_ASSETS.map((asset, index) => [asset.id, textures[index]!]),
  );
  const require = (id: string): Texture => {
    const texture = byId.get(id);
    if (!texture) {
      throw new Error(`Beach prop texture "${id}" is unavailable`);
    }
    return texture;
  };

  return {
    driftwood: {
      arm: require("driftwoodArm"),
      color: require("driftwoodColor"),
      normal: require("driftwoodNormal"),
    },
    frames: [
      {
        arm: require("frame01Arm"),
        color: require("frame01Color"),
        normal: require("frame01Normal"),
      },
      {
        arm: require("frame02Arm"),
        color: require("frame02Color"),
        normal: require("frame02Normal"),
      },
    ],
  };
}

export function useBeachPropTextures(): BeachPropTextures {
  const textures = useLoader(BeachPropTextureLoader, BEACH_PROP_ASSET_SRCS);
  const renderer = useThree(({ gl }) => gl);

  useEffect(() => {
    for (const texture of textures) renderer.initTexture(texture);
  }, [renderer, textures]);

  return useMemo(() => groupBeachPropTextures(textures), [textures]);
}

// ---------------------------------------------------------------------------
// Deterministic scatter
// ---------------------------------------------------------------------------

/**
 * A 32-bit hash-based sequence, not `Math.random`.
 *
 * Scatter has to be identical on every mount: the Task 8 diagnostics report
 * instance counts, the visual pass compares screenshots between runs, and a
 * reduced-quality remount must not reshuffle the dunes under the guest.
 */
export function createBeachScatter(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4_294_967_296;
  };
}

// ---------------------------------------------------------------------------
// Placement
// ---------------------------------------------------------------------------

export type BeachPostPlacement = {
  readonly leanX: number;
  readonly leanZ: number;
  readonly position: readonly [number, number, number];
  readonly rotationY: number;
  readonly scaleY: number;
};

/**
 * The hanging line: posts spanning the frames, planted on the sand.
 *
 * The line is derived from the frame geometry rather than from the camera rail,
 * so the posts stay under the frames if the pose is ever retuned.
 */
export function resolveBeachPostPlacements(
  scenes: readonly BeachJourneyScene[],
  count: number,
): readonly BeachPostPlacement[] {
  if (count <= 0) return [];

  const anchors = scenes.map((scene) => getBeachFrameGeometry(scene).position);
  if (anchors.length === 0) return [];

  const xs = anchors.map(([x]) => x);
  const zs = anchors.map(([, , z]) => z);
  const minX = Math.min(...xs) - BEACH_POST_LINE_MARGIN_METRES;
  const maxX = Math.max(...xs) + BEACH_POST_LINE_MARGIN_METRES;
  const lineZ = zs.reduce((total, z) => total + z, 0) / zs.length;
  const span = maxX - minX;
  const random = createBeachScatter(0x5eab01);

  return Array.from({ length: count }, (_unused, index) => {
    // `count - 1` would put a post exactly on each end; dividing by `count`
    // and offsetting by half a step keeps the line from looking terminated.
    const x = minX + (span * (index + 0.5)) / count;
    const z = lineZ + (random() - 0.5) * 0.8;
    return {
      leanX: (random() - 0.5) * 0.09,
      leanZ: (random() - 0.5) * 0.07,
      position: [x, beachGroundHeightAt(x, z), z] as const,
      rotationY: random() * Math.PI * 2,
      scaleY: 0.86 + random() * 0.28,
    };
  });
}

export type BeachTablePlacement = {
  readonly clothTint: number;
  readonly flowerTint: number;
  readonly position: readonly [number, number, number];
  readonly rotationY: number;
  readonly scale: number;
  readonly windPhase: number;
};

/**
 * The reception tables, in two bands along the shore.
 *
 * Neither band crosses the walked rail (z 7 to 7.9): the seaward band stands
 * between the frames and the water where the down-shore view looks, and the
 * landward band sits behind the walk, so the guest never has a table growing
 * through the pose or through a photograph. Both bands stay clear of the
 * waterline's +/-2.4m swing, so no table stands in the sea.
 *
 * Placement is stratified rather than uniform — each table gets its own slice of
 * the alongshore span and jitters inside it — because uniform hashing clumps, and
 * a clump of banquet tables reads as a pile of furniture rather than as a set
 * reception.
 */
export function resolveBeachTablePlacements(
  count: number,
): readonly BeachTablePlacement[] {
  if (count <= 0) return [];

  const random = createBeachScatter(0x7ab1e5);
  const xSpan = BEACH_TABLE_X_MAX_METRES - BEACH_TABLE_X_MIN_METRES;
  const slice = xSpan / count;

  return Array.from({ length: count }, (_unused, index) => {
    // 0.5 of a slice of jitter, so a table can drift within its own slice but
    // never swap places with its neighbour.
    const x = BEACH_TABLE_X_MIN_METRES
      + slice * (index + 0.25 + random() * 0.5);

    const seaward = random() < BEACH_TABLE_SEAWARD_SHARE;
    const zMin = seaward
      ? BEACH_TABLE_SEAWARD_Z_MIN_METRES
      : BEACH_TABLE_LANDWARD_Z_MIN_METRES;
    const zMax = seaward
      ? BEACH_TABLE_SEAWARD_Z_MAX_METRES
      : BEACH_TABLE_LANDWARD_Z_MAX_METRES;
    const z = zMin + random() * (zMax - zMin);

    const clothTint = 1 - random() * 0.06;
    const flowerTint = FLOWER_TINTS[Math.floor(random() * FLOWER_TINTS.length)]
      ?? FLOWER_TINTS[0];

    return {
      // Packed as a single greyscale multiplier so the cloth's instance colour
      // only varies its shade, never its hue — banquet linen is one bolt of
      // cloth, and a per-table hue would read as mismatched tablecloths.
      clothTint,
      flowerTint,
      position: [x, beachGroundHeightAt(x, z), z] as const,
      rotationY: random() * Math.PI * 2,
      scale: 0.94 + random() * 0.12,
      windPhase: random() * Math.PI * 2,
    };
  });
}

// ---------------------------------------------------------------------------
// Geometry
// ---------------------------------------------------------------------------

/**
 * A post, pivoted at its base so the instance scale reads as height.
 *
 * Copied from `createForestTrunkGeometry`'s approach: build the cylinder,
 * translate the pivot down, then remap V so the wood grain repeats up the post
 * instead of stretching once over it.
 */
export function createBeachPostGeometry(): BufferGeometry {
  const geometry = new CylinderGeometry(
    BEACH_POST_TOP_RADIUS_METRES,
    BEACH_POST_BASE_RADIUS_METRES,
    1,
    BEACH_POST_RADIAL_SEGMENTS,
    1,
    false,
  );
  geometry.translate(0, 0.5, 0);

  const uv = geometry.getAttribute("uv");
  const remapped = new Float32Array(uv.count * 2);
  for (let index = 0; index < uv.count; index += 1) {
    remapped[index * 2] = uv.getX(index);
    remapped[index * 2 + 1] = uv.getY(index) * POST_UV_REPEAT_Y;
  }
  const attribute = new Float32BufferAttribute(remapped, 2);
  geometry.setAttribute("uv", attribute);
  geometry.setAttribute("uv1", attribute);
  geometry.computeBoundingSphere();
  return geometry;
}

/**
 * A white-clothed round table, pivoted at the sand and one unit of scale.
 *
 * Built as one merged mesh: the cloth is a continuous surface over the top and
 * down the skirt, so splitting it into separate meshes would put a shading seam
 * exactly on the table edge where the light wraps. The skirt is a cone rather
 * than a cylinder because linen flares at the hem, and it is `DoubleSide` so the
 * inside of the hem is not a hole when the camera passes low and close.
 *
 * No maps: the linen carries no pattern to sample, and the decoded texture budget
 * is the scene's binding constraint. Fold shading comes from the scalloped hem
 * radius and the environment term.
 */
export function createBeachTableGeometry(): BufferGeometry {
  const segments = BEACH_TABLE_RADIAL_SEGMENTS;
  const topRadius = BEACH_TABLE_RADIUS_METRES;
  const hemRadius = topRadius + BEACH_TABLE_HEM_FLARE_METRES;
  const height = BEACH_TABLE_HEIGHT_METRES;

  const positions: number[] = [];
  const normals: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];

  // Cloth top: a fan from the centre out to the table edge.
  positions.push(0, height, 0);
  normals.push(0, 1, 0);
  uvs.push(0.5, 0.5);
  for (let segment = 0; segment <= segments; segment += 1) {
    const angle = (segment / segments) * Math.PI * 2;
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    positions.push(cos * topRadius, height, sin * topRadius);
    normals.push(0, 1, 0);
    uvs.push(0.5 + cos * 0.5, 0.5 + sin * 0.5);
  }
  for (let segment = 0; segment < segments; segment += 1) {
    indices.push(0, segment + 2, segment + 1);
  }

  // Skirt: table edge down to the flared hem, with the hem radius scalloped so
  // the drape has folds instead of reading as a smooth lampshade.
  const skirtBase = positions.length / 3;
  const folds = 12;
  for (let segment = 0; segment <= segments; segment += 1) {
    const angle = (segment / segments) * Math.PI * 2;
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    // 3cm of scallop: deep enough to catch a highlight, shallow enough that the
    // hem still reads as a circle.
    const scallop = 0.03 * Math.sin(angle * folds);
    const hem = hemRadius + scallop;

    positions.push(cos * topRadius, height, sin * topRadius);
    positions.push(cos * hem, 0, sin * hem);
    // The skirt leans out, so its normal tilts up by the flare's slope rather
    // than pointing straight out from the axis.
    const slope = (hem - topRadius) / height;
    const length = Math.hypot(1, slope);
    for (let repeat = 0; repeat < 2; repeat += 1) {
      normals.push(cos / length, slope / length, sin / length);
    }
    uvs.push(segment / segments, 1, segment / segments, 0);
  }
  for (let segment = 0; segment < segments; segment += 1) {
    const a = skirtBase + segment * 2;
    indices.push(a, a + 1, a + 3, a, a + 3, a + 2);
  }

  const geometry = new BufferGeometry();
  geometry.setAttribute("position", new Float32BufferAttribute(positions, 3));
  geometry.setAttribute("normal", new Float32BufferAttribute(normals, 3));
  const uvAttribute = new Float32BufferAttribute(uvs, 2);
  geometry.setAttribute("uv", uvAttribute);
  geometry.setAttribute("uv1", uvAttribute);
  geometry.setIndex(indices);
  geometry.computeBoundingSphere();
  return geometry;
}

/**
 * A centrepiece: a low dome of blooms over a collar of foliage.
 *
 * Pivoted at the cloth, so an instance can be planted at
 * `BEACH_TABLE_HEIGHT_METRES` and scaled with its table. Each bloom is a small
 * fan of petals facing its own outward direction on the dome, which is what makes
 * a cluster of triangles read as an arrangement rather than as a green ball.
 * Blooms and foliage are separated by vertex colour rather than by material, so
 * the whole centrepiece is one draw call per instanced mesh.
 */
export function createBeachFlowerGeometry(
  bloomsPerCluster = BEACH_FLOWER_BLOOMS_PER_CLUSTER,
): BufferGeometry {
  const positions: number[] = [];
  const normals: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];
  const bloomMask: number[] = [];
  const random = createBeachScatter(0x30ce5a);

  const radius = BEACH_FLOWER_CLUSTER_RADIUS_METRES;
  const height = BEACH_FLOWER_HEIGHT_METRES;
  /**
   * Largest petal reach, and the dome apex that leaves room for it.
   *
   * A bloom is a fan of petals around its centre, so the arrangement's real top
   * is the topmost bloom's centre *plus* its petal radius — placing centres up to
   * `height` overshot the authored height by the petal reach. Deriving the apex
   * by subtraction keeps the whole centrepiece inside `height` whatever the
   * random petal size draws.
   */
  const maxPetalReach = radius * 0.46;
  const domeApexY = height - maxPetalReach;
  const domeBaseY = height * 0.16;

  // Foliage collar: a flat ruff just above the cloth, wider than the blooms, so
  // the arrangement has a base and does not appear to float.
  const collarSegments = 10;
  const collarCentre = positions.length / 3;
  positions.push(0, domeBaseY, 0);
  normals.push(0, 1, 0);
  uvs.push(0.5, 0.5);
  bloomMask.push(0);
  for (let segment = 0; segment <= collarSegments; segment += 1) {
    const angle = (segment / collarSegments) * Math.PI * 2;
    const leafRadius = radius * (1.02 + random() * 0.26);
    positions.push(
      Math.cos(angle) * leafRadius,
      domeBaseY * (0.45 + random() * 0.3),
      Math.sin(angle) * leafRadius,
    );
    normals.push(0, 1, 0);
    uvs.push(0.5, 0);
    bloomMask.push(0);
  }
  for (let segment = 0; segment < collarSegments; segment += 1) {
    indices.push(collarCentre, collarCentre + segment + 2, collarCentre + segment + 1);
  }

  for (let bloom = 0; bloom < bloomsPerCluster; bloom += 1) {
    // Spread the blooms over a dome: a golden-angle spiral in azimuth with the
    // polar angle biased toward the top, so the dome is covered without the
    // regular rings a uniform grid would produce.
    const spiral = bloom * 2.39996;
    const polar = Math.acos(1 - 0.82 * ((bloom + 0.5) / bloomsPerCluster));
    const domeX = Math.sin(polar) * Math.cos(spiral) * radius;
    const domeZ = Math.sin(polar) * Math.sin(spiral) * radius;
    // Interpolated between the collar and the apex, so no bloom centre — and so
    // no petal — can pass the authored height.
    const domeY = domeBaseY + Math.cos(polar) * (domeApexY - domeBaseY);

    // The bloom faces out along the dome's own normal.
    const outward = [domeX, domeY - domeBaseY, domeZ];
    const outwardLength = Math.hypot(...outward) || 1;
    const facing = outward.map((value) => value / outwardLength) as [number, number, number];
    // Any vector not parallel to the facing direction works as the first tangent.
    const helper: [number, number, number] = Math.abs(facing[1]) > 0.9
      ? [1, 0, 0]
      : [0, 1, 0];
    const tangentA = [
      helper[1] * facing[2] - helper[2] * facing[1],
      helper[2] * facing[0] - helper[0] * facing[2],
      helper[0] * facing[1] - helper[1] * facing[0],
    ];
    const tangentALength = Math.hypot(...tangentA) || 1;
    const uAxis = tangentA.map((value) => value / tangentALength);
    const vAxis = [
      facing[1] * uAxis[2]! - facing[2] * uAxis[1]!,
      facing[2] * uAxis[0]! - facing[0] * uAxis[2]!,
      facing[0] * uAxis[1]! - facing[1] * uAxis[0]!,
    ];

    const petalRadius = maxPetalReach * (0.65 + random() * 0.35);
    const centre = positions.length / 3;
    positions.push(domeX, domeY, domeZ);
    normals.push(...facing);
    uvs.push(0.5, 0.5);
    bloomMask.push(1);

    const twist = random() * Math.PI * 2;
    for (let petal = 0; petal <= BEACH_FLOWER_PETALS_PER_BLOOM; petal += 1) {
      const angle = twist + (petal / BEACH_FLOWER_PETALS_PER_BLOOM) * Math.PI * 2;
      const cos = Math.cos(angle) * petalRadius;
      const sin = Math.sin(angle) * petalRadius;
      positions.push(
        domeX + uAxis[0]! * cos + vAxis[0]! * sin,
        domeY + uAxis[1]! * cos + vAxis[1]! * sin,
        domeZ + uAxis[2]! * cos + vAxis[2]! * sin,
      );
      normals.push(...facing);
      uvs.push(0.5, 0);
      bloomMask.push(1);
    }
    for (let petal = 0; petal < BEACH_FLOWER_PETALS_PER_BLOOM; petal += 1) {
      indices.push(centre, centre + petal + 2, centre + petal + 1);
    }
  }

  const geometry = new BufferGeometry();
  geometry.setAttribute("position", new Float32BufferAttribute(positions, 3));
  geometry.setAttribute("normal", new Float32BufferAttribute(normals, 3));
  const uvAttribute = new Float32BufferAttribute(uvs, 2);
  geometry.setAttribute("uv", uvAttribute);
  geometry.setAttribute("uv1", uvAttribute);
  // Read by the material's shader patch to pick bloom tint over foliage green.
  geometry.setAttribute("bloomMask", new Float32BufferAttribute(bloomMask, 1));
  geometry.setIndex(indices);
  geometry.computeBoundingSphere();
  return geometry;
}

// ---------------------------------------------------------------------------
// Materials
// ---------------------------------------------------------------------------

function createWoodMaterial(
  mapSet: BeachPropMapSet | null,
  fallbackColor: string,
): MeshStandardMaterial {
  if (!mapSet) {
    return new MeshStandardMaterial({
      color: fallbackColor,
      metalness: 0,
      roughness: 0.82,
    });
  }

  return new MeshStandardMaterial({
    aoMap: mapSet.arm,
    map: mapSet.color,
    metalness: 0,
    normalMap: mapSet.normal,
    roughness: 1,
    roughnessMap: mapSet.arm,
  });
}

/**
 * Linen: an untextured white dielectric, rough enough to have no sheen.
 *
 * `DoubleSide` for the hem's inside face, and `flatShading` off so the scalloped
 * skirt reads as drape rather than as facets.
 */
function createTableClothMaterial(): MeshStandardMaterial {
  return new MeshStandardMaterial({
    color: TABLE_CLOTH_COLOR,
    metalness: 0,
    roughness: 0.86,
    side: DoubleSide,
  });
}

/**
 * Petals and foliage in one material, selected per vertex.
 *
 * The instance colour carries the bloom tint, and `bloomMask` chooses between it
 * and the foliage green — so an arrangement is one draw call instead of two, and
 * each table can have its own flower colour without its own material. Patched
 * rather than written from scratch so the blooms still take the scene's PBR
 * lighting and the environment term.
 */
function createFlowerMaterial(): {
  readonly material: MeshStandardMaterial;
  readonly wind: BeachWindUniforms;
} {
  const material = new MeshStandardMaterial({
    metalness: 0,
    roughness: 0.72,
    side: DoubleSide,
  });

  const wind = attachBeachWind(material, BEACH_FLOWER_WIND_HEIGHT);
  const foliage = new Color(FOLIAGE_TINT);

  // `attachBeachWind` owns `onBeforeCompile`, so chain onto it rather than
  // replacing it — overwriting would silently drop the sway.
  const windPatch = material.onBeforeCompile;
  material.onBeforeCompile = (shader, renderer) => {
    windPatch?.(shader, renderer);

    shader.vertexShader = shader.vertexShader
      .replace(
        "#include <common>",
        `#include <common>
attribute float bloomMask;
varying float vBeachBloomMask;`,
      )
      .replace(
        "#include <begin_vertex>",
        `#include <begin_vertex>
vBeachBloomMask = bloomMask;`,
      );

    shader.fragmentShader = shader.fragmentShader
      .replace(
        "#include <common>",
        `#include <common>
varying float vBeachBloomMask;
uniform vec3 uFoliageColor;`,
      )
      .replace(
        "#include <color_fragment>",
        `#include <color_fragment>
diffuseColor.rgb = mix(uFoliageColor, diffuseColor.rgb, vBeachBloomMask);`,
      );

    shader.uniforms.uFoliageColor = { value: foliage };
  };

  material.customProgramCacheKey = () => "beach-flowers";
  return { material, wind };
}

// ---------------------------------------------------------------------------
// Components
// ---------------------------------------------------------------------------

function DriftwoodPosts({
  mapSet,
  placements,
}: {
  readonly mapSet: BeachPropMapSet | null;
  readonly placements: readonly BeachPostPlacement[];
}) {
  const geometry = useMemo(() => createBeachPostGeometry(), []);
  const material = useMemo(
    () => createWoodMaterial(mapSet, POST_FALLBACK_COLOR),
    [mapSet],
  );
  const meshRef = useRef<InstancedMesh | null>(null);

  useLayoutEffect(() => {
    const mesh = meshRef.current;
    if (!mesh) return;

    const object = new Object3D();
    placements.forEach((placement, index) => {
      object.position.set(...placement.position);
      object.rotation.set(placement.leanX, placement.rotationY, placement.leanZ);
      object.scale.set(1, BEACH_POST_HEIGHT_METRES * placement.scaleY, 1);
      object.updateMatrix();
      mesh.setMatrixAt(index, object.matrix);
    });
    mesh.count = placements.length;
    mesh.instanceMatrix.needsUpdate = true;
    mesh.computeBoundingSphere();
  }, [placements]);

  useEffect(() => () => geometry.dispose(), [geometry]);
  useEffect(() => () => material.dispose(), [material]);

  if (placements.length === 0) return null;

  return (
    <instancedMesh
      args={[geometry, material, placements.length]}
      castShadow={false}
      name="beach-driftwood-posts"
      receiveShadow={false}
      ref={meshRef}
    />
  );
}

/**
 * The reception tables and their centrepieces.
 *
 * Two instanced meshes over one placement list: the cloth is still and takes no
 * wind, while the flowers sway, so they cannot share a material. Both read the
 * same `placements`, so a table and its centrepiece can never drift apart.
 */
function ReceptionTables({
  cueRef,
  placements,
  reducedMotion,
}: {
  readonly cueRef: MutableRefObject<BeachJourneyCueState>;
  readonly placements: readonly BeachTablePlacement[];
  readonly reducedMotion: boolean;
}) {
  const clothGeometry = useMemo(() => createBeachTableGeometry(), []);
  const flowerGeometry = useMemo(() => createBeachFlowerGeometry(), []);
  const clothMaterial = useMemo(() => createTableClothMaterial(), []);
  const flowers = useMemo(() => createFlowerMaterial(), []);

  const clothRef = useRef<InstancedMesh | null>(null);
  const flowerRef = useRef<InstancedMesh | null>(null);

  useLayoutEffect(() => {
    const cloth = clothRef.current;
    const bloom = flowerRef.current;
    if (!cloth || !bloom) return;

    const object = new Object3D();
    const color = new Color();
    const windValues = new Float32Array(Math.max(1, placements.length));

    placements.forEach((placement, index) => {
      object.position.set(...placement.position);
      object.rotation.set(0, placement.rotationY, 0);
      object.scale.setScalar(placement.scale);
      object.updateMatrix();
      cloth.setMatrixAt(index, object.matrix);
      cloth.setColorAt(
        index,
        color.setScalar(placement.clothTint),
      );

      // The centrepiece rides on the cloth, so its own pivot is lifted by the
      // table's height — scaled with the table, or a taller table would leave its
      // flowers hovering.
      object.position.set(
        placement.position[0],
        placement.position[1] + BEACH_TABLE_HEIGHT_METRES * placement.scale,
        placement.position[2],
      );
      object.updateMatrix();
      bloom.setMatrixAt(index, object.matrix);
      bloom.setColorAt(index, color.setHex(placement.flowerTint));
      windValues[index] = placement.windPhase;
    });

    flowerGeometry.setAttribute(
      "instanceWindPhase",
      new InstancedBufferAttribute(windValues, 1),
    );

    for (const mesh of [cloth, bloom]) {
      mesh.count = placements.length;
      mesh.instanceMatrix.needsUpdate = true;
      if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
      mesh.computeBoundingSphere();
    }
  }, [flowerGeometry, placements]);

  useFrame(({ clock }) => {
    driveBeachWind(
      flowers.wind,
      clock.getElapsedTime(),
      BEACH_FLOWER_WIND_BASE
        + cueRef.current.windStrength * BEACH_FLOWER_WIND_CUE_GAIN,
      reducedMotion,
    );
  });

  useEffect(() => () => {
    clothGeometry.dispose();
    flowerGeometry.dispose();
  }, [clothGeometry, flowerGeometry]);
  useEffect(() => () => {
    clothMaterial.dispose();
    flowers.material.dispose();
  }, [clothMaterial, flowers]);

  if (placements.length === 0) return null;

  return (
    <group name="beach-reception-tables">
      <instancedMesh
        args={[clothGeometry, clothMaterial, placements.length]}
        castShadow={false}
        name="beach-table-cloths"
        receiveShadow={false}
        ref={clothRef}
      />
      <instancedMesh
        args={[flowerGeometry, flowers.material, placements.length]}
        castShadow={false}
        name="beach-table-flowers"
        receiveShadow={false}
        ref={flowerRef}
      />
    </group>
  );
}

export type BeachPropsProps = {
  readonly cueRef: MutableRefObject<BeachJourneyCueState>;
  readonly density: BeachWorldDensity;
  readonly reducedMotion: boolean;
  readonly scenes: readonly BeachJourneyScene[];
  /** Prop maps, or null when they failed to load. */
  readonly textures: BeachPropTextures | null;
};

export function BeachProps({
  cueRef,
  density,
  reducedMotion,
  scenes,
  textures,
}: BeachPropsProps) {
  const postPlacements = useMemo(
    () => resolveBeachPostPlacements(scenes, density.posts),
    [density.posts, scenes],
  );
  const tablePlacements = useMemo(
    () => resolveBeachTablePlacements(density.tables),
    [density.tables],
  );

  return (
    <group data-beach-photoreal-props>
      <DriftwoodPosts
        mapSet={textures ? textures.driftwood : null}
        placements={postPlacements}
      />
      <ReceptionTables
        cueRef={cueRef}
        placements={tablePlacements}
        reducedMotion={reducedMotion}
      />
    </group>
  );
}

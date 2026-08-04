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
  BoxGeometry,
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
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";

import type { BeachJourneyScene } from "@/data/beach-wedding-journey";

import type { BeachJourneyCueState } from "../beach-cue-state";
import { getBeachFrameGeometry } from "../beach-frame-geometry";
import { shorelineOffsetAt } from "../beach-shoreline";
import type { BeachWorldDensity } from "../beach-world-data";
import { BEACH_PHOTOREAL_ASSETS } from "./beach-asset-manifest";
import {
  BEACH_SAND_Z_MAX_METRES,
  beachGroundHeightAt,
} from "./beach-terrain";

/**
 * Shore dressing: the driftwood posts the frames hang between, the pier at the
 * finale, and the marram grass on the backshore dunes.
 *
 * Two constraints shaped this file. First, every prop map in
 * `beach-asset-manifest.ts` is `group: "props"` and non-blocking, so a load
 * failure here must degrade to flat colour instead of removing the shore
 * furniture. Second, there is no grass atlas in the manifest and the decoded
 * texture budget sits at roughly 6% headroom, so the grass cannot be alpha
 * cards — a crossed card without an atlas is an opaque rectangle. The tufts are
 * therefore built from tapered blades, which are geometrically opaque, need no
 * alpha test, and read as marram at walking distance.
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

/** Deck height above the water level, in metres. */
export const BEACH_PIER_DECK_HEIGHT_METRES = 1.15;

/** Deck width across the walk, in metres. */
export const BEACH_PIER_DECK_WIDTH_METRES = 2.6;

/** How far landward of the finale pose the deck starts, in metres. */
export const BEACH_PIER_LANDWARD_REACH_METRES = 1.5;

/** How far seaward of the shoreline the deck reaches, in metres. */
export const BEACH_PIER_SEAWARD_REACH_METRES = 18;

/** Spacing between pole rows along the deck, in metres. */
export const BEACH_PIER_POLE_SPACING_METRES = 4;

/** Poles per row: one down each side of the deck. */
export const BEACH_PIER_POLES_PER_ROW = 2;

/** Fraction of a plank's slot filled by the plank; the rest is the gap. */
export const BEACH_PIER_PLANK_FILL = 0.82;

/** Plank thickness, in metres. */
const BEACH_PIER_PLANK_THICKNESS_METRES = 0.06;

/** Pole radius, in metres. */
const BEACH_PIER_POLE_RADIUS_METRES = 0.11;

/** Landward edge of the dune-grass band, in metres of z. */
export const BEACH_DUNE_GRASS_Z_MIN_METRES = 13;

/** Seaward edge of the dune-grass band, in metres of z. */
export const BEACH_DUNE_GRASS_Z_MAX_METRES = BEACH_SAND_Z_MAX_METRES - 2;

/** Alongshore span of the dune-grass band, in metres of x. */
export const BEACH_DUNE_GRASS_X_MIN_METRES = -22;
export const BEACH_DUNE_GRASS_X_MAX_METRES = 118;

/** Height a tuft ramps its sway over, in metres. */
export const BEACH_GRASS_WIND_HEIGHT = 0.95;

/** Blades per tuft. */
export const BEACH_GRASS_BLADES_PER_TUFT = 5;

/** Base wind strength with no cue, and the gain at full cue. */
export const BEACH_GRASS_WIND_BASE = 0.055;
export const BEACH_GRASS_WIND_CUE_GAIN = 0.048;

const POST_FALLBACK_COLOR = "#a08464";
const PIER_FALLBACK_COLOR = "#8e7355";
const GRASS_TINTS = [0x9fa06a, 0x8b9358, 0xb2ab72, 0x7f8c55] as const;

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
  readonly frames: readonly [BeachPropMapSet, BeachPropMapSet];
  readonly pier: BeachPropMapSet;
};

export const BEACH_PROP_ASSET_ERROR_MARKER = "beach-prop-asset-load";

const PROP_ASSET_IDS = [
  "pierPlanksColor",
  "pierPlanksNormal",
  "pierPlanksArm",
  "frame01Color",
  "frame01Normal",
  "frame01Arm",
  "frame02Color",
  "frame02Normal",
  "frame02Arm",
] as const;

const COLOR_PROP_ASSET_IDS = new Set<string>([
  "frame01Color",
  "frame02Color",
  "pierPlanksColor",
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
    pier: {
      arm: require("pierPlanksArm"),
      color: require("pierPlanksColor"),
      normal: require("pierPlanksNormal"),
    },
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

export type BeachGrassPlacement = {
  readonly position: readonly [number, number, number];
  readonly rotationY: number;
  readonly scale: number;
  readonly tint: number;
  readonly windPhase: number;
};

/**
 * Marram tufts on the backshore.
 *
 * The band starts at `BEACH_DUNE_GRASS_Z_MIN_METRES`, landward of both the
 * walked rail (z 7 to 7.9) and the hanging line, so no tuft can grow through a
 * frame or between the camera and the sea.
 */
export function resolveBeachDuneGrassPlacements(
  count: number,
): readonly BeachGrassPlacement[] {
  if (count <= 0) return [];

  const random = createBeachScatter(0x9d0e17);
  const xSpan = BEACH_DUNE_GRASS_X_MAX_METRES - BEACH_DUNE_GRASS_X_MIN_METRES;
  const zSpan = BEACH_DUNE_GRASS_Z_MAX_METRES - BEACH_DUNE_GRASS_Z_MIN_METRES;

  return Array.from({ length: count }, () => {
    const x = BEACH_DUNE_GRASS_X_MIN_METRES + random() * xSpan;
    // Squaring the z fraction biases tufts landward, where the dune crest is,
    // so the band thins out as it approaches the walk instead of ending on a
    // straight edge.
    const zFraction = random() ** 2;
    const z = BEACH_DUNE_GRASS_Z_MAX_METRES - zFraction * zSpan;
    const tint = GRASS_TINTS[Math.floor(random() * GRASS_TINTS.length)]
      ?? GRASS_TINTS[0];

    return {
      position: [x, beachGroundHeightAt(x, z), z] as const,
      rotationY: random() * Math.PI * 2,
      scale: 0.62 + random() * 0.72,
      tint,
      windPhase: random() * Math.PI * 2,
    };
  });
}

export type BeachPierLayout = {
  readonly deckCenterZ: number;
  readonly deckLength: number;
  readonly deckWidth: number;
  readonly deckY: number;
  readonly landwardZ: number;
  readonly plankCount: number;
  readonly poleRowCount: number;
  readonly poleXOffsets: readonly [number, number];
  readonly seawardZ: number;
  readonly x: number;
};

/**
 * The finale pier, laid out from the finale pose.
 *
 * The seaward end is measured from `shorelineOffsetAt` at the pier's own x, not
 * from a fixed z: the shoreline curves by up to 2.4m alongshore, so a fixed end
 * would leave the deck stopping short of the water at some x values and the
 * poles standing on dry sand.
 */
export function getBeachPierLayout(
  scene: Pick<BeachJourneyScene, "cameraPosition" | "lookTarget">,
  plankCount: number,
): BeachPierLayout {
  const { position } = getBeachFrameGeometry(scene);
  const x = position[0];
  const landwardZ = scene.cameraPosition[2] + BEACH_PIER_LANDWARD_REACH_METRES;
  const seawardZ = shorelineOffsetAt(x) - BEACH_PIER_SEAWARD_REACH_METRES;
  const deckLength = landwardZ - seawardZ;
  const poleRowCount = Math.max(
    2,
    Math.round(deckLength / BEACH_PIER_POLE_SPACING_METRES) + 1,
  );
  const poleInset = BEACH_PIER_DECK_WIDTH_METRES / 2 - BEACH_PIER_POLE_RADIUS_METRES * 2;

  return {
    deckCenterZ: (landwardZ + seawardZ) / 2,
    deckLength,
    deckWidth: BEACH_PIER_DECK_WIDTH_METRES,
    deckY: BEACH_PIER_DECK_HEIGHT_METRES,
    landwardZ,
    plankCount: Math.max(1, plankCount),
    poleRowCount,
    poleXOffsets: [-poleInset, poleInset],
    seawardZ,
    x,
  };
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
 * A tuft of tapered blades, pivoted at the base and one unit tall.
 *
 * Opaque geometry rather than an alpha card: no grass atlas ships in the
 * manifest and the decoded texture budget has no room for one, so a card would
 * either be a visible rectangle or need a texture that does not exist. Blades
 * are drawn `DoubleSide` so a tuft reads from any approach angle.
 */
export function createBeachGrassTuftGeometry(
  bladesPerTuft = BEACH_GRASS_BLADES_PER_TUFT,
): BufferGeometry {
  const heights = [0, 0.42, 0.74, 1] as const;
  const widths = [1, 0.66, 0.34, 0] as const;
  const baseWidth = 0.035;

  const positions: number[] = [];
  const normals: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];
  const random = createBeachScatter(0x1cebba);

  for (let blade = 0; blade < bladesPerTuft; blade += 1) {
    const yaw = (blade / bladesPerTuft) * Math.PI * 2 + random() * 0.5;
    const lean = 0.14 + random() * 0.3;
    const heightScale = 0.7 + random() * 0.42;
    const cos = Math.cos(yaw);
    const sin = Math.sin(yaw);
    const base = positions.length / 3;

    for (let ring = 0; ring < heights.length; ring += 1) {
      const height = heights[ring]! * heightScale;
      // The blade bends away from vertical faster the higher it goes, which is
      // what makes a straight spike read as a growing leaf.
      const bend = lean * heights[ring]! ** 2;
      const halfWidth = (baseWidth * widths[ring]!) / 2;

      for (const side of [-1, 1] as const) {
        positions.push(
          cos * bend + -sin * halfWidth * side,
          height,
          sin * bend + cos * halfWidth * side,
        );
        normals.push(-sin, 0, cos);
        uvs.push((side + 1) / 2, heights[ring]!);
      }
    }

    for (let ring = 0; ring < heights.length - 1; ring += 1) {
      const a = base + ring * 2;
      indices.push(a, a + 1, a + 3, a, a + 3, a + 2);
    }
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

/** Deck planks, laid across the pier with a gap between each. */
export function createBeachPierDeckGeometry(
  layout: BeachPierLayout,
): BufferGeometry {
  const slot = layout.deckLength / layout.plankCount;
  const plankDepth = slot * BEACH_PIER_PLANK_FILL;
  const parts: BufferGeometry[] = [];

  for (let index = 0; index < layout.plankCount; index += 1) {
    const plank = new BoxGeometry(
      layout.deckWidth,
      BEACH_PIER_PLANK_THICKNESS_METRES,
      plankDepth,
    );
    plank.translate(0, 0, layout.seawardZ + slot * (index + 0.5) - layout.deckCenterZ);
    parts.push(plank);
  }

  const merged = mergeGeometries(parts);
  for (const part of parts) part.dispose();
  if (!merged) throw new Error("Beach pier deck geometry failed to merge");
  merged.computeBoundingSphere();
  return merged;
}

/** Pole rows under the deck, each pole reaching from the bed to the deck. */
export function createBeachPierPoleGeometry(
  layout: BeachPierLayout,
): BufferGeometry {
  const rowSpacing = layout.deckLength / Math.max(1, layout.poleRowCount - 1);
  const parts: BufferGeometry[] = [];

  for (let row = 0; row < layout.poleRowCount; row += 1) {
    const z = layout.seawardZ + rowSpacing * row;
    for (const offsetX of layout.poleXOffsets) {
      const bedY = beachGroundHeightAt(layout.x + offsetX, z);
      const height = layout.deckY - bedY;
      if (height <= 0) continue;

      const pole = new CylinderGeometry(
        BEACH_PIER_POLE_RADIUS_METRES,
        BEACH_PIER_POLE_RADIUS_METRES * 1.15,
        height,
        6,
        1,
        false,
      );
      pole.translate(
        offsetX,
        bedY + height / 2 - layout.deckY,
        z - layout.deckCenterZ,
      );
      parts.push(pole);
    }
  }

  if (parts.length === 0) {
    throw new Error("Beach pier has no poles above the bed");
  }

  const merged = mergeGeometries(parts);
  for (const part of parts) part.dispose();
  if (!merged) throw new Error("Beach pier pole geometry failed to merge");
  merged.computeBoundingSphere();
  return merged;
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

function DuneGrass({
  cueRef,
  placements,
  reducedMotion,
}: {
  readonly cueRef: MutableRefObject<BeachJourneyCueState>;
  readonly placements: readonly BeachGrassPlacement[];
  readonly reducedMotion: boolean;
}) {
  const geometry = useMemo(() => createBeachGrassTuftGeometry(), []);
  const surface = useMemo(() => {
    const material = new MeshStandardMaterial({
      metalness: 0,
      roughness: 0.78,
      side: DoubleSide,
    });
    return { material, wind: attachBeachWind(material, BEACH_GRASS_WIND_HEIGHT) };
  }, []);

  const meshRef = useRef<InstancedMesh | null>(null);

  useLayoutEffect(() => {
    const mesh = meshRef.current;
    if (!mesh) return;

    const object = new Object3D();
    const color = new Color();
    const windValues = new Float32Array(Math.max(1, placements.length));
    placements.forEach((placement, index) => {
      object.position.set(...placement.position);
      object.rotation.set(0, placement.rotationY, 0);
      object.scale.set(placement.scale, placement.scale, placement.scale);
      object.updateMatrix();
      mesh.setMatrixAt(index, object.matrix);
      mesh.setColorAt(index, color.setHex(placement.tint));
      windValues[index] = placement.windPhase;
    });

    geometry.setAttribute(
      "instanceWindPhase",
      new InstancedBufferAttribute(windValues, 1),
    );
    mesh.count = placements.length;
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    mesh.computeBoundingSphere();
  }, [geometry, placements]);

  useFrame(({ clock }) => {
    driveBeachWind(
      surface.wind,
      clock.getElapsedTime(),
      BEACH_GRASS_WIND_BASE + cueRef.current.windStrength * BEACH_GRASS_WIND_CUE_GAIN,
      reducedMotion,
    );
  });

  useEffect(() => () => geometry.dispose(), [geometry]);
  useEffect(() => () => surface.material.dispose(), [surface]);

  if (placements.length === 0) return null;

  return (
    <instancedMesh
      args={[geometry, surface.material, placements.length]}
      castShadow={false}
      name="beach-dune-grass"
      receiveShadow={false}
      ref={meshRef}
    />
  );
}

function FinalePier({
  layout,
  mapSet,
}: {
  readonly layout: BeachPierLayout;
  readonly mapSet: BeachPropMapSet | null;
}) {
  const deckGeometry = useMemo(() => createBeachPierDeckGeometry(layout), [layout]);
  const poleGeometry = useMemo(() => createBeachPierPoleGeometry(layout), [layout]);
  const material = useMemo(
    () => createWoodMaterial(mapSet, PIER_FALLBACK_COLOR),
    [mapSet],
  );

  useEffect(() => () => {
    deckGeometry.dispose();
    poleGeometry.dispose();
  }, [deckGeometry, poleGeometry]);
  useEffect(() => () => material.dispose(), [material]);

  return (
    <group
      name="beach-finale-pier"
      position={[layout.x, layout.deckY, layout.deckCenterZ]}
    >
      <mesh args={[deckGeometry, material]} castShadow={false} receiveShadow={false} />
      <mesh args={[poleGeometry, material]} castShadow={false} receiveShadow={false} />
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
  const grassPlacements = useMemo(
    () => resolveBeachDuneGrassPlacements(density.duneGrass),
    [density.duneGrass],
  );

  const finale = useMemo(
    () => scenes.find((scene) => scene.type === "finale") ?? null,
    [scenes],
  );
  const pierLayout = useMemo(
    () => (finale ? getBeachPierLayout(finale, density.pierPlanks) : null),
    [density.pierPlanks, finale],
  );

  return (
    <group data-beach-photoreal-props>
      <DriftwoodPosts
        mapSet={textures ? textures.pier : null}
        placements={postPlacements}
      />
      <DuneGrass
        cueRef={cueRef}
        placements={grassPlacements}
        reducedMotion={reducedMotion}
      />
      {pierLayout ? (
        <FinalePier
          layout={pierLayout}
          mapSet={textures ? textures.pier : null}
        />
      ) : null}
    </group>
  );
}

import { CatmullRomCurve3, Vector3 } from "three";

import { FOREST_PHOTOREAL_ASSETS } from "./photoreal/forest-asset-manifest";

export type ForestWorldViewport = "desktop" | "mobile";
export type ForestWorldQualityTier = ForestWorldViewport | "reduced";

export type ForestWorldDensity = {
  readonly farTrees: number;
  readonly grass: number;
  readonly midTrees: number;
  readonly petals: number;
  readonly wildflowers: number;
};

export type ForestWorldVector3 = readonly [number, number, number];

export type ForestWorldPlacement = {
  readonly pathOffset: number;
  readonly position: ForestWorldVector3;
  readonly rotation: ForestWorldVector3;
  readonly scale: number;
  readonly tint: number;
  readonly windPhase: number;
};

export type ForestTreePlacement = ForestWorldPlacement & {
  readonly atlasCell: number;
};

export type ForestFarTreePlacement = ForestTreePlacement & {
  readonly depthBand: 0 | 1 | 2;
};

export type ForestPetalPlacement = ForestWorldPlacement & {
  readonly atlasCell: number;
  readonly fallSpeed: number;
  readonly phase: number;
};

export type ForestPathSample = {
  readonly position: ForestWorldVector3;
  readonly tangent: ForestWorldVector3;
};

export type ForestClearingSlot = {
  readonly position: ForestWorldVector3;
  readonly radius: number;
  readonly sceneIndex: number;
  readonly side: -1 | 1;
};

export type ForestWorldPlacements = {
  readonly clearings: readonly ForestClearingSlot[];
  readonly farTrees: readonly ForestFarTreePlacement[];
  readonly grass: readonly ForestWorldPlacement[];
  readonly heroTrees: readonly ForestTreePlacement[];
  readonly midTrees: readonly ForestTreePlacement[];
  readonly pathCenterline: readonly ForestPathSample[];
  readonly petals: readonly ForestPetalPlacement[];
  readonly roots: readonly ForestWorldPlacement[];
  readonly shrubs: readonly ForestWorldPlacement[];
  readonly stones: readonly ForestWorldPlacement[];
  readonly wildflowers: readonly ForestTreePlacement[];
};

export type ForestContactSource =
  | "hero-tree"
  | "mid-tree"
  | "root"
  | "shrub"
  | "stone";

export type ForestContactCue = {
  readonly position: ForestWorldVector3;
  readonly rotationY: number;
  readonly scale: readonly [number, number];
  readonly source: ForestContactSource;
};

export type ForestEnvironmentMaterialMode =
  | "hybrid"
  | "procedural"
  | "textured";

export type ForestRuntimeTextureSpec = {
  readonly height: number;
  readonly src: string;
  readonly width: number;
};

export type ForestRuntimeTextureEstimate = ForestRuntimeTextureSpec & {
  readonly decodedRgbaMipBytes: number;
  readonly id: string;
};

export type ForestEnvironmentRuntimeEstimate = {
  readonly decodedRgbaMipBytes: number;
  readonly mode: ForestEnvironmentMaterialMode;
  readonly textures: readonly ForestRuntimeTextureEstimate[];
};

export type ForestEnvironmentLayerStyle = {
  readonly atlasName: ForestMaterialAtlasName | null;
  readonly geometry:
    | "atlas-card"
    | "branch-card-lod0"
    | "branch-card-lod1"
    | "canopy"
    | "far-trunk"
    | "flower-bud"
    | "panorama-impostor"
    | "petal";
};

export type ForestEnvironmentLayerContract = {
  readonly farForest: ForestEnvironmentLayerStyle;
  readonly heroCanopies: ForestEnvironmentLayerStyle;
  readonly midCanopies: ForestEnvironmentLayerStyle;
  readonly petals: ForestEnvironmentLayerStyle;
  readonly wildflowerHeads: ForestEnvironmentLayerStyle;
};

export type ForestWorldDiagnostics = {
  readonly corridorClear: boolean;
  readonly minimumHeroPathDistance: number;
  readonly minimumWildflowerPathDistance: number;
};

const DENSITIES = {
  desktop: {
    farTrees: 300,
    grass: 1_200,
    midTrees: 260,
    petals: 72,
    wildflowers: 260,
  },
  mobile: {
    farTrees: 200,
    grass: 720,
    midTrees: 170,
    petals: 42,
    wildflowers: 150,
  },
  reduced: {
    farTrees: 120,
    grass: 420,
    midTrees: 90,
    petals: 18,
    wildflowers: 90,
  },
} as const satisfies Record<ForestWorldQualityTier, ForestWorldDensity>;

export const FOREST_ENVIRONMENT_RUNTIME_TEXTURE_SPECS = {
  foliage: {
    height: 1_024,
    src: "/chungdoi/labs/forest-wedding-journey/materials/foliage-atlas.webp",
    width: 1_024,
  },
  ground: {
    height: 1_024,
    src: "/chungdoi/labs/forest-wedding-journey/materials/ground-detail.webp",
    width: 1_024,
  },
  petal: {
    height: 512,
    src: "/chungdoi/labs/forest-wedding-journey/materials/petal-atlas.webp",
    width: 512,
  },
  wildflower: {
    height: 1_024,
    src: "/chungdoi/labs/forest-wedding-journey/materials/wildflower-atlas.webp",
    width: 1_024,
  },
} as const satisfies Record<string, ForestRuntimeTextureSpec>;

export function estimateExactRgbaMipBytes(
  requestedWidth: number,
  requestedHeight: number,
): number {
  if (
    !Number.isInteger(requestedWidth)
    || !Number.isInteger(requestedHeight)
    || requestedWidth < 1
    || requestedHeight < 1
  ) {
    throw new RangeError("RGBA mip dimensions must be positive integers");
  }

  let width = requestedWidth;
  let height = requestedHeight;
  let pixels = 0;
  while (true) {
    pixels += width * height;
    if (width === 1 && height === 1) break;
    width = Math.max(1, Math.floor(width / 2));
    height = Math.max(1, Math.floor(height / 2));
  }
  return pixels * 4;
}

export function getForestEnvironmentRuntimeEstimate(
  mode: ForestEnvironmentMaterialMode,
): ForestEnvironmentRuntimeEstimate {
  if (mode === "procedural") {
    return {
      decodedRgbaMipBytes: 0,
      mode,
      textures: [],
    };
  }

  if (mode === "hybrid") {
    const textures = FOREST_PHOTOREAL_ASSETS.filter(
      (asset) => asset.group === "entry",
    ).map((asset): ForestRuntimeTextureEstimate => ({
      decodedRgbaMipBytes: estimateExactRgbaMipBytes(asset.width, asset.height),
      height: asset.height,
      id: asset.id,
      src: asset.src,
      width: asset.width,
    }));

    return {
      decodedRgbaMipBytes: textures.reduce(
        (total, texture) => total + texture.decodedRgbaMipBytes,
        0,
      ),
      mode,
      textures,
    };
  }

  const textures = Object.entries(FOREST_ENVIRONMENT_RUNTIME_TEXTURE_SPECS).map(
    ([id, spec]): ForestRuntimeTextureEstimate => ({
      ...spec,
      decodedRgbaMipBytes: estimateExactRgbaMipBytes(spec.width, spec.height),
      id,
    }),
  );
  return {
    decodedRgbaMipBytes: textures.reduce(
      (total, texture) => total + texture.decodedRgbaMipBytes,
      0,
    ),
    mode,
    textures,
  };
}

type ForestMaterialAtlasSpec = {
  readonly cellBoundsX: readonly number[];
  readonly cellBoundsY: readonly number[];
  readonly gutter: number;
  readonly height: number;
  readonly width: number;
};

export const FOREST_MATERIAL_ATLAS_SPECS = {
  backdrop: {
    cellBoundsX: [0, 1_024],
    cellBoundsY: [0, 512],
    gutter: 0,
    height: 512,
    width: 1_024,
  },
  conifer: {
    cellBoundsX: [0, 256, 512],
    cellBoundsY: [0, 256, 512],
    gutter: 8,
    height: 512,
    width: 1_024,
  },
  foliage: {
    cellBoundsX: [0, 512, 1_024],
    cellBoundsY: [0, 256, 512, 768, 1_024],
    gutter: 12,
    height: 1_024,
    width: 1_024,
  },
  petal: {
    cellBoundsX: [0, 128, 256, 384, 512],
    cellBoundsY: [0, 128, 256, 384, 512],
    gutter: 8,
    height: 512,
    width: 512,
  },
  wildflower: {
    cellBoundsX: [0, 256, 512, 768, 1_024],
    cellBoundsY: [0, 341, 683, 1_024],
    gutter: 10,
    height: 1_024,
    width: 1_024,
  },
  wildlife: {
    cellBoundsX: [0, 320, 640, 960],
    cellBoundsY: [0, 320, 640],
    gutter: 8,
    height: 640,
    width: 960,
  },
} as const satisfies Record<string, ForestMaterialAtlasSpec>;

export type ForestMaterialAtlasName = keyof typeof FOREST_MATERIAL_ATLAS_SPECS;

export type ForestAtlasUvRect = {
  readonly offset: readonly [number, number];
  readonly repeat: readonly [number, number];
};

export const FOREST_CORRIDOR_CLEARANCES = {
  heroTrees: 2.6,
  wildflowers: 1.55,
} as const;

export const FOREST_GATE_CAMERA_POSITION = [0, 1.62, 8] as const satisfies ForestWorldVector3;
export const FOREST_GATE_CENTER = [0, 1.35, 3.5] as const satisfies ForestWorldVector3;
export const FOREST_GATE_CLEARING_RADIUS = 2.35;
export const FOREST_GATE_PLACEMENT_ENVELOPE = {
  maxX: 1.78,
  maxZ: 4.18,
  minX: -1.78,
  minZ: 2.82,
} as const;
export const FOREST_PETAL_CLEARING_PADDING = 0.42;

const CATEGORY_SEEDS = {
  farTrees: 0x4c1f_76d3,
  grass: 0x75e2_0ad1,
  heroTrees: 0x68b4_2f95,
  midTrees: 0x2e93_a47b,
  petals: 0x19d8_c52f,
  roots: 0x5a70_134d,
  shrubs: 0x3fb1_8e27,
  stones: 0x7c26_91ab,
  wildflowers: 0x0d64_f3e9,
} as const;

const TREE_TINTS = [0x486b4b, 0x557958, 0x60855f, 0x6b9068] as const;
const FAR_TREE_TINTS = [0x6c8669, 0x789276, 0x849d82] as const;
const GRASS_TINTS = [0x678257, 0x718c5e, 0x7d9567] as const;
const FLOWER_TINTS = [0xfffbed, 0xf5f0d8, 0xf8f7ea, 0xe8ead0] as const;
const PETAL_TINTS = [0xfffdf5, 0xfaf4e7, 0xf3eadc] as const;
const STONE_TINTS = [0x8b917d, 0x9a9d87, 0x777f70] as const;
const TWO_PI = Math.PI * 2;
const FOREST_TERMINAL_BUFFER_SCENES = 2;

function mulberry32(seed: number): () => number {
  let value = seed;
  return () => {
    value += 0x6d2b79f5;
    let result = value;
    result = Math.imul(result ^ (result >>> 15), result | 1);
    result ^= result + Math.imul(result ^ (result >>> 7), result | 61);
    return ((result ^ (result >>> 14)) >>> 0) / 4_294_967_296;
  };
}

function seededCategoryRandom(
  category: keyof typeof CATEGORY_SEEDS,
  sceneCount: number,
): () => number {
  return mulberry32(CATEGORY_SEEDS[category] ^ Math.imul(sceneCount, 0x45d9f3b));
}

function pick<T>(values: readonly T[], random: () => number): T {
  return values[Math.min(values.length - 1, Math.floor(random() * values.length))]!;
}

function normalizeCount(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.floor(value));
}

function normalizedTangent(
  from: ForestWorldVector3,
  to: ForestWorldVector3,
): ForestWorldVector3 {
  const x = to[0] - from[0];
  const y = to[1] - from[1];
  const z = to[2] - from[2];
  const length = Math.hypot(x, y, z) || 1;
  return [x / length, y / length, z / length];
}

export function getInitialForestWorldQualityTier(
  viewport: ForestWorldViewport,
): ForestWorldQualityTier {
  return viewport;
}

export function getForestWorldDensity(
  _viewport: ForestWorldViewport,
  qualityTier: ForestWorldQualityTier,
): ForestWorldDensity {
  return { ...DENSITIES[qualityTier] };
}

export function createForestPathSamples(sceneCount: number): readonly ForestPathSample[] {
  if (!Number.isInteger(sceneCount) || sceneCount < 2) {
    throw new RangeError("Forest path requires at least two scenes");
  }

  const positions = Array.from({ length: sceneCount }, (_, index) => [
    Math.sin(index * 0.72) * 0.62 + Math.sin(index * 1.63) * 0.16,
    Math.sin(index * 0.56) * 0.07,
    8 - index * 8.5,
  ] as const satisfies ForestWorldVector3);

  return positions.map((position, index) => {
    const previous = positions[Math.max(0, index - 1)]!;
    const next = positions[Math.min(positions.length - 1, index + 1)]!;
    return {
      position,
      tangent: normalizedTangent(previous, next),
    };
  });
}

export function createForestPathCenterline(
  sceneCount: number,
): readonly ForestPathSample[] {
  const anchors = createForestPathSamples(sceneCount);
  const curve = new CatmullRomCurve3(
    anchors.map(({ position }) => new Vector3(...position)),
    false,
    "catmullrom",
    0.35,
  );
  const segmentCount = Math.max(24, (sceneCount - 1) * 8);
  return Array.from({ length: segmentCount + 1 }, (_, index) => {
    const progress = index / segmentCount;
    const point = curve.getPoint(progress);
    const tangent = curve.getTangent(progress).normalize();
    return {
      position: [point.x, point.y, point.z],
      tangent: [tangent.x, tangent.y, tangent.z],
    };
  });
}

export function getForestAtlasUvRect(
  atlasName: ForestMaterialAtlasName,
  cell: number,
): ForestAtlasUvRect {
  const spec = FOREST_MATERIAL_ATLAS_SPECS[atlasName];
  const columns = spec.cellBoundsX.length - 1;
  const rows = spec.cellBoundsY.length - 1;
  if (!Number.isInteger(cell) || cell < 0 || cell >= columns * rows) {
    throw new RangeError(`Atlas cell ${cell} is outside ${atlasName}`);
  }

  const column = cell % columns;
  const row = Math.floor(cell / columns);
  const left = spec.cellBoundsX[column]! + spec.gutter;
  const right = spec.cellBoundsX[column + 1]! - spec.gutter;
  const top = spec.cellBoundsY[row]! + spec.gutter;
  const bottom = spec.cellBoundsY[row + 1]! - spec.gutter;

  return {
    offset: [left / spec.width, 1 - bottom / spec.height],
    repeat: [(right - left) / spec.width, (bottom - top) / spec.height],
  };
}

export function getForestEnvironmentLayerContract(
  materialMode: ForestEnvironmentMaterialMode,
): ForestEnvironmentLayerContract {
  if (materialMode === "hybrid") {
    return {
      farForest: {
        atlasName: "backdrop",
        geometry: "panorama-impostor",
      },
      heroCanopies: {
        atlasName: "conifer",
        geometry: "branch-card-lod0",
      },
      midCanopies: {
        atlasName: "conifer",
        geometry: "branch-card-lod1",
      },
      petals: {
        atlasName: "petal",
        geometry: "atlas-card",
      },
      wildflowerHeads: {
        atlasName: "wildflower",
        geometry: "atlas-card",
      },
    };
  }

  return {
    farForest: {
      atlasName: null,
      geometry: "far-trunk",
    },
    heroCanopies: {
      atlasName: null,
      geometry: "canopy",
    },
    midCanopies: materialMode === "textured"
      ? {
          atlasName: "foliage",
          geometry: "atlas-card",
        }
      : {
          atlasName: null,
          geometry: "canopy",
        },
    petals: materialMode === "textured"
      ? {
          atlasName: "petal",
          geometry: "atlas-card",
        }
      : {
          atlasName: null,
          geometry: "petal",
        },
    wildflowerHeads: materialMode === "textured"
      ? {
          atlasName: "wildflower",
          geometry: "atlas-card",
        }
      : {
          atlasName: null,
          geometry: "flower-bud",
        },
  };
}

export function getForestBakedAoFactor(
  progress: number,
  lateralRatio: number,
): number {
  const boundedProgress = Math.max(0, Math.min(1, progress));
  const boundedLateral = Math.max(-1, Math.min(1, lateralRatio));
  const groveVariation = 0.035 * (
    0.5 + 0.5 * Math.sin(boundedProgress * Math.PI * 6 + 0.7)
  );
  const edgeOcclusion = Math.pow(Math.abs(boundedLateral), 1.4) * 0.14;
  return Math.max(0.72, Math.min(1, 0.965 - groveVariation - edgeOcclusion));
}

function interpolatePath(
  samples: readonly ForestPathSample[],
  progress: number,
): ForestWorldVector3 {
  const bounded = Math.max(0, Math.min(1, progress));
  const scaled = bounded * (samples.length - 1);
  const lowerIndex = Math.floor(scaled);
  const upperIndex = Math.min(samples.length - 1, lowerIndex + 1);
  const local = scaled - lowerIndex;
  const lower = samples[lowerIndex]!.position;
  const upper = samples[upperIndex]!.position;
  return [
    lower[0] + (upper[0] - lower[0]) * local,
    lower[1] + (upper[1] - lower[1]) * local,
    lower[2] + (upper[2] - lower[2]) * local,
  ];
}

function createClearings(
  samples: readonly ForestPathSample[],
): readonly ForestClearingSlot[] {
  return samples.map((sample, sceneIndex) => {
    const side = (sceneIndex % 2 === 0 ? 1 : -1) as -1 | 1;
    if (sceneIndex === 0) {
      return {
        position: [
          FOREST_GATE_CENTER[0],
          0.025,
          FOREST_GATE_CENTER[2],
        ],
        radius: FOREST_GATE_CLEARING_RADIUS,
        sceneIndex,
        side,
      };
    }

    return {
      position: [
        sample.position[0] + side * 1.7,
        sample.position[1] + 0.025,
        sample.position[2] - 5.15,
      ],
      radius: sceneIndex === samples.length - 1 ? 1.8 : 1.45,
      sceneIndex,
      side,
    };
  });
}

function isOutsideClearings(
  position: ForestWorldVector3,
  clearings: readonly ForestClearingSlot[],
  padding = 0,
): boolean {
  return clearings.every((clearing) => Math.hypot(
    position[0] - clearing.position[0],
    position[2] - clearing.position[2],
  ) >= clearing.radius + padding);
}

function createGroundPlacement(
  random: () => number,
  samples: readonly ForestPathSample[],
  pathOffset: number,
  scaleRange: readonly [number, number],
  tintPalette: readonly number[],
  options?: {
    readonly pitch?: number;
    readonly roll?: number;
  },
): ForestWorldPlacement {
  const progress = random();
  const path = interpolatePath(samples, progress);
  const scale = scaleRange[0] + random() * (scaleRange[1] - scaleRange[0]);
  return {
    pathOffset,
    position: [path[0] + pathOffset, path[1], path[2]],
    rotation: [
      (random() - 0.5) * (options?.pitch ?? 0),
      random() * TWO_PI,
      (random() - 0.5) * (options?.roll ?? 0),
    ],
    scale,
    tint: pick(tintPalette, random),
    windPhase: random() * TWO_PI,
  };
}

function createAvoidingPlacements<T extends ForestWorldPlacement>(
  count: number,
  clearings: readonly ForestClearingSlot[],
  factory: () => T,
  padding = 0,
  acceptsPlacement: (placement: T) => boolean = () => true,
): readonly T[] {
  const placements: T[] = [];
  const maximumAttempts = Math.max(200, count * 80);

  for (let attempt = 0; placements.length < count && attempt < maximumAttempts; attempt += 1) {
    const placement = factory();
    if (
      isOutsideClearings(placement.position, clearings, padding)
      && acceptsPlacement(placement)
    ) placements.push(placement);
  }

  if (placements.length !== count) {
    throw new Error(`Unable to place ${count} forest objects outside reserved clearings`);
  }

  return placements;
}

function signedOffset(
  random: () => number,
  minimum: number,
  maximum: number,
): number {
  const side = random() < 0.5 ? -1 : 1;
  return side * (minimum + random() * (maximum - minimum));
}

export function createForestWorldPlacements(
  sceneCount: number,
  density: ForestWorldDensity,
): ForestWorldPlacements {
  const sceneSamples = createForestPathSamples(sceneCount);
  const samples = createForestPathSamples(
    sceneCount + FOREST_TERMINAL_BUFFER_SCENES,
  );
  const pathCenterline = createForestPathCenterline(
    sceneCount + FOREST_TERMINAL_BUFFER_SCENES,
  );
  const clearings = createClearings(sceneSamples);
  const heroRandom = seededCategoryRandom("heroTrees", sceneCount);
  const midRandom = seededCategoryRandom("midTrees", sceneCount);
  const farRandom = seededCategoryRandom("farTrees", sceneCount);
  const grassRandom = seededCategoryRandom("grass", sceneCount);
  const wildflowerRandom = seededCategoryRandom("wildflowers", sceneCount);
  const petalRandom = seededCategoryRandom("petals", sceneCount);
  const shrubRandom = seededCategoryRandom("shrubs", sceneCount);
  const rootRandom = seededCategoryRandom("roots", sceneCount);
  const stoneRandom = seededCategoryRandom("stones", sceneCount);
  const heroCount = Math.max(60, sceneCount * 6);

  const heroTrees = createAvoidingPlacements(
    heroCount,
    clearings,
    () => ({
      ...createGroundPlacement(
        heroRandom,
        samples,
        signedOffset(heroRandom, 2.6, 7.6),
        [0.82, 1.32],
        TREE_TINTS,
        { pitch: 0.08, roll: 0.1 },
      ),
      atlasCell: Math.floor(heroRandom() * 8),
    }),
    0.35,
    ({ position }) => horizontalDistanceToPath(position, pathCenterline)
      >= FOREST_CORRIDOR_CLEARANCES.heroTrees,
  );

  const midTrees = createAvoidingPlacements(
    normalizeCount(density.midTrees),
    clearings,
    () => ({
      ...createGroundPlacement(
        midRandom,
        samples,
        signedOffset(midRandom, 6.2, 12.5),
        [0.64, 1.12],
        TREE_TINTS,
        { pitch: 0.04, roll: 0.05 },
      ),
      atlasCell: Math.floor(midRandom() * 8),
    }),
  );

  const farTrees = Array.from(
    { length: normalizeCount(density.farTrees) },
    (_, index): ForestFarTreePlacement => {
      const depthBand = (index % 3) as 0 | 1 | 2;
      const minimum = [13.5, 18.5, 24] as const;
      const maximum = [18, 24, 31] as const;
      return {
        ...createGroundPlacement(
          farRandom,
          samples,
          signedOffset(farRandom, minimum[depthBand], maximum[depthBand]),
          [0.72, 1.28],
          FAR_TREE_TINTS,
          { pitch: 0.02, roll: 0.025 },
        ),
        atlasCell: Math.floor(farRandom() * 8),
        depthBand,
      };
    },
  );

  const grass = createAvoidingPlacements(
    normalizeCount(density.grass),
    clearings,
    () => createGroundPlacement(
      grassRandom,
      samples,
      signedOffset(grassRandom, 1.12, 7.8),
      [0.55, 1.18],
      GRASS_TINTS,
      { pitch: 0.08, roll: 0.12 },
    ),
    -0.4,
  );

  const wildflowers = createAvoidingPlacements(
    normalizeCount(density.wildflowers),
    clearings,
    () => ({
      ...createGroundPlacement(
        wildflowerRandom,
        samples,
        signedOffset(wildflowerRandom, 1.55, 7.25),
        [0.62, 1.22],
        FLOWER_TINTS,
        { pitch: 0.09, roll: 0.13 },
      ),
      atlasCell: Math.floor(wildflowerRandom() * 12),
    }),
    -0.25,
    ({ position }) => horizontalDistanceToPath(position, pathCenterline)
      >= FOREST_CORRIDOR_CLEARANCES.wildflowers,
  );

  const petals = createAvoidingPlacements(
    normalizeCount(density.petals),
    clearings,
    (): ForestPetalPlacement => {
      const pathOffset = signedOffset(petalRandom, 0.6, 5.8);
      const base = createGroundPlacement(
        petalRandom,
        samples,
        pathOffset,
        [0.55, 1.32],
        PETAL_TINTS,
        { pitch: TWO_PI, roll: TWO_PI },
      );
      const phase = petalRandom() * TWO_PI;
      return {
        ...base,
        atlasCell: Math.floor(petalRandom() * 16),
        fallSpeed: 0.16 + petalRandom() * 0.24,
        phase,
        position: [base.position[0], 0.75 + petalRandom() * 3.8, base.position[2]],
      };
    },
    FOREST_PETAL_CLEARING_PADDING,
  );

  const shrubs = createAvoidingPlacements(
    Math.max(30, sceneCount * 4),
    clearings,
    () => createGroundPlacement(
      shrubRandom,
      samples,
      signedOffset(shrubRandom, 2.4, 8.8),
      [0.55, 1.35],
      TREE_TINTS,
      { pitch: 0.05, roll: 0.08 },
    ),
  );

  const roots = createAvoidingPlacements(
    Math.max(18, sceneCount * 2),
    clearings,
    () => createGroundPlacement(
      rootRandom,
      samples,
      signedOffset(rootRandom, 1.6, 6.2),
      [0.55, 1.35],
      [0x705844, 0x80644b, 0x5f4c3b],
      { pitch: 0.25, roll: 0.18 },
    ),
  );

  const stones = createAvoidingPlacements(
    Math.max(24, sceneCount * 3),
    clearings,
    () => createGroundPlacement(
      stoneRandom,
      samples,
      signedOffset(stoneRandom, 1.7, 7.4),
      [0.45, 1.15],
      STONE_TINTS,
      { pitch: 0.25, roll: 0.25 },
    ),
  );

  return {
    clearings,
    farTrees,
    grass,
    heroTrees,
    midTrees,
    pathCenterline,
    petals,
    roots,
    shrubs,
    stones,
    wildflowers,
  };
}

function contactCue(
  placement: ForestWorldPlacement,
  source: ForestContactSource,
  scaleX: number,
  scaleZ: number,
): ForestContactCue {
  return {
    position: [
      placement.position[0],
      placement.position[1] + 0.018,
      placement.position[2],
    ],
    rotationY: placement.rotation[1],
    scale: [scaleX * placement.scale, scaleZ * placement.scale],
    source,
  };
}

export function createForestContactCues(
  placements: ForestWorldPlacements,
): readonly ForestContactCue[] {
  return [
    ...placements.heroTrees.map((placement) => (
      contactCue(placement, "hero-tree", 1.15, 1.15)
    )),
    ...placements.midTrees.map((placement) => (
      contactCue(placement, "mid-tree", 0.78, 0.78)
    )),
    ...placements.shrubs.map((placement) => (
      contactCue(placement, "shrub", 0.78, 0.58)
    )),
    ...placements.roots.map((placement) => (
      contactCue(placement, "root", 0.74, 0.2)
    )),
    ...placements.stones.map((placement) => (
      contactCue(placement, "stone", 0.48, 0.34)
    )),
  ];
}

function horizontalDistanceToPath(
  position: ForestWorldVector3,
  path: readonly ForestPathSample[],
): number {
  let minimum = Number.POSITIVE_INFINITY;
  for (let index = 0; index < path.length - 1; index += 1) {
    const start = path[index]!.position;
    const end = path[index + 1]!.position;
    const segmentX = end[0] - start[0];
    const segmentZ = end[2] - start[2];
    const squaredLength = segmentX * segmentX + segmentZ * segmentZ;
    const progress = squaredLength === 0 ? 0 : Math.max(0, Math.min(1, (
      (position[0] - start[0]) * segmentX + (position[2] - start[2]) * segmentZ
    ) / squaredLength));
    minimum = Math.min(minimum, Math.hypot(
      position[0] - (start[0] + segmentX * progress),
      position[2] - (start[2] + segmentZ * progress),
    ));
  }
  return Number.isFinite(minimum) ? minimum : 0;
}

function minimumHorizontalPathDistance(
  placements: readonly ForestWorldPlacement[],
  path: readonly ForestPathSample[],
): number {
  if (placements.length === 0) return 0;
  return placements.reduce((minimum, placement) => Math.min(
    minimum,
    horizontalDistanceToPath(placement.position, path),
  ), Number.POSITIVE_INFINITY);
}

export function getForestWorldDiagnostics(
  placements: ForestWorldPlacements,
): ForestWorldDiagnostics {
  const minimumHeroPathDistance = minimumHorizontalPathDistance(
    placements.heroTrees,
    placements.pathCenterline,
  );
  const minimumWildflowerPathDistance = minimumHorizontalPathDistance(
    placements.wildflowers,
    placements.pathCenterline,
  );
  return {
    corridorClear: minimumHeroPathDistance >= FOREST_CORRIDOR_CLEARANCES.heroTrees
      && minimumWildflowerPathDistance >= FOREST_CORRIDOR_CLEARANCES.wildflowers,
    minimumHeroPathDistance,
    minimumWildflowerPathDistance,
  };
}

export type ForestAdaptiveQualitySampler = {
  readonly reset: () => void;
  readonly sample: (timestampMs: number) => boolean;
};

/**
 * A frame slower than this is treated as the tab having been descheduled — a
 * background throttle, a GC pause, a blocking asset decode — rather than as the
 * renderer's steady cost, and so cannot on its own accumulate towards a
 * reduction.
 */
const ADAPTIVE_OUTLIER_FRAME_MS = 250;

/**
 * How many consecutive outlier frames still count as a genuinely slow device.
 *
 * A single stall says nothing about steady cost, but a device that cannot clear
 * one frame in a quarter second, repeatedly, is exactly the hardware the
 * reduction exists for. Treating every outlier as a deschedule made the
 * accumulator reset on every frame there, so the slowest devices — a low-end
 * phone, or a desktop on a software rasteriser — were the only ones that could
 * never reduce. Three in a row is ~0.75s of continuous stall, long enough that a
 * deschedule would have flipped `visibilityState` and reset the sampler instead.
 */
const ADAPTIVE_OUTLIER_STREAK_LIMIT = 3;

/**
 * Ceiling on how much one frame contributes to the sustained-slow total.
 *
 * The total is real time spent slow, so a frame contributes its own duration;
 * the cap only bounds a pathological reading. It has to sit above
 * `ADAPTIVE_OUTLIER_FRAME_MS`, or a confirmed-slow device would contribute a
 * token amount per frame and take tens of seconds to cross a two-second
 * threshold — at the old 50ms cap, 600ms frames needed 24 seconds.
 */
const ADAPTIVE_SLOW_FRAME_CREDIT_CEILING_MS = 500;

export function createForestAdaptiveQualitySampler(
  onReduce: () => void,
): ForestAdaptiveQualitySampler {
  let accumulatedSlowMs = 0;
  let outlierStreak = 0;
  let previousTimestampMs: number | null = null;
  let reduced = false;

  return {
    reset() {
      accumulatedSlowMs = 0;
      outlierStreak = 0;
      previousTimestampMs = null;
    },
    sample(timestampMs) {
      if (!Number.isFinite(timestampMs)) return false;
      if (previousTimestampMs === null) {
        previousTimestampMs = timestampMs;
        return false;
      }

      const deltaMs = timestampMs - previousTimestampMs;
      previousTimestampMs = timestampMs;
      if (deltaMs <= 0) {
        accumulatedSlowMs = 0;
        outlierStreak = 0;
        return false;
      }

      if (deltaMs > ADAPTIVE_OUTLIER_FRAME_MS) {
        outlierStreak += 1;
        if (outlierStreak < ADAPTIVE_OUTLIER_STREAK_LIMIT) {
          accumulatedSlowMs = 0;
          return false;
        }
      } else {
        outlierStreak = 0;
        if (deltaMs <= 24) {
          accumulatedSlowMs = 0;
          return false;
        }
      }

      accumulatedSlowMs += Math.min(
        deltaMs,
        ADAPTIVE_SLOW_FRAME_CREDIT_CEILING_MS,
      );
      if (reduced || accumulatedSlowMs < 2_000) return false;

      reduced = true;
      onReduce();
      return true;
    },
  };
}

/**
 * Shared surface and silhouette policy for the authored wedding props — the
 * gate, the gallery easel, and every static scene assembly. The photoreal skin
 * lights the scene with filmic tone mapping and no shadow maps, so props must
 * earn their form from geometry and roughness rather than from emissive paint.
 */

export type ForestPropSurface =
  | "blossom"
  | "cloth"
  | "foliage"
  | "paper"
  | "wood";

export type ForestPropSurfacePolicy = {
  /** Always zero: emissive props read as glowing plastic under filmic tone mapping. */
  readonly emissiveIntensity: number;
  readonly metalness: number;
  readonly roughness: number;
};

export const FOREST_PROP_SURFACE_POLICIES: Readonly<
  Record<ForestPropSurface, ForestPropSurfacePolicy>
> = Object.freeze({
  blossom: Object.freeze({
    emissiveIntensity: 0,
    metalness: 0,
    roughness: 0.72,
  }),
  cloth: Object.freeze({
    emissiveIntensity: 0,
    metalness: 0,
    roughness: 0.96,
  }),
  foliage: Object.freeze({
    emissiveIntensity: 0,
    metalness: 0,
    roughness: 0.86,
  }),
  paper: Object.freeze({
    emissiveIntensity: 0,
    metalness: 0,
    roughness: 0.92,
  }),
  wood: Object.freeze({
    emissiveIntensity: 0,
    metalness: 0,
    roughness: 0.78,
  }),
});

/**
 * Fraction of a box's smallest face used as its bevel. Small on purpose: the
 * bevel exists to catch a highlight along an edge, not to round the prop off.
 */
export const FOREST_PROP_BEVEL_RATIO = 0.055;

/**
 * Radius of the bevel lip for a box prop. Clamped to a quarter of the smallest
 * dimension so a thin panel can never bevel itself away.
 */
export function getForestPropBevelRadius(
  width: number,
  height: number,
  depth: number,
): number {
  const smallest = Math.min(
    Math.abs(width),
    Math.abs(height),
    Math.abs(depth),
  );
  if (!Number.isFinite(smallest) || smallest <= 0) return 0;
  return Math.min(smallest * FOREST_PROP_BEVEL_RATIO, smallest * 0.25);
}

/** Narrowest a wooden member may taper to, as a fraction of its base radius. */
export const FOREST_PROP_MIN_TAPER = 0.6;

/**
 * Top-radius scale for a wooden member of a given length. Longer members taper
 * harder, which is what stops a gate post from reading as extruded pipe.
 */
export function getForestWoodTaper(lengthMetres: number): number {
  const length = Number.isFinite(lengthMetres) ? Math.abs(lengthMetres) : 0;
  return Math.max(FOREST_PROP_MIN_TAPER, Math.min(0.94, 1 - length * 0.075));
}

export type ForestClothDrape = {
  /** Metres the cloth hangs past the table edge. */
  readonly dropMetres: number;
  /** Metres the hem stands out from the drape, giving fabric visible depth. */
  readonly hemMetres: number;
  readonly thicknessMetres: number;
};

/** Shortest drop that still reads as hanging fabric rather than as paint. */
export const FOREST_CLOTH_MIN_DROP = 0.12;

/**
 * Drape geometry for a cloth laid over a table of the given height. The drop is
 * proportional so a low bench and a tall table both look covered, and the hem
 * gives the silhouette a soft lower edge under flat lighting.
 */
export function getForestClothDrape(tableHeightMetres: number): ForestClothDrape {
  const height = Number.isFinite(tableHeightMetres)
    ? Math.max(0, tableHeightMetres)
    : 0;
  const dropMetres = Math.max(FOREST_CLOTH_MIN_DROP, height * 0.62);
  return {
    dropMetres,
    hemMetres: Math.max(0.012, dropMetres * 0.09),
    thicknessMetres: Math.max(0.014, dropMetres * 0.055),
  };
}

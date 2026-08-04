export type ForestTextureKind = "arm" | "color" | "normal";

export type ForestTextureColorSpacePolicy = "no-color-space" | "srgb";

export type ForestPbrSurface = "conifer" | "ground";

export type ForestPbrSurfacePolicy = {
  readonly emissiveIntensity: number;
  readonly metalness: number;
  readonly requiredMaps: readonly ForestTextureKind[];
  readonly roughness: number;
};

export const FOREST_PBR_SURFACE_POLICIES: Readonly<
  Record<ForestPbrSurface, ForestPbrSurfacePolicy>
> = Object.freeze({
  conifer: Object.freeze({
    emissiveIntensity: 0,
    metalness: 0,
    requiredMaps: Object.freeze<ForestTextureKind[]>(["color", "normal", "arm"]),
    roughness: 0.86,
  }),
  ground: Object.freeze({
    emissiveIntensity: 0,
    metalness: 0,
    requiredMaps: Object.freeze<ForestTextureKind[]>(["color", "normal", "arm"]),
    roughness: 0.94,
  }),
});

export const FOREST_ALPHA_FOLIAGE_MATERIAL_POLICY = Object.freeze({
  alphaTest: 0.42,
  depthWrite: true,
  transparent: false,
});

/**
 * Backlit leaf transmission for the alpha-tested foliage cards.
 *
 * Real needles are thin enough to transmit light, so a canopy card facing away
 * from the sun still glows green from behind rather than going dark. A
 * `MeshStandardMaterial` models no transmission at all: its back faces receive
 * only the hemisphere's ground colour, and ACES tone mapping then crushes that to
 * pure black — a void punched through the treeline, worst on mobile where the
 * camera sits lower and sees more canopy underside.
 *
 * Bound to the albedo rather than a flat colour so the emission carries the
 * atlas's own needle variation; a flat `emissive` would wash the cards into a
 * uniform silhouette, which is what `FOREST_PBR_SURFACE_POLICIES` still
 * forbids. Intensity is the smallest that clears the tone curve's toe — 0.18
 * measured against the mobile families frame — so the canopy keeps its shading
 * range instead of reading as self-lit plastic.
 */
export const FOREST_FOLIAGE_TRANSLUCENCY_POLICY = Object.freeze({
  emissiveColor: 0xffffff,
  emissiveIntensity: 0.18,
});

export function getForestTextureColorSpacePolicy(
  kind: ForestTextureKind,
): ForestTextureColorSpacePolicy {
  return kind === "color" ? "srgb" : "no-color-space";
}

export type ForestLodTier = "desktop" | "mobile" | "reduced";

export type ForestLod = "hero" | "impostor" | "mid";

export type ForestLodSelection = {
  readonly distance: number;
  readonly previous: ForestLod | null;
  readonly tier: ForestLodTier;
};

type ForestLodBands = {
  readonly heroToMid: number;
  readonly midToImpostor: number;
};

const LOD_BANDS: Readonly<Record<ForestLodTier, ForestLodBands>> = Object.freeze({
  desktop: Object.freeze({ heroToMid: 12, midToImpostor: 32 }),
  mobile: Object.freeze({ heroToMid: 8, midToImpostor: 18 }),
  reduced: Object.freeze({ heroToMid: 8, midToImpostor: 18 }),
});

const HYSTERESIS_METERS = 1.5;

export function selectForestLod({
  distance,
  previous,
  tier,
}: ForestLodSelection): ForestLod {
  const bands = LOD_BANDS[tier];
  const heroBoundary = previous === "hero"
    ? bands.heroToMid + HYSTERESIS_METERS
    : bands.heroToMid;
  const midBoundary = previous === "impostor"
    ? bands.midToImpostor - HYSTERESIS_METERS
    : bands.midToImpostor;

  if (distance < heroBoundary) return "hero";
  if (distance < midBoundary) return "mid";
  return "impostor";
}

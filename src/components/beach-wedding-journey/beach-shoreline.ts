/**
 * Shore geometry, and the seam the deferred wave work attaches to.
 *
 * Wave foam needs a water-depth function and a time phase. Depth lives here and
 * is time-invariant today; adding waves means adding a time term to
 * `waterDepthAt` and a foam term to the water material. Terrain, rail, framing
 * and scene modules read this module and do not need to change.
 */

/** Peak excursion of the waterline from its mean line, in metres. */
export const BEACH_SHORE_CURVE_AMPLITUDE_METRES = 2.4;

/** World-space y of the still water surface. Sand meets it at the waterline. */
export const BEACH_WATER_LEVEL_Y = 0;

/** How far out to sea the floor takes to reach full depth, in metres. */
const DEPTH_RAMP_METRES = 26;

/** Full depth of the open water plane, in metres. */
const MAX_DEPTH_METRES = 3.2;

/**
 * Two incommensurable sine periods, so the curve never visibly repeats along the
 * walk while remaining a pure function of x — no seeded RNG, no state.
 */
const PRIMARY_PERIOD_METRES = 37;
const SECONDARY_PERIOD_METRES = 13.5;

export function shorelineOffsetAt(x: number): number {
  const primary = Math.sin((x / PRIMARY_PERIOD_METRES) * Math.PI * 2);
  const secondary = Math.sin((x / SECONDARY_PERIOD_METRES) * Math.PI * 2 + 1.1);

  return BEACH_SHORE_CURVE_AMPLITUDE_METRES * (primary * 0.68 + secondary * 0.32);
}

export function waterDepthAt(x: number, z: number): number {
  const seawardMetres = shorelineOffsetAt(x) - z;
  if (seawardMetres <= 0) return 0;

  const ramp = Math.min(seawardMetres / DEPTH_RAMP_METRES, 1);
  // Smoothstep, so the floor leaves the waterline flat instead of as a step.
  return MAX_DEPTH_METRES * ramp * ramp * (3 - 2 * ramp);
}

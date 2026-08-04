import type { ForestJourneyCueState } from "../forest-cue-state";

export type ForestPetalCue = Readonly<
  Pick<ForestJourneyCueState, "petalGust" | "windStrength">
>;

export type ForestPetalTransform = {
  /** Signed metres along the camera-facing depth axis. */
  readonly depthOffset: number;
  /** Metres above the respawn floor, always within `FOREST_PETAL_FALL_SPAN`. */
  readonly fallHeight: number;
  /** Signed metres across the path, always within `FOREST_PETAL_MAX_LATERAL`. */
  readonly lateralOffset: number;
  readonly opacity: number;
  readonly rotation: readonly [number, number, number];
  readonly scale: number;
};

/** Vertical distance a petal travels before it respawns at the top. */
export const FOREST_PETAL_FALL_SPAN = 4.15;

/**
 * Hard lateral bound. The solver clamps to it so a long gust can never blow a
 * petal outside the corridor the camera frames.
 */
export const FOREST_PETAL_MAX_LATERAL = 1.15;

/** Fraction of the span at each end that fades, hiding the respawn wrap. */
const FADE_BAND = 0.14;

const FROZEN: ForestPetalTransform = {
  depthOffset: 0,
  fallHeight: FOREST_PETAL_FALL_SPAN * 0.5,
  lateralOffset: 0,
  opacity: 1,
  rotation: [0, 0, 0],
  scale: 1,
};

/**
 * Deterministic hash so a seed always yields the same aerodynamic personality
 * without storing per-petal state. Returns a value in `[0, 1)`.
 */
function hashSeed(seed: number, salt: number): number {
  let value = Math.imul(seed + 0x9e3779b9, 0x85ebca6b) ^ Math.imul(salt + 1, 0xc2b2ae35);
  value ^= value >>> 15;
  value = Math.imul(value, 0x27d4eb2f);
  value ^= value >>> 13;
  return (value >>> 0) / 0x100000000;
}

function wrap(value: number, length: number): number {
  return ((value % length) + length) % length;
}

/**
 * Samples one petal's transform at `timeSeconds`. Pure and stateless: the
 * renderer calls it per instance per frame and writes the result straight into
 * an instanced matrix, so nothing has to survive between frames.
 *
 * Under reduced motion every petal freezes mid-fall at full opacity, which
 * keeps the composition intact while removing all animation.
 */
export function sampleForestPetalMotion(
  seed: number,
  timeSeconds: number,
  cue: ForestPetalCue,
  reducedMotion: boolean,
): ForestPetalTransform {
  if (reducedMotion) return FROZEN;

  const gust = Math.max(0, cue.petalGust);
  const wind = Math.max(0, cue.windStrength);

  const fallSpeed = 0.42 + hashSeed(seed, 1) * 0.46;
  const swayPhase = hashSeed(seed, 2) * Math.PI * 2;
  const swayRate = 0.44 + hashSeed(seed, 3) * 0.38;
  const flutterPhase = hashSeed(seed, 4) * Math.PI * 2;
  const startOffset = hashSeed(seed, 5) * FOREST_PETAL_FALL_SPAN;
  const spinBias = hashSeed(seed, 6) * 2 - 1;

  const travelled = startOffset - timeSeconds * fallSpeed * (1 + gust * 0.28);
  const fallHeight = wrap(travelled, FOREST_PETAL_FALL_SPAN);

  // A falling petal alternates between gliding and tumbling; two sines at
  // unrelated rates read as aerodynamic rather than as a pendulum.
  const swayAmplitude = 0.16 + wind * 0.24 + gust * 0.42;
  const sway = Math.sin(timeSeconds * swayRate + swayPhase)
    + 0.38 * Math.sin(timeSeconds * swayRate * 2.63 + flutterPhase);
  const lateralOffset = Math.max(
    -FOREST_PETAL_MAX_LATERAL,
    Math.min(FOREST_PETAL_MAX_LATERAL, sway * swayAmplitude),
  );

  const depthOffset = Math.cos(timeSeconds * swayRate * 0.71 + flutterPhase)
    * swayAmplitude
    * 0.4;

  const fadeBand = FOREST_PETAL_FALL_SPAN * FADE_BAND;
  const distanceToEdge = Math.min(
    fallHeight,
    FOREST_PETAL_FALL_SPAN - fallHeight,
  );
  const opacity = Math.max(0, Math.min(1, distanceToEdge / fadeBand));

  const tumble = timeSeconds * fallSpeed;
  const rotation: readonly [number, number, number] = [
    tumble * 1.24 + swayPhase,
    tumble * 0.78 * spinBias + flutterPhase,
    Math.sin(timeSeconds * swayRate * 1.37 + swayPhase) * 0.52,
  ];

  const scale = 1 + gust * 0.06 + Math.sin(timeSeconds * 0.9 + swayPhase) * 0.03;

  return { depthOffset, fallHeight, lateralOffset, opacity, rotation, scale };
}

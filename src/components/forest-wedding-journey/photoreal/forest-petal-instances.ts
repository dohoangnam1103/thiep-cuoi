import type { ForestPetalPlacement } from "../forest-world-data";
import {
  sampleForestPetalMotion,
  type ForestPetalCue,
  type ForestPetalTransform,
} from "./forest-petal-motion";

export type ForestPetalInstance = {
  readonly position: readonly [number, number, number];
  readonly rotation: readonly [number, number, number];
  /** Billboard extent in metres; z is always 1 because petals are flat cards. */
  readonly scale: readonly [number, number];
};

/** Card extent at `scale: 1` before the fade term is folded in. */
const PETAL_CARD_WIDTH = 0.22;
const PETAL_CARD_HEIGHT = 0.34;

/** Height the falling petals respawn above, matching the authored floor. */
const PETAL_FALL_FLOOR_Y = 0.5;

/**
 * Cue used when fingerprinting the petal field. Gust and wind are live values,
 * so the fingerprint deliberately samples the calm state instead — that keeps
 * the hash comparable across reads while still covering every placement.
 */
export const FOREST_PETAL_CALM_CUE: ForestPetalCue = Object.freeze({
  petalGust: 0,
  windStrength: 0,
});

/**
 * Composes one petal's world transform from its authored placement and the
 * sampled motion. Shared by the renderer and the diagnostics fingerprint so a
 * reported hash always describes the transforms actually written to the GPU.
 *
 * Fading is folded into scale because the instanced petals share one material
 * and neither the atlas shader nor the procedural standard material carries a
 * per-instance alpha channel.
 */
export function composeForestPetalInstance(
  placement: ForestPetalPlacement,
  motion: ForestPetalTransform,
  reducedMotion: boolean,
): ForestPetalInstance {
  const fade = motion.scale * motion.opacity;

  return {
    position: [
      placement.position[0] + motion.lateralOffset,
      reducedMotion
        ? placement.position[1]
        : PETAL_FALL_FLOOR_Y + motion.fallHeight,
      placement.position[2] + motion.depthOffset,
    ],
    rotation: [
      placement.rotation[0] + motion.rotation[0],
      placement.rotation[1] + motion.rotation[1],
      placement.rotation[2] + motion.rotation[2],
    ],
    scale: [
      PETAL_CARD_WIDTH * placement.scale * fade,
      PETAL_CARD_HEIGHT * placement.scale * fade,
    ],
  };
}

/** Quantum the fingerprint rounds to, so float noise cannot change the hash. */
const HASH_QUANTUM = 1_000;

function foldHash(hash: number, value: number): number {
  const quantized = Math.round(value * HASH_QUANTUM) | 0;
  return Math.imul(hash ^ quantized, 0x01000193) >>> 0;
}

/**
 * Fingerprints the composed petal transforms. Deterministic for a given
 * placement list, time and cue, which is what lets diagnostics assert the petal
 * field is reproducible without shipping every matrix to the test.
 */
export function hashForestPetalInstances(
  placements: readonly ForestPetalPlacement[],
  timeSeconds: number,
  cue: ForestPetalCue,
  reducedMotion: boolean,
): string {
  let hash = 0x811c9dc5;

  placements.forEach((placement, index) => {
    const instance = composeForestPetalInstance(
      placement,
      sampleForestPetalMotion(index, timeSeconds, cue, reducedMotion),
      reducedMotion,
    );

    for (const value of instance.position) hash = foldHash(hash, value);
    for (const value of instance.rotation) hash = foldHash(hash, value);
    for (const value of instance.scale) hash = foldHash(hash, value);
  });

  return hash.toString(16).padStart(8, "0");
}

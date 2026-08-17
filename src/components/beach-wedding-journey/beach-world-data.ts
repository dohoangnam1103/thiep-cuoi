// Copied from src/components/forest-wedding-journey/forest-world-data.ts. Fixes to journey
// mechanics must be applied to both.

export type BeachWorldViewport = "desktop" | "mobile";
export type BeachWorldQualityTier = BeachWorldViewport | "reduced";

export type BeachWorldDensity = {
  readonly frames: number;
  readonly posts: number;
  readonly tables: number;
};

export type BeachWorldVector3 = readonly [number, number, number];

/**
 * Tables, not tufts: the dune grass this replaced ran to 900 instances because a
 * grass band has to be dense to read as ground cover at all. A reception is
 * counted furniture — 18 tables across the 128m of shore the walk covers is
 * roughly one every 7m, which reads as a set reception without becoming a car
 * park, and each table carries a centrepiece, so the instance cost is doubled.
 */
const DENSITIES = {
  desktop: { frames: 3, posts: 24, tables: 18 },
  mobile: { frames: 3, posts: 18, tables: 12 },
  reduced: { frames: 3, posts: 12, tables: 8 },
} as const satisfies Record<BeachWorldQualityTier, BeachWorldDensity>;

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

export function getInitialBeachWorldQualityTier(
  viewport: BeachWorldViewport,
): BeachWorldQualityTier {
  return viewport;
}

export function getBeachWorldDensity(
  _viewport: BeachWorldViewport,
  qualityTier: BeachWorldQualityTier,
): BeachWorldDensity {
  return { ...DENSITIES[qualityTier] };
}

export type BeachAdaptiveQualitySampler = {
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

export function createBeachAdaptiveQualitySampler(
  onReduce: () => void,
): BeachAdaptiveQualitySampler {
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

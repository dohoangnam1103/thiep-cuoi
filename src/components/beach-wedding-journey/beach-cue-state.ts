// Copied from src/components/forest-wedding-journey/forest-cue-state.ts. Fixes to journey
// mechanics must be applied to both.

import type { BeachJourneySceneType } from "@/data/beach-wedding-journey";

import type { BeachJourneyPhase } from "./beach-journey-controller";

/**
 * The beach has no gate arch, no voile, no doves and no rabbits, so the forest's
 * four actor cues reduce to the two this location actually drives: the wind that
 * moves dune grass and the hanging frames, and the seaward glint on the water.
 * `waterSparkle` inherits the forest's `petalGust` expression in every branch —
 * both are the same pulse-shaped secondary cue.
 */
export type BeachCueValues = {
  waterSparkle: number;
  windStrength: number;
};

export type BeachJourneyCueState = BeachCueValues & {
  sceneTime: number;
  travelProgress: number;
};

export type BeachCueEvaluation = {
  readonly phase: BeachJourneyPhase;
  readonly progress: number;
  readonly reducedMotion: boolean;
  readonly sourceType: BeachJourneySceneType | null;
  readonly targetType: BeachJourneySceneType | null;
};

const REST_CUE: BeachCueValues = {
  waterSparkle: 0,
  windStrength: 0,
};

function clamp01(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(1, value));
}

function pulse(progress: number): number {
  if (progress <= 0 || progress >= 1) return 0;
  return clamp01(Math.sin(progress * Math.PI));
}

export function createInitialBeachJourneyCueState(): BeachJourneyCueState {
  return {
    ...REST_CUE,
    sceneTime: 0,
    travelProgress: 0,
  };
}

export function evaluateBeachCue({
  phase,
  progress,
  reducedMotion,
  sourceType,
  targetType,
}: BeachCueEvaluation): BeachCueValues {
  if (reducedMotion || phase !== "travelling") return { ...REST_CUE };

  const travelProgress = clamp01(progress);
  const travelPulse = pulse(travelProgress);
  const isGateEntry = sourceType === "cover-gate" && targetType === "families";
  if (isGateEntry) {
    return {
      waterSparkle: clamp01(travelPulse * 0.72),
      windStrength: clamp01(travelPulse * 0.82),
    };
  }

  if (targetType === "finale") {
    return {
      waterSparkle: clamp01(travelPulse * 0.5),
      windStrength: clamp01(travelPulse * 0.42),
    };
  }

  return {
    waterSparkle: clamp01(travelPulse * 0.16),
    windStrength: clamp01(travelPulse * 0.24),
  };
}

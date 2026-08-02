import type { ForestJourneySceneType } from "@/data/forest-wedding-journey";

import type { ForestJourneyPhase } from "./forest-journey-controller";

export type ForestCueValues = {
  doveFlight: number;
  petalGust: number;
  rabbitGuide: number;
  voileLift: number;
  windStrength: number;
};

export type ForestJourneyCueState = ForestCueValues & {
  sceneTime: number;
  travelProgress: number;
};

export type ForestCueEvaluation = {
  readonly phase: ForestJourneyPhase;
  readonly progress: number;
  readonly reducedMotion: boolean;
  readonly sourceType: ForestJourneySceneType | null;
  readonly targetType: ForestJourneySceneType | null;
};

const REST_CUE: ForestCueValues = {
  doveFlight: 0,
  petalGust: 0,
  rabbitGuide: 0,
  voileLift: 0,
  windStrength: 0,
};

function clamp01(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(1, value));
}

function smoothstep(start: number, end: number, value: number): number {
  const progress = clamp01((value - start) / (end - start));
  return progress * progress * (3 - 2 * progress);
}

function pulse(progress: number): number {
  if (progress <= 0 || progress >= 1) return 0;
  return clamp01(Math.sin(progress * Math.PI));
}

export function createInitialForestJourneyCueState(): ForestJourneyCueState {
  return {
    ...REST_CUE,
    sceneTime: 0,
    travelProgress: 0,
  };
}

export function evaluateForestCue({
  phase,
  progress,
  reducedMotion,
  sourceType,
  targetType,
}: ForestCueEvaluation): ForestCueValues {
  if (reducedMotion || phase !== "travelling") return { ...REST_CUE };

  const travelProgress = clamp01(progress);
  const travelPulse = pulse(travelProgress);
  const isGateEntry = sourceType === "cover-gate" && targetType === "families";
  if (isGateEntry) {
    return {
      doveFlight: smoothstep(0.12, 0.88, travelProgress),
      petalGust: clamp01(travelPulse * 0.72),
      rabbitGuide: clamp01(smoothstep(0.28, 0.78, travelProgress) * 0.68),
      voileLift: smoothstep(0.04, 0.82, travelProgress),
      windStrength: clamp01(travelPulse * 0.82),
    };
  }

  if (targetType === "finale") {
    return {
      doveFlight: clamp01(smoothstep(0.16, 0.88, travelProgress) * 0.74),
      petalGust: clamp01(travelPulse * 0.5),
      rabbitGuide: 0,
      voileLift: 0,
      windStrength: clamp01(travelPulse * 0.42),
    };
  }

  return {
    doveFlight: 0,
    petalGust: clamp01(travelPulse * 0.16),
    rabbitGuide: 0,
    voileLift: 0,
    windStrength: clamp01(travelPulse * 0.24),
  };
}

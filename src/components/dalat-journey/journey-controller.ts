import { dalatJourneyDefinition } from "@/data/dalat-journey";

export type JourneyPhase =
  | "threshold"
  | "settled"
  | "travelling"
  | "fallback-settled";

export type JourneyState = {
  currentIndex: number;
  look: {
    pitchDegrees: number;
    yawDegrees: number;
  };
  phase: JourneyPhase;
  reducedMotion: boolean;
  renderMode: "webgl" | "fallback";
  targetIndex: number | null;
};

export type JourneyAction =
  | { type: "arrive" }
  | { type: "enter" }
  | { type: "look"; pitchDegrees: number; yawDegrees: number }
  | { type: "next" }
  | { type: "previous" }
  | { type: "rendererFallback" }
  | { type: "resetLook" }
  | { type: "setReducedMotion"; value: boolean };

export function createInitialJourneyState(
  reducedMotion: boolean,
): JourneyState {
  return {
    currentIndex: 0,
    look: { pitchDegrees: 0, yawDegrees: 0 },
    phase: "threshold",
    reducedMotion,
    renderMode: "webgl",
    targetIndex: null,
  };
}

function requestTravel(
  state: JourneyState,
  targetIndex: number,
): JourneyState {
  if (state.phase === "travelling") {
    return state;
  }

  if (
    targetIndex < 0 ||
    targetIndex >= dalatJourneyDefinition.checkpoints.length
  ) {
    return state;
  }

  return {
    ...state,
    look: { pitchDegrees: 0, yawDegrees: 0 },
    phase: "travelling",
    targetIndex,
  };
}

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.max(minimum, Math.min(maximum, value));
}

export function journeyReducer(
  state: JourneyState,
  action: JourneyAction,
): JourneyState {
  switch (action.type) {
    case "enter":
      return state.phase === "threshold" ? requestTravel(state, 1) : state;
    case "next":
      return requestTravel(state, state.currentIndex + 1);
    case "previous":
      return requestTravel(state, state.currentIndex - 1);
    case "arrive":
      if (state.phase !== "travelling" || state.targetIndex === null) {
        return state;
      }

      return {
        ...state,
        currentIndex: state.targetIndex,
        phase:
          state.renderMode === "fallback" ? "fallback-settled" : "settled",
        targetIndex: null,
      };
    case "rendererFallback":
      return {
        ...state,
        currentIndex: state.targetIndex ?? state.currentIndex,
        phase:
          state.phase === "threshold" ? "threshold" : "fallback-settled",
        renderMode: "fallback",
        targetIndex: null,
      };
    case "look": {
      if (
        state.phase !== "settled" &&
        state.phase !== "fallback-settled"
      ) {
        return state;
      }

      const { pitchDegrees, yawDegrees } = dalatJourneyDefinition.look;

      return {
        ...state,
        look: {
          pitchDegrees: clamp(
            action.pitchDegrees,
            -pitchDegrees,
            pitchDegrees,
          ),
          yawDegrees: clamp(action.yawDegrees, -yawDegrees, yawDegrees),
        },
      };
    }
    case "resetLook":
      return {
        ...state,
        look: { pitchDegrees: 0, yawDegrees: 0 },
      };
    case "setReducedMotion":
      return {
        ...state,
        reducedMotion: action.value,
      };
  }
}

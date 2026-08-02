import { forestWeddingJourneyDefinition } from "@/data/forest-wedding-journey";

export type ForestJourneyPhase =
  | "threshold"
  | "settled"
  | "travelling"
  | "fallback-settled";

export type ForestNavigationSource = "button" | "gesture" | "keyboard" | "wheel";

export type ForestJourneyState = {
  currentIndex: number;
  look: {
    pitchDegrees: number;
    yawDegrees: number;
  };
  navigationSource: ForestNavigationSource | null;
  phase: ForestJourneyPhase;
  reducedMotion: boolean;
  renderMode: "webgl" | "fallback";
  sceneCount: number;
  targetIndex: number | null;
};

export type ForestJourneyAction =
  | { source: ForestNavigationSource; type: "enter" | "next" | "previous" }
  | { type: "arrive" }
  | { pitchDegrees: number; type: "look"; yawDegrees: number }
  | {
    look?: { pitchDegrees: number; yawDegrees: number };
    type: "rendererFallback";
  }
  | { type: "resetLook" }
  | { type: "setReducedMotion"; value: boolean };

export function createInitialForestJourneyState(
  sceneCount: number,
  reducedMotion: boolean,
): ForestJourneyState {
  if (sceneCount < 2) {
    throw new Error("Forest journey requires gate and finale");
  }

  return {
    currentIndex: 0,
    look: { pitchDegrees: 0, yawDegrees: 0 },
    navigationSource: null,
    phase: "threshold",
    reducedMotion,
    renderMode: "webgl",
    sceneCount,
    targetIndex: null,
  };
}

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.max(minimum, Math.min(maximum, value));
}

function requestTravel(
  state: ForestJourneyState,
  targetIndex: number,
  source: ForestNavigationSource,
): ForestJourneyState {
  if (
    state.phase === "travelling" ||
    targetIndex < 0 ||
    targetIndex >= state.sceneCount
  ) {
    return state;
  }

  return {
    ...state,
    look: { pitchDegrees: 0, yawDegrees: 0 },
    navigationSource: source,
    phase: "travelling",
    targetIndex,
  };
}

export function forestJourneyReducer(
  state: ForestJourneyState,
  action: ForestJourneyAction,
): ForestJourneyState {
  switch (action.type) {
    case "enter":
      return state.phase === "threshold"
        ? requestTravel(state, 1, action.source)
        : state;
    case "next":
      return state.phase === "settled" || state.phase === "fallback-settled"
        ? requestTravel(state, state.currentIndex + 1, action.source)
        : state;
    case "previous":
      return state.phase === "settled" || state.phase === "fallback-settled"
        ? requestTravel(state, state.currentIndex - 1, action.source)
        : state;
    case "arrive":
      if (state.phase !== "travelling" || state.targetIndex === null) {
        return state;
      }

      return {
        ...state,
        currentIndex: state.targetIndex,
        phase: state.renderMode === "fallback" ? "fallback-settled" : "settled",
        targetIndex: null,
      };
    case "rendererFallback": {
      const currentIndex = state.targetIndex ?? state.currentIndex;
      const phase = state.phase === "threshold" ? "threshold" : "fallback-settled";
      const look = state.phase === "settled" && action.look
        ? {
          pitchDegrees: clamp(
            action.look.pitchDegrees,
            -forestWeddingJourneyDefinition.look.pitchDegrees,
            forestWeddingJourneyDefinition.look.pitchDegrees,
          ),
          yawDegrees: clamp(
            action.look.yawDegrees,
            -forestWeddingJourneyDefinition.look.yawDegrees,
            forestWeddingJourneyDefinition.look.yawDegrees,
          ),
        }
        : { pitchDegrees: 0, yawDegrees: 0 };

      if (
        state.currentIndex === currentIndex &&
        state.phase === phase &&
        state.renderMode === "fallback" &&
        state.targetIndex === null
      ) {
        return state;
      }

      return {
        ...state,
        currentIndex,
        look,
        phase,
        renderMode: "fallback",
        targetIndex: null,
      };
    }
    case "look": {
      if (state.phase !== "settled" && state.phase !== "fallback-settled") {
        return state;
      }

      const look = {
        pitchDegrees: clamp(
          action.pitchDegrees,
          -forestWeddingJourneyDefinition.look.pitchDegrees,
          forestWeddingJourneyDefinition.look.pitchDegrees,
        ),
        yawDegrees: clamp(
          action.yawDegrees,
          -forestWeddingJourneyDefinition.look.yawDegrees,
          forestWeddingJourneyDefinition.look.yawDegrees,
        ),
      };

      if (
        look.pitchDegrees === state.look.pitchDegrees &&
        look.yawDegrees === state.look.yawDegrees
      ) {
        return state;
      }

      return { ...state, look };
    }
    case "resetLook":
      return state.look.pitchDegrees === 0 && state.look.yawDegrees === 0
        ? state
        : { ...state, look: { pitchDegrees: 0, yawDegrees: 0 } };
    case "setReducedMotion":
      if (state.phase === "travelling" || state.reducedMotion === action.value) {
        return state;
      }

      return { ...state, reducedMotion: action.value };
  }
}

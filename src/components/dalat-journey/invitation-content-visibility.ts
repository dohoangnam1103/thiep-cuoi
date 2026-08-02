import type { JourneyPhase } from "./journey-controller";

export const INVITATION_SCENIC_PAUSE_MS = 500;

export type InvitationContentState =
  | "hidden"
  | "scenic-pause"
  | "visible";

type InvitationContentStateInput = {
  activeIndex: number;
  phase: JourneyPhase;
  revealedIndex: number | null;
};

export function getInvitationContentState({
  activeIndex,
  phase,
  revealedIndex,
}: InvitationContentStateInput): InvitationContentState {
  const settled = phase === "settled" || phase === "fallback-settled";
  if (!settled) return "hidden";
  return revealedIndex === activeIndex ? "visible" : "scenic-pause";
}

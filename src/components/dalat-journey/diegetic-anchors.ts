import type { DalatJourneyCheckpointId } from "@/data/dalat-journey";

export type JourneyTransform3 = [number, number, number];

export type DiegeticSurfaceKind =
  | "book"
  | "glass"
  | "greenhouse"
  | "pavilion"
  | "stone";

export type DiegeticAnchor = {
  position: JourneyTransform3;
  rotation: JourneyTransform3;
  surface: DiegeticSurfaceKind;
};

export const DIEGETIC_ANCHORS = {
  mistGate: {
    position: [-1.35, 1.24, 4.4],
    rotation: [0, 0, 0],
    surface: "stone",
  },
  memoryPines: {
    position: [-1.25, 0.52, -5.84],
    rotation: [0, 0.2, 0],
    surface: "glass",
  },
  timeGlasshouse: {
    position: [0, 1.3, -13.26],
    rotation: [0, 0, 0],
    surface: "greenhouse",
  },
  lakePavilion: {
    position: [0, 0.58, -23.7],
    rotation: [0, 0, 0],
    surface: "pavilion",
  },
  wishValley: {
    position: [0, 0.48, -35.88],
    rotation: [-0.28, 0, 0],
    surface: "book",
  },
} satisfies Record<DalatJourneyCheckpointId, DiegeticAnchor>;

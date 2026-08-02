export const DALAT_JOURNEY_CHECKPOINT_IDS = [
  "mistGate",
  "memoryPines",
  "timeGlasshouse",
  "lakePavilion",
  "wishValley",
] as const;

export type DalatJourneyCheckpointId =
  (typeof DALAT_JOURNEY_CHECKPOINT_IDS)[number];

export type JourneyVector3 = readonly [number, number, number];

export type DalatJourneyCheckpoint = {
  readonly cameraPosition: JourneyVector3;
  readonly fallbackImage: string;
  readonly id: DalatJourneyCheckpointId;
  readonly lookTarget: JourneyVector3;
  readonly sceneCue: number;
  readonly travelMidpointToNext: JourneyVector3 | null;
  readonly travelDurationMs: number;
};

export type DalatJourneyCheckpointCopy = {
  body: string;
  detail: string;
  kicker: string;
  name: string;
  title: string;
};

export type DalatJourneyCopy = {
  checkpoints: Record<DalatJourneyCheckpointId, DalatJourneyCheckpointCopy>;
  fallbackNotice: string;
  loading: string;
};

type DalatJourneyDefinition = {
  readonly camera: {
    readonly fovDegrees: number;
  };
  readonly checkpoints: readonly DalatJourneyCheckpoint[];
  readonly look: {
    readonly pitchDegrees: number;
    readonly yawDegrees: number;
  };
  readonly reducedDurationMs: number;
};

export const dalatJourneyDefinition = {
  camera: { fovDegrees: 50 },
  look: { pitchDegrees: 8, yawDegrees: 20 },
  reducedDurationMs: 180,
  checkpoints: [
    {
      id: "mistGate",
      cameraPosition: [0, 1.65, 8.5],
      lookTarget: [0, 1.55, 3.8],
      sceneCue: 0,
      travelMidpointToNext: [-0.6, 1.82, 3.7],
      travelDurationMs: 1_650,
      fallbackImage: "/chungdoi/labs/dalat-journey/fallback/mist-gate.webp",
    },
    {
      id: "memoryPines",
      cameraPosition: [-0.85, 1.65, -1],
      lookTarget: [-0.25, 1.55, -6],
      sceneCue: 0.25,
      travelMidpointToNext: [0.55, 1.82, -5.8],
      travelDurationMs: 1_650,
      fallbackImage: "/chungdoi/labs/dalat-journey/fallback/memory-pines.webp",
    },
    {
      id: "timeGlasshouse",
      cameraPosition: [0.8, 1.7, -10.5],
      lookTarget: [0.2, 1.55, -15],
      sceneCue: 0.5,
      travelMidpointToNext: [-0.65, 1.8, -15.2],
      travelDurationMs: 1_750,
      fallbackImage: "/chungdoi/labs/dalat-journey/fallback/time-glasshouse.webp",
    },
    {
      id: "lakePavilion",
      cameraPosition: [-1.1, 1.65, -20],
      lookTarget: [-0.25, 1.45, -25],
      sceneCue: 0.75,
      travelMidpointToNext: [0.65, 1.86, -25.5],
      travelDurationMs: 1_850,
      fallbackImage: "/chungdoi/labs/dalat-journey/fallback/lake-pavilion.webp",
    },
    {
      id: "wishValley",
      cameraPosition: [0, 1.7, -31],
      lookTarget: [0, 1.6, -36],
      sceneCue: 1,
      travelMidpointToNext: null,
      travelDurationMs: 1_950,
      fallbackImage: "/chungdoi/labs/dalat-journey/fallback/wish-valley.webp",
    },
  ],
} as const satisfies DalatJourneyDefinition;

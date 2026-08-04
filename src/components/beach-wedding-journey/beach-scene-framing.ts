// Copied from src/components/forest-wedding-journey/forest-scene-framing.ts. Fixes to journey
// mechanics must be applied to both.

import type {
  BeachJourneyScene,
  BeachJourneySceneType,
} from "@/data/beach-wedding-journey";

const CONTENT_CENTER_HEIGHTS = {
  "calendar": 0.8,
  "dress-code": 0.82,
  "families": 0.79,
  "finale": 1.08,
  "gallery-photo": 1.02,
  "gift": 1.02,
  "map": 0.96,
  "opening-message": 1.04,
  "rsvp": 1.08,
  "schedule": 0.82,
  "venue": 1.02,
  "wishes": 1.05,
} as const satisfies Record<Exclude<BeachJourneySceneType, "cover-gate">, number>;

export function createBeachCameraScenes(
  scenes: readonly BeachJourneyScene[],
): readonly BeachJourneyScene[] {
  return scenes.map((scene) => {
    if (scene.type === "cover-gate") return scene;

    return {
      ...scene,
      lookTarget: [
        scene.lookTarget[0],
        CONTENT_CENTER_HEIGHTS[scene.type],
        scene.lookTarget[2],
      ],
    };
  });
}

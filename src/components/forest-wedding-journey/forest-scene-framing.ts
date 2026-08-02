import type {
  ForestJourneyScene,
  ForestJourneySceneType,
} from "@/data/forest-wedding-journey";

import { getForestGalleryGeometry } from "./forest-gallery-geometry";
import type { ForestClearingSlot } from "./forest-world-data";

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
} as const satisfies Record<Exclude<ForestJourneySceneType, "cover-gate">, number>;

export function createForestCameraScenes(
  scenes: readonly ForestJourneyScene[],
  clearings: readonly ForestClearingSlot[],
): readonly ForestJourneyScene[] {
  if (scenes.length !== clearings.length) {
    throw new RangeError("Forest camera framing requires one clearing per scene");
  }

  return scenes.map((scene, index) => {
    if (scene.type === "cover-gate") return scene;
    const clearing = clearings[index]!;
    const center = scene.type === "gallery-photo"
      ? getForestGalleryGeometry(scene, clearing).position
      : clearing.position;

    return {
      ...scene,
      lookTarget: [
        center[0],
        CONTENT_CENTER_HEIGHTS[scene.type],
        center[2],
      ],
    };
  });
}

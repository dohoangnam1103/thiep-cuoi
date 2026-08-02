import type { ForestJourneyScene } from "@/data/forest-wedding-journey";

import type { ForestClearingSlot } from "./forest-world-data";

export const FOREST_GALLERY_PRINT_SIZE = [0.68, 0.96] as const;

export type ForestGalleryGeometry = {
  readonly cameraDistance: number;
  readonly cameraPosition: ForestJourneyScene["cameraPosition"];
  readonly position: readonly [number, number, number];
  readonly printSize: typeof FOREST_GALLERY_PRINT_SIZE;
  readonly rotationY: number;
  readonly side: ForestClearingSlot["side"];
};

export function getForestGalleryGeometry(
  scene: Pick<ForestJourneyScene, "cameraPosition">,
  clearing: Pick<ForestClearingSlot, "position" | "side">,
): ForestGalleryGeometry {
  const position = [
    scene.cameraPosition[0] + clearing.side * 1.24,
    clearing.position[1],
    scene.cameraPosition[2] - 2.55,
  ] as const;
  const cameraDistance = Math.hypot(
    scene.cameraPosition[0] - position[0],
    scene.cameraPosition[2] - position[2],
  );

  return {
    cameraDistance,
    cameraPosition: scene.cameraPosition,
    position,
    printSize: FOREST_GALLERY_PRINT_SIZE,
    rotationY: Math.atan2(
      scene.cameraPosition[0] - position[0],
      scene.cameraPosition[2] - position[2],
    ),
    side: clearing.side,
  };
}

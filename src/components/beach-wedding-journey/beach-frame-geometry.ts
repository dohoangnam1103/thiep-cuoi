// Copied from src/components/forest-wedding-journey/forest-gallery-geometry.ts. Fixes to journey
// mechanics must be applied to both.

import type { BeachJourneyScene } from "@/data/beach-wedding-journey";

export const BEACH_GALLERY_PRINT_SIZE = [0.68, 0.96] as const;

/** Height of the frame's centre above the sand, in metres. */
const FRAME_CENTER_HEIGHT = 1.42;

/**
 * How far along the authored look direction the frame hangs, in metres.
 *
 * This is a measured value, not a guess. The authored mobile view is 390 by 844
 * at the journey's 50° vertical FOV, so the horizontal half-FOV is
 * `atan(tan(25°) × 390/844)` = 12.16°. A frame is `BEACH_GALLERY_PRINT_SIZE[0]`
 * = 0.68m wide, so at 2.8m its half-angle is `atan(0.34 / 2.8)` = 6.92° —
 * comfortably inside the 12.16° limit, with margin left for the pose's tilt.
 *
 * The frame is placed *along* the scene's own look vector rather than at a fixed
 * XZ offset. The beach pose aims down the shore at
 * `lookTarget = [x + 4.5, 1.35, z - 1.1]`, i.e. yaw 76.26°; a fixed
 * `[+2.55, +1.24]` offset would sit at yaw 115.93°, 39.67° off-axis, and would
 * put every frame off-screen. Deriving from `lookTarget` rather than re-stating
 * the +4.5/−1.1 literals also means the frame follows the pose if the pose is
 * ever retuned.
 */
const FRAME_CAMERA_DISTANCE = 2.8;

export type BeachFrameGeometry = {
  readonly cameraDistance: number;
  readonly cameraPosition: BeachJourneyScene["cameraPosition"];
  readonly position: readonly [number, number, number];
  readonly printSize: typeof BEACH_GALLERY_PRINT_SIZE;
  readonly rotationY: number;
};

export function getBeachFrameGeometry(
  scene: Pick<BeachJourneyScene, "cameraPosition" | "lookTarget">,
): BeachFrameGeometry {
  const lookX = scene.lookTarget[0] - scene.cameraPosition[0];
  const lookZ = scene.lookTarget[2] - scene.cameraPosition[2];
  const lookLength = Math.hypot(lookX, lookZ);
  if (lookLength === 0) {
    // A pose whose look target sits directly above or below the camera has no
    // horizontal direction to hang a frame along, and would otherwise silently
    // produce a NaN position and rotation.
    throw new RangeError(
      "Beach frame geometry requires a horizontal look direction",
    );
  }

  const position = [
    scene.cameraPosition[0] + (lookX / lookLength) * FRAME_CAMERA_DISTANCE,
    FRAME_CENTER_HEIGHT,
    scene.cameraPosition[2] + (lookZ / lookLength) * FRAME_CAMERA_DISTANCE,
  ] as const;
  const cameraDistance = Math.hypot(
    scene.cameraPosition[0] - position[0],
    scene.cameraPosition[2] - position[2],
  );

  return {
    cameraDistance,
    cameraPosition: scene.cameraPosition,
    position,
    printSize: BEACH_GALLERY_PRINT_SIZE,
    rotationY: Math.atan2(
      scene.cameraPosition[0] - position[0],
      scene.cameraPosition[2] - position[2],
    ),
  };
}

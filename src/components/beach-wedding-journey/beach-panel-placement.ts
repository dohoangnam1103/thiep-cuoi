/*
 * Twin file: src/components/forest-wedding-journey/forest-scene-framing.ts is the
 * nearest equivalent — a pure module the framing tests can import without
 * dragging a CSS module or a React renderer in. The forest twin computes each
 * panel's transform inside its scene component; here the geometry is split out
 * because the panel component imports the lab's CSS module, which a `node:test`
 * run cannot parse.
 */

import type { BeachJourneyScene } from "@/data/beach-wedding-journey";

/**
 * How far above the sand a content panel is centred, in metres.
 *
 * The hanging line sits at `BEACH_POST_HEIGHT_METRES` (2.15m) less the sag; a
 * panel centred at 1.4m hangs below the line the way the frames do and lands
 * inside the camera's authored `lookTarget` heights (0.79m–1.08m) rather than
 * above them.
 */
export const BEACH_PANEL_CENTRE_HEIGHT_METRES = 1.4;

/**
 * How far in front of the hanging line a panel sits, in metres.
 *
 * Coplanar with the line the panel z-fights the frames' hangers. A tenth of a
 * metre towards the camera is enough separation at this scale and keeps the
 * panel visually attached to the line rather than floating in front of it.
 */
export const BEACH_PANEL_LINE_OFFSET_METRES = 0.1;

/**
 * `<Html transform>` scale divisor.
 *
 * Carried over from the forest twin unchanged: the same CSS module sizes the
 * panels, so a different divisor would render the same markup at a different
 * physical size on the same rail geometry.
 */
export const BEACH_PANEL_DISTANCE_FACTOR = 2.4;

export type BeachPanelPlacement = {
  readonly position: readonly [number, number, number];
  readonly rotationY: number;
};

/**
 * Where the panel hangs, and which way it faces.
 *
 * The panel is placed at the scene's `lookTarget` in the ground plane — that is
 * where the camera is already aimed — then nudged
 * `BEACH_PANEL_LINE_OFFSET_METRES` towards the camera and yawed to face the
 * camera pose head on. The rail alternates between the landward and seaward
 * side of the line, so a fixed rotation would show half the scenes edge-on.
 */
export function getBeachPanelPlacement(
  scene: BeachJourneyScene,
): BeachPanelPlacement {
  const toCameraX = scene.cameraPosition[0] - scene.lookTarget[0];
  const toCameraZ = scene.cameraPosition[2] - scene.lookTarget[2];
  const distance = Math.hypot(toCameraX, toCameraZ);
  // A degenerate pose (camera directly above the target) has no facing
  // direction; leaving the panel unrotated and unmoved is the only defined
  // answer and beats dividing by zero.
  const scale = distance === 0
    ? 0
    : BEACH_PANEL_LINE_OFFSET_METRES / distance;

  return {
    position: [
      scene.lookTarget[0] + toCameraX * scale,
      BEACH_PANEL_CENTRE_HEIGHT_METRES,
      scene.lookTarget[2] + toCameraZ * scale,
    ],
    rotationY: Math.atan2(toCameraX, toCameraZ),
  };
}

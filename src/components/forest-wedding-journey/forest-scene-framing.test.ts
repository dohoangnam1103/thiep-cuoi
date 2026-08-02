import assert from "node:assert/strict";
import test from "node:test";

import {
  buildForestJourneyScenes,
  forestWeddingJourneyDemoContent,
  forestWeddingJourneyFeatures,
} from "@/data/forest-wedding-journey";

import { getForestGalleryGeometry } from "./forest-gallery-geometry";
import { createForestCameraScenes } from "./forest-scene-framing";
import {
  createForestWorldPlacements,
  getForestWorldDensity,
} from "./forest-world-data";

const ASSEMBLY_WIDTHS = {
  "calendar": 1.32,
  "dress-code": 1.55,
  "families": 1.74,
  "finale": 1.86,
  "gallery-photo": 0.76,
  "gift": 1.5,
  "map": 1.62,
  "opening-message": 1.05,
  "rsvp": 1.68,
  "schedule": 1.78,
  "venue": 1.36,
  "wishes": 1.72,
} as const;

test("physical checkpoint assemblies fit the authored 390 by 844 mobile view", () => {
  const scenes = buildForestJourneyScenes(
    forestWeddingJourneyDemoContent,
    forestWeddingJourneyFeatures,
  );
  const placements = createForestWorldPlacements(
    scenes.length,
    getForestWorldDensity("mobile", "mobile"),
  );
  const framedScenes = createForestCameraScenes(scenes, placements.clearings);
  const horizontalHalfFov = Math.atan(
    Math.tan(50 * Math.PI / 360) * (390 / 844),
  );

  for (const [index, scene] of framedScenes.entries()) {
    if (scene.type === "cover-gate") continue;
    const clearing = placements.clearings[index];
    assert.ok(clearing);
    const center = scene.type === "gallery-photo"
      ? getForestGalleryGeometry(scene, clearing).position
      : clearing.position;
    const distance = Math.hypot(
      center[0] - scene.cameraPosition[0],
      center[2] - scene.cameraPosition[2],
    );
    const authoredYaw = Math.atan2(
      scene.lookTarget[0] - scene.cameraPosition[0],
      scene.cameraPosition[2] - scene.lookTarget[2],
    );
    const assemblyYaw = Math.atan2(
      center[0] - scene.cameraPosition[0],
      scene.cameraPosition[2] - center[2],
    );
    const assemblyHalfAngle = Math.atan(
      (ASSEMBLY_WIDTHS[scene.type] / 2) / distance,
    );

    assert.ok(
      Math.abs(assemblyYaw - authoredYaw) + assemblyHalfAngle <= horizontalHalfFov,
      `${scene.id} must fit the mobile horizontal field of view`,
    );
  }
});

test("camera framing rejects a scene and clearing count mismatch", () => {
  const scenes = buildForestJourneyScenes(
    forestWeddingJourneyDemoContent,
    forestWeddingJourneyFeatures,
  );

  assert.throws(
    () => createForestCameraScenes(scenes, []),
    /one clearing per scene/,
  );
});

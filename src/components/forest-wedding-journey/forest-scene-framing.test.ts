import assert from "node:assert/strict";
import test from "node:test";

import {
  buildForestJourneyScenes,
  forestWeddingJourneyDemoContent,
  forestWeddingJourneyFeatures,
} from "@/data/forest-wedding-journey";

import { getForestGalleryGeometry } from "./forest-gallery-geometry";
import {
  FOREST_GATE_POST_X,
  FOREST_GATE_WOOD_SEGMENTS,
  FOREST_VOILE_PROJECTED_SIZE,
} from "./forest-gate";
import {
  getForestPropBevelRadius,
  getForestWoodTaper,
} from "./photoreal/forest-prop-material-policy";
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

test("the upgraded gate keeps its authored posts and voile projection", () => {
  // Both values are load-bearing: the E2E suite reads the projected voile size
  // and the posts define the walk-through opening the camera aims at.
  assert.deepEqual(FOREST_GATE_POST_X, [-1.38, 1.38]);
  assert.deepEqual(FOREST_VOILE_PROJECTED_SIZE, { height: 432, width: 344 });

  const openingWidth = FOREST_GATE_POST_X[1] - FOREST_GATE_POST_X[0];
  for (const segment of FOREST_GATE_WOOD_SEGMENTS) {
    const length = Math.hypot(
      segment.end[0] - segment.start[0],
      segment.end[1] - segment.start[1],
      segment.end[2] - segment.start[2],
    );
    assert.ok(length > 0, "a wood member must have length");
    // A bevelled, tapered member is still slender: the taper only narrows the
    // top, so the base radius must stay well under the gate opening.
    assert.ok(
      segment.radius * 2 < openingWidth * 0.1,
      `a member of radius ${segment.radius} would block the gate opening`,
    );
    assert.ok(
      getForestWoodTaper(length) <= 1,
      "taper must never widen a member",
    );
  }
});

test("gate props stay within the authored silhouette after bevelling", () => {
  const bevel = getForestPropBevelRadius(0.09, 1.28, 0.09);
  assert.ok(bevel > 0 && bevel < 0.09 / 2);
});

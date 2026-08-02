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

test("gallery geometry keeps a 0.7 by 1.0 metre print two to three metres away on alternating sides", () => {
  const scenes = buildForestJourneyScenes(
    forestWeddingJourneyDemoContent,
    forestWeddingJourneyFeatures,
  );
  const placements = createForestWorldPlacements(
    scenes.length,
    getForestWorldDensity("desktop", "desktop"),
  );
  const galleryGeometry = scenes.flatMap((scene, index) => {
    if (scene.type !== "gallery-photo") return [];
    const clearing = placements.clearings[index];
    assert.ok(clearing);
    return [getForestGalleryGeometry(scene, clearing)];
  });

  assert.equal(galleryGeometry.length, 3);
  assert.deepEqual(galleryGeometry.map(({ side }) => side), [-1, 1, -1]);
  for (const geometry of galleryGeometry) {
    assert.deepEqual(geometry.printSize, [0.68, 0.96]);
    assert.ok(geometry.cameraDistance >= 2);
    assert.ok(geometry.cameraDistance <= 3);
    assert.equal(
      Math.sign(geometry.position[0] - geometry.cameraPosition[0]),
      geometry.side,
    );
  }
});

test("authored gallery views keep the complete easel inside a 390 by 844 mobile camera", () => {
  const scenes = buildForestJourneyScenes(
    forestWeddingJourneyDemoContent,
    forestWeddingJourneyFeatures,
  );
  const placements = createForestWorldPlacements(
    scenes.length,
    getForestWorldDensity("mobile", "mobile"),
  );
  const framedScenes = createForestCameraScenes(scenes, placements.clearings);
  const verticalFovRadians = 50 * Math.PI / 180;
  const mobileAspect = 390 / 844;
  const horizontalHalfFov = Math.atan(
    Math.tan(verticalFovRadians / 2) * mobileAspect,
  );

  for (const [index, scene] of framedScenes.entries()) {
    if (scene.type !== "gallery-photo") continue;
    const clearing = placements.clearings[index];
    assert.ok(clearing);
    const geometry = getForestGalleryGeometry(scene, clearing);
    const authoredYaw = Math.atan2(
      scene.lookTarget[0] - scene.cameraPosition[0],
      scene.cameraPosition[2] - scene.lookTarget[2],
    );
    const easelYaw = Math.atan2(
      geometry.position[0] - scene.cameraPosition[0],
      scene.cameraPosition[2] - geometry.position[2],
    );
    const easelHalfAngle = Math.atan((0.76 / 2) / geometry.cameraDistance);

    assert.ok(
      Math.abs(easelYaw - authoredYaw) + easelHalfAngle <= horizontalHalfFov,
      `${scene.id} must fit the mobile horizontal field of view`,
    );
  }
});

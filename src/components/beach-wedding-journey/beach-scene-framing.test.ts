// Copied from src/components/forest-wedding-journey/forest-scene-framing.test.ts. Fixes to journey
// mechanics must be applied to both.

import assert from "node:assert/strict";
import test from "node:test";

import {
  beachWeddingJourneyDefinition,
  beachWeddingJourneyDemoContent,
  beachWeddingJourneyFeatures,
  buildBeachJourneyScenes,
} from "@/data/beach-wedding-journey";

import { getBeachFrameGeometry } from "./beach-frame-geometry";
import { createBeachCameraScenes } from "./beach-scene-framing";

// Unchanged from the forest suite: the content assemblies moved location, not
// size, so the widths the mobile framing budget is checked against are the same.
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

function demoScenes() {
  return buildBeachJourneyScenes(
    beachWeddingJourneyDemoContent,
    beachWeddingJourneyFeatures,
  );
}

test("physical checkpoint assemblies fit the authored 390 by 844 mobile view", () => {
  const framedScenes = createBeachCameraScenes(demoScenes());
  const horizontalHalfFov = Math.atan(
    Math.tan(beachWeddingJourneyDefinition.camera.fovDegrees * Math.PI / 360)
      * (390 / 844),
  );

  for (const scene of framedScenes) {
    if (scene.type === "cover-gate") continue;
    const center = scene.type === "gallery-photo"
      ? getBeachFrameGeometry(scene).position
      : scene.lookTarget;
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

test("framing raises every content scene to its authored content centre height", () => {
  const scenes = demoScenes();
  const framedScenes = createBeachCameraScenes(scenes);

  for (const [index, framed] of framedScenes.entries()) {
    const scene = scenes[index]!;
    if (framed.type === "cover-gate") continue;
    // Only the height moves; the horizontal aim is the authored pose.
    assert.equal(framed.lookTarget[0], scene.lookTarget[0]);
    assert.equal(framed.lookTarget[2], scene.lookTarget[2]);
    assert.notEqual(framed.lookTarget[1], scene.lookTarget[1]);
    assert.ok(framed.lookTarget[1] >= 0.79 && framed.lookTarget[1] <= 1.08);
  }
});

test("each scene type is framed at its own authored content centre height", () => {
  // The height table is half of what this module does, so pin it exactly rather
  // than only bounding it: a nudged entry silently reaims the camera.
  const expectedHeights = {
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
  } as const;

  const seen = new Set<string>();
  for (const scene of createBeachCameraScenes(demoScenes())) {
    if (scene.type === "cover-gate") continue;
    assert.equal(
      scene.lookTarget[1],
      expectedHeights[scene.type],
      `${scene.type} must be framed at its authored centre height`,
    );
    seen.add(scene.type);
  }

  // Every authored height is exercised by the demo journey, so no entry can rot
  // unnoticed behind a scene type the demo never builds.
  assert.deepEqual(
    [...seen].sort(),
    Object.keys(expectedHeights).sort(),
  );
});

test("the cover gate passes through untouched", () => {
  const scenes = demoScenes();
  const gate = scenes.find((scene) => scene.type === "cover-gate");
  assert.ok(gate);

  const framedGate = createBeachCameraScenes(scenes)
    .find((scene) => scene.type === "cover-gate");

  assert.strictEqual(framedGate, gate);
});

test("camera framing is a pure map over the scene list", () => {
  const scenes = demoScenes();
  const framedScenes = createBeachCameraScenes(scenes);

  assert.equal(framedScenes.length, scenes.length);
  assert.deepEqual(
    framedScenes.map(({ id }) => id),
    scenes.map(({ id }) => id),
  );
  assert.deepEqual(
    framedScenes.map(({ ordinal }) => ordinal),
    scenes.map(({ ordinal }) => ordinal),
  );
  assert.deepEqual(createBeachCameraScenes(scenes), framedScenes);
  assert.deepEqual(createBeachCameraScenes([]), []);
});

// Copied from src/components/forest-wedding-journey/forest-gallery-geometry.test.ts. Fixes to journey
// mechanics must be applied to both.

import assert from "node:assert/strict";
import test from "node:test";

import {
  beachWeddingJourneyDefinition,
  beachWeddingJourneyDemoContent,
  beachWeddingJourneyFeatures,
  buildBeachJourneyScenes,
} from "@/data/beach-wedding-journey";

import {
  BEACH_GALLERY_PRINT_SIZE,
  getBeachFrameGeometry,
} from "./beach-frame-geometry";
import { createBeachCameraScenes } from "./beach-scene-framing";

const MOBILE_VIEWPORT = { height: 844, width: 390 } as const;

function mobileHorizontalHalfFov(): number {
  return Math.atan(
    Math.tan(beachWeddingJourneyDefinition.camera.fovDegrees * Math.PI / 360)
      * (MOBILE_VIEWPORT.width / MOBILE_VIEWPORT.height),
  );
}

function galleryScenes() {
  return buildBeachJourneyScenes(
    beachWeddingJourneyDemoContent,
    beachWeddingJourneyFeatures,
  ).filter((scene) => scene.type === "gallery-photo");
}

test("hanging frames keep a 0.68 by 0.96 metre print at the authored hanging distance", () => {
  const geometries = galleryScenes().map(getBeachFrameGeometry);

  assert.equal(geometries.length, 3);
  assert.deepEqual(BEACH_GALLERY_PRINT_SIZE, [0.68, 0.96]);
  for (const geometry of geometries) {
    assert.deepEqual(geometry.printSize, BEACH_GALLERY_PRINT_SIZE);
    // Placed along the look vector at a fixed distance, so every frame sits at
    // exactly the authored hanging distance rather than wherever a constant XZ
    // offset happened to land.
    assert.ok(Math.abs(geometry.cameraDistance - 2.8) < 1e-9);
    assert.ok(geometry.position.every(Number.isFinite));
    assert.ok(Number.isFinite(geometry.rotationY));
    assert.equal(geometry.position[1], 1.42);
  }
});

test("every hanging frame sits on the authored look axis and inside the mobile view", () => {
  // This is the assertion a fixed landward XZ offset fails: the beach pose aims
  // down the shore at yaw 76.26 degrees, so a frame hung at a constant
  // [+2.55, +1.24] would sit 39.67 degrees off-axis against a 12.16 degree
  // mobile horizontal half-FOV, and would be off-screen.
  const horizontalHalfFov = mobileHorizontalHalfFov();
  assert.ok(Math.abs(horizontalHalfFov * 180 / Math.PI - 12.16) < 0.01);

  for (const scene of createBeachCameraScenes(galleryScenes())) {
    const geometry = getBeachFrameGeometry(scene);
    const authoredYaw = Math.atan2(
      scene.lookTarget[0] - scene.cameraPosition[0],
      scene.cameraPosition[2] - scene.lookTarget[2],
    );
    const frameYaw = Math.atan2(
      geometry.position[0] - scene.cameraPosition[0],
      scene.cameraPosition[2] - geometry.position[2],
    );
    const frameHalfAngle = Math.atan(
      (BEACH_GALLERY_PRINT_SIZE[0] / 2) / geometry.cameraDistance,
    );

    assert.ok(
      Math.abs(frameYaw - authoredYaw) + frameHalfAngle <= horizontalHalfFov,
      `${scene.id} must fit the mobile horizontal field of view`,
    );
  }
});

test("a hanging frame faces the camera that looks at it", () => {
  for (const scene of galleryScenes()) {
    const geometry = getBeachFrameGeometry(scene);
    const facingX = Math.sin(geometry.rotationY);
    const facingZ = Math.cos(geometry.rotationY);
    const toCameraX = scene.cameraPosition[0] - geometry.position[0];
    const toCameraZ = scene.cameraPosition[2] - geometry.position[2];
    const length = Math.hypot(toCameraX, toCameraZ);

    assert.ok(
      Math.abs(facingX - toCameraX / length) < 1e-9,
      "the frame normal must point back along the camera axis",
    );
    assert.ok(Math.abs(facingZ - toCameraZ / length) < 1e-9);
  }
});

test("frame geometry is deterministic for a given scene", () => {
  for (const scene of galleryScenes()) {
    assert.deepEqual(getBeachFrameGeometry(scene), getBeachFrameGeometry(scene));
  }
});

test("the returned camera position is the scene's own, not a placeholder", () => {
  // Consumers aim the frame from this field, so an unasserted passthrough would
  // let a wrong value face every frame at a point the camera never occupies.
  // The forest twin covered this incidentally through its `side` sign assertion,
  // which went away with the field.
  for (const scene of galleryScenes()) {
    assert.deepEqual(
      getBeachFrameGeometry(scene).cameraPosition,
      scene.cameraPosition,
    );
  }
});

test("a pose with no horizontal look direction is rejected", () => {
  assert.throws(
    () => getBeachFrameGeometry({
      cameraPosition: [3, 1.62, 7],
      lookTarget: [3, 0.4, 7],
    }),
    /horizontal look direction/,
  );
});

import assert from "node:assert/strict";
import { test } from "node:test";

import {
  beachWeddingJourneyDefinition,
  buildBeachJourneyScenes,
  beachWeddingJourneyDemoContent,
  beachWeddingJourneyFeatures,
  type BeachJourneyScene,
} from "@/data/beach-wedding-journey";
import {
  BEACH_PANEL_CENTRE_HEIGHT_METRES,
  BEACH_PANEL_DISTANCE_FACTOR,
  BEACH_PANEL_LINE_OFFSET_METRES,
  getBeachPanelPlacement,
} from "@/components/beach-wedding-journey/beach-panel-placement";
import { residentSceneIndices } from "@/components/beach-wedding-journey/beach-scene-residency";

const scenes = buildBeachJourneyScenes(
  beachWeddingJourneyDemoContent,
  beachWeddingJourneyFeatures,
);

function sceneAt(index: number): BeachJourneyScene {
  const scene = scenes[index];
  assert.ok(scene, `scene ${index} missing`);
  return scene;
}

function poseScene(
  cameraPosition: readonly [number, number, number],
  lookTarget: readonly [number, number, number],
): BeachJourneyScene {
  return { ...sceneAt(1), cameraPosition, lookTarget };
}

test("panel sits at the line height regardless of the scene's look target", () => {
  for (const scene of scenes) {
    const { position } = getBeachPanelPlacement(scene);
    assert.equal(position[1], BEACH_PANEL_CENTRE_HEIGHT_METRES);
  }
});

test("panel is offset from the look target by exactly the line offset", () => {
  for (const scene of scenes) {
    const { position } = getBeachPanelPlacement(scene);
    const dx = position[0] - scene.lookTarget[0];
    const dz = position[2] - scene.lookTarget[2];
    assert.ok(
      Math.abs(Math.hypot(dx, dz) - BEACH_PANEL_LINE_OFFSET_METRES) < 1e-9,
      `${scene.id}: offset ${Math.hypot(dx, dz)}`,
    );
  }
});

test("panel moves towards the camera, never away from it", () => {
  for (const scene of scenes) {
    const { position } = getBeachPanelPlacement(scene);
    const toCameraX = scene.cameraPosition[0] - scene.lookTarget[0];
    const toCameraZ = scene.cameraPosition[2] - scene.lookTarget[2];
    const dx = position[0] - scene.lookTarget[0];
    const dz = position[2] - scene.lookTarget[2];
    // Same direction as the camera vector: the dot product of the two must be
    // positive, which a sign flip in the offset would break.
    assert.ok(dx * toCameraX + dz * toCameraZ > 0, scene.id);
  }
});

test("panel yaw faces the camera along +Z of its own frame", () => {
  // A camera due +Z of the target looks back along -Z, so the panel's local +Z
  // must point at +Z world: yaw 0.
  const northPose = poseScene([0, 1.62, 5], [0, 1, 0]);
  assert.equal(getBeachPanelPlacement(northPose).rotationY, 0);

  // Camera due +X: the panel turns a quarter turn.
  const eastPose = poseScene([5, 1.62, 0], [0, 1, 0]);
  assert.ok(
    Math.abs(getBeachPanelPlacement(eastPose).rotationY - Math.PI / 2) < 1e-9,
  );

  // Camera due -X: the opposite quarter turn, which a swapped atan2 argument
  // order or a sign error would not produce.
  const westPose = poseScene([-5, 1.62, 0], [0, 1, 0]);
  assert.ok(
    Math.abs(getBeachPanelPlacement(westPose).rotationY + Math.PI / 2) < 1e-9,
  );
});

test("panel yaw points the panel's forward axis at the camera for every scene", () => {
  for (const scene of scenes) {
    const { position, rotationY } = getBeachPanelPlacement(scene);
    // The panel's local +Z in world space.
    const forwardX = Math.sin(rotationY);
    const forwardZ = Math.cos(rotationY);
    const toCameraX = scene.cameraPosition[0] - position[0];
    const toCameraZ = scene.cameraPosition[2] - position[2];
    const length = Math.hypot(toCameraX, toCameraZ);
    assert.ok(length > 0, `${scene.id}: camera coincides with panel`);
    const alignment = (forwardX * toCameraX + forwardZ * toCameraZ) / length;
    assert.ok(alignment > 0.999_999, `${scene.id}: alignment ${alignment}`);
  }
});

test("a camera directly above the target leaves the panel unmoved and unrotated", () => {
  const degenerate = poseScene([3, 6, -4], [3, 1, -4]);
  const { position, rotationY } = getBeachPanelPlacement(degenerate);
  assert.deepEqual(
    [...position],
    [3, BEACH_PANEL_CENTRE_HEIGHT_METRES, -4],
  );
  assert.equal(rotationY, 0);
  assert.ok(Number.isFinite(position[0]) && Number.isFinite(position[2]));
});

test("panel distance factor is the shared journey value", () => {
  assert.equal(BEACH_PANEL_DISTANCE_FACTOR, 2.4);
});

test("panel height clears the camera's authored look-target band", () => {
  // Every content scene aims between 0.79m and 1.08m; a panel centred below the
  // top of that band would be looked over rather than at.
  const contentScenes = scenes.filter((scene) => scene.type !== "cover-gate");
  assert.ok(contentScenes.length > 0);
  for (const scene of contentScenes) {
    assert.ok(
      BEACH_PANEL_CENTRE_HEIGHT_METRES > scene.lookTarget[1],
      `${scene.id}: look target ${scene.lookTarget[1]}`,
    );
  }
});

test("panel stays below the eye height the poses use", () => {
  const eyeHeights = new Set(scenes.map((scene) => scene.cameraPosition[1]));
  for (const height of eyeHeights) {
    assert.ok(
      BEACH_PANEL_CENTRE_HEIGHT_METRES < height,
      `panel at ${BEACH_PANEL_CENTRE_HEIGHT_METRES} not below eye ${height}`,
    );
  }
});

test("panel offset is small next to the shortest pose distance", () => {
  const shortest = Math.min(
    ...scenes.map((scene) => Math.hypot(
      scene.cameraPosition[0] - scene.lookTarget[0],
      scene.cameraPosition[2] - scene.lookTarget[2],
    )),
  );
  assert.ok(shortest > 0);
  assert.ok(
    BEACH_PANEL_LINE_OFFSET_METRES < shortest / 10,
    `offset ${BEACH_PANEL_LINE_OFFSET_METRES} vs shortest pose ${shortest}`,
  );
});

test("every panel stays inside the camera's far plane", () => {
  const { far } = beachWeddingJourneyDefinition.camera;
  for (const scene of scenes) {
    const { position } = getBeachPanelPlacement(scene);
    const distance = Math.hypot(
      scene.cameraPosition[0] - position[0],
      scene.cameraPosition[1] - position[1],
      scene.cameraPosition[2] - position[2],
    );
    assert.ok(distance < far, `${scene.id}: ${distance} >= far ${far}`);
    assert.ok(
      distance > beachWeddingJourneyDefinition.camera.near,
      `${scene.id}: ${distance} inside near plane`,
    );
  }
});

test("resident window keeps the current scene and its neighbours", () => {
  assert.deepEqual(residentSceneIndices(4, null, 10), [3, 4, 5]);
});

test("resident window spans both current and target while travelling", () => {
  assert.deepEqual(residentSceneIndices(2, 7, 10), [2, 6, 7, 8]);
});

test("resident window clamps at the ends without duplicates", () => {
  assert.deepEqual(residentSceneIndices(0, null, 10), [0, 1]);
  assert.deepEqual(residentSceneIndices(9, null, 10), [8, 9]);
  assert.deepEqual(residentSceneIndices(0, 0, 1), [0]);
});

test("resident window is deduped when the target is adjacent to the current", () => {
  assert.deepEqual(residentSceneIndices(3, 4, 10), [3, 4, 5]);
});

test("resident window never exceeds four scenes for the real scene count", () => {
  for (let current = 0; current < scenes.length; current += 1) {
    for (let target = 0; target < scenes.length; target += 1) {
      const resident = residentSceneIndices(current, target, scenes.length);
      assert.ok(resident.length <= 4, `${current}->${target}: ${resident.length}`);
      assert.ok(resident.includes(current), `${current}->${target} dropped current`);
      assert.ok(resident.includes(target), `${current}->${target} dropped target`);
      for (const index of resident) {
        assert.ok(index >= 0 && index < scenes.length, `out of range ${index}`);
      }
    }
  }
});

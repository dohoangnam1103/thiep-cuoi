import assert from "node:assert/strict";
import { test } from "node:test";

import {
  beachWeddingJourneyDemoContent,
  beachWeddingJourneyFeatures,
  buildBeachJourneyScenes,
  BEACH_SHORE_SETBACK_METRES,
} from "./beach-wedding-journey";

test("journey opens at the gate and closes on the pier", () => {
  const scenes = buildBeachJourneyScenes(
    beachWeddingJourneyDemoContent,
    beachWeddingJourneyFeatures,
  );

  assert.equal(scenes[0]!.type, "cover-gate");
  assert.equal(scenes.at(-1)!.type, "finale");
  assert.ok(scenes.length >= 8, `expected a full journey, received ${scenes.length}`);
});

test("ordinals are dense and sequential", () => {
  const scenes = buildBeachJourneyScenes(
    beachWeddingJourneyDemoContent,
    beachWeddingJourneyFeatures,
  );

  scenes.forEach((scene, index) => assert.equal(scene.ordinal, index));
});

test("the rail advances along the shore, not into it", () => {
  const scenes = buildBeachJourneyScenes(
    beachWeddingJourneyDemoContent,
    beachWeddingJourneyFeatures,
  );

  for (let index = 1; index < scenes.length; index += 1) {
    const previous = scenes[index - 1]!;
    const current = scenes[index]!;
    assert.ok(
      current.cameraPosition[0] > previous.cameraPosition[0],
      `scene ${current.id} must advance along x`,
    );
  }
});

test("every camera pose keeps the documented setback from the waterline", () => {
  const scenes = buildBeachJourneyScenes(
    beachWeddingJourneyDemoContent,
    beachWeddingJourneyFeatures,
  );

  for (const scene of scenes) {
    assert.ok(
      scene.cameraPosition[2] >= BEACH_SHORE_SETBACK_METRES,
      `${scene.id} sits ${scene.cameraPosition[2]}m from the water, closer than the ${BEACH_SHORE_SETBACK_METRES}m setback`,
    );
  }
});

test("travel midpoints keep the setback too", () => {
  const scenes = buildBeachJourneyScenes(
    beachWeddingJourneyDemoContent,
    beachWeddingJourneyFeatures,
  );

  for (const scene of scenes) {
    if (scene.travelMidpointToNext === null) continue;
    assert.ok(
      scene.travelMidpointToNext[2] >= BEACH_SHORE_SETBACK_METRES,
      `${scene.id} passes ${scene.travelMidpointToNext[2]}m from the water mid-travel; the camera must not cross the setback between scenes either`,
    );
  }
});

test("eye height is human and constant across the walk", () => {
  const scenes = buildBeachJourneyScenes(
    beachWeddingJourneyDemoContent,
    beachWeddingJourneyFeatures,
  );

  for (const scene of scenes) {
    assert.equal(scene.cameraPosition[1], 1.62);
  }
});

test("only the finale has no midpoint to the next scene", () => {
  const scenes = buildBeachJourneyScenes(
    beachWeddingJourneyDemoContent,
    beachWeddingJourneyFeatures,
  );

  scenes.forEach((scene, index) => {
    const isLast = index === scenes.length - 1;
    assert.equal(
      scene.travelMidpointToNext === null,
      isLast,
      `${scene.id} midpoint nullity should be ${isLast}`,
    );
  });
});

test("a gallery scene exists per valid photo", () => {
  const scenes = buildBeachJourneyScenes(
    beachWeddingJourneyDemoContent,
    beachWeddingJourneyFeatures,
  );
  const galleryScenes = scenes.filter((scene) => scene.type === "gallery-photo");

  assert.equal(galleryScenes.length, beachWeddingJourneyDemoContent.gallery.length);
  for (const scene of galleryScenes) {
    assert.ok(scene.photo, `${scene.id} must carry its photo`);
  }
});

test("empty content still yields a walkable gate-to-finale journey", () => {
  const scenes = buildBeachJourneyScenes(
    {
      ...beachWeddingJourneyDemoContent,
      ceremonyDate: "",
      ceremonyHeader: "",
      dressCodeColors: [],
      families: {
        brideAddress: "", brideFather: "", brideMother: "", brideParentTitle: "",
        groomAddress: "", groomFather: "", groomMother: "", groomParentTitle: "",
      },
      gallery: [],
      giftAccounts: [],
      mapQuery: "",
      openingMessage: "",
      receptionDate: "",
      schedule: [],
      venueAddress: "",
    },
    { gift: false, map: false, rsvp: false, wishes: false },
  );

  assert.deepEqual(scenes.map((scene) => scene.type), ["cover-gate", "finale"]);
});

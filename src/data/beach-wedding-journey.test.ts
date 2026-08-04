import assert from "node:assert/strict";
import { test } from "node:test";

import {
  beachWeddingJourneyDefinition,
  beachWeddingJourneyDemoContent,
  beachWeddingJourneyFeatures,
  buildBeachCalendarEvents,
  buildBeachJourneyScenes,
  orderBeachFamilySides,
  BEACH_SHORE_SETBACK_METRES,
  type BeachJourneyContent,
} from "./beach-wedding-journey";

const demoScenes = buildBeachJourneyScenes(
  beachWeddingJourneyDemoContent,
  beachWeddingJourneyFeatures,
);

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

const METRE_EPSILON = 1e-9;

function assertMetresEqual(actual: number, expected: number, message: string): void {
  assert.ok(
    Math.abs(actual - expected) < METRE_EPSILON,
    `${message}: expected ${expected}m, received ${actual}m`,
  );
}

test("the shore setback is the documented 7 metres and at least one pose sits on it", () => {
  // Pinned as a literal: every pose's z is *computed* from this constant, so a
  // relative assertion can never catch it shrinking. At 2m the rail reads as the
  // rim of an ornamental pond, which is exactly what the doc comment forbids.
  assert.equal(BEACH_SHORE_SETBACK_METRES, 7);

  const onTheFloor = demoScenes.filter(
    (scene) => Math.abs(scene.cameraPosition[2] - BEACH_SHORE_SETBACK_METRES) < METRE_EPSILON,
  );
  assert.ok(
    onTheFloor.length >= 1,
    "the setback is a floor the walk actually touches, not an unreachable bound",
  );
  assertMetresEqual(demoScenes[0]!.cameraPosition[2], 7, "the gate sits on the setback");
  assertMetresEqual(demoScenes.at(-1)!.cameraPosition[2], 7, "the finale sits on the setback");
});

test("consecutive scenes are a full stride of shoreline apart", () => {
  assertMetresEqual(
    demoScenes[0]!.cameraPosition[0],
    -8,
    "the rail is anchored in world space; shoreline geometry is authored around this origin",
  );

  for (let index = 1; index < demoScenes.length; index += 1) {
    assertMetresEqual(
      demoScenes[index]!.cameraPosition[0] - demoScenes[index - 1]!.cameraPosition[0],
      8.5,
      `${demoScenes[index]!.id} must stand a stride down the beach from its predecessor`,
    );
  }

  const span =
    demoScenes.at(-1)!.cameraPosition[0] - demoScenes[0]!.cameraPosition[0];
  assert.ok(
    span >= 50,
    `the journey must cross a beach, not a doormat; spans only ${span}m`,
  );
});

test("interior scenes drift inland so the walk reads as a stroll, not a rail", () => {
  const interior = demoScenes.slice(1, -1);
  const inland = interior.filter(
    (scene) => scene.cameraPosition[2] > BEACH_SHORE_SETBACK_METRES + METRE_EPSILON,
  );

  assert.ok(inland.length >= 1, "a dead-straight rail is the failure this drift exists to avoid");
  for (const scene of inland) {
    assertMetresEqual(scene.cameraPosition[2], 7.9, `${scene.id} drifts a fixed step inland`);
  }
  assert.ok(
    interior.some(
      (scene) => Math.abs(scene.cameraPosition[2] - BEACH_SHORE_SETBACK_METRES) < METRE_EPSILON,
    ),
    "the drift must alternate back to the setback line, not hold a second parallel rail",
  );
});

test("each camera looks ahead down the beach and slightly seaward", () => {
  for (const scene of demoScenes) {
    assertMetresEqual(
      scene.lookTarget[0] - scene.cameraPosition[0],
      4.5,
      `${scene.id} must look ahead along the shore`,
    );
    assertMetresEqual(scene.lookTarget[1], 1.35, `${scene.id} look height`);
    assertMetresEqual(
      scene.lookTarget[2] - scene.cameraPosition[2],
      -1.1,
      `${scene.id} must angle seaward, keeping sky and water in frame`,
    );
  }
});

test("travel durations are bounded walks, never teleports", () => {
  for (const scene of demoScenes) {
    assert.ok(
      Number.isFinite(scene.travelDurationMs) &&
        scene.travelDurationMs >= 1_200 &&
        scene.travelDurationMs <= 1_800,
      `${scene.id} travels in ${scene.travelDurationMs}ms, outside the 1200-1800ms walk budget`,
    );
  }
  assert.equal(demoScenes[0]!.travelDurationMs, 1_500);
});

test("each midpoint sits halfway along its leg", () => {
  for (let index = 0; index < demoScenes.length - 1; index += 1) {
    const scene = demoScenes[index]!;
    const next = demoScenes[index + 1]!;
    const midpoint = scene.travelMidpointToNext;
    assert.ok(midpoint, `${scene.id} must carry a midpoint to ${next.id}`);
    assertMetresEqual(
      midpoint[0],
      (scene.cameraPosition[0] + next.cameraPosition[0]) / 2,
      `${scene.id} waypoint must sit halfway to ${next.id}`,
    );
    assert.ok(
      midpoint[0] > scene.cameraPosition[0] && midpoint[0] < next.cameraPosition[0],
      `${scene.id} waypoint must lie strictly between the two scenes, not on top of one`,
    );
    assertMetresEqual(midpoint[2], 7.45, `${scene.id} waypoint holds the mid-drift line`);
    assertMetresEqual(
      midpoint[1],
      1.72,
      `${scene.id} waypoint must hold eye height mid-travel, not dip underground or climb into the sky`,
    );
  }
});

test("gallery descriptors trim IDs and keep only the first valid occurrence", () => {
  const content: BeachJourneyContent = {
    ...beachWeddingJourneyDemoContent,
    gallery: [
      { id: " memory-a ", src: " /one.webp " },
      { id: "memory-a", src: "/duplicate.webp" },
      { id: "  ", src: "/invalid.webp" },
      { id: "memory-b", src: " /two.webp " },
    ],
  };

  const galleryScenes = buildBeachJourneyScenes(content, beachWeddingJourneyFeatures).filter(
    (scene) => scene.type === "gallery-photo",
  );

  assert.deepEqual(
    galleryScenes.map((scene) => ({ id: scene.id, photo: scene.photo })),
    [
      { id: "gallery-photo:memory-a", photo: { id: "memory-a", src: "/one.webp" } },
      { id: "gallery-photo:memory-b", photo: { id: "memory-b", src: "/two.webp" } },
    ],
  );
});

test("an account whose owner does not match its side does not add a gift scene", () => {
  const content: BeachJourneyContent = {
    ...beachWeddingJourneyDemoContent,
    giftAccounts: [
      {
        accountName: "Someone Else",
        accountNumber: "123456789",
        bankName: "Example Bank",
        side: "bride",
      },
    ],
  };

  assert.ok(
    !buildBeachJourneyScenes(content, beachWeddingJourneyFeatures).some(
      (scene) => scene.type === "gift",
    ),
    "an account naming someone other than the bride or groom must suppress the gift scene entirely",
  );
});

test("a mixed-validity gift account list does not add a gift scene", () => {
  const content: BeachJourneyContent = {
    ...beachWeddingJourneyDemoContent,
    giftAccounts: [
      ...beachWeddingJourneyDemoContent.giftAccounts,
      {
        accountName: beachWeddingJourneyDemoContent.groomName,
        accountNumber: "",
        bankName: "Beach Journey Demo Bank",
        side: "groom",
      },
    ],
  };

  assert.ok(
    !buildBeachJourneyScenes(content, beachWeddingJourneyFeatures).some(
      (scene) => scene.type === "gift",
    ),
    "one account with a blank number must suppress the gift scene even though the others are valid",
  );
});

test("valid demo accounts do keep the gift scene", () => {
  assert.ok(
    demoScenes.some((scene) => scene.type === "gift"),
    "the demo's fully valid accounts must still produce a gift scene, or the validity gate is rejecting everything",
  );
});

test("calendar event rows distinguish localized ceremony and reception values on different dates", () => {
  assert.deepEqual(
    buildBeachCalendarEvents(
      {
        ceremonyDate: "2026-08-02",
        ceremonyTime: "09:00",
        receptionDate: "2026-08-03",
        receptionTime: "18:30",
      },
      {
        ceremony: "Ceremony",
        formattedCeremonyDate: "August 2, 2026",
        formattedReceptionDate: "August 3, 2026",
        reception: "Reception",
      },
    ),
    [
      {
        date: "2026-08-02",
        formattedDate: "August 2, 2026",
        label: "Ceremony",
        time: "09:00",
      },
      {
        date: "2026-08-03",
        formattedDate: "August 3, 2026",
        label: "Reception",
        time: "18:30",
      },
    ],
  );
});

test("family side ordering follows brideFirst in both orientations", () => {
  assert.deepEqual(orderBeachFamilySides(true), ["bride", "groom"]);
  assert.deepEqual(orderBeachFamilySides(false), ["groom", "bride"]);
});

test("the journey definition keeps a usable camera frustum and look angle", () => {
  const { camera, look, reducedDurationMs } = beachWeddingJourneyDefinition;

  assert.equal(camera.near, 0.1);
  assert.equal(camera.far, 320);
  assert.equal(camera.fovDegrees, 50);
  assert.equal(look.pitchDegrees, 8);
  assert.equal(look.yawDegrees, 20);
  assert.equal(reducedDurationMs, 180);
});

import assert from "node:assert/strict";
import test from "node:test";

import { dalatJourneyDefinition } from "@/data/dalat-journey";

import {
  DALAT_BACKDROP_DEPTH_LAYERS,
  getDalatBackdropAssetPaths,
  getDalatBackdropBlend,
  getDalatBackdropCoverScale,
  getDalatBackdropLayerOffset,
} from "./dalat-backdrop-config";

test("Dalat backdrop reuses the five authored checkpoint artwork plates", () => {
  assert.deepEqual(
    getDalatBackdropAssetPaths(),
    dalatJourneyDefinition.checkpoints.map(({ fallbackImage }) => fallbackImage),
  );
  assert.equal(new Set(getDalatBackdropAssetPaths()).size, 5);
});

test("Dalat backdrop crossfades only while travelling", () => {
  assert.deepEqual(getDalatBackdropBlend(0, false), {
    activeOpacity: 1,
    targetOpacity: 0,
  });
  assert.deepEqual(getDalatBackdropBlend(-1, true), {
    activeOpacity: 1,
    targetOpacity: 0,
  });
  assert.deepEqual(getDalatBackdropBlend(0.5, true), {
    activeOpacity: 0.5,
    targetOpacity: 0.5,
  });
  assert.deepEqual(getDalatBackdropBlend(2, true), {
    activeOpacity: 0,
    targetOpacity: 1,
  });
});

test("Dalat backdrop cover scale keeps the 4:3 plates covering desktop and mobile viewports", () => {
  assert.deepEqual(getDalatBackdropCoverScale(16 / 9), [
    (16 / 9) / (4 / 3),
    1,
  ]);
  assert.deepEqual(getDalatBackdropCoverScale(390 / 844), [
    1,
    (4 / 3) / (390 / 844),
  ]);
});

test("Dalat backdrop uses three increasingly responsive depth layers", () => {
  assert.deepEqual(
    DALAT_BACKDROP_DEPTH_LAYERS.map(({ id }) => id),
    ["far", "mid", "near"],
  );

  const offsets = DALAT_BACKDROP_DEPTH_LAYERS.map((layer) =>
    getDalatBackdropLayerOffset(
      { pitchDegrees: 8, yawDegrees: 20 },
      layer,
    ),
  );

  assert.ok(Math.abs(offsets[0].x) < Math.abs(offsets[1].x));
  assert.ok(Math.abs(offsets[1].x) < Math.abs(offsets[2].x));
  assert.ok(Math.abs(offsets[0].y) < Math.abs(offsets[1].y));
  assert.ok(Math.abs(offsets[1].y) < Math.abs(offsets[2].y));
  assert.ok(
    DALAT_BACKDROP_DEPTH_LAYERS[0].scale
      < DALAT_BACKDROP_DEPTH_LAYERS[2].scale,
  );
});

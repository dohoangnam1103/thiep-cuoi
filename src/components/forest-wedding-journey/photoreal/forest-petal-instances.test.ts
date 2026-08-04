import assert from "node:assert/strict";
import test from "node:test";

import type { ForestPetalPlacement } from "../forest-world-data";
import {
  FOREST_PETAL_CALM_CUE,
  composeForestPetalInstance,
  hashForestPetalInstances,
} from "./forest-petal-instances";
import {
  FOREST_PETAL_FALL_SPAN,
  sampleForestPetalMotion,
} from "./forest-petal-motion";

function petal(index: number): ForestPetalPlacement {
  return {
    atlasCell: index % 4,
    fallSpeed: 0.5 + index * 0.01,
    pathOffset: index * 0.3,
    phase: index * 0.7,
    position: [index * 0.2 - 1, 1.4, -index * 0.6],
    rotation: [0, index * 0.1, 0],
    scale: 1,
    tint: 0xffd7e5,
    windPhase: index,
  };
}

const PLACEMENTS = Array.from({ length: 12 }, (_, index) => petal(index));

test("composed petal instances stay inside the framed corridor", () => {
  for (let index = 0; index < PLACEMENTS.length; index += 1) {
    const placement = PLACEMENTS[index]!;
    const instance = composeForestPetalInstance(
      placement,
      sampleForestPetalMotion(index, 3.25, { petalGust: 1, windStrength: 1 }, false),
      false,
    );

    assert.ok(
      instance.position[1] >= 0.5
        && instance.position[1] <= 0.5 + FOREST_PETAL_FALL_SPAN,
      `petal ${index} left the fall span at y=${instance.position[1]}`,
    );
    assert.ok(instance.scale[0] > 0 && instance.scale[1] > instance.scale[0]);
  }
});

test("reduced motion pins petals to their authored height", () => {
  const placement = PLACEMENTS[3]!;
  const instance = composeForestPetalInstance(
    placement,
    sampleForestPetalMotion(3, 9.5, FOREST_PETAL_CALM_CUE, true),
    true,
  );

  assert.deepEqual([...instance.position], [...placement.position]);
  assert.deepEqual([...instance.rotation], [...placement.rotation]);
});

test("petal fingerprint is stable for the same field, time and cue", () => {
  const first = hashForestPetalInstances(
    PLACEMENTS,
    0,
    FOREST_PETAL_CALM_CUE,
    false,
  );
  const second = hashForestPetalInstances(
    PLACEMENTS,
    0,
    FOREST_PETAL_CALM_CUE,
    false,
  );

  assert.equal(first, second);
  assert.match(first, /^[0-9a-f]{8}$/);
});

test("petal fingerprint separates field size, time and reduced motion", () => {
  const base = hashForestPetalInstances(
    PLACEMENTS,
    0,
    FOREST_PETAL_CALM_CUE,
    false,
  );

  assert.notEqual(
    base,
    hashForestPetalInstances(
      PLACEMENTS.slice(0, 11),
      0,
      FOREST_PETAL_CALM_CUE,
      false,
    ),
  );
  assert.notEqual(
    base,
    hashForestPetalInstances(PLACEMENTS, 2.5, FOREST_PETAL_CALM_CUE, false),
  );
  assert.notEqual(
    base,
    hashForestPetalInstances(PLACEMENTS, 0, FOREST_PETAL_CALM_CUE, true),
  );
});

test("frozen petals ignore elapsed time entirely", () => {
  assert.equal(
    hashForestPetalInstances(PLACEMENTS, 0, FOREST_PETAL_CALM_CUE, true),
    hashForestPetalInstances(PLACEMENTS, 41.75, FOREST_PETAL_CALM_CUE, true),
  );
});

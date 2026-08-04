import assert from "node:assert/strict";
import test from "node:test";

import {
  FOREST_PETAL_FALL_SPAN,
  FOREST_PETAL_MAX_LATERAL,
  sampleForestPetalMotion,
} from "./forest-petal-motion";

const CALM = { petalGust: 0, windStrength: 0 } as const;
const GUSTING = { petalGust: 1, windStrength: 0.8 } as const;

function everyNumber(transform: ReturnType<typeof sampleForestPetalMotion>) {
  return [
    transform.depthOffset,
    transform.fallHeight,
    transform.lateralOffset,
    transform.opacity,
    transform.rotation[0],
    transform.rotation[1],
    transform.rotation[2],
    transform.scale,
  ];
}

test("sampleForestPetalMotion is deterministic and finite", () => {
  for (let seed = 0; seed < 24; seed += 1) {
    for (const time of [0, 0.37, 2.5, 11.25, 60]) {
      const first = sampleForestPetalMotion(seed, time, GUSTING, false);
      const second = sampleForestPetalMotion(seed, time, GUSTING, false);
      assert.deepEqual(first, second, `seed ${seed} at t=${time} is not stable`);
      for (const value of everyNumber(first)) {
        assert.ok(
          Number.isFinite(value),
          `seed ${seed} at t=${time} produced ${value}`,
        );
      }
    }
  }
});

test("different seeds trace different paths", () => {
  const signatures = new Set<string>();
  for (let seed = 0; seed < 24; seed += 1) {
    const samples = [0.5, 1.9, 4.4].map((time) => {
      const transform = sampleForestPetalMotion(seed, time, CALM, false);
      return [
        transform.fallHeight.toFixed(4),
        transform.lateralOffset.toFixed(4),
      ].join(":");
    });
    signatures.add(samples.join("|"));
  }
  assert.equal(signatures.size, 24);
});

test("a gust widens lateral travel without breaking the bounds", () => {
  for (let seed = 0; seed < 12; seed += 1) {
    let calmPeak = 0;
    let gustPeak = 0;

    for (let step = 0; step < 240; step += 1) {
      const time = step * 0.05;
      const calm = sampleForestPetalMotion(seed, time, CALM, false);
      const gusting = sampleForestPetalMotion(seed, time, GUSTING, false);
      calmPeak = Math.max(calmPeak, Math.abs(calm.lateralOffset));
      gustPeak = Math.max(gustPeak, Math.abs(gusting.lateralOffset));

      for (const transform of [calm, gusting]) {
        assert.ok(
          Math.abs(transform.lateralOffset) <= FOREST_PETAL_MAX_LATERAL,
          `seed ${seed} drifted to ${transform.lateralOffset}`,
        );
        assert.ok(
          transform.fallHeight >= 0
            && transform.fallHeight <= FOREST_PETAL_FALL_SPAN,
          `seed ${seed} fell to ${transform.fallHeight}`,
        );
        assert.ok(transform.opacity >= 0 && transform.opacity <= 1);
      }
    }

    assert.ok(
      gustPeak > calmPeak,
      `seed ${seed} ignored the gust (${gustPeak} <= ${calmPeak})`,
    );
  }
});

test("respawning petals fade out instead of teleporting on screen", () => {
  for (let seed = 0; seed < 12; seed += 1) {
    let previous = sampleForestPetalMotion(seed, 0, GUSTING, false);

    for (let step = 1; step < 600; step += 1) {
      const time = step * 0.05;
      const current = sampleForestPetalMotion(seed, time, GUSTING, false);
      const jump = Math.abs(current.fallHeight - previous.fallHeight);
      if (jump > FOREST_PETAL_FALL_SPAN * 0.5) {
        assert.ok(
          previous.opacity < 0.2 && current.opacity < 0.2,
          `seed ${seed} respawned while visible at t=${time}`,
        );
      }
      previous = current;
    }
  }
});

test("reduced motion freezes the petal in place", () => {
  for (let seed = 0; seed < 12; seed += 1) {
    const atZero = sampleForestPetalMotion(seed, 0, GUSTING, true);
    const atTwenty = sampleForestPetalMotion(seed, 20, GUSTING, true);
    assert.deepEqual(atZero, atTwenty);
    assert.equal(atZero.opacity, 1);
    assert.equal(atZero.lateralOffset, 0);
    assert.equal(atZero.depthOffset, 0);
  }
});

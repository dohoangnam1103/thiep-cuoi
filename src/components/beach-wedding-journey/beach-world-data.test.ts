// Copied from src/components/forest-wedding-journey/forest-world-data.test.ts. Fixes to journey
// mechanics must be applied to both.

import assert from "node:assert/strict";
import test from "node:test";

import {
  createBeachAdaptiveQualitySampler,
  estimateExactRgbaMipBytes,
  getBeachWorldDensity,
  getInitialBeachWorldQualityTier,
  type BeachWorldDensity,
} from "./beach-world-data";

test("exact RGBA mip estimates include every integer mip level", () => {
  assert.equal(estimateExactRgbaMipBytes(1_024, 1_024), 5_592_404);
  assert.equal(estimateExactRgbaMipBytes(1_363, 2_048), 14_883_276);
  assert.throws(() => estimateExactRgbaMipBytes(0, 1_024), RangeError);
  assert.throws(() => estimateExactRgbaMipBytes(1_024, 0), RangeError);
  assert.throws(() => estimateExactRgbaMipBytes(1_024.5, 1_024), RangeError);
  assert.throws(() => estimateExactRgbaMipBytes(-8, 8), RangeError);
  // A 1x1 texture is one mip of one pixel: the loop must terminate on it, not
  // skip it.
  assert.equal(estimateExactRgbaMipBytes(1, 1), 4);
  // Non-square dimensions clamp the short axis at 1 and keep halving the long
  // one: 4x1 -> 2x1 -> 1x1 is 4 + 2 + 1 = 7 pixels.
  assert.equal(estimateExactRgbaMipBytes(4, 1), 28);
});

const EXPECTED_DENSITIES = {
  desktop: { frames: 3, posts: 24, tables: 18 },
  mobile: { frames: 3, posts: 18, tables: 12 },
  reduced: { frames: 3, posts: 12, tables: 8 },
} satisfies Record<string, BeachWorldDensity>;

test("quality tiers expose the exact fixed density ceilings", () => {
  assert.deepEqual(getBeachWorldDensity("desktop", "desktop"), EXPECTED_DENSITIES.desktop);
  assert.deepEqual(getBeachWorldDensity("mobile", "mobile"), EXPECTED_DENSITIES.mobile);
  assert.deepEqual(getBeachWorldDensity("desktop", "reduced"), EXPECTED_DENSITIES.reduced);
  assert.deepEqual(getBeachWorldDensity("mobile", "reduced"), EXPECTED_DENSITIES.reduced);
  assert.equal(getInitialBeachWorldQualityTier("desktop"), "desktop");
  assert.equal(getInitialBeachWorldQualityTier("mobile"), "mobile");
});

test("the couple's photographs are never what a reduction removes", () => {
  // Tables and posts are scenery and shrink with the tier; the frames hold the
  // content, so their count is constant by design.
  const tiers = (["desktop", "mobile", "reduced"] as const)
    .map((tier) => getBeachWorldDensity("desktop", tier));

  assert.deepEqual(new Set(tiers.map(({ frames }) => frames)), new Set([3]));
  for (const key of ["posts", "tables"] as const) {
    assert.ok(tiers[0]![key] > tiers[1]![key]);
    assert.ok(tiers[1]![key] > tiers[2]![key]);
  }
});

test("density reads are defensive copies the caller cannot mutate", () => {
  const first = getBeachWorldDensity("desktop", "desktop") as { tables: number };
  first.tables = 1;

  assert.equal(getBeachWorldDensity("desktop", "desktop").tables, 18);
});

test("adaptive quality reduces once only after two sustained slow seconds", () => {
  let reductions = 0;
  const sampler = createBeachAdaptiveQualitySampler(() => {
    reductions += 1;
  });

  for (let timestamp = 0; timestamp <= 2_100; timestamp += 25) {
    sampler.sample(timestamp);
  }
  assert.equal(reductions, 1);

  for (let timestamp = 2_125; timestamp <= 5_000; timestamp += 25) {
    sampler.sample(timestamp);
  }
  assert.equal(reductions, 1);
});

test("a fast display frame resets the sustained-slow accumulator", () => {
  let reductions = 0;
  const sampler = createBeachAdaptiveQualitySampler(() => {
    reductions += 1;
  });

  for (let timestamp = 0; timestamp <= 1_500; timestamp += 25) sampler.sample(timestamp);
  sampler.sample(1_516);
  for (let timestamp = 1_541; timestamp <= 3_016; timestamp += 25) sampler.sample(timestamp);

  assert.equal(reductions, 0);
  for (let timestamp = 3_041; timestamp <= 3_566; timestamp += 25) sampler.sample(timestamp);
  assert.equal(reductions, 1);
});

test("visibility resets and isolated stalls cannot trigger degradation", () => {
  let reductions = 0;
  const sampler = createBeachAdaptiveQualitySampler(() => {
    reductions += 1;
  });

  for (let timestamp = 0; timestamp <= 1_400; timestamp += 25) sampler.sample(timestamp);
  sampler.reset();
  sampler.sample(10_000);
  sampler.sample(12_500);
  assert.equal(reductions, 0);

  for (let timestamp = 12_525; timestamp <= 14_000; timestamp += 25) sampler.sample(timestamp);
  assert.equal(reductions, 0);
});

test("a device too slow to clear 250ms frames still reduces", () => {
  // Every frame being an outlier used to reset the accumulator on every sample,
  // so the slowest hardware — the only hardware the reduction exists for — was
  // the one case that could never reduce. A sustained streak of quarter-second
  // frames is a slow renderer, not a deschedule: a real deschedule flips
  // `visibilityState` and the caller resets the sampler instead.
  let reductions = 0;
  const sampler = createBeachAdaptiveQualitySampler(() => {
    reductions += 1;
  });

  for (let timestamp = 0; timestamp <= 3_600; timestamp += 600) {
    sampler.sample(timestamp);
  }
  assert.equal(reductions, 1);
});

test("a single stall between healthy frames never accumulates", () => {
  let reductions = 0;
  const sampler = createBeachAdaptiveQualitySampler(() => {
    reductions += 1;
  });

  // Alternating one 600ms stall with fast frames must stay quiet forever: the
  // streak resets before it reaches the limit, and the fast frame clears the
  // accumulator.
  let timestamp = 0;
  for (let cycle = 0; cycle < 40; cycle += 1) {
    timestamp += 600;
    sampler.sample(timestamp);
    timestamp += 16;
    sampler.sample(timestamp);
  }
  assert.equal(reductions, 0);
});

test("the sampler ignores non-finite and non-advancing timestamps", () => {
  let reductions = 0;
  const sampler = createBeachAdaptiveQualitySampler(() => {
    reductions += 1;
  });

  assert.equal(sampler.sample(Number.NaN), false);
  assert.equal(sampler.sample(Number.POSITIVE_INFINITY), false);
  // The first finite sample only seeds the previous timestamp.
  assert.equal(sampler.sample(0), false);

  // Just short of the threshold, then a rewound or repeated clock reading,
  // which must clear the accumulator rather than credit a non-positive delta.
  for (let timestamp = 25; timestamp <= 1_975; timestamp += 25) sampler.sample(timestamp);
  sampler.sample(1_975);
  assert.equal(reductions, 0);

  // If the repeat had not cleared it, this second stretch alone would carry the
  // total past two seconds.
  for (let timestamp = 2_000; timestamp <= 3_000; timestamp += 25) sampler.sample(timestamp);
  assert.equal(reductions, 0);

  for (let timestamp = 3_025; timestamp <= 4_100; timestamp += 25) sampler.sample(timestamp);
  assert.equal(reductions, 1);
});

test("the sampler reports the frame on which it reduced", () => {
  const sampler = createBeachAdaptiveQualitySampler(() => {});
  const results: boolean[] = [];

  for (let timestamp = 0; timestamp <= 2_500; timestamp += 25) {
    results.push(sampler.sample(timestamp));
  }

  assert.equal(results.filter(Boolean).length, 1);
});

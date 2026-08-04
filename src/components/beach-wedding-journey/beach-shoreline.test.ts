import assert from "node:assert/strict";
import { test } from "node:test";

import { BEACH_SHORE_SETBACK_METRES } from "@/data/beach-wedding-journey";

import {
  BEACH_SHORE_CURVE_AMPLITUDE_METRES,
  shorelineOffsetAt,
  waterDepthAt,
} from "./beach-shoreline";

test("the shoreline is deterministic", () => {
  for (const x of [-40, -12.5, 0, 7.25, 33, 118]) {
    assert.equal(shorelineOffsetAt(x), shorelineOffsetAt(x));
  }
});

test("the shoreline curves rather than running straight", () => {
  const samples = Array.from({ length: 64 }, (_, index) => shorelineOffsetAt(index * 2.5));
  const spread = Math.max(...samples) - Math.min(...samples);

  assert.ok(spread > 1, `a straight waterline reads as a pond rim; spread was ${spread}`);
});

test("the curve stays inside its documented amplitude", () => {
  for (let x = -120; x <= 120; x += 0.5) {
    assert.ok(
      Math.abs(shorelineOffsetAt(x)) <= BEACH_SHORE_CURVE_AMPLITUDE_METRES,
      `offset at x=${x} escaped the amplitude envelope`,
    );
  }
});

test("depth is zero on the sand side and positive seaward", () => {
  const x = 12;
  const shore = shorelineOffsetAt(x);

  assert.equal(waterDepthAt(x, shore + 3), 0, "sand must not be underwater");
  assert.ok(waterDepthAt(x, shore - 3) > 0, "sea must have depth");
});

test("depth increases monotonically out to sea", () => {
  const x = -6;
  const shore = shorelineOffsetAt(x);
  let previous = 0;

  for (let step = 0; step <= 40; step += 1) {
    const depth = waterDepthAt(x, shore - step);
    assert.ok(depth >= previous, `depth dipped at step ${step}`);
    previous = depth;
  }
});

test("depth is continuous across the waterline", () => {
  const x = 3.5;
  const shore = shorelineOffsetAt(x);

  assert.ok(waterDepthAt(x, shore) < 0.02, "there must be no cliff at the waterline");
});

/**
 * Waves are deferred. When they land, `waterDepthAt` gains a time term and this
 * test must be updated deliberately — it exists so that change cannot slip in
 * unnoticed, and so the wave work inherits a regression net.
 */
test("depth is time-invariant while waves are deferred", () => {
  assert.equal(waterDepthAt.length, 2, "waterDepthAt still takes exactly (x, z)");
});

/**
 * The load-bearing cross-module invariant: the camera rail sits at a fixed z of
 * BEACH_SHORE_SETBACK_METRES, so the curving waterline must never reach it. If
 * the curve ever crosses the rail the walker is standing in the sea. Swept well
 * past the journey's own span (the rail runs x = -8 to about x = 111) because
 * terrain and water tiles are built beyond the walked range.
 */
const MINIMUM_DRY_CLEARANCE_METRES = 1;

test("the camera rail never falls seaward of the waterline", () => {
  for (let x = -120; x <= 240; x += 0.5) {
    const shore = shorelineOffsetAt(x);
    const clearance = BEACH_SHORE_SETBACK_METRES - shore;

    assert.ok(
      clearance >= MINIMUM_DRY_CLEARANCE_METRES,
      `the rail at z=${BEACH_SHORE_SETBACK_METRES} is only ${clearance}m inland of the waterline ` +
        `at x=${x} (offset ${shore}); it needs at least ${MINIMUM_DRY_CLEARANCE_METRES}m`,
    );
    assert.equal(
      waterDepthAt(x, BEACH_SHORE_SETBACK_METRES),
      0,
      `the camera is standing in ${waterDepthAt(x, BEACH_SHORE_SETBACK_METRES)}m of water at x=${x}`,
    );
  }
});

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

  // Depth feeds terrain vertices and frame placement, so it must be as pure as
  // the offset it is built from — on the sand side and out at sea alike.
  for (const x of [-40, -12.5, 0, 7.25, 33, 118]) {
    const shore = shorelineOffsetAt(x);

    for (const z of [shore + 12, shore + 0.5, shore, shore - 0.5, shore - 9, shore - 45]) {
      assert.equal(waterDepthAt(x, z), waterDepthAt(x, z), `depth wandered at x=${x}, z=${z}`);
    }
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

  assert.equal(waterDepthAt(x, shore), 0, "the waterline itself is the zero-depth edge");
  assert.equal(waterDepthAt(x, shore + 0.1), 0, "sand just landward of the line stays dry");

  // Sampled just *seaward* of the line, where the ramp is actually evaluated.
  // Reading exactly at the line only exercises the `seawardMetres <= 0` guard,
  // which returns a literal 0 regardless of how the ramp is shaped or tuned.
  const near = waterDepthAt(x, shore - 0.1);
  const far = waterDepthAt(x, shore - 0.2);

  assert.ok(near < 0.02, `there must be no cliff at the waterline; depth 10cm out was ${near}m`);
  assert.ok(far > 0, "the floor must still be descending 20cm out, or the ratio below is vacuous");

  // Smoothstep leaves the waterline flat, so depth grows slower than linearly
  // out of the shallows: halving the distance from the line must do more than
  // halve the depth. A plain linear ramp would sit at exactly 0.5 here, and a
  // ramp short enough to saturate immediately would sit at 1.
  assert.ok(
    near / far < 0.35,
    `the floor leaves the waterline as a wedge, not a flat: depth fell only to ${near / far} ` +
      "of its 20cm value at 10cm",
  );
});

/**
 * Waves are deferred. When they land, `waterDepthAt` gains a time term and this
 * test must be updated deliberately — it exists so that change cannot slip in
 * unnoticed, and so the wave work inherits a regression net.
 *
 * Arity alone is not enough: a time term added as a defaulted third parameter
 * leaves `.length` at 2, and a `Date.now()` read inside the body changes no
 * signature at all. So this also pins the result across real elapsed wall-clock
 * time, and pins it against a spurious third argument.
 */
test("depth is time-invariant while waves are deferred", () => {
  assert.equal(waterDepthAt.length, 2, "waterDepthAt still takes exactly (x, z)");

  const x = 9.5;
  const z = shorelineOffsetAt(x) - 6;
  const baseline = waterDepthAt(x, z);

  const startedAt = Date.now();
  while (Date.now() - startedAt < 5) {
    assert.equal(waterDepthAt(x, z), baseline, "depth drifted with the wall clock");
  }
  assert.ok(Date.now() > startedAt, "the interval must actually elapse for this to bite");

  // A defaulted time parameter would still type-check against this signature.
  const withSpuriousTime: (x: number, z: number, timeSeconds: number) => number = waterDepthAt;
  for (const timeSeconds of [0.25, 3, 1000]) {
    assert.equal(
      withSpuriousTime(x, z, timeSeconds),
      baseline,
      `depth responded to a time argument (${timeSeconds}s)`,
    );
  }
});

/**
 * The module documents its two sine periods as incommensurable "so the curve
 * never visibly repeats along the walk". Spread alone cannot see a violation: a
 * secondary period that divides evenly into the primary keeps the same envelope
 * while making the curve exactly periodic, so the walker passes the identical
 * waterline three times over the 119m journey. Both periods are module-private,
 * so the primary is restated here — 37m, the outer sine's wavelength and the
 * shortest span the whole curve could repeat over.
 */
const PRIMARY_PERIOD_METRES = 37;
const MINIMUM_PERIOD_DIVERGENCE_METRES = 0.5;

test("the curve does not repeat at the primary period", () => {
  let widestDivergence = 0;

  for (let x = -8; x <= 111; x += 0.25) {
    const divergence = Math.abs(shorelineOffsetAt(x) - shorelineOffsetAt(x + PRIMARY_PERIOD_METRES));
    widestDivergence = Math.max(widestDivergence, divergence);
  }

  assert.ok(
    widestDivergence > MINIMUM_PERIOD_DIVERGENCE_METRES,
    `the waterline repeats every ${PRIMARY_PERIOD_METRES}m along the walk; the widest ` +
      `divergence across a full period was only ${widestDivergence}m`,
  );
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

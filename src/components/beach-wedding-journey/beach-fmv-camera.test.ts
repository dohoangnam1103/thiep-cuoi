import assert from "node:assert/strict";
import { test } from "node:test";

import {
  BEACH_JOURNEY_SCENE_TYPES,
  beachWeddingJourneyDemoContent,
  beachWeddingJourneyFeatures,
  buildBeachJourneyScenes,
} from "@/data/beach-wedding-journey";
import {
  BEACH_FMV_FRAMED_SCENE_TYPES,
  BEACH_FMV_MAX_ZOOM,
  BEACH_FMV_MIN_ZOOM,
  BEACH_FMV_SOURCE_HEIGHT,
  BEACH_FMV_SOURCE_WIDTH,
  BEACH_FMV_WINDOW_SCALE,
  resolveBeachFmvFraming,
  resolveBeachFmvTransform,
} from "@/components/beach-wedding-journey/beach-fmv-camera";

/**
 * The camera window must never reach the edge of the footage.
 *
 * This is the whole safety contract of the synthetic pan: past the edge there are
 * no pixels, so the backdrop shows a hard band where the video stops. It is also
 * the failure a hand-written `transform` string invites, because the positional
 * limit depends on the zoom — a centre that is safe at zoom 1 is off the edge at
 * zoom 0.86.
 */
test("no framing can pan past the edge of the footage", () => {
  const types = [...BEACH_FMV_FRAMED_SCENE_TYPES, "unknown-scene-type"];

  for (const type of types) {
    const framing = resolveBeachFmvFraming(type);
    const coverage = Math.min(1, BEACH_FMV_WINDOW_SCALE / framing.zoom);
    const half = coverage / 2;

    assert.ok(
      framing.centerX - half >= -1e-9,
      `${type} pans past the left edge: centre ${framing.centerX}, half-window ${half}`,
    );
    assert.ok(
      framing.centerX + half <= 1 + 1e-9,
      `${type} pans past the right edge: centre ${framing.centerX}, half-window ${half}`,
    );
    assert.ok(framing.centerY - half >= -1e-9, `${type} pans past the top edge`);
    assert.ok(
      framing.centerY + half <= 1 + 1e-9,
      `${type} pans past the bottom edge`,
    );
  }
});

test("zoom stays inside the range the footage can actually resolve", () => {
  for (const type of [...BEACH_FMV_FRAMED_SCENE_TYPES, "nonsense"]) {
    const { zoom } = resolveBeachFmvFraming(type);
    assert.ok(zoom >= BEACH_FMV_MIN_ZOOM, `${type} zoom ${zoom} is below the floor`);
    assert.ok(zoom <= BEACH_FMV_MAX_ZOOM, `${type} zoom ${zoom} is above the ceiling`);
  }
});

test("an out-of-range framing request is clamped, not honoured", () => {
  // The clamp has to bite on values no authored framing uses, or it is untested
  // by the route above and would not catch a future bad edit.
  const framing = resolveBeachFmvFraming("unknown-scene-type");
  assert.equal(framing.centerX, 0.5);
  assert.equal(framing.centerY, 0.5);
  assert.equal(framing.zoom, 1);
});

/**
 * Every scene the journey can build must have an authored framing.
 *
 * Without this a new scene type silently falls back to dead centre, which does not
 * crash and does not look broken — it just quietly stops the camera moving for
 * that stop, which is the kind of regression nobody notices for months.
 */
test("the camera route covers every scene the journey builds", () => {
  const scenes = buildBeachJourneyScenes(
    beachWeddingJourneyDemoContent,
    beachWeddingJourneyFeatures,
  );
  const built = new Set(scenes.map((scene) => scene.type));

  for (const type of built) {
    assert.ok(
      BEACH_FMV_FRAMED_SCENE_TYPES.includes(type),
      `scene type "${type}" has no authored camera framing`,
    );
  }

  // And the declared scene-type union too, so a type that is currently gated off
  // by content still has a framing waiting for it.
  for (const type of BEACH_JOURNEY_SCENE_TYPES) {
    assert.ok(
      BEACH_FMV_FRAMED_SCENE_TYPES.includes(type),
      `declared scene type "${type}" has no authored camera framing`,
    );
  }
});

test("the camera actually moves between consecutive scenes", () => {
  const scenes = buildBeachJourneyScenes(
    beachWeddingJourneyDemoContent,
    beachWeddingJourneyFeatures,
  );

  let moves = 0;
  for (let index = 1; index < scenes.length; index += 1) {
    const previous = resolveBeachFmvFraming(scenes[index - 1]!.type);
    const current = resolveBeachFmvFraming(scenes[index]!.type);
    const travelled = Math.hypot(
      current.centerX - previous.centerX,
      current.centerY - previous.centerY,
    ) + Math.abs(current.zoom - previous.zoom);
    if (travelled > 0.01) moves += 1;
  }

  // Consecutive gallery scenes share a framing by design — three photographs in a
  // row should not swing the camera — so this is "most", not "all".
  assert.ok(
    moves >= scenes.length - 4,
    `only ${moves} of ${scenes.length - 1} transitions move the camera`,
  );
});

test("the transform samples real pixels rather than upscaling", () => {
  // The point of a 4K source is that even the tightest framing beats the viewport.
  const viewportWidth = 1440;

  for (const type of BEACH_FMV_FRAMED_SCENE_TYPES) {
    const framing = resolveBeachFmvFraming(type);
    const coverage = Math.min(1, BEACH_FMV_WINDOW_SCALE / framing.zoom);
    const sampledWidth = BEACH_FMV_SOURCE_WIDTH * coverage;
    const density = sampledWidth / viewportWidth;

    assert.ok(
      density >= 0.9,
      `${type} samples only ${sampledWidth.toFixed(0)}px for a ${viewportWidth}px viewport (${density.toFixed(2)}x)`,
    );
  }

  // The widest framing should comfortably exceed the viewport.
  const widest = resolveBeachFmvFraming("finale");
  const widestCoverage = Math.min(1, BEACH_FMV_WINDOW_SCALE / widest.zoom);
  assert.ok(BEACH_FMV_SOURCE_WIDTH * widestCoverage > viewportWidth * 1.2);
  assert.ok(BEACH_FMV_SOURCE_HEIGHT * widestCoverage > 900);
});

test("centring the window produces no offset, and moving it produces one", () => {
  const centred = resolveBeachFmvTransform({
    centerX: 0.5,
    centerY: 0.5,
    zoom: 1,
  });
  assert.equal(centred.offsetXPercent, 0);
  assert.equal(centred.offsetYPercent, 0);
  assert.equal(centred.scale, 1);

  // Moving the window right must slide the media left, or the pan runs backwards —
  // a sign error here is invisible in code review and obvious on screen.
  const rightward = resolveBeachFmvTransform({
    centerX: 0.62,
    centerY: 0.5,
    zoom: 1,
  });
  assert.ok(
    rightward.offsetXPercent < 0,
    `panning right must translate the media negatively, got ${rightward.offsetXPercent}`,
  );

  const downward = resolveBeachFmvTransform({
    centerX: 0.5,
    centerY: 0.64,
    zoom: 1,
  });
  assert.ok(downward.offsetYPercent < 0);
});

test("offsets are measured against the media, not the container", () => {
  // A quarter-window shift at the base scale is 25% of the media's own width.
  // Computing it against the container would give 0.25 * 0.72 = 18%, and the pan
  // would fall short of its framing by a factor of the window scale.
  const framing = { centerX: 0.5 + BEACH_FMV_WINDOW_SCALE / 4, centerY: 0.5, zoom: 1 };
  const { offsetXPercent } = resolveBeachFmvTransform(framing);

  assert.ok(
    Math.abs(offsetXPercent + 25) < 1e-6,
    `expected -25% of the media, got ${offsetXPercent}%`,
  );
});

test("a zoomed framing scales and offsets consistently", () => {
  const framing = resolveBeachFmvFraming("gallery-photo");
  const transform = resolveBeachFmvTransform(framing);

  assert.equal(transform.scale, framing.zoom);
  assert.ok(transform.scale > 1, "the gallery framing pushes in");

  // Zooming in shrinks the window, so the same source-space offset becomes a
  // larger fraction of the media. Verify by comparing against the same centre at
  // base zoom.
  const base = resolveBeachFmvTransform({ ...framing, zoom: 1 });
  if (Math.abs(framing.centerX - 0.5) > 1e-6) {
    assert.ok(
      Math.abs(transform.offsetXPercent) > Math.abs(base.offsetXPercent),
      "a tighter window must express the same shift as a larger percentage",
    );
  }
});

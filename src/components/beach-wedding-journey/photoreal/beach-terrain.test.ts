import assert from "node:assert/strict";
import { test } from "node:test";

import {
  ClampToEdgeWrapping,
  NoColorSpace,
  RepeatWrapping,
  SRGBColorSpace,
  Texture,
} from "three";

import {
  BEACH_WATER_LEVEL_Y,
  shorelineOffsetAt,
  waterDepthAt,
} from "@/components/beach-wedding-journey/beach-shoreline";
import type { BeachWorldQualityTier } from "@/components/beach-wedding-journey/beach-world-data";
import {
  BEACH_SAND_ANISOTROPY,
  BEACH_SAND_TILE_METRES,
  BEACH_SAND_X_MAX_METRES,
  BEACH_SAND_X_MIN_METRES,
  BEACH_SAND_Z_MAX_METRES,
  BEACH_SAND_Z_MIN_METRES,
  BEACH_WET_BAND_START_V,
  SHORE_UV_CHANNEL,
  TILED_UV_CHANNEL,
  beachDuneSwellAt,
  beachGroundHeightAt,
  beachShoreBandV,
  configureBeachSandTextures,
  createBeachSandGeometry,
} from "@/components/beach-wedding-journey/photoreal/beach-terrain";
import {
  BEACH_ENVIRONMENT_ROTATION_Y_DEGREES,
  BEACH_SUN_DIRECTION,
  BEACH_SUN_WORLD_DIRECTION,
} from "@/components/beach-wedding-journey/photoreal/beach-lighting";

/**
 * The rail the camera walks, from `resolveScenePose` in
 * `src/data/beach-wedding-journey.ts`: z 7 with a 0.9m drift, eye at 1.62m.
 */
const RAIL_Z_VALUES = [7, 7.9] as const;
const RAIL_EYE_HEIGHT_METRES = 1.62;

/** The height above which sand would read as a bank beside the walker. */
const RAIL_CLEARANCE_LIMIT_METRES = 0.5;

/**
 * The x range the journey's cameras occupy, from `resolveScenePose` in
 * `src/data/beach-wedding-journey.ts`: `x = -8 + ordinal * 8.5` over 15 scenes.
 * Written as literals on purpose — the point of the extent test is that the
 * sand covers *this requirement*, so it must not be derived from the extent
 * constants it is checking.
 */
const JOURNEY_CAMERA_X_MIN_METRES = -8;
const JOURNEY_CAMERA_X_MAX_METRES = 111;

/** Sand has to run past the last camera, or the walker sees the mesh end. */
const REQUIRED_X_MARGIN_METRES = 4;

/** Along-shore run needed for the beach to read as a coast, not a sandbox. */
const REQUIRED_SHORE_SPAN_METRES = 130;

/** Coarsest acceptable grain tile: past this the 1024px maps read as mush. */
const COARSEST_SAND_TILE_METRES = 5;

/** Finest acceptable grain tile: below this the tiling pattern becomes visible. */
const FINEST_SAND_TILE_METRES = 1.5;

/** Grazing-angle minimum; 1 (the three default) visibly blurs the foreshore. */
const REQUIRED_SAND_ANISOTROPY = 4;

const TIERS: readonly BeachWorldQualityTier[] = ["desktop", "mobile", "reduced"];

const EXPECTED_VERTEX_COUNTS: Record<BeachWorldQualityTier, number> = {
  desktop: 193 * 97,
  mobile: 129 * 65,
  reduced: 81 * 41,
};

test("the shoreline constants the geometry reads are pinned", () => {
  assert.equal(
    BEACH_WATER_LEVEL_Y,
    0,
    "the sand meets the water plane at y 0; moving it desyncs terrain and water",
  );
  assert.equal(
    waterDepthAt(0, shorelineOffsetAt(0) - 26),
    3.2,
    "the depth ramp must still reach 3.2m at 26m seaward",
  );
  assert.equal(
    BEACH_WET_BAND_START_V,
    0.62,
    "must match WET_BAND_START_V in scripts/prepare-beach-photoreal-assets.mjs",
  );
});

test("each quality tier gets the vertex count its subdivision implies", () => {
  for (const tier of TIERS) {
    const geometry = createBeachSandGeometry(tier);
    assert.equal(
      geometry.getAttribute("position").count,
      EXPECTED_VERTEX_COUNTS[tier],
      `${tier} sand subdivision changed`,
    );
    geometry.dispose();
  }

  assert.ok(
    EXPECTED_VERTEX_COUNTS.desktop > EXPECTED_VERTEX_COUNTS.mobile
      && EXPECTED_VERTEX_COUNTS.mobile > EXPECTED_VERTEX_COUNTS.reduced,
    "tiers must be strictly ordered or the reduction saves nothing",
  );
});

test("the sand is finite and actually covers the walked journey", () => {
  const geometry = createBeachSandGeometry("reduced");
  const positions = geometry.getAttribute("position");

  let observedXMin = Infinity;
  let observedXMax = -Infinity;

  for (let index = 0; index < positions.count; index += 1) {
    const x = positions.getX(index);
    const y = positions.getY(index);
    const z = positions.getZ(index);

    assert.ok(
      Number.isFinite(x) && Number.isFinite(y) && Number.isFinite(z),
      `vertex ${index} is not finite: ${x}, ${y}, ${z}`,
    );
    assert.ok(
      x >= BEACH_SAND_X_MIN_METRES - 1e-3
        && x <= BEACH_SAND_X_MAX_METRES + 1e-3,
      `vertex ${index} x ${x} escaped the extent`,
    );
    assert.ok(
      z >= BEACH_SAND_Z_MIN_METRES - 1e-3
        && z <= BEACH_SAND_Z_MAX_METRES + 1e-3,
      `vertex ${index} z ${z} escaped the extent`,
    );

    observedXMin = Math.min(observedXMin, x);
    observedXMax = Math.max(observedXMax, x);
  }

  // Measured off the built geometry against the journey's own literals, not
  // against the extent constants: a mesh that agrees with a shrunken extent is
  // still a mesh that ends inside the frame.
  assert.ok(
    observedXMin <= JOURNEY_CAMERA_X_MIN_METRES - REQUIRED_X_MARGIN_METRES,
    `the sand starts at x ${observedXMin}, inside the ${REQUIRED_X_MARGIN_METRES}m `
      + `margin before the first camera at x ${JOURNEY_CAMERA_X_MIN_METRES}`,
  );
  assert.ok(
    observedXMax >= JOURNEY_CAMERA_X_MAX_METRES + REQUIRED_X_MARGIN_METRES,
    `the sand ends at x ${observedXMax}, inside the ${REQUIRED_X_MARGIN_METRES}m `
      + `margin past the last camera at x ${JOURNEY_CAMERA_X_MAX_METRES}`,
  );
  assert.ok(
    observedXMax - observedXMin >= REQUIRED_SHORE_SPAN_METRES,
    `the beach runs only ${(observedXMax - observedXMin).toFixed(2)}m along shore, `
      + `under the ${REQUIRED_SHORE_SPAN_METRES}m needed to read as a coast`,
  );

  geometry.dispose();
});

test("the sand meets the water plane exactly at the waterline", () => {
  for (let x = BEACH_SAND_X_MIN_METRES; x <= BEACH_SAND_X_MAX_METRES; x += 0.5) {
    const waterline = shorelineOffsetAt(x);
    assert.equal(
      beachGroundHeightAt(x, waterline),
      BEACH_WATER_LEVEL_Y,
      `sand at the waterline for x ${x} must sit at the water level`,
    );

    const justSeaward = beachGroundHeightAt(x, waterline - 0.05);
    const justLandward = beachGroundHeightAt(x, waterline + 0.05);
    assert.ok(
      justSeaward < BEACH_WATER_LEVEL_Y,
      `sand 5cm seaward of x ${x} must dip below the water, got ${justSeaward}`,
    );
    assert.ok(
      justLandward > BEACH_WATER_LEVEL_Y,
      `sand 5cm landward of x ${x} must rise above the water, got ${justLandward}`,
    );
    assert.ok(
      Math.abs(justSeaward) < 0.05 && Math.abs(justLandward) < 0.05,
      `the seam at x ${x} must be continuous, not a step`,
    );
  }
});

test("the swell stays clear of the walked rail", () => {
  let peak = 0;

  for (let x = BEACH_SAND_X_MIN_METRES; x <= BEACH_SAND_X_MAX_METRES; x += 0.05) {
    for (const z of RAIL_Z_VALUES) {
      const height = beachGroundHeightAt(x, z);
      if (height > peak) peak = height;
    }
  }

  assert.ok(
    peak < RAIL_CLEARANCE_LIMIT_METRES,
    `sand under the rail peaks at ${peak.toFixed(4)}m, above the ${RAIL_CLEARANCE_LIMIT_METRES}m limit`,
  );
  assert.ok(
    peak < RAIL_EYE_HEIGHT_METRES,
    `sand under the rail would swallow the camera at ${peak.toFixed(4)}m`,
  );
  assert.ok(
    peak > 0.05,
    `a foreshore that flat reads as a table; peak was ${peak.toFixed(4)}m`,
  );
});

test("the swell is zero at the waterline and rises landward", () => {
  assert.equal(beachDuneSwellAt(12, 0), 0, "no rise at the waterline");
  assert.equal(beachDuneSwellAt(12, -4), 0, "no rise seaward of the waterline");

  for (const x of [-20, 0, 17, 41, 63, 100]) {
    assert.ok(
      beachDuneSwellAt(x, 30) > beachDuneSwellAt(x, 8),
      `the backshore at x ${x} must sit above the foreshore`,
    );
  }
});

test("the dunes vary along shore instead of reading as one ridge", () => {
  const crests = [0, 10, 20, 30, 41, 55, 70].map((x) =>
    beachDuneSwellAt(x, 30),
  );
  const spread = Math.max(...crests) - Math.min(...crests);

  assert.ok(
    spread > 0.5,
    `an extruded ridge; crest spread along shore was only ${spread.toFixed(3)}m`,
  );
});

test("the sand carries both a tiled and a shore-relative UV set", () => {
  const geometry = createBeachSandGeometry("reduced");
  const tiled = geometry.getAttribute("uv");
  const shore = geometry.getAttribute("uv1");
  const positions = geometry.getAttribute("position");

  assert.ok(tiled, "the tiled detail UV set must exist");
  assert.ok(shore, "the shore-relative UV set must exist");
  assert.equal(tiled.count, positions.count);
  assert.equal(shore.count, positions.count);

  const spanX = BEACH_SAND_X_MAX_METRES - BEACH_SAND_X_MIN_METRES;
  const spanZ = BEACH_SAND_Z_MAX_METRES - BEACH_SAND_Z_MIN_METRES;

  let tiledVMin = Infinity;
  let tiledVMax = -Infinity;
  let shoreVMin = Infinity;
  let shoreVMax = -Infinity;

  for (let index = 0; index < positions.count; index += 1) {
    tiledVMin = Math.min(tiledVMin, tiled.getY(index));
    tiledVMax = Math.max(tiledVMax, tiled.getY(index));
    shoreVMin = Math.min(shoreVMin, shore.getY(index));
    shoreVMax = Math.max(shoreVMax, shore.getY(index));
  }

  // The tile size itself is the requirement, so it is checked against the
  // acceptable window rather than inferred from the UVs it generates.
  assert.ok(
    BEACH_SAND_TILE_METRES >= FINEST_SAND_TILE_METRES
      && BEACH_SAND_TILE_METRES <= COARSEST_SAND_TILE_METRES,
    `the grain tile is ${BEACH_SAND_TILE_METRES}m, outside the `
      + `${FINEST_SAND_TILE_METRES}..${COARSEST_SAND_TILE_METRES}m window: below `
      + "it the repeat patterns, above it the 1024px maps read as mush",
  );

  // The tiled set must actually tile, or the 1024px maps stretch over 142m.
  // Compared against the coarsest acceptable tile, not against
  // `BEACH_SAND_TILE_METRES` — both sides of that comparison would scale
  // together and a coarsened tile would pass.
  assert.ok(
    tiledVMax - tiledVMin > spanZ / COARSEST_SAND_TILE_METRES - 1,
    `the detail UV does not tile: V spans only ${(tiledVMax - tiledVMin).toFixed(2)}`,
  );
  assert.ok(
    tiledVMax - tiledVMin > 2,
    "the detail UV must repeat more than twice across the beach",
  );
  assert.ok(
    spanX / COARSEST_SAND_TILE_METRES > 2,
    "the extent must be wide enough for the detail UV to repeat",
  );

  // The shore-relative set must NOT tile: its V carries the baked damp band,
  // and repeating it would stripe a wet band every few metres.
  assert.ok(
    shoreVMin >= 0 && shoreVMax <= 1,
    `the shore UV must stay in 0..1, got ${shoreVMin.toFixed(3)}..${shoreVMax.toFixed(3)}`,
  );
  assert.ok(
    shoreVMax > 0.99,
    "the shore UV must reach the fully wet row of the baked band",
  );
  assert.ok(
    shoreVMin < BEACH_WET_BAND_START_V,
    "the shore UV must reach the dry part of the tile inland",
  );

  geometry.dispose();
});

test("the baked damp band lands at the waterline, once", () => {
  for (const x of [-20, 0, 13.5, 37, 60, 100]) {
    const waterline = shorelineOffsetAt(x);

    assert.ok(
      beachShoreBandV(x, waterline) > BEACH_WET_BAND_START_V,
      `the sand at the waterline for x ${x} must be inside the damp band`,
    );
    assert.equal(
      beachShoreBandV(x, waterline - 20),
      1,
      `submerged sand at x ${x} must read the fully wet row`,
    );
    assert.ok(
      beachShoreBandV(x, waterline + 6) < BEACH_WET_BAND_START_V,
      `the dry beach at x ${x} must sit below the band start`,
    );

    // Monotonic seaward: the band may not appear twice along the cross-shore.
    let previous = -Infinity;
    for (let z = waterline + 20; z >= waterline - 20; z -= 0.25) {
      const v = beachShoreBandV(x, z);
      assert.ok(
        v >= previous - 1e-9,
        `the band reverses at x ${x}, z ${z}: ${v} after ${previous}`,
      );
      previous = v;
    }
  }
});

test("the sun direction matches the measured HDRI sun", () => {
  const [x, y, z] = BEACH_SUN_DIRECTION;

  assert.ok(
    Math.abs(Math.hypot(x, y, z) - 1) < 1e-4,
    "the sun direction must be unit length",
  );
  assert.deepEqual(
    [x, y, z],
    [0.6346, 0.2221, 0.7402],
    "measured from sky.hdr: elevation +12.832deg, azimuth +49.395deg",
  );

  const elevationDegrees = (Math.asin(y) * 180) / Math.PI;
  // A sunrise sun has to be high enough to show a disk in frame but low enough
  // to still rake the sand. The coastal HDRI this replaced sat at 1.652deg,
  // which read as dim golden hour with no visible sun at all.
  assert.ok(
    elevationDegrees > 8 && elevationDegrees < 20,
    `a bright sunrise needs a sun clear of the horizon, got ${elevationDegrees.toFixed(3)}deg`,
  );
});

test("the world sun direction is the map sun rotated with the environment", () => {
  const [mx, my, mz] = BEACH_SUN_DIRECTION;
  const theta = (BEACH_ENVIRONMENT_ROTATION_Y_DEGREES * Math.PI) / 180;
  const mapAzimuth = Math.atan2(mz, mx);
  const horizontal = Math.hypot(mx, mz);
  const worldAzimuth = mapAzimuth - theta;

  const expected = [
    horizontal * Math.cos(worldAzimuth),
    my,
    horizontal * Math.sin(worldAzimuth),
  ];

  for (let axis = 0; axis < 3; axis += 1) {
    assert.ok(
      Math.abs(BEACH_SUN_WORLD_DIRECTION[axis]! - expected[axis]!) < 1e-3,
      `rotating the sky without rotating the light desyncs the specular highlight: axis ${axis} is ${BEACH_SUN_WORLD_DIRECTION[axis]}, expected ${expected[axis]}`,
    );
  }

  assert.ok(
    Math.abs(Math.hypot(...BEACH_SUN_WORLD_DIRECTION) - 1) < 1e-3,
    "the world sun direction must stay unit length",
  );

  // `table_mountain_1_puresky` has no horizon geography, so unlike the coastal
  // HDRI it replaced there is no "smooth open-water sector" the rotation has to
  // aim at — every azimuth is equally usable. What the rotation must now buy is
  // a *visible* sun: the camera walks the rail looking down-shore at
  // -13.74deg, and the horizontal half-FOV is 12.16deg on the authored 390x844
  // mobile view, so the sun has to land inside that or "bright sunrise with a
  // visible sun" is unmet on a phone.
  const CAMERA_LOOK_AZIMUTH_DEGREES = -13.74;
  const MOBILE_HORIZONTAL_HALF_FOV_DEGREES = 12.16;
  const worldAzimuthDegrees = (Math.atan2(
    BEACH_SUN_WORLD_DIRECTION[2]!,
    BEACH_SUN_WORLD_DIRECTION[0]!,
  ) * 180) / Math.PI;
  const offAxisDegrees = Math.abs(
    worldAzimuthDegrees - CAMERA_LOOK_AZIMUTH_DEGREES,
  );

  assert.ok(
    offAxisDegrees < MOBILE_HORIZONTAL_HALF_FOV_DEGREES,
    `the sun sits ${offAxisDegrees.toFixed(2)}deg off the view axis, outside the ${MOBILE_HORIZONTAL_HALF_FOV_DEGREES}deg mobile half-FOV — it would never appear on screen`,
  );
});

// The channel split is the whole point of carrying two UV sets: the band-free
// normal map tiles, the two banded maps read the shore-relative set. Asserted
// on real Texture objects rather than on source text so a swapped channel or a
// dropped clamp actually fails.
test("the banded maps read the clamped shore UV set and only the normal map tiles", () => {
  const color = new Texture();
  const normal = new Texture();
  const arm = new Texture();

  configureBeachSandTextures({ arm, color, normal });

  assert.equal(color.colorSpace, SRGBColorSpace, "the albedo is authored sRGB");
  assert.equal(normal.colorSpace, NoColorSpace, "normals are raw vectors");
  assert.equal(arm.colorSpace, NoColorSpace, "ARM packs raw scalars");

  assert.equal(
    normal.channel,
    TILED_UV_CHANNEL,
    "the normal map has no baked band, so it must read the tiled UV set",
  );
  assert.equal(normal.wrapS, RepeatWrapping, "grain must tile along shore");
  assert.equal(normal.wrapT, RepeatWrapping, "grain must tile cross-shore");

  for (const [name, banded] of [
    ["colour", color],
    ["ARM", arm],
  ] as const) {
    assert.equal(
      banded.channel,
      SHORE_UV_CHANNEL,
      `the ${name} map carries the baked damp band; reading the tiled set would repeat the waterline every ${BEACH_SAND_TILE_METRES}m`,
    );
    assert.equal(
      banded.wrapS,
      RepeatWrapping,
      `the band runs along V only, so the ${name} map may still repeat U`,
    );
    assert.equal(
      banded.wrapT,
      ClampToEdgeWrapping,
      `wrapping V would stripe the beach with a second damp band from the ${name} map`,
    );
  }

  assert.ok(
    BEACH_SAND_ANISOTROPY >= REQUIRED_SAND_ANISOTROPY,
    `sand is walked past at a grazing angle; anisotropy ${BEACH_SAND_ANISOTROPY} `
      + `is below the ${REQUIRED_SAND_ANISOTROPY} the foreshore needs to stay sharp`,
  );

  for (const [name, texture] of [
    ["colour", color],
    ["normal", normal],
    ["ARM", arm],
  ] as const) {
    assert.equal(
      texture.anisotropy,
      BEACH_SAND_ANISOTROPY,
      `sand is seen at a grazing angle; the ${name} map needs anisotropic filtering`,
    );
    // `needsUpdate` is a write-only accessor in three; it bumps `version`,
    // which is what the renderer actually reads to re-upload the texture.
    assert.ok(
      texture.version > 0,
      `the ${name} map must be flagged so the new wrap modes reach the GPU`,
    );
  }
});

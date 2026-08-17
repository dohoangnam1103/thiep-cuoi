import assert from "node:assert/strict";
import { test } from "node:test";

import { MeshStandardMaterial } from "three";

import {
  beachWeddingJourneyDemoContent,
  beachWeddingJourneyFeatures,
  buildBeachJourneyScenes,
  type BeachJourneyScene,
} from "@/data/beach-wedding-journey";
import { getBeachFrameGeometry } from "@/components/beach-wedding-journey/beach-frame-geometry";
import { getBeachWorldDensity } from "@/components/beach-wedding-journey/beach-world-data";
import { BEACH_PHOTOREAL_ASSETS } from "@/components/beach-wedding-journey/photoreal/beach-asset-manifest";
import {
  BEACH_FLOWER_BLOOMS_PER_CLUSTER,
  BEACH_FLOWER_CLUSTER_RADIUS_METRES,
  BEACH_FLOWER_HEIGHT_METRES,
  BEACH_FLOWER_WIND_BASE,
  BEACH_FLOWER_WIND_CUE_GAIN,
  BEACH_FLOWER_WIND_HEIGHT,
  BEACH_POST_BASE_RADIUS_METRES,
  BEACH_POST_HEIGHT_METRES,
  BEACH_POST_LINE_MARGIN_METRES,
  BEACH_POST_TOP_RADIUS_METRES,
  BEACH_PROP_ASSETS,
  BEACH_PROP_ASSET_ERROR_MARKER,
  BEACH_TABLE_HEIGHT_METRES,
  BEACH_TABLE_HEM_FLARE_METRES,
  BEACH_TABLE_LANDWARD_Z_MAX_METRES,
  BEACH_TABLE_LANDWARD_Z_MIN_METRES,
  BEACH_TABLE_RADIUS_METRES,
  BEACH_TABLE_SEAWARD_Z_MAX_METRES,
  BEACH_TABLE_SEAWARD_Z_MIN_METRES,
  BEACH_TABLE_X_MAX_METRES,
  BEACH_TABLE_X_MIN_METRES,
  attachBeachWind,
  createBeachFlowerGeometry,
  createBeachPostGeometry,
  createBeachScatter,
  createBeachTableGeometry,
  driveBeachWind,
  groupBeachPropTextures,
  isBeachPropAssetError,
  resolveBeachPostPlacements,
  resolveBeachTablePlacements,
} from "@/components/beach-wedding-journey/photoreal/beach-props";
import { beachGroundHeightAt } from "@/components/beach-wedding-journey/photoreal/beach-terrain";

/**
 * The rail the camera walks, from `resolveScenePose` in
 * `src/data/beach-wedding-journey.ts`: z 7 with a 0.9m drift landward. Restated
 * as literals on purpose — the point of the table band test is that the tables
 * clear *this* rail, so it must not be derived from the band constants it is
 * checking.
 */
const RAIL_Z_MIN_METRES = 7;
const RAIL_Z_MAX_METRES = 7.9;

/** The x range the journey's cameras occupy: `x = -8 + ordinal * 8.5`, 15 scenes. */
const JOURNEY_CAMERA_X_MIN_METRES = -8;
const JOURNEY_CAMERA_X_MAX_METRES = 111;

/** Metres the shoreline curves alongshore, from `SHORE_CURVE_AMPLITUDE_METRES`. */
const SHORE_CURVE_AMPLITUDE_METRES = 2.4;

/** The prop map ids the props consume: driftwood plus two frame sets, ×3 maps. */
const EXPECTED_PROP_ASSET_IDS = [
  "driftwoodColor",
  "driftwoodNormal",
  "driftwoodArm",
  "frame01Color",
  "frame01Normal",
  "frame01Arm",
  "frame02Color",
  "frame02Normal",
  "frame02Arm",
] as const;

function demoScenes(): readonly BeachJourneyScene[] {
  return buildBeachJourneyScenes(
    beachWeddingJourneyDemoContent,
    beachWeddingJourneyFeatures,
  );
}

function positionBounds(geometry: {
  getAttribute: (name: string) => {
    count: number;
    getX: (index: number) => number;
    getY: (index: number) => number;
    getZ: (index: number) => number;
  } | undefined;
}) {
  const position = geometry.getAttribute("position");
  assert.ok(position, "geometry has a position attribute");

  let maxX = -Infinity;
  let maxY = -Infinity;
  let maxZ = -Infinity;
  let minX = Infinity;
  let minY = Infinity;
  let minZ = Infinity;
  for (let index = 0; index < position.count; index += 1) {
    maxX = Math.max(maxX, position.getX(index));
    maxY = Math.max(maxY, position.getY(index));
    maxZ = Math.max(maxZ, position.getZ(index));
    minX = Math.min(minX, position.getX(index));
    minY = Math.min(minY, position.getY(index));
    minZ = Math.min(minZ, position.getZ(index));
  }
  return { maxX, maxY, maxZ, minX, minY, minZ, vertexCount: position.count };
}

// ---------------------------------------------------------------------------
// Wind
// ---------------------------------------------------------------------------

test("the beach wind program never collides with the forest's", () => {
  const material = new MeshStandardMaterial();
  attachBeachWind(material, BEACH_FLOWER_WIND_HEIGHT);

  assert.equal(typeof material.customProgramCacheKey, "function");
  const key = material.customProgramCacheKey!();
  assert.equal(key, "beach-wind");
  assert.notEqual(key, "forest-wind");
  material.dispose();
});

test("the wind shader reads the per-instance phase and ramps by height", () => {
  const material = new MeshStandardMaterial();
  const uniforms = attachBeachWind(material, BEACH_FLOWER_WIND_HEIGHT);

  assert.equal(uniforms.uWindHeight.value, BEACH_FLOWER_WIND_HEIGHT);
  assert.ok(material.onBeforeCompile);

  const shader = {
    fragmentShader: "",
    uniforms: {} as Record<string, unknown>,
    vertexShader: "#include <common>\nvoid main() {\n#include <begin_vertex>\n}",
  };
  // `onBeforeCompile`'s three.js signature carries a renderer it does not use
  // here, so the cast keeps the call site honest without inventing a renderer.
  (material.onBeforeCompile as unknown as (s: typeof shader) => void)(shader);

  assert.ok(shader.vertexShader.includes("attribute float instanceWindPhase"));
  // Squared, so a blade's base stays planted while its tip travels.
  assert.ok(shader.vertexShader.includes("beachWindRamp *= beachWindRamp"));
  assert.ok(shader.vertexShader.includes("transformed.x +="));
  assert.ok(shader.vertexShader.includes("transformed.z +="));
  assert.equal(shader.uniforms.uTime, uniforms.uTime);
  assert.equal(shader.uniforms.uWindStrength, uniforms.uWindStrength);
  assert.equal(shader.uniforms.uWindHeight, uniforms.uWindHeight);
  material.dispose();
});

test("reduced motion freezes both the wind clock and its strength", () => {
  const material = new MeshStandardMaterial();
  const uniforms = attachBeachWind(material, BEACH_FLOWER_WIND_HEIGHT);

  driveBeachWind(uniforms, 41.5, 0.4, false);
  assert.equal(uniforms.uTime.value, 41.5);
  assert.equal(uniforms.uWindStrength.value, 0.4);

  driveBeachWind(uniforms, 62.25, 0.4, true);
  // Both: a still-advancing clock would resume the sway mid-phase.
  assert.equal(uniforms.uTime.value, 0);
  assert.equal(uniforms.uWindStrength.value, 0);
  material.dispose();
});

test("a missing wind handle is a no-op rather than a crash", () => {
  assert.doesNotThrow(() => driveBeachWind(null, 3, 1, false));
});

test("the flower wind strength stays gentle across the whole cue range", () => {
  // The cue is normalised 0..1 by `beach-cue-state.ts`.
  const still = BEACH_FLOWER_WIND_BASE + 0 * BEACH_FLOWER_WIND_CUE_GAIN;
  const gusting = BEACH_FLOWER_WIND_BASE + 1 * BEACH_FLOWER_WIND_CUE_GAIN;

  assert.ok(still > 0, "a centrepiece is never perfectly still");
  assert.ok(gusting > still);
  // Strength multiplies the wind height in the shader, so a value near 1 would
  // lay the blooms flat on the cloth. Cut stems in a vase travel less than the
  // rooted marram this replaced, so the ceiling is tighter.
  assert.ok(gusting < 0.08);
});

// ---------------------------------------------------------------------------
// Prop assets
// ---------------------------------------------------------------------------

test("the prop maps are exactly the wood sets the props consume", () => {
  assert.deepEqual(
    BEACH_PROP_ASSETS.map(({ id }) => id),
    [...EXPECTED_PROP_ASSET_IDS],
  );

  for (const asset of BEACH_PROP_ASSETS) {
    const manifest = BEACH_PHOTOREAL_ASSETS.find(({ id }) => id === asset.id);
    assert.ok(manifest, `${asset.id} is in the manifest`);
    // Props must never block the world: a missing wood map degrades to flat
    // colour, it does not hold the walk at the threshold.
    assert.equal(manifest.group, "props");
    assert.equal(manifest.blocking, false);
  }
});

test("a prop map failure is swallowed and a scene-graph bug is not", () => {
  const assetFailure = new Error(
    `[${BEACH_PROP_ASSET_ERROR_MARKER}] /chungdoi/labs/beach-wedding-journey/driftwood-color.webp: 404`,
  );

  assert.equal(isBeachPropAssetError(assetFailure), true);
  assert.equal(
    isBeachPropAssetError(new Error("Cannot read properties of null")),
    false,
  );
  assert.equal(isBeachPropAssetError(new TypeError("mesh is not a function")), false);
  assert.equal(isBeachPropAssetError("pier-planks-color.webp"), false);
  assert.equal(isBeachPropAssetError(null), false);
  assert.equal(isBeachPropAssetError(undefined), false);
});

test("prop textures group into the sets each prop consumes", () => {
  const textures = BEACH_PROP_ASSETS.map(({ id }) => ({ name: id }));
  const grouped = groupBeachPropTextures(
    textures as unknown as Parameters<typeof groupBeachPropTextures>[0],
  );

  assert.equal(grouped.frames.length, 2);
  assert.deepEqual(
    [
      grouped.driftwood.color.name,
      grouped.driftwood.normal.name,
      grouped.driftwood.arm.name,
      grouped.frames[0].color.name,
      grouped.frames[0].normal.name,
      grouped.frames[0].arm.name,
      grouped.frames[1].color.name,
      grouped.frames[1].normal.name,
      grouped.frames[1].arm.name,
    ],
    [
      "driftwoodColor",
      "driftwoodNormal",
      "driftwoodArm",
      "frame01Color",
      "frame01Normal",
      "frame01Arm",
      "frame02Color",
      "frame02Normal",
      "frame02Arm",
    ],
  );
});

test("a short texture list is rejected rather than silently mis-grouped", () => {
  assert.throws(
    () => groupBeachPropTextures(
      [{ name: "driftwoodColor" }] as unknown as Parameters<
        typeof groupBeachPropTextures
      >[0],
    ),
    /Expected 9 beach prop textures, got 1/,
  );
});

// ---------------------------------------------------------------------------
// Scatter
// ---------------------------------------------------------------------------

test("scatter repeats exactly on every mount", () => {
  const first = createBeachScatter(0x5eab01);
  const second = createBeachScatter(0x5eab01);
  const firstRun = Array.from({ length: 64 }, () => first());

  assert.deepEqual(firstRun, Array.from({ length: 64 }, () => second()));
  for (const value of firstRun) {
    assert.ok(value >= 0 && value < 1, `${value} is a unit fraction`);
  }
  // A generator that returned a constant would also be "deterministic".
  assert.ok(new Set(firstRun).size > 60);
});

test("different seeds scatter differently", () => {
  const posts = createBeachScatter(0x5eab01);
  const grass = createBeachScatter(0x9d0e17);
  const postValues = Array.from({ length: 16 }, () => posts());
  const grassValues = Array.from({ length: 16 }, () => grass());

  assert.notDeepEqual(postValues, grassValues);
});

test("the placements themselves are stable between calls", () => {
  const scenes = demoScenes();

  assert.deepEqual(
    resolveBeachPostPlacements(scenes, 18),
    resolveBeachPostPlacements(scenes, 18),
  );
  assert.deepEqual(
    resolveBeachTablePlacements(12),
    resolveBeachTablePlacements(12),
  );
});

// ---------------------------------------------------------------------------
// Posts
// ---------------------------------------------------------------------------

test("the post line spans the frames with a margin at each end", () => {
  const scenes = demoScenes();
  const placements = resolveBeachPostPlacements(scenes, 24);
  const frameXs = scenes.map((scene) => getBeachFrameGeometry(scene).position[0]);
  const minFrameX = Math.min(...frameXs);
  const maxFrameX = Math.max(...frameXs);

  assert.equal(placements.length, 24);
  const postXs = placements.map(({ position }) => position[0]);
  assert.ok(Math.min(...postXs) < minFrameX, "the line starts before the first frame");
  assert.ok(Math.max(...postXs) > maxFrameX, "the line runs past the last frame");
  assert.ok(Math.min(...postXs) >= minFrameX - BEACH_POST_LINE_MARGIN_METRES);
  assert.ok(Math.max(...postXs) <= maxFrameX + BEACH_POST_LINE_MARGIN_METRES);

  // No post lands exactly on either end of the span: a terminated line reads as
  // a fence, not as a shore that continues past the walk.
  assert.ok(Math.min(...postXs) > minFrameX - BEACH_POST_LINE_MARGIN_METRES);
  assert.ok(Math.max(...postXs) < maxFrameX + BEACH_POST_LINE_MARGIN_METRES);

  // Covering the walk means covering the camera's x range too.
  assert.ok(Math.min(...postXs) < JOURNEY_CAMERA_X_MIN_METRES + 12);
  assert.ok(Math.max(...postXs) > JOURNEY_CAMERA_X_MAX_METRES - 12);
});

test("posts stand on the sand, not floating above or buried in it", () => {
  for (const placement of resolveBeachPostPlacements(demoScenes(), 24)) {
    const [x, y, z] = placement.position;
    assert.equal(y, beachGroundHeightAt(x, z));
    assert.ok(placement.scaleY > 0);
    // A lean, not a fall: driftwood tilts a few degrees, it does not lie down.
    assert.ok(Math.abs(placement.leanX) < 0.12);
    assert.ok(Math.abs(placement.leanZ) < 0.12);
  }
});

test("asking for no posts leaves the shore bare instead of throwing", () => {
  assert.deepEqual(resolveBeachPostPlacements(demoScenes(), 0), []);
  assert.deepEqual(resolveBeachPostPlacements(demoScenes(), -4), []);
  assert.deepEqual(resolveBeachPostPlacements([], 12), []);
});

test("a post is pivoted at its base so the instance scale reads as height", () => {
  const geometry = createBeachPostGeometry();
  const box = positionBounds(geometry);

  assert.ok(Math.abs(box.minY) < 1e-6, "base sits on the pivot");
  assert.ok(Math.abs(box.maxY - 1) < 1e-6, "one unit tall before scaling");
  // Tapered: driftwood is thicker where it enters the sand.
  assert.ok(BEACH_POST_TOP_RADIUS_METRES < BEACH_POST_BASE_RADIUS_METRES);
  assert.ok(BEACH_POST_HEIGHT_METRES > 1.8, "a post clears a standing guest's eye");

  // The ARM map reads `uv1`, so both channels must carry the same repeat.
  const uv = geometry.getAttribute("uv");
  const uv1 = geometry.getAttribute("uv1");
  assert.ok(uv && uv1);
  assert.equal(uv, uv1);
  let maxV = 0;
  for (let index = 0; index < uv.count; index += 1) {
    maxV = Math.max(maxV, uv.getY(index));
  }
  assert.ok(maxV > 1, "grain repeats up the post instead of stretching once");
  geometry.dispose();
});

// ---------------------------------------------------------------------------
// Reception tables
// ---------------------------------------------------------------------------

test("tables never stand on the walk, in a frame, or in the sea", () => {
  const placements = resolveBeachTablePlacements(18);
  const scenes = demoScenes();
  const frameZs = scenes.map((scene) => getBeachFrameGeometry(scene).position[2]);
  const minFrameZ = Math.min(...frameZs);

  assert.equal(placements.length, 18);
  // The seaward band clears the frames, and the landward band clears the rail.
  assert.ok(BEACH_TABLE_SEAWARD_Z_MAX_METRES < minFrameZ);
  assert.ok(BEACH_TABLE_LANDWARD_Z_MIN_METRES > RAIL_Z_MAX_METRES);

  for (const { clothTint, flowerTint, position, rotationY, scale, windPhase } of placements) {
    const [x, y, z] = position;
    const seaward = z <= BEACH_TABLE_SEAWARD_Z_MAX_METRES;

    if (seaward) {
      assert.ok(z >= BEACH_TABLE_SEAWARD_Z_MIN_METRES, `table at z ${z} is on sand`);
      assert.ok(z < RAIL_Z_MIN_METRES, "seaward tables sit in front of the walk");
    } else {
      assert.ok(z >= BEACH_TABLE_LANDWARD_Z_MIN_METRES);
      assert.ok(z <= BEACH_TABLE_LANDWARD_Z_MAX_METRES);
      assert.ok(z > RAIL_Z_MAX_METRES, "landward tables sit behind the walk");
    }

    // Dry sand only: the waterline swings +/-2.4m about z 0, and ground height
    // above the still water level is what says a point is not submerged.
    assert.ok(z > SHORE_CURVE_AMPLITUDE_METRES, `table at z ${z} is out of the sea`);
    assert.ok(y > 0, `table at z ${z} stands above the waterline`);

    assert.ok(x >= BEACH_TABLE_X_MIN_METRES);
    assert.ok(x <= BEACH_TABLE_X_MAX_METRES);
    assert.equal(y, beachGroundHeightAt(x, z));
    assert.ok(scale > 0);
    assert.ok(rotationY >= 0 && rotationY <= Math.PI * 2);
    assert.ok(windPhase >= 0 && windPhase <= Math.PI * 2);
    // Linen is one bolt of cloth: the per-table tint may only shade it.
    assert.ok(clothTint > 0.9 && clothTint <= 1);
    assert.ok(Number.isInteger(flowerTint) && flowerTint > 0);
  }
});

test("the tables are set along the whole walk, not clumped at one end", () => {
  assert.ok(BEACH_TABLE_X_MIN_METRES < JOURNEY_CAMERA_X_MIN_METRES);
  assert.ok(BEACH_TABLE_X_MAX_METRES > JOURNEY_CAMERA_X_MAX_METRES);

  const placements = resolveBeachTablePlacements(18);
  const xs = placements.map(({ position }) => position[0]).sort((a, b) => a - b);
  assert.ok(xs[0]! < JOURNEY_CAMERA_X_MIN_METRES + 12);
  assert.ok(xs.at(-1)! > JOURNEY_CAMERA_X_MAX_METRES - 12);

  // Stratified placement means no two tables may swap order or pile up: every
  // gap is a real gap, so a reception never reads as a stack of furniture.
  const span = BEACH_TABLE_X_MAX_METRES - BEACH_TABLE_X_MIN_METRES;
  const slice = span / placements.length;
  for (let index = 1; index < xs.length; index += 1) {
    assert.ok(
      xs[index]! - xs[index - 1]! > slice * 0.4,
      `tables at x ${xs[index - 1]} and ${xs[index]} are too close together`,
    );
  }
});

test("both bands are used, so the reception has depth", () => {
  const placements = resolveBeachTablePlacements(18);
  const seaward = placements.filter(
    ({ position }) => position[2] <= BEACH_TABLE_SEAWARD_Z_MAX_METRES,
  ).length;

  assert.ok(seaward > 0, "some tables stand between the frames and the water");
  assert.ok(seaward < placements.length, "some tables stand behind the walk");
});

test("asking for no tables leaves the shore bare instead of throwing", () => {
  assert.deepEqual(resolveBeachTablePlacements(0), []);
  assert.deepEqual(resolveBeachTablePlacements(-10), []);
});

test("a table is a cloth over a top and down a flared skirt", () => {
  const geometry = createBeachTableGeometry();
  const box = positionBounds(geometry);

  // Pivoted at the sand so a placement can plant it on the terrain height.
  assert.ok(Math.abs(box.minY) < 1e-6, "the hem reaches the sand");
  assert.ok(
    Math.abs(box.maxY - BEACH_TABLE_HEIGHT_METRES) < 1e-6,
    "the cloth top is at table height",
  );

  // The hem flares past the top, or the skirt reads as a drum rather than linen.
  const hemReach = Math.max(box.maxX, box.maxZ);
  assert.ok(hemReach > BEACH_TABLE_RADIUS_METRES);
  assert.ok(
    hemReach <= BEACH_TABLE_RADIUS_METRES + BEACH_TABLE_HEM_FLARE_METRES + 0.04,
    `hem reaches ${hemReach}m, past the flare plus its scallop`,
  );

  assert.ok(geometry.getIndex());
  assert.ok(geometry.getAttribute("normal"));
  assert.equal(geometry.getAttribute("uv"), geometry.getAttribute("uv1"));
  geometry.dispose();
});

test("a centrepiece is blooms over foliage, pivoted at the cloth", () => {
  const geometry = createBeachFlowerGeometry();
  const box = positionBounds(geometry);
  const bloomMask = geometry.getAttribute("bloomMask");

  assert.ok(Math.abs(box.minY) >= 0, "the collar sits at or above the cloth");
  assert.ok(
    box.maxY <= BEACH_FLOWER_HEIGHT_METRES + 1e-6,
    "the arrangement stays within its authored height",
  );
  // Wide enough to read as an arrangement, not a stem.
  assert.ok(Math.max(box.maxX, box.maxZ) > BEACH_FLOWER_CLUSTER_RADIUS_METRES * 0.5);

  // The mask is what lets one material draw white petals and green leaves, so
  // both values must actually be present — an all-1.0 mask is a bald bouquet.
  assert.ok(bloomMask);
  const values = new Set<number>();
  for (let index = 0; index < bloomMask.count; index += 1) {
    values.add(bloomMask.getX(index));
  }
  assert.deepEqual(values, new Set([0, 1]));
  geometry.dispose();
});

test("a centrepiece's bloom count follows its argument", () => {
  const sparse = createBeachFlowerGeometry(2);
  const full = createBeachFlowerGeometry(BEACH_FLOWER_BLOOMS_PER_CLUSTER);

  assert.ok(positionBounds(sparse).vertexCount < positionBounds(full).vertexCount);
  sparse.dispose();
  full.dispose();
});

test("the wind ramp height covers a full-scale centrepiece", () => {
  const geometry = createBeachFlowerGeometry();
  const { maxY } = positionBounds(geometry);
  // The ramp saturates at `BEACH_FLOWER_WIND_HEIGHT`; a ramp far below the
  // tallest bloom would leave its tip travelling at full amplitude with no
  // falloff left.
  assert.ok(BEACH_FLOWER_WIND_HEIGHT >= maxY * 0.9);
  assert.ok(BEACH_FLOWER_WIND_HEIGHT <= maxY * 1.6);
  geometry.dispose();
});

// ---------------------------------------------------------------------------
// Density
// ---------------------------------------------------------------------------

test("every tier's density resolves to a scene the props can build", () => {
  const scenes = demoScenes();

  for (const tier of ["desktop", "mobile", "reduced"] as const) {
    const density = getBeachWorldDensity(tier === "reduced" ? "mobile" : tier, tier);
    assert.equal(
      resolveBeachPostPlacements(scenes, density.posts).length,
      density.posts,
    );
    assert.equal(
      resolveBeachTablePlacements(density.tables).length,
      density.tables,
    );
    assert.doesNotThrow(() => {
      const cloth = createBeachTableGeometry();
      const flowers = createBeachFlowerGeometry();
      cloth.dispose();
      flowers.dispose();
    });
  }
});

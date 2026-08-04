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
import { shorelineOffsetAt } from "@/components/beach-wedding-journey/beach-shoreline";
import { getBeachWorldDensity } from "@/components/beach-wedding-journey/beach-world-data";
import { BEACH_PHOTOREAL_ASSETS } from "@/components/beach-wedding-journey/photoreal/beach-asset-manifest";
import {
  BEACH_DUNE_GRASS_X_MAX_METRES,
  BEACH_DUNE_GRASS_X_MIN_METRES,
  BEACH_DUNE_GRASS_Z_MAX_METRES,
  BEACH_DUNE_GRASS_Z_MIN_METRES,
  BEACH_GRASS_BLADES_PER_TUFT,
  BEACH_GRASS_WIND_BASE,
  BEACH_GRASS_WIND_CUE_GAIN,
  BEACH_GRASS_WIND_HEIGHT,
  BEACH_PIER_DECK_HEIGHT_METRES,
  BEACH_PIER_DECK_WIDTH_METRES,
  BEACH_PIER_LANDWARD_REACH_METRES,
  BEACH_PIER_PLANK_FILL,
  BEACH_PIER_POLE_SPACING_METRES,
  BEACH_PIER_POLES_PER_ROW,
  BEACH_PIER_SEAWARD_REACH_METRES,
  BEACH_POST_BASE_RADIUS_METRES,
  BEACH_POST_HEIGHT_METRES,
  BEACH_POST_LINE_MARGIN_METRES,
  BEACH_POST_TOP_RADIUS_METRES,
  BEACH_PROP_ASSETS,
  BEACH_PROP_ASSET_ERROR_MARKER,
  attachBeachWind,
  createBeachGrassTuftGeometry,
  createBeachPierDeckGeometry,
  createBeachPierPoleGeometry,
  createBeachPostGeometry,
  createBeachScatter,
  driveBeachWind,
  getBeachPierLayout,
  groupBeachPropTextures,
  isBeachPropAssetError,
  resolveBeachDuneGrassPlacements,
  resolveBeachPostPlacements,
} from "@/components/beach-wedding-journey/photoreal/beach-props";
import { beachGroundHeightAt } from "@/components/beach-wedding-journey/photoreal/beach-terrain";

/**
 * The rail the camera walks, from `resolveScenePose` in
 * `src/data/beach-wedding-journey.ts`: z 7 with a 0.9m drift landward. Restated
 * as literals on purpose — the point of the dune-grass band test is that the
 * grass clears *this* rail, so it must not be derived from the band constants it
 * is checking.
 */
const RAIL_Z_MIN_METRES = 7;
const RAIL_Z_MAX_METRES = 7.9;

/** The x range the journey's cameras occupy: `x = -8 + ordinal * 8.5`, 15 scenes. */
const JOURNEY_CAMERA_X_MIN_METRES = -8;
const JOURNEY_CAMERA_X_MAX_METRES = 111;

/** Metres the shoreline curves alongshore, from `BEACH_SHORE_CURVE_AMPLITUDE_METRES`. */
const SHORE_CURVE_AMPLITUDE_METRES = 2.4;

/** The prop map ids Task 1 shipped: pier planks plus two frame sets, ×3 maps. */
const EXPECTED_PROP_ASSET_IDS = [
  "pierPlanksColor",
  "pierPlanksNormal",
  "pierPlanksArm",
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

function finaleScene(): BeachJourneyScene {
  const finale = demoScenes().find((scene) => scene.type === "finale");
  assert.ok(finale, "the demo walk ends on a finale scene");
  return finale;
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
  attachBeachWind(material, BEACH_GRASS_WIND_HEIGHT);

  assert.equal(typeof material.customProgramCacheKey, "function");
  const key = material.customProgramCacheKey!();
  assert.equal(key, "beach-wind");
  assert.notEqual(key, "forest-wind");
  material.dispose();
});

test("the wind shader reads the per-instance phase and ramps by height", () => {
  const material = new MeshStandardMaterial();
  const uniforms = attachBeachWind(material, BEACH_GRASS_WIND_HEIGHT);

  assert.equal(uniforms.uWindHeight.value, BEACH_GRASS_WIND_HEIGHT);
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
  const uniforms = attachBeachWind(material, BEACH_GRASS_WIND_HEIGHT);

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

test("the grass wind strength stays gentle across the whole cue range", () => {
  // The cue is normalised 0..1 by `beach-cue-state.ts`.
  const still = BEACH_GRASS_WIND_BASE + 0 * BEACH_GRASS_WIND_CUE_GAIN;
  const gusting = BEACH_GRASS_WIND_BASE + 1 * BEACH_GRASS_WIND_CUE_GAIN;

  assert.ok(still > 0, "marram is never perfectly still");
  assert.ok(gusting > still);
  // Strength multiplies the wind height in the shader, so a value near 1 would
  // lay the tufts flat on the sand.
  assert.ok(gusting < 0.2);
});

// ---------------------------------------------------------------------------
// Prop assets
// ---------------------------------------------------------------------------

test("the prop maps are exactly the wood sets Task 1 shipped", () => {
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
    `[${BEACH_PROP_ASSET_ERROR_MARKER}] /chungdoi/labs/beach-wedding-journey/pier-planks-color.webp: 404`,
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
      grouped.pier.color.name,
      grouped.pier.normal.name,
      grouped.pier.arm.name,
      grouped.frames[0].color.name,
      grouped.frames[0].normal.name,
      grouped.frames[0].arm.name,
      grouped.frames[1].color.name,
      grouped.frames[1].normal.name,
      grouped.frames[1].arm.name,
    ],
    [
      "pierPlanksColor",
      "pierPlanksNormal",
      "pierPlanksArm",
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
      [{ name: "pierPlanksColor" }] as unknown as Parameters<
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
    resolveBeachDuneGrassPlacements(240),
    resolveBeachDuneGrassPlacements(240),
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
// Dune grass
// ---------------------------------------------------------------------------

test("dune grass grows only landward of the walk and the hanging line", () => {
  const placements = resolveBeachDuneGrassPlacements(900);
  const scenes = demoScenes();
  const frameZs = scenes.map((scene) => getBeachFrameGeometry(scene).position[2]);
  const maxFrameZ = Math.max(...frameZs);

  assert.equal(placements.length, 900);
  assert.ok(BEACH_DUNE_GRASS_Z_MIN_METRES > RAIL_Z_MAX_METRES);
  assert.ok(BEACH_DUNE_GRASS_Z_MIN_METRES > maxFrameZ);

  for (const { position, rotationY, scale, windPhase } of placements) {
    const [x, y, z] = position;
    assert.ok(z >= BEACH_DUNE_GRASS_Z_MIN_METRES, `tuft at z ${z} is landward`);
    assert.ok(z <= BEACH_DUNE_GRASS_Z_MAX_METRES);
    // Never between the camera and the sea, and never through a frame.
    assert.ok(z > RAIL_Z_MIN_METRES);
    assert.ok(x >= BEACH_DUNE_GRASS_X_MIN_METRES);
    assert.ok(x <= BEACH_DUNE_GRASS_X_MAX_METRES);
    assert.equal(y, beachGroundHeightAt(x, z));
    assert.ok(scale > 0);
    assert.ok(rotationY >= 0 && rotationY <= Math.PI * 2);
    assert.ok(windPhase >= 0 && windPhase <= Math.PI * 2);
  }
});

test("the grass band covers the whole walk alongshore", () => {
  assert.ok(BEACH_DUNE_GRASS_X_MIN_METRES < JOURNEY_CAMERA_X_MIN_METRES);
  assert.ok(BEACH_DUNE_GRASS_X_MAX_METRES > JOURNEY_CAMERA_X_MAX_METRES);

  const placements = resolveBeachDuneGrassPlacements(900);
  const xs = placements.map(({ position }) => position[0]);
  assert.ok(Math.min(...xs) < JOURNEY_CAMERA_X_MIN_METRES + 6);
  assert.ok(Math.max(...xs) > JOURNEY_CAMERA_X_MAX_METRES - 6);
});

test("tufts bias landward, so the band thins towards the walk", () => {
  const placements = resolveBeachDuneGrassPlacements(900);
  const midZ = (BEACH_DUNE_GRASS_Z_MIN_METRES + BEACH_DUNE_GRASS_Z_MAX_METRES) / 2;
  const landward = placements.filter(({ position }) => position[2] > midZ).length;

  // A uniform scatter would put half the tufts each side of the midpoint; the
  // squared z fraction pushes clearly more of them towards the dune crest.
  assert.ok(
    landward > placements.length * 0.6,
    `${landward} of ${placements.length} tufts sit landward of the band midpoint`,
  );
});

test("asking for no grass leaves the dunes bare instead of throwing", () => {
  assert.deepEqual(resolveBeachDuneGrassPlacements(0), []);
  assert.deepEqual(resolveBeachDuneGrassPlacements(-10), []);
});

test("a tuft is opaque tapered blades, pivoted at the sand", () => {
  const geometry = createBeachGrassTuftGeometry();
  const box = positionBounds(geometry);
  const index = geometry.getIndex();

  assert.ok(Math.abs(box.minY) < 1e-6, "blades start at the pivot");
  assert.ok(box.maxY > 0.5 && box.maxY <= 1, "one unit tall before scaling");

  // Four rings of two vertices per blade, six indices per quad, three quads.
  assert.equal(box.vertexCount, BEACH_GRASS_BLADES_PER_TUFT * 4 * 2);
  assert.ok(index);
  assert.equal(index.count, BEACH_GRASS_BLADES_PER_TUFT * 3 * 6);

  // No alpha map exists to cut a card out of, so the geometry must be the shape.
  assert.ok(geometry.getAttribute("normal"));
  assert.ok(geometry.getAttribute("uv"));
  assert.equal(geometry.getAttribute("uv"), geometry.getAttribute("uv1"));
  geometry.dispose();
});

test("a tuft's blade count follows its argument", () => {
  const sparse = createBeachGrassTuftGeometry(2);
  assert.equal(positionBounds(sparse).vertexCount, 2 * 4 * 2);
  sparse.dispose();
});

test("the wind ramp height covers a full-scale tuft", () => {
  const geometry = createBeachGrassTuftGeometry();
  const { maxY } = positionBounds(geometry);
  // Placement scales tufts up to 1.34, and the ramp saturates at
  // `BEACH_GRASS_WIND_HEIGHT`; a ramp far below the tallest blade would leave
  // its tip travelling at full amplitude with no falloff left.
  assert.ok(BEACH_GRASS_WIND_HEIGHT >= maxY * 0.9);
  assert.ok(BEACH_GRASS_WIND_HEIGHT <= maxY * 1.6);
  geometry.dispose();
});

// ---------------------------------------------------------------------------
// Pier
// ---------------------------------------------------------------------------

test("the pier reaches from behind the finale camera out past the waterline", () => {
  const scene = finaleScene();
  const layout = getBeachPierLayout(scene, 48);
  const waterline = shorelineOffsetAt(layout.x);

  // Landward end is behind the camera, so the guest stands on the deck.
  assert.ok(layout.landwardZ > scene.cameraPosition[2]);
  assert.ok(
    Math.abs(
      layout.landwardZ - (scene.cameraPosition[2] + BEACH_PIER_LANDWARD_REACH_METRES),
    ) < 1e-9,
  );

  // Seaward end is measured from this x's own waterline, not from a fixed z.
  assert.ok(layout.seawardZ < waterline, "the deck ends over water");
  assert.ok(
    Math.abs(layout.seawardZ - (waterline - BEACH_PIER_SEAWARD_REACH_METRES)) < 1e-9,
  );
  assert.ok(layout.deckLength > BEACH_PIER_SEAWARD_REACH_METRES);
  assert.ok(
    Math.abs(layout.deckCenterZ - (layout.landwardZ + layout.seawardZ) / 2) < 1e-9,
  );
  assert.equal(layout.deckWidth, BEACH_PIER_DECK_WIDTH_METRES);
  assert.equal(layout.deckY, BEACH_PIER_DECK_HEIGHT_METRES);
  assert.equal(layout.poleXOffsets.length, BEACH_PIER_POLES_PER_ROW);
});

test("the pier's seaward end follows the shoreline curve, not a fixed z", () => {
  const scene = finaleScene();
  const shifted = {
    ...scene,
    // Half the primary shoreline period away, where the curve is on its other
    // side: a layout that ignored the curve would return the same seaward z.
    cameraPosition: [
      scene.cameraPosition[0] + 27,
      scene.cameraPosition[1],
      scene.cameraPosition[2],
    ] as const,
    lookTarget: [
      scene.lookTarget[0] + 27,
      scene.lookTarget[1],
      scene.lookTarget[2],
    ] as const,
  };

  const here = getBeachPierLayout(scene, 48);
  const there = getBeachPierLayout(shifted, 48);

  assert.notEqual(here.seawardZ, there.seawardZ);
  assert.ok(Math.abs(here.seawardZ - there.seawardZ) <= SHORE_CURVE_AMPLITUDE_METRES * 2);
});

test("the pole rows are spaced at roughly the authored interval", () => {
  const layout = getBeachPierLayout(finaleScene(), 48);
  const spacing = layout.deckLength / (layout.poleRowCount - 1);

  assert.ok(layout.poleRowCount >= 2, "a pier needs at least two rows");
  assert.ok(
    Math.abs(spacing - BEACH_PIER_POLE_SPACING_METRES) < BEACH_PIER_POLE_SPACING_METRES / 2,
    `rows sit ${spacing}m apart`,
  );
});

test("a zero plank request still lays a deck", () => {
  const layout = getBeachPierLayout(finaleScene(), 0);
  assert.equal(layout.plankCount, 1);
});

test("deck planks fill the pier with a gap between each", () => {
  const layout = getBeachPierLayout(finaleScene(), 48);
  const geometry = createBeachPierDeckGeometry(layout);
  const box = positionBounds(geometry);
  const slot = layout.deckLength / layout.plankCount;

  // 48 planks, each a box of 24 vertices, merged into one draw call.
  assert.equal(box.vertexCount, layout.plankCount * 24);
  assert.equal(geometry.groups.length, 0);

  // Local to the deck group at `deckCenterZ`, so the planks straddle z = 0.
  assert.ok(box.minZ < 0 && box.maxZ > 0);
  assert.ok(
    Math.abs((box.maxZ - box.minZ) - (layout.deckLength - slot * (1 - BEACH_PIER_PLANK_FILL))) < 1e-5,
  );
  assert.ok(BEACH_PIER_PLANK_FILL < 1, "planks are separated, not a solid slab");
  assert.ok(
    Math.abs((box.maxX - box.minX) - BEACH_PIER_DECK_WIDTH_METRES) < 1e-5,
  );
  geometry.dispose();
});

test("every pole reaches the bed from under the deck", () => {
  const layout = getBeachPierLayout(finaleScene(), 48);
  const geometry = createBeachPierPoleGeometry(layout);
  const box = positionBounds(geometry);

  // Local to the deck, so the tops sit at y = 0 and the feet reach down to the
  // bed — including the submerged part, which is what stops a floating pier.
  assert.ok(box.maxY <= 1e-6, "no pole pokes above the deck");
  assert.ok(box.minY < -layout.deckY, "the seaward poles reach below the water");

  // Inset under the deck: a pole wider than the deck reads as a pillar the
  // planks were dropped onto. The bound carries the pole's own radius, so it is
  // compared against the deck edge rather than against the offset.
  assert.ok(box.maxX < BEACH_PIER_DECK_WIDTH_METRES / 2);
  assert.ok(box.minX > -BEACH_PIER_DECK_WIDTH_METRES / 2);
  assert.ok(box.maxX > Math.max(...layout.poleXOffsets));
  assert.ok(Math.abs(box.maxX + box.minX) < 1e-5, "the rows are symmetric");

  // Poles span the deck's whole length and merge into one draw call.
  assert.ok(box.minZ < -layout.deckLength / 2 + 1);
  assert.ok(box.maxZ > layout.deckLength / 2 - 1);
  assert.equal(geometry.groups.length, 0);
  geometry.dispose();
});

test("a pier with no ground under it is an error, not an invisible pier", () => {
  const layout = getBeachPierLayout(finaleScene(), 48);
  assert.throws(
    () => createBeachPierPoleGeometry({
      ...layout,
      // Deck below the bed everywhere: no pole can have positive height.
      deckY: -50,
    }),
    /Beach pier has no poles above the bed/,
  );
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
      resolveBeachDuneGrassPlacements(density.duneGrass).length,
      density.duneGrass,
    );
    const layout = getBeachPierLayout(finaleScene(), density.pierPlanks);
    assert.equal(layout.plankCount, density.pierPlanks);
    assert.doesNotThrow(() => {
      const deck = createBeachPierDeckGeometry(layout);
      const poles = createBeachPierPoleGeometry(layout);
      deck.dispose();
      poles.dispose();
    });
  }
});

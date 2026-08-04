import assert from "node:assert/strict";
import test from "node:test";

import {
  FOREST_CORRIDOR_CLEARANCES,
  FOREST_GATE_CAMERA_POSITION,
  FOREST_GATE_CENTER,
  FOREST_GATE_CLEARING_RADIUS,
  FOREST_GATE_PLACEMENT_ENVELOPE,
  FOREST_ENVIRONMENT_RUNTIME_TEXTURE_SPECS,
  FOREST_MATERIAL_ATLAS_SPECS,
  FOREST_PETAL_CLEARING_PADDING,
  createForestAdaptiveQualitySampler,
  createForestContactCues,
  createForestPathSamples,
  createForestWorldPlacements,
  estimateExactRgbaMipBytes,
  getForestEnvironmentRuntimeEstimate,
  getForestBakedAoFactor,
  getForestEnvironmentLayerContract,
  getForestAtlasUvRect,
  getForestWorldDensity,
  getForestWorldDiagnostics,
  getInitialForestWorldQualityTier,
  type ForestWorldDensity,
  type ForestWorldPlacement,
  type ForestWorldVector3,
} from "./forest-world-data";

test("exact RGBA mip estimates include every integer mip level", () => {
  assert.equal(estimateExactRgbaMipBytes(1_024, 1_024), 5_592_404);
  assert.equal(estimateExactRgbaMipBytes(1_363, 2_048), 14_883_276);
  assert.throws(() => estimateExactRgbaMipBytes(0, 1_024), RangeError);
  assert.throws(() => estimateExactRgbaMipBytes(1_024.5, 1_024), RangeError);
});

test("environment runtime estimates describe bounded textured and procedural worlds", () => {
  assert.deepEqual(FOREST_ENVIRONMENT_RUNTIME_TEXTURE_SPECS, {
    foliage: {
      height: 1_024,
      src: "/chungdoi/labs/forest-wedding-journey/materials/foliage-atlas.webp",
      width: 1_024,
    },
    ground: {
      height: 1_024,
      src: "/chungdoi/labs/forest-wedding-journey/materials/ground-detail.webp",
      width: 1_024,
    },
    petal: {
      height: 512,
      src: "/chungdoi/labs/forest-wedding-journey/materials/petal-atlas.webp",
      width: 512,
    },
    wildflower: {
      height: 1_024,
      src: "/chungdoi/labs/forest-wedding-journey/materials/wildflower-atlas.webp",
      width: 1_024,
    },
  });

  const textured = getForestEnvironmentRuntimeEstimate("textured");
  assert.equal(textured.decodedRgbaMipBytes, 18_175_312);
  assert.equal(textured.textures.length, 4);
  assert.ok(textured.textures.every(({ height, width }) => (
    height <= 1_024 && width <= 1_024
  )));

  assert.deepEqual(getForestEnvironmentRuntimeEstimate("procedural"), {
    decodedRgbaMipBytes: 0,
    mode: "procedural",
    textures: [],
  });
});

const EXPECTED_DENSITIES = {
  desktop: {
    farTrees: 300,
    grass: 1_200,
    midTrees: 260,
    petals: 72,
    wildflowers: 260,
  },
  mobile: {
    farTrees: 200,
    grass: 720,
    midTrees: 170,
    petals: 42,
    wildflowers: 150,
  },
  reduced: {
    farTrees: 120,
    grass: 420,
    midTrees: 90,
    petals: 18,
    wildflowers: 90,
  },
} satisfies Record<string, ForestWorldDensity>;

function assertFinitePlacement(placement: ForestWorldPlacement) {
  assert.ok(placement.position.every(Number.isFinite));
  assert.ok(placement.rotation.every(Number.isFinite));
  assert.ok(Number.isFinite(placement.pathOffset));
  assert.ok(Number.isFinite(placement.scale));
  assert.ok(Number.isFinite(placement.tint));
  assert.ok(Number.isFinite(placement.windPhase));
}

function horizontalDistanceToCenterline(
  position: ForestWorldVector3,
  centerline: readonly { readonly position: ForestWorldVector3 }[],
): number {
  let minimum = Number.POSITIVE_INFINITY;
  for (let index = 0; index < centerline.length - 1; index += 1) {
    const start = centerline[index]!.position;
    const end = centerline[index + 1]!.position;
    const segmentX = end[0] - start[0];
    const segmentZ = end[2] - start[2];
    const squaredLength = segmentX * segmentX + segmentZ * segmentZ;
    const progress = squaredLength === 0 ? 0 : Math.max(0, Math.min(1, (
      (position[0] - start[0]) * segmentX + (position[2] - start[2]) * segmentZ
    ) / squaredLength));
    minimum = Math.min(minimum, Math.hypot(
      position[0] - (start[0] + segmentX * progress),
      position[2] - (start[2] + segmentZ * progress),
    ));
  }
  return minimum;
}

test("quality tiers expose the exact fixed density ceilings", () => {
  assert.deepEqual(getForestWorldDensity("desktop", "desktop"), EXPECTED_DENSITIES.desktop);
  assert.deepEqual(getForestWorldDensity("mobile", "mobile"), EXPECTED_DENSITIES.mobile);
  assert.deepEqual(getForestWorldDensity("desktop", "reduced"), EXPECTED_DENSITIES.reduced);
  assert.deepEqual(getForestWorldDensity("mobile", "reduced"), EXPECTED_DENSITIES.reduced);
  assert.equal(getInitialForestWorldQualityTier("desktop"), "desktop");
  assert.equal(getInitialForestWorldQualityTier("mobile"), "mobile");
});

test("the path is finite continuous and spans the dynamic journey", () => {
  const samples = createForestPathSamples(15);

  assert.equal(samples.length, 15);
  assert.equal(samples[0]?.position[2], 8);
  assert.ok((samples.at(-1)?.position[2] ?? 0) <= -110);

  for (const [index, sample] of samples.entries()) {
    assert.ok(sample.position.every(Number.isFinite));
    assert.ok(sample.tangent.every(Number.isFinite));
    assert.ok(Math.abs(sample.position[1]) <= 0.24);

    const next = samples[index + 1];
    if (!next) continue;
    assert.ok(next.position[2] < sample.position[2]);
    assert.ok(Math.abs(next.position[2] - sample.position[2]) <= 9);
    assert.ok(Math.abs(next.position[0] - sample.position[0]) <= 1.8);
  }
});

test("the rendered forest continues beyond the finale clearing", () => {
  const placements = createForestWorldPlacements(
    15,
    getForestWorldDensity("mobile", "mobile"),
  );
  const finaleClearing = placements.clearings.at(-1);
  const terminalPath = placements.pathCenterline.at(-1);
  assert.ok(finaleClearing);
  assert.ok(terminalPath);

  assert.ok(terminalPath.position[2] <= finaleClearing.position[2] - 8);
  assert.ok([
    ...placements.heroTrees,
    ...placements.midTrees,
    ...placements.farTrees,
    ...placements.grass,
    ...placements.wildflowers,
  ].some(({ position }) => position[2] < finaleClearing.position[2] - 3));
});

test("placements are deterministic finite and preserve the walking corridor", () => {
  const density = getForestWorldDensity("desktop", "desktop");
  const first = createForestWorldPlacements(13, density);
  const second = createForestWorldPlacements(13, density);

  assert.deepEqual(first, second);
  for (const category of [
    first.heroTrees,
    first.midTrees,
    first.farTrees,
    first.grass,
    first.wildflowers,
    first.petals,
    first.shrubs,
    first.roots,
    first.stones,
  ]) {
    for (const placement of category) assertFinitePlacement(placement);
  }
  for (const tree of first.heroTrees) assert.ok(Math.abs(tree.pathOffset) >= 2.6);
  for (const flower of first.wildflowers) assert.ok(Math.abs(flower.pathOffset) >= 1.55);
});

test("dynamic scene counts preserve the rendered corridor across quality tiers", async (t) => {
  const qualityTiers = [
    ["desktop", "desktop"],
    ["mobile", "mobile"],
    ["reduced", "reduced"],
  ] as const;

  for (const sceneCount of [3, 7, 14, 16]) {
    for (const [label, qualityTier] of qualityTiers) {
      await t.test(`${sceneCount} scenes at ${label} quality`, () => {
        const placements = createForestWorldPlacements(
          sceneCount,
          getForestWorldDensity("desktop", qualityTier),
        );
        const diagnostics = getForestWorldDiagnostics(placements);

        assert.ok(
          diagnostics.minimumHeroPathDistance >= FOREST_CORRIDOR_CLEARANCES.heroTrees,
          `hero distance ${diagnostics.minimumHeroPathDistance} is below ${FOREST_CORRIDOR_CLEARANCES.heroTrees}`,
        );
        assert.ok(
          diagnostics.minimumWildflowerPathDistance
            >= FOREST_CORRIDOR_CLEARANCES.wildflowers,
          `wildflower distance ${diagnostics.minimumWildflowerPathDistance} is below ${FOREST_CORRIDOR_CLEARANCES.wildflowers}`,
        );
        assert.equal(diagnostics.corridorClear, true);
      });
    }
  }
});

test("near mid and three far forest bands remain populated on mobile", () => {
  const placements = createForestWorldPlacements(
    13,
    getForestWorldDensity("mobile", "mobile"),
  );

  assert.ok(placements.heroTrees.length >= 60);
  assert.ok(placements.midTrees.length >= 150);
  assert.ok(placements.farTrees.length >= 180);
  assert.ok(new Set(placements.farTrees.map(({ depthBand }) => depthBand)).size >= 3);
  assert.equal(placements.grass.length, EXPECTED_DENSITIES.mobile.grass);
  assert.equal(placements.wildflowers.length, EXPECTED_DENSITIES.mobile.wildflowers);
  assert.equal(placements.petals.length, EXPECTED_DENSITIES.mobile.petals);
});

test("fifteen-scene desktop and mobile placements keep exact runtime budgets", () => {
  const expected = {
    desktop: {
      clearings: 15,
      farTrees: 300,
      grass: 1_200,
      heroTrees: 90,
      midTrees: 260,
      pathCenterline: 129,
      petals: 72,
      roots: 30,
      shrubs: 60,
      stones: 45,
      wildflowers: 260,
    },
    mobile: {
      clearings: 15,
      farTrees: 200,
      grass: 720,
      heroTrees: 90,
      midTrees: 170,
      pathCenterline: 129,
      petals: 42,
      roots: 30,
      shrubs: 60,
      stones: 45,
      wildflowers: 150,
    },
  } as const;

  for (const viewport of ["desktop", "mobile"] as const) {
    const placements = createForestWorldPlacements(
      15,
      getForestWorldDensity(viewport, viewport),
    );
    assert.deepEqual(
      Object.fromEntries(Object.entries(placements).map(([key, values]) => [
        key,
        values.length,
      ])),
      expected[viewport],
    );
  }
});

test("semantic prop clearings remain free of tree placements", () => {
  const placements = createForestWorldPlacements(
    13,
    getForestWorldDensity("desktop", "desktop"),
  );
  const path = createForestPathSamples(13);

  assert.equal(placements.clearings.length, 13);
  for (const clearing of placements.clearings) {
    assert.ok(clearing.position.every(Number.isFinite));
    assert.ok(Number.isFinite(clearing.radius));
    const cameraAnchor = path[clearing.sceneIndex]!.position;
    const horizontalAngleDegrees = Math.atan2(
      Math.abs(clearing.position[0] - cameraAnchor[0]),
      Math.abs(clearing.position[2] - cameraAnchor[2]),
    ) * 180 / Math.PI;
    assert.ok(horizontalAngleDegrees <= 20);
    for (const tree of [...placements.heroTrees, ...placements.midTrees]) {
      const x = tree.position[0] - clearing.position[0];
      const z = tree.position[2] - clearing.position[2];
      assert.ok(Math.hypot(x, z) >= clearing.radius);
    }
  }
});

test("the authored opening clearing is centered on the gate camera anchor", () => {
  const placements = createForestWorldPlacements(
    13,
    getForestWorldDensity("desktop", "desktop"),
  );
  const opening = placements.clearings[0];

  assert.deepEqual(FOREST_GATE_CAMERA_POSITION, [0, 1.62, 8]);
  assert.deepEqual(FOREST_GATE_CENTER, [0, 1.35, 3.5]);
  assert.deepEqual(opening?.position, [0, 0.025, 3.5]);
  assert.equal(opening?.radius, FOREST_GATE_CLEARING_RADIUS);
  assert.ok((opening?.radius ?? 0) >= 2.2);
});

test("opening vegetation avoids the intended gate and post envelope", () => {
  const placements = createForestWorldPlacements(
    13,
    getForestWorldDensity("desktop", "desktop"),
  );
  const categories = [
    ...placements.heroTrees,
    ...placements.midTrees,
    ...placements.grass,
    ...placements.wildflowers,
  ];

  for (const placement of categories) {
    const [x, , z] = placement.position;
    assert.ok(
      x < FOREST_GATE_PLACEMENT_ENVELOPE.minX
        || x > FOREST_GATE_PLACEMENT_ENVELOPE.maxX
        || z < FOREST_GATE_PLACEMENT_ENVELOPE.minZ
        || z > FOREST_GATE_PLACEMENT_ENVELOPE.maxZ,
      `placement ${JSON.stringify(placement.position)} intersects gate envelope`,
    );
  }
});

test("reduced tiers keep hero trees and remove stable placement suffixes only", () => {
  const base = createForestWorldPlacements(
    13,
    getForestWorldDensity("mobile", "mobile"),
  );
  const reduced = createForestWorldPlacements(
    13,
    getForestWorldDensity("mobile", "reduced"),
  );

  assert.deepEqual(reduced.heroTrees, base.heroTrees);
  assert.deepEqual(reduced.midTrees, base.midTrees.slice(0, reduced.midTrees.length));
  assert.deepEqual(reduced.farTrees, base.farTrees.slice(0, reduced.farTrees.length));
  assert.deepEqual(reduced.grass, base.grass.slice(0, reduced.grass.length));
  assert.deepEqual(reduced.wildflowers, base.wildflowers.slice(0, reduced.wildflowers.length));
  assert.deepEqual(reduced.petals, base.petals.slice(0, reduced.petals.length));
});

test("each category owns an independent deterministic random stream", () => {
  const density = getForestWorldDensity("desktop", "desktop");
  const sparseGrass = createForestWorldPlacements(13, { ...density, grass: 7 });
  const fullGrass = createForestWorldPlacements(13, density);

  assert.deepEqual(sparseGrass.heroTrees, fullGrass.heroTrees);
  assert.deepEqual(sparseGrass.midTrees, fullGrass.midTrees);
  assert.deepEqual(sparseGrass.farTrees, fullGrass.farTrees);
  assert.deepEqual(sparseGrass.wildflowers, fullGrass.wildflowers);
  assert.deepEqual(sparseGrass.petals, fullGrass.petals);
  assert.deepEqual(sparseGrass.grass, fullGrass.grass.slice(0, 7));
});

test("petals are seeded atlas-ready stable prefixes", () => {
  const desktop = createForestWorldPlacements(
    13,
    getForestWorldDensity("desktop", "desktop"),
  ).petals;
  const mobile = createForestWorldPlacements(
    13,
    getForestWorldDensity("mobile", "mobile"),
  ).petals;
  const reduced = createForestWorldPlacements(
    13,
    getForestWorldDensity("mobile", "reduced"),
  ).petals;

  assert.equal(desktop.length, 72);
  assert.equal(mobile.length, 42);
  assert.equal(reduced.length, 18);
  assert.deepEqual(mobile, desktop.slice(0, mobile.length));
  assert.deepEqual(reduced, desktop.slice(0, reduced.length));
  for (const petal of desktop) {
    assert.ok(Number.isInteger(petal.atlasCell));
    assert.ok(petal.atlasCell >= 0 && petal.atlasCell <= 15);
    assert.ok(Number.isFinite(petal.fallSpeed));
    assert.ok(Number.isFinite(petal.phase));
  }
});

test("petals deterministically avoid every semantic clearing and form plane", () => {
  const placements = createForestWorldPlacements(
    13,
    getForestWorldDensity("desktop", "desktop"),
  );

  for (const petal of placements.petals) {
    for (const clearing of placements.clearings) {
      const distance = Math.hypot(
        petal.position[0] - clearing.position[0],
        petal.position[2] - clearing.position[2],
      );
      assert.ok(
        distance >= clearing.radius + FOREST_PETAL_CLEARING_PADDING,
        `petal ${JSON.stringify(petal.position)} intersects scene ${clearing.sceneIndex}`,
      );
    }
  }
});

test("textured mid canopies and petals use atlas cards while hero canopies stay volumetric", () => {
  const textured = getForestEnvironmentLayerContract("textured");
  const procedural = getForestEnvironmentLayerContract("procedural");

  assert.deepEqual(textured.heroCanopies, {
    atlasName: null,
    geometry: "canopy",
  });
  assert.deepEqual(textured.midCanopies, {
    atlasName: "foliage",
    geometry: "atlas-card",
  });
  assert.deepEqual(textured.petals, {
    atlasName: "petal",
    geometry: "atlas-card",
  });
  assert.deepEqual(procedural.heroCanopies, textured.heroCanopies);
  assert.deepEqual(procedural.midCanopies, {
    atlasName: null,
    geometry: "canopy",
  });
  assert.deepEqual(procedural.petals, {
    atlasName: null,
    geometry: "petal",
  });
  assert.deepEqual(textured.wildflowerHeads, {
    atlasName: "wildflower",
    geometry: "atlas-card",
  });
  assert.deepEqual(procedural.wildflowerHeads, {
    atlasName: null,
    geometry: "flower-bud",
  });
});

test("hybrid conifers use branch-card LODs and a panorama far field", () => {
  const hybrid = getForestEnvironmentLayerContract("hybrid");

  assert.deepEqual(hybrid.heroCanopies, {
    atlasName: "conifer",
    geometry: "branch-card-lod0",
  });
  assert.deepEqual(hybrid.midCanopies, {
    atlasName: "conifer",
    geometry: "branch-card-lod1",
  });
  assert.deepEqual(hybrid.farForest, {
    atlasName: "backdrop",
    geometry: "panorama-impostor",
  });
  assert.deepEqual(hybrid.petals, {
    atlasName: "petal",
    geometry: "atlas-card",
  });
  assert.deepEqual(hybrid.wildflowerHeads, {
    atlasName: "wildflower",
    geometry: "atlas-card",
  });
});

test("legacy modes keep a procedural far field instead of a panorama", () => {
  for (const mode of ["procedural", "textured"] as const) {
    assert.deepEqual(getForestEnvironmentLayerContract(mode).farForest, {
      atlasName: null,
      geometry: "far-trunk",
    });
  }
});

test("localized contacts cover hero and mid trees plus near shrubs roots and stones", () => {
  const placements = createForestWorldPlacements(
    13,
    getForestWorldDensity("mobile", "mobile"),
  );
  const contacts = createForestContactCues(placements);

  assert.equal(
    contacts.length,
    placements.heroTrees.length
      + placements.midTrees.length
      + placements.shrubs.length
      + placements.roots.length
      + placements.stones.length,
  );
  assert.deepEqual(
    new Set(contacts.map(({ source }) => source)),
    new Set(["hero-tree", "mid-tree", "shrub", "root", "stone"]),
  );
  for (const contact of contacts) {
    assert.ok(contact.position.every(Number.isFinite));
    assert.ok(contact.scale.every((value) => Number.isFinite(value) && value > 0));
    assert.ok(Number.isFinite(contact.rotationY));
  }
  assert.deepEqual(contacts, createForestContactCues(placements));
});

test("baked ground AO varies across the ribbon and remains a bounded material factor", () => {
  const center = getForestBakedAoFactor(0.25, 0);
  const edge = getForestBakedAoFactor(0.25, 1);
  const laterCenter = getForestBakedAoFactor(0.75, 0);

  assert.ok(center > edge);
  assert.notEqual(center, laterCenter);
  for (const factor of [center, edge, laterCenter]) {
    assert.ok(factor >= 0.72 && factor <= 1);
  }
});

test("corridor diagnostics are calculated from the placements that feed the renderer", () => {
  const placements = createForestWorldPlacements(
    13,
    getForestWorldDensity("desktop", "desktop"),
  );
  const diagnostics = getForestWorldDiagnostics(placements);

  assert.ok(placements.pathCenterline.length > createForestPathSamples(13).length);
  assert.equal(
    diagnostics.minimumHeroPathDistance,
    Math.min(...placements.heroTrees.map(({ position }) => (
      horizontalDistanceToCenterline(position, placements.pathCenterline)
    ))),
  );
  assert.equal(
    diagnostics.minimumWildflowerPathDistance,
    Math.min(...placements.wildflowers.map(({ position }) => (
      horizontalDistanceToCenterline(position, placements.pathCenterline)
    ))),
  );
  assert.equal(diagnostics.corridorClear, true);

  const firstHero = placements.heroTrees[0]!;
  const pathPosition = placements.pathCenterline[Math.floor(
    placements.pathCenterline.length / 2,
  )]!.position;
  const obstructed = getForestWorldDiagnostics({
    ...placements,
    heroTrees: [{
      ...firstHero,
      pathOffset: 7.6,
      position: pathPosition,
    }, ...placements.heroTrees.slice(1)],
  });
  assert.equal(obstructed.minimumHeroPathDistance, 0);
  assert.equal(obstructed.corridorClear, false);
});

test("atlas UV rectangles respect the authored grid bounds and gutters", () => {
  assert.deepEqual(FOREST_MATERIAL_ATLAS_SPECS, {
    backdrop: {
      cellBoundsX: [0, 1_024],
      cellBoundsY: [0, 512],
      gutter: 0,
      height: 512,
      width: 1_024,
    },
    conifer: {
      cellBoundsX: [0, 256, 512],
      cellBoundsY: [0, 256, 512],
      gutter: 8,
      height: 512,
      width: 1_024,
    },
    foliage: {
      cellBoundsX: [0, 512, 1_024],
      cellBoundsY: [0, 256, 512, 768, 1_024],
      gutter: 12,
      height: 1_024,
      width: 1_024,
    },
    petal: {
      cellBoundsX: [0, 128, 256, 384, 512],
      cellBoundsY: [0, 128, 256, 384, 512],
      gutter: 8,
      height: 512,
      width: 512,
    },
    wildflower: {
      cellBoundsX: [0, 256, 512, 768, 1_024],
      cellBoundsY: [0, 341, 683, 1_024],
      gutter: 10,
      height: 1_024,
      width: 1_024,
    },
    wildlife: {
      cellBoundsX: [0, 320, 640, 960],
      cellBoundsY: [0, 320, 640],
      gutter: 8,
      height: 640,
      width: 960,
    },
  });

  for (const [atlas, count] of [
    ["conifer", 4],
    ["foliage", 8],
    ["wildflower", 12],
    ["wildlife", 6],
    ["petal", 16],
  ] as const) {
    const rects = Array.from({ length: count }, (_, cell) => getForestAtlasUvRect(atlas, cell));
    assert.equal(new Set(rects.map((rect) => JSON.stringify(rect))).size, count);
    for (const rect of rects) {
      assert.ok(rect.offset.every((value) => value > 0 && value < 1));
      assert.ok(rect.repeat.every((value) => value > 0 && value < 1));
      assert.ok(rect.offset[0] + rect.repeat[0] < 1);
      assert.ok(rect.offset[1] + rect.repeat[1] < 1);
    }
  }
});

test("adaptive quality reduces once only after two sustained slow seconds", () => {
  let reductions = 0;
  const sampler = createForestAdaptiveQualitySampler(() => {
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
  const sampler = createForestAdaptiveQualitySampler(() => {
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
  const sampler = createForestAdaptiveQualitySampler(() => {
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
  const sampler = createForestAdaptiveQualitySampler(() => {
    reductions += 1;
  });

  for (let timestamp = 0; timestamp <= 3_600; timestamp += 600) {
    sampler.sample(timestamp);
  }
  assert.equal(reductions, 1);
});

test("a single stall between healthy frames never accumulates", () => {
  let reductions = 0;
  const sampler = createForestAdaptiveQualitySampler(() => {
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

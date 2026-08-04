import assert from "node:assert/strict";
import test from "node:test";

import type {
  ForestFarTreePlacement,
  ForestTreePlacement,
} from "../forest-world-data";
import {
  countForestConiferLodTrees,
  planForestConiferChunks,
} from "./forest-chunk-plan";
import {
  FOREST_CHUNK_ORIGIN_Z,
  FOREST_CHUNK_SPACING,
  FOREST_TREE_CHUNK_RESIDENCY_RADII,
} from "./forest-environment-chunks";

function treeInChunk(chunkIndex: number, id: number): ForestTreePlacement {
  return {
    atlasCell: id % 4,
    pathOffset: id * 0.25,
    position: [
      id * 0.1,
      0,
      FOREST_CHUNK_ORIGIN_Z - chunkIndex * FOREST_CHUNK_SPACING,
    ],
    rotation: [0, 0, 0],
    scale: 1,
    tint: 0x224422,
    windPhase: id,
  };
}

function farTreeInChunk(chunkIndex: number, id: number): ForestFarTreePlacement {
  return { ...treeInChunk(chunkIndex, id), depthBand: (id % 3) as 0 | 1 | 2 };
}

test("conifer chunk plan mounts the tier's residency window", () => {
  const plans = planForestConiferChunks({
    activeIndex: 6,
    chunkCount: 14,
    heroTrees: [treeInChunk(3, 1), treeInChunk(6, 2), treeInChunk(9, 3)],
    midTrees: [treeInChunk(5, 4)],
    targetIndex: null,
    tier: "desktop",
  });

  assert.equal(FOREST_TREE_CHUNK_RESIDENCY_RADII.desktop, 3);
  assert.deepEqual(plans.map(({ index }) => index), [3, 4, 5, 6, 7, 8, 9]);
  assert.deepEqual(
    plans
      .filter(({ heroTrees, midTrees }) => heroTrees.length + midTrees.length > 0)
      .map(({ heroTrees, index, midTrees }) => (
        [index, heroTrees.length, midTrees.length]
      )),
    [[3, 1, 0], [5, 0, 1], [6, 1, 0], [9, 1, 0]],
  );
});

test("mobile keeps a narrower tree window than desktop", () => {
  const input = {
    activeIndex: 6,
    chunkCount: 14,
    heroTrees: [],
    midTrees: [],
    targetIndex: null,
  } as const;

  assert.deepEqual(
    planForestConiferChunks({ ...input, tier: "mobile" })
      .map(({ index }) => index),
    [4, 5, 6, 7, 8],
  );
  assert.deepEqual(
    planForestConiferChunks({ ...input, tier: "reduced" })
      .map(({ index }) => index),
    [5, 6, 7],
  );
});

test("travel keeps only the departure and arrival ends resident", () => {
  const plans = planForestConiferChunks({
    activeIndex: 0,
    chunkCount: 16,
    heroTrees: [],
    midTrees: [],
    targetIndex: 12,
    tier: "desktop",
  });

  // Long hops skip the middle of the rail entirely, and LOD is measured from
  // the arrival chunk, so the departure end degrades to impostors while the
  // arrival end keeps full silhouettes.
  assert.deepEqual(
    plans.map(({ heroLod, index, midLod }) => ({ heroLod, index, midLod })),
    [
      { heroLod: "impostor", index: 0, midLod: "impostor" },
      { heroLod: "impostor", index: 1, midLod: "impostor" },
      { heroLod: "impostor", index: 2, midLod: "impostor" },
      { heroLod: "impostor", index: 3, midLod: "impostor" },
      { heroLod: "mid", index: 9, midLod: "impostor" },
      { heroLod: "mid", index: 10, midLod: "impostor" },
      { heroLod: "hero", index: 11, midLod: "mid" },
      { heroLod: "hero", index: 12, midLod: "mid" },
    ],
  );
});

test("mobile bands demote distant chunks earlier than desktop", () => {
  const input = {
    activeIndex: 0,
    chunkCount: 4,
    heroTrees: [],
    midTrees: [],
    targetIndex: 3,
  } as const;

  assert.deepEqual(
    planForestConiferChunks({ ...input, tier: "desktop" })
      .map(({ heroLod }) => heroLod),
    ["mid", "mid", "hero", "hero"],
  );
  assert.deepEqual(
    planForestConiferChunks({ ...input, tier: "mobile" })
      .map(({ heroLod }) => heroLod),
    ["impostor", "mid", "mid", "hero"],
  );
});

test("far trees stay on the impostor tier at every distance", () => {
  const plans = planForestConiferChunks({
    activeIndex: 0,
    chunkCount: 8,
    farTrees: [farTreeInChunk(0, 1), farTreeInChunk(1, 2), farTreeInChunk(7, 3)],
    heroTrees: [treeInChunk(0, 4)],
    midTrees: [],
    targetIndex: null,
    tier: "desktop",
  });

  assert.deepEqual(plans.map(({ index }) => index), [0, 1, 2, 3]);
  assert.deepEqual(plans.map(({ farTrees }) => farTrees.length), [1, 1, 0, 0]);
  assert.equal(plans[0]?.heroLod, "hero");
  // Chunk 7 is outside the window, so its far tree never mounts.
  assert.deepEqual({ ...countForestConiferLodTrees(plans) }, {
    hero: 1,
    impostor: 2,
    mid: 0,
  });
});

test("lod tree counts sum every mounted band without double counting", () => {
  const plans = planForestConiferChunks({
    activeIndex: 0,
    chunkCount: 6,
    farTrees: [farTreeInChunk(1, 6)],
    heroTrees: [treeInChunk(0, 1), treeInChunk(1, 2), treeInChunk(4, 3)],
    midTrees: [treeInChunk(0, 4), treeInChunk(1, 5)],
    targetIndex: null,
    tier: "desktop",
  });
  const counts = countForestConiferLodTrees(plans);

  assert.deepEqual(plans.map(({ index }) => index), [0, 1, 2, 3]);
  assert.deepEqual({ ...counts }, { hero: 2, impostor: 1, mid: 2 });
  assert.equal(
    counts.hero + counts.impostor + counts.mid,
    plans.reduce(
      (total, plan) => (
        total
        + plan.heroTrees.length
        + plan.midTrees.length
        + plan.farTrees.length
      ),
      0,
    ),
  );
});

test("omitting far trees leaves the band empty rather than throwing", () => {
  const plans = planForestConiferChunks({
    activeIndex: 0,
    chunkCount: 4,
    heroTrees: [treeInChunk(0, 1)],
    midTrees: [],
    targetIndex: null,
    tier: "desktop",
  });

  assert.ok(plans.every(({ farTrees }) => farTrees.length === 0));
});

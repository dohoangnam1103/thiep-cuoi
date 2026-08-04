import assert from "node:assert/strict";
import test from "node:test";

import {
  FOREST_CHUNK_ORIGIN_Z,
  FOREST_CHUNK_SPACING,
  FOREST_TREE_CHUNK_RESIDENCY_RADII,
  FOREST_UNDERGROWTH_CHUNK_RESIDENCY_RADIUS,
  forestChunkIndexForZ,
  groupForestPlacementsByChunk,
  residentForestChunkIndices,
} from "./forest-environment-chunks";

test("the default radius keeps the undergrowth window at one neighbour", () => {
  assert.equal(FOREST_UNDERGROWTH_CHUNK_RESIDENCY_RADIUS, 1);
  assert.deepEqual(residentForestChunkIndices(4, null, 9), [3, 4, 5]);
});

test("trees mount a wider window than undergrowth on every tier", () => {
  assert.deepEqual({ ...FOREST_TREE_CHUNK_RESIDENCY_RADII }, {
    desktop: 3,
    mobile: 2,
    reduced: 1,
  });
  for (const radius of Object.values(FOREST_TREE_CHUNK_RESIDENCY_RADII)) {
    assert.ok(radius >= FOREST_UNDERGROWTH_CHUNK_RESIDENCY_RADIUS);
  }
});

test("a wider radius reaches further down the rail in both directions", () => {
  assert.deepEqual(
    residentForestChunkIndices(6, null, 13, 3),
    [3, 4, 5, 6, 7, 8, 9],
  );
  assert.deepEqual(residentForestChunkIndices(6, null, 13, 2), [4, 5, 6, 7, 8]);
});

test("travel keeps the union of the source and target neighbourhoods", () => {
  assert.deepEqual(residentForestChunkIndices(4, 5, 9), [3, 4, 5, 6]);
  assert.deepEqual(
    residentForestChunkIndices(4, 5, 13, 3),
    [1, 2, 3, 4, 5, 6, 7, 8],
  );
});

test("boundaries clamp instead of wrapping or emitting negatives", () => {
  assert.deepEqual(residentForestChunkIndices(0, null, 9), [0, 1]);
  assert.deepEqual(residentForestChunkIndices(8, null, 9), [7, 8]);
  assert.deepEqual(residentForestChunkIndices(0, 0, 1), [0]);
  assert.deepEqual(residentForestChunkIndices(0, null, 9, 3), [0, 1, 2, 3]);
  assert.deepEqual(residentForestChunkIndices(8, null, 9, 3), [5, 6, 7, 8]);
});

test("results are unique and ascending even for distant travel", () => {
  for (const radius of [1, 2, 3]) {
    const resident = residentForestChunkIndices(1, 7, 9, radius);
    assert.deepEqual([...new Set(resident)], resident);
    assert.deepEqual([...resident].sort((a, b) => a - b), resident);
  }
});

test("a long hop mounts both ends and skips the rail between them", () => {
  // Radius 1: departure plus one step, arrival minus one step.
  assert.deepEqual(residentForestChunkIndices(0, 9, 12), [0, 1, 8, 9]);
  // Radius 3: the same shape, three steps deep at each end. Nine chunks apart
  // is more than 2 x 3, so the middle stays unmounted.
  assert.deepEqual(
    residentForestChunkIndices(0, 9, 12, 3),
    [0, 1, 2, 3, 6, 7, 8, 9],
  );
});

test("residency never exceeds the window both ends can span", () => {
  for (const radius of [1, 2, 3]) {
    // Two windows that still touch merge into one contiguous run at most
    // `4 * radius + 1` long; once they separate the long-hop branch keeps
    // `radius + 1` chunks at each end instead.
    const ceiling = Math.max(radius * 4 + 1, (radius + 1) * 2);
    for (let index = 0; index < 13; index += 1) {
      for (let target = 0; target < 13; target += 1) {
        const resident = residentForestChunkIndices(index, target, 13, radius);
        assert.ok(
          resident.length <= ceiling,
          `radius ${radius} from ${index} to ${target} mounted ${resident.length}`,
        );
      }
    }
  }
});

test("an empty world resolves to no resident chunks", () => {
  assert.deepEqual(residentForestChunkIndices(0, null, 0), []);
  assert.deepEqual(residentForestChunkIndices(0, null, 0, 3), []);
});

test("chunk indices follow the rail backwards from the gate origin", () => {
  assert.equal(forestChunkIndexForZ(FOREST_CHUNK_ORIGIN_Z, 9), 0);
  assert.equal(
    forestChunkIndexForZ(FOREST_CHUNK_ORIGIN_Z - FOREST_CHUNK_SPACING, 9),
    1,
  );
  assert.equal(
    forestChunkIndexForZ(FOREST_CHUNK_ORIGIN_Z - FOREST_CHUNK_SPACING * 3.4, 9),
    3,
  );
});

test("chunk indices clamp to the authored chunk range", () => {
  assert.equal(forestChunkIndexForZ(FOREST_CHUNK_ORIGIN_Z + 400, 9), 0);
  assert.equal(forestChunkIndexForZ(FOREST_CHUNK_ORIGIN_Z - 4_000, 9), 8);
});

test("grouping buckets every placement exactly once, keeping order", () => {
  const at = (z: number, tint: number) => ({
    pathOffset: 0,
    position: [0, 0, z] as const,
    rotation: [0, 0, 0] as const,
    scale: 1,
    tint,
    windPhase: 0,
  });
  const placements = [
    at(FOREST_CHUNK_ORIGIN_Z, 1),
    at(FOREST_CHUNK_ORIGIN_Z - FOREST_CHUNK_SPACING * 2, 2),
    at(FOREST_CHUNK_ORIGIN_Z - 0.4, 3),
    at(FOREST_CHUNK_ORIGIN_Z - FOREST_CHUNK_SPACING * 2 - 0.2, 4),
  ];

  const chunks = groupForestPlacementsByChunk(placements, 4);

  assert.equal(chunks.length, 4);
  assert.deepEqual(chunks[0]!.map(({ tint }) => tint), [1, 3]);
  assert.deepEqual(chunks[2]!.map(({ tint }) => tint), [2, 4]);
  assert.equal(
    chunks.reduce((total, chunk) => total + chunk.length, 0),
    placements.length,
  );
});

test("grouping a zero-chunk world yields no buckets", () => {
  assert.deepEqual(groupForestPlacementsByChunk([], 0), []);
});

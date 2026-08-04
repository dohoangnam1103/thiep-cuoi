import type {
  ForestFarTreePlacement,
  ForestTreePlacement,
} from "../forest-world-data";
import {
  FOREST_CHUNK_SPACING,
  FOREST_TREE_CHUNK_RESIDENCY_RADII,
  groupForestPlacementsByChunk,
  residentForestChunkIndices,
} from "./forest-environment-chunks";
import { selectForestLod, type ForestLod, type ForestLodTier } from "./forest-lod-policy";

export type ForestConiferChunkPlan = {
  readonly farTrees: readonly ForestFarTreePlacement[];
  readonly heroLod: ForestLod;
  readonly heroTrees: readonly ForestTreePlacement[];
  readonly index: number;
  readonly midLod: ForestLod;
  readonly midTrees: readonly ForestTreePlacement[];
};

export type ForestConiferLodTreeCounts = {
  readonly hero: number;
  readonly impostor: number;
  readonly mid: number;
};

export type ForestConiferChunkPlanInput = {
  readonly activeIndex: number;
  readonly chunkCount: number;
  readonly farTrees?: readonly ForestFarTreePlacement[];
  readonly heroTrees: readonly ForestTreePlacement[];
  readonly midTrees: readonly ForestTreePlacement[];
  readonly targetIndex: number | null;
  readonly tier: ForestLodTier;
};

/**
 * Resolves which conifer chunks are mounted and at which LOD, so the renderer
 * and the diagnostics reader describe the same scene instead of each deriving
 * residency on its own. Pure and cheap: one bucketing pass over the authored
 * placements plus one LOD decision per resident chunk.
 */
export function planForestConiferChunks({
  activeIndex,
  chunkCount,
  farTrees = [],
  heroTrees,
  midTrees,
  targetIndex,
  tier,
}: ForestConiferChunkPlanInput): readonly ForestConiferChunkPlan[] {
  const heroChunks = groupForestPlacementsByChunk(heroTrees, chunkCount);
  const midChunks = groupForestPlacementsByChunk(midTrees, chunkCount);
  const farChunks = groupForestPlacementsByChunk(farTrees, chunkCount);
  const referenceIndex = targetIndex ?? activeIndex;

  return Object.freeze(
    residentForestChunkIndices(
      activeIndex,
      targetIndex,
      chunkCount,
      FOREST_TREE_CHUNK_RESIDENCY_RADII[tier],
    ).map(
      (index): ForestConiferChunkPlan => {
        const heroLod = selectForestLod({
          distance: Math.abs(index - referenceIndex) * FOREST_CHUNK_SPACING,
          previous: null,
          tier,
        });

        return Object.freeze({
          // Far trees only ever supply the silhouette band behind the mid
          // forest, so they stay on the single-card impostor tier at every
          // distance — promoting them would multiply cards for trees the guest
          // reads as a wall.
          farTrees: farChunks[index] ?? [],
          heroLod,
          // Mid trees are always one band further out than the hero band, which
          // is what keeps the silhouette cheap behind the hero canopies.
          heroTrees: heroChunks[index] ?? [],
          index,
          midLod: heroLod === "hero" ? "mid" : "impostor",
          midTrees: midChunks[index] ?? [],
        });
      },
    ),
  );
}

export function countForestConiferLodTrees(
  plans: readonly ForestConiferChunkPlan[],
): ForestConiferLodTreeCounts {
  const counts = { hero: 0, impostor: 0, mid: 0 };

  for (const plan of plans) {
    counts[plan.heroLod] += plan.heroTrees.length;
    counts[plan.midLod] += plan.midTrees.length;
    counts.impostor += plan.farTrees.length;
  }

  return Object.freeze(counts);
}

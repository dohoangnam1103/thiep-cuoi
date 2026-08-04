/**
 * Chunks are laid out backwards along the rail: chunk 0 sits at the gate and
 * every later chunk is one spacing further into the forest (more negative z).
 */
export const FOREST_CHUNK_ORIGIN_Z = 8;
export const FOREST_CHUNK_SPACING = 8.5;

/**
 * How many chunks either side of the guest carry conifers.
 *
 * This is what sets how far down the corridor the forest still has trunks
 * rather than backdrop. At one chunk the wall ended ~17 m ahead, which read as
 * a thin copse; three chunks reach ~34 m, past the desktop impostor band, so
 * the corridor stays closed. Cost here is draw calls (one trunk plus up to four
 * branch-cell draws per band per chunk), not fill rate — distant cards cover
 * few pixels — so the mobile tier keeps a narrower window purely to stay inside
 * its call budget.
 */
export const FOREST_TREE_CHUNK_RESIDENCY_RADII = Object.freeze({
  desktop: 3,
  mobile: 2,
  reduced: 1,
});

/**
 * Undergrowth stays at one chunk regardless of tier. Grass, ferns and flowers
 * are the heaviest alpha-tested layer in the scene and they only read within a
 * few metres of the camera, so widening their window buys nothing visible and
 * multiplies the fill rate that decides the frame time.
 */
export const FOREST_UNDERGROWTH_CHUNK_RESIDENCY_RADIUS = 1;

type ForestChunkable = {
  readonly position: readonly [number, number, number];
};

export function forestChunkIndexForZ(z: number, chunkCount: number): number {
  const raw = Math.round((FOREST_CHUNK_ORIGIN_Z - z) / FOREST_CHUNK_SPACING);
  return Math.max(0, Math.min(chunkCount - 1, raw));
}

/**
 * Buckets placements by the chunk that owns their z, preserving authored order
 * inside each bucket so instance ordering stays deterministic across reloads.
 */
export function groupForestPlacementsByChunk<Placement extends ForestChunkable>(
  placements: readonly Placement[],
  chunkCount: number,
): readonly (readonly Placement[])[] {
  if (chunkCount <= 0) return Object.freeze([]);

  const chunks: Placement[][] = Array.from({ length: chunkCount }, () => []);
  for (const placement of placements) {
    chunks[forestChunkIndexForZ(placement.position[2], chunkCount)]!
      .push(placement);
  }
  return chunks;
}

export function residentForestChunkIndices(
  activeIndex: number,
  targetIndex: number | null,
  chunkCount: number,
  radius = FOREST_UNDERGROWTH_CHUNK_RESIDENCY_RADIUS,
): readonly number[] {
  if (chunkCount <= 0) return Object.freeze([]);

  const lastIndex = chunkCount - 1;
  const span = Math.max(0, Math.floor(radius));
  const resident = new Set<number>();

  for (const center of [activeIndex, targetIndex]) {
    if (center === null) continue;
    const clampedCenter = Math.min(Math.max(center, 0), lastIndex);
    for (let offset = -span; offset <= span; offset += 1) {
      const index = clampedCenter + offset;
      if (index < 0 || index > lastIndex) continue;
      resident.add(index);
    }
  }

  // A hop long enough that the two neighbourhoods no longer touch would
  // otherwise mount the whole rail between them. Keep both ends instead: the
  // departure chunk the guest is leaving and the arrival chunk they will settle
  // in, each with the chunks immediately along the direction of travel, so the
  // corridor stays closed at both ends without paying for the middle.
  if (targetIndex !== null && Math.abs(targetIndex - activeIndex) > span * 2) {
    const clampedActive = Math.min(Math.max(activeIndex, 0), lastIndex);
    const clampedTarget = Math.min(Math.max(targetIndex, 0), lastIndex);
    const direction = clampedTarget > clampedActive ? 1 : -1;
    resident.clear();
    for (let step = 0; step <= span; step += 1) {
      for (const index of [
        clampedActive + step * direction,
        clampedTarget - step * direction,
      ]) {
        if (index < 0 || index > lastIndex) continue;
        resident.add(index);
      }
    }
  }

  return Object.freeze([...resident].sort((first, second) => first - second));
}

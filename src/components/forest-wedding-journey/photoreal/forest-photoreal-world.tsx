"use client";

import { type MutableRefObject } from "react";

import type { ForestJourneyCueState } from "../forest-cue-state";
import type {
  ForestWorldPlacements,
  ForestWorldQualityTier,
} from "../forest-world-data";
import { ForestPhotorealBackdrop } from "./forest-backdrop";
import { ForestPhotorealLighting } from "./forest-lighting";
import { useForestPhotorealTextures } from "./forest-photoreal-assets";
import { ForestPhotorealTerrain } from "./forest-terrain";
import { ForestPhotorealTreeLayers } from "./forest-tree-layers";
import { ForestPhotorealUndergrowth } from "./forest-undergrowth";

export type ForestPhotorealWorldProps = {
  readonly activeIndex: number;
  readonly cueRef: MutableRefObject<ForestJourneyCueState>;
  readonly placements: ForestWorldPlacements;
  readonly qualityTier: ForestWorldQualityTier;
  readonly reducedMotion: boolean;
  readonly targetIndex: number | null;
};

/**
 * Suspends until every blocking entry texture resolves, so the caller must
 * mount it inside both a Suspense boundary and a photoreal asset boundary.
 */
export function ForestPhotorealWorld({
  activeIndex,
  cueRef,
  placements,
  qualityTier,
  reducedMotion,
  targetIndex,
}: ForestPhotorealWorldProps) {
  const textures = useForestPhotorealTextures();

  return (
    <group name="forest-photoreal-world">
      <ForestPhotorealLighting />
      <ForestPhotorealBackdrop
        pathCenterline={placements.pathCenterline}
        texture={textures.backdrop}
      />
      <ForestPhotorealTerrain
        armMap={textures.groundArm}
        colorMap={textures.groundColor}
        normalMap={textures.groundNormal}
        pathCenterline={placements.pathCenterline}
      />
      <ForestPhotorealTreeLayers
        activeIndex={activeIndex}
        armMap={textures.coniferArm}
        chunkCount={placements.clearings.length}
        colorMap={textures.coniferColor}
        cueRef={cueRef}
        farTrees={placements.farTrees}
        heroTrees={placements.heroTrees}
        midTrees={placements.midTrees}
        normalMap={textures.coniferNormal}
        qualityTier={qualityTier}
        reducedMotion={reducedMotion}
        targetIndex={targetIndex}
      />
      <ForestPhotorealUndergrowth
        activeIndex={activeIndex}
        chunkCount={placements.clearings.length}
        coniferArm={textures.coniferArm}
        coniferColor={textures.coniferColor}
        coniferNormal={textures.coniferNormal}
        cueRef={cueRef}
        grass={placements.grass}
        groundArm={textures.groundArm}
        groundColor={textures.groundColor}
        groundNormal={textures.groundNormal}
        reducedMotion={reducedMotion}
        roots={placements.roots}
        shrubs={placements.shrubs}
        stones={placements.stones}
        targetIndex={targetIndex}
        wildflowers={placements.wildflowers}
      />
    </group>
  );
}

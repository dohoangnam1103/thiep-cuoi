"use client";

import { useEffect, type CSSProperties } from "react";

import {
  dalatJourneyDefinition,
  type DalatJourneyCheckpoint,
} from "@/data/dalat-journey";
import { cn } from "@/lib/utils";

import styles from "./dalat-journey.module.css";
import {
  DALAT_BACKDROP_DEPTH_LAYERS,
  getDalatBackdropLayerOffset,
  type DalatBackdropDepthLayer,
} from "./dalat-backdrop-config";

export {
  DALAT_BACKDROP_DEPTH_LAYERS,
  getDalatBackdropAssetPaths,
  getDalatBackdropBlend,
  getDalatBackdropCoverScale,
  getDalatBackdropLayerOffset,
} from "./dalat-backdrop-config";

const BACKDROP_CLASS_BY_ID = {
  mistGate: styles.artworkMistGate,
  memoryPines: styles.artworkMemoryPines,
  timeGlasshouse: styles.artworkTimeGlasshouse,
  lakePavilion: styles.artworkLakePavilion,
  wishValley: styles.artworkWishValley,
} satisfies Record<DalatJourneyCheckpoint["id"], string>;

const DEPTH_LAYER_CLASS_BY_ID = {
  far: styles.artworkDepthFar,
  mid: styles.artworkDepthMid,
  near: styles.artworkDepthNear,
} satisfies Record<DalatBackdropDepthLayer["id"], string>;

export type DalatArtworkBackdropProps = {
  activeCheckpoint: DalatJourneyCheckpoint;
  look: {
    pitchDegrees: number;
    yawDegrees: number;
  };
  reducedMotion: boolean;
  targetCheckpoint: DalatJourneyCheckpoint | null;
};

type ArtworkPlateProps = {
  checkpoint: DalatJourneyCheckpoint;
  direction: 1 | -1;
  isTarget: boolean;
  look: DalatArtworkBackdropProps["look"];
  reducedMotion: boolean;
  targetDuration: number;
};

function getCheckpointIndex(checkpoint: DalatJourneyCheckpoint): number {
  return dalatJourneyDefinition.checkpoints.findIndex(
    ({ id }) => id === checkpoint.id,
  );
}

function getTravelDirection(
  activeCheckpoint: DalatJourneyCheckpoint,
  targetCheckpoint: DalatJourneyCheckpoint | null,
): 1 | -1 {
  if (targetCheckpoint === null) return 1;
  return getCheckpointIndex(targetCheckpoint) >= getCheckpointIndex(activeCheckpoint)
    ? 1
    : -1;
}

function layerStyle(
  checkpoint: DalatJourneyCheckpoint,
  look: DalatArtworkBackdropProps["look"],
  layer: DalatBackdropDepthLayer,
): CSSProperties {
  const offset = getDalatBackdropLayerOffset(look, layer);

  return {
    backgroundImage: `url("${checkpoint.fallbackImage}")`,
    ["--journey-depth-scale" as string]: layer.scale,
    ["--journey-depth-x" as string]: `${offset.x}px`,
    ["--journey-depth-y" as string]: `${offset.y}px`,
  };
}

function ArtworkPlate({
  checkpoint,
  direction,
  isTarget,
  look,
  reducedMotion,
  targetDuration,
}: ArtworkPlateProps) {
  const layers = reducedMotion
    ? DALAT_BACKDROP_DEPTH_LAYERS.slice(0, 1)
    : DALAT_BACKDROP_DEPTH_LAYERS;

  return (
    <div
      aria-hidden="true"
      className={cn(
        styles.artworkPlate,
        BACKDROP_CLASS_BY_ID[checkpoint.id],
        isTarget
          ? reducedMotion
            ? styles.artworkPlateTargetReduced
            : styles.artworkPlateTargetNormal
          : targetDuration > 0
            ? styles.artworkPlateActiveTravel
            : null,
      )}
      data-backdrop-layer={isTarget ? "target" : "active"}
      data-checkpoint-state={isTarget ? "target" : "active"}
      data-depth-layer-count={layers.length}
      data-testid={`dalat-artwork-plate-${isTarget ? "target" : "active"}`}
      style={{
        ["--journey-target-duration" as string]: `${targetDuration}ms`,
        ["--journey-travel-direction" as string]: direction,
        ["--journey-travel-shift" as string]: `${direction * 34}px`,
        ["--journey-travel-start" as string]: `${direction * -12}%`,
        ["--journey-travel-mid" as string]: `${direction * -2}%`,
        ["--journey-travel-end" as string]: `${direction * 13}%`,
        backgroundImage: `url("${checkpoint.fallbackImage}")`,
      }}
    >
      {layers.map((layer) => (
        <div
          className={cn(
            styles.artworkDepthLayer,
            DEPTH_LAYER_CLASS_BY_ID[layer.id],
          )}
          data-depth-layer={layer.id}
          key={layer.id}
          style={layerStyle(checkpoint, look, layer)}
        />
      ))}
    </div>
  );
}

export function DalatArtworkBackdrop({
  activeCheckpoint,
  look,
  reducedMotion,
  targetCheckpoint,
}: DalatArtworkBackdropProps) {
  const targetDuration = reducedMotion
    ? dalatJourneyDefinition.reducedDurationMs
    : targetCheckpoint?.travelDurationMs ?? 0;
  const direction = getTravelDirection(activeCheckpoint, targetCheckpoint);

  useEffect(() => {
    const checkpoints = [activeCheckpoint, targetCheckpoint].filter(
      (checkpoint): checkpoint is DalatJourneyCheckpoint => checkpoint !== null,
    );
    const uniqueImages = new Map(
      checkpoints.map((checkpoint) => [checkpoint.id, checkpoint.fallbackImage]),
    );
    const images = Array.from(uniqueImages.values()).map((source) => {
      const image = new window.Image();
      image.decoding = "async";
      image.src = source;
      return image;
    });

    return () => {
      images.forEach((image) => {
        image.src = "";
      });
    };
  }, [activeCheckpoint, targetCheckpoint]);

  return (
    <div
      aria-hidden="true"
      className={styles.artworkBackdrop}
      data-backdrop-checkpoint={activeCheckpoint.id}
      data-backdrop-state={targetCheckpoint ? "travelling" : "settled"}
      data-depth-mode={reducedMotion ? "static" : "layered-2.5d"}
      data-depth-layer-count={reducedMotion ? 1 : DALAT_BACKDROP_DEPTH_LAYERS.length}
      data-testid="dalat-journey-artwork-backdrop"
    >
      <ArtworkPlate
        checkpoint={activeCheckpoint}
        direction={direction}
        isTarget={false}
        look={look}
        reducedMotion={reducedMotion}
        targetDuration={targetCheckpoint ? targetDuration : 0}
      />
      {targetCheckpoint ? (
        <ArtworkPlate
          checkpoint={targetCheckpoint}
          direction={direction}
          isTarget
          look={look}
          reducedMotion={reducedMotion}
          targetDuration={targetDuration}
        />
      ) : null}
      {targetCheckpoint ? (
        <div
          className={cn(
            styles.artworkTravelMist,
            reducedMotion && styles.artworkTravelMistReduced,
          )}
          data-transition-mask="active"
        />
      ) : null}
      <div className={styles.artworkVignette} />
    </div>
  );
}

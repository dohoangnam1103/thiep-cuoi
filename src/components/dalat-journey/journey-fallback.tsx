"use client";

import { useEffect, useRef, useState } from "react";

import type {
  DalatJourneyCheckpoint,
  DalatJourneyCopy,
} from "@/data/dalat-journey";

import styles from "./dalat-journey.module.css";
import { DalatArtworkBackdrop } from "./dalat-backdrop";

export type JourneyFallbackProps = {
  activeCheckpoint: DalatJourneyCheckpoint;
  copy: DalatJourneyCopy;
  look: { pitchDegrees: number; yawDegrees: number };
  preloadCheckpoint: DalatJourneyCheckpoint | null;
  reducedMotion: boolean;
  targetCheckpoint: DalatJourneyCheckpoint | null;
};

export function JourneyFallback({
  activeCheckpoint,
  copy,
  look,
  preloadCheckpoint,
  reducedMotion,
  targetCheckpoint,
}: JourneyFallbackProps) {
  const stageRef = useRef<HTMLElement>(null);
  const [failedImageIds, setFailedImageIds] = useState<ReadonlySet<string>>(
    () => new Set(),
  );

  useEffect(() => {
    const images = Array.from(
      new Map(
        [activeCheckpoint, preloadCheckpoint]
          .filter(
            (checkpoint): checkpoint is DalatJourneyCheckpoint =>
              checkpoint !== null,
          )
          .map((checkpoint) => [checkpoint.id, checkpoint]),
      ).values(),
    );
    if (images.length === 0) {
      return;
    }
    let cancelled = false;
    for (const checkpoint of images) {
      const image = new Image();
      image.addEventListener("load", () => {
        if (cancelled) return;
        setFailedImageIds((current) => {
          if (!current.has(checkpoint.id)) return current;
          const next = new Set(current);
          next.delete(checkpoint.id);
          return next;
        });
      });
      image.addEventListener("error", () => {
        if (cancelled) return;
        setFailedImageIds((current) => {
          if (current.has(checkpoint.id)) return current;
          return new Set(current).add(checkpoint.id);
        });
      });
      image.src = checkpoint.fallbackImage;
    }
    return () => {
      cancelled = true;
    };
  }, [activeCheckpoint, preloadCheckpoint]);

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    stage.style.setProperty("--journey-look-x", `${-look.yawDegrees * 2}px`);
    stage.style.setProperty("--journey-look-y", `${look.pitchDegrees * 2}px`);
  }, [look]);

  const displayedCheckpoint = targetCheckpoint ?? activeCheckpoint;
  const displayedCopy = copy.checkpoints[displayedCheckpoint.id];
  const imageFailed = failedImageIds.has(displayedCheckpoint.id);

  return (
    <section
      aria-label={displayedCopy.name}
      className={styles.fallbackStage}
      data-checkpoint={displayedCheckpoint.id}
      data-testid="dalat-journey-fallback"
      ref={stageRef}
    >
      <DalatArtworkBackdrop
        activeCheckpoint={activeCheckpoint}
        look={look}
        reducedMotion={reducedMotion}
        targetCheckpoint={targetCheckpoint}
      />
      {imageFailed ? (
        <p className={styles.fallbackNotice} role="status">
          {copy.fallbackNotice}
        </p>
      ) : null}
    </section>
  );
}

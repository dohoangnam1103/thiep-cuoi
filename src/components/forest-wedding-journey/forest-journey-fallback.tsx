"use client";

import Image from "next/image";
import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";

import {
  type ForestJourneyContent,
  type ForestJourneyScene,
} from "@/data/forest-wedding-journey";

import {
  ForestSceneContent,
  type ForestJourneySceneNames,
  type ForestPhotoStatus,
  type ForestSceneLabels,
} from "./forest-scene-content";
import {
  ForestInteractiveSceneContent,
  type ForestJourneyLocalInteractions,
} from "./forest-interactive-scenes";
import { residentSceneIndices } from "./forest-scene-residency";
import styles from "./forest-wedding-journey.module.css";

const FAR_FOLIAGE_CELLS = [0, 3, 5, 6, 2] as const;
const MID_FOLIAGE_CELLS = [1, 4, 7, 0, 6, 3, 5] as const;
const WILDFLOWER_CELLS = [0, 2, 5, 7, 9, 10, 4] as const;
const PETAL_CELLS = [0, 3, 5, 7, 10, 12, 14, 15] as const;

export type ForestJourneyFallbackProps = {
  readonly content: ForestJourneyContent;
  readonly currentIndex: number;
  readonly inputEnabled: boolean;
  readonly interactions: ForestJourneyLocalInteractions;
  readonly look: {
    readonly pitchDegrees: number;
    readonly yawDegrees: number;
  };
  readonly labels: ForestSceneLabels;
  readonly onReady: () => void;
  readonly reducedMotion: boolean;
  readonly sceneNames: ForestJourneySceneNames;
  readonly scenes: readonly ForestJourneyScene[];
  readonly targetIndex: number | null;
  readonly travelling: boolean;
};

function FallbackPhysicalSurface({
  active,
  content,
  interactions,
  labels,
  scene,
  sceneName,
  settled,
}: {
  readonly active: boolean;
  readonly content: ForestJourneyContent;
  readonly interactions: ForestJourneyLocalInteractions;
  readonly labels: ForestSceneLabels;
  readonly scene: ForestJourneyScene;
  readonly sceneName: string;
  readonly settled: boolean;
}) {
  const [photoStatus, setPhotoStatus] = useState<ForestPhotoStatus>("loading");
  const interactive = active && settled;
  const galleryPhoto = scene.photo && photoStatus !== "error" ? (
    <Image
      alt=""
      className={styles.fallbackPhoto}
      height={960}
      onError={() => setPhotoStatus("error")}
      onLoad={() => setPhotoStatus("ready")}
      src={scene.photo.src}
      width={720}
    />
  ) : undefined;

  return (
    <article
      aria-hidden={!interactive}
      className={styles.fallbackPhysicalSurface}
      data-scene-type={scene.type}
      data-forest-visible={active ? "true" : "false"}
      data-testid="forest-fallback-physical-surface"
      inert={interactive ? undefined : true}
    >
      <ForestSceneContent
        active={active}
        content={content}
        galleryPhoto={galleryPhoto}
        interactiveContent={(
          <ForestInteractiveSceneContent
            content={content}
            interactions={interactions}
            labels={labels}
            sceneType={scene.type}
          />
        )}
        labels={labels}
        photoStatus={photoStatus}
        rendererMode="fallback"
        scene={scene}
        sceneName={sceneName}
        settled={settled}
      />
    </article>
  );
}

export function ForestJourneyFallback({
  content,
  currentIndex,
  inputEnabled,
  interactions,
  labels,
  look,
  onReady,
  reducedMotion,
  sceneNames,
  scenes,
  targetIndex,
  travelling,
}: ForestJourneyFallbackProps) {
  const stageRef = useRef<HTMLElement | null>(null);
  const reportedReadyRef = useRef(false);
  const displayedIndex = targetIndex ?? currentIndex;
  const displayedScene = scenes[displayedIndex] ?? scenes[currentIndex] ?? scenes[0];
  const residentIndices = residentSceneIndices(currentIndex, targetIndex, scenes.length);

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;

    const yaw = look.yawDegrees;
    const pitch = look.pitchDegrees;
    stage.style.setProperty("--fallback-far-x", `${yaw * -0.12}px`);
    stage.style.setProperty("--fallback-far-y", `${pitch * 0.08}px`);
    stage.style.setProperty("--fallback-mid-x", `${yaw * -0.28}px`);
    stage.style.setProperty("--fallback-mid-y", `${pitch * 0.18}px`);
    stage.style.setProperty("--fallback-grass-x", `${yaw * -0.46}px`);
    stage.style.setProperty("--fallback-grass-y", `${pitch * 0.3}px`);
    stage.style.setProperty("--fallback-near-x", `${yaw * -0.72}px`);
    stage.style.setProperty("--fallback-near-y", `${pitch * 0.48}px`);
  }, [look.pitchDegrees, look.yawDegrees]);

  useLayoutEffect(() => {
    let frame = window.requestAnimationFrame(() => {
      if (!stageRef.current || reportedReadyRef.current) return;
      reportedReadyRef.current = true;
      onReady();
    });

    return () => {
      window.cancelAnimationFrame(frame);
      frame = 0;
      reportedReadyRef.current = false;
    };
  }, [onReady]);

  if (!displayedScene) return null;

  const sceneName = sceneNames[displayedScene.type];

  return (
    <section
      aria-label={sceneName}
      className={styles.fallbackStage}
      data-reduced-motion={reducedMotion ? "true" : "false"}
      data-scene={displayedScene.type}
      data-scene-id={displayedScene.id}
      data-testid="forest-journey-fallback"
      data-travelling={travelling ? "true" : "false"}
      ref={stageRef}
    >
      <div
        aria-hidden="true"
        className={styles.fallbackFarTrees}
        data-fallback-band="far-trees"
      >
        {FAR_FOLIAGE_CELLS.map((cell, index) => (
          <span
            aria-hidden="true"
            className={styles.fallbackFoliageSprite}
            data-atlas-cell={cell}
            data-fallback-atlas="foliage"
            key={`${cell}-${index}`}
          />
        ))}
      </div>
      <div
        aria-hidden="true"
        className={styles.fallbackMidTrees}
        data-fallback-band="mid-trees"
      >
        {MID_FOLIAGE_CELLS.map((cell, index) => (
          <span
            aria-hidden="true"
            className={styles.fallbackFoliageSprite}
            data-atlas-cell={cell}
            data-fallback-atlas="foliage"
            key={`${cell}-${index}`}
          />
        ))}
      </div>
      <div
        aria-hidden="true"
        className={styles.fallbackGrass}
        data-fallback-band="grass"
      >
        {WILDFLOWER_CELLS.map((cell, index) => (
          <span
            aria-hidden="true"
            className={styles.fallbackWildflowerSprite}
            data-atlas-cell={cell}
            data-fallback-atlas="wildflower"
            key={`${cell}-${index}`}
          />
        ))}
      </div>
      <div
        aria-hidden="true"
        className={styles.fallbackNearFoliage}
        data-fallback-band="near-foliage"
      >
        {PETAL_CELLS.map((cell, index) => (
          <span
            aria-hidden="true"
            className={styles.fallbackPetalSprite}
            data-atlas-cell={cell}
            data-fallback-atlas="petal"
            key={`${cell}-${index}`}
          />
        ))}
      </div>
      <div
        aria-hidden="true"
        className={`${styles.fallbackGestureSurface}${
          inputEnabled ? ` ${styles.fallbackGestureSurfaceActive}` : ""
        }`}
        data-testid="forest-journey-gesture-surface"
      />
      <div className={styles.fallbackResidentScenes}>
        {residentIndices.map((index) => {
          const scene = scenes[index];
          if (!scene || scene.type === "cover-gate") return null;

          return (
            <FallbackPhysicalSurface
              active={index === displayedIndex}
              content={content}
              interactions={interactions}
              key={scene.id}
              labels={labels}
              scene={scene}
              sceneName={sceneNames[scene.type]}
              settled={!travelling}
            />
          );
        })}
      </div>
    </section>
  );
}

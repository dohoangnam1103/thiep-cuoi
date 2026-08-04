"use client";

/*
 * Twin file: src/components/forest-wedding-journey/forest-journey-fallback.tsx
 *
 * The DOM fallback shown when WebGL is unavailable or the canvas fails. The
 * structure — the parallax stage, the eight `--fallback-*` look variables, the
 * rAF ready report, the gesture surface and the resident-scene window — is the
 * forest twin's, unchanged.
 *
 * What differs: the forest paints four depth bands from a foliage, wildflower
 * and petal sprite atlas. This lab paints a sky, a sea, a wet-sand sheen and a
 * dune-grass silhouette entirely in CSS gradients, because the WebGL world's
 * decoded-texture budget is already at 62.9 MiB of its 64 MiB ceiling and a
 * sprite atlas only the fallback would read is not worth a byte of it. So there
 * are no atlas-cell arrays here and each band is a single empty element.
 */

import Image from "next/image";
import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";

import {
  type BeachJourneyContent,
  type BeachJourneyScene,
} from "@/data/beach-wedding-journey";

import {
  BeachSceneContent,
  type BeachJourneySceneNames,
  type BeachPhotoStatus,
  type BeachSceneLabels,
} from "./beach-scene-content";
import {
  BeachInteractiveSceneContent,
  type BeachJourneyLocalInteractions,
} from "./beach-interactive-scenes";
import { residentSceneIndices } from "./beach-scene-residency";
import styles from "./beach-wedding-journey.module.css";

export type BeachJourneyFallbackProps = {
  readonly content: BeachJourneyContent;
  readonly currentIndex: number;
  readonly inputEnabled: boolean;
  readonly interactions: BeachJourneyLocalInteractions;
  readonly look: {
    readonly pitchDegrees: number;
    readonly yawDegrees: number;
  };
  readonly labels: BeachSceneLabels;
  readonly onReady: () => void;
  readonly reducedMotion: boolean;
  readonly sceneNames: BeachJourneySceneNames;
  readonly scenes: readonly BeachJourneyScene[];
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
  readonly content: BeachJourneyContent;
  readonly interactions: BeachJourneyLocalInteractions;
  readonly labels: BeachSceneLabels;
  readonly scene: BeachJourneyScene;
  readonly sceneName: string;
  readonly settled: boolean;
}) {
  const [photoStatus, setPhotoStatus] = useState<BeachPhotoStatus>("loading");
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
      data-beach-visible={active ? "true" : "false"}
      data-testid="beach-fallback-physical-surface"
      inert={interactive ? undefined : true}
    >
      <BeachSceneContent
        active={active}
        content={content}
        galleryPhoto={galleryPhoto}
        interactiveContent={(
          <BeachInteractiveSceneContent
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

export function BeachJourneyFallback({
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
}: BeachJourneyFallbackProps) {
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
    stage.style.setProperty("--fallback-sand-x", `${yaw * -0.46}px`);
    stage.style.setProperty("--fallback-sand-y", `${pitch * 0.3}px`);
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
      data-testid="beach-journey-fallback"
      data-travelling={travelling ? "true" : "false"}
      ref={stageRef}
    >
      <div
        aria-hidden="true"
        className={styles.fallbackSky}
        data-fallback-band="sky"
      />
      <div
        aria-hidden="true"
        className={styles.fallbackSea}
        data-fallback-band="sea"
      />
      <div
        aria-hidden="true"
        className={styles.fallbackWetSand}
        data-fallback-band="wet-sand"
      />
      <div
        aria-hidden="true"
        className={styles.fallbackDuneGrass}
        data-fallback-band="dune-grass"
      />
      <div
        aria-hidden="true"
        className={`${styles.fallbackGestureSurface}${
          inputEnabled ? ` ${styles.fallbackGestureSurfaceActive}` : ""
        }`}
        data-testid="beach-journey-gesture-surface"
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

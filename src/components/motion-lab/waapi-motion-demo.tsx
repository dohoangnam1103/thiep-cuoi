"use client";

import { useEffect, useRef, useState } from "react";

import { domMotionRecipe } from "./dom-motion-recipes";
import { MotionArtwork } from "./motion-artwork";
import type {
  MotionActorElement,
  MotionActorMap,
  MotionActorName,
  MotionDemoProps,
} from "./motion-demo-types";

function createActorMap(): MotionActorMap {
  return {
    frame: null,
    hero: null,
    accentLeft: null,
    accentRight: null,
    reveal: null,
    ribbon: null,
  };
}

function concealedActorElements(actors: MotionActorMap): MotionActorElement[] {
  return (Object.keys(actors) as MotionActorName[]).flatMap((actor) => {
    if (actor === "reveal") return [];
    const element = actors[actor];
    return element ? [element] : [];
  });
}

function segmentEasedKeyframes(
  keyframes: Keyframe[],
  easing: string | undefined,
): Keyframe[] {
  if (!easing) return keyframes;
  return keyframes.map((keyframe, index) => (
    index === keyframes.length - 1
      ? keyframe
      : { ...keyframe, easing }
  ));
}

export function WaapiMotionDemo({
  choreography,
  copy,
  reducedMotion,
  runId,
}: MotionDemoProps) {
  const actorsRef = useRef<MotionActorMap>(createActorMap());
  const [completedRun, setCompletedRun] = useState<string | null>(null);
  const motionRun = `${choreography}:${reducedMotion}:${runId}`;

  useEffect(() => {
    let mounted = true;
    const concealedActors = reducedMotion
      ? concealedActorElements(actorsRef.current)
      : [];
    const originalOpacities = concealedActors.map((element) => element.style.opacity);

    concealedActors.forEach((element) => {
      element.style.opacity = "0";
    });

    const animations = domMotionRecipe(choreography, reducedMotion).flatMap(
      ({ actor, keyframes, options }) => {
        const element = actorsRef.current[actor];
        if (!element) return [];
        return [element.animate(
          segmentEasedKeyframes(keyframes, options.easing),
          { ...options, easing: "linear" },
        )];
      },
    );

    void Promise.all(animations.map((animation) => animation.finished.catch(() => undefined)))
      .then(() => {
        if (mounted) setCompletedRun(motionRun);
      });

    return () => {
      mounted = false;
      animations.forEach((animation) => animation.cancel());
      concealedActors.forEach((element, index) => {
        element.style.opacity = originalOpacities[index] ?? "";
      });
    };
  }, [choreography, motionRun, reducedMotion, runId]);

  return (
    <div
      className="size-full"
      data-motion-choreography={choreography}
      data-motion-engine="waapi"
      data-motion-state={completedRun === motionRun ? "complete" : "running"}
      data-reduced-motion={reducedMotion ? "true" : "false"}
    >
      <MotionArtwork
        choreography={choreography}
        copy={copy}
        onActorRef={(name: MotionActorName, element) => {
          actorsRef.current[name] = element;
        }}
      />
    </div>
  );
}

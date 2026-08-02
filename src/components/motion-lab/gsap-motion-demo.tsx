"use client";

import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";

import { domMotionRecipe } from "./dom-motion-recipes";
import { MotionArtwork } from "./motion-artwork";
import type {
  MotionActorElement,
  MotionActorMap,
  MotionActorName,
  MotionDemoProps,
} from "./motion-demo-types";

function cubicBezierEase(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
): (progress: number) => number {
  const sample = (t: number, first: number, second: number) => {
    const inverse = 1 - t;
    return 3 * inverse * inverse * t * first
      + 3 * inverse * t * t * second
      + t * t * t;
  };
  const sampleDerivativeX = (t: number) => {
    const inverse = 1 - t;
    return 3 * inverse * inverse * x1
      + 6 * inverse * t * (x2 - x1)
      + 3 * t * t * (1 - x2);
  };

  return (progress: number) => {
    const target = Math.min(1, Math.max(0, progress));
    let parameter = target;

    for (let iteration = 0; iteration < 8; iteration += 1) {
      const error = sample(parameter, x1, x2) - target;
      if (Math.abs(error) < 1e-6) return sample(parameter, y1, y2);
      const derivative = sampleDerivativeX(parameter);
      if (Math.abs(derivative) < 1e-6) break;
      parameter -= error / derivative;
    }

    let lower = 0;
    let upper = 1;
    parameter = target;
    for (let iteration = 0; iteration < 12; iteration += 1) {
      const error = sample(parameter, x1, x2) - target;
      if (Math.abs(error) < 1e-6) break;
      if (error > 0) upper = parameter;
      else lower = parameter;
      parameter = (lower + upper) / 2;
    }

    return sample(parameter, y1, y2);
  };
}

const FULL_MOTION_EASE = cubicBezierEase(0.2, 0.72, 0.2, 1);
const LINEAR_EASE = (progress: number) => progress;

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

function gsapProperties(keyframe: Keyframe): gsap.TweenVars {
  const properties: gsap.TweenVars = {};

  if (typeof keyframe.opacity === "number" || typeof keyframe.opacity === "string") {
    properties.opacity = keyframe.opacity;
  }
  if (typeof keyframe.transform === "string") {
    properties.transform = keyframe.transform;
  }

  return properties;
}

export function GsapMotionDemo({
  choreography,
  copy,
  reducedMotion,
  runId,
}: MotionDemoProps) {
  const actorsRef = useRef<MotionActorMap>(createActorMap());
  const scopeRef = useRef<HTMLDivElement>(null);
  const [completedRun, setCompletedRun] = useState<string | null>(null);
  const motionRun = `${choreography}:${reducedMotion}:${runId}`;

  useEffect(() => {
    const scope = scopeRef.current;
    if (!scope) return;

    let mounted = true;
    let timeline: gsap.core.Timeline | null = null;

    const context = gsap.context(() => {
      const activeTimeline = gsap.timeline({
        onComplete: () => {
          if (mounted) setCompletedRun(motionRun);
        },
      });
      timeline = activeTimeline;

      if (reducedMotion) {
        activeTimeline.set(concealedActorElements(actorsRef.current), { opacity: 0 }, 0);
      }

      domMotionRecipe(choreography, reducedMotion).forEach((recipe) => {
        const element = actorsRef.current[recipe.actor];
        if (!element) return;

        const duration = Number(recipe.options.duration) / 1_000;
        const easing = recipe.options.easing === "linear"
          ? LINEAR_EASE
          : FULL_MOTION_EASE;
        const [firstFrame, ...remainingFrames] = recipe.keyframes;

        if (!firstFrame) return;
        activeTimeline.set(element, gsapProperties(firstFrame), 0);

        remainingFrames.forEach((frame, index) => {
          const previousFrame = recipe.keyframes[index];
          const start = (previousFrame.offset ?? 0) * duration;
          const end = (frame.offset ?? 1) * duration;

          activeTimeline.to(
            element,
            {
              ...gsapProperties(frame),
              duration: end - start,
              ease: easing,
            },
            start,
          );
        });
      });
    }, scope);

    return () => {
      mounted = false;
      timeline?.kill();
      context.revert();
    };
  }, [choreography, motionRun, reducedMotion, runId]);

  return (
    <div
      ref={scopeRef}
      className="size-full"
      data-motion-choreography={choreography}
      data-motion-engine="gsap"
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

import {
  FLOW_DEMO_DURATION_MS,
  FLOW_DEMO_REDUCED_DURATION_MS,
  type FlowDemoChoreography,
} from "@/data/flow-demo-scenes";

import type { MotionActorName } from "./motion-demo-types";

export type ActorAnimation = {
  actor: MotionActorName;
  keyframes: Keyframe[];
  options: KeyframeAnimationOptions;
};

const FULL_MOTION_OPTIONS: KeyframeAnimationOptions = {
  duration: FLOW_DEMO_DURATION_MS,
  easing: "cubic-bezier(0.2, 0.72, 0.2, 1)",
  fill: "both",
};

const REDUCED_MOTION_OPTIONS: KeyframeAnimationOptions = {
  duration: FLOW_DEMO_REDUCED_DURATION_MS,
  easing: "linear",
  fill: "both",
};

function actorAnimation(
  actor: MotionActorName,
  keyframes: Keyframe[],
  options: KeyframeAnimationOptions = FULL_MOTION_OPTIONS,
): ActorAnimation {
  return { actor, keyframes, options };
}

function splitGateRecipe(): ActorAnimation[] {
  return [
    actorAnimation("accentLeft", [
      { offset: 0, opacity: 1, transform: "translateX(0)" },
      { offset: 0.16, opacity: 1, transform: "translateX(0)" },
      { offset: 1, opacity: 0, transform: "translateX(-108%)" },
    ]),
    actorAnimation("accentRight", [
      { offset: 0, opacity: 1, transform: "translateX(0)" },
      { offset: 0.16, opacity: 1, transform: "translateX(0)" },
      { offset: 1, opacity: 0, transform: "translateX(108%)" },
    ]),
    actorAnimation("hero", [
      { offset: 0, opacity: 1, transform: "translate(-50%, -50%) scale(1)" },
      { offset: 0.2, opacity: 1, transform: "translate(-50%, -50%) scale(1)" },
      { offset: 0.72, opacity: 0, transform: "translate(-50%, -50%) scale(1.45)" },
      { offset: 1, opacity: 0, transform: "translate(-50%, -50%) scale(1.45)" },
    ]),
    actorAnimation("reveal", [
      { offset: 0, opacity: 0, transform: "translate(-50%, -50%) scale(0.92)" },
      { offset: 0.45, opacity: 0, transform: "translate(-50%, -50%) scale(0.92)" },
      { offset: 1, opacity: 1, transform: "translate(-50%, -50%) scale(1)" },
    ]),
  ];
}

function irisBloomRecipe(): ActorAnimation[] {
  return [
    actorAnimation("frame", [
      { offset: 0, opacity: 1, transform: "scale(0.72) rotate(-7deg)" },
      { offset: 0.12, opacity: 1, transform: "scale(0.72) rotate(-7deg)" },
      { offset: 0.75, opacity: 0, transform: "scale(1.45) rotate(0deg)" },
      { offset: 1, opacity: 0, transform: "scale(1.45) rotate(0deg)" },
    ]),
    actorAnimation("hero", [
      { offset: 0, opacity: 0.25, transform: "translate(-50%, -50%) scale(0.3)" },
      { offset: 0.38, opacity: 1, transform: "translate(-50%, -50%) scale(1.08)" },
      { offset: 1, opacity: 0, transform: "translate(-50%, -50%) scale(2.1)" },
    ]),
    actorAnimation("accentLeft", [
      { offset: 0, opacity: 0, transform: "translate(-42%, 25%) rotate(-28deg) scale(0.3)" },
      { offset: 0.45, opacity: 0.8, transform: "translate(-18%, 0) rotate(-12deg) scale(0.72)" },
      { offset: 1, opacity: 0, transform: "translate(-74%, -22%) rotate(-40deg) scale(1.15)" },
    ]),
    actorAnimation("accentRight", [
      { offset: 0, opacity: 0, transform: "translate(42%, 25%) rotate(28deg) scale(0.3)" },
      { offset: 0.45, opacity: 0.8, transform: "translate(18%, 0) rotate(12deg) scale(0.72)" },
      { offset: 1, opacity: 0, transform: "translate(74%, -22%) rotate(40deg) scale(1.15)" },
    ]),
    actorAnimation("reveal", [
      { offset: 0, opacity: 0, transform: "translate(-50%, -50%) scale(0.92)" },
      { offset: 0.45, opacity: 0, transform: "translate(-50%, -50%) scale(0.92)" },
      { offset: 1, opacity: 1, transform: "translate(-50%, -50%) scale(1)" },
    ]),
  ];
}

function depthPortalRecipe(): ActorAnimation[] {
  return [
    actorAnimation("frame", [
      { offset: 0, opacity: 0.35, transform: "scale(0.56)" },
      { offset: 0.66, opacity: 1, transform: "scale(1.08)" },
      { offset: 1, opacity: 0, transform: "scale(1.75)" },
    ]),
    actorAnimation("hero", [
      { offset: 0, opacity: 1, transform: "translate(-50%, -50%) scale(0.4)" },
      { offset: 0.72, opacity: 0, transform: "translate(-50%, -50%) scale(2.7)" },
      { offset: 1, opacity: 0, transform: "translate(-50%, -50%) scale(2.7)" },
    ]),
    actorAnimation("accentLeft", [
      { offset: 0, opacity: 0.65, transform: "scale(0.45)" },
      { offset: 1, opacity: 0, transform: "scale(1.4)" },
    ]),
    actorAnimation("accentRight", [
      { offset: 0, opacity: 0.65, transform: "scale(0.45)" },
      { offset: 1, opacity: 0, transform: "scale(1.4)" },
    ]),
    actorAnimation("reveal", [
      { offset: 0, opacity: 0, transform: "translate(-50%, -50%) scale(0.62)" },
      { offset: 0.44, opacity: 0, transform: "translate(-50%, -50%) scale(0.62)" },
      { offset: 1, opacity: 1, transform: "translate(-50%, -50%) scale(1)" },
    ]),
  ];
}

function ribbonSweepRecipe(): ActorAnimation[] {
  return [
    actorAnimation("ribbon", [
      { offset: 0, opacity: 0, transform: "translate(-125%, -50%) rotate(-8deg)" },
      { offset: 0.16, opacity: 1, transform: "translate(-125%, -50%) rotate(-8deg)" },
      { offset: 0.7, opacity: 1, transform: "translate(-17%, -50%) rotate(-8deg)" },
      { offset: 1, opacity: 0, transform: "translate(25%, -50%) rotate(-8deg)" },
    ]),
    actorAnimation("accentLeft", [
      { offset: 0, opacity: 1, transform: "translateX(0)" },
      { offset: 0.22, opacity: 1, transform: "translateX(0)" },
      { offset: 1, opacity: 0, transform: "translateX(-72%)" },
    ]),
    actorAnimation("accentRight", [
      { offset: 0, opacity: 1, transform: "translateX(0)" },
      { offset: 0.22, opacity: 1, transform: "translateX(0)" },
      { offset: 1, opacity: 0, transform: "translateX(72%)" },
    ]),
    actorAnimation("hero", [
      { offset: 0, opacity: 1, transform: "translate(-50%, -50%) scale(1)" },
      { offset: 0.2, opacity: 1, transform: "translate(-50%, -50%) scale(1)" },
      { offset: 0.72, opacity: 0, transform: "translate(-50%, -50%) scale(1.45)" },
      { offset: 1, opacity: 0, transform: "translate(-50%, -50%) scale(1.45)" },
    ]),
    actorAnimation("reveal", [
      { offset: 0, opacity: 0, transform: "translate(-50%, -50%) scale(0.92)" },
      { offset: 0.45, opacity: 0, transform: "translate(-50%, -50%) scale(0.92)" },
      { offset: 1, opacity: 1, transform: "translate(-50%, -50%) scale(1)" },
    ]),
  ];
}

export function domMotionRecipe(
  choreography: FlowDemoChoreography,
  reducedMotion: boolean,
): ActorAnimation[] {
  if (reducedMotion) {
    return [
      actorAnimation(
        "reveal",
        [{ opacity: 0 }, { opacity: 1 }],
        REDUCED_MOTION_OPTIONS,
      ),
    ];
  }

  switch (choreography) {
    case "splitGate":
      return splitGateRecipe();
    case "irisBloom":
      return irisBloomRecipe();
    case "depthPortal":
      return depthPortalRecipe();
    case "ribbonSweep":
      return ribbonSweepRecipe();
  }
}

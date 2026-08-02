import type { AnimationEvent, RefCallback } from "react";

import type { FlowDemoChoreography } from "@/data/flow-demo-scenes";
import { cn } from "@/lib/utils";

import styles from "./motion-artwork.module.css";
import type {
  MotionActorElement,
  MotionActorName,
  MotionCopy,
} from "./motion-demo-types";

type MotionArtworkProps = {
  choreography: FlowDemoChoreography;
  className?: string;
  copy: MotionCopy;
  onActorRef?: (name: MotionActorName, element: MotionActorElement | null) => void;
  onRevealAnimationEnd?: (event: AnimationEvent<HTMLDivElement>) => void;
};

function actorRef(
  name: MotionActorName,
  onActorRef?: MotionArtworkProps["onActorRef"],
): RefCallback<MotionActorElement> | undefined {
  if (!onActorRef) return undefined;
  return (element) => onActorRef(name, element);
}

export function MotionArtwork({
  choreography,
  className,
  copy,
  onActorRef,
  onRevealAnimationEnd,
}: MotionArtworkProps) {
  return (
    <div
      className={cn(styles.stage, className)}
      data-motion-stage
      data-stage-choreography={choreography}
    >
      <div
        aria-hidden="true"
        className={styles.grid}
        data-motion-actor="backdrop"
      />
      <div
        ref={actorRef("frame", onActorRef) as RefCallback<HTMLDivElement>}
        aria-hidden="true"
        className={styles.frame}
        data-motion-actor="frame"
      />
      <div
        ref={actorRef("accentLeft", onActorRef) as RefCallback<HTMLDivElement>}
        aria-hidden="true"
        className={cn(styles.accent, styles.accentLeft)}
        data-motion-actor="accentLeft"
      />
      <div
        ref={actorRef("accentRight", onActorRef) as RefCallback<HTMLDivElement>}
        aria-hidden="true"
        className={cn(styles.accent, styles.accentRight)}
        data-motion-actor="accentRight"
      />
      <div
        ref={actorRef("hero", onActorRef) as RefCallback<HTMLDivElement>}
        aria-hidden="true"
        className={styles.hero}
        data-motion-actor="hero"
      >
        <span />
      </div>
      <svg
        ref={actorRef("ribbon", onActorRef) as RefCallback<SVGSVGElement>}
        aria-hidden="true"
        className={styles.ribbon}
        data-motion-actor="ribbon"
        viewBox="0 0 800 320"
      >
        <path d="M-40 245C122 62 254 288 414 142C562 8 655 126 842 36" />
      </svg>
      <div
        ref={actorRef("reveal", onActorRef) as RefCallback<HTMLDivElement>}
        className={styles.reveal}
        data-motion-actor="reveal"
        onAnimationEnd={onRevealAnimationEnd}
      >
        <p className={styles.kicker}>{copy.kicker}</p>
        <p className={styles.title}>{copy.title}</p>
        <p className={styles.body}>{copy.body}</p>
        <p className={styles.date}>{copy.date}</p>
      </div>
    </div>
  );
}

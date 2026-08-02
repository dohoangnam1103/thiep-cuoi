"use client";

import { useState } from "react";

import styles from "./motion-artwork.module.css";
import { MotionArtwork } from "./motion-artwork";
import type { MotionDemoProps } from "./motion-demo-types";

export function CssMotionDemo({
  choreography,
  copy,
  reducedMotion,
  runId,
}: MotionDemoProps) {
  const runKey = `${choreography}:${reducedMotion}:${runId}`;
  const [completedRunKey, setCompletedRunKey] = useState<string | null>(null);
  const complete = completedRunKey === runKey;

  return (
    <div
      data-motion-choreography={choreography}
      data-motion-engine="css"
      data-motion-state={complete ? "complete" : "running"}
      data-reduced-motion={reducedMotion ? "true" : "false"}
      className="size-full"
    >
      <MotionArtwork
        key={runKey}
        choreography={choreography}
        className={styles.cssRun}
        copy={copy}
        onRevealAnimationEnd={(event) => {
          if (event.currentTarget === event.target) setCompletedRunKey(runKey);
        }}
      />
    </div>
  );
}

"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { MutableRefObject, RefObject } from "react";
import { Path, Shape } from "three";
import type { Mesh, MeshBasicMaterial } from "three";

import {
  FLOW_DEMO_DURATION_MS,
  FLOW_DEMO_REDUCED_DURATION_MS,
  type FlowDemoChoreography,
} from "@/data/flow-demo-scenes";

import styles from "./motion-artwork.module.css";
import type { MotionDemoProps } from "./motion-demo-types";

type SceneProps = {
  choreography: FlowDemoChoreography;
  progressRef: MutableRefObject<number>;
  reducedMotion: boolean;
  revealRef: RefObject<HTMLDivElement | null>;
};

type RunControllerProps = {
  duration: number;
  onComplete: () => void;
  progressRef: MutableRefObject<number>;
  runKey: string;
};

type WebglMotionDemoProps = MotionDemoProps & {
  onUnavailable?: () => void;
};

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}

function segment(progress: number, start: number, end: number): number {
  return clamp01((progress - start) / (end - start));
}

function easeOutCubic(value: number): number {
  return 1 - (1 - value) ** 3;
}

function easeInOutCubic(value: number): number {
  return value < 0.5
    ? 4 * value ** 3
    : 1 - (-2 * value + 2) ** 3 / 2;
}

function setMesh(
  mesh: Mesh | null,
  {
    opacity,
    rotation = 0,
    scaleX,
    scaleY,
    x = 0,
    y = 0,
    z = 0,
  }: {
    opacity: number;
    rotation?: number;
    scaleX: number;
    scaleY: number;
    x?: number;
    y?: number;
    z?: number;
  },
): void {
  if (!mesh) return;
  mesh.position.set(x, y, z);
  mesh.rotation.z = rotation;
  mesh.scale.set(scaleX, scaleY, 1);
  mesh.visible = opacity > 0.001;
  const material = mesh.material as MeshBasicMaterial;
  material.opacity = clamp01(opacity);
}

function MotionScene({
  choreography,
  progressRef,
  reducedMotion,
  revealRef,
}: SceneProps) {
  const leftRef = useRef<Mesh>(null);
  const rightRef = useRef<Mesh>(null);
  const frameRef = useRef<Mesh>(null);
  const heroRef = useRef<Mesh>(null);
  const ribbonRef = useRef<Mesh>(null);
  const { viewport } = useThree();
  const frameShape = useMemo(() => {
    const shape = new Shape();
    shape.moveTo(-0.5, -0.5);
    shape.lineTo(0.5, -0.5);
    shape.lineTo(0.5, 0.5);
    shape.lineTo(-0.5, 0.5);
    shape.closePath();

    const opening = new Path();
    opening.moveTo(-0.496, -0.496);
    opening.lineTo(-0.496, 0.496);
    opening.lineTo(0.496, 0.496);
    opening.lineTo(0.496, -0.496);
    opening.closePath();
    shape.holes.push(opening);
    return shape;
  }, []);

  useFrame(() => {
    const progress = progressRef.current;
    const width = viewport.width;
    const height = viewport.height;
    const minDimension = Math.min(width, height);
    const reveal = reducedMotion
      ? progress
      : easeOutCubic(segment(progress, 0.44, 1));
    const revealScale = reducedMotion ? 1 : 0.9 + reveal * 0.1;
    const revealElement = revealRef.current;

    if (revealElement) {
      revealElement.style.opacity = `${reveal}`;
      revealElement.style.transform = `translate(-50%, -50%) scale(${revealScale})`;
    }

    if (reducedMotion) {
      [leftRef, rightRef, frameRef, heroRef, ribbonRef].forEach((ref) => {
        setMesh(ref.current, { opacity: 0, scaleX: 1, scaleY: 1 });
      });
      return;
    }

    const signature = easeOutCubic(segment(progress, 0.08, 0.78));
    const clear = easeInOutCubic(segment(progress, 0.2, 0.82));
    const panelOpacity = 1 - segment(progress, 0.68, 1);
    const panelWidth = width * 0.52;
    const panelHeight = height * 1.16;

    if (choreography === "splitGate") {
      setMesh(leftRef.current, {
        opacity: panelOpacity,
        scaleX: panelWidth,
        scaleY: panelHeight,
        x: -width * (0.25 + 0.58 * clear),
      });
      setMesh(rightRef.current, {
        opacity: panelOpacity,
        scaleX: panelWidth,
        scaleY: panelHeight,
        x: width * (0.25 + 0.58 * clear),
      });
      setMesh(frameRef.current, {
        opacity: 1 - clear,
        scaleX: width * 0.82,
        scaleY: height * 0.82,
      });
      setMesh(heroRef.current, {
        opacity: 1 - clear,
        scaleX: minDimension * 0.145 * (1 + clear * 0.45),
        scaleY: minDimension * 0.145 * (1 + clear * 0.45),
        z: 0.35,
      });
      setMesh(ribbonRef.current, { opacity: 0, scaleX: 1, scaleY: 1 });
      return;
    }

    if (choreography === "irisBloom") {
      const accentOpacity = Math.sin(progress * Math.PI) * 0.78;
      const heroScale = progress < 0.42
        ? 0.3 + easeOutCubic(progress / 0.42) * 0.78
        : 1.08 + segment(progress, 0.42, 1) * 1.02;
      setMesh(leftRef.current, {
        opacity: accentOpacity,
        rotation: -0.24 - clear * 0.36,
        scaleX: panelWidth * 0.58,
        scaleY: panelHeight * 0.72,
        x: -width * (0.14 + clear * 0.32),
      });
      setMesh(rightRef.current, {
        opacity: accentOpacity,
        rotation: 0.24 + clear * 0.36,
        scaleX: panelWidth * 0.58,
        scaleY: panelHeight * 0.72,
        x: width * (0.14 + clear * 0.32),
      });
      setMesh(frameRef.current, {
        opacity: 1 - segment(progress, 0.62, 1),
        rotation: (-7 + signature * 7) * (Math.PI / 180),
        scaleX: width * 0.82 * (0.72 + signature * 0.73),
        scaleY: height * 0.82 * (0.72 + signature * 0.73),
      });
      setMesh(heroRef.current, {
        opacity: 1 - segment(progress, 0.64, 1),
        scaleX: minDimension * 0.145 * heroScale,
        scaleY: minDimension * 0.145 * heroScale,
        z: 0.35,
      });
      setMesh(ribbonRef.current, { opacity: 0, scaleX: 1, scaleY: 1 });
      return;
    }

    if (choreography === "depthPortal") {
      const portalScale = 0.56 + signature * 1.19;
      setMesh(leftRef.current, {
        opacity: (1 - clear) * 0.72,
        scaleX: panelWidth * (0.45 + signature * 0.95),
        scaleY: panelHeight * (0.45 + signature * 0.95),
        x: -width * 0.25,
      });
      setMesh(rightRef.current, {
        opacity: (1 - clear) * 0.72,
        scaleX: panelWidth * (0.45 + signature * 0.95),
        scaleY: panelHeight * (0.45 + signature * 0.95),
        x: width * 0.25,
      });
      setMesh(frameRef.current, {
        opacity: 1 - segment(progress, 0.72, 1),
        scaleX: width * 0.82 * portalScale,
        scaleY: height * 0.82 * portalScale,
      });
      setMesh(heroRef.current, {
        opacity: 1 - segment(progress, 0.66, 1),
        scaleX: minDimension * 0.145 * (0.4 + signature * 2.3),
        scaleY: minDimension * 0.145 * (0.4 + signature * 2.3),
        z: 0.35,
      });
      setMesh(ribbonRef.current, { opacity: 0, scaleX: 1, scaleY: 1 });
      return;
    }

    const ribbonProgress = easeInOutCubic(progress);
    setMesh(leftRef.current, {
      opacity: panelOpacity,
      scaleX: panelWidth,
      scaleY: panelHeight,
      x: -width * (0.25 + 0.38 * clear),
    });
    setMesh(rightRef.current, {
      opacity: panelOpacity,
      scaleX: panelWidth,
      scaleY: panelHeight,
      x: width * (0.25 + 0.38 * clear),
    });
    setMesh(frameRef.current, {
      opacity: 1 - clear,
      scaleX: width * 0.82,
      scaleY: height * 0.82,
    });
    setMesh(heroRef.current, {
      opacity: 1 - clear,
      scaleX: minDimension * 0.145 * (1 + clear * 0.45),
      scaleY: minDimension * 0.145 * (1 + clear * 0.45),
      z: 0.35,
    });
    setMesh(ribbonRef.current, {
      opacity: Math.sin(progress * Math.PI),
      rotation: -0.16,
      scaleX: width * 1.2,
      scaleY: minDimension * 0.16,
      x: width * (-0.82 + ribbonProgress * 1.64),
      z: 0.55,
    });
  });

  return (
    <>
      <mesh ref={leftRef}>
        <planeGeometry args={[1, 1]} />
        <meshBasicMaterial color="#101827" transparent />
      </mesh>
      <mesh ref={rightRef}>
        <planeGeometry args={[1, 1]} />
        <meshBasicMaterial color="#101827" transparent />
      </mesh>
      <mesh ref={frameRef}>
        <shapeGeometry args={[frameShape]} />
        <meshBasicMaterial color="#ef6f61" transparent />
      </mesh>
      <mesh ref={heroRef}>
        <circleGeometry args={[1, 32]} />
        <meshBasicMaterial color="#172238" transparent />
      </mesh>
      <mesh ref={ribbonRef}>
        <planeGeometry args={[1, 1]} />
        <meshBasicMaterial color="#ef6f61" transparent />
      </mesh>
    </>
  );
}

function FiniteRunController({
  duration,
  onComplete,
  progressRef,
  runKey,
}: RunControllerProps) {
  const { invalidate } = useThree();

  useEffect(() => {
    let animationFrame = 0;
    let finished = false;
    const startedAt = performance.now();

    const finish = () => {
      if (finished) return;
      finished = true;
      cancelAnimationFrame(animationFrame);
      progressRef.current = 1;
      invalidate();
      onComplete();
    };

    const tick = (now: number) => {
      progressRef.current = clamp01((now - startedAt) / duration);
      invalidate();
      if (progressRef.current >= 1) {
        finish();
        return;
      }
      animationFrame = requestAnimationFrame(tick);
    };

    const handleVisibilityChange = () => {
      if (document.hidden) finish();
    };

    progressRef.current = 0;
    invalidate();
    document.addEventListener("visibilitychange", handleVisibilityChange);
    if (document.hidden) {
      finish();
    } else {
      animationFrame = requestAnimationFrame(tick);
    }

    return () => {
      finished = true;
      cancelAnimationFrame(animationFrame);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [duration, invalidate, onComplete, progressRef, runKey]);

  return null;
}

function ContextLossMonitor({ onUnavailable }: Pick<
  WebglMotionDemoProps,
  "onUnavailable"
>) {
  const { gl } = useThree();

  useEffect(() => {
    const canvas = gl.domElement;
    const handleContextLost = (event: Event) => {
      event.preventDefault();
      onUnavailable?.();
    };
    canvas.addEventListener("webglcontextlost", handleContextLost);
    return () => {
      canvas.removeEventListener("webglcontextlost", handleContextLost);
    };
  }, [gl, onUnavailable]);

  return null;
}

export function WebglMotionDemo({
  choreography,
  copy,
  onUnavailable,
  reducedMotion,
  runId,
}: WebglMotionDemoProps) {
  const progressRef = useRef(0);
  const revealRef = useRef<HTMLDivElement>(null);
  const runKey = `${choreography}:${reducedMotion}:${runId}`;
  const [completedRunKey, setCompletedRunKey] = useState<string | null>(null);
  const complete = completedRunKey === runKey;
  const duration = reducedMotion
    ? FLOW_DEMO_REDUCED_DURATION_MS
    : FLOW_DEMO_DURATION_MS;
  const dpr: number | [number, number] =
    typeof window !== "undefined" && window.innerWidth >= 768
    ? [1, 1.25]
    : 1;
  const handleComplete = useCallback(() => {
    setCompletedRunKey(runKey);
  }, [runKey]);

  return (
    <div
      className={styles.stage}
      data-motion-choreography={choreography}
      data-motion-engine="webgl"
      data-motion-state={complete ? "complete" : "running"}
      data-reduced-motion={reducedMotion ? "true" : "false"}
    >
      <div
        aria-hidden="true"
        className={styles.grid}
        data-motion-actor="backdrop"
      />
      <Canvas
        orthographic
        camera={{ far: 20, near: 0.1, position: [0, 0, 10], zoom: 80 }}
        className="absolute inset-0"
        dpr={dpr}
        frameloop="demand"
        gl={{
          alpha: true,
          antialias: true,
          powerPreference: "high-performance",
        }}
        shadows={false}
      >
        <ContextLossMonitor onUnavailable={onUnavailable} />
        <MotionScene
          choreography={choreography}
          progressRef={progressRef}
          reducedMotion={reducedMotion}
          revealRef={revealRef}
        />
        <FiniteRunController
          duration={duration}
          onComplete={handleComplete}
          progressRef={progressRef}
          runKey={runKey}
        />
      </Canvas>
      <div
        ref={revealRef}
        className={styles.reveal}
        data-motion-actor="reveal"
      >
        <p className={styles.kicker}>{copy.kicker}</p>
        <p className={styles.title}>{copy.title}</p>
        <p className={styles.body}>{copy.body}</p>
        <p className={styles.date}>{copy.date}</p>
      </div>
    </div>
  );
}

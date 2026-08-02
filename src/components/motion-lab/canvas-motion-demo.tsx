"use client";

import { useEffect, useRef, useState } from "react";

import {
  FLOW_DEMO_DURATION_MS,
  FLOW_DEMO_REDUCED_DURATION_MS,
  type FlowDemoChoreography,
} from "@/data/flow-demo-scenes";

import styles from "./motion-artwork.module.css";
import type { MotionDemoProps } from "./motion-demo-types";

type CanvasSize = {
  dpr: number;
  height: number;
  width: number;
};

const COLORS = {
  accent: "#ef6f61",
  backdrop: "#080b12",
  frame: "rgba(239, 111, 97, 0.56)",
  grid: "rgba(255, 255, 255, 0.045)",
  panel: "#101827",
} as const;

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

function drawBackdrop(
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
): void {
  context.fillStyle = COLORS.backdrop;
  context.fillRect(0, 0, width, height);
  context.strokeStyle = COLORS.grid;
  context.lineWidth = 1;

  for (let x = 0; x <= width; x += 32) {
    context.beginPath();
    context.moveTo(x, 0);
    context.lineTo(x, height);
    context.stroke();
  }

  for (let y = 0; y <= height; y += 32) {
    context.beginPath();
    context.moveTo(0, y);
    context.lineTo(width, y);
    context.stroke();
  }
}

function drawRoundedRect(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
): void {
  context.beginPath();
  context.roundRect(x, y, width, height, radius);
}

function drawFrame(
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
  opacity: number,
  scale: number,
  rotation = 0,
): void {
  context.save();
  context.globalAlpha = opacity;
  context.translate(width / 2, height / 2);
  context.rotate(rotation);
  context.scale(scale, scale);
  const frameWidth = width * 0.82;
  const frameHeight = height * 0.82;
  drawRoundedRect(
    context,
    -frameWidth / 2,
    -frameHeight / 2,
    frameWidth,
    frameHeight,
    22,
  );
  context.strokeStyle = COLORS.frame;
  context.lineWidth = 1;
  context.stroke();
  context.restore();
}

function drawHero(
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
  opacity: number,
  scale: number,
): void {
  const radius = Math.min(width, height) * 0.145;

  context.save();
  context.globalAlpha = opacity;
  context.translate(width / 2, height / 2);
  context.scale(scale, scale);
  context.beginPath();
  context.arc(0, 0, radius, 0, Math.PI * 2);
  context.fillStyle = "#111a2a";
  context.fill();
  context.strokeStyle = COLORS.frame;
  context.stroke();
  context.rotate(Math.PI / 4);
  context.strokeStyle = "rgba(247, 244, 236, 0.72)";
  context.strokeRect(-radius * 0.22, -radius * 0.22, radius * 0.44, radius * 0.44);
  context.restore();
}

function drawPanels(
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
  leftOffset: number,
  rightOffset: number,
  opacity: number,
): void {
  context.save();
  context.globalAlpha = opacity;
  context.fillStyle = COLORS.panel;
  context.fillRect(leftOffset - width * 0.01, -height * 0.08, width * 0.52, height * 1.16);
  context.fillRect(
    width * 0.49 + rightOffset,
    -height * 0.08,
    width * 0.52,
    height * 1.16,
  );
  context.restore();
}

function drawRibbon(
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
  progress: number,
): void {
  const sweep = easeInOutCubic(progress);
  context.save();
  context.globalAlpha = Math.sin(progress * Math.PI);
  context.translate(width * (-0.82 + sweep * 1.64), 0);
  context.beginPath();
  context.moveTo(-width * 0.45, height * 0.76);
  context.bezierCurveTo(
    -width * 0.18,
    height * 0.1,
    width * 0.12,
    height * 0.86,
    width * 0.4,
    height * 0.34,
  );
  context.bezierCurveTo(
    width * 0.62,
    -height * 0.02,
    width * 0.78,
    height * 0.42,
    width * 1.08,
    height * 0.08,
  );
  context.strokeStyle = COLORS.accent;
  context.lineCap = "round";
  context.lineWidth = Math.max(32, Math.min(width, height) * 0.15);
  context.stroke();
  context.restore();
}

export function drawCanvasFrame(
  context: CanvasRenderingContext2D,
  choreography: FlowDemoChoreography,
  progress: number,
  width: number,
  height: number,
): void {
  const signature = easeOutCubic(segment(progress, 0.08, 0.78));
  const clear = easeInOutCubic(segment(progress, 0.2, 0.82));

  drawBackdrop(context, width, height);

  if (choreography === "splitGate") {
    drawPanels(
      context,
      width,
      height,
      -width * 0.58 * clear,
      width * 0.58 * clear,
      1 - segment(progress, 0.68, 1),
    );
    drawFrame(context, width, height, 1 - clear, 1);
    drawHero(context, width, height, 1 - clear, 1 + clear * 0.45);
    return;
  }

  if (choreography === "irisBloom") {
    drawPanels(
      context,
      width,
      height,
      -width * 0.36 * clear,
      width * 0.36 * clear,
      Math.sin(progress * Math.PI) * 0.78,
    );
    drawFrame(
      context,
      width,
      height,
      1 - segment(progress, 0.62, 1),
      0.72 + signature * 0.73,
      (-7 + signature * 7) * (Math.PI / 180),
    );
    const heroPulse = progress < 0.42
      ? 0.3 + easeOutCubic(progress / 0.42) * 0.78
      : 1.08 + segment(progress, 0.42, 1) * 1.02;
    drawHero(context, width, height, 1 - segment(progress, 0.64, 1), heroPulse);
    return;
  }

  if (choreography === "depthPortal") {
    drawPanels(
      context,
      width,
      height,
      -width * 0.18 * signature,
      width * 0.18 * signature,
      (1 - clear) * 0.72,
    );
    drawFrame(context, width, height, 1 - segment(progress, 0.72, 1), 0.56 + signature * 1.19);
    drawHero(context, width, height, 1 - segment(progress, 0.66, 1), 0.4 + signature * 2.3);
    return;
  }

  drawPanels(
    context,
    width,
    height,
    -width * 0.38 * clear,
    width * 0.38 * clear,
    1 - segment(progress, 0.7, 1),
  );
  drawFrame(context, width, height, 1 - clear, 1);
  drawHero(context, width, height, 1 - clear, 1 + clear * 0.45);
  drawRibbon(context, width, height, progress);
}

function drawReducedCanvasFrame(
  context: CanvasRenderingContext2D,
  progress: number,
  width: number,
  height: number,
): void {
  drawBackdrop(context, width, height);
}

function measureCanvas(canvas: HTMLCanvasElement): CanvasSize {
  const bounds = canvas.getBoundingClientRect();
  const width = Math.max(1, Math.round(bounds.width));
  const height = Math.max(1, Math.round(bounds.height));
  const dpr = window.innerWidth < 768
    ? 1
    : Math.min(window.devicePixelRatio || 1, 1.25);

  return { dpr, height, width };
}

export function CanvasMotionDemo({
  choreography,
  copy,
  reducedMotion,
  runId,
}: MotionDemoProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const revealRef = useRef<HTMLDivElement>(null);
  const runKey = `${choreography}:${reducedMotion}:${runId}`;
  const [completedRunKey, setCompletedRunKey] = useState<string | null>(null);
  const complete = completedRunKey === runKey;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext("2d", { alpha: false });
    if (!context) return;

    let animationFrame = 0;
    let currentProgress = 0;
    let finished = false;
    let size = measureCanvas(canvas);
    const duration = reducedMotion
      ? FLOW_DEMO_REDUCED_DURATION_MS
      : FLOW_DEMO_DURATION_MS;
    const startedAt = performance.now();

    const draw = (progress: number) => {
      context.setTransform(size.dpr, 0, 0, size.dpr, 0, 0);
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
        drawReducedCanvasFrame(context, progress, size.width, size.height);
      } else {
        drawCanvasFrame(
          context,
          choreography,
          progress,
          size.width,
          size.height,
        );
      }
    };

    const resize = () => {
      size = measureCanvas(canvas);
      canvas.width = Math.round(size.width * size.dpr);
      canvas.height = Math.round(size.height * size.dpr);
      draw(currentProgress);
    };

    const finish = () => {
      if (finished) return;
      finished = true;
      currentProgress = 1;
      cancelAnimationFrame(animationFrame);
      draw(1);
      setCompletedRunKey(runKey);
    };

    const tick = (now: number) => {
      currentProgress = clamp01((now - startedAt) / duration);
      draw(currentProgress);
      if (currentProgress >= 1) {
        finish();
        return;
      }
      animationFrame = requestAnimationFrame(tick);
    };

    const handleVisibilityChange = () => {
      if (document.hidden) finish();
    };

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(canvas);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    resize();
    if (document.hidden) {
      finish();
    } else {
      animationFrame = requestAnimationFrame(tick);
    }

    return () => {
      finished = true;
      cancelAnimationFrame(animationFrame);
      resizeObserver.disconnect();
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [choreography, reducedMotion, runId, runKey]);

  return (
    <div
      className="relative size-full min-h-80 overflow-hidden bg-[#080b12]"
      data-motion-choreography={choreography}
      data-motion-engine="canvas"
      data-motion-state={complete ? "complete" : "running"}
      data-reduced-motion={reducedMotion ? "true" : "false"}
    >
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        className="absolute inset-0 block size-full"
        height={1}
        width={1}
      />
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

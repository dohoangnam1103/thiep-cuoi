"use client";

import dynamic from "next/dynamic";
import type { ComponentType, ReactNode } from "react";
import { Component, useCallback, useEffect, useState } from "react";

import type { FlowDemoEngine } from "@/data/flow-demo-scenes";
import { cn } from "@/lib/utils";

import { CanvasMotionDemo } from "./canvas-motion-demo";
import { CssMotionDemo } from "./css-motion-demo";
import { GsapMotionDemo } from "./gsap-motion-demo";
import type { MotionDemoProps } from "./motion-demo-types";
import { WaapiMotionDemo } from "./waapi-motion-demo";

type MotionDemoCardProps = MotionDemoProps & {
  choreographyLabel: string;
  compact?: boolean;
  engine: FlowDemoEngine;
  engineDescription: string;
  engineLabel: string;
  loadingLabel: string;
  unavailableLabel: string;
};

type MotionStageFallbackProps = Pick<
  MotionDemoCardProps,
  "choreography" | "engine" | "loadingLabel" | "reducedMotion" | "unavailableLabel"
> & {
  unavailable?: boolean;
};

type MotionErrorBoundaryProps = {
  children: ReactNode;
  fallback: ReactNode;
};

type MotionErrorBoundaryState = {
  failed: boolean;
};

const WebglMotionDemo = dynamic(
  () => import("./webgl-motion-demo").then((module) => module.WebglMotionDemo),
  { ssr: false },
);

const STATIC_DEMOS: Partial<
  Record<FlowDemoEngine, ComponentType<MotionDemoProps>>
> = {
  canvas: CanvasMotionDemo,
  css: CssMotionDemo,
  gsap: GsapMotionDemo,
  waapi: WaapiMotionDemo,
};

class MotionErrorBoundary extends Component<
  MotionErrorBoundaryProps,
  MotionErrorBoundaryState
> {
  state: MotionErrorBoundaryState = { failed: false };

  static getDerivedStateFromError(): MotionErrorBoundaryState {
    return { failed: true };
  }

  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

function supportsWebgl(): boolean {
  try {
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("webgl2") ?? canvas.getContext("webgl");
    if (!context) return false;
    const loseContext = context.getExtension("WEBGL_lose_context");
    loseContext?.loseContext();
    return true;
  } catch {
    return false;
  }
}

function MotionStageFallback({
  choreography,
  engine,
  loadingLabel,
  reducedMotion,
  unavailable = false,
  unavailableLabel,
}: MotionStageFallbackProps) {
  return (
    <div
      aria-label={unavailable ? unavailableLabel : loadingLabel}
      className="grid size-full min-h-80 place-items-center bg-[#080b12] px-6 text-center"
      data-motion-choreography={choreography}
      data-motion-engine={engine}
      data-motion-state={unavailable ? "complete" : "idle"}
      data-reduced-motion={reducedMotion ? "true" : "false"}
      role="status"
    >
      {unavailable ? (
        <p className="max-w-xs text-sm leading-6 text-[#9d9aaa]">
          {unavailableLabel}
        </p>
      ) : (
        <div aria-hidden="true" className="size-10 rounded-full border border-[#ef6f61]/50" />
      )}
    </div>
  );
}

function WebglAdapter(props: MotionDemoCardProps) {
  const [availability, setAvailability] = useState<
    "available" | "unavailable" | "unknown"
  >("unknown");
  const handleUnavailable = useCallback(() => {
    setAvailability("unavailable");
  }, []);

  useEffect(() => {
    const animationFrame = requestAnimationFrame(() => {
      setAvailability(supportsWebgl() ? "available" : "unavailable");
    });
    return () => cancelAnimationFrame(animationFrame);
  }, []);

  if (availability !== "available") {
    return (
      <MotionStageFallback
        choreography={props.choreography}
        engine="webgl"
        loadingLabel={props.loadingLabel}
        reducedMotion={props.reducedMotion}
        unavailable={availability === "unavailable"}
        unavailableLabel={props.unavailableLabel}
      />
    );
  }

  return (
    <MotionErrorBoundary
      fallback={(
        <MotionStageFallback
          choreography={props.choreography}
          engine="webgl"
          loadingLabel={props.loadingLabel}
          reducedMotion={props.reducedMotion}
          unavailable
          unavailableLabel={props.unavailableLabel}
        />
      )}
    >
      <WebglMotionDemo
        choreography={props.choreography}
        copy={props.copy}
        onUnavailable={handleUnavailable}
        reducedMotion={props.reducedMotion}
        runId={props.runId}
      />
    </MotionErrorBoundary>
  );
}

export function MotionDemoCard(props: MotionDemoCardProps) {
  const {
    choreographyLabel,
    compact = false,
    engine,
    engineDescription,
    engineLabel,
  } = props;
  const StaticDemo = STATIC_DEMOS[engine];

  return (
    <article
      aria-label={`${engineLabel}: ${choreographyLabel}`}
      className="min-w-0 overflow-hidden rounded-[1.5rem] border border-white/10 bg-[#0d111b]"
    >
      <header className="flex min-h-24 flex-col justify-center border-b border-white/10 px-4 py-3 sm:px-5">
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="text-sm font-semibold tracking-[-0.01em] text-[#f7f4ec]">
            {engineLabel}
          </h2>
          <span className="text-[0.62rem] font-semibold uppercase tracking-[0.16em] text-[#ef6f61]">
            {choreographyLabel}
          </span>
        </div>
        <p className="mt-1 max-w-[62ch] text-xs leading-5 text-[#8f92a0]">
          {engineDescription}
        </p>
      </header>
      <div
        aria-label={`${engineLabel}: ${choreographyLabel}`}
        className={cn(
          "relative overflow-hidden",
          compact
            ? "h-96"
            : "h-[24rem] sm:h-[32rem] lg:h-[min(64dvh,42rem)]",
        )}
        role="group"
      >
        {engine === "webgl" ? (
          <WebglAdapter {...props} />
        ) : StaticDemo ? (
          <StaticDemo
            choreography={props.choreography}
            copy={props.copy}
            reducedMotion={props.reducedMotion}
            runId={props.runId}
          />
        ) : (
          <MotionStageFallback
            choreography={props.choreography}
            engine={engine}
            loadingLabel={props.loadingLabel}
            reducedMotion={props.reducedMotion}
            unavailable
            unavailableLabel={props.unavailableLabel}
          />
        )}
      </div>
    </article>
  );
}

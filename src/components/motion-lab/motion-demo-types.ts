import type { FlowDemoChoreography } from "@/data/flow-demo-scenes";

export type MotionCopy = {
  kicker: string;
  title: string;
  body: string;
  date: string;
};

export type MotionDemoProps = {
  choreography: FlowDemoChoreography;
  copy: MotionCopy;
  reducedMotion: boolean;
  runId: number;
};

export type MotionActorName =
  | "frame"
  | "hero"
  | "accentLeft"
  | "accentRight"
  | "reveal"
  | "ribbon";

export type MotionActorElement = HTMLDivElement | SVGSVGElement;
export type MotionActorMap = Record<
  MotionActorName,
  MotionActorElement | null
>;

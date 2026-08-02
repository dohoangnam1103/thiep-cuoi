export const FLOW_DEMO_ENGINES = [
  "css",
  "waapi",
  "gsap",
  "canvas",
  "webgl",
] as const;

export const FLOW_DEMO_CHOREOGRAPHIES = [
  "splitGate",
  "irisBloom",
  "depthPortal",
  "ribbonSweep",
] as const;

export type FlowDemoEngine = (typeof FLOW_DEMO_ENGINES)[number];
export type FlowDemoChoreography =
  (typeof FLOW_DEMO_CHOREOGRAPHIES)[number];
export type FlowDemoViewMode = "focus" | "compare";

export const flowDemoCombinationIds = FLOW_DEMO_ENGINES.flatMap((engine) =>
  FLOW_DEMO_CHOREOGRAPHIES.map((choreography) =>
    `${engine}:${choreography}` as const,
  ),
);

export const FLOW_DEMO_DURATION_MS = 1_100;
export const FLOW_DEMO_REDUCED_DURATION_MS = 150;

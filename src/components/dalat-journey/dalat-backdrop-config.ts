import {
  dalatJourneyDefinition,
} from "@/data/dalat-journey";

const IMAGE_ASPECT_RATIO = 4 / 3;

export const DALAT_BACKDROP_DEPTH_LAYERS = [
  {
    id: "far",
    scale: 1.012,
    xFactor: 0.42,
    yFactor: 0.36,
  },
  {
    id: "mid",
    scale: 1.025,
    xFactor: 0.92,
    yFactor: 0.78,
  },
  {
    id: "near",
    scale: 1.042,
    xFactor: 1.55,
    yFactor: 1.28,
  },
] as const;

export type DalatBackdropDepthLayer =
  (typeof DALAT_BACKDROP_DEPTH_LAYERS)[number];

export type DalatBackdropLook = {
  pitchDegrees: number;
  yawDegrees: number;
};

export type DalatBackdropBlend = {
  activeOpacity: number;
  targetOpacity: number;
};

function clampUnit(value: number): number {
  return Math.max(0, Math.min(1, value));
}

/**
 * Maps the authored free-look range onto three deliberately different plate
 * offsets. The movement stays subtle enough that the feathered masks never
 * expose the oversized plate edges.
 */
export function getDalatBackdropLayerOffset(
  look: DalatBackdropLook,
  layer: DalatBackdropDepthLayer,
): { x: number; y: number } {
  return {
    x: Number((-look.yawDegrees * layer.xFactor).toFixed(3)),
    y: Number((look.pitchDegrees * layer.yFactor).toFixed(3)),
  };
}

/**
 * Returns the authored artwork plates in rail order. These are deliberately
 * shared with the non-WebGL fallback so the visual source of truth cannot
 * drift between renderers.
 */
export function getDalatBackdropAssetPaths(): readonly string[] {
  return dalatJourneyDefinition.checkpoints.map(
    ({ fallbackImage }) => fallbackImage,
  );
}

/**
 * Smoothstep crossfade used by a renderer that has continuous travel progress.
 * The DOM backdrop uses the same curve's timing intent via its CSS animation.
 */
export function getDalatBackdropBlend(
  progress: number,
  travelling: boolean,
): DalatBackdropBlend {
  if (!travelling) {
    return { activeOpacity: 1, targetOpacity: 0 };
  }

  const normalized = clampUnit(progress);
  const eased = normalized * normalized * (3 - 2 * normalized);
  return {
    activeOpacity: Number((1 - eased).toFixed(6)),
    targetOpacity: Number(eased.toFixed(6)),
  };
}

/**
 * Cover scale for a 4:3 plate. Kept pure so the same sizing rule can be used
 * by a future canvas-plane renderer without changing the authored artwork.
 */
export function getDalatBackdropCoverScale(
  viewportAspect: number,
): readonly [number, number] {
  const safeAspect = Number.isFinite(viewportAspect) && viewportAspect > 0
    ? viewportAspect
    : IMAGE_ASPECT_RATIO;

  return safeAspect >= IMAGE_ASPECT_RATIO
    ? [safeAspect / IMAGE_ASPECT_RATIO, 1]
    : [1, IMAGE_ASPECT_RATIO / safeAspect];
}

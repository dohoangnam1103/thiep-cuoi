import type {
  OpeningEffectLayer,
  OpeningMotionFrame,
} from "@/data/templates/opening-effect";

export type OpeningAnimationKeyframe = {
  offset: number;
  opacity: number;
  transform?: string;
  transformOrigin?: string;
  filter?: string;
};

export type OpeningAnimationOptions = {
  delay: number;
  duration: number;
  easing: string;
  fill: "both";
};

function transformForFrame(frame: OpeningMotionFrame): string {
  return `translate3d(${frame.xPercent}%, ${frame.yPercent}%, 0) scale(${frame.scale}) rotate(${frame.rotateDeg}deg)`;
}

function filterForFrame(frame: OpeningMotionFrame): string {
  return `blur(${frame.blurPx}px) brightness(${frame.brightness})`;
}

export function buildOpeningKeyframes(
  layer: OpeningEffectLayer,
): OpeningAnimationKeyframe[] {
  const start: OpeningMotionFrame = {
    offset: 0,
    xPercent: 0,
    yPercent: 0,
    scale: 1,
    rotateDeg: 0,
    blurPx: 0,
    brightness: 1,
    opacity: layer.startOpacity,
  };

  return [start, layer.peak, layer.hold, layer.exit].map((frame) => ({
    offset: frame.offset,
    opacity: frame.opacity,
    transform: transformForFrame(frame),
    transformOrigin: layer.transformOrigin,
    filter: filterForFrame(frame),
  }));
}

export function buildOpeningOptions(
  layer: OpeningEffectLayer,
  durationMs: number,
): OpeningAnimationOptions {
  return {
    delay: layer.delayMs,
    duration: durationMs,
    easing: layer.easing,
    fill: "both",
  };
}

export function buildReducedMotionKeyframes(
  layer: OpeningEffectLayer,
): OpeningAnimationKeyframe[] {
  return [
    { offset: 0, opacity: layer.startOpacity },
    { offset: 1, opacity: 0 },
  ];
}

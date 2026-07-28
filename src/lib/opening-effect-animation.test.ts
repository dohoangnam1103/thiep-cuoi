import assert from "node:assert/strict";
import test from "node:test";

import type { OpeningEffectLayer } from "@/data/templates/opening-effect";
import {
  buildOpeningKeyframes,
  buildOpeningOptions,
  buildReducedMotionKeyframes,
} from "./opening-effect-animation";

const layer: OpeningEffectLayer = {
  id: "left-chicken",
  src: "/chungdoi/images/themes/_decor/dong-ho-folk/opening-left-chicken.webp",
  rect: { x: 12, y: 24, width: 320, height: 480 },
  transformOrigin: "100% 50%",
  delayMs: 40,
  easing: "cubic-bezier(0.22, 0.8, 0.2, 1)",
  startOpacity: 0.2,
  peak: {
    offset: 0.24,
    xPercent: -10,
    yPercent: -4,
    scale: 1.28,
    rotateDeg: -2,
    blurPx: 0,
    brightness: 1.18,
    opacity: 0.95,
  },
  hold: {
    offset: 0.7,
    xPercent: -62,
    yPercent: -20,
    scale: 2.24,
    rotateDeg: -6,
    blurPx: 0,
    brightness: 1.1,
    opacity: 0.92,
  },
  exit: {
    offset: 1,
    xPercent: -88,
    yPercent: -28,
    scale: 3,
    rotateDeg: -9,
    blurPx: 8,
    brightness: 1.05,
    opacity: 0,
  },
  optional: true,
};

test("buildOpeningKeyframes creates an aligned start, dramatic peak, and clean exit", () => {
  assert.deepEqual(buildOpeningKeyframes(layer), [
    {
      offset: 0,
      opacity: 0.2,
      transform: "translate3d(0%, 0%, 0) scale(1) rotate(0deg)",
      transformOrigin: "100% 50%",
      filter: "blur(0px) brightness(1)",
    },
    {
      offset: 0.24,
      opacity: 0.95,
      transform: "translate3d(-10%, -4%, 0) scale(1.28) rotate(-2deg)",
      transformOrigin: "100% 50%",
      filter: "blur(0px) brightness(1.18)",
    },
    {
      offset: 0.7,
      opacity: 0.92,
      transform: "translate3d(-62%, -20%, 0) scale(2.24) rotate(-6deg)",
      transformOrigin: "100% 50%",
      filter: "blur(0px) brightness(1.1)",
    },
    {
      offset: 1,
      opacity: 0,
      transform: "translate3d(-88%, -28%, 0) scale(3) rotate(-9deg)",
      transformOrigin: "100% 50%",
      filter: "blur(8px) brightness(1.05)",
    },
  ]);
});

test("buildOpeningOptions uses the theme duration and layer delay", () => {
  assert.deepEqual(buildOpeningOptions(layer, 1420), {
    delay: 40,
    duration: 1420,
    easing: "cubic-bezier(0.22, 0.8, 0.2, 1)",
    fill: "both",
  });
});

test("buildReducedMotionKeyframes only fades the isolated layer", () => {
  assert.deepEqual(buildReducedMotionKeyframes(layer), [
    { offset: 0, opacity: 0.2 },
    { offset: 1, opacity: 0 },
  ]);
});

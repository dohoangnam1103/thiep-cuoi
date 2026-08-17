/**
 * Camera moves for the live-action ocean backdrop.
 *
 * This is the FMV idea — the one used by live-action branching games, where the
 * footage keeps running so the world stays alive (waves break, clouds drift) while
 * the *camera* holds still until the player chooses, then moves to the next
 * vantage point.
 *
 * The move is synthetic. Nothing is panned at capture time: the source is a single
 * locked-off 4K clip, and each scene names a rectangle inside it. Moving between
 * scenes interpolates between rectangles, which reads as a camera pan because
 * that is geometrically what a pan is — the same scene sampled through a shifted
 * window. Three things follow from that, and all three are why this beats a
 * pre-panned clip:
 *
 * 1. The dwell is unbounded. A pre-panned clip has the pan baked in at a fixed
 *    speed, so it keeps moving while the guest reads. Here the window is
 *    stationary between scenes and the water still moves, which is exactly the
 *    "camera locked, world alive" behaviour the brief asks for.
 * 2. The route follows the content. An invitation has as many stops as it has
 *    sections — the demo walk has 15 — and no stock clip pans through 15 framings
 *    in the right order.
 * 3. It costs nothing extra. The pan is a CSS transform on an element that is
 *    already composited; the only price is shipping enough pixels to crop into,
 *    which is the same 4K source that fixes the sharpness problem anyway.
 *
 * Kept free of React and of three.js so every frame of every move can be asserted
 * in a unit test without a browser or a GPU.
 */

/** Source clip dimensions. The crop rectangles below live in this space. */
export const BEACH_FMV_SOURCE_WIDTH = 2560;
export const BEACH_FMV_SOURCE_HEIGHT = 1440;

/**
 * The camera window's size, as a fraction of the source.
 *
 * 0.72 leaves 28% of each axis to travel across — 717px horizontally and 403px
 * vertically at the shipped 2560x1440 — while still sampling 1843x1037 real pixels
 * for the window. Against a 1440px-wide viewport that is 1.28x density, so the
 * backdrop is sharper than a 1:1 1080p source would be even at the most zoomed-in
 * framing.
 *
 * Larger would be sharper but leave no room to move; smaller would move more but
 * start to soften. This is the crossover.
 */
export const BEACH_FMV_WINDOW_SCALE = 0.72;

export type BeachFmvFraming = {
  /** Window centre, 0..1 across the source. 0.5/0.5 is dead centre. */
  readonly centerX: number;
  readonly centerY: number;
  /**
   * Extra zoom on top of `BEACH_FMV_WINDOW_SCALE`, where 1 is the base window.
   *
   * Above 1 pushes in — a tighter, more intimate framing for the couple's own
   * moments; below 1 pulls out to the full seascape. Bounded by
   * `BEACH_FMV_MAX_ZOOM` so a framing can never ask for more pixels than the
   * source has.
   */
  readonly zoom: number;
};

/**
 * Hard ceiling on zoom.
 *
 * At the base window scale of 0.72, a zoom of 1.38 samples 0.72 / 1.38 = 52% of
 * the source axis, which against a 1440px viewport is still 0.93x density —
 * marginally soft but acceptable for a background. Beyond that the footage starts
 * to visibly smear, so the ceiling is enforced rather than documented.
 */
export const BEACH_FMV_MAX_ZOOM = 1.38;

/** Floor: pulling out past the source edge would letterbox the backdrop. */
export const BEACH_FMV_MIN_ZOOM = 0.86;

/**
 * Framings by scene type.
 *
 * Composed as a route rather than a lookup: read top to bottom, the camera opens
 * wide on the horizon, drifts left and inland for the family and ceremony details,
 * pushes in for the gallery, then returns to the open sea for the finale. Every
 * value is inside the travel budget by construction — `resolveBeachFmvFraming`
 * clamps, and the unit tests prove no framing reaches an edge.
 *
 * Vertical framing carries meaning too: scenes about *time* (calendar, schedule)
 * look up toward the sky, and scenes about *place* (venue, map) look down toward
 * the shoreline.
 */
const FRAMINGS: Readonly<Record<string, BeachFmvFraming>> = Object.freeze({
  // Wide and level: the establishing shot, before anything is asked of the guest.
  "cover-gate": { centerX: 0.5, centerY: 0.5, zoom: 0.92 },
  // Drift left and slightly up: two families, opening out.
  families: { centerX: 0.34, centerY: 0.44, zoom: 1 },
  "opening-message": { centerX: 0.42, centerY: 0.47, zoom: 1.06 },
  // Time scenes look up, where the sky is.
  calendar: { centerX: 0.56, centerY: 0.36, zoom: 1.02 },
  schedule: { centerX: 0.64, centerY: 0.38, zoom: 1.04 },
  // The gallery pushes in — closest the camera comes to the water.
  "gallery-photo": { centerX: 0.5, centerY: 0.56, zoom: 1.22 },
  "dress-code": { centerX: 0.38, centerY: 0.58, zoom: 1.1 },
  // Place scenes look down, toward the shoreline.
  venue: { centerX: 0.62, centerY: 0.62, zoom: 1.08 },
  map: { centerX: 0.68, centerY: 0.6, zoom: 1.04 },
  rsvp: { centerX: 0.46, centerY: 0.52, zoom: 1.12 },
  wishes: { centerX: 0.36, centerY: 0.5, zoom: 1.14 },
  gift: { centerX: 0.58, centerY: 0.5, zoom: 1.16 },
  // Back out to the open sea to close.
  finale: { centerX: 0.5, centerY: 0.46, zoom: 0.9 },
});

/** The framing used when a scene type has no entry of its own. */
export const BEACH_FMV_DEFAULT_FRAMING: BeachFmvFraming = Object.freeze({
  centerX: 0.5,
  centerY: 0.5,
  zoom: 1,
});

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(Math.max(value, minimum), maximum);
}

/**
 * The framing for a scene type, clamped so the window always stays inside the
 * source.
 *
 * The clamp is the safety property this module exists to guarantee: a framing that
 * reached past the source edge would show a hard black band where the footage
 * stops, which is the single most visible way this effect can fail. Because the
 * window's own size depends on its zoom, the positional limit has to be recomputed
 * per framing rather than fixed — which is exactly the arithmetic a hand-tuned
 * `transform` string would get wrong.
 */
export function resolveBeachFmvFraming(sceneType: string): BeachFmvFraming {
  const requested = FRAMINGS[sceneType] ?? BEACH_FMV_DEFAULT_FRAMING;
  const zoom = clamp(requested.zoom, BEACH_FMV_MIN_ZOOM, BEACH_FMV_MAX_ZOOM);
  // Fraction of the source axis the window covers at this zoom.
  const coverage = Math.min(1, BEACH_FMV_WINDOW_SCALE / zoom);
  // The centre may travel to within half a window of each edge.
  const limit = coverage / 2;

  return {
    centerX: clamp(requested.centerX, limit, 1 - limit),
    centerY: clamp(requested.centerY, limit, 1 - limit),
    zoom,
  };
}

export type BeachFmvTransform = {
  /** Percentage offsets, ready for `translate(...)` on the oversized media. */
  readonly offsetXPercent: number;
  readonly offsetYPercent: number;
  /** Scale factor applied to the media element. */
  readonly scale: number;
};

/**
 * Turns a framing into the transform that realises it.
 *
 * The media element is sized to `1 / BEACH_FMV_WINDOW_SCALE` of its container, so
 * the container acts as the camera's gate and the media slides behind it. Offsets
 * are expressed as a percentage of the *media's own* size, which is what CSS
 * `translate` percentages mean — computing them against the container instead is
 * the classic off-by-a-scale-factor bug in this kind of effect.
 */
export function resolveBeachFmvTransform(
  framing: BeachFmvFraming,
): BeachFmvTransform {
  const coverage = Math.min(1, BEACH_FMV_WINDOW_SCALE / framing.zoom);
  // How far the centre sits from the source's centre, in source fractions.
  const deltaX = framing.centerX - 0.5;
  const deltaY = framing.centerY - 0.5;

  // Moving the window right means moving the media left, hence the negation. The
  // division by `coverage` converts a source-space offset into a fraction of the
  // media element, whose size is the source scaled to the window.
  //
  // `+ 0` normalises negative zero: negating a zero delta yields `-0`, which is
  // harmless in a CSS transform but makes the value compare unequal to `0` and
  // serialise as `"-0%"`. Cheaper to fix here than to teach every caller and test
  // to tolerate it.
  return {
    offsetXPercent: (-deltaX / coverage) * 100 + 0,
    offsetYPercent: (-deltaY / coverage) * 100 + 0,
    scale: framing.zoom,
  };
}

/**
 * Every scene type that has an authored framing.
 *
 * Exported so a test can assert the route covers the real scene list, rather than
 * silently falling back to centre for a scene someone forgot.
 */
export const BEACH_FMV_FRAMED_SCENE_TYPES: readonly string[] = Object.freeze(
  Object.keys(FRAMINGS),
);

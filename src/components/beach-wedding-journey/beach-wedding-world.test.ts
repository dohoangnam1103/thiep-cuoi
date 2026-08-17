import assert from "node:assert/strict";
import { test } from "node:test";

import {
  beachWeddingJourneyDemoContent,
  beachWeddingJourneyFeatures,
  buildBeachJourneyScenes,
  type BeachJourneyScene,
} from "@/data/beach-wedding-journey";

import { BEACH_PHOTOREAL_ASSETS } from "@/components/beach-wedding-journey/photoreal/beach-asset-manifest";
import { resolveBeachFramePlacements } from "@/components/beach-wedding-journey/photoreal/beach-photo-frames";
import { getBeachWorldDensity } from "@/components/beach-wedding-journey/beach-world-data";
import {
  BEACH_REFLECTION_DISABLED_TIER,
  BeachEntryAssetBoundary,
  countBeachFramePlacements,
  isBeachEntryAssetError,
  isBeachReflectionEnabled,
  resolveBeachQualityTier,
} from "@/components/beach-wedding-journey/beach-wedding-world";

/**
 * The entry assets Task 1 shipped: the two 1k sand maps, the water normal and
 * the HDRI sky. Restated as literals on purpose — the boundary tests exist to
 * check that *these* sources are the ones a failure is forgiven for, so reading
 * the list from the module under test would let it forgive anything at all.
 */
const EXPECTED_ENTRY_SRCS = [
  "/chungdoi/labs/beach-wedding-journey/photoreal/sand-color.webp",
  "/chungdoi/labs/beach-wedding-journey/photoreal/sand-normal.webp",
  "/chungdoi/labs/beach-wedding-journey/photoreal/sand-arm.webp",
  "/chungdoi/labs/beach-wedding-journey/photoreal/water-normal.webp",
  "/chungdoi/labs/beach-wedding-journey/photoreal/sky.hdr",
] as const;

const DEMO_GALLERY_PHOTO_COUNT = 3;

function demoScenes(): readonly BeachJourneyScene[] {
  return buildBeachJourneyScenes(
    beachWeddingJourneyDemoContent,
    beachWeddingJourneyFeatures,
  );
}

// ---------------------------------------------------------------------------
// Reflection
// ---------------------------------------------------------------------------

test("the water reflection is dropped at the reduced tier and kept above it", () => {
  assert.equal(BEACH_REFLECTION_DISABLED_TIER, "reduced");
  assert.equal(isBeachReflectionEnabled("desktop"), true);
  assert.equal(isBeachReflectionEnabled("mobile"), true);
  assert.equal(isBeachReflectionEnabled("reduced"), false);
});

// ---------------------------------------------------------------------------
// Quality tier
// ---------------------------------------------------------------------------

test("the reduced tier is a one-way latch no resize can undo", () => {
  // Once the device has failed the frame budget, a wider viewport does not make
  // it faster — so `deviceReduced` outranks whatever the viewport reports.
  assert.equal(resolveBeachQualityTier("desktop", false, true), "reduced");
  assert.equal(resolveBeachQualityTier("mobile", false, true), "reduced");
});

test("a motion preference drops the tier regardless of viewport", () => {
  assert.equal(resolveBeachQualityTier("desktop", true, false), "reduced");
  assert.equal(resolveBeachQualityTier("mobile", true, false), "reduced");
});

test("an unconstrained world renders at its viewport's tier", () => {
  // `reduced` is a tier, not a viewport: a device reports desktop or mobile and
  // the reduction is a separate input, so an unconstrained world is whichever
  // viewport it is.
  assert.equal(resolveBeachQualityTier("desktop", false, false), "desktop");
  assert.equal(resolveBeachQualityTier("mobile", false, false), "mobile");
});

test("every resolved tier has a density and a reflection answer", () => {
  for (const viewport of ["desktop", "mobile"] as const) {
    for (const reducedMotion of [false, true]) {
      for (const deviceReduced of [false, true]) {
        const tier = resolveBeachQualityTier(viewport, reducedMotion, deviceReduced);
        const density = getBeachWorldDensity(viewport, tier);

        assert.ok(density.frames > 0);
        assert.ok(density.posts > 0);
        assert.ok(density.tables > 0, `${tier} still sets tables`);
        assert.equal(typeof isBeachReflectionEnabled(tier), "boolean");
      }
    }
  }
});

test("the reduced tier is lighter than the viewport it replaces", () => {
  const desktop = getBeachWorldDensity("desktop", "desktop");
  const reduced = getBeachWorldDensity("desktop", "reduced");

  assert.ok(reduced.posts < desktop.posts);
  assert.ok(reduced.tables < desktop.tables);
  // Frames carry the couple's photographs — they are never thinned out.
  assert.equal(reduced.frames, desktop.frames);
});

// ---------------------------------------------------------------------------
// Frame diagnostics
// ---------------------------------------------------------------------------

test("the diagnostics frame count matches the frames actually hung", () => {
  const scenes = demoScenes();

  assert.equal(
    countBeachFramePlacements(scenes),
    resolveBeachFramePlacements(scenes).length,
  );
  assert.equal(countBeachFramePlacements(scenes), DEMO_GALLERY_PHOTO_COUNT);
});

test("a gallery scene with no photograph is not counted as a frame", () => {
  const scenes = demoScenes();
  const stripped = scenes.map((scene) =>
    scene.type === "gallery-photo" ? { ...scene, photo: null } : scene,
  );

  assert.equal(countBeachFramePlacements(stripped), 0);
  assert.equal(resolveBeachFramePlacements(stripped).length, 0);
});

test("non-gallery scenes never contribute a frame", () => {
  const scenes = demoScenes();
  const nonGallery = scenes.filter((scene) => scene.type !== "gallery-photo");

  assert.ok(nonGallery.length > 0, "the walk has scenes besides the gallery");
  assert.equal(countBeachFramePlacements(nonGallery), 0);
});

// ---------------------------------------------------------------------------
// Entry asset classification
// ---------------------------------------------------------------------------

test("the entry sources are exactly the manifest's blocking group", () => {
  const entry = BEACH_PHOTOREAL_ASSETS.filter((asset) => asset.group === "entry");

  assert.deepEqual(entry.map(({ src }) => src), [...EXPECTED_ENTRY_SRCS]);
  for (const asset of entry) {
    assert.equal(asset.blocking, true, `${asset.id} holds the threshold`);
  }
});

test("a loader error naming an entry source drops the world to simple", () => {
  for (const src of EXPECTED_ENTRY_SRCS) {
    assert.equal(
      isBeachEntryAssetError(new Error(`Failed to load ${src}: 404`)),
      true,
      `${src} is recognised`,
    );
  }
});

test("an image load rejection drops the world to simple", () => {
  // `ImageLoader` rejects with the element's DOM `ErrorEvent`, which is not an
  // `Error` — nothing in React or the scene graph throws a non-`Error`.
  assert.equal(isBeachEntryAssetError({ type: "error" }), true);
  assert.equal(isBeachEntryAssetError("error"), true);
  assert.equal(isBeachEntryAssetError(null), true);
});

test("a scene-graph bug is never disguised as a plainer beach", () => {
  assert.equal(
    isBeachEntryAssetError(new Error("Cannot read properties of undefined")),
    false,
  );
  assert.equal(isBeachEntryAssetError(new TypeError("geometry is not a function")), false);
  assert.equal(
    isBeachEntryAssetError(new Error("Beach pier has no poles above the bed")),
    false,
  );
  // A prop map is non-blocking and has its own boundary — reaching this one
  // would mean the prop boundary was bypassed, which is a bug, not a fallback.
  assert.equal(
    isBeachEntryAssetError(
      new Error("Failed to load /chungdoi/labs/beach-wedding-journey/photoreal/pier-planks-color.webp"),
    ),
    false,
  );
});

// ---------------------------------------------------------------------------
// Entry boundary
// ---------------------------------------------------------------------------

test("the boundary swallows an asset failure and rethrows a real bug", () => {
  const assetState = BeachEntryAssetBoundary.getDerivedStateFromError(
    new Error(`Failed to load ${EXPECTED_ENTRY_SRCS[0]}`),
  );
  assert.equal(assetState.assetFailed, true);
  assert.equal(assetState.shouldPropagate, false);
  assert.equal(assetState.errorToPropagate, null);

  const bug = new TypeError("mesh is not a function");
  const bugState = BeachEntryAssetBoundary.getDerivedStateFromError(bug);
  assert.equal(bugState.assetFailed, false);
  assert.equal(bugState.shouldPropagate, true);
  assert.equal(bugState.errorToPropagate, bug);
});

test("the boundary only reports a fallback for asset failures", () => {
  const fallbacks: number[] = [];
  const boundary = new BeachEntryAssetBoundary({
    children: null,
    fallback: null,
    onFallback: () => fallbacks.push(1),
  });

  boundary.componentDidCatch(new Error(`404 ${EXPECTED_ENTRY_SRCS[4]}`));
  assert.equal(fallbacks.length, 1);

  boundary.componentDidCatch(new TypeError("scene is undefined"));
  assert.equal(fallbacks.length, 1, "a bug does not announce a mode change");
});

test("the boundary renders children until an asset fails", () => {
  const boundary = new BeachEntryAssetBoundary({
    children: "photoreal",
    fallback: "simple",
    onFallback: () => {},
  });

  assert.equal(boundary.render(), "photoreal");

  boundary.state = BeachEntryAssetBoundary.getDerivedStateFromError(
    new Error(`404 ${EXPECTED_ENTRY_SRCS[0]}`),
  );
  assert.equal(boundary.render(), "simple");
});

test("a propagating boundary throws the original value, not a wrapper", () => {
  const bug = new RangeError("Beach frame geometry requires a horizontal look direction");
  const boundary = new BeachEntryAssetBoundary({
    children: "photoreal",
    fallback: "simple",
    onFallback: () => {},
  });
  boundary.state = BeachEntryAssetBoundary.getDerivedStateFromError(bug);

  assert.throws(() => boundary.render(), (thrown: unknown) => thrown === bug);
});

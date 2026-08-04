import assert from "node:assert/strict";
import path from "node:path";
import { test } from "node:test";

import sharp from "sharp";

import {
  beachWeddingJourneyDemoContent,
  beachWeddingJourneyFeatures,
  buildBeachJourneyScenes,
  type BeachJourneyScene,
} from "@/data/beach-wedding-journey";
import { getBeachFrameGeometry } from "@/components/beach-wedding-journey/beach-frame-geometry";
import { getBeachPhotorealAssetEstimate } from "@/components/beach-wedding-journey/photoreal/beach-asset-manifest";
import {
  BEACH_FRAME_MOULDING_DEPTH_METRES,
  BEACH_FRAME_MOULDING_FACE_METRES,
  BEACH_FRAME_PRINT_RECESS_METRES,
  BEACH_FRAME_SWAY_BASE_RADIANS,
  BEACH_FRAME_SWAY_RATE,
  BEACH_FRAME_SWAY_WIND_GAIN_RADIANS,
  BEACH_FRAME_VARIANT_COUNT,
  BEACH_PHOTO_MAX_EDGE_PIXELS,
  beachFrameSwayRadians,
  createBeachFrameMouldingGeometry,
  createBeachFramePrintGeometry,
  getBeachFrameHangerRise,
  getBeachFrameVariantIndex,
  getBeachPhotoUploadSize,
  measureBeachPhotoTextures,
  resolveBeachFramePlacements,
} from "@/components/beach-wedding-journey/photoreal/beach-photo-frames";

/**
 * The print the plan authored, restated here rather than imported: these tests
 * exist to check the frame is built around *this* size, so reading the size from
 * the module under test would make them agree with any value at all.
 */
const PRINT_WIDTH_METRES = 0.68;
const PRINT_HEIGHT_METRES = 0.96;

/**
 * The Global Constraints ceiling, in bytes.
 *
 * The plan writes it as "≤64 MB" and `beach-asset-manifest.test.ts` reads that
 * as 64 MiB; the stricter decimal reading is used here so a total that passes
 * this test passes under either.
 */
const DECODED_TEXTURE_CEILING = 64_000_000;

/**
 * Task 1 shipped two frame map sets — `frame-01-*` and `frame-02-*` — so the
 * moulding has exactly two variants to alternate between.
 */
const SHIPPED_FRAME_MAP_SETS = 2;

/** How many demo gallery photographs the walk hangs. */
const DEMO_GALLERY_PHOTO_COUNT = 3;

function demoScenes(): readonly BeachJourneyScene[] {
  return buildBeachJourneyScenes(
    beachWeddingJourneyDemoContent,
    beachWeddingJourneyFeatures,
  );
}

function galleryScene(
  id: string,
  photo: BeachJourneyScene["photo"],
): BeachJourneyScene {
  return {
    cameraPosition: [10, 1.62, 7],
    id,
    lookTarget: [14.5, 1.35, 5.9],
    ordinal: 5,
    photo,
    travelDurationMs: 2_400,
    travelMidpointToNext: null,
    type: "gallery-photo",
  };
}

/**
 * Tolerance for a measurement taken off a geometry, in metres.
 *
 * Positions live in a `Float32Array`, so a value authored as 1.08 reads back as
 * 1.0800000429153442. A micrometre is far below anything visible on a 0.68m
 * print and far above float32's error at these magnitudes.
 */
const GEOMETRY_TOLERANCE_METRES = 1e-6;

function assertMetres(actual: number, expected: number, label: string) {
  assert.ok(
    Math.abs(actual - expected) <= GEOMETRY_TOLERANCE_METRES,
    `${label}: expected ${expected}m, measured ${actual}m`,
  );
}

/** Axis-aligned bounds of a geometry, read off its position attribute. */
function bounds(geometry: {
  getAttribute: (name: string) => { count: number; getX: (i: number) => number; getY: (i: number) => number; getZ: (i: number) => number } | undefined;
}) {
  const position = geometry.getAttribute("position");
  assert.ok(position, "geometry has a position attribute");

  let maxX = -Infinity;
  let maxY = -Infinity;
  let maxZ = -Infinity;
  let minX = Infinity;
  let minY = Infinity;
  let minZ = Infinity;
  for (let index = 0; index < position.count; index += 1) {
    maxX = Math.max(maxX, position.getX(index));
    maxY = Math.max(maxY, position.getY(index));
    maxZ = Math.max(maxZ, position.getZ(index));
    minX = Math.min(minX, position.getX(index));
    minY = Math.min(minY, position.getY(index));
    minZ = Math.min(minZ, position.getZ(index));
  }
  return { maxX, maxY, maxZ, minX, minY, minZ, vertexCount: position.count };
}

/**
 * Decoded RGBA bytes of a full mip chain, restated independently of
 * `estimateExactRgbaMipBytes` so the measurement test cannot pass by agreeing
 * with the same implementation twice.
 */
function expectedMipBytes(width: number, height: number): number {
  let bytes = 0;
  let currentWidth = width;
  let currentHeight = height;
  for (;;) {
    bytes += currentWidth * currentHeight * 4;
    if (currentWidth === 1 && currentHeight === 1) return bytes;
    currentWidth = Math.max(1, Math.floor(currentWidth / 2));
    currentHeight = Math.max(1, Math.floor(currentHeight / 2));
  }
}

test("a frame hangs at each gallery photograph's authored position", () => {
  const scenes = demoScenes();
  const placements = resolveBeachFramePlacements(scenes);
  const gallery = scenes.filter((scene) => scene.type === "gallery-photo");

  assert.equal(gallery.length, DEMO_GALLERY_PHOTO_COUNT);
  assert.equal(placements.length, DEMO_GALLERY_PHOTO_COUNT);

  placements.forEach((placement, index) => {
    const scene = gallery[index]!;
    const geometry = getBeachFrameGeometry(scene);
    assert.equal(placement.sceneId, scene.id);
    assert.equal(placement.photoSrc, scene.photo?.src);
    assert.deepEqual(placement.position, geometry.position);
    assert.equal(placement.rotationY, geometry.rotationY);
  });
});

test("a gallery scene with no photograph hangs no frame", () => {
  const withPhoto = galleryScene("gallery-photo:with", {
    id: "with",
    src: "/chungdoi/images/demo/one.webp",
  });
  const withoutPhoto = galleryScene("gallery-photo:without", null);

  const placements = resolveBeachFramePlacements([withPhoto, withoutPhoto]);

  assert.equal(placements.length, 1);
  assert.equal(placements[0]!.sceneId, "gallery-photo:with");
});

test("frames alternate between the two shipped wood map sets", () => {
  assert.equal(BEACH_FRAME_VARIANT_COUNT, SHIPPED_FRAME_MAP_SETS);

  const variants = Array.from({ length: 7 }, (_unused, index) =>
    getBeachFrameVariantIndex(index));

  assert.deepEqual(variants, [0, 1, 0, 1, 0, 1, 0]);
  for (const variant of variants) {
    assert.ok(variant >= 0 && variant < SHIPPED_FRAME_MAP_SETS);
  }

  const placements = resolveBeachFramePlacements(demoScenes());
  assert.deepEqual(
    placements.map(({ variantIndex }) => variantIndex),
    [0, 1, 0],
  );
});

test("reduced motion stops the sway dead rather than slowing it", () => {
  for (const time of [0, 0.4, 1.7, 12.5, 900]) {
    assert.equal(
      beachFrameSwayRadians({
        phase: 1.3,
        reducedMotion: true,
        time,
        windStrength: 1,
      }),
      0,
    );
  }
});

test("sway amplitude grows with the wind cue and saturates at full strength", () => {
  // The peak of `sin` is reached when its argument is π/2.
  const peakTime = (Math.PI / 2) / BEACH_FRAME_SWAY_RATE;
  const peakAt = (windStrength: number) => beachFrameSwayRadians({
    phase: 0,
    reducedMotion: false,
    time: peakTime,
    windStrength,
  });

  const still = peakAt(0);
  const full = peakAt(1);

  assert.ok(Math.abs(still - BEACH_FRAME_SWAY_BASE_RADIANS) < 1e-12);
  assert.ok(
    Math.abs(
      full - (BEACH_FRAME_SWAY_BASE_RADIANS + BEACH_FRAME_SWAY_WIND_GAIN_RADIANS),
    ) < 1e-12,
  );
  assert.ok(full > still);

  // A cue outside 0..1 must not push the frames past their authored limit.
  assert.ok(Math.abs(peakAt(4) - full) < 1e-12);
  assert.ok(Math.abs(peakAt(-3) - still) < 1e-12);
});

test("sway stays a small readable angle at every phase and time", () => {
  const limit = BEACH_FRAME_SWAY_BASE_RADIANS + BEACH_FRAME_SWAY_WIND_GAIN_RADIANS;
  // 3 degrees: past this a hanging print starts to read as spinning, not swaying.
  const readableLimitRadians = (3 * Math.PI) / 180;

  assert.ok(limit < readableLimitRadians);

  for (let step = 0; step < 240; step += 1) {
    const angle = beachFrameSwayRadians({
      phase: step * 1.7,
      reducedMotion: false,
      time: step * 0.31,
      windStrength: 1,
    });
    assert.ok(Math.abs(angle) <= limit + 1e-12);
  }
});

test("the moulding pivots at the hanger, so a frame swings from its top edge", () => {
  const rise = getBeachFrameHangerRise(PRINT_HEIGHT_METRES);
  assertMetres(
    rise,
    PRINT_HEIGHT_METRES / 2 + BEACH_FRAME_MOULDING_FACE_METRES,
    "hanger rise",
  );

  const geometry = createBeachFrameMouldingGeometry(
    PRINT_WIDTH_METRES,
    PRINT_HEIGHT_METRES,
  );
  const box = bounds(geometry);

  // Top of the moulding sits exactly on the pivot: rotating the mesh rotates it
  // about the hanger, not about the middle of the picture.
  assertMetres(box.maxY, 0, "moulding top edge above the pivot");
  assertMetres(
    box.minY,
    -(PRINT_HEIGHT_METRES + BEACH_FRAME_MOULDING_FACE_METRES * 2),
    "moulding bottom edge below the pivot",
  );
  assertMetres(
    box.maxX,
    PRINT_WIDTH_METRES / 2 + BEACH_FRAME_MOULDING_FACE_METRES,
    "moulding outer half-width",
  );
  assertMetres(box.minX, -box.maxX, "moulding centred on the pivot");
  geometry.dispose();
});

test("the moulding is one merged geometry, so a frame is one draw call", () => {
  const geometry = createBeachFrameMouldingGeometry(
    PRINT_WIDTH_METRES,
    PRINT_HEIGHT_METRES,
  );

  // Four bars plus a backing board, each a box of 24 vertices.
  assert.equal(bounds(geometry).vertexCount, 5 * 24);
  // No material groups: one geometry drawn with one material in one call.
  assert.equal(geometry.groups.length, 0);
  assert.ok(geometry.boundingSphere);
  geometry.dispose();
});

test("the print sits recessed inside the moulding, sharing its pivot", () => {
  const moulding = createBeachFrameMouldingGeometry(
    PRINT_WIDTH_METRES,
    PRINT_HEIGHT_METRES,
  );
  const print = createBeachFramePrintGeometry(
    PRINT_WIDTH_METRES,
    PRINT_HEIGHT_METRES,
  );
  const mouldingBox = bounds(moulding);
  const printBox = bounds(print);

  // Recessed behind the moulding's front face by the authored recess.
  const frontFace = BEACH_FRAME_MOULDING_DEPTH_METRES / 2;
  assertMetres(
    printBox.maxZ,
    frontFace - BEACH_FRAME_PRINT_RECESS_METRES,
    "print recess behind the moulding face",
  );
  assert.ok(printBox.maxZ < mouldingBox.maxZ);
  assert.ok(BEACH_FRAME_PRINT_RECESS_METRES > 0);

  // Framed on all four sides: the moulding overlaps the print by its face width.
  assert.ok(printBox.maxX < mouldingBox.maxX);
  assert.ok(printBox.minX > mouldingBox.minX);
  assert.ok(printBox.maxY < mouldingBox.maxY);
  assert.ok(printBox.minY > mouldingBox.minY);
  assertMetres(
    mouldingBox.maxX - printBox.maxX,
    BEACH_FRAME_MOULDING_FACE_METRES,
    "moulding overlap beside the print",
  );

  // Same pivot as the moulding, so the two swing together.
  assertMetres(
    printBox.maxY,
    PRINT_HEIGHT_METRES / 2 - getBeachFrameHangerRise(PRINT_HEIGHT_METRES),
    "print top edge below the pivot",
  );
  assertMetres(
    printBox.maxX - printBox.minX,
    PRINT_WIDTH_METRES,
    "print width",
  );
  assertMetres(
    printBox.maxY - printBox.minY,
    PRINT_HEIGHT_METRES,
    "print height",
  );

  moulding.dispose();
  print.dispose();
});

test("photograph bytes are measured from the decoded image, not the request", () => {
  const diagnostics = measureBeachPhotoTextures([
    { source: { data: { naturalHeight: 1_024, naturalWidth: 1_024 } } },
    { source: { data: { height: 512, width: 256 } } },
  ]);

  assert.equal(diagnostics.textureCount, 2);
  assert.equal(diagnostics.unmeasuredCount, 0);
  assert.equal(
    diagnostics.decodedRgbaMipBytes,
    expectedMipBytes(1_024, 1_024) + expectedMipBytes(256, 512),
  );
});

test("a photograph still decoding reports as unmeasured, never as free", () => {
  const diagnostics = measureBeachPhotoTextures([
    { source: { data: null } },
    { source: null },
    {},
    { source: { data: { height: 0, width: 0 } } },
    { source: { data: { naturalHeight: 4, naturalWidth: 4 } } },
  ]);

  assert.equal(diagnostics.textureCount, 5);
  assert.equal(diagnostics.unmeasuredCount, 4);
  assert.equal(diagnostics.decodedRgbaMipBytes, expectedMipBytes(4, 4));
});

test("measuring no photographs reports nothing rather than throwing", () => {
  assert.deepEqual(measureBeachPhotoTextures([]), {
    decodedRgbaMipBytes: 0,
    textureCount: 0,
    unmeasuredCount: 0,
  });
});

// The tests above measure whatever size a photograph arrives at. The ones below
// pin the size it is allowed to arrive at: the demo gallery's own sources are
// 1363x2048, and uploaded at native size three of them decode to 44,649,828
// bytes, which on top of the shared pack's 46,137,353 puts a gallery scene at
// 90,787,181 — 42% over the 64MB ceiling the manifest is measured against.

test("an oversized photograph is capped on its longest edge, keeping aspect", () => {
  // The exact dimensions of the qasr-green demo gallery photographs.
  assert.deepEqual(getBeachPhotoUploadSize(1_363, 2_048), {
    height: 1_024,
    width: 681,
  });
  // Landscape caps on width, and the ratio survives: 2048/1363 = 1.5026,
  // 1024/681 = 1.5037, inside a floored pixel of each other.
  assert.deepEqual(getBeachPhotoUploadSize(2_048, 1_363), {
    height: 681,
    width: 1_024,
  });
  assert.deepEqual(getBeachPhotoUploadSize(4_096, 4_096), {
    height: 1_024,
    width: 1_024,
  });
});

test("a photograph already inside the cap is not resampled", () => {
  // Upsampling costs memory and adds no detail, so a small photograph passes
  // through untouched rather than being stretched to the cap.
  assert.deepEqual(getBeachPhotoUploadSize(512, 384), {
    height: 384,
    width: 512,
  });
  assert.deepEqual(
    getBeachPhotoUploadSize(BEACH_PHOTO_MAX_EDGE_PIXELS, 8),
    { height: 8, width: BEACH_PHOTO_MAX_EDGE_PIXELS },
  );
});

test("an extreme aspect ratio cannot cap to a zero-sized texture", () => {
  // 4 * (1024/8192) floors to 0; a zero-width upload would throw in
  // `estimateExactRgbaMipBytes` and upload nothing to the GPU.
  const upload = getBeachPhotoUploadSize(8_192, 4);
  assert.equal(upload.width, BEACH_PHOTO_MAX_EDGE_PIXELS);
  assert.equal(upload.height, 1);
});

test("three capped photographs leave the shared pack inside the 64MB ceiling", async () => {
  const shared = getBeachPhotorealAssetEstimate("shared");
  const scenes = buildBeachJourneyScenes(
    beachWeddingJourneyDemoContent,
    beachWeddingJourneyFeatures,
  );
  const placements = resolveBeachFramePlacements(scenes);
  assert.equal(placements.length, 3);

  // Measured from the files the lab actually serves, not from declared numbers,
  // so re-exporting the demo gallery at a new size re-runs this budget.
  let cappedBytes = 0;
  let uncappedBytes = 0;
  for (const { photoSrc } of placements) {
    const { height, width } = await sharp(
      path.join(process.cwd(), "public", photoSrc),
    ).metadata();
    assert.ok(
      typeof width === "number" && typeof height === "number",
      `${photoSrc} has no readable dimensions`,
    );
    const upload = getBeachPhotoUploadSize(width, height);
    assert.ok(
      Math.max(upload.width, upload.height) <= BEACH_PHOTO_MAX_EDGE_PIXELS,
      `${photoSrc} caps to ${upload.width}x${upload.height}`,
    );
    cappedBytes += expectedMipBytes(upload.width, upload.height);
    uncappedBytes += expectedMipBytes(width, height);
  }

  assert.ok(
    shared.decodedRgbaMipBytes + cappedBytes <= DECODED_TEXTURE_CEILING,
    `capped gallery total ${shared.decodedRgbaMipBytes + cappedBytes} exceeds 64MB`,
  );

  // Without the cap the same three photographs breach it, which is the
  // regression this pair of assertions exists to hold shut.
  assert.ok(
    shared.decodedRgbaMipBytes + uncappedBytes > DECODED_TEXTURE_CEILING,
    "the demo gallery no longer needs a cap — re-check whether this test still earns its keep",
  );
});

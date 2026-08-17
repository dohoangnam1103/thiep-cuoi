#!/usr/bin/env node

import { createHash } from "node:crypto";
import { copyFile, mkdir, readFile, stat, writeFile } from "node:fs/promises";
import path from "node:path";

import sharp from "sharp";

const ROOT = process.cwd();
const DEFAULT_SOURCE_DIR = path.join(
  ROOT,
  "tmp/beach-photoreal-sources/poly-haven",
);
const DEFAULT_OUTPUT_DIR = path.join(
  ROOT,
  "public/chungdoi/labs/beach-wedding-journey/photoreal",
);

const POLY_HAVEN_SOURCES = Object.freeze({
  frame01Arm: {
    filename: "hanging_picture_frame_01_arm_1k.jpg",
    md5: "8d9dd625ec0705f3ac0a2ec2b402844e",
    url: "https://dl.polyhaven.org/file/ph-assets/Models/jpg/1k/hanging_picture_frame_01/hanging_picture_frame_01_arm_1k.jpg",
  },
  frame01Color: {
    filename: "hanging_picture_frame_01_diff_1k.jpg",
    md5: "4311cd03620cafa59976f9e8b7b26f88",
    url: "https://dl.polyhaven.org/file/ph-assets/Models/jpg/1k/hanging_picture_frame_01/hanging_picture_frame_01_diff_1k.jpg",
  },
  frame01Normal: {
    filename: "hanging_picture_frame_01_nor_gl_1k.jpg",
    md5: "2ff7cca9a9b2918b5476d39c13592214",
    url: "https://dl.polyhaven.org/file/ph-assets/Models/jpg/1k/hanging_picture_frame_01/hanging_picture_frame_01_nor_gl_1k.jpg",
  },
  frame02Arm: {
    filename: "hanging_picture_frame_02_arm_1k.jpg",
    md5: "01e09bbe488c7a2953b5a207fdf192ca",
    url: "https://dl.polyhaven.org/file/ph-assets/Models/jpg/1k/hanging_picture_frame_02/hanging_picture_frame_02_arm_1k.jpg",
  },
  frame02Color: {
    filename: "hanging_picture_frame_02_diff_1k.jpg",
    md5: "906c164baad3f02b67244998b7558a9c",
    url: "https://dl.polyhaven.org/file/ph-assets/Models/jpg/1k/hanging_picture_frame_02/hanging_picture_frame_02_diff_1k.jpg",
  },
  frame02Normal: {
    filename: "hanging_picture_frame_02_nor_gl_1k.jpg",
    md5: "bc686a415608ae66bd88f70d081fd572",
    url: "https://dl.polyhaven.org/file/ph-assets/Models/jpg/1k/hanging_picture_frame_02/hanging_picture_frame_02_nor_gl_1k.jpg",
  },
  driftwoodArm: {
    filename: "modular_wooden_pier_planks_arm_1k.jpg",
    md5: "e6ffdf7314cc015aaa5c0899326b42a7",
    url: "https://dl.polyhaven.org/file/ph-assets/Models/jpg/1k/modular_wooden_pier/modular_wooden_pier_planks_arm_1k.jpg",
  },
  driftwoodColor: {
    filename: "modular_wooden_pier_planks_diff_1k.jpg",
    md5: "f3fef39b0ec16e4006678c846d3601ab",
    url: "https://dl.polyhaven.org/file/ph-assets/Models/jpg/1k/modular_wooden_pier/modular_wooden_pier_planks_diff_1k.jpg",
  },
  driftwoodNormal: {
    filename: "modular_wooden_pier_planks_nor_gl_1k.jpg",
    md5: "b752108fe7504d5dd4ae0f4701b1218b",
    url: "https://dl.polyhaven.org/file/ph-assets/Models/jpg/1k/modular_wooden_pier/modular_wooden_pier_planks_nor_gl_1k.jpg",
  },
  hdri: {
    filename: "table_mountain_1_puresky_1k.hdr",
    md5: "6c68d0e51d99c9a8a93438472ab8bc42",
    url: "https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/1k/table_mountain_1_puresky_1k.hdr",
  },
  sandArm: {
    filename: "sand_03_arm_1k.jpg",
    md5: "2d69c938c9ce5d4ba41f4789eae3a9cb",
    url: "https://dl.polyhaven.org/file/ph-assets/Textures/jpg/1k/sand_03/sand_03_arm_1k.jpg",
  },
  sandColor: {
    filename: "sand_03_diff_1k.jpg",
    md5: "84bde2b8bea6351805f67a15682b36b2",
    url: "https://dl.polyhaven.org/file/ph-assets/Textures/jpg/1k/sand_03/sand_03_diff_1k.jpg",
  },
  sandNormal: {
    filename: "sand_03_nor_gl_1k.jpg",
    md5: "ad8d6ce28344b1d8f241cbd7796243dc",
    url: "https://dl.polyhaven.org/file/ph-assets/Textures/jpg/1k/sand_03/sand_03_nor_gl_1k.jpg",
  },
  wetSandArm: {
    filename: "damp_sand_arm_1k.jpg",
    md5: "c4653c6996f55d919bf89fe3f21920de",
    url: "https://dl.polyhaven.org/file/ph-assets/Textures/jpg/1k/damp_sand/damp_sand_arm_1k.jpg",
  },
  wetSandColor: {
    filename: "damp_sand_diff_1k.jpg",
    md5: "fd55de6d79f938dbf5cc0f5e1f473c6c",
    url: "https://dl.polyhaven.org/file/ph-assets/Textures/jpg/1k/damp_sand/damp_sand_diff_1k.jpg",
  },
});

const ENTRY_COMPRESSED_BUDGET = 4_000_000;
const SHARED_COMPRESSED_BUDGET = 12_000_000;
const SAND_TEXTURE_SIZE = 1_024;
const WATER_NORMAL_SIZE = 512;
/**
 * Driftwood maps ship at 512, down from the 1k the deleted pier needed.
 *
 * The pier was a large tiled deck the camera walked along, so halving it read as
 * mush underfoot. With the pier gone the same `modular_wooden_pier` set dresses
 * only the driftwood posts, which are 0.15m-wide cylinders seen from 2m and up —
 * three tiles of grain up a post at 512 is already past what the silhouette
 * resolves. Halving all three maps returns 12.6MB of the decoded ceiling
 * (16.8MB at 1k to 4.2MB at 512), which is what pays for the reception tables.
 */
const DRIFTWOOD_TEXTURE_SIZE = 512;
/**
 * Frame maps ship at 512, forced by the 64MB decoded-texture ceiling.
 *
 * Nine prop maps at 1k decode to 50.3MB, which with the 21.0MB entry group and
 * the 16.8MB worst case of three live 1k gallery photos totals 88.1MB — 21.0MB
 * over. Frames are narrow mouldings around the photos, so they lose the least
 * from 512; the ceiling is a hard constraint and is never the thing that moves.
 */
const FRAME_TEXTURE_SIZE = 512;
/**
 * White-sand grade for `sand_03`, applied to the dry colour map only.
 *
 * Replaces the golden-hour warm-up that shipped with `coast_sand_01`. Measured
 * on a 512 resample: ungraded `sand_03` is L* 41.4 at 27.1% mean saturation —
 * finer-grained than `coast_sand_01` (high-frequency grain RMS 10.33 against
 * 30.93) but too dark and too warm to read as white. The blue channel is lifted
 * hardest because the residual cast is yellow; scaling all three equally raises
 * lightness without touching saturation, since saturation is a ratio.
 *
 * At these gains the map measures L* 58.0 at 15.5% saturation with 0.00% of
 * pixels clipped, so the sand reads bright and near-neutral while keeping its
 * grain. Normal and ARM maps are data and are never graded.
 */
const WHITE_SAND_GAIN = Object.freeze([1.38, 1.44, 1.6]);

/**
 * Declared dimensions of the HDRI, which never passes through Sharp.
 *
 * The radiance file is copied byte-for-byte so the environment map keeps its
 * high dynamic range; re-encoding it — even a decode-and-write round trip —
 * would clamp it to LDR. The dimensions are Poly Haven's published 1k size and
 * are recorded here only for the byte table.
 */
const HDRI_DIMENSIONS = Object.freeze({ height: 512, width: 1_024 });

const OUTPUTS = Object.freeze([
  { blocking: true, filename: "sand-color.webp", group: "entry", height: SAND_TEXTURE_SIZE, id: "sandColor", width: SAND_TEXTURE_SIZE },
  { blocking: true, filename: "sand-normal.webp", group: "entry", height: SAND_TEXTURE_SIZE, id: "sandNormal", width: SAND_TEXTURE_SIZE },
  { blocking: true, filename: "sand-arm.webp", group: "entry", height: SAND_TEXTURE_SIZE, id: "sandArm", width: SAND_TEXTURE_SIZE },
  { blocking: true, filename: "water-normal.webp", group: "entry", height: WATER_NORMAL_SIZE, id: "waterNormal", width: WATER_NORMAL_SIZE },
  { blocking: true, filename: "sky.hdr", group: "entry", height: HDRI_DIMENSIONS.height, id: "sky", radiance: true, width: HDRI_DIMENSIONS.width },
  { blocking: false, filename: "driftwood-color.webp", group: "props", height: DRIFTWOOD_TEXTURE_SIZE, id: "driftwoodColor", width: DRIFTWOOD_TEXTURE_SIZE },
  { blocking: false, filename: "driftwood-normal.webp", group: "props", height: DRIFTWOOD_TEXTURE_SIZE, id: "driftwoodNormal", width: DRIFTWOOD_TEXTURE_SIZE },
  { blocking: false, filename: "driftwood-arm.webp", group: "props", height: DRIFTWOOD_TEXTURE_SIZE, id: "driftwoodArm", width: DRIFTWOOD_TEXTURE_SIZE },
  { blocking: false, filename: "frame-01-color.webp", group: "props", height: FRAME_TEXTURE_SIZE, id: "frame01Color", width: FRAME_TEXTURE_SIZE },
  { blocking: false, filename: "frame-01-normal.webp", group: "props", height: FRAME_TEXTURE_SIZE, id: "frame01Normal", width: FRAME_TEXTURE_SIZE },
  { blocking: false, filename: "frame-01-arm.webp", group: "props", height: FRAME_TEXTURE_SIZE, id: "frame01Arm", width: FRAME_TEXTURE_SIZE },
  { blocking: false, filename: "frame-02-color.webp", group: "props", height: FRAME_TEXTURE_SIZE, id: "frame02Color", width: FRAME_TEXTURE_SIZE },
  { blocking: false, filename: "frame-02-normal.webp", group: "props", height: FRAME_TEXTURE_SIZE, id: "frame02Normal", width: FRAME_TEXTURE_SIZE },
  { blocking: false, filename: "frame-02-arm.webp", group: "props", height: FRAME_TEXTURE_SIZE, id: "frame02Arm", width: FRAME_TEXTURE_SIZE },
]);

function getArgument(name, fallback) {
  const exactIndex = process.argv.indexOf(name);
  if (exactIndex >= 0) {
    const value = process.argv[exactIndex + 1];
    if (!value || value.startsWith("--")) {
      throw new Error(`${name} requires a path`);
    }
    return path.resolve(ROOT, value);
  }

  const inline = process.argv.find((value) => value.startsWith(`${name}=`));
  return inline ? path.resolve(ROOT, inline.slice(name.length + 1)) : fallback;
}

function digest(algorithm, buffer) {
  return createHash(algorithm).update(buffer).digest("hex");
}

async function loadVerifiedSource(sourceDir, source) {
  const destination = path.join(sourceDir, source.filename);
  let buffer;

  try {
    buffer = await readFile(destination);
  } catch {
    const response = await fetch(source.url);
    if (!response.ok) {
      throw new Error(`Unable to download ${source.url}: ${response.status}`);
    }
    buffer = Buffer.from(await response.arrayBuffer());
    await writeFile(destination, buffer);
  }

  const actualMd5 = digest("md5", buffer);
  if (actualMd5 !== source.md5) {
    throw new Error(
      `Checksum mismatch for ${source.filename}: expected ${source.md5}, received ${actualMd5}`,
    );
  }

  return {
    path: destination,
    sha256: digest("sha256", buffer),
  };
}

const WET_BAND_START_V = 0.62;
/**
 * Width of the damp band's inland feather, in V.
 *
 * Widened from 0.16. The narrow feather put the full wet-to-dry transition
 * inside 3.4m of ground at the shore UV mapping, which is what made the damp
 * strip read as a pasted-on border rather than as sand drying out. At 0.30 the
 * same transition spans roughly 6.4m and the seam has no single edge to catch
 * the eye on.
 */
const WET_BAND_FEATHER_V = 0.3;
/**
 * How much of the damp sand's own chroma survives, and its lightness gain.
 *
 * This is the fix for the waterline reading as a different colour of sand.
 * `damp_sand_diff` measures 55.6% mean saturation against the white-graded dry
 * sand's 15.5% — an 86% relative jump in chroma, at a comparable lightness — so
 * compositing it produced a band that was not darker sand but *oranger* sand.
 *
 * Keeping 35% of its chroma and lifting it 1.25x measures L* 51.4 at 22.6%
 * saturation: still visibly damper and darker than the L* 58.0 dry sand, which
 * is physically what wet sand does, but now inside the same colour family
 * instead of beside it. Chroma is pulled toward the pixel's own luminance rather
 * than toward grey, so the damp texture's contrast survives the desaturation.
 */
const WET_SAND_CHROMA_KEEP = 0.35;
const WET_SAND_GAIN = 1.25;

/**
 * Alpha mask for compositing damp sand over dry along the tile's V axis, so the
 * shore edge carries damp texture instead of meeting the water as a clean line.
 */
async function createWetBandMask(size) {
  const mask = Buffer.alloc(size * size);
  for (let y = 0; y < size; y += 1) {
    const v = y / (size - 1);
    const ramp = (v - WET_BAND_START_V) / WET_BAND_FEATHER_V;
    const coverage = Math.max(0, Math.min(1, ramp));
    // Smoothstep, so the band's inland edge is a gradient, not a stripe.
    const alpha = Math.round(255 * coverage * coverage * (3 - 2 * coverage));
    mask.fill(alpha, y * size, (y + 1) * size);
  }
  return mask;
}

/**
 * Pulls a pixel's chroma toward its own luminance, then applies a gain.
 *
 * Applied to the damp colour layer before compositing. Sharp's `linear` cannot
 * express this: a per-channel gain rescales all three channels by a constant, so
 * it moves lightness but leaves the max-to-min channel ratio — the saturation —
 * exactly where it was. That is why the previous per-channel warm-up could not
 * have closed the waterline's chroma gap however it was tuned.
 */
function desaturateTowardLuminance(rgb, keep, gain) {
  const out = Buffer.alloc(rgb.length);
  for (let index = 0; index < rgb.length; index += 3) {
    const r = rgb[index];
    const g = rgb[index + 1];
    const b = rgb[index + 2];
    const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    for (let channel = 0; channel < 3; channel += 1) {
      const value = rgb[index + channel];
      const graded = (luminance + (value - luminance) * keep) * gain;
      out[index + channel] = Math.max(0, Math.min(255, Math.round(graded)));
    }
  }
  return out;
}

/**
 * Applies a per-channel gain to raw RGB.
 *
 * Done on the buffer rather than through Sharp's `linear` because Sharp applies
 * its operations in a fixed internal order, not call order: `linear` lands
 * *after* `composite`, so grading the dry base through the pipeline graded the
 * composited damp band along with it. That measured L* 71.7 for fully-wet sand
 * against dry sand's 58.5 — wet sand brighter than dry, the inverse of what wet
 * sand does — because the damp layer was scaled twice, once by its own grade and
 * again by the dry map's. Both grades are explicit here so the order is the order
 * they are written in.
 */
function applyGain(rgb, gain) {
  const out = Buffer.alloc(rgb.length);
  for (let index = 0; index < rgb.length; index += 3) {
    for (let channel = 0; channel < 3; channel += 1) {
      const scaled = rgb[index + channel] * gain[channel];
      out[index + channel] = Math.max(0, Math.min(255, Math.round(scaled)));
    }
  }
  return out;
}

async function encodeSandMap(dryPath, wetPath, destination, { dataMap }) {
  const size = SAND_TEXTURE_SIZE;
  const resize = { fit: "fill", kernel: sharp.kernel.lanczos3 };

  const dryBase = await sharp(dryPath)
    .resize(size, size, resize)
    .removeAlpha()
    .raw()
    .toBuffer();
  const wetBase = await sharp(wetPath)
    .resize(size, size, resize)
    .removeAlpha()
    .raw()
    .toBuffer();

  // The colour map is graded; the ARM map's channels are ambient occlusion,
  // roughness and metalness, so neither the white grade nor the chroma pull
  // means anything there and both would corrupt the material data.
  const dry = dataMap ? dryBase : applyGain(dryBase, WHITE_SAND_GAIN);
  const wet = dataMap
    ? wetBase
    : desaturateTowardLuminance(
      wetBase,
      WET_SAND_CHROMA_KEEP,
      WET_SAND_GAIN,
    );

  const mask = await createWetBandMask(size);
  const blended = Buffer.alloc(size * size * 3);
  for (let index = 0; index < size * size; index += 1) {
    const alpha = mask[index] / 255;
    for (let channel = 0; channel < 3; channel += 1) {
      const offset = index * 3 + channel;
      blended[offset] = Math.round(
        dry[offset] * (1 - alpha) + wet[offset] * alpha,
      );
    }
  }

  await sharp(blended, { raw: { channels: 3, height: size, width: size } })
    .webp({ effort: 6, lossless: false, quality: 88 })
    .toFile(destination);
}

/**
 * Plain resize → WebP, used for every map with no compositing of its own.
 *
 * `sand-normal.webp` runs through here rather than `encodeSandMap`: Poly Haven
 * publishes `damp_sand` as colour and ARM only, so there is no damp normal to
 * blend into the wet band, and inventing one would put fabricated slopes under
 * a measured albedo.
 */
async function encodeTexture(sourcePath, destination, { size }) {
  const image = sharp(sourcePath)
    .resize(size, size, { fit: "fill", kernel: sharp.kernel.lanczos3 })
    .removeAlpha();

  await image.webp({ effort: 6, lossless: false, quality: 88 }).toFile(destination);
}

const WATER_NOISE_SEED = 0x5eab1234;
const WATER_NOISE_OCTAVES = Object.freeze([
  { amplitude: 1.0, period: 64 },
  { amplitude: 0.5, period: 32 },
  { amplitude: 0.25, period: 16 },
]);
/**
 * Normal-map slope strength, sized against the *corrected* tiling generator.
 *
 * The plan's 1.35 was tuned while `tilingValueNoise` still computed `scale =
 * period / size`, which produced white noise whose central-difference gradients
 * were roughly 10x larger. On the fixed smooth field those gradients measure max
 * 0.053 / mean 0.015, so 1.35 encoded a near-mirror: max surface tilt 4.27deg,
 * only 18 of 256 byte levels used in X and in Y, and a Z channel pinned at a
 * constant 255 — zero information, with 20px constant runs along a 512px row.
 * Quantisation is baked into the texture, so no runtime distortion multiplier
 * recovers it; amplifying a quantised map only amplifies its banding, which
 * water shows off in its specular highlights.
 *
 * Measured at 10 (this value): max tilt 27.88deg, byte levels X 112 / Y 111 /
 * Z 16, min Z byte 240, every normal unit length (max error 0.0052), none
 * inverted or degenerate, and all 262,144 still Z-dominant — long swell, not
 * choppy detail. Reference points from the same harness: 1.35 -> 4.27deg / X 18,
 * 8 -> 23.26deg / X 94, 14 -> 36.74deg / X 144, 20 -> 46.60deg / X 177 but 43
 * pixels lose Z-dominance, which is where the slope stops reading as swell.
 */
const WATER_NORMAL_STRENGTH = 10;
/**
 * Max per-channel delta allowed between opposite tile edges.
 *
 * The wrapping lattice makes the tile seamless by construction, so this only
 * ever trips when the generator itself breaks — which is exactly how the white
 * noise field shipped: the seam check lived in a manual verification step
 * outside the script instead of in this path.
 */
const WATER_SEAM_TOLERANCE = 12;

/** Deterministic integer hash — no Math.random, so output is reproducible. */
function hashLattice(x, y, seed) {
  let h = (x * 374_761_393 + y * 668_265_263 + seed) | 0;
  h = (h ^ (h >>> 13)) * 1_274_126_177;
  return ((h ^ (h >>> 16)) >>> 0) / 4_294_967_295;
}

function smoothstep(t) {
  return t * t * (3 - 2 * t);
}

/** Value noise on a wrapping lattice, so the tile is seamless in both axes. */
function tilingValueNoise(x, y, period, size, seed) {
  // `period` is the lattice cell size in pixels, so the tile spans `size /
  // period` cells and `wrap` closes the loop at the tile edge. Deriving this as
  // `period / size` instead advances the lattice index by `size / period` per
  // pixel — every pixel lands in its own cell, which is white noise, not value
  // noise — and pushes the wrap modulus to `size * size / period`, a value `x`
  // never reaches, so the tile never wraps. That is the one line of the plan's
  // generator changed here; every constant it feeds is unchanged.
  const scale = period;
  const gx = x / scale;
  const gy = y / scale;
  const x0 = Math.floor(gx);
  const y0 = Math.floor(gy);
  const cells = Math.round(size / scale);
  const wrap = (value) => ((value % cells) + cells) % cells;
  const fx = smoothstep(gx - x0);
  const fy = smoothstep(gy - y0);

  const c00 = hashLattice(wrap(x0), wrap(y0), seed);
  const c10 = hashLattice(wrap(x0 + 1), wrap(y0), seed);
  const c01 = hashLattice(wrap(x0), wrap(y0 + 1), seed);
  const c11 = hashLattice(wrap(x0 + 1), wrap(y0 + 1), seed);

  return (
    c00 * (1 - fx) * (1 - fy) +
    c10 * fx * (1 - fy) +
    c01 * (1 - fx) * fy +
    c11 * fx * fy
  );
}

function sampleWaterHeight(x, y, size) {
  let height = 0;
  let total = 0;
  for (const [index, octave] of WATER_NOISE_OCTAVES.entries()) {
    height +=
      octave.amplitude *
      tilingValueNoise(x, y, octave.period, size, WATER_NOISE_SEED + index * 7_919);
    total += octave.amplitude;
  }
  return height / total;
}

/**
 * Largest per-channel difference between the tile's opposite edges.
 *
 * Read off the raw RGB the encoder is about to hand to Sharp: the WebP is
 * lossless, so the buffer and the file agree byte for byte.
 */
function maxOppositeEdgeDelta(rgb, size) {
  let columns = 0;
  let rows = 0;
  for (let index = 0; index < size; index += 1) {
    for (let channel = 0; channel < 3; channel += 1) {
      const lastColumn = (index * size + size - 1) * 3 + channel;
      const firstColumn = index * size * 3 + channel;
      columns = Math.max(columns, Math.abs(rgb[lastColumn] - rgb[firstColumn]));

      const lastRow = ((size - 1) * size + index) * 3 + channel;
      const firstRow = index * 3 + channel;
      rows = Math.max(rows, Math.abs(rgb[lastRow] - rgb[firstRow]));
    }
  }
  return { columns, rows };
}

async function encodeWaterNormal(destination) {
  const size = WATER_NORMAL_SIZE;
  const heights = new Float32Array(size * size);
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      heights[y * size + x] = sampleWaterHeight(x, y, size);
    }
  }

  const wrapIndex = (value) => ((value % size) + size) % size;
  const rgb = Buffer.alloc(size * size * 3);
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      // Central differences on the wrapping lattice keep the edges seamless.
      const dx =
        heights[y * size + wrapIndex(x + 1)] - heights[y * size + wrapIndex(x - 1)];
      const dy =
        heights[wrapIndex(y + 1) * size + x] - heights[wrapIndex(y - 1) * size + x];
      const nx = -dx * WATER_NORMAL_STRENGTH;
      const ny = -dy * WATER_NORMAL_STRENGTH;
      const length = Math.hypot(nx, ny, 1);
      const offset = (y * size + x) * 3;
      rgb[offset] = Math.round(((nx / length) * 0.5 + 0.5) * 255);
      rgb[offset + 1] = Math.round(((ny / length) * 0.5 + 0.5) * 255);
      rgb[offset + 2] = Math.round(((1 / length) * 0.5 + 0.5) * 255);
    }
  }

  // Assert before writing: a tile that does not wrap must not reach the output
  // directory, and the failure has to name the axis so the generator is the
  // first place to look.
  const seam = maxOppositeEdgeDelta(rgb, size);
  const worstDelta = Math.max(seam.columns, seam.rows);
  if (worstDelta > WATER_SEAM_TOLERANCE) {
    throw new Error(
      `water-normal tile is not seamless: max opposite-edge delta ${worstDelta} (columns ${seam.columns}, rows ${seam.rows}) exceeds ${WATER_SEAM_TOLERANCE} — the noise lattice is not wrapping`,
    );
  }

  await sharp(rgb, { raw: { channels: 3, height: size, width: size } })
    .webp({ effort: 6, lossless: true })
    .toFile(destination);

  console.log(
    `water-normal seam delta ${worstDelta} / ${WATER_SEAM_TOLERANCE} (columns ${seam.columns}, rows ${seam.rows})`,
  );
}

/**
 * Copies the radiance HDRI verbatim and proves the copy is bit-identical.
 *
 * The environment map is the whole lighting rig for the golden-hour scene, and
 * its above-1.0 sun values only survive in the original float encoding. Sharp
 * is deliberately not in this path — the assertion is here so a future
 * "just resize it" edit fails the pipeline instead of silently shipping LDR.
 */
async function copyRadianceHdri(source, destination) {
  await copyFile(source.path, destination);

  const copied = digest("sha256", await readFile(destination));
  if (copied !== source.sha256) {
    throw new Error(
      `sky.hdr must be copied byte-for-byte: source sha256 ${source.sha256}, written ${copied}`,
    );
  }
}

/** CIE L* of an sRGB byte triple, used by the sand band assertions. */
function lightness(r, g, b) {
  const toLinear = (byte) => {
    const s = byte / 255;
    return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  const y = 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
  return y > 0.008856 ? 116 * y ** (1 / 3) - 16 : 903.3 * y;
}

/** Mean L* and mean saturation of a band of rows, in V. */
function bandStats(rgb, size, fromV, toV) {
  const y0 = Math.floor(fromV * (size - 1));
  const y1 = Math.max(y0 + 1, Math.floor(toV * (size - 1)));
  let lightnessSum = 0;
  let saturationSum = 0;
  let count = 0;

  for (let y = y0; y < y1; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const offset = (y * size + x) * 3;
      const r = rgb[offset];
      const g = rgb[offset + 1];
      const b = rgb[offset + 2];
      const max = Math.max(r, g, b);
      const min = Math.min(r, g, b);
      saturationSum += max === 0 ? 0 : (max - min) / max;
      lightnessSum += lightness(r, g, b);
      count += 1;
    }
  }

  return { lightness: lightnessSum / count, saturation: saturationSum / count };
}

/**
 * The largest saturation step between adjacent rows, in percentage points.
 *
 * A visible waterline seam is a discontinuity down V, so this measures the thing
 * the eye actually catches rather than the endpoint values.
 */
function maxRowSaturationStep(rgb, size) {
  let previous = null;
  let worst = 0;
  let worstV = 0;

  for (let y = 0; y < size; y += 1) {
    let saturationSum = 0;
    for (let x = 0; x < size; x += 1) {
      const offset = (y * size + x) * 3;
      const max = Math.max(rgb[offset], rgb[offset + 1], rgb[offset + 2]);
      const min = Math.min(rgb[offset], rgb[offset + 1], rgb[offset + 2]);
      saturationSum += max === 0 ? 0 : (max - min) / max;
    }
    const saturation = saturationSum / size;
    if (previous !== null && Math.abs(saturation - previous) > worst) {
      worst = Math.abs(saturation - previous);
      worstV = y / size;
    }
    previous = saturation;
  }

  return { step: worst * 100, v: worstV };
}

/** Largest tolerated saturation step between adjacent rows, in points. */
const WET_BAND_MAX_SATURATION_STEP_POINTS = 2;

/**
 * Proves the graded sand still reads as one beach.
 *
 * Three properties, each of which has actually broken during this work:
 *
 * 1. Wet sand must be *darker* than dry. Grading the dry base through Sharp's
 *    pipeline put the `linear` after the `composite`, so the damp band was graded
 *    twice and measured L* 71.7 against dry sand's 58.5 — glowing wet sand.
 * 2. The dry sand must actually be white-ish, or requirement "white, fine sand"
 *    is unmet however fine the grain is.
 * 3. No abrupt chroma step down V, which is what made the old waterline read as
 *    a pasted-on strip of a different sand.
 */
async function validateSandBands(outputDir) {
  const size = SAND_TEXTURE_SIZE;
  const rgb = await sharp(path.join(outputDir, "sand-color.webp"))
    .raw()
    .toBuffer();

  const dry = bandStats(rgb, size, 0, 0.55);
  const wet = bandStats(rgb, size, 0.94, 1);
  const seam = maxRowSaturationStep(rgb, size);

  if (wet.lightness >= dry.lightness) {
    throw new Error(
      `Wet sand must be darker than dry: dry L* ${dry.lightness.toFixed(1)}, wet L* ${wet.lightness.toFixed(1)}. Check that no grade is applied after the wet band is composited.`,
    );
  }
  if (dry.lightness < 55) {
    throw new Error(
      `Dry sand must read white: L* ${dry.lightness.toFixed(1)} is below 55. Raise WHITE_SAND_GAIN.`,
    );
  }
  if (seam.step > WET_BAND_MAX_SATURATION_STEP_POINTS) {
    throw new Error(
      `Waterline has a visible chroma seam: ${seam.step.toFixed(2)}pp saturation step at V ${seam.v.toFixed(3)}, over the ${WET_BAND_MAX_SATURATION_STEP_POINTS}pp limit. Widen WET_BAND_FEATHER_V or lower WET_SAND_CHROMA_KEEP.`,
    );
  }

  console.log(
    `sand bands: dry L* ${dry.lightness.toFixed(1)} / sat ${(100 * dry.saturation).toFixed(1)}%, `
    + `wet L* ${wet.lightness.toFixed(1)} / sat ${(100 * wet.saturation).toFixed(1)}%, `
    + `max seam step ${seam.step.toFixed(2)}pp / ${WET_BAND_MAX_SATURATION_STEP_POINTS}pp`,
  );
}

async function validateOutputs(outputDir) {
  const assets = [];

  for (const expected of OUTPUTS) {
    const outputPath = path.join(outputDir, expected.filename);
    const file = await stat(outputPath);

    if (!expected.radiance) {
      const metadata = await sharp(outputPath).metadata();
      if (metadata.width !== expected.width || metadata.height !== expected.height) {
        throw new Error(
          `${expected.filename} must be ${expected.width}x${expected.height}, received ${metadata.width}x${metadata.height}`,
        );
      }
    }

    assets.push({ ...expected, bytes: file.size });
  }

  const entryAssets = assets.filter(({ blocking }) => blocking);
  const entryCompressedBytes = entryAssets.reduce(
    (total, asset) => total + asset.bytes,
    0,
  );
  const sharedCompressedBytes = assets.reduce(
    (total, asset) => total + asset.bytes,
    0,
  );

  if (entryCompressedBytes > ENTRY_COMPRESSED_BUDGET) {
    throw new Error(
      `Entry pack is ${entryCompressedBytes} bytes; budget is ${ENTRY_COMPRESSED_BUDGET}`,
    );
  }
  if (sharedCompressedBytes > SHARED_COMPRESSED_BUDGET) {
    throw new Error(
      `Shared pack is ${sharedCompressedBytes} bytes; budget is ${SHARED_COMPRESSED_BUDGET}`,
    );
  }

  return { assets, entryCompressedBytes, sharedCompressedBytes };
}

if (process.argv.includes("--help")) {
  console.log(`Usage: node scripts/prepare-beach-photoreal-assets.mjs [options]

Options:
  --source-dir <path>       Poly Haven download cache (default: tmp/beach-photoreal-sources/poly-haven)
  --output-dir <path>       Project output directory`);
  process.exit(0);
}

const sourceDir = getArgument("--source-dir", DEFAULT_SOURCE_DIR);
const outputDir = getArgument("--output-dir", DEFAULT_OUTPUT_DIR);

await Promise.all([
  mkdir(sourceDir, { recursive: true }),
  mkdir(outputDir, { recursive: true }),
]);

const sourcePaths = Object.fromEntries(
  await Promise.all(
    Object.entries(POLY_HAVEN_SOURCES).map(async ([id, source]) => [
      id,
      await loadVerifiedSource(sourceDir, source),
    ]),
  ),
);
console.log(
  `Verified ${Object.keys(sourcePaths).length} Poly Haven sources in ${path.relative(ROOT, sourceDir)}`,
);

await Promise.all([
  encodeSandMap(
    sourcePaths.sandColor.path,
    sourcePaths.wetSandColor.path,
    path.join(outputDir, "sand-color.webp"),
    { dataMap: false },
  ),
  // No `damp_sand` normal map exists, so the wet band carries the dry slopes.
  encodeTexture(
    sourcePaths.sandNormal.path,
    path.join(outputDir, "sand-normal.webp"),
    { size: SAND_TEXTURE_SIZE },
  ),
  encodeSandMap(
    sourcePaths.sandArm.path,
    sourcePaths.wetSandArm.path,
    path.join(outputDir, "sand-arm.webp"),
    { dataMap: true },
  ),
  encodeWaterNormal(path.join(outputDir, "water-normal.webp")),
  copyRadianceHdri(sourcePaths.hdri, path.join(outputDir, "sky.hdr")),
  ...[
    { filename: "driftwood-color.webp", size: DRIFTWOOD_TEXTURE_SIZE, source: "driftwoodColor" },
    { filename: "driftwood-normal.webp", size: DRIFTWOOD_TEXTURE_SIZE, source: "driftwoodNormal" },
    { filename: "driftwood-arm.webp", size: DRIFTWOOD_TEXTURE_SIZE, source: "driftwoodArm" },
    { filename: "frame-01-color.webp", size: FRAME_TEXTURE_SIZE, source: "frame01Color" },
    { filename: "frame-01-normal.webp", size: FRAME_TEXTURE_SIZE, source: "frame01Normal" },
    { filename: "frame-01-arm.webp", size: FRAME_TEXTURE_SIZE, source: "frame01Arm" },
    { filename: "frame-02-color.webp", size: FRAME_TEXTURE_SIZE, source: "frame02Color" },
    { filename: "frame-02-normal.webp", size: FRAME_TEXTURE_SIZE, source: "frame02Normal" },
    { filename: "frame-02-arm.webp", size: FRAME_TEXTURE_SIZE, source: "frame02Arm" },
  ].map(({ filename, size, source }) =>
    encodeTexture(sourcePaths[source].path, path.join(outputDir, filename), {
      size,
    }),
  ),
]);

const report = await validateOutputs(outputDir);
await validateSandBands(outputDir);

// Asset ids sit at the top level as plain numbers because the Task 4 manifest
// test reads this file as `Record<string, number>`; provenance is nested under
// a key that can never collide with an asset id.
const byteTable = {
  ...Object.fromEntries(report.assets.map((asset) => [asset.id, asset.bytes])),
  sources: Object.fromEntries(
    Object.entries(POLY_HAVEN_SOURCES).map(([id, source]) => [
      id,
      {
        filename: source.filename,
        md5: source.md5,
        sha256: sourcePaths[id].sha256,
        url: source.url,
      },
    ]),
  ),
};
await writeFile(
  path.join(outputDir, "beach-asset-bytes.json"),
  `${JSON.stringify(byteTable, null, 2)}\n`,
);

for (const asset of report.assets) {
  console.log(
    `  ${asset.filename.padEnd(24)} ${String(asset.bytes).padStart(9)} bytes  ${asset.group}`,
  );
}
console.log(
  `entry ${report.entryCompressedBytes} / ${ENTRY_COMPRESSED_BUDGET} bytes, shared ${report.sharedCompressedBytes} / ${SHARED_COMPRESSED_BUDGET} bytes`,
);

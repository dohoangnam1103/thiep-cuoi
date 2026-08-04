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
  hdri: {
    filename: "umhlanga_sunrise_1k.hdr",
    md5: "9fb1501bb5ec41e7909a8dc497638501",
    url: "https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/1k/umhlanga_sunrise_1k.hdr",
  },
  pierPlanksArm: {
    filename: "modular_wooden_pier_planks_arm_1k.jpg",
    md5: "e6ffdf7314cc015aaa5c0899326b42a7",
    url: "https://dl.polyhaven.org/file/ph-assets/Models/jpg/1k/modular_wooden_pier/modular_wooden_pier_planks_arm_1k.jpg",
  },
  pierPlanksColor: {
    filename: "modular_wooden_pier_planks_diff_1k.jpg",
    md5: "f3fef39b0ec16e4006678c846d3601ab",
    url: "https://dl.polyhaven.org/file/ph-assets/Models/jpg/1k/modular_wooden_pier/modular_wooden_pier_planks_diff_1k.jpg",
  },
  pierPlanksNormal: {
    filename: "modular_wooden_pier_planks_nor_gl_1k.jpg",
    md5: "b752108fe7504d5dd4ae0f4701b1218b",
    url: "https://dl.polyhaven.org/file/ph-assets/Models/jpg/1k/modular_wooden_pier/modular_wooden_pier_planks_nor_gl_1k.jpg",
  },
  sandArm: {
    filename: "coast_sand_01_arm_1k.jpg",
    md5: "f044891a328d284c9e7cd46da12fa45d",
    url: "https://dl.polyhaven.org/file/ph-assets/Textures/jpg/1k/coast_sand_01/coast_sand_01_arm_1k.jpg",
  },
  sandColor: {
    filename: "coast_sand_01_diff_1k.jpg",
    md5: "a1e243fc8635806381505c7dc44b192a",
    url: "https://dl.polyhaven.org/file/ph-assets/Textures/jpg/1k/coast_sand_01/coast_sand_01_diff_1k.jpg",
  },
  sandNormal: {
    filename: "coast_sand_01_nor_gl_1k.jpg",
    md5: "38bbe6863249a3d20d8417c9db207780",
    url: "https://dl.polyhaven.org/file/ph-assets/Textures/jpg/1k/coast_sand_01/coast_sand_01_nor_gl_1k.jpg",
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
/** Pier and frame maps ship at the same 1k tile size as the sand. */
const PROP_TEXTURE_SIZE = 1_024;
/**
 * Golden-hour warm-up applied to colour/diffuse maps only.
 *
 * Normal and ARM maps encode geometry and material data in their channels, so
 * scaling those channels corrupts the data rather than grading it.
 */
const GOLDEN_HOUR_TINT = Object.freeze([1.04, 1.0, 0.94]);

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
  { blocking: false, filename: "pier-planks-color.webp", group: "props", height: PROP_TEXTURE_SIZE, id: "pierPlanksColor", width: PROP_TEXTURE_SIZE },
  { blocking: false, filename: "pier-planks-normal.webp", group: "props", height: PROP_TEXTURE_SIZE, id: "pierPlanksNormal", width: PROP_TEXTURE_SIZE },
  { blocking: false, filename: "pier-planks-arm.webp", group: "props", height: PROP_TEXTURE_SIZE, id: "pierPlanksArm", width: PROP_TEXTURE_SIZE },
  { blocking: false, filename: "frame-01-color.webp", group: "props", height: PROP_TEXTURE_SIZE, id: "frame01Color", width: PROP_TEXTURE_SIZE },
  { blocking: false, filename: "frame-01-normal.webp", group: "props", height: PROP_TEXTURE_SIZE, id: "frame01Normal", width: PROP_TEXTURE_SIZE },
  { blocking: false, filename: "frame-01-arm.webp", group: "props", height: PROP_TEXTURE_SIZE, id: "frame01Arm", width: PROP_TEXTURE_SIZE },
  { blocking: false, filename: "frame-02-color.webp", group: "props", height: PROP_TEXTURE_SIZE, id: "frame02Color", width: PROP_TEXTURE_SIZE },
  { blocking: false, filename: "frame-02-normal.webp", group: "props", height: PROP_TEXTURE_SIZE, id: "frame02Normal", width: PROP_TEXTURE_SIZE },
  { blocking: false, filename: "frame-02-arm.webp", group: "props", height: PROP_TEXTURE_SIZE, id: "frame02Arm", width: PROP_TEXTURE_SIZE },
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
const WET_BAND_FEATHER_V = 0.16;

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

async function encodeSandMap(dryPath, wetPath, destination, { dataMap }) {
  const size = SAND_TEXTURE_SIZE;
  const resize = { fit: "fill", kernel: sharp.kernel.lanczos3 };

  const dry = sharp(dryPath).resize(size, size, resize).removeAlpha();
  const wetBase = await sharp(wetPath)
    .resize(size, size, resize)
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const mask = await createWetBandMask(size);

  // Interleave the mask as the wet layer's alpha so `composite` blends per pixel.
  const wetRgba = Buffer.alloc(size * size * 4);
  for (let index = 0; index < size * size; index += 1) {
    wetRgba[index * 4] = wetBase.data[index * 3];
    wetRgba[index * 4 + 1] = wetBase.data[index * 3 + 1];
    wetRgba[index * 4 + 2] = wetBase.data[index * 3 + 2];
    wetRgba[index * 4 + 3] = mask[index];
  }

  let image = dry.composite([
    { input: wetRgba, raw: { channels: 4, height: size, width: size } },
  ]);
  if (!dataMap) {
    // Warm the dry sand toward golden hour; data maps must not be tinted.
    image = image.linear([...GOLDEN_HOUR_TINT], [0, 0, 0]);
  }

  await image.webp({ effort: 6, lossless: false, quality: 88 }).toFile(destination);
}

/**
 * Plain 1k resize → WebP, used for every map with no compositing of its own.
 *
 * `sand-normal.webp` runs through here rather than `encodeSandMap`: Poly Haven
 * publishes `damp_sand` as colour and ARM only, so there is no damp normal to
 * blend into the wet band, and inventing one would put fabricated slopes under
 * a measured albedo.
 */
async function encodeTexture(sourcePath, destination, { dataMap, size }) {
  let image = sharp(sourcePath)
    .resize(size, size, { fit: "fill", kernel: sharp.kernel.lanczos3 })
    .removeAlpha();
  if (!dataMap) {
    image = image.linear([...GOLDEN_HOUR_TINT], [0, 0, 0]);
  }

  await image.webp({ effort: 6, lossless: false, quality: 88 }).toFile(destination);
}

const WATER_NOISE_SEED = 0x5eab1234;
const WATER_NOISE_OCTAVES = Object.freeze([
  { amplitude: 1.0, period: 64 },
  { amplitude: 0.5, period: 32 },
  { amplitude: 0.25, period: 16 },
]);
/** Normal-map slope strength. `Water` wants long swell, not choppy detail. */
const WATER_NORMAL_STRENGTH = 1.35;

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

  await sharp(rgb, { raw: { channels: 3, height: size, width: size } })
    .webp({ effort: 6, lossless: true })
    .toFile(destination);
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
    { dataMap: true, size: SAND_TEXTURE_SIZE },
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
    { dataMap: false, filename: "pier-planks-color.webp", source: "pierPlanksColor" },
    { dataMap: true, filename: "pier-planks-normal.webp", source: "pierPlanksNormal" },
    { dataMap: true, filename: "pier-planks-arm.webp", source: "pierPlanksArm" },
    { dataMap: false, filename: "frame-01-color.webp", source: "frame01Color" },
    { dataMap: true, filename: "frame-01-normal.webp", source: "frame01Normal" },
    { dataMap: true, filename: "frame-01-arm.webp", source: "frame01Arm" },
    { dataMap: false, filename: "frame-02-color.webp", source: "frame02Color" },
    { dataMap: true, filename: "frame-02-normal.webp", source: "frame02Normal" },
    { dataMap: true, filename: "frame-02-arm.webp", source: "frame02Arm" },
  ].map(({ dataMap, filename, source }) =>
    encodeTexture(sourcePaths[source].path, path.join(outputDir, filename), {
      dataMap,
      size: PROP_TEXTURE_SIZE,
    }),
  ),
]);

const report = await validateOutputs(outputDir);

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

#!/usr/bin/env node

import { createHash } from "node:crypto";
import { mkdir, readFile, stat, writeFile } from "node:fs/promises";
import path from "node:path";

import sharp from "sharp";

const ROOT = process.cwd();
const DEFAULT_SOURCE_DIR = path.join(
  ROOT,
  "tmp/forest-photoreal-sources/poly-haven",
);
const DEFAULT_OUTPUT_DIR = path.join(
  ROOT,
  "public/chungdoi/labs/forest-wedding-journey/photoreal",
);
const DEFAULT_BACKDROP_SOURCE = path.join(
  ROOT,
  "tmp/forest-photoreal-sources/backdrop-master.png",
);
const DEFAULT_WILDLIFE_SOURCE = path.join(
  ROOT,
  "tmp/forest-photoreal-sources/wildlife-alpha-v2-contracted.png",
);
const DEFAULT_CONIFER_BRANCH_SOURCE = path.join(
  ROOT,
  "tmp/forest-photoreal-sources/conifer-branches-alpha-contracted.png",
);
const ENTRY_COMPRESSED_BUDGET = 4_000_000;
const SHARED_COMPRESSED_BUDGET = 12_000_000;
const ENTRY_DECODED_BUDGET = 18_175_312;

const POLY_HAVEN_SOURCES = Object.freeze({
  groundArm: {
    filename: "leafy_grass_arm_1k.jpg",
    md5: "44fb4e40ef0f3425a7d1a14bc328e4d8",
    url: "https://dl.polyhaven.org/file/ph-assets/Textures/jpg/1k/leafy_grass/leafy_grass_arm_1k.jpg",
  },
  groundColor: {
    filename: "leafy_grass_diff_1k.jpg",
    md5: "0dbc071e91d6905edfcfbe8eb785a1ab",
    url: "https://dl.polyhaven.org/file/ph-assets/Textures/jpg/1k/leafy_grass/leafy_grass_diff_1k.jpg",
  },
  groundNormal: {
    filename: "leafy_grass_nor_gl_1k.jpg",
    md5: "8279e096e204ea326d57a318869f99df",
    url: "https://dl.polyhaven.org/file/ph-assets/Textures/jpg/1k/leafy_grass/leafy_grass_nor_gl_1k.jpg",
  },
  pineBarkArm: {
    filename: "pine_tree_01_bark_arm_1k.jpg",
    md5: "21d1abd15e40951825a4f3da110b20ea",
    url: "https://dl.polyhaven.org/file/ph-assets/Models/jpg/1k/pine_tree_01/pine_tree_01_bark_arm_1k.jpg",
  },
  pineBarkColor: {
    filename: "pine_tree_01_bark_diff_1k.jpg",
    md5: "7d3a558ed614c7e75594c7be3bf80311",
    url: "https://dl.polyhaven.org/file/ph-assets/Models/jpg/1k/pine_tree_01/pine_tree_01_bark_diff_1k.jpg",
  },
  pineBarkNormal: {
    filename: "pine_tree_01_bark_nor_gl_1k.jpg",
    md5: "bb6e3a6eea777d992cef48fabfdc538c",
    url: "https://dl.polyhaven.org/file/ph-assets/Models/jpg/1k/pine_tree_01/pine_tree_01_bark_nor_gl_1k.jpg",
  },
});

const OUTPUTS = Object.freeze([
  { blocking: true, filename: "ground-color.webp", height: 512, width: 512 },
  { blocking: true, filename: "ground-normal.webp", height: 512, width: 512 },
  { blocking: true, filename: "ground-arm.webp", height: 512, width: 512 },
  { alpha: true, blocking: true, filename: "conifer-color.webp", height: 512, width: 1024 },
  { blocking: true, filename: "conifer-normal.webp", height: 512, width: 1024 },
  { blocking: true, filename: "conifer-arm.webp", height: 512, width: 1024 },
  { blocking: true, filename: "backdrop.webp", height: 512, width: 1024 },
  { alpha: true, blocking: false, filename: "wildlife.webp", height: 640, width: 960 },
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

async function encodeGround(sourcePath, destination, dataMap = false) {
  let image = sharp(sourcePath)
    .resize(512, 512, { fit: "fill", kernel: sharp.kernel.lanczos3 })
    .removeAlpha();
  if (!dataMap) {
    image = image.linear([0.78, 1.04, 0.85], [0, 0, 0]);
  }

  await image
    .webp({
      effort: 6,
      preset: dataMap ? "default" : "picture",
      quality: dataMap ? 90 : 84,
      smartSubsample: !dataMap,
    })
    .toFile(destination);
}

async function resizeAsPng(sourcePath) {
  return sharp(sourcePath)
    .resize(512, 512, { fit: "fill", kernel: sharp.kernel.lanczos3 })
    .removeAlpha()
    .png()
    .toBuffer();
}

async function createBranchColor(branchSource) {
  const { data, info } = await sharp(branchSource)
    .resize(512, 512, { fit: "fill", kernel: sharp.kernel.lanczos3 })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  for (let offset = 0; offset < data.length; offset += info.channels) {
    const alpha = data[offset + 3];
    if (alpha === 0) {
      data[offset] = 0;
      data[offset + 1] = 0;
      data[offset + 2] = 0;
      continue;
    }
    const green = data[offset + 1];
    if (data[offset + 2] > green) {
      data[offset + 2] = green;
    }
    if (data[offset] > green * 1.35 && data[offset + 2] > green * 0.75) {
      data[offset] = Math.round(green * 1.25);
    }
  }

  return sharp(data, {
    raw: {
      channels: info.channels,
      height: info.height,
      width: info.width,
    },
  })
    .png()
    .toBuffer();
}

async function encodeConiferColor(sourcePaths, branchSource, destination) {
  const [branches, bark] = await Promise.all([
    createBranchColor(branchSource),
    sharp(sourcePaths.pineBarkColor.path)
      .resize(512, 512, { fit: "fill", kernel: sharp.kernel.lanczos3 })
      .ensureAlpha(1)
      .png()
      .toBuffer(),
  ]);

  await sharp({
    create: {
      background: { alpha: 0, b: 0, g: 0, r: 0 },
      channels: 4,
      height: 512,
      width: 1024,
    },
  })
    .composite([
      { input: branches, left: 0, top: 0 },
      { input: bark, left: 512, top: 0 },
    ])
    .webp({
      alphaQuality: 100,
      effort: 6,
      preset: "picture",
      quality: 86,
      smartSubsample: false,
    })
    .toFile(destination);
}

async function encodeConiferData(kind, barkPath, destination) {
  const [branchDefault, bark] = await Promise.all([
    sharp({
      create: {
        background: kind === "normal"
          ? { b: 255, g: 128, r: 128 }
          : { b: 0, g: 190, r: 255 },
        channels: 3,
        height: 512,
        width: 512,
      },
    }).png().toBuffer(),
    resizeAsPng(barkPath),
  ]);

  await sharp({
    create: {
      background: { b: 0, g: 0, r: 0 },
      channels: 3,
      height: 512,
      width: 1024,
    },
  })
    .composite([
      { input: branchDefault, left: 0, top: 0 },
      { input: bark, left: 512, top: 0 },
    ])
    .webp({ effort: 6, preset: "default", quality: 90, smartSubsample: false })
    .toFile(destination);
}

async function encodeGeneratedAssets(
  backdropSource,
  wildlifeSource,
  outputDir,
) {
  await sharp(backdropSource)
    .resize(1024, 512, { fit: "cover", kernel: sharp.kernel.lanczos3 })
    .removeAlpha()
    .webp({ effort: 6, preset: "picture", quality: 82, smartSubsample: true })
    .toFile(path.join(outputDir, "backdrop.webp"));

  await sharp(wildlifeSource)
    .resize(960, 640, { fit: "fill", kernel: sharp.kernel.lanczos3 })
    .ensureAlpha()
    .webp({
      alphaQuality: 100,
      effort: 6,
      preset: "picture",
      quality: 84,
      smartSubsample: false,
    })
    .toFile(path.join(outputDir, "wildlife.webp"));
}

function decodedRgbaMipBytes({ height, width }) {
  return Math.ceil(width * height * 4 * 4 / 3);
}

async function validateOutputs(outputDir) {
  const assets = [];

  for (const expected of OUTPUTS) {
    const outputPath = path.join(outputDir, expected.filename);
    const [metadata, file] = await Promise.all([
      sharp(outputPath).metadata(),
      stat(outputPath),
    ]);
    if (metadata.width !== expected.width || metadata.height !== expected.height) {
      throw new Error(
        `${expected.filename} must be ${expected.width}x${expected.height}, received ${metadata.width}x${metadata.height}`,
      );
    }
    if (expected.alpha && !metadata.hasAlpha) {
      throw new Error(`${expected.filename} must retain an alpha channel`);
    }
    if (file.size > ENTRY_COMPRESSED_BUDGET) {
      throw new Error(`${expected.filename} exceeds the 4 MB per-asset ceiling`);
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
  const entryDecodedRgbaMipBytes = entryAssets.reduce(
    (total, asset) => total + decodedRgbaMipBytes(asset),
    0,
  );

  if (entryCompressedBytes > ENTRY_COMPRESSED_BUDGET) {
    throw new Error(`Entry pack is ${entryCompressedBytes} bytes; budget is 4 MB`);
  }
  if (sharedCompressedBytes > SHARED_COMPRESSED_BUDGET) {
    throw new Error(`Shared pack is ${sharedCompressedBytes} bytes; budget is 12 MB`);
  }
  if (entryDecodedRgbaMipBytes > ENTRY_DECODED_BUDGET) {
    throw new Error(
      `Entry decode estimate is ${entryDecodedRgbaMipBytes} bytes; budget is ${ENTRY_DECODED_BUDGET}`,
    );
  }

  return {
    assets,
    entryCompressedBytes,
    entryDecodedRgbaMipBytes,
    sharedCompressedBytes,
  };
}

if (process.argv.includes("--help")) {
  console.log(`Usage: node scripts/prepare-forest-photoreal-assets.mjs [options]

Options:
  --backdrop-source <path>  Original generated 2:1 forest panorama
  --wildlife-source <path>  Alpha PNG produced by the imagegen chroma helper
  --conifer-branch-source <path>  Alpha 2x2 branch-card atlas from imagegen
  --source-dir <path>       Poly Haven download cache (default: tmp/forest-photoreal-sources/poly-haven)
  --output-dir <path>       Project output directory`);
  process.exit(0);
}

const sourceDir = getArgument("--source-dir", DEFAULT_SOURCE_DIR);
const outputDir = getArgument("--output-dir", DEFAULT_OUTPUT_DIR);
const backdropSource = getArgument(
  "--backdrop-source",
  DEFAULT_BACKDROP_SOURCE,
);
const wildlifeSource = getArgument(
  "--wildlife-source",
  DEFAULT_WILDLIFE_SOURCE,
);
const coniferBranchSource = getArgument(
  "--conifer-branch-source",
  DEFAULT_CONIFER_BRANCH_SOURCE,
);

await Promise.all([mkdir(sourceDir, { recursive: true }), mkdir(outputDir, { recursive: true })]);

const sourcePaths = Object.fromEntries(
  await Promise.all(
    Object.entries(POLY_HAVEN_SOURCES).map(async ([id, source]) => [
      id,
      await loadVerifiedSource(sourceDir, source),
    ]),
  ),
);

await Promise.all([
  encodeGround(
    sourcePaths.groundColor.path,
    path.join(outputDir, "ground-color.webp"),
  ),
  encodeGround(
    sourcePaths.groundNormal.path,
    path.join(outputDir, "ground-normal.webp"),
    true,
  ),
  encodeGround(
    sourcePaths.groundArm.path,
    path.join(outputDir, "ground-arm.webp"),
    true,
  ),
  encodeConiferColor(
    sourcePaths,
    coniferBranchSource,
    path.join(outputDir, "conifer-color.webp"),
  ),
  encodeConiferData(
    "normal",
    sourcePaths.pineBarkNormal.path,
    path.join(outputDir, "conifer-normal.webp"),
  ),
  encodeConiferData(
    "arm",
    sourcePaths.pineBarkArm.path,
    path.join(outputDir, "conifer-arm.webp"),
  ),
  encodeGeneratedAssets(backdropSource, wildlifeSource, outputDir),
]);

const report = await validateOutputs(outputDir);
console.log(JSON.stringify({
  ...report,
  sourceSha256: Object.fromEntries(
    Object.entries(sourcePaths).map(([id, source]) => [id, source.sha256]),
  ),
}, null, 2));

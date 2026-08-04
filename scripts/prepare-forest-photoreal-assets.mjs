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
const BRANCH_CELL_SIZE = 256;
const BRANCH_CELL_PADDING = 12;
const BRANCH_REQUIRED_GUTTER = 8;
/**
 * Fraction of a cell's usable box each branch subject must span on both axes.
 *
 * The runtime maps the whole cell onto one branch card, so transparent margin
 * inside the cell turns into a gap between the card's edge and the needles. On a
 * conifer that reads as a canopy clump floating over a bare trunk — the defect a
 * `fit: "inside"` letterbox produced for the wide spray in cell 0,0, which
 * filled only 53% of its cell's height and left the trunk below it bare.
 */
const BRANCH_MIN_CELL_FILL = 0.9;
/**
 * How far filling the square cell may change a branch subject's aspect ratio.
 *
 * Filling is anisotropic, so a wide spray is squashed horizontally to fit. That
 * is largely undone downstream: the branch card is instanced at
 * `[span, span * 0.74, span]`, so the square cell is displayed 1.35 times wider
 * than tall. A subject up to ~1.9:1 therefore lands back inside a plausible
 * conifer-tier silhouette, and needle texture is stochastic enough that the
 * residual stretch does not read. Beyond that the needles visibly smear, so the
 * source atlas needs redrawing rather than a harder squash.
 */
const BRANCH_MAX_SUBJECT_SQUASH = 1.9;

/**
 * `FOREST_PHOTOREAL_ATMOSPHERE.color` from `photoreal/forest-lighting.tsx`, the
 * haze the scene fog resolves to. Kept in sync by
 * `forest-asset-manifest.test.ts`.
 */
const BACKDROP_HAZE_SRGB = Object.freeze([0x8f / 255, 0xae / 255, 0x7f / 255]);
/**
 * How far the panorama is pulled toward the haze. Chosen as the smallest blend
 * that clears the tone curve's toe with headroom — measured against this
 * panorama, 0.30 already lands every texel above the near-black floor, and 0.35
 * keeps the margin after WebP's lossy pass. Higher values wash the treeline out.
 */
const BACKDROP_AERIAL_BLEND = 0.35;
/**
 * Minimum sRGB luminance any backdrop texel may carry. The runtime multiplies
 * the map by `0x9fb894` and tone-maps with ACES at exposure 1.08, a chain that
 * crushes anything below roughly sRGB 20 to pure black.
 */
const BACKDROP_MIN_LUMINANCE = 24;

function srgbToLinear(channel) {
  return channel <= 0.04045
    ? channel / 12.92
    : Math.pow((channel + 0.055) / 1.055, 2.4);
}

function linearToSrgb(channel) {
  return channel <= 0.0031308
    ? channel * 12.92
    : 1.055 * Math.pow(channel, 1 / 2.4) - 0.055;
}

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

function getBranchCellBounds(data, info, cellX, cellY) {
  const BRANCH_SUBJECT_ALPHA_THRESHOLD = 8;
  const sourceCellWidth = info.width / 2;
  const sourceCellHeight = info.height / 2;
  const sourceLeft = cellX * sourceCellWidth;
  const sourceTop = cellY * sourceCellHeight;
  let minimumX = sourceLeft + sourceCellWidth;
  let minimumY = sourceTop + sourceCellHeight;
  let maximumX = -1;
  let maximumY = -1;

  for (let y = sourceTop; y < sourceTop + sourceCellHeight; y += 1) {
    for (let x = sourceLeft; x < sourceLeft + sourceCellWidth; x += 1) {
      const alpha = data[(y * info.width + x) * info.channels + 3];
      if (alpha <= BRANCH_SUBJECT_ALPHA_THRESHOLD) continue;
      minimumX = Math.min(minimumX, x);
      minimumY = Math.min(minimumY, y);
      maximumX = Math.max(maximumX, x);
      maximumY = Math.max(maximumY, y);
    }
  }

  if (maximumX < minimumX || maximumY < minimumY) {
    throw new Error(`Generated branch cell ${cellX},${cellY} is empty`);
  }

  return {
    height: maximumY - minimumY + 1,
    left: minimumX,
    top: minimumY,
    width: maximumX - minimumX + 1,
  };
}

/**
 * Dilates opaque colour outward across transparent pixels ("alpha bleed").
 *
 * A cut-out atlas whose transparent region carries black RGB looks fine at 1:1
 * but rots under minification: mipmaps and bilinear taps average colour and
 * alpha independently, so a texel straddling a needle edge keeps enough alpha
 * to survive `alphaTest` while its colour has already been dragged toward the
 * black void behind it. On the conifer canopy that produced solid black blobs
 * in the distance. Bleeding real foliage colour into the void makes those same
 * averages resolve to foliage instead. Alpha is never touched, so the cut-out
 * silhouette is unchanged.
 */
function bleedAlphaEdges(data, info, passes = 12) {
  const { channels, height, width } = info;
  const filled = new Uint8Array(width * height);
  let subjectRed = 0;
  let subjectGreen = 0;
  let subjectBlue = 0;
  let subjectCount = 0;

  for (let pixel = 0; pixel < width * height; pixel += 1) {
    if (data[pixel * channels + 3] === 0) continue;
    filled[pixel] = 1;
    subjectRed += data[pixel * channels];
    subjectGreen += data[pixel * channels + 1];
    subjectBlue += data[pixel * channels + 2];
    subjectCount += 1;
  }

  if (subjectCount === 0) {
    throw new Error("Cannot alpha-bleed an atlas with no opaque pixels");
  }

  // Seed the whole void with the subject's average colour before dilating.
  // Edge dilation alone only reaches a few pixels, but a distant card samples a
  // high mip level that averages an entire atlas cell — so any black left deep
  // in the void still resolves the far canopy to black. A subject-coloured void
  // keeps every mip level inside the foliage palette.
  const meanRed = Math.round(subjectRed / subjectCount);
  const meanGreen = Math.round(subjectGreen / subjectCount);
  const meanBlue = Math.round(subjectBlue / subjectCount);
  for (let pixel = 0; pixel < width * height; pixel += 1) {
    if (filled[pixel]) continue;
    const offset = pixel * channels;
    data[offset] = meanRed;
    data[offset + 1] = meanGreen;
    data[offset + 2] = meanBlue;
  }

  const neighbours = [-1, 0, 1];
  for (let pass = 0; pass < passes; pass += 1) {
    const nextFilled = Uint8Array.from(filled);
    let grew = false;

    for (let y = 0; y < height; y += 1) {
      for (let x = 0; x < width; x += 1) {
        const pixel = y * width + x;
        if (filled[pixel]) continue;

        let red = 0;
        let green = 0;
        let blue = 0;
        let found = 0;
        for (const dy of neighbours) {
          const sampleY = y + dy;
          if (sampleY < 0 || sampleY >= height) continue;
          for (const dx of neighbours) {
            const sampleX = x + dx;
            if (sampleX < 0 || sampleX >= width) continue;
            const sample = sampleY * width + sampleX;
            if (!filled[sample]) continue;
            red += data[sample * channels];
            green += data[sample * channels + 1];
            blue += data[sample * channels + 2];
            found += 1;
          }
        }

        if (found === 0) continue;
        const offset = pixel * channels;
        data[offset] = Math.round(red / found);
        data[offset + 1] = Math.round(green / found);
        data[offset + 2] = Math.round(blue / found);
        nextFilled[pixel] = 1;
        grew = true;
      }
    }

    filled.set(nextFilled);
    if (!grew) break;
  }
}

async function createBranchColor(branchSource) {
  const source = await sharp(branchSource)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  if (source.info.width % 2 !== 0 || source.info.height % 2 !== 0) {
    throw new Error("Generated branch atlas dimensions must be divisible by two");
  }

  const maximumSubjectSize =
    BRANCH_CELL_SIZE - BRANCH_CELL_PADDING * 2;
  const composites = [];

  for (let cellY = 0; cellY < 2; cellY += 1) {
    for (let cellX = 0; cellX < 2; cellX += 1) {
      const bounds = getBranchCellBounds(
        source.data,
        source.info,
        cellX,
        cellY,
      );
      const squash = Math.max(
        bounds.width / bounds.height,
        bounds.height / bounds.width,
      );
      if (squash > BRANCH_MAX_SUBJECT_SQUASH) {
        throw new Error(
          `Generated branch cell ${cellX},${cellY} is ${bounds.width}x${bounds.height} (${squash.toFixed(2)}:1); filling the square cell would smear its needles past ${BRANCH_MAX_SUBJECT_SQUASH}:1 — redraw the source card closer to square`,
        );
      }

      // `fit: "fill"`, not `"inside"`: a letterboxed subject leaves transparent
      // margin inside the cell, and the runtime maps the whole cell onto one
      // branch card, so that margin becomes a visible gap between the card edge
      // and the needles. See BRANCH_MIN_CELL_FILL.
      const resized = await sharp(branchSource)
        .extract(bounds)
        .resize({
          fit: "fill",
          height: maximumSubjectSize,
          kernel: sharp.kernel.lanczos3,
          width: maximumSubjectSize,
        })
        .ensureAlpha()
        .png()
        .toBuffer({ resolveWithObject: true });
      composites.push({
        input: resized.data,
        left:
          cellX * BRANCH_CELL_SIZE +
          Math.floor((BRANCH_CELL_SIZE - resized.info.width) / 2),
        top:
          cellY * BRANCH_CELL_SIZE +
          Math.floor((BRANCH_CELL_SIZE - resized.info.height) / 2),
      });
    }
  }

  const branchAtlas = await sharp({
    create: {
      background: { alpha: 0, b: 0, g: 0, r: 0 },
      channels: 4,
      height: BRANCH_CELL_SIZE * 2,
      width: BRANCH_CELL_SIZE * 2,
    },
  })
    .composite(composites)
    .raw()
    .toBuffer({ resolveWithObject: true });

  for (
    let offset = 0;
    offset < branchAtlas.data.length;
    offset += branchAtlas.info.channels
  ) {
    const alpha = branchAtlas.data[offset + 3];
    if (alpha === 0) continue;
    const green = branchAtlas.data[offset + 1];
    if (branchAtlas.data[offset + 2] > green) {
      branchAtlas.data[offset + 2] = green;
    }
    if (
      branchAtlas.data[offset] > green * 1.35 &&
      branchAtlas.data[offset + 2] > green * 0.75
    ) {
      branchAtlas.data[offset] = Math.round(green * 1.25);
    }
  }

  bleedAlphaEdges(branchAtlas.data, branchAtlas.info);

  // Returned raw, not as an encoded buffer: the caller stitches the atlas by
  // hand so the bled RGB under alpha=0 survives to the encoder.
  return branchAtlas;
}

async function encodeConiferColor(sourcePaths, branchSource, destination) {
  const [branches, bark] = await Promise.all([
    createBranchColor(branchSource),
    sharp(sourcePaths.pineBarkColor.path)
      .resize(512, 512, { fit: "fill", kernel: sharp.kernel.lanczos3 })
      .ensureAlpha(1)
      .raw()
      .toBuffer({ resolveWithObject: true }),
  ]);

  // Stitched by hand rather than with `.composite()`: compositing works in
  // premultiplied space, so it collapses RGB to zero wherever alpha is zero and
  // would erase the branch atlas's alpha bleed before it ever reaches the
  // encoder.
  const width = 1024;
  const height = 512;
  const atlas = Buffer.alloc(width * height * 4);
  for (const { data, info, left } of [
    { ...branches, left: 0 },
    { data: bark.data, info: bark.info, left: 512 },
  ]) {
    for (let y = 0; y < info.height; y += 1) {
      for (let x = 0; x < info.width; x += 1) {
        const from = (y * info.width + x) * info.channels;
        const to = (y * width + (x + left)) * 4;
        atlas[to] = data[from];
        atlas[to + 1] = data[from + 1];
        atlas[to + 2] = data[from + 2];
        atlas[to + 3] = info.channels === 4 ? data[from + 3] : 255;
      }
    }
  }

  await sharp(atlas, { raw: { channels: 4, height, width } })
    .webp({
      alphaQuality: 100,
      effort: 6,
      // libwebp zeroes RGB under alpha=0 by default to compress better, which
      // would throw away the alpha bleed and hand mipmapping a black void.
      exact: true,
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

/**
 * Blends the panorama toward the scene's haze colour, in linear light.
 *
 * The backdrop cylinder stands at radius 96 while the scene fog ends at 76, and
 * its material opts out of fog so the wall never double-darkens the geometry in
 * front of it. Nothing else then supplies aerial perspective, so the panorama
 * arrives at full contrast: a 96 m distant treeline rendered as crisply as the
 * bark two metres from the camera, which reads as a flat painted backdrop
 * rather than depth.
 *
 * It is also what put a black void above the treeline. The material tints the
 * map by `0x9fb894` (≈0.35 in linear light) and the renderer then tone-maps with
 * ACES at exposure 1.08. That chain drives everything below roughly sRGB 20 to
 * zero, and 42% of this panorama's texels sit there. Baking the haze in fixes
 * both at once: it is the physically correct treatment for the distance, and it
 * lifts the tonal floor clear of the tone curve's toe.
 *
 * Baked at asset time rather than in the shader so the WebP itself carries the
 * invariant `validateBackdropTonalFloor` checks — a runtime-only lift would
 * leave a black asset on disk for the next pipeline change to trip over.
 */
function bakeAerialPerspective(data, info) {
  const haze = BACKDROP_HAZE_SRGB.map(srgbToLinear);

  for (let offset = 0; offset < data.length; offset += info.channels) {
    for (let channel = 0; channel < 3; channel += 1) {
      const source = srgbToLinear(data[offset + channel] / 255);
      const blended =
        source * (1 - BACKDROP_AERIAL_BLEND) + haze[channel] * BACKDROP_AERIAL_BLEND;
      data[offset + channel] = Math.round(linearToSrgb(blended) * 255);
    }
  }
}

async function encodeGeneratedAssets(
  backdropSource,
  wildlifeSource,
  outputDir,
) {
  const backdrop = await sharp(backdropSource)
    .resize(1024, 512, { fit: "cover", kernel: sharp.kernel.lanczos3 })
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  bakeAerialPerspective(backdrop.data, backdrop.info);

  await sharp(backdrop.data, {
    raw: {
      channels: backdrop.info.channels,
      height: backdrop.info.height,
      width: backdrop.info.width,
    },
  })
    .webp({ effort: 6, preset: "picture", quality: 82, smartSubsample: true })
    .toFile(path.join(outputDir, "backdrop.webp"));

  const wildlife = await sharp(wildlifeSource)
    .resize(960, 640, { fit: "fill", kernel: sharp.kernel.lanczos3 })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  bleedAlphaEdges(wildlife.data, wildlife.info);

  await sharp(wildlife.data, {
    raw: {
      channels: wildlife.info.channels,
      height: wildlife.info.height,
      width: wildlife.info.width,
    },
  })
    .webp({
      alphaQuality: 100,
      effort: 6,
      // Keep the bled RGB under alpha=0; see the conifer atlas note.
      exact: true,
      preset: "picture",
      quality: 84,
      smartSubsample: false,
    })
    .toFile(path.join(outputDir, "wildlife.webp"));
}

/**
 * Fails when the transparent region is systematically darker than the subject.
 *
 * Filtering averages colour and alpha independently, so a texel straddling a
 * cut-out edge — or a high mip level covering a whole atlas cell — keeps enough
 * alpha to clear `alphaTest` while its colour has already been pulled toward
 * whatever sits in the void. Black there turns the distant canopy into solid
 * black blobs. Means are what filtering actually samples, so the invariant is
 * the void's mean luminance, not any individual texel: lossy WebP will always
 * leave scattered dark artifacts that average out harmlessly.
 */
async function validateAlphaBleed(assetPath, label) {
  const { data, info } = await sharp(assetPath)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const { channels, height, width } = info;

  let voidLuminance = 0;
  let voidCount = 0;
  let subjectLuminance = 0;
  let subjectCount = 0;

  for (let pixel = 0; pixel < width * height; pixel += 1) {
    const offset = pixel * channels;
    const luminance =
      data[offset] * 0.2126 + data[offset + 1] * 0.7152 + data[offset + 2] * 0.0722;
    if (data[offset + 3] === 0) {
      voidLuminance += luminance;
      voidCount += 1;
    } else {
      subjectLuminance += luminance;
      subjectCount += 1;
    }
  }

  if (voidCount === 0 || subjectCount === 0) {
    throw new Error(`${label} must contain both subject and transparent pixels`);
  }

  const voidMean = voidLuminance / voidCount;
  const subjectMean = subjectLuminance / subjectCount;
  if (voidMean < subjectMean * 0.6) {
    throw new Error(
      `${label} transparent region averages luminance ${voidMean.toFixed(1)} against a subject mean of ${subjectMean.toFixed(1)}; alpha bleed must fill the void with subject colour so filtering cannot darken the canopy`,
    );
  }
}

/**
 * Fails when the backdrop carries texels the tone curve would crush to black.
 *
 * See `bakeAerialPerspective`: the runtime tints this map by `0x9fb894` and
 * tone-maps with ACES, so a dark panorama does not merely look dark — it
 * resolves to a pure-black void above the treeline. The invariant is per-texel
 * rather than a mean, because a black hole punched through one corner of the
 * sky is exactly what a healthy average hides.
 */
async function validateBackdropTonalFloor(assetPath) {
  const { data, info } = await sharp(assetPath)
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  let darkest = Number.POSITIVE_INFINITY;
  for (let offset = 0; offset < data.length; offset += info.channels) {
    const luminance =
      data[offset] * 0.2126 + data[offset + 1] * 0.7152 + data[offset + 2] * 0.0722;
    if (luminance < darkest) darkest = luminance;
  }

  if (darkest < BACKDROP_MIN_LUMINANCE) {
    throw new Error(
      `backdrop.webp holds a texel at luminance ${darkest.toFixed(1)}; aerial perspective must keep every texel above ${BACKDROP_MIN_LUMINANCE} so the tint and ACES curve cannot crush the distant treeline to black`,
    );
  }
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

  const coniferColorPath = path.join(outputDir, "conifer-color.webp");
  const decodedConifer = await sharp(coniferColorPath)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const usableCellSize = BRANCH_CELL_SIZE - BRANCH_REQUIRED_GUTTER * 2;
  for (let cellY = 0; cellY < 2; cellY += 1) {
    for (let cellX = 0; cellX < 2; cellX += 1) {
      const left = cellX * BRANCH_CELL_SIZE;
      const top = cellY * BRANCH_CELL_SIZE;
      let subjectLeft = BRANCH_CELL_SIZE;
      let subjectTop = BRANCH_CELL_SIZE;
      let subjectRight = -1;
      let subjectBottom = -1;
      for (let y = top; y < top + BRANCH_CELL_SIZE; y += 1) {
        for (let x = left; x < left + BRANCH_CELL_SIZE; x += 1) {
          const inGutter =
            x < left + BRANCH_REQUIRED_GUTTER ||
            x >= left + BRANCH_CELL_SIZE - BRANCH_REQUIRED_GUTTER ||
            y < top + BRANCH_REQUIRED_GUTTER ||
            y >= top + BRANCH_CELL_SIZE - BRANCH_REQUIRED_GUTTER;
          const alpha = decodedConifer.data[
            (y * decodedConifer.info.width + x) *
              decodedConifer.info.channels +
              3
          ];
          if (inGutter) {
            if (alpha !== 0) {
              throw new Error(
                `conifer-color.webp cell ${cellX},${cellY} gutter alpha is ${alpha}`,
              );
            }
            continue;
          }
          if (alpha === 0) continue;
          subjectLeft = Math.min(subjectLeft, x - left);
          subjectTop = Math.min(subjectTop, y - top);
          subjectRight = Math.max(subjectRight, x - left);
          subjectBottom = Math.max(subjectBottom, y - top);
        }
      }

      if (subjectRight < subjectLeft || subjectBottom < subjectTop) {
        throw new Error(
          `conifer-color.webp cell ${cellX},${cellY} carries no opaque texels`,
        );
      }

      // A branch card shows one whole cell, so transparent margin inside the
      // cell is a gap between the card's edge and the needles — on a conifer,
      // a canopy clump hovering over a bare trunk.
      const fillX = (subjectRight - subjectLeft + 1) / usableCellSize;
      const fillY = (subjectBottom - subjectTop + 1) / usableCellSize;
      if (fillX < BRANCH_MIN_CELL_FILL || fillY < BRANCH_MIN_CELL_FILL) {
        throw new Error(
          `conifer-color.webp cell ${cellX},${cellY} fills only ${(fillX * 100).toFixed(0)}% x ${(fillY * 100).toFixed(0)}% of its usable box; every branch card must span at least ${(BRANCH_MIN_CELL_FILL * 100).toFixed(0)}% on both axes or the canopy floats above a bare trunk`,
        );
      }
    }
  }

  for (const filename of ["conifer-color.webp", "wildlife.webp"]) {
    await validateAlphaBleed(path.join(outputDir, filename), filename);
  }

  await validateBackdropTonalFloor(path.join(outputDir, "backdrop.webp"));

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

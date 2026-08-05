#!/usr/bin/env node

/**
 * Chuẩn hoá bộ master ImageGen đơn sắc thành alpha artwork đổi màu được bằng CSS.
 *
 * Source generated masters:
 *   public/chungdoi/images/themes/_decor/thap-nhi-chi-do/source/<id>.png
 *
 * Outputs:
 *   zodiac-<id>.webp       1952×4105, alpha fill
 *   zodiac-<id>-line.webp  1966×4119, alpha engraving/edge
 */

import { copyFile, mkdir } from "node:fs/promises";
import path from "node:path";

import sharp from "sharp";

const ROOT = process.cwd();
const THEME_DIRECTORY = path.join(
  ROOT,
  "public/chungdoi/images/themes/_decor/thap-nhi-chi-do",
);
const SOURCE_DIRECTORY = path.join(THEME_DIRECTORY, "source");
const SONG_PHUNG_DIRECTORY = path.join(
  ROOT,
  "public/chungdoi/images/themes/songphung-red",
);
const SONG_PHUNG_DECOR_DIRECTORY = path.join(
  ROOT,
  "public/chungdoi/images/themes/_decor/songphung-red",
);

const ZODIAC_IDS = [
  "chuot",
  "trau",
  "ho",
  "meo",
  "rong",
  "tran",
  "ngua",
  "de",
  "khi",
  "ga",
  "cho",
  "lon",
];

const FILLED_SIZE = { width: 1952, height: 4105 };
const LINE_SIZE = { width: 1966, height: 4119 };
const GOLD = { red: 212, green: 162, blue: 74 };
const ALPHA_THRESHOLD = 16;
const SAFE_RECT = { width: 0.88, height: 0.9 };
const LEFT_FACING_SOURCE_IDS = new Set(["chuot", "trau", "cho"]);

function clampByte(value) {
  return Math.max(0, Math.min(255, Math.round(value)));
}

function alphaBounds(alpha, width, height) {
  let minX = width;
  let minY = height;
  let maxX = -1;
  let maxY = -1;

  for (let index = 0; index < alpha.length; index += 1) {
    if ((alpha[index] ?? 0) <= ALPHA_THRESHOLD) continue;
    const x = index % width;
    const y = Math.floor(index / width);
    minX = Math.min(minX, x);
    minY = Math.min(minY, y);
    maxX = Math.max(maxX, x);
    maxY = Math.max(maxY, y);
  }

  if (maxX < minX || maxY < minY) {
    throw new Error("Artwork alpha mask is empty");
  }

  return {
    left: minX,
    top: minY,
    width: maxX - minX + 1,
    height: maxY - minY + 1,
  };
}

async function normalizeAlpha(alpha, width, height, target, flip = false) {
  const bounds = alphaBounds(alpha, width, height);
  const safeWidth = Math.floor(target.width * SAFE_RECT.width);
  const safeHeight = Math.floor(target.height * SAFE_RECT.height);
  const scale = Math.min(
    safeWidth / bounds.width,
    safeHeight / bounds.height,
  );
  const subjectWidth = Math.max(1, Math.round(bounds.width * scale));
  const subjectHeight = Math.max(1, Math.round(bounds.height * scale));

  let subject = sharp(alpha, { raw: { width, height, channels: 1 } })
    .extract(bounds);
  if (flip) subject = subject.flop();
  const resized = await subject
    .resize(subjectWidth, subjectHeight, {
      fit: "fill",
      kernel: sharp.kernel.lanczos3,
    })
    .extractChannel(0)
    .raw()
    .toBuffer();

  const normalized = Buffer.alloc(target.width * target.height);
  const left = Math.floor((target.width - subjectWidth) / 2);
  const top = Math.floor((target.height - subjectHeight) / 2);
  for (let y = 0; y < subjectHeight; y += 1) {
    const sourceStart = y * subjectWidth;
    const targetStart = (top + y) * target.width + left;
    resized.copy(
      normalized,
      targetStart,
      sourceStart,
      sourceStart + subjectWidth,
    );
  }

  return normalized;
}

/**
 * ImageGen masters use ivory artwork over a bright-green key. This score keeps
 * ivory/white pixels opaque, maps mixed antialias pixels smoothly, and rejects
 * even a slightly non-uniform green background without relying on one sampled
 * RGB value.
 */
async function keyedAlpha(source) {
  const { data, info } = await sharp(source)
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const alpha = Buffer.alloc(info.width * info.height);

  for (let index = 0; index < alpha.length; index += 1) {
    const offset = index * info.channels;
    const red = data[offset] ?? 0;
    const green = data[offset + 1] ?? 0;
    const blue = data[offset + 2] ?? 0;
    const subjectScore = red + blue - 1.1 * green;
    alpha[index] = clampByte(((subjectScore + 35) / 140) * 255);
  }

  return { alpha, width: info.width, height: info.height };
}

async function sourceAlpha(source) {
  const { data, info } = await sharp(source)
    .ensureAlpha()
    .extractChannel("alpha")
    .raw()
    .toBuffer({ resolveWithObject: true });
  return { alpha: data, width: info.width, height: info.height };
}

function edgeAlpha(alpha, width, height, radius = 4) {
  const edge = Buffer.alloc(alpha.length);
  for (let y = radius; y < height - radius; y += 1) {
    for (let x = radius; x < width - radius; x += 1) {
      const index = y * width + x;
      const samples = [
        alpha[index] ?? 0,
        alpha[index - radius] ?? 0,
        alpha[index + radius] ?? 0,
        alpha[index - radius * width] ?? 0,
        alpha[index + radius * width] ?? 0,
      ];
      const spread = Math.max(...samples) - Math.min(...samples);
      edge[index] = clampByte(spread * 1.8);
    }
  }
  return edge;
}

async function writeGoldMask(alpha, size, output) {
  const rgba = Buffer.alloc(size.width * size.height * 4);
  for (let index = 0; index < alpha.length; index += 1) {
    const offset = index * 4;
    rgba[offset] = GOLD.red;
    rgba[offset + 1] = GOLD.green;
    rgba[offset + 2] = GOLD.blue;
    rgba[offset + 3] = alpha[index] ?? 0;
  }

  await sharp(rgba, {
    raw: { width: size.width, height: size.height, channels: 4 },
  })
    .webp({ lossless: true, effort: 6, alphaQuality: 100 })
    .toFile(output);
}

async function renderGeneratedAnimal(id) {
  const source = path.join(SOURCE_DIRECTORY, `${id}.png`);
  const keyed = await keyedAlpha(source);
  const flip = LEFT_FACING_SOURCE_IDS.has(id);
  const filledAlpha = await normalizeAlpha(
    keyed.alpha,
    keyed.width,
    keyed.height,
    FILLED_SIZE,
    flip,
  );
  const lineSourceAlpha = await normalizeAlpha(
    keyed.alpha,
    keyed.width,
    keyed.height,
    LINE_SIZE,
    flip,
  );
  const lineAlpha = edgeAlpha(lineSourceAlpha, LINE_SIZE.width, LINE_SIZE.height);

  await Promise.all([
    writeGoldMask(
      filledAlpha,
      FILLED_SIZE,
      path.join(THEME_DIRECTORY, `zodiac-${id}.webp`),
    ),
    writeGoldMask(
      lineAlpha,
      LINE_SIZE,
      path.join(THEME_DIRECTORY, `zodiac-${id}-line.webp`),
    ),
  ]);
}

async function renderPhoenixFallback() {
  const filledSource = await sourceAlpha(
    path.join(SONG_PHUNG_DIRECTORY, "Phuong.webp"),
  );
  const lineSource = await sourceAlpha(
    path.join(SONG_PHUNG_DIRECTORY, "Phuong line.webp"),
  );
  const filledAlpha = await normalizeAlpha(
    filledSource.alpha,
    filledSource.width,
    filledSource.height,
    FILLED_SIZE,
  );
  const lineAlpha = await normalizeAlpha(
    lineSource.alpha,
    lineSource.width,
    lineSource.height,
    LINE_SIZE,
  );

  await Promise.all([
    writeGoldMask(
      filledAlpha,
      FILLED_SIZE,
      path.join(THEME_DIRECTORY, "zodiac-phuong.webp"),
    ),
    writeGoldMask(
      lineAlpha,
      LINE_SIZE,
      path.join(THEME_DIRECTORY, "zodiac-phuong-line.webp"),
    ),
  ]);
}

async function main() {
  await mkdir(THEME_DIRECTORY, { recursive: true });
  for (const id of ZODIAC_IDS) {
    await renderGeneratedAnimal(id);
    process.stdout.write(`${id}: filled + line masks generated\n`);
  }
  await renderPhoenixFallback();
  await copyFile(
    path.join(SONG_PHUNG_DECOR_DIRECTORY, "HOA.webp"),
    path.join(THEME_DIRECTORY, "HOA.webp"),
  );
  process.stdout.write("phuong: filled + line fallback masks generated\n");
  process.stdout.write("HOA.webp: reused Song Phụng decoration copied\n");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

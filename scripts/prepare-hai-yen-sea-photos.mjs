#!/usr/bin/env node

// Hải Yến Thanh Thư — real sea photography for the hero band and the scrolling
// decor dividers.
//
// Sources are Poly Haven tonemapped HDRI panoramas, released CC0 (public
// domain). Each 8192x4096 equirectangular JPG is reprojected to a flat
// perspective crop with ffmpeg's `v360`, then graded toward the template's
// cerulean palette with Sharp so a photograph sits naturally on cream paper.
//
//   node scripts/prepare-hai-yen-sea-photos.mjs
//
// Re-running is cheap: panoramas are cached under tmp/sea-src.

import { access, mkdir, writeFile } from "node:fs/promises";
import { execFile } from "node:child_process";
import path from "node:path";
import { promisify } from "node:util";
import sharp from "sharp";

const run = promisify(execFile);
const root = process.cwd();
const srcDir = path.join(root, "tmp/sea-src");
const outDir = path.join(root, "public/chungdoi/images/themes/_decor/hai-yen-thanh-thu/photo");

const PANORAMAS = {
  umhlanga_sunrise: "https://dl.polyhaven.org/file/ph-assets/HDRIs/extra/Tonemapped%20JPG/umhlanga_sunrise.jpg",
  blouberg_sunrise_1:
    "https://dl.polyhaven.org/file/ph-assets/HDRIs/extra/Tonemapped%20JPG/blouberg_sunrise_1.jpg",
};

/**
 * Each crop names the panorama plus the camera it is shot with. `yaw`/`pitch`
 * aim the virtual lens; `hFov`/`vFov` set how wide and how tall the slice is.
 */
const CROPS = [
  {
    id: "sea-hero",
    pano: "umhlanga_sunrise",
    camera: { yaw: 36, pitch: 2, hFov: 92, vFov: 52, width: 1400, height: 790 },
    out: { width: 1024, height: 580 },
    grade: { saturation: 0.82, brightness: 1.06, tint: "#dfeef6", tintOpacity: 0.16 },
  },
  {
    id: "sea-band-waves",
    // Aim right of the sun so the breakers fill the strip: no horizon, no sand.
    pano: "umhlanga_sunrise",
    camera: { yaw: 78, pitch: -4, hFov: 78, vFov: 15, width: 1400, height: 306 },
    out: { width: 1280, height: 280 },
    grade: { saturation: 1.02, brightness: 1.06, tint: "#e6f2f9", tintOpacity: 0.1 },
  },
  {
    id: "sea-band-foam",
    pano: "umhlanga_sunrise",
    camera: { yaw: 88, pitch: -2, hFov: 72, vFov: 14, width: 1400, height: 272 },
    out: { width: 1280, height: 280 },
    grade: { saturation: 0.76, brightness: 1.05, tint: "#dcedf7", tintOpacity: 0.22 },
  },
  {
    id: "sea-band-horizon",
    pano: "umhlanga_sunrise",
    camera: { yaw: 10, pitch: 0, hFov: 90, vFov: 12, width: 1400, height: 187 },
    out: { width: 1280, height: 220 },
    grade: { saturation: 0.8, brightness: 1.03, tint: "#d8ebf6", tintOpacity: 0.22 },
  },
  {
    id: "sea-band-shore",
    pano: "blouberg_sunrise_1",
    camera: { yaw: 8, pitch: -6, hFov: 84, vFov: 16, width: 1400, height: 268 },
    out: { width: 1280, height: 250 },
    grade: { saturation: 0.8, brightness: 1.04, tint: "#dbecf7", tintOpacity: 0.2 },
  },
];

async function exists(file) {
  try {
    await access(file);
    return true;
  } catch {
    return false;
  }
}

async function fetchPanorama(id, url) {
  const file = path.join(srcDir, `${id}.jpg`);
  if (await exists(file)) return file;
  process.stdout.write(`downloading ${id}\n`);
  const response = await fetch(url);
  if (!response.ok) throw new Error(`${id}: HTTP ${response.status}`);
  await writeFile(file, Buffer.from(await response.arrayBuffer()));
  return file;
}

async function reproject(source, { yaw, pitch, hFov, vFov, width, height }, target) {
  await run("ffmpeg", [
    "-v",
    "error",
    "-y",
    "-i",
    source,
    "-vf",
    `v360=e:flat:yaw=${yaw}:pitch=${pitch}:h_fov=${hFov}:v_fov=${vFov}:w=${width}:h=${height}`,
    target,
  ]);
}

/** Desaturate, lift, then veil with a pale cerulean so the photo reads as a wash. */
async function grade(source, { width, height }, { saturation, brightness, tint, tintOpacity }) {
  const base = await sharp(source)
    .resize({ width, height, fit: "cover", position: "center" })
    .modulate({ saturation, brightness })
    .toColourspace("srgb")
    .png()
    .toBuffer();

  const veil = await sharp({
    create: { width, height, channels: 4, background: { ...hexToRgb(tint), alpha: tintOpacity } },
  })
    .png()
    .toBuffer();

  return sharp(base).composite([{ input: veil, blend: "over" }]).png().toBuffer();
}

function hexToRgb(hex) {
  const value = Number.parseInt(hex.slice(1), 16);
  return { r: (value >> 16) & 255, g: (value >> 8) & 255, b: value & 255 };
}

await mkdir(srcDir, { recursive: true });
await mkdir(outDir, { recursive: true });

const panoramaPaths = {};
for (const [id, url] of Object.entries(PANORAMAS)) {
  panoramaPaths[id] = await fetchPanorama(id, url);
}

for (const crop of CROPS) {
  const flat = path.join(srcDir, `flat-${crop.id}.png`);
  await reproject(panoramaPaths[crop.pano], crop.camera, flat);
  const graded = await grade(flat, crop.out, crop.grade);
  await sharp(graded).webp({ quality: 88 }).toFile(path.join(outDir, `${crop.id}.webp`));
  // Keep an ungraded PNG in tmp so the artwork generator can composite it.
  await writeFile(path.join(srcDir, `graded-${crop.id}.png`), graded);
  process.stdout.write(`  ${crop.id}.webp  ${crop.out.width}x${crop.out.height}\n`);
}

process.stdout.write(`hai-yen-thanh-thu sea photos written to ${path.relative(root, outDir)}\n`);

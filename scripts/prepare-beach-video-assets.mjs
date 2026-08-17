#!/usr/bin/env node

/**
 * Encodes the beach journey's live-action ocean backdrop.
 *
 * Companion to `prepare-beach-photoreal-assets.mjs`, and deliberately the same
 * shape: verify the source checksum before touching it, encode deterministically,
 * assert the budget, and write a byte table the manifest test reads. The one
 * difference is the source licence — Poly Haven ships CC0, Pexels does not, so
 * the provenance recorded here carries the Pexels licence terms rather than a
 * public-domain dedication. See `docs/research/asset-provenance.md`.
 */

import { createHash } from "node:crypto";
import { execFile } from "node:child_process";
import { mkdir, readFile, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";

const run = promisify(execFile);

const ROOT = process.cwd();
const DEFAULT_SOURCE_DIR = path.join(ROOT, "tmp/beach-video-sources");
const DEFAULT_OUTPUT_DIR = path.join(
  ROOT,
  "public/chungdoi/labs/beach-wedding-journey/video",
);

/**
 * The source clip.
 *
 * Chosen by measurement over eleven candidates rather than by eye. On six frames
 * sampled across each clip this one measured the brightest sky (mean luminance
 * 151 rising to 170, against 70 and 56 for the two dark runners-up) and by far
 * the most whitewater (32.5% to 37.5% of the lower frame reads as bright
 * low-saturation foam, against 0.2% to 8.8% elsewhere). Bright and foaming is
 * exactly the brief: "bãi biển thơ mộng" with visible breaking waves.
 */
const SOURCE = Object.freeze({
  author: "Enrique Hoyos",
  filename: "pexels-4763824-hd_1920_1080_24fps.mp4",
  licence: "Pexels Licence — free for commercial use, no attribution required",
  licenceUrl: "https://www.pexels.com/license/",
  pageUrl: "https://www.pexels.com/video/waves-rushing-to-the-shore-4763824/",
  sha256: "1509bee64c8efd367cd080610080e6fabdde5217a7cb86d109ec1d40c04ffefa",
  url: "https://videos.pexels.com/video-files/4763824/4763824-hd_1920_1080_24fps.mp4",
});

/**
 * Where the loop starts in the source, and how long it runs.
 *
 * Measured, not chosen: tracking the horizon row (the row of maximum vertical
 * luminance gradient) across four candidate six-second windows gave a standard
 * deviation of 0.1394, 0.1472, 0.0887 and 0.0202 of frame height at offsets 0, 2,
 * 4 and 6 seconds, with the peak-to-peak range falling from 0.378 to 0.067. The
 * clip is handheld, so the camera settles as it goes; starting at 6s takes the
 * calmest stretch. A drifting horizon behind a static DOM panel reads as the
 * whole page sliding, which is why this is worth measuring rather than eyeballing.
 */
const LOOP_START_SECONDS = 6;
const LOOP_DURATION_SECONDS = 7.5;

/**
 * Frame rate of the shipped loop.
 *
 * Down from the source's 24. Water has no hard edges and no readable motion a
 * viewer tracks, so the drop is invisible while it removes an eighth of the
 * frames — and this loop plays *behind* text the guest is reading, where a lower
 * frame rate is a feature rather than a compromise.
 */
const LOOP_FPS = 21;

/**
 * Crossfade length used to close the loop, in seconds.
 *
 * A cut back to frame one is visible on water: the wave positions do not match, so
 * the eye catches a jump every pass. Blending the tail over the head hides it, and
 * water is the one subject where a dissolve is genuinely invisible because the
 * texture is stochastic — there is no structure for the blend to smear.
 */
const LOOP_CROSSFADE_SECONDS = 1;

/**
 * The shipped renditions.
 *
 * Two, not one. The mobile file is not merely smaller: a 1080-wide video decoded
 * on a phone costs memory and battery for detail the viewport cannot show, and the
 * lab's own quality tiers already treat mobile as a different device rather than a
 * narrower window.
 *
 * Both heights are even because h264 chroma subsampling halves each axis, so
 * libx264 refuses an odd dimension outright. The mobile rendition is 720x404
 * rather than a true 16:9 720x405 for exactly that reason — a 1px deviation the
 * `object-fit: cover` backdrop absorbs invisibly.
 */
const RENDITIONS = Object.freeze([
  {
    crf: 25,
    filename: "ocean-loop-1280.mp4",
    height: 720,
    id: "oceanLoopDesktop",
    width: 1280,
  },
  {
    crf: 27,
    filename: "ocean-loop-720.mp4",
    height: 404,
    id: "oceanLoopMobile",
    width: 720,
  },
]);

/**
 * The poster, shown before the first frame decodes and whenever motion is off.
 *
 * This is not a nice-to-have: `prefers-reduced-motion: reduce` must stop the
 * video, and a stopped `<video>` with no poster is a black rectangle. It is also
 * what the guest sees on the very first paint, so it carries the scene's colour
 * before a single video byte has arrived.
 */
const POSTER = Object.freeze({
  filename: "ocean-loop-poster.webp",
  id: "oceanLoopPoster",
  quality: 82,
  width: 1280,
});

/**
 * Compressed budget for the whole video pack.
 *
 * Sized against what the pack it partly replaces actually costs. The photoreal
 * entry group is 2,061,204 bytes of a 4,000,000 budget, and `sky.hdr` alone is
 * 1,381,374 of that — so a backdrop that removes the need for an HDRI has real
 * room to work in. 3.5 MB keeps both renditions plus the poster inside the same
 * order of magnitude as the 3D pack rather than quietly becoming the largest
 * thing the lab downloads.
 */
const VIDEO_COMPRESSED_BUDGET = 3_500_000;

/** Largest single rendition. A 2 MB hero video on a phone is not acceptable. */
const RENDITION_BUDGET = 2_000_000;

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

async function loadSource(sourceDir) {
  const destination = path.join(sourceDir, SOURCE.filename);
  let buffer;

  try {
    buffer = await readFile(destination);
  } catch {
    console.log(`Downloading ${SOURCE.url}`);
    const response = await fetch(SOURCE.url);
    if (!response.ok) {
      throw new Error(`Unable to download ${SOURCE.url}: ${response.status}`);
    }
    buffer = Buffer.from(await response.arrayBuffer());
    await writeFile(destination, buffer);
  }

  const sha256 = digest("sha256", buffer);
  // The upstream has no published checksum, so the recorded hash is the contract:
  // once it is written into this file, a source that changes underneath us fails
  // here instead of silently re-encoding different footage.
  if (SOURCE.sha256 && sha256 !== SOURCE.sha256) {
    throw new Error(
      `Source clip changed: expected sha256 ${SOURCE.sha256}, received ${sha256}`,
    );
  }

  return { path: destination, sha256 };
}

/**
 * Builds the seamless loop filter graph for one rendition.
 *
 * The graph trims two overlapping windows out of the source and crossfades the
 * tail into the head, so the last frame of the output already resembles the first
 * and the browser's own `loop` attribute has nothing to give away.
 */
function buildLoopFilter(width, height) {
  const body = LOOP_DURATION_SECONDS - LOOP_CROSSFADE_SECONDS;

  return [
    // The main body, and the tail that will be faded over its head.
    `[0:v]trim=start=${LOOP_START_SECONDS}:duration=${body},setpts=PTS-STARTPTS[body]`,
    `[0:v]trim=start=${LOOP_START_SECONDS + body}:duration=${LOOP_CROSSFADE_SECONDS},setpts=PTS-STARTPTS[tail]`,
    `[0:v]trim=start=${LOOP_START_SECONDS}:duration=${LOOP_CROSSFADE_SECONDS},setpts=PTS-STARTPTS[head]`,
    // Fade the tail into the head to close the seam.
    `[tail][head]blend=all_expr='A*(1-(T/${LOOP_CROSSFADE_SECONDS}))+B*(T/${LOOP_CROSSFADE_SECONDS})'[seam]`,
    `[body][seam]concat=n=2:v=1:a=0[joined]`,
    `[joined]fps=${LOOP_FPS},scale=${width}:${height}:flags=lanczos,format=yuv420p[out]`,
  ].join(";");
}

async function encodeRendition(sourcePath, outputDir, rendition) {
  const destination = path.join(outputDir, rendition.filename);

  await run("ffmpeg", [
    "-v", "error",
    "-y",
    "-i", sourcePath,
    "-filter_complex", buildLoopFilter(rendition.width, rendition.height),
    "-map", "[out]",
    // No audio track at all. The lab has its own music lifecycle, and a muted
    // audio stream would still cost bytes and still risk an unmuted autoplay
    // block on iOS.
    "-an",
    "-c:v", "libx264",
    "-profile:v", "main",
    // 4.0 keeps the file inside the hardware-decode envelope of older phones.
    "-level", "4.0",
    "-preset", "veryslow",
    "-crf", String(rendition.crf),
    // Keyframe every second: the loop restarts often, and a long GOP makes the
    // wrap decode a whole group before it can show frame one.
    "-g", String(LOOP_FPS),
    // `faststart` moves the moov atom to the front so playback can begin before
    // the whole file has arrived.
    "-movflags", "+faststart",
    destination,
  ]);

  return destination;
}

async function encodePoster(sourcePath, outputDir) {
  const destination = path.join(outputDir, POSTER.filename);
  const { default: sharp } = await import("sharp");

  // Taken from the loop's own first frame, so the poster and the video's opening
  // frame are the same picture — otherwise the handover visibly pops.
  const { stdout } = await run(
    "ffmpeg",
    [
      "-v", "error",
      "-ss", String(LOOP_START_SECONDS),
      "-i", sourcePath,
      "-frames:v", "1",
      "-f", "image2pipe",
      "-vcodec", "png",
      "-",
    ],
    { encoding: "buffer", maxBuffer: 64 * 1024 * 1024 },
  );

  await sharp(stdout)
    .resize(POSTER.width, null, { kernel: sharp.kernel.lanczos3 })
    .webp({ effort: 6, quality: POSTER.quality })
    .toFile(destination);

  return destination;
}

/**
 * Proves the loop is actually seamless and actually bright.
 *
 * Both properties have a failure mode that no size check would catch: a loop
 * whose crossfade did not apply cuts visibly on every pass, and a clip that
 * encoded from the wrong offset would be the handheld opening rather than the
 * settled tail.
 */
async function validateLoop(outputDir, rendition) {
  const { default: sharp } = await import("sharp");
  const source = path.join(outputDir, rendition.filename);

  const frameAt = async (position) => {
    const { stdout } = await run(
      "ffmpeg",
      [
        "-v", "error",
        ...position,
        "-i", source,
        "-frames:v", "1",
        "-vf", "scale=320:-1",
        "-f", "image2pipe",
        "-vcodec", "png",
        "-",
      ],
      { encoding: "buffer", maxBuffer: 32 * 1024 * 1024 },
    );
    return sharp(stdout).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  };

  const first = await frameAt(["-ss", "0"]);
  const last = await frameAt(["-sseof", "-0.12"]);

  let difference = 0;
  let luminanceSum = 0;
  const pixels = first.info.width * first.info.height;
  for (let index = 0; index < first.data.length; index += 3) {
    for (let channel = 0; channel < 3; channel += 1) {
      difference += Math.abs(
        first.data[index + channel] - last.data[index + channel],
      );
    }
    luminanceSum += 0.2126 * first.data[index]
      + 0.7152 * first.data[index + 1]
      + 0.0722 * first.data[index + 2];
  }

  const meanDifference = difference / (pixels * 3);
  const meanLuminance = luminanceSum / pixels;

  // 18 of 255 is the empirical line between "the wave pattern continues" and "the
  // video cut". Water is stochastic, so the two ends never match exactly and
  // demanding a small number here would fail on a correct loop.
  if (meanDifference > 18) {
    throw new Error(
      `${rendition.filename} does not loop seamlessly: mean first/last frame delta ${meanDifference.toFixed(2)} of 255. Check LOOP_CROSSFADE_SECONDS actually applied.`,
    );
  }
  // The whole reason this clip was chosen over ten others was its brightness.
  if (meanLuminance < 110) {
    throw new Error(
      `${rendition.filename} is too dark to read as a bright shoreline: mean luminance ${meanLuminance.toFixed(1)}. Check LOOP_START_SECONDS still lands on the lit stretch.`,
    );
  }

  return { meanDifference, meanLuminance };
}

async function validateOutputs(outputDir) {
  const assets = [];

  for (const rendition of RENDITIONS) {
    const outputPath = path.join(outputDir, rendition.filename);
    const file = await stat(outputPath);

    const { stdout } = await run("ffprobe", [
      "-v", "error",
      "-select_streams", "v:0",
      "-show_entries", "stream=width,height,duration,codec_name",
      "-of", "json",
      outputPath,
    ]);
    const probed = JSON.parse(stdout).streams[0];

    if (
      Number(probed.width) !== rendition.width
      || Number(probed.height) !== rendition.height
    ) {
      throw new Error(
        `${rendition.filename} must be ${rendition.width}x${rendition.height}, received ${probed.width}x${probed.height}`,
      );
    }
    if (file.size > RENDITION_BUDGET) {
      throw new Error(
        `${rendition.filename} is ${file.size} bytes; per-file budget is ${RENDITION_BUDGET}`,
      );
    }

    const loop = await validateLoop(outputDir, rendition);
    assets.push({
      ...rendition,
      bytes: file.size,
      durationSeconds: Number(probed.duration),
      loop,
    });
  }

  const poster = await stat(path.join(outputDir, POSTER.filename));
  assets.push({ ...POSTER, bytes: poster.size });

  const totalBytes = assets.reduce((total, asset) => total + asset.bytes, 0);
  if (totalBytes > VIDEO_COMPRESSED_BUDGET) {
    throw new Error(
      `Video pack is ${totalBytes} bytes; budget is ${VIDEO_COMPRESSED_BUDGET}`,
    );
  }

  return { assets, totalBytes };
}

if (process.argv.includes("--help")) {
  console.log(`Usage: node scripts/prepare-beach-video-assets.mjs [options]

Options:
  --source-dir <path>       Download cache (default: tmp/beach-video-sources)
  --output-dir <path>       Project output directory`);
  process.exit(0);
}

const sourceDir = getArgument("--source-dir", DEFAULT_SOURCE_DIR);
const outputDir = getArgument("--output-dir", DEFAULT_OUTPUT_DIR);

await Promise.all([
  mkdir(sourceDir, { recursive: true }),
  mkdir(outputDir, { recursive: true }),
]);

const source = await loadSource(sourceDir);
console.log(`Source ${SOURCE.filename} sha256 ${source.sha256}`);

for (const rendition of RENDITIONS) {
  await encodeRendition(source.path, outputDir, rendition);
  console.log(`  encoded ${rendition.filename}`);
}
await encodePoster(source.path, outputDir);
console.log(`  encoded ${POSTER.filename}`);

const report = await validateOutputs(outputDir);

const byteTable = {
  ...Object.fromEntries(report.assets.map((asset) => [asset.id, asset.bytes])),
  source: {
    author: SOURCE.author,
    filename: SOURCE.filename,
    licence: SOURCE.licence,
    licenceUrl: SOURCE.licenceUrl,
    loopCrossfadeSeconds: LOOP_CROSSFADE_SECONDS,
    loopDurationSeconds: LOOP_DURATION_SECONDS,
    loopFps: LOOP_FPS,
    loopStartSeconds: LOOP_START_SECONDS,
    pageUrl: SOURCE.pageUrl,
    sha256: source.sha256,
    url: SOURCE.url,
  },
};
await writeFile(
  path.join(outputDir, "beach-video-bytes.json"),
  `${JSON.stringify(byteTable, null, 2)}\n`,
);

for (const asset of report.assets) {
  const loop = asset.loop
    ? `  loop delta ${asset.loop.meanDifference.toFixed(2)}/18  luma ${asset.loop.meanLuminance.toFixed(1)}`
    : "";
  console.log(
    `  ${asset.filename.padEnd(26)} ${String(asset.bytes).padStart(9)} bytes${loop}`,
  );
}
console.log(
  `video pack ${report.totalBytes} / ${VIDEO_COMPRESSED_BUDGET} bytes`,
);

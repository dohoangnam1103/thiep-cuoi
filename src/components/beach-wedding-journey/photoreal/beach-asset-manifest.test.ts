import assert from "node:assert/strict";
import { readFileSync, statSync } from "node:fs";
import path from "node:path";
import { test } from "node:test";

import sharp from "sharp";

import {
  BEACH_PHOTOREAL_ASSETS,
  getBeachPhotorealAssetEstimate,
} from "./beach-asset-manifest";

const PUBLIC_ROOT = path.join(process.cwd(), "public");
const ENTRY_COMPRESSED_BUDGET = 4_000_000;
const SHARED_COMPRESSED_BUDGET = 12_000_000;
const DECODED_TEXTURE_CEILING = 64 * 1_024 * 1_024;

test("every declared asset exists on disk", () => {
  for (const asset of BEACH_PHOTOREAL_ASSETS) {
    const filePath = path.join(PUBLIC_ROOT, asset.src);
    assert.ok(statSync(filePath).isFile(), `${asset.id} missing at ${asset.src}`);
  }
});

test("declared bytes match the bytes on disk", () => {
  const measured = getBeachPhotorealAssetEstimate("shared");
  const actual = measured.assets.reduce(
    (total, asset) => total + statSync(path.join(PUBLIC_ROOT, asset.src)).size,
    0,
  );

  assert.equal(
    measured.compressedBytes,
    actual,
    "manifest byte table drifted from disk — re-run npm run beach:prepare-assets and transcribe",
  );
});

test("the manifest agrees with the pipeline's byte table", () => {
  const table = JSON.parse(
    readFileSync(
      path.join(
        PUBLIC_ROOT,
        "chungdoi/labs/beach-wedding-journey/photoreal/beach-asset-bytes.json",
      ),
      "utf8",
    ),
  ) as Record<string, number>;

  for (const asset of BEACH_PHOTOREAL_ASSETS) {
    assert.equal(
      statSync(path.join(PUBLIC_ROOT, asset.src)).size,
      table[asset.id],
      `${asset.id} disagrees with beach-asset-bytes.json`,
    );
  }
});

test("entry assets fit the delivery budget", () => {
  const entry = getBeachPhotorealAssetEstimate("entry");
  assert.ok(
    entry.compressedBytes <= ENTRY_COMPRESSED_BUDGET,
    `entry pack is ${entry.compressedBytes} bytes`,
  );
  assert.ok(entry.assets.every((asset) => asset.blocking));
});

test("shared assets fit the delivery budget", () => {
  const shared = getBeachPhotorealAssetEstimate("shared");
  assert.ok(
    shared.compressedBytes <= SHARED_COMPRESSED_BUDGET,
    `shared pack is ${shared.compressedBytes} bytes`,
  );
});

test("decoded textures leave room for three live gallery photos", () => {
  const shared = getBeachPhotorealAssetEstimate("shared");
  // Three 1024x1024 RGBA photos with mips, the worst case the lab ever holds.
  const galleryBytes = 3 * Math.ceil(1_024 * 1_024 * 4 * 4 / 3);

  assert.ok(
    shared.decodedRgbaMipBytes + galleryBytes <= DECODED_TEXTURE_CEILING,
    `decoded total ${shared.decodedRgbaMipBytes + galleryBytes} exceeds the 64MB ceiling`,
  );
});

test("asset ids are unique", () => {
  const ids = BEACH_PHOTOREAL_ASSETS.map((asset) => asset.id);
  assert.equal(new Set(ids).size, ids.length);
});

test("only entry assets block world readiness", () => {
  for (const asset of BEACH_PHOTOREAL_ASSETS) {
    assert.equal(asset.blocking, asset.group === "entry", `${asset.id} blocking mismatch`);
  }
});

// The eight tests above are the brief's spec, verbatim. Mutation testing found
// four defect classes they all survive, so the rest of this file closes them:
// wrong declared dimensions, a dropped asset, a broken decoded-bytes formula,
// and a "shared" estimate that silently returns only the entry pack.

const EXPECTED_ASSET_IDS = [
  "sandColor",
  "sandNormal",
  "sandArm",
  "waterNormal",
  "sky",
  "pierPlanksColor",
  "pierPlanksNormal",
  "pierPlanksArm",
  "frame01Color",
  "frame01Normal",
  "frame01Arm",
  "frame02Color",
  "frame02Normal",
  "frame02Arm",
] as const;

test("the manifest declares exactly the expected asset roster", () => {
  assert.deepEqual(
    BEACH_PHOTOREAL_ASSETS.map((asset) => asset.id),
    [...EXPECTED_ASSET_IDS],
  );
});

test("declared dimensions match the pixels on disk", async () => {
  for (const asset of BEACH_PHOTOREAL_ASSETS) {
    if (!asset.src.endsWith(".webp")) continue;

    const { height, width } = await sharp(
      path.join(PUBLIC_ROOT, asset.src),
    ).metadata();

    assert.equal(width, asset.width, `${asset.id} width drifted from disk`);
    assert.equal(height, asset.height, `${asset.id} height drifted from disk`);
  }
});

test("the radiance sky declares the dimensions in its own header", () => {
  const sky = BEACH_PHOTOREAL_ASSETS.find((asset) => asset.id === "sky");
  assert.ok(sky, "sky asset missing from the manifest");

  // The HDRI is copied byte-for-byte and never passes through Sharp, so its
  // resolution line is the only on-disk record of its size.
  const header = readFileSync(path.join(PUBLIC_ROOT, sky.src))
    .subarray(0, 256)
    .toString("latin1");
  const resolution = /-Y (\d+) \+X (\d+)/.exec(header);
  assert.ok(resolution, "sky.hdr has no readable resolution line");

  assert.equal(Number(resolution[2]), sky.width);
  assert.equal(Number(resolution[1]), sky.height);
});

test("decoded bytes are the full RGBA mip pyramid, not the base level", () => {
  const shared = getBeachPhotorealAssetEstimate("shared");
  const expected = shared.assets.reduce(
    (total, asset) => total + Math.ceil(asset.width * asset.height * 4 * 4 / 3),
    0,
  );

  assert.equal(shared.decodedRgbaMipBytes, expected);
  // A 1024x1024 RGBA texture is 4MB at the base level and 5.6MB with mips;
  // dropping the 4/3 factor or flooring it would understate the budget.
  assert.equal(Math.ceil(1_024 * 1_024 * 4 * 4 / 3), 5_592_406);
});

test("the shared estimate covers every asset and entry covers only the entry pack", () => {
  const entry = getBeachPhotorealAssetEstimate("entry");
  const shared = getBeachPhotorealAssetEstimate("shared");

  assert.equal(shared.assets.length, BEACH_PHOTOREAL_ASSETS.length);
  assert.deepEqual(
    shared.assets.map((asset) => asset.id),
    BEACH_PHOTOREAL_ASSETS.map((asset) => asset.id),
  );
  assert.deepEqual(
    entry.assets.map((asset) => asset.id),
    BEACH_PHOTOREAL_ASSETS.filter((asset) => asset.group === "entry").map(
      (asset) => asset.id,
    ),
  );
  assert.ok(
    shared.assets.length > entry.assets.length,
    "shared must be a strict superset of entry",
  );
  assert.ok(shared.compressedBytes > entry.compressedBytes);
  assert.ok(shared.decodedRgbaMipBytes > entry.decodedRgbaMipBytes);
});

test("the estimate totals are the measured pack sizes", () => {
  const entry = getBeachPhotorealAssetEstimate("entry");
  const shared = getBeachPhotorealAssetEstimate("shared");

  assert.equal(entry.assets.length, 5);
  assert.equal(entry.compressedBytes, 2_508_356);
  assert.equal(entry.decodedRgbaMipBytes, 20_971_523);
  assert.equal(shared.compressedBytes, 3_325_754);
  assert.equal(shared.decodedRgbaMipBytes, 46_137_353);
});

test("every asset points at a distinct file inside the beach photoreal pack", () => {
  const sources = BEACH_PHOTOREAL_ASSETS.map((asset) => asset.src);
  assert.equal(new Set(sources).size, sources.length);

  for (const asset of BEACH_PHOTOREAL_ASSETS) {
    assert.ok(
      asset.src.startsWith("/chungdoi/labs/beach-wedding-journey/photoreal/"),
      `${asset.id} escapes the pack directory`,
    );
    assert.ok(!asset.src.includes("://"), `${asset.id} is not a local path`);
    assert.ok(asset.width > 0 && asset.height > 0);
  }
});

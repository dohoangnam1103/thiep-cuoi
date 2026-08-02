import assert from "node:assert/strict";
import { existsSync, statSync } from "node:fs";
import { resolve } from "node:path";
import test from "node:test";

import sharp from "sharp";

import {
  FOREST_PHOTOREAL_ASSETS,
  getForestPhotorealAssetEstimate,
} from "./forest-asset-manifest";

const REQUIRED_ASSET_IDS = [
  "groundColor",
  "groundNormal",
  "groundArm",
  "coniferColor",
  "coniferNormal",
  "coniferArm",
  "backdrop",
  "wildlife",
] as const;
const PHOTOREAL_PUBLIC_PREFIX =
  "/chungdoi/labs/forest-wedding-journey/photoreal/";

function getPublicAssetPath(src: string) {
  return resolve(process.cwd(), "public", src.slice(1));
}

test("photoreal asset manifest contains the complete local pack", () => {
  assert.deepEqual(
    FOREST_PHOTOREAL_ASSETS.map(({ id }) => id).sort(),
    [...REQUIRED_ASSET_IDS].sort(),
  );

  for (const asset of FOREST_PHOTOREAL_ASSETS) {
    assert.ok(asset.src.startsWith(PHOTOREAL_PUBLIC_PREFIX));
    assert.ok(!asset.src.includes("://"));
    assert.ok(asset.width > 0);
    assert.ok(asset.height > 0);
  }
});

test("every blocking photoreal asset exists in the public tree", () => {
  const blockingAssets = FOREST_PHOTOREAL_ASSETS.filter(
    ({ blocking }) => blocking,
  );
  assert.ok(blockingAssets.length > 0);

  for (const asset of blockingAssets) {
    assert.ok(
      existsSync(getPublicAssetPath(asset.src)),
      `Missing blocking asset: ${asset.src}`,
    );
  }
});

test("photoreal entry and shared packs stay inside delivery and decode budgets", () => {
  const entryEstimate = getForestPhotorealAssetEstimate("entry");
  const sharedEstimate = getForestPhotorealAssetEstimate("shared");
  const actualEntryBytes = entryEstimate.assets.reduce(
    (total, asset) => total + statSync(getPublicAssetPath(asset.src)).size,
    0,
  );
  const actualSharedBytes = sharedEstimate.assets.reduce(
    (total, asset) => total + statSync(getPublicAssetPath(asset.src)).size,
    0,
  );

  assert.equal(entryEstimate.compressedBytes, actualEntryBytes);
  assert.equal(sharedEstimate.compressedBytes, actualSharedBytes);
  assert.ok(entryEstimate.compressedBytes <= 4_000_000);
  assert.ok(sharedEstimate.compressedBytes <= 12_000_000);
  assert.ok(entryEstimate.decodedRgbaMipBytes <= 18_175_312);
});

test("photoreal ground color is a lush green surface instead of dry beige litter", async () => {
  const groundColor = FOREST_PHOTOREAL_ASSETS.find(
    ({ id }) => id === "groundColor",
  );
  assert.ok(groundColor);
  const { data, info } = await sharp(getPublicAssetPath(groundColor.src))
    .resize(64, 64)
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  let red = 0;
  let green = 0;

  for (let offset = 0; offset < data.length; offset += info.channels) {
    red += data[offset];
    green += data[offset + 1];
  }

  assert.ok(green > red * 1.05, "ground albedo must be visibly green");
});

test("conifer color uses four padded alpha branch cards beside opaque bark", async () => {
  const coniferColor = FOREST_PHOTOREAL_ASSETS.find(
    ({ id }) => id === "coniferColor",
  );
  assert.ok(coniferColor);
  const { data, info } = await sharp(getPublicAssetPath(coniferColor.src))
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const alphaAt = (x: number, y: number) =>
    data[(y * info.width + x) * info.channels + 3];

  for (let cellY = 0; cellY < 2; cellY += 1) {
    for (let cellX = 0; cellX < 2; cellX += 1) {
      const left = cellX * 256;
      const top = cellY * 256;
      let subjectPixels = 0;
      let gutterPixels = 0;
      let transparentGutterPixels = 0;

      for (let y = top; y < top + 256; y += 1) {
        for (let x = left; x < left + 256; x += 1) {
          const alpha = alphaAt(x, y);
          if (alpha >= 128) subjectPixels += 1;
          const inGutter =
            x < left + 8 || x >= left + 248 ||
            y < top + 8 || y >= top + 248;
          if (inGutter) {
            gutterPixels += 1;
            if (alpha <= 8) transparentGutterPixels += 1;
          }
        }
      }

      assert.ok(subjectPixels >= 2_500, `branch cell ${cellX},${cellY} is empty`);
      assert.ok(
        transparentGutterPixels / gutterPixels >= 0.98,
        `branch cell ${cellX},${cellY} must have a transparent gutter`,
      );
    }
  }

  let opaqueBarkPixels = 0;
  const barkPixels = 512 * 512;
  for (let y = 0; y < 512; y += 1) {
    for (let x = 512; x < 1024; x += 1) {
      if (alphaAt(x, y) >= 250) opaqueBarkPixels += 1;
    }
  }
  assert.ok(opaqueBarkPixels / barkPixels >= 0.99);
});

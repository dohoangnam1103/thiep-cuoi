import assert from "node:assert/strict";
import { existsSync, readFileSync, statSync } from "node:fs";
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
  let antialiasedSubjectPixels = 0;

  for (let cellY = 0; cellY < 2; cellY += 1) {
    for (let cellX = 0; cellX < 2; cellX += 1) {
      const left = cellX * 256;
      const top = cellY * 256;
      let subjectPixels = 0;
      let maximumGutterAlpha = 0;
      let subjectLeft = 256;
      let subjectTop = 256;
      let subjectRight = -1;
      let subjectBottom = -1;

      for (let y = top; y < top + 256; y += 1) {
        for (let x = left; x < left + 256; x += 1) {
          const alpha = alphaAt(x, y);
          if (alpha >= 128) subjectPixels += 1;
          const inGutter =
            x < left + 8 || x >= left + 248 ||
            y < top + 8 || y >= top + 248;
          if (!inGutter && alpha > 0 && alpha <= 8) {
            antialiasedSubjectPixels += 1;
          }
          if (inGutter) {
            maximumGutterAlpha = Math.max(maximumGutterAlpha, alpha);
            continue;
          }
          if (alpha === 0) continue;
          subjectLeft = Math.min(subjectLeft, x - left);
          subjectTop = Math.min(subjectTop, y - top);
          subjectRight = Math.max(subjectRight, x - left);
          subjectBottom = Math.max(subjectBottom, y - top);
        }
      }

      assert.ok(subjectPixels >= 2_500, `branch cell ${cellX},${cellY} is empty`);
      assert.equal(
        maximumGutterAlpha,
        0,
        `branch cell ${cellX},${cellY} gutter alpha is ${maximumGutterAlpha}`,
      );

      // A branch card maps one whole cell onto its quads, so transparent margin
      // inside the cell becomes a gap between the card's edge and the needles.
      // A letterboxed cell — cell 0,0 once filled only 53% of its height — draws
      // a canopy clump hovering over a bare trunk, which is what users reported
      // as trees rendering only their lower trunk.
      const usableCellSize = 256 - 8 * 2;
      const fillX = (subjectRight - subjectLeft + 1) / usableCellSize;
      const fillY = (subjectBottom - subjectTop + 1) / usableCellSize;
      assert.ok(
        fillX >= 0.9 && fillY >= 0.9,
        `branch cell ${cellX},${cellY} fills only ${(fillX * 100).toFixed(0)}% x ${(fillY * 100).toFixed(0)}% of its usable box`,
      );
    }
  }
  assert.ok(
    antialiasedSubjectPixels > 0,
    "branch cards must preserve low-alpha antialias coverage outside gutters",
  );

  let opaqueBarkPixels = 0;
  const barkPixels = 512 * 512;
  for (let y = 0; y < 512; y += 1) {
    for (let x = 512; x < 1024; x += 1) {
      if (alphaAt(x, y) >= 250) opaqueBarkPixels += 1;
    }
  }
  assert.ok(opaqueBarkPixels / barkPixels >= 0.99);
});

test("preparation scopes the alpha threshold to source subject bounds", () => {
  const preparationScript = readFileSync(
    resolve(process.cwd(), "scripts/prepare-forest-photoreal-assets.mjs"),
    "utf8",
  );
  const boundsStart = preparationScript.indexOf(
    "function getBranchCellBounds",
  );
  const boundsEnd = preparationScript.indexOf(
    "async function createBranchColor",
    boundsStart,
  );
  assert.ok(boundsStart >= 0 && boundsEnd > boundsStart);
  const boundsSection = preparationScript.slice(boundsStart, boundsEnd);
  const outsideBounds =
    preparationScript.slice(0, boundsStart) + preparationScript.slice(boundsEnd);

  assert.match(boundsSection, /BRANCH_SUBJECT_ALPHA_THRESHOLD/);
  assert.doesNotMatch(outsideBounds, /BRANCH_SUBJECT_ALPHA_THRESHOLD/);
});

test("preparation rejects every nonzero decoded conifer gutter alpha", () => {
  const preparationScript = readFileSync(
    resolve(process.cwd(), "scripts/prepare-forest-photoreal-assets.mjs"),
    "utf8",
  );
  const validationStart = preparationScript.indexOf("const decodedConifer");
  const validationEnd = preparationScript.indexOf(
    "const entryAssets",
    validationStart,
  );
  assert.ok(validationStart >= 0 && validationEnd > validationStart);
  const validationSection = preparationScript.slice(
    validationStart,
    validationEnd,
  );

  assert.match(validationSection, /if \(alpha !== 0\) \{/);
  assert.doesNotMatch(validationSection, /BRANCH_SUBJECT_ALPHA_THRESHOLD/);
});

test("preparation fills each branch cell instead of letterboxing it", () => {
  // `fit: "inside"` preserved the source subject's aspect ratio, so the wide
  // spray in cell 0,0 reached only 53% of its cell height. The runtime shows one
  // whole cell per branch card, so that margin drew a canopy clump floating over
  // a bare trunk. Both the resize mode and the output gate are asserted: either
  // alone can be regressed without the other noticing.
  const preparationScript = readFileSync(
    resolve(process.cwd(), "scripts/prepare-forest-photoreal-assets.mjs"),
    "utf8",
  );
  const branchColorStart = preparationScript.indexOf(
    "async function createBranchColor",
  );
  const branchColorEnd = preparationScript.indexOf(
    "async function encodeConiferColor",
    branchColorStart,
  );
  assert.ok(branchColorStart >= 0 && branchColorEnd > branchColorStart);
  const branchColorSection = preparationScript.slice(
    branchColorStart,
    branchColorEnd,
  );

  assert.match(branchColorSection, /fit: "fill"/);
  assert.doesNotMatch(branchColorSection, /fit: "inside"/);
  assert.match(branchColorSection, /BRANCH_MAX_SUBJECT_SQUASH/);
  assert.match(preparationScript, /BRANCH_MIN_CELL_FILL = 0\.9/);

  const validationStart = preparationScript.indexOf("const decodedConifer");
  const validationEnd = preparationScript.indexOf(
    "const entryAssets",
    validationStart,
  );
  const validationSection = preparationScript.slice(
    validationStart,
    validationEnd,
  );
  assert.match(validationSection, /BRANCH_MIN_CELL_FILL/);
});

test("the backdrop carries baked aerial perspective instead of a black treeline", async () => {
  // The backdrop cylinder stands at radius 96 with the scene fog ending at 76,
  // and its material opts out of fog, so nothing at runtime supplies aerial
  // perspective. The material also tints the map by 0x9fb894 and the renderer
  // tone-maps with ACES at exposure 1.08 — a chain that crushes anything below
  // roughly sRGB 20 to pure black. Before the haze was baked in, 42% of this
  // panorama's texels sat there and punched a black void above the treeline.
  const backdrop = FOREST_PHOTOREAL_ASSETS.find(({ id }) => id === "backdrop");
  assert.ok(backdrop);
  const { data, info } = await sharp(getPublicAssetPath(backdrop.src))
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  let darkest = Number.POSITIVE_INFINITY;
  for (let offset = 0; offset < data.length; offset += info.channels) {
    const luminance =
      data[offset] * 0.2126 +
      data[offset + 1] * 0.7152 +
      data[offset + 2] * 0.0722;
    if (luminance < darkest) darkest = luminance;
  }

  assert.ok(
    darkest >= 24,
    `backdrop holds a texel at luminance ${darkest.toFixed(1)}; the tint and ACES curve crush anything darker to black`,
  );
});

test("the baked haze matches the atmosphere colour the scene fog resolves to", () => {
  // `bakeAerialPerspective` blends toward the haze at asset time while the fog
  // and backdrop tint read it at runtime; the two must not drift apart.
  const preparationScript = readFileSync(
    resolve(process.cwd(), "scripts/prepare-forest-photoreal-assets.mjs"),
    "utf8",
  );
  const lighting = readFileSync(
    resolve(
      process.cwd(),
      "src/components/forest-wedding-journey/photoreal/forest-lighting.tsx",
    ),
    "utf8",
  );

  const atmosphereColor = /color:\s*"#([0-9a-f]{6})"/.exec(lighting)?.[1];
  assert.ok(atmosphereColor, "forest-lighting must declare an atmosphere colour");

  const bakedChannels = /BACKDROP_HAZE_SRGB = Object\.freeze\(\[([^\]]+)\]\)/
    .exec(preparationScript)?.[1];
  assert.ok(bakedChannels, "preparation must declare the baked haze colour");
  const bakedHex = [...bakedChannels.matchAll(/0x([0-9a-f]{2})/g)]
    .map(([, channel]) => channel)
    .join("");

  assert.equal(bakedHex, atmosphereColor);
});

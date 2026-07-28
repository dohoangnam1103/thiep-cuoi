import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

export const PAIRED_ENVELOPE_SOURCE_ASSETS = {
  "boho-floral-green": "boho_floral_green.webp",
  "boho-floral-pink": "boho_floral_pink.webp",
  "boho-floral-brown": "boho_floral_brown.webp",
  "spring-garden-green": "spring_garden_green.webp",
  "spring-garden-blue": "spring_garden_blue.webp",
  "elegant-leaf-green": "elegant_leaf_green.webp",
  "jasmine-white": "jasmine_white.webp",
  "silk-flora-brown": "silk_flora_brown.webp",
  "hoa-tinh-red": "hoa_tinh_red.webp",
  "minimalism-red": "minimalism_red.webp",
  "crystal-floral-blue": "crystal_floral_blue.webp",
  "chibi-red": "chibi_red.webp",
  "double-dragon-red": "double_dragon_red.webp",
  "double-dragon-blue": "double_dragon_blue.webp",
  "double-dragon-green": "double_dragon_green.webp",
  "dragon-phoenix-v3-red": "dragon_phoenix_v3.webp",
  "qasr-green": "qasr_green.webp",
  "qasr-gold": "qasr_gold.webp",
} as const;

export const REQUIRED_GIFTBOX_MINI_ASSETS = [
  "spring_garden_green.webp",
  "dragon_phoenix_v2.webp",
  "chateau_blue.webp",
  "glass_garden_green.webp",
  "jasmine_white.webp",
  "double_phoenix_red.webp",
  "chateau_green.webp",
] as const;

const giftboxDirectory = join(process.cwd(), "public", "chungdoi", "images", "giftbox");
const auditPath = join(process.cwd(), "docs", "research", "GIFT_VISUAL_SOURCE_AUDIT.md");

function assertWebp(path: string): void {
  const signature = readFileSync(path).subarray(0, 12);

  assert.deepEqual(signature.subarray(0, 4), Buffer.from("RIFF"), `${path} is missing a RIFF signature`);
  assert.deepEqual(signature.subarray(8, 12), Buffer.from("WEBP"), `${path} is missing a WebP signature`);
}

test("every audited source gift asset is stored locally", () => {
  const audit = readFileSync(auditPath, "utf8");
  const pairedAssets = Object.entries(PAIRED_ENVELOPE_SOURCE_ASSETS);

  assert.equal(pairedAssets.length, 18, "the paired envelope contract must contain exactly 18 mappings");
  assert.equal(REQUIRED_GIFTBOX_MINI_ASSETS.length, 7, "the mini asset contract must contain exactly 7 filenames");

  for (const [slug, sourceFilename] of pairedAssets) {
    const localPath = join(giftboxDirectory, slug, "envelope.webp");
    assert.ok(
      existsSync(localPath),
      `missing local paired envelope for ${slug}`,
    );
    assertWebp(localPath);
    assert.match(
      audit,
      new RegExp(`\\| ${slug} \\|[^\\n]*\\| /images/envelope/${sourceFilename.replace(".", "\\.")} \\|`),
      `audit source path does not match the ${slug} mapping`,
    );
  }

  for (const asset of REQUIRED_GIFTBOX_MINI_ASSETS) {
    const localPath = join(giftboxDirectory, "mini", asset);
    assert.ok(
      existsSync(localPath),
      `missing local giftbox mini asset ${asset}`,
    );
    assertWebp(localPath);
    assert.match(
      audit,
      new RegExp(`/images/giftbox/mini/${asset.replace(".", "\\.")}`),
      `audit is missing mini asset ${asset}`,
    );
  }

  const cherryPath = join(process.cwd(), "public", "chungdoi", "images", "envelope", "cherry_blossom_pink.webp");
  assert.ok(
    existsSync(cherryPath),
    "missing local cherry blossom envelope asset",
  );
  assertWebp(cherryPath);
});

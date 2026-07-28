import assert from "node:assert/strict";
import { existsSync } from "node:fs";
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

test("every audited source gift asset is stored locally", () => {
  for (const slug of Object.keys(PAIRED_ENVELOPE_SOURCE_ASSETS)) {
    assert.ok(
      existsSync(join(giftboxDirectory, slug, "envelope.webp")),
      `missing local paired envelope for ${slug}`,
    );
  }

  for (const asset of REQUIRED_GIFTBOX_MINI_ASSETS) {
    assert.ok(
      existsSync(join(giftboxDirectory, "mini", asset)),
      `missing local giftbox mini asset ${asset}`,
    );
  }

  assert.ok(
    existsSync(join(process.cwd(), "public", "chungdoi", "images", "envelope", "cherry_blossom_pink.webp")),
    "missing local cherry blossom envelope asset",
  );
});

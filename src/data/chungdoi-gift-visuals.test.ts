import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";
import {
  CLONED_GIFT_VISUAL_SLUGS,
  resolveGiftVisual,
} from "./chungdoi-gift-visuals";

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
const registryPath = join(process.cwd(), "src", "data", "chungdoi-gift-visuals.ts");

function assertWebp(path: string): void {
  const signature = readFileSync(path).subarray(0, 12);

  assert.deepEqual(signature.subarray(0, 4), Buffer.from("RIFF"), `${path} is missing a RIFF signature`);
  assert.deepEqual(signature.subarray(8, 12), Buffer.from("WEBP"), `${path} is missing a WebP signature`);
}

test("gift visual registry exports its public contract", () => {
  assert.ok(existsSync(registryPath), "missing gift visual registry");

  const source = readFileSync(registryPath, "utf8");

  assert.match(source, /export type GiftVisual\b/);
  assert.match(source, /export const CLONED_GIFT_VISUAL_SLUGS\b/);
  assert.match(source, /export function resolveGiftVisual\b/);
});

test("cloned gift visual slugs exactly cover audited envelopes and gift boxes", () => {
  const expectedSlugs = [
    ...Object.keys(PAIRED_ENVELOPE_SOURCE_ASSETS),
    "cherry-blossom-pink",
    "chateau-green",
    "glass-garden-green",
  ];

  assert.deepEqual(CLONED_GIFT_VISUAL_SLUGS, expectedSlugs);

  for (const slug of expectedSlugs) {
    assert.notEqual(resolveGiftVisual(slug).kind, "procedural", `${slug} must use a cloned gift visual`);
  }
});

test("double dragon green uses the paired layered envelope contract", () => {
  const envelopePath = "/chungdoi/images/giftbox/double-dragon-green/envelope.webp";

  assert.deepEqual(resolveGiftVisual("double-dragon-green"), {
    kind: "layered-image",
    layers: [
      {
        role: "back",
        src: envelopePath,
        className: "ienv-back absolute inset-0 z-[1] h-full w-full origin-bottom object-contain object-bottom [filter:drop-shadow(0_8px_14px_rgba(0,0,0,0.18))] [transform:translateX(20%)_translateY(-10%)_scale(-0.8,0.8)_rotate(-15deg)]",
        required: true,
      },
      {
        role: "front",
        src: envelopePath,
        className: "ienv-card absolute inset-0 z-[2] h-full w-full object-contain object-bottom -rotate-[10deg] [filter:drop-shadow(0_10px_18px_rgba(0,0,0,0.22))]",
        required: true,
      },
    ],
    wrapperClassName: "bg-[url('/images/double-dragon.webp')] bg-[length:clamp(300px,50vw,500px)] bg-center",
  });
});

test("cherry blossom pink uses two ordered layers from its source envelope", () => {
  const visual = resolveGiftVisual("cherry-blossom-pink");

  assert.equal(visual.kind, "layered-image");
  if (visual.kind !== "layered-image") return;

  assert.deepEqual(visual.layers.map((layer) => layer.role), ["back", "front"]);
  assert.deepEqual(
    visual.layers.map((layer) => layer.src),
    [
      "/chungdoi/images/envelope/cherry_blossom_pink.webp",
      "/chungdoi/images/envelope/cherry_blossom_pink.webp",
    ],
  );
});

test("templates without cloned assets remain procedural", () => {
  assert.deepEqual(resolveGiftVisual("arch-sage"), { kind: "procedural" });
  assert.deepEqual(resolveGiftVisual("zen-sand"), { kind: "procedural" });
});

test("chateau green gift box preserves its decoration order", () => {
  assert.deepEqual(resolveGiftVisual("chateau-green"), {
    kind: "giftbox",
    boxImage: "/chungdoi/images/giftbox/chateau_green.webp",
    decorImages: [
      "/chungdoi/images/giftbox/mini/spring_garden_red.webp",
      "/chungdoi/images/giftbox/mini/spring_garden_green.webp",
      "/chungdoi/images/giftbox/mini/dragon_phoenix_v2.webp",
      "/chungdoi/images/giftbox/mini/saraya_gold.webp",
      "/chungdoi/images/giftbox/mini/qasr_gold.webp",
      "/chungdoi/images/giftbox/mini/chateau_blue.webp",
      "/chungdoi/images/giftbox/mini/glass_garden_green.webp",
    ],
  });
});

test("glass garden green gift box preserves its decoration order", () => {
  assert.deepEqual(resolveGiftVisual("glass-garden-green"), {
    kind: "giftbox",
    boxImage: "/chungdoi/images/giftbox/glass_garden_green.webp",
    decorImages: [
      "/chungdoi/images/giftbox/mini/boho_floral_pink.webp",
      "/chungdoi/images/giftbox/mini/saraya_gold.webp",
      "/chungdoi/images/giftbox/mini/jasmine_white.webp",
      "/chungdoi/images/giftbox/mini/double_phoenix_red.webp",
      "/chungdoi/images/giftbox/mini/baroque_gold.webp",
      "/chungdoi/images/giftbox/mini/chateau_green.webp",
      "/chungdoi/images/giftbox/mini/brocade_flower_red.webp",
    ],
  });
});

test("every cloned gift visual references valid public WebP assets", () => {
  for (const slug of CLONED_GIFT_VISUAL_SLUGS) {
    const visual = resolveGiftVisual(slug);
    const assetPaths = visual.kind === "layered-image"
      ? visual.layers.map((layer) => layer.src)
      : visual.kind === "giftbox"
        ? [visual.boxImage, ...visual.decorImages]
        : [];

    assert.notEqual(visual.kind, "procedural", `${slug} must resolve to a cloned visual`);
    assert.ok(assetPaths.length > 0, `${slug} must reference at least one asset`);

    for (const assetPath of assetPaths) {
      assert.ok(assetPath.startsWith("/"), `${slug} asset must use a public-root path: ${assetPath}`);

      const localPath = join(process.cwd(), "public", assetPath.slice(1));

      assert.ok(existsSync(localPath), `${slug} references missing asset ${assetPath}`);
      assertWebp(localPath);
    }
  }
});

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

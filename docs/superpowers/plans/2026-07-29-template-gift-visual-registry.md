# Template Gift Visual Registry Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the accidental generic red gift envelope on cloned Chung Đôi templates with each source template's own locally stored gift artwork while preserving the existing QR modal.

**Architecture:** A typed registry maps template slugs to either the source's paired-envelope composition, a source gift-box composition, or the procedural fallback reserved for local templates. `GiftEnvelope` resolves the registry by `content.slug`; a focused artwork component renders source layers while the existing modal and procedural fallback stay shared.

**Tech Stack:** Next.js 16 App Router, React 19 Client Components, TypeScript strict mode, Tailwind CSS v4, Node test runner via `tsx`, Playwright.

---

## File Structure

- Create `src/data/chungdoi-gift-visuals.ts` — typed visual registry, cloned-template coverage list, and resolver.
- Create `src/data/chungdoi-gift-visuals.test.ts` — registry coverage, source mapping, and local asset contract.
- Create `src/components/chungdoi-gift-envelope-artwork.tsx` — renders paired-image and gift-box artwork without owning modal state.
- Modify `src/components/chungdoi-tpl-shared.tsx` — resolve a visual by template slug, render artwork, and retain the QR modal plus procedural fallback.
- Modify the 17 `src/components/chungdoi-tpl-*.tsx` callers listed in Task 4 — pass `content.slug` and remove legacy image-variant props.
- Modify `src/app/globals.css` — add the shared paired-envelope motion and reduced-motion rules.
- Modify `tests/e2e/templates.spec.ts` — replace generic-envelope assertions with exact source-asset assertions.
- Create `docs/research/GIFT_VISUAL_SOURCE_AUDIT.md` — checked source URLs, composition family, and source assets.
- Modify `docs/research/asset-provenance.md` — record every downloaded Chung Đôi source asset.
- Add source artwork under the 18 explicit `public/chungdoi/images/giftbox/{boho-floral-green,boho-floral-pink,boho-floral-brown,spring-garden-green,spring-garden-blue,elegant-leaf-green,jasmine-white,silk-flora-brown,hoa-tinh-red,minimalism-red,crystal-floral-blue,chibi-red,double-dragon-red,double-dragon-blue,double-dragon-green,dragon-phoenix-v3-red,qasr-green,qasr-gold}/envelope.webp` paths and the missing mini assets under `public/chungdoi/images/giftbox/mini/`.

The plan follows the local Next.js 16 documentation in `node_modules/next/dist/docs/01-app/01-getting-started/12-images.md`, `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/public-folder.md`, and `node_modules/next/dist/docs/01-app/01-getting-started/05-server-and-client-components.md`: public assets use root-relative paths and the interactive envelope remains a Client Component.

### Task 1: Lock the source asset contract and acquire local assets

**Files:**
- Create: `src/data/chungdoi-gift-visuals.test.ts`
- Create: `docs/research/GIFT_VISUAL_SOURCE_AUDIT.md`
- Modify: `docs/research/asset-provenance.md`
- Add: the 18 exact `public/chungdoi/images/giftbox/{boho-floral-green,boho-floral-pink,boho-floral-brown,spring-garden-green,spring-garden-blue,elegant-leaf-green,jasmine-white,silk-flora-brown,hoa-tinh-red,minimalism-red,crystal-floral-blue,chibi-red,double-dragon-red,double-dragon-blue,double-dragon-green,dragon-phoenix-v3-red,qasr-green,qasr-gold}/envelope.webp` files
- Add: `public/chungdoi/images/giftbox/mini/{spring_garden_green,dragon_phoenix_v2,chateau_blue,glass_garden_green,jasmine_white,double_phoenix_red,chateau_green}.webp`

- [ ] **Step 1: Write the failing asset-contract test**

Create `src/data/chungdoi-gift-visuals.test.ts` with the exact required source mappings:

```ts
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import path from "node:path";
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

test("every audited source gift asset is stored locally", () => {
  for (const slug of Object.keys(PAIRED_ENVELOPE_SOURCE_ASSETS)) {
    const assetPath = path.join(
      process.cwd(),
      "public/chungdoi/images/giftbox",
      slug,
      "envelope.webp",
    );
    assert.equal(existsSync(assetPath), true, `${slug}: ${assetPath}`);
  }

  for (const filename of REQUIRED_GIFTBOX_MINI_ASSETS) {
    const assetPath = path.join(
      process.cwd(),
      "public/chungdoi/images/giftbox/mini",
      filename,
    );
    assert.equal(existsSync(assetPath), true, filename);
  }

  assert.equal(
    existsSync(
      path.join(
        process.cwd(),
        "public/chungdoi/images/envelope/cherry_blossom_pink.webp",
      ),
    ),
    true,
    "cherry-blossom-pink",
  );
});
```

- [ ] **Step 2: Run the test and verify the expected red state**

Run:

```bash
npx tsx --test src/data/chungdoi-gift-visuals.test.ts
```

Expected: FAIL first on `public/chungdoi/images/giftbox/boho-floral-green/envelope.webp`.

- [ ] **Step 3: Download the 18 paired-envelope assets**

Run this exact shell loop from the repository root:

```bash
while read -r slug source; do
  mkdir -p "public/chungdoi/images/giftbox/$slug"
  curl -fLsS "https://chungdoi.com/images/envelope/$source" \
    -o "public/chungdoi/images/giftbox/$slug/envelope.webp"
done <<'ASSETS'
boho-floral-green boho_floral_green.webp
boho-floral-pink boho_floral_pink.webp
boho-floral-brown boho_floral_brown.webp
spring-garden-green spring_garden_green.webp
spring-garden-blue spring_garden_blue.webp
elegant-leaf-green elegant_leaf_green.webp
jasmine-white jasmine_white.webp
silk-flora-brown silk_flora_brown.webp
hoa-tinh-red hoa_tinh_red.webp
minimalism-red minimalism_red.webp
crystal-floral-blue crystal_floral_blue.webp
chibi-red chibi_red.webp
double-dragon-red double_dragon_red.webp
double-dragon-blue double_dragon_blue.webp
double-dragon-green double_dragon_green.webp
dragon-phoenix-v3-red dragon_phoenix_v3.webp
qasr-green qasr_green.webp
qasr-gold qasr_gold.webp
ASSETS
```

Expected: every command exits zero and every output is a WebP file.

- [ ] **Step 4: Download the seven missing gift-box mini assets**

Run:

```bash
for asset in spring_garden_green dragon_phoenix_v2 chateau_blue glass_garden_green jasmine_white double_phoenix_red chateau_green; do
  curl -fLsS "https://chungdoi.com/images/giftbox/mini/${asset}.webp" \
    -o "public/chungdoi/images/giftbox/mini/${asset}.webp"
done
```

Expected: seven new WebP files with non-zero sizes.

- [ ] **Step 5: Record the completed audit and provenance**

Create `docs/research/GIFT_VISUAL_SOURCE_AUDIT.md` with a table containing these 21 explicit entries:

```markdown
# Gift Visual Source Audit

| Template slug | Source demo | Composition | Source artwork |
| --- | --- | --- | --- |
| boho-floral-green | https://chungdoi.com/vi/mau-thiep/hoa-moc-xanh/demo | Paired envelope | `/images/envelope/boho_floral_green.webp` |
| boho-floral-pink | https://chungdoi.com/vi/mau-thiep/hoa-moc-hong/demo | Paired envelope | `/images/envelope/boho_floral_pink.webp` |
| boho-floral-brown | https://chungdoi.com/vi/mau-thiep/hoa-moc-nau/demo | Paired envelope | `/images/envelope/boho_floral_brown.webp` |
| spring-garden-green | https://chungdoi.com/vi/mau-thiep/vuon-xuan-xanh/demo | Paired envelope | `/images/envelope/spring_garden_green.webp` |
| spring-garden-blue | https://chungdoi.com/vi/mau-thiep/vuon-xuan-lam/demo | Paired envelope | `/images/envelope/spring_garden_blue.webp` |
| elegant-leaf-green | https://chungdoi.com/vi/mau-thiep/thanh-diep-xanh/demo | Paired envelope | `/images/envelope/elegant_leaf_green.webp` |
| jasmine-white | https://chungdoi.com/vi/mau-thiep/mai-lan-trang/demo | Paired envelope asset; demo bank data is empty | `/images/envelope/jasmine_white.webp` |
| silk-flora-brown | https://chungdoi.com/vi/mau-thiep/hoa-lua-nau/demo | Paired envelope asset; demo bank data is empty | `/images/envelope/silk_flora_brown.webp` |
| hoa-tinh-red | https://chungdoi.com/vi/mau-thiep/hoa-tinh-do/demo | Paired envelope | `/images/envelope/hoa_tinh_red.webp` |
| minimalism-red | https://chungdoi.com/vi/mau-thiep/minimalism-do/demo | Paired envelope | `/images/envelope/minimalism_red.webp` |
| crystal-floral-blue | https://chungdoi.com/vi/mau-thiep/hoa-thuy-tinh-lam/demo | Paired envelope | `/images/envelope/crystal_floral_blue.webp` |
| chibi-red | https://chungdoi.com/vi/mau-thiep/chibi-red/demo | Paired envelope | `/images/envelope/chibi_red.webp` |
| double-dragon-red | https://chungdoi.com/vi/mau-thiep/song-long-do/demo | Paired envelope + dragon background | `/images/envelope/double_dragon_red.webp` |
| double-dragon-blue | https://chungdoi.com/vi/mau-thiep/song-long-lam/demo | Paired envelope asset; demo bank data is empty | `/images/envelope/double_dragon_blue.webp` |
| double-dragon-green | https://chungdoi.com/vi/mau-thiep/song-long-xanh/demo | Paired envelope + dragon background | `/images/envelope/double_dragon_green.webp` |
| dragon-phoenix-v3-red | https://chungdoi.com/vi/mau-thiep/long-phung-v3-do/demo | Paired envelope | `/images/envelope/dragon_phoenix_v3.webp` |
| qasr-green | https://chungdoi.com/vi/mau-thiep/thanhcung-xanh/demo | Paired envelope | `/images/envelope/qasr_green.webp` |
| qasr-gold | https://chungdoi.com/vi/mau-thiep/thanhcung-vang/demo | Paired envelope | `/images/envelope/qasr_gold.webp` |
| cherry-blossom-pink | https://chungdoi.com/vi/mau-thiep/anh-dao-hong/demo | Paired envelope | `/images/envelope/cherry_blossom_pink.webp` |
| chateau-green | https://chungdoi.com/vi/mau-thiep/lau-dai-xanh/demo | Gift box + seven mini layers | `/images/giftbox/chateau_green.webp` |
| glass-garden-green | https://chungdoi.com/vi/mau-thiep/vuonkinh-xanh/demo | Gift box + seven mini layers | `/images/giftbox/glass_garden_green.webp` |
```

Change the opening sentence of `docs/research/asset-provenance.md` from `All artwork in this document...` to `The generated template artwork in the first section of this document...`, then append:

```markdown
## Chung Đôi source gift visuals

The gift visuals listed in [GIFT_VISUAL_SOURCE_AUDIT.md](./GIFT_VISUAL_SOURCE_AUDIT.md) were downloaded unchanged from their documented `https://chungdoi.com/images/envelope/` and `https://chungdoi.com/images/giftbox/` source URLs on 2026-07-29. They are stored locally solely for source-parity reconstruction; the application does not hotlink them at runtime.
```

- [ ] **Step 6: Verify the asset test passes**

Run:

```bash
npx tsx --test src/data/chungdoi-gift-visuals.test.ts
file public/chungdoi/images/giftbox/*/envelope.webp public/chungdoi/images/giftbox/mini/*.webp
```

Expected: PASS and every new binary reports `Web/P image`.

- [ ] **Step 7: Commit the source audit and assets**

```bash
git add src/data/chungdoi-gift-visuals.test.ts docs/research/GIFT_VISUAL_SOURCE_AUDIT.md docs/research/asset-provenance.md public/chungdoi/images/giftbox
git commit -m "assets: add source-specific gift visuals"
```

### Task 2: Build the typed registry with cloned-template coverage

**Files:**
- Create: `src/data/chungdoi-gift-visuals.ts`
- Modify: `src/data/chungdoi-gift-visuals.test.ts`

- [ ] **Step 1: Add a failing registry-source contract**

Add this test before importing the not-yet-created module:

```ts
import { readFileSync } from "node:fs";

test("gift visual registry exposes the required public API", () => {
  const registryPath = path.join(
    process.cwd(),
    "src/data/chungdoi-gift-visuals.ts",
  );
  assert.equal(existsSync(registryPath), true, registryPath);
  const source = readFileSync(registryPath, "utf8");
  assert.match(source, /export type GiftVisual/);
  assert.match(source, /export const CLONED_GIFT_VISUAL_SLUGS/);
  assert.match(source, /export function resolveGiftVisual/);
});
```

- [ ] **Step 2: Run the focused test and verify it fails**

```bash
npx tsx --test src/data/chungdoi-gift-visuals.test.ts
```

Expected: FAIL because `src/data/chungdoi-gift-visuals.ts` does not exist.

- [ ] **Step 3: Create the minimal typed API skeleton**

Create `src/data/chungdoi-gift-visuals.ts`:

```ts
export type GiftVisual = { kind: "procedural" };

export const CLONED_GIFT_VISUAL_SLUGS = [] as const;

export function resolveGiftVisual(): GiftVisual {
  return { kind: "procedural" };
}
```

- [ ] **Step 4: Run the source-contract test and verify it passes**

```bash
npx tsx --test src/data/chungdoi-gift-visuals.test.ts
```

Expected: PASS.

- [ ] **Step 5: Add failing behavioral registry tests**

Import the desired API and add these tests:

```ts
import {
  CLONED_GIFT_VISUAL_SLUGS,
  resolveGiftVisual,
} from "@/data/chungdoi-gift-visuals";

const EXPECTED_CLONED_GIFT_SLUGS = [
  ...Object.keys(PAIRED_ENVELOPE_SOURCE_ASSETS),
  "cherry-blossom-pink",
  "chateau-green",
  "glass-garden-green",
] as const;

test("every audited clone resolves to an explicit non-procedural visual", () => {
  assert.deepEqual(
    [...CLONED_GIFT_VISUAL_SLUGS].sort(),
    [...EXPECTED_CLONED_GIFT_SLUGS].sort(),
  );

  for (const slug of EXPECTED_CLONED_GIFT_SLUGS) {
    const visual = resolveGiftVisual(slug);
    assert.notEqual(visual.kind, "procedural", slug);
  }
});

test("Song Long Xanh resolves to two ordered local image layers", () => {
  const visual = resolveGiftVisual("double-dragon-green");
  assert.equal(visual.kind, "layered-image");
  if (visual.kind !== "layered-image") return;
  assert.equal(visual.layers.length, 2);
  assert.deepEqual(visual.layers.map((layer) => layer.role), ["back", "front"]);
  assert.deepEqual(
    visual.layers.map((layer) => layer.src),
    [
      "/chungdoi/images/giftbox/double-dragon-green/envelope.webp",
      "/chungdoi/images/giftbox/double-dragon-green/envelope.webp",
    ],
  );
});

test("local-only templates retain the procedural fallback", () => {
  assert.deepEqual(resolveGiftVisual("arch-sage"), { kind: "procedural" });
  assert.deepEqual(resolveGiftVisual("zen-sand"), { kind: "procedural" });
});

test("gift-box templates keep their exact source mini layers", () => {
  const chateau = resolveGiftVisual("chateau-green");
  assert.equal(chateau.kind, "giftbox");
  if (chateau.kind !== "giftbox") return;
  assert.deepEqual(chateau.decorImages, [
    "/chungdoi/images/giftbox/mini/spring_garden_red.webp",
    "/chungdoi/images/giftbox/mini/spring_garden_green.webp",
    "/chungdoi/images/giftbox/mini/dragon_phoenix_v2.webp",
    "/chungdoi/images/giftbox/mini/saraya_gold.webp",
    "/chungdoi/images/giftbox/mini/qasr_gold.webp",
    "/chungdoi/images/giftbox/mini/chateau_blue.webp",
    "/chungdoi/images/giftbox/mini/glass_garden_green.webp",
  ]);

  const glassGarden = resolveGiftVisual("glass-garden-green");
  assert.equal(glassGarden.kind, "giftbox");
  if (glassGarden.kind !== "giftbox") return;
  assert.deepEqual(glassGarden.decorImages, [
    "/chungdoi/images/giftbox/mini/boho_floral_pink.webp",
    "/chungdoi/images/giftbox/mini/saraya_gold.webp",
    "/chungdoi/images/giftbox/mini/jasmine_white.webp",
    "/chungdoi/images/giftbox/mini/double_phoenix_red.webp",
    "/chungdoi/images/giftbox/mini/baroque_gold.webp",
    "/chungdoi/images/giftbox/mini/chateau_green.webp",
    "/chungdoi/images/giftbox/mini/brocade_flower_red.webp",
  ]);
});
```

- [ ] **Step 6: Run the behavioral tests and verify the expected red state**

```bash
npx tsx --test src/data/chungdoi-gift-visuals.test.ts
```

Expected: FAIL because the registry list is empty and every slug resolves to `procedural`.

- [ ] **Step 7: Implement the complete discriminated registry**

Replace the skeleton with these types, helpers, and exact mappings:

```ts
export type GiftVisualLayer = {
  role: "back" | "front";
  src: string;
  className: string;
  required: boolean;
};

export type LayeredImageGiftVisual = {
  kind: "layered-image";
  layers: readonly GiftVisualLayer[];
  wrapperClassName?: string;
};

export type GiftBoxVisual = {
  kind: "giftbox";
  boxImage: string;
  decorImages: readonly string[];
};

export type GiftVisual =
  | LayeredImageGiftVisual
  | GiftBoxVisual
  | { kind: "procedural" };

const PAIRED_ENVELOPE_CLASS_NAMES = {
  back: "ienv-back absolute inset-0 z-[1] h-full w-full origin-bottom object-contain object-bottom [filter:drop-shadow(0_8px_14px_rgba(0,0,0,0.18))] [transform:translateX(20%)_translateY(-10%)_scale(-0.8,0.8)_rotate(-15deg)]",
  front: "ienv-card absolute inset-0 z-[2] h-full w-full object-contain object-bottom -rotate-[10deg] [filter:drop-shadow(0_10px_18px_rgba(0,0,0,0.22))]",
} as const;

function pairedEnvelope(src: string, wrapperClassName?: string): LayeredImageGiftVisual {
  return {
    kind: "layered-image",
    wrapperClassName,
    layers: [
      { role: "back", src, className: PAIRED_ENVELOPE_CLASS_NAMES.back, required: true },
      { role: "front", src, className: PAIRED_ENVELOPE_CLASS_NAMES.front, required: true },
    ],
  };
}

const pairedEnvelopeAssets = {
  "boho-floral-green": "/chungdoi/images/giftbox/boho-floral-green/envelope.webp",
  "boho-floral-pink": "/chungdoi/images/giftbox/boho-floral-pink/envelope.webp",
  "boho-floral-brown": "/chungdoi/images/giftbox/boho-floral-brown/envelope.webp",
  "spring-garden-green": "/chungdoi/images/giftbox/spring-garden-green/envelope.webp",
  "spring-garden-blue": "/chungdoi/images/giftbox/spring-garden-blue/envelope.webp",
  "elegant-leaf-green": "/chungdoi/images/giftbox/elegant-leaf-green/envelope.webp",
  "jasmine-white": "/chungdoi/images/giftbox/jasmine-white/envelope.webp",
  "silk-flora-brown": "/chungdoi/images/giftbox/silk-flora-brown/envelope.webp",
  "hoa-tinh-red": "/chungdoi/images/giftbox/hoa-tinh-red/envelope.webp",
  "minimalism-red": "/chungdoi/images/giftbox/minimalism-red/envelope.webp",
  "crystal-floral-blue": "/chungdoi/images/giftbox/crystal-floral-blue/envelope.webp",
  "chibi-red": "/chungdoi/images/giftbox/chibi-red/envelope.webp",
  "double-dragon-red": "/chungdoi/images/giftbox/double-dragon-red/envelope.webp",
  "double-dragon-blue": "/chungdoi/images/giftbox/double-dragon-blue/envelope.webp",
  "double-dragon-green": "/chungdoi/images/giftbox/double-dragon-green/envelope.webp",
  "dragon-phoenix-v3-red": "/chungdoi/images/giftbox/dragon-phoenix-v3-red/envelope.webp",
  "qasr-green": "/chungdoi/images/giftbox/qasr-green/envelope.webp",
  "qasr-gold": "/chungdoi/images/giftbox/qasr-gold/envelope.webp",
  "cherry-blossom-pink": "/chungdoi/images/envelope/cherry_blossom_pink.webp",
} as const;

const pairedVisuals = Object.fromEntries(
  Object.entries(pairedEnvelopeAssets).map(([slug, src]) => [
    slug,
    pairedEnvelope(
      src,
      slug.startsWith("double-dragon-")
        ? "bg-[url('/images/double-dragon.webp')] bg-[length:clamp(300px,50vw,500px)] bg-center"
        : undefined,
    ),
  ]),
) as Record<keyof typeof pairedEnvelopeAssets, LayeredImageGiftVisual>;

const giftVisualRegistry = {
  ...pairedVisuals,
  "chateau-green": {
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
  },
  "glass-garden-green": {
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
  },
} as const satisfies Record<string, GiftVisual>;

export const CLONED_GIFT_VISUAL_SLUGS = Object.keys(giftVisualRegistry);

export function resolveGiftVisual(templateSlug: string): GiftVisual {
  return giftVisualRegistry[templateSlug as keyof typeof giftVisualRegistry] ?? { kind: "procedural" };
}
```

- [ ] **Step 8: Strengthen the local asset contract against registry paths**

Add a recursive asset assertion so every configured path is validated from the registry, including the existing custom visuals:

```ts
test("every registry image path is public and exists", () => {
  for (const slug of CLONED_GIFT_VISUAL_SLUGS) {
    const visual = resolveGiftVisual(slug);
    const assets = visual.kind === "layered-image"
      ? visual.layers.map((layer) => layer.src)
      : visual.kind === "giftbox"
        ? [visual.boxImage, ...visual.decorImages]
        : [];

    for (const asset of assets) {
      assert.equal(asset.startsWith("/"), true, `${slug}: ${asset}`);
      assert.equal(
        existsSync(path.join(process.cwd(), "public", asset.slice(1))),
        true,
        `${slug}: ${asset}`,
      );
    }
  }
});
```

- [ ] **Step 9: Run tests and typecheck the registry**

```bash
npx tsx --test src/data/chungdoi-gift-visuals.test.ts
npm run typecheck:tests
```

Expected: PASS.

- [ ] **Step 10: Commit the registry**

```bash
git add src/data/chungdoi-gift-visuals.ts src/data/chungdoi-gift-visuals.test.ts
git commit -m "feat: register template gift visuals"
```

### Task 3: Add the source artwork renderer and animation

**Files:**
- Create: `src/components/chungdoi-gift-envelope-artwork.tsx`
- Modify: `src/components/chungdoi-tpl-shared.tsx:523-665`
- Modify: `src/app/globals.css:1132-1195`
- Modify: `tests/e2e/templates.spec.ts:20-70, 470-545`

- [ ] **Step 1: Replace the stale Hoa Mộc Hồng E2E expectations with the desired source artwork**

In `tests/e2e/templates.spec.ts`, replace the procedural body/glow/coin assertions inside `Hoa Mộc Hồng keeps its source hero and animated footer treatment` with:

```ts
const envelope = page.getByTestId("gift-envelope");
await expect(envelope).toBeAttached();
await expect(envelope).toHaveAttribute("data-gift-visual-kind", "layered-image");
await expect(
  envelope.locator('img[src$="/boho-floral-pink/envelope.webp"]'),
).toHaveCount(2);
await expect(envelope.locator('[data-gift-layer="back"]')).toHaveCSS(
  "animation-name",
  "gift-envelope-back-float",
);
await expect(envelope.locator('[data-gift-layer="front"]')).toHaveCSS(
  "animation-name",
  "gift-envelope-front-float",
);
```

- [ ] **Step 2: Add a focused Song Long Xanh source-asset E2E test**

Add:

```ts
test("Song Long Xanh renders its two source dragon envelopes", async ({ page }) => {
  await page.goto("/mau-thiep/song-long-xanh/demo?capture=1", { timeout: 60_000 });
  const envelope = page.getByTestId("gift-envelope");
  await expect(envelope).toHaveAttribute("data-gift-visual-kind", "layered-image");
  const layers = envelope.locator(
    'img[src$="/double-dragon-green/envelope.webp"]',
  );
  await expect(layers).toHaveCount(2);
  await expect(envelope.locator('[data-gift-layer="back"]')).toHaveCount(1);
  await expect(envelope.locator('[data-gift-layer="front"]')).toHaveCount(1);
});
```

- [ ] **Step 3: Run the focused E2E tests and verify the expected red state**

```bash
npx playwright test tests/e2e/templates.spec.ts --project=chromium --grep "Hoa Mộc Hồng|Song Long Xanh renders"
```

Expected: FAIL because both templates still render the procedural envelope and do not expose source image layers.

- [ ] **Step 4: Create the non-procedural artwork component**

Create `src/components/chungdoi-gift-envelope-artwork.tsx`:

```tsx
"use client";

import type {
  GiftBoxVisual,
  LayeredImageGiftVisual,
} from "@/data/chungdoi-gift-visuals";
import { cn } from "@/lib/utils";

const GIFTBOX_DECOR_CLASSES = [
  "igb-decor-1 -left-5 top-2.5 z-[1] w-[34px] -rotate-[22deg]",
  "igb-decor-2 left-[168px] top-0.5 z-[1] w-[38px] rotate-[20deg]",
  "igb-decor-3 -left-4 top-[120px] z-[1] w-[26px] -rotate-[18deg]",
  "igb-decor-4 left-[182px] top-[114px] z-[1] w-6 rotate-[14deg]",
  "igb-decor-5 -left-2 top-[172px] z-[3] w-11 rotate-[8deg]",
  "igb-decor-6 left-[26px] top-[182px] z-[3] w-[26px] -rotate-[10deg]",
  "igb-decor-7 left-[118px] top-44 z-[3] w-10 -rotate-[14deg]",
] as const;

function Sparkles() {
  return (
    <>
      <span aria-hidden className="ienv-sparkle absolute left-[12%] top-[6%] z-20 text-[21px] text-amber-400">✦</span>
      <span aria-hidden className="ienv-sparkle-2 absolute right-[8%] top-[14%] z-20 text-[15px] text-amber-400">✦</span>
      <span aria-hidden className="ienv-sparkle-3 absolute left-[3%] top-[34%] z-20 text-[13px] text-amber-400">✦</span>
      <span aria-hidden className="ienv-sparkle-4 absolute right-[3%] top-[24%] z-20 text-[13px] text-amber-400">✦</span>
    </>
  );
}

export function LayeredGiftArtwork({ visual }: { visual: LayeredImageGiftVisual }) {
  return (
    <div
      data-gift-artwork="layered-image"
      className={cn(
        "relative flex h-full w-full items-end justify-center pb-12",
        visual.wrapperClassName,
      )}
    >
      <Sparkles />
      <div className="relative h-[275px] w-[190px]">
        <div className="ienv-shadow pointer-events-none absolute -bottom-1.5 left-1/2 z-0 h-[11px] w-[125px] -translate-x-1/2 rounded-[50%] bg-black/45 blur" />
        {visual.layers.map((layer) => (
          <img
            key={layer.role}
            src={layer.src}
            alt=""
            aria-hidden
            data-gift-layer={layer.role}
            className={cn("pointer-events-none", layer.className)}
            onError={layer.required ? undefined : (event) => {
              event.currentTarget.hidden = true;
            }}
          />
        ))}
      </div>
    </div>
  );
}

export function GiftBoxArtwork({ visual }: { visual: GiftBoxVisual }) {
  return (
    <div data-gift-artwork="giftbox" className="igb-wrapper relative flex h-full w-full items-end justify-center pb-8">
      <div className="igb-bob relative h-[220px] w-[200px]" aria-hidden>
        {visual.decorImages.map((src, index) => (
          <img
            key={src}
            src={src}
            alt=""
            className={cn(
              "igb-decor pointer-events-none absolute [filter:drop-shadow(0_2px_3px_rgba(0,0,0,0.25))]",
              GIFTBOX_DECOR_CLASSES[index],
            )}
            onError={(event) => {
              event.currentTarget.hidden = true;
            }}
          />
        ))}
        <img
          src={visual.boxImage}
          alt=""
          className="igb-box pointer-events-none absolute bottom-0 left-1/2 z-[2] max-h-[220px] w-[170px] -translate-x-1/2 object-contain [filter:drop-shadow(0_10px_18px_rgba(0,0,0,0.25))]"
        />
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Add the paired-envelope motion classes**

Append to `src/app/globals.css` beside the existing gift-box animation:

```css
.ienv-back {
  animation: gift-envelope-back-float 2.8s ease-in-out infinite;
  will-change: transform;
}

.ienv-card {
  animation: gift-envelope-front-float 2.4s ease-in-out infinite;
  will-change: transform;
}

.ienv-shadow {
  animation: gift-envelope-shadow-pulse 2.4s ease-in-out infinite;
}

@keyframes gift-envelope-back-float {
  0%, 100% { transform: translateX(20%) translateY(-10%) scale(-0.8, 0.8) rotate(-15deg); }
  50% { transform: translateX(18%) translateY(-14%) scale(-0.82, 0.82) rotate(-18deg); }
}

@keyframes gift-envelope-front-float {
  0%, 100% { rotate: -10deg; transform: translateY(0); }
  50% { rotate: -7deg; transform: translateY(-8px); }
}

@keyframes gift-envelope-shadow-pulse {
  0%, 100% { opacity: 0.75; transform: translateX(-50%) scaleX(1); }
  50% { opacity: 0.45; transform: translateX(-50%) scaleX(0.86); }
}

@media (prefers-reduced-motion: reduce) {
  .ienv-back,
  .ienv-card,
  .ienv-shadow {
    animation: none;
  }
}
```

- [ ] **Step 6: Wire the registry into `GiftEnvelope` while retaining the procedural fallback**

In `src/components/chungdoi-tpl-shared.tsx`:

1. Import `GiftBoxArtwork`, `LayeredGiftArtwork`, and `resolveGiftVisual`.
2. Replace the legacy `variant`, `boxImage`, `decorImages`, and `photoImage` props with `templateSlug: string`.
3. Resolve once: `const visual = resolveGiftVisual(templateSlug);`.
4. Add `data-gift-visual-kind={visual.kind}` and `data-gift-visual-slug={templateSlug}` to the button.
5. Use this class selection:

```tsx
className={cn(
  "group relative cursor-pointer border-none bg-transparent outline-none",
  visual.kind === "giftbox"
    ? "h-[280px] w-[260px]"
    : visual.kind === "layered-image"
      ? "h-[357px] w-[250px]"
      : "h-64 w-[200px]",
)}
```

6. Render the visual branches before the existing procedural JSX:

```tsx
{visual.kind === "layered-image" ? (
  <LayeredGiftArtwork visual={visual} />
) : visual.kind === "giftbox" ? (
  <GiftBoxArtwork visual={visual} />
) : (
  <div data-testid="gift-envelope-animation" className="nhat-binh-envelope-wrapper relative flex h-full w-full items-center justify-center">
    {/* Keep the existing coin, sparkle, envelope body, 囍 seal, and corner JSX here verbatim. */}
  </div>
)}
```

The comment above marks the current fallback subtree rather than new production text: retain the existing `nhat-binh-coin-*`, `nhat-binh-sparkle`, `nhat-binh-envelope-body`, `nhat-binh-envelope-front`, seal, and four `GiftEnvelopeCorner` elements without editing them. Remove `GIFTBOX_MINI_DECORS`, `IGB_DECOR_POS`, and only the obsolete `photo`/`giftbox` branches after the new source renderer is in place.

- [ ] **Step 7: Run typecheck and confirm the expected caller failures**

```bash
npm run typecheck
```

Expected: FAIL at every `GiftEnvelope` caller because `templateSlug` is now required and the removed legacy props are still present in three callers.

### Task 4: Pass the template slug from every shared-envelope caller

**Files:**
- Modify: `src/components/chungdoi-tpl-arch-sage.tsx`
- Modify: `src/components/chungdoi-tpl-boho-floral-brown.tsx`
- Modify: `src/components/chungdoi-tpl-boho-floral-green.tsx`
- Modify: `src/components/chungdoi-tpl-chateau-green.tsx`
- Modify: `src/components/chungdoi-tpl-cherry-blossom-pink.tsx`
- Modify: `src/components/chungdoi-tpl-crystal-floral-blue.tsx`
- Modify: `src/components/chungdoi-tpl-double-dragon.tsx`
- Modify: `src/components/chungdoi-tpl-dragon-phoenix-v3-red.tsx`
- Modify: `src/components/chungdoi-tpl-elegant-leaf-green.tsx`
- Modify: `src/components/chungdoi-tpl-floral-base.tsx`
- Modify: `src/components/chungdoi-tpl-glass-garden-green.tsx`
- Modify: `src/components/chungdoi-tpl-hoa-tinh-red.tsx`
- Modify: `src/components/chungdoi-tpl-qasr-gold.tsx`
- Modify: `src/components/chungdoi-tpl-qasr-green.tsx`
- Modify: `src/components/chungdoi-tpl-song-long-xanh.tsx`
- Modify: `src/components/chungdoi-tpl-spring-garden-blue.tsx`
- Modify: `src/components/chungdoi-tpl-zen-sand.tsx`
- Modify: `src/data/chungdoi-gift-visuals.test.ts`

- [ ] **Step 1: Add a failing source-contract test for every caller**

Add to `src/data/chungdoi-gift-visuals.test.ts`:

```ts
const GIFT_ENVELOPE_CALLER_FILES = [
  "chungdoi-tpl-arch-sage.tsx",
  "chungdoi-tpl-boho-floral-brown.tsx",
  "chungdoi-tpl-boho-floral-green.tsx",
  "chungdoi-tpl-chateau-green.tsx",
  "chungdoi-tpl-cherry-blossom-pink.tsx",
  "chungdoi-tpl-crystal-floral-blue.tsx",
  "chungdoi-tpl-double-dragon.tsx",
  "chungdoi-tpl-dragon-phoenix-v3-red.tsx",
  "chungdoi-tpl-elegant-leaf-green.tsx",
  "chungdoi-tpl-floral-base.tsx",
  "chungdoi-tpl-glass-garden-green.tsx",
  "chungdoi-tpl-hoa-tinh-red.tsx",
  "chungdoi-tpl-qasr-gold.tsx",
  "chungdoi-tpl-qasr-green.tsx",
  "chungdoi-tpl-song-long-xanh.tsx",
  "chungdoi-tpl-spring-garden-blue.tsx",
  "chungdoi-tpl-zen-sand.tsx",
] as const;

test("every GiftEnvelope caller passes its template slug", () => {
  for (const filename of GIFT_ENVELOPE_CALLER_FILES) {
    const source = readFileSync(
      path.join(process.cwd(), "src/components", filename),
      "utf8",
    );
    assert.match(source, /<GiftEnvelope[\s\S]*?templateSlug=\{content\.slug\}/, filename);
  }
});
```

- [ ] **Step 2: Run the unit test and verify it fails on the first caller**

```bash
npx tsx --test src/data/chungdoi-gift-visuals.test.ts
```

Expected: FAIL because none of the callers pass `templateSlug` yet.

- [ ] **Step 3: Add `templateSlug={content.slug}` to every listed caller**

Every call must contain this prop:

```tsx
<GiftEnvelope
  templateSlug={content.slug}
  banks={banks}
  accent={accent}
  dark={dark}
  cardBg={cardBg}
  heading={heading}
  labelColor={labelColor}
/>
```

Preserve each file's existing color, heading, and bank variables. In Chateau Green, Glass Garden Green, and Cherry Blossom Pink, remove only these obsolete props and imports:

```tsx
variant="giftbox"
boxImage="..."
decorImages={GIFTBOX_MINI_DECORS}
variant="photo"
photoImage="..."
```

- [ ] **Step 4: Run unit tests and typecheck**

```bash
npx tsx --test src/data/chungdoi-gift-visuals.test.ts
npm run typecheck
npm run typecheck:tests
```

Expected: PASS.

- [ ] **Step 5: Run the focused browser regression tests**

```bash
npx playwright test tests/e2e/templates.spec.ts --project=chromium --grep "Hoa Mộc Hồng|Song Long Xanh renders"
```

Expected: PASS.

- [ ] **Step 6: Commit renderer and caller integration**

```bash
git add src/components/chungdoi-gift-envelope-artwork.tsx src/components/chungdoi-tpl-shared.tsx src/components/chungdoi-tpl-*.tsx src/app/globals.css src/data/chungdoi-gift-visuals.test.ts tests/e2e/templates.spec.ts
git commit -m "fix: render source-specific gift envelopes"
```

### Task 5: Update the broader gift E2E contract

**Files:**
- Modify: `tests/e2e/templates.spec.ts:20-70, 470-555`

- [ ] **Step 1: Split procedural and source-image expectations**

Rename `ANIMATED_ENVELOPE_SLUGS` to `PROCEDURAL_GIFT_SLUGS` and keep only templates whose dedicated renderer still owns the procedural illustration:

```ts
const PROCEDURAL_GIFT_SLUGS = [
  "song-hy-red",
  "song-hy-green",
  "dragon-phoenix-red",
  "dragon-phoenix-blue",
  "dragon-phoenix-black",
  "baroque-gold",
  "royal-red",
  "royal-blue",
  "royal-green",
  "co-ba-red",
] as const;
```

Update the existing loop to read `for (const slug of PROCEDURAL_GIFT_SLUGS)`.

Keep `STATIC_QR_SLUGS` unchanged because those source demos intentionally contain no bank data, but their registry entries will apply when a user supplies banks.

- [ ] **Step 2: Add exact source-image expectations for demos with bank data**

Add:

```ts
const SOURCE_IMAGE_GIFT_ASSETS = {
  "boho-floral-green": "boho-floral-green",
  "boho-floral-pink": "boho-floral-pink",
  "boho-floral-brown": "boho-floral-brown",
  "spring-garden-green": "spring-garden-green",
  "spring-garden-blue": "spring-garden-blue",
  "elegant-leaf-green": "elegant-leaf-green",
  "hoa-tinh-red": "hoa-tinh-red",
  "minimalism-red": "minimalism-red",
  "crystal-floral-blue": "crystal-floral-blue",
  "chibi-red": "chibi-red",
  "double-dragon-red": "double-dragon-red",
  "double-dragon-green": "double-dragon-green",
  "dragon-phoenix-v3-red": "dragon-phoenix-v3-red",
  "qasr-green": "qasr-green",
  "qasr-gold": "qasr-gold",
  "cherry-blossom-pink": "cherry-blossom-pink",
} as const;

test("every source-image gift template renders its registered pair", async ({ page }) => {
  test.setTimeout(300_000);

  for (const [slug, assetDirectory] of Object.entries(SOURCE_IMAGE_GIFT_ASSETS)) {
    const response = await page.goto(
      `/mau-thiep/${getVietnameseTemplateSlug(slug)}/demo?capture=1`,
      { waitUntil: "domcontentloaded", timeout: 60_000 },
    );
    expect(response?.ok(), slug).toBeTruthy();
    const envelope = page.getByTestId("gift-envelope");
    await expect(envelope, slug).toHaveAttribute("data-gift-visual-kind", "layered-image");
    const srcSuffix = slug === "cherry-blossom-pink"
      ? "/cherry_blossom_pink.webp"
      : `/${assetDirectory}/envelope.webp`;
    await expect(envelope.locator(`img[src$="${srcSuffix}"]`), slug).toHaveCount(2);
  }
});
```

- [ ] **Step 3: Strengthen the gift-box test with exact source mini layers**

Inside `gift-box templates keep their dedicated animation`, add:

```ts
await expect(giftBox.locator(".igb-decor"), slug).toHaveCount(7);
await expect(giftBox.locator(".igb-box"), slug).toHaveCount(1);
```

The registry unit test already checks the exact asset order for each gift box.

- [ ] **Step 4: Run all gift-related E2E tests**

```bash
npx playwright test tests/e2e/templates.spec.ts --project=chromium --grep "gift|Gift|Hoa Mộc Hồng|Song Long Xanh"
```

Expected: PASS with procedural templates, source-image templates, gift-box templates, and static QR-only demos all covered separately.

- [ ] **Step 5: Commit the completed E2E contract**

```bash
git add tests/e2e/templates.spec.ts
git commit -m "test: cover template-specific gift visuals"
```

### Task 6: Full verification and visual comparison

**Files:**
- Verify only; modify files only if a failure identifies a defect in this feature.

- [ ] **Step 1: Run the focused unit test**

```bash
npx tsx --test src/data/chungdoi-gift-visuals.test.ts
```

Expected: PASS with no warnings.

- [ ] **Step 2: Run the full project check**

```bash
npm run check
```

Expected: lint, application typecheck, test typecheck, unit tests, and production build all PASS.

- [ ] **Step 3: Run the gift E2E slice after the production build**

```bash
npx playwright test tests/e2e/templates.spec.ts --project=chromium --grep "gift|Gift|Hoa Mộc Hồng|Song Long Xanh"
```

Expected: PASS.

- [ ] **Step 4: Compare Song Long Xanh at desktop width**

Open both:

```text
Source: https://chungdoi.com/vi/mau-thiep/song-long-xanh/demo?open=1
Local:  http://127.0.0.1:3100/mau-thiep/song-long-xanh/demo?capture=1
Viewport: 1440×1000
```

Verify two crossed green envelopes, layer order, mirroring, rotation, shadows, sparkles, dragon texture, heading, hint, and no horizontal overflow.

- [ ] **Step 5: Compare Song Long Xanh at mobile width**

Use the same pages at `390×844`. Verify the artwork remains centered, fully visible, tappable, and does not create horizontal scrolling.

- [ ] **Step 6: Spot-check every visual family**

At both desktop and mobile widths, inspect:

```text
Paired envelope: /mau-thiep/hoa-moc-hong/demo?capture=1
Gift box:       /mau-thiep/lau-dai-xanh/demo?capture=1
Gift box:       /mau-thiep/vuonkinh-xanh/demo?capture=1
Procedural:     /mau-thiep/arch-sage/demo?capture=1
Static QR:      /mau-thiep/mai-lan-trang/demo?capture=1
```

Verify the source families remain distinct and the QR modal still opens and closes for entries with bank data.

- [ ] **Step 7: Check the final diff and repository status**

```bash
git diff --check
git status --short
git log -n 5 --oneline
```

Expected: no whitespace errors, no untracked temporary audit files, and only intentional feature commits after the design and plan commits.

- [ ] **Step 8: Commit any verification-only correction**

Only if verification required a correction:

```bash
git add src/data/chungdoi-gift-visuals.ts src/data/chungdoi-gift-visuals.test.ts src/components/chungdoi-gift-envelope-artwork.tsx src/components/chungdoi-tpl-shared.tsx src/components/chungdoi-tpl-*.tsx src/app/globals.css tests/e2e/templates.spec.ts docs/research/GIFT_VISUAL_SOURCE_AUDIT.md docs/research/asset-provenance.md public/chungdoi/images/giftbox
git commit -m "fix: polish template gift visual parity"
```

If no correction was needed, do not create an empty commit.

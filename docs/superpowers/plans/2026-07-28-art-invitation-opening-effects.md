# Art Invitation Opening Effects Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give all 18 art-invitation themes a clean, theme-specific 1.3–1.5 second opening in which isolated transparent subjects fly independently while the repaired background and existing 3D envelope remain stable.

**Architecture:** Keep the current 29 legacy `flyOnOpen` templates on their existing path. Add a declarative `openingEffect` contract to art-template manifests, render the repaired plate into the WebGL card face, render isolated subjects on a separately hideable WebGL decor plane, and hand those same subject crops to an SVG/WAAPI overlay at the instant opening starts. Generate tight-crop metadata from full-canvas transparent source exports so frame-zero placement stays pixel-perfect without full-card transparent WebPs.

**Tech Stack:** Next.js 16.2 App Router, React 19, TypeScript strict, Tailwind CSS v4, React Three Fiber/Three.js, Web Animations API, Sharp 0.35, Node test runner, Playwright.

---

## Scope and safety notes

- Read `node_modules/next/dist/docs/01-app/01-getting-started/12-images.md` and `node_modules/next/dist/docs/01-app/03-api-reference/02-components/image.md` before implementation. For decorative dynamically positioned layers, use empty alt text and eager preloading; do not use deprecated Next.js 16 `priority`.
- Preserve the current uncommitted restoration in `src/components/chungdoi-demo.tsx`, `src/components/chungdoi-envelope-3d.tsx`, and `tests/e2e/templates.spec.ts`.
- Do not stage unrelated files in the dirty worktree. The commit commands below are checkpoints and may only be run after the user authorizes staging/committing.
- Do not edit `src/data/templates/generated-data.ts` or `src/components/generated/template-renderers.tsx` by hand; regenerate them with `npm run templates:register`.
- Never use `clip-path`, rectangular crops from `artwork.webp`, or the composite artwork as an animated foreground fallback.

## File map

**Create**

- `src/data/templates/opening-effect.ts` — strict effect, asset-rect, motion-frame, and reduced-motion types plus contract helpers.
- `src/data/templates/opening-effect.test.ts` — contract and manifest invariants for the 18 effects.
- `src/data/templates/art-opening-effects.ts` — motion registry for all 18 themes.
- `src/components/chungdoi-opening-effect.tsx` — SVG layer compositor, preloader, failure handling, and WAAPI orchestration.
- `src/lib/opening-effect-animation.ts` — pure conversion from declarative frames to WAAPI keyframes/options.
- `src/lib/opening-effect-animation.test.ts` — pure timeline tests.
- `scripts/prepare-opening-assets.ts` — validates full-canvas alpha exports, trims them, writes transparent WebPs, and emits crop metadata.
- `scripts/validate-opening-effect-assets.ts` — checks plates, alpha, transparent edges, dimensions, file budgets, and manifest references.
- `public/chungdoi/images/themes/_decor/<slug>/opening-assets.json` — generated canvas and tight-crop geometry for each theme.
- `public/chungdoi/images/themes/_decor/<slug>/opening-plate.webp` — repaired composite-free plate for each theme.
- `public/chungdoi/images/themes/_decor/<slug>/opening-<subject>.webp` — tight transparent subject crops listed below.

**Modify**

- `src/data/templates/art-template-manifest.ts` — require the effect for art templates, use the repaired plate on the card, and register every effect asset.
- The 18 files `src/data/templates/{dong-ho-folk,tho-cam-highland,son-mai-lacquer,bat-trang-blue,hang-trong-folk,sen-monoline,truc-chi-minimal,long-phung-deco,ao-dai-hue,art-deco-gatsby,celestial-map,coastal-mediterranean,swiss-brutalist,riso-duotone,cinema-credit,aurora-glass-dark,y2k-chrome,botanical-lavender}.manifest.ts` — pass their unique effect data.
- `scripts/register-template-manifests.ts` — validate effect duration, IDs, asset paths, layer count, canvas, rects, and source uniqueness.
- `src/data/chungdoi-theme-config.ts` — expose the optional opening-effect type in `ChungDoiThemeConfig` without changing legacy config entries.
- `src/components/chungdoi-envelope-3d.tsx` — let the caller hide the decor texture plane synchronously during opening.
- `src/components/chungdoi-demo.tsx` — preload layers, select the art-effect path, keep legacy `OpeningFlyDecor`, and reveal content at the theme duration.
- `src/app/globals.css` — add only shared SVG transform-box and reduced-motion classes; retain legacy keyframes.
- `tests/e2e/templates.spec.ts` — cover art-layer mounting, 3D preservation, timing, failure fallback, reduced motion, and all-theme smoke checks.
- `package.json` — add asset preparation/validation commands.
- `docs/research/asset-provenance.md` — record all new files as derivatives of the existing original artwork.

## Approved asset inventory

All `opening-assets.json` files use the original artwork dimensions as `canvas.width` and `canvas.height`. Each subject source supplied to the preparation script is a full-canvas transparent PNG so Sharp can derive exact `x`, `y`, `width`, and `height`; the committed WebP is the resulting tight crop.

| Theme | Plate and tight transparent WebPs |
|---|---|
| `dong-ho-folk` | `opening-plate.webp`, `opening-left-chicken.webp`, `opening-right-chicken.webp`, `opening-center-lotus.webp` |
| `tho-cam-highland` | `opening-plate.webp`, `opening-upper-left-embroidery.webp`, `opening-lower-right-embroidery.webp`, `opening-stitches.webp` |
| `son-mai-lacquer` | `opening-plate.webp`, `opening-left-crane.webp`, `opening-right-crane.webp`, `opening-gold-clouds.webp` |
| `bat-trang-blue` | `opening-plate.webp`, `opening-swallows.webp`, `opening-lotus.webp`, `opening-cobalt-medallion.webp` |
| `hang-trong-folk` | `opening-plate.webp`, `opening-left-peacock.webp`, `opening-right-peacock.webp`, `opening-peonies.webp` |
| `sen-monoline` | `opening-plate.webp`, `opening-left-lotus.webp`, `opening-right-lotus.webp`, `opening-leaf-pods.webp` |
| `truc-chi-minimal` | `opening-plate.webp`, `opening-bamboo-ring.webp`, `opening-bamboo-cluster.webp`, `opening-backlight.webp` |
| `long-phung-deco` | `opening-plate.webp`, `opening-dragon.webp`, `opening-phoenix.webp`, `opening-foil-sun-frame.webp` |
| `ao-dai-hue` | `opening-plate.webp`, `opening-blue-silk.webp`, `opening-coral-silk.webp`, `opening-embroidery.webp` |
| `art-deco-gatsby` | `opening-plate.webp`, `opening-fan-crown.webp`, `opening-columns.webp`, `opening-corners.webp` |
| `celestial-map` | `opening-plate.webp`, `opening-constellations.webp`, `opening-moons.webp`, `opening-center-star.webp` |
| `coastal-mediterranean` | `opening-plate.webp`, `opening-vase.webp`, `opening-upper-olive.webp`, `opening-lower-olive.webp` |
| `swiss-brutalist` | `opening-plate.webp`, `opening-upper-black-block.webp`, `opening-lower-blocks.webp`, `opening-red-axis.webp` |
| `riso-duotone` | `opening-plate.webp`, `opening-coral-ink.webp`, `opening-teal-ink.webp`, `opening-black-ink.webp` |
| `cinema-credit` | `opening-plate.webp`, `opening-couple.webp`, `opening-seat-rows.webp`, `opening-projector-light.webp` |
| `aurora-glass-dark` | `opening-plate.webp`, `opening-left-ribbon.webp`, `opening-right-ribbon.webp`, `opening-flare.webp` |
| `y2k-chrome` | `opening-plate.webp`, `opening-left-chrome.webp`, `opening-right-chrome.webp`, `opening-highlights.webp` |
| `botanical-lavender` | `opening-plate.webp`, `opening-lavender.webp`, `opening-mustard-pods.webp`, `opening-stems.webp` |

## Motion matrix

Coordinates below are percentages of each layer's own tight bounding box. Every layer starts at `{x: 0, y: 0, scale: 1, rotate: 0, blur: 0}` and uses the prepared crop rect for placement. `peak` happens at offset `0.24`; `exit` happens at offset `1`. Opacity starts at the same value used on the closed cover, brightens at peak, and ends at `0`.

| Theme | Duration | Layer exits in listed asset order (`x`, `y`, `scale`, `rotate`, `blur`) |
|---|---:|---|
| `dong-ho-folk` | 1420ms | `(-88,-28,3.0,-9,8)`, `(88,-24,3.0,9,8)`, `(0,72,2.5,3,7)` |
| `tho-cam-highland` | 1360ms | `(-72,-66,2.7,-7,7)`, `(76,70,2.8,8,7)`, `(0,-45,2.2,12,6)` |
| `son-mai-lacquer` | 1480ms | `(-95,-36,3.2,-12,10)`, `(96,-34,3.2,12,10)`, `(0,-82,2.5,0,9)` |
| `bat-trang-blue` | 1400ms | `(0,-96,3.1,-4,9)`, `(-72,62,2.7,-8,8)`, `(74,14,2.4,8,7)` |
| `hang-trong-folk` | 1500ms | `(-96,-18,3.3,-10,10)`, `(98,-14,3.1,11,10)`, `(0,78,2.6,4,8)` |
| `sen-monoline` | 1340ms | `(-78,50,2.7,-8,7)`, `(80,-48,2.7,8,7)`, `(0,-74,2.3,10,6)` |
| `truc-chi-minimal` | 1450ms | `(0,-12,3.0,16,9)`, `(-82,68,2.8,-10,8)`, `(0,0,3.6,0,14)` |
| `long-phung-deco` | 1500ms | `(-102,-30,3.3,-11,10)`, `(102,-28,3.3,11,10)`, `(0,-70,2.7,5,9)` |
| `ao-dai-hue` | 1380ms | `(-76,-6,2.9,-6,8)`, `(78,10,2.9,6,8)`, `(0,-72,2.4,0,7)` |
| `art-deco-gatsby` | 1460ms | `(0,-92,3.0,0,9)`, `(0,60,2.8,0,8)`, `(0,0,3.4,14,10)` |
| `celestial-map` | 1440ms | `(0,-64,3.0,8,9)`, `(0,70,2.8,-8,8)`, `(0,0,4.0,0,14)` |
| `coastal-mediterranean` | 1350ms | `(0,76,2.8,5,8)`, `(-78,-62,2.6,-8,7)`, `(80,58,2.6,8,7)` |
| `swiss-brutalist` | 1300ms | `(-100,-28,2.8,-4,6)`, `(96,54,3.0,5,7)`, `(0,-92,2.4,0,5)` |
| `riso-duotone` | 1370ms | `(-84,20,2.8,-5,7)`, `(82,-22,2.8,5,7)`, `(0,74,3.0,2,8)` |
| `cinema-credit` | 1490ms | `(0,-82,3.3,0,11)`, `(0,82,2.9,0,9)`, `(0,-40,3.8,0,15)` |
| `aurora-glass-dark` | 1410ms | `(-96,-24,3.1,-12,11)`, `(98,26,3.1,12,11)`, `(0,0,4.2,0,16)` |
| `y2k-chrome` | 1390ms | `(-94,-18,3.2,-13,10)`, `(96,28,3.2,13,10)`, `(0,-54,3.5,0,14)` |
| `botanical-lavender` | 1430ms | `(-84,-46,2.9,-9,8)`, `(86,48,2.9,9,8)`, `(0,78,2.5,6,7)` |

---

### Task 1: Define and test the declarative opening contract

**Files:**
- Create: `src/data/templates/opening-effect.ts`
- Create: `src/lib/opening-effect-animation.ts`
- Test: `src/lib/opening-effect-animation.test.ts`

- [ ] **Step 1: Write failing timeline tests**

Test a three-frame dramatic motion, duration/delay options, percent transforms, brightness/blur filters, and the reduced-motion two-frame fade. Assert exact values such as:

```ts
assert.deepEqual(buildOpeningKeyframes(layer), [
  { offset: 0, opacity: 0.2, transform: "translate3d(0%, 0%, 0) scale(1) rotate(0deg)", filter: "blur(0px) brightness(1)" },
  { offset: 0.24, opacity: 0.95, transform: "translate3d(-10%, -4%, 0) scale(1.28) rotate(-2deg)", filter: "blur(0px) brightness(1.18)" },
  { offset: 1, opacity: 0, transform: "translate3d(-88%, -28%, 0) scale(3) rotate(-9deg)", filter: "blur(8px) brightness(1.05)" },
]);
assert.deepEqual(buildOpeningOptions(layer, 1420), {
  delay: 0,
  duration: 1420,
  easing: "cubic-bezier(0.22, 0.8, 0.2, 1)",
  fill: "both",
});
```

- [ ] **Step 2: Run the focused test and verify RED**

Run: `node --import tsx --test src/lib/opening-effect-animation.test.ts`

Expected: FAIL because `opening-effect.ts` and `opening-effect-animation.ts` do not exist.

- [ ] **Step 3: Implement strict reusable types and pure builders**

Define `OpeningAssetRect`, `OpeningMotionFrame`, `OpeningEffectLayer`, `ArtOpeningEffect`, `OpeningEffectAssetManifest`, `buildOpeningKeyframes`, `buildReducedMotionKeyframes`, and `buildOpeningOptions`. Restrict `durationMs` at runtime to 1300–1500, require exactly three or four layers, and make `reducedMotion.durationMs` a short 160–220ms fade.

Use this shape consistently:

```ts
export type OpeningEffectLayer = {
  id: string;
  src: string;
  rect: { x: number; y: number; width: number; height: number };
  transformOrigin: `${number}% ${number}%`;
  delayMs: number;
  easing: string;
  startOpacity: number;
  peak: OpeningMotionFrame & { offset: 0.24 };
  exit: OpeningMotionFrame & { offset: 1 };
  optional: true;
};

export type ArtOpeningEffect = {
  id: string;
  canvas: { width: number; height: number };
  durationMs: number;
  plateSrc: string;
  layers: readonly OpeningEffectLayer[];
  reducedMotion: { durationMs: number };
};
```

- [ ] **Step 4: Run focused tests and verify GREEN**

Run: `node --import tsx --test src/lib/opening-effect-animation.test.ts`

Expected: all timeline and reduced-motion tests PASS.

- [ ] **Step 5: Commit the contract checkpoint after authorization**

```bash
git add src/data/templates/opening-effect.ts src/lib/opening-effect-animation.ts src/lib/opening-effect-animation.test.ts
git commit -m "feat: define layered invitation opening effects"
```

### Task 2: Build the deterministic asset preparation and validation pipeline

**Files:**
- Create: `scripts/prepare-opening-assets.ts`
- Create: `scripts/validate-opening-effect-assets.ts`
- Modify: `package.json`
- Test: `src/data/templates/opening-effect.test.ts`

- [ ] **Step 1: Write failing tests for invalid images and metadata**

Create temporary Sharp fixtures inside the test process: one fully opaque fake foreground, one alpha foreground with transparent border, one wrong-size plate, and one rect outside its canvas. Assert that opaque foregrounds, absent alpha, mismatched canvas size, invalid rects, duplicate IDs, and durations outside 1300–1500 are rejected.

- [ ] **Step 2: Run the focused tests and verify RED**

Run: `node --import tsx --test src/data/templates/opening-effect.test.ts`

Expected: FAIL because the asset validators are not implemented.

- [ ] **Step 3: Implement the preparation CLI**

The CLI accepts `--slug`, `--plate`, and repeated `--layer id=/absolute/path.png`. It must:

1. Read original `artwork.webp` metadata and require every full-canvas source to match it exactly.
2. Require each subject PNG to have alpha with at least one pixel at alpha `0` and one pixel above alpha `16`.
3. Trim transparent borders with Sharp, add a 2px transparent safety border, and export near-lossless alpha WebP.
4. Export the repaired plate as `opening-plate.webp` at original dimensions.
5. Write `opening-assets.json` atomically with canvas dimensions and exact crop rects, compensating for the 2px border.
6. Never read the composite artwork as a subject fallback.

Add:

```json
"templates:prepare-opening-assets": "tsx scripts/prepare-opening-assets.ts",
"templates:validate-opening-assets": "tsx scripts/validate-opening-effect-assets.ts"
```

- [ ] **Step 4: Implement the validation CLI**

For all 18 themes, use Sharp to require: plate dimensions equal original artwork; foreground `hasAlpha === true`; alpha minimum is `0`; no foreground is fully opaque; all rects fit inside the source canvas; three or four layers; unique IDs/paths; no source ends with `/artwork.webp`; and every referenced file exists. Print one line per valid theme and a final `18/18 opening-effect asset sets valid`.

- [ ] **Step 5: Run focused tests and verify GREEN**

Run: `node --import tsx --test src/data/templates/opening-effect.test.ts`

Expected: all contract and synthetic-image tests PASS.

- [ ] **Step 6: Commit the tooling checkpoint after authorization**

```bash
git add package.json scripts/prepare-opening-assets.ts scripts/validate-opening-effect-assets.ts src/data/templates/opening-effect.test.ts
git commit -m "test: enforce clean opening effect assets"
```

### Task 3: Produce clean assets for themes 1–6

**Files:**
- Create: opening assets and metadata under the decor directories for `dong-ho-folk`, `tho-cam-highland`, `son-mai-lacquer`, `bat-trang-blue`, `hang-trong-folk`, and `sen-monoline`
- Modify: `docs/research/asset-provenance.md`

- [ ] **Step 1: Use the `imagegen` skill to create repaired plates**

For each original artwork, remove only the subjects named in the inventory, reconstruct the exact underlying paper/textile/porcelain/lacquer/floral texture, preserve the original canvas size and framing, and keep all non-moving details unchanged.

- [ ] **Step 2: Use the `imagegen` skill to export full-canvas transparent subjects**

Export one PNG per inventory ID on the original canvas. Prompt explicitly for genuine transparent alpha, no paper/textile/sky/dark matte, no rectangular background, original pixels/framing, and a 1–2px clean antialiased edge.

- [ ] **Step 3: Run the preparation CLI for all six themes**

Run `npm run templates:prepare-opening-assets -- --slug <slug> --plate <plate-path> --layer <id>=<png-path>` once per theme using the exact inventory IDs.

Expected: six `opening-assets.json` files and 24 WebPs (six plates plus 18 subjects).

- [ ] **Step 4: Validate and visually inspect**

Run: `npm run templates:validate-opening-assets -- --slugs dong-ho-folk,tho-cam-highland,son-mai-lacquer,bat-trang-blue,hang-trong-folk,sen-monoline`

Inspect every foreground on both white and magenta checkerboards. Reject any attached paper, textile, porcelain, lacquer, floral field, halo box, or dark rectangle. Composite each crop at its emitted rect over its repaired plate and compare at 100% and 200%; frame zero must not jump.

- [ ] **Step 5: Record provenance and commit after authorization**

Record that every new file is a derivative of its existing local `artwork.webp`, generated solely to separate motion layers.

```bash
git add docs/research/asset-provenance.md public/chungdoi/images/themes/_decor/{dong-ho-folk,tho-cam-highland,son-mai-lacquer,bat-trang-blue,hang-trong-folk,sen-monoline}/opening-*
git commit -m "feat: add heritage opening effect layers"
```

### Task 4: Produce clean assets for themes 7–12

**Files:**
- Create: opening assets and metadata under the decor directories for `truc-chi-minimal`, `long-phung-deco`, `ao-dai-hue`, `art-deco-gatsby`, `celestial-map`, and `coastal-mediterranean`
- Modify: `docs/research/asset-provenance.md`

- [ ] **Step 1: Create the six repaired plates with the `imagegen` skill**

Remove only the bamboo/backlight, dragon/phoenix/foil, silk/embroidery, Deco ornaments, celestial paths, and vase/olive subjects listed in the inventory. Reconstruct continuous underlying material and preserve every unaffected detail.

- [ ] **Step 2: Export the 18 genuine-alpha full-canvas subjects**

Keep thin bamboo, foil, constellation, glass/silk, and olive edges antialiased; remove all original background matte. Light layers may retain internal translucency but their outer canvas must be truly transparent.

- [ ] **Step 3: Prepare, validate, and composite-check all six themes**

Run the preparation CLI per theme, then:

`npm run templates:validate-opening-assets -- --slugs truc-chi-minimal,long-phung-deco,ao-dai-hue,art-deco-gatsby,celestial-map,coastal-mediterranean`

Expected: six valid plates, 18 alpha crops, no contaminated edges, and pixel-aligned reconstruction.

- [ ] **Step 4: Record provenance and commit after authorization**

```bash
git add docs/research/asset-provenance.md public/chungdoi/images/themes/_decor/{truc-chi-minimal,long-phung-deco,ao-dai-hue,art-deco-gatsby,celestial-map,coastal-mediterranean}/opening-*
git commit -m "feat: add cinematic opening effect layers"
```

### Task 5: Produce clean assets for themes 13–18

**Files:**
- Create: opening assets and metadata under the decor directories for `swiss-brutalist`, `riso-duotone`, `cinema-credit`, `aurora-glass-dark`, `y2k-chrome`, and `botanical-lavender`
- Modify: `docs/research/asset-provenance.md`

- [ ] **Step 1: Create the six repaired plates with the `imagegen` skill**

Remove only the black/red geometry, Riso separations, couple/seats/projector beam, glass ribbons/flare, chrome ribbons/highlights, and botanical clusters listed in the inventory. Preserve paper grain, theater depth, graphite, chrome field, and botanical color blocks.

- [ ] **Step 2: Export the 18 genuine-alpha full-canvas subjects**

Preserve intended semi-transparency in projector, flare, glass, and highlight layers while ensuring their unused canvas and perimeter are transparent. Riso colors must not carry the paper plate.

- [ ] **Step 3: Prepare, validate, and composite-check all six themes**

Run the preparation CLI per theme, then:

`npm run templates:validate-opening-assets -- --slugs swiss-brutalist,riso-duotone,cinema-credit,aurora-glass-dark,y2k-chrome,botanical-lavender`

Expected: six valid plates, 18 alpha crops, no opaque rectangles, and pixel-aligned reconstruction.

- [ ] **Step 4: Record provenance and commit after authorization**

```bash
git add docs/research/asset-provenance.md public/chungdoi/images/themes/_decor/{swiss-brutalist,riso-duotone,cinema-credit,aurora-glass-dark,y2k-chrome,botanical-lavender}/opening-*
git commit -m "feat: add modern opening effect layers"
```

### Task 6: Register all 18 unique effects in manifests

**Files:**
- Create: `src/data/templates/art-opening-effects.ts`
- Modify: `src/data/templates/art-template-manifest.ts`
- Modify: `src/data/chungdoi-theme-config.ts`
- Modify: all 18 art manifest files
- Modify: `scripts/register-template-manifests.ts`
- Test: `src/data/templates/opening-effect.test.ts`

- [ ] **Step 1: Add failing manifest-invariant tests**

Load the 18 manifests and assert: every effect exists; IDs are unique; durations match the motion matrix and stay in range; every layer ID matches `opening-assets.json`; every path is public and exists; each effect has three layers; no foreground or plate equals `artwork.webp`; all asset paths are included in `manifest.assets`; and legacy manifests do not gain an effect.

- [ ] **Step 2: Run tests and verify RED**

Run: `node --import tsx --test src/data/templates/opening-effect.test.ts`

Expected: FAIL because manifests have no `openingEffect`.

- [ ] **Step 3: Implement the art-effect registry**

Import each `opening-assets.json`, combine its exact canvas/rect/path data with the duration and exit values in the motion matrix, and use these shared peak values unless the theme is noted below:

```ts
const defaultPeak = {
  offset: 0.24 as const,
  x: 0,
  y: -4,
  scale: 1.28,
  rotate: 0,
  blur: 0,
  brightness: 1.18,
  opacity: 0.95,
};
```

Use brightness `1.45` for `son-mai-lacquer/gold-clouds`, `truc-chi-minimal/backlight`, `long-phung-deco/foil-sun-frame`, `cinema-credit/projector-light`, `aurora-glass-dark/flare`, and `y2k-chrome/highlights`. Give Riso peak registration offsets `coral=(-3,1)`, `teal=(3,-1)`, and `black=(0,2)` before their listed exits. Use transform origins at the subject-facing anchor: paired left/right layers use `100% 50%`/`0% 50%`, top/bottom framing uses `50% 100%`/`50% 0%`, and center light/star layers use `50% 50%`.

- [ ] **Step 4: Carry effect data through the manifest factory**

Add `openingEffect?: ArtOpeningEffect` only to `ChungDoiThemeConfig`; do not duplicate it at the `TemplateManifest` top level. Require `openingEffect` in `ArtTemplateManifestInput`, assign it to `theme.openingEffect`, set the closed-card plate image to `openingEffect.plateSrc`, and add the plate, layer sources, and music to `assets`. Each art manifest passes its own `artOpeningEffects[slug]`. The existing generated-theme mapping then carries the effect to the client without another serialization path.

- [ ] **Step 5: Extend registrar validation**

Validate the same structural invariants before generated files are written. Treat a missing plate, bad rect, duplicate effect ID, duration outside range, or original composite foreground as a registration error. Optional layer absence at runtime remains recoverable, but missing files at registration fail the build-time command.

- [ ] **Step 6: Regenerate and verify GREEN**

Run:

```bash
npm run templates:register
npm run templates:validate-opening-assets
node --import tsx --test src/data/templates/opening-effect.test.ts
npm run typecheck
```

Expected: registrar reports all manifests registered, validator reports `18/18`, tests PASS, and typecheck exits 0.

- [ ] **Step 7: Commit the manifest checkpoint after authorization**

```bash
git add src/data/templates/art-opening-effects.ts src/data/templates/art-template-manifest.ts src/data/templates/opening-effect.test.ts src/data/templates/{dong-ho-folk,tho-cam-highland,son-mai-lacquer,bat-trang-blue,hang-trong-folk,sen-monoline,truc-chi-minimal,long-phung-deco,ao-dai-hue,art-deco-gatsby,celestial-map,coastal-mediterranean,swiss-brutalist,riso-duotone,cinema-credit,aurora-glass-dark,y2k-chrome,botanical-lavender}.manifest.ts src/data/templates/generated-data.ts src/data/chungdoi-theme-config.ts scripts/register-template-manifests.ts src/components/generated/template-renderers.tsx
git commit -m "feat: register unique art invitation openings"
```

### Task 7: Render and animate tight alpha crops independently

**Files:**
- Create: `src/components/chungdoi-opening-effect.tsx`
- Modify: `src/app/globals.css`
- Test: `src/lib/opening-effect-animation.test.ts`

- [ ] **Step 1: Add failing behavior tests for animation orchestration**

Test exported pure helpers for: stable SVG viewBox, ordered layer keys, skipped failed IDs, normal options using the theme duration, reduced motion using only opacity for 160–220ms, and a completion deadline equal to the effect duration rather than the longest individual delay.

- [ ] **Step 2: Run tests and verify RED**

Run: `node --import tsx --test src/lib/opening-effect-animation.test.ts`

Expected: FAIL on missing orchestration helpers.

- [ ] **Step 3: Implement `OpeningEffectArtwork`**

Render a single responsive `<svg>` with the effect canvas as `viewBox` and `preserveAspectRatio="xMidYMid slice"`. Render each tight WebP as an SVG `<image>` using its exact rect. Mark the wrapper and images `aria-hidden`, empty-alt/decorative, and pointer-events none. Add data hooks:

```tsx
data-opening-effect={effect.id}
data-opening-layer={layer.id}
data-opening-layer-src={layer.src}
data-opening-layer-state={failedIds.has(layer.id) ? "failed" : "ready"}
```

- [ ] **Step 4: Implement preloading and optional failure handling**

Mount the preloader while the envelope is closed. Create one browser `Image` per layer and keep a `Set<string>` of failures. On an optional load error, omit only that `<image>`; do not insert `artwork.webp`, the repaired plate, or a rectangular fallback.

- [ ] **Step 5: Implement WAAPI animation**

When `opening` changes to true, call `.animate()` on each ready SVG image using the pure keyframe builders. In reduced-motion mode animate only opacity for the short fallback. Cancel all created `Animation` objects during cleanup and unmount the overlay after the outer invitation transition completes.

- [ ] **Step 6: Add shared CSS only**

Add classes for absolute card alignment, SVG overflow, `transform-box: fill-box`, compositor hints, and reduced-motion cleanup. Do not add theme-specific CSS selectors and do not remove `demo-dragon-fly`, `demo-envelope-away`, or `demo-cover-out`.

- [ ] **Step 7: Run tests and commit after authorization**

Run: `node --import tsx --test src/lib/opening-effect-animation.test.ts && npm run typecheck`

```bash
git add src/components/chungdoi-opening-effect.tsx src/lib/opening-effect-animation.ts src/lib/opening-effect-animation.test.ts src/app/globals.css
git commit -m "feat: animate isolated invitation artwork layers"
```

### Task 8: Integrate with the 3D envelope and theme-specific timing

**Files:**
- Modify: `src/components/chungdoi-envelope-3d.tsx`
- Modify: `src/components/chungdoi-demo.tsx`
- Test: `tests/e2e/templates.spec.ts`

- [ ] **Step 1: Write focused failing E2E tests**

For `dong-ho-folk`, assert before click: one 3D renderer, no 2D opening overlay, and three subjects present in the decor capture. After activating the real 3D button, assert: the WebGL decor plane is hidden, three clean SVG image layers mount in manifest order, none has an `artwork.webp` source, layer animations use the theme ID/duration, the 3D stage still exists, content is absent at 1,200ms, and content appears after 1,420ms plus polling tolerance.

Add a route-interception test that aborts one optional subject request and asserts the invitation still opens with the other two layers and no composite fallback. Add a reduced-motion context test asserting only opacity keyframes and reveal within 300ms.

- [ ] **Step 2: Run the three focused E2E tests and verify RED**

Run: `npx playwright test tests/e2e/templates.spec.ts --grep "isolated art opening|optional opening layer|reduced art opening" --workers=1`

Expected: FAIL because the art overlay is not integrated.

- [ ] **Step 3: Make the WebGL decor plane independently hideable**

Add `decorVisible?: boolean` to `Envelope3DProps`, default it to `true`, and gate only the `decorTex` mesh. Do not destroy or rebuild the front/overlay textures, camera, gesture handling, or scene when visibility changes.

- [ ] **Step 4: Split the art cover into plate, subjects, and text**

For effects: `CoverCard` renders the repaired plate and text into the front texture; `renderDecor` renders `OpeningEffectArtwork` in its closed/static mode; `renderOverlay` retains text above that plane; `decorVisible={!opening}` removes subjects from the 3D card in the same React commit that mounts the animated SVG overlay. Legacy themes retain their current `cardImages` and `OpeningFlyDecor` path.

- [ ] **Step 5: Use theme duration for the outer transition**

Resolve reduced motion with `matchMedia("(prefers-reduced-motion: reduce)")`. Normal art themes use `effect.durationMs`; reduced art themes use `effect.reducedMotion.durationMs`; themes without `openingEffect` keep the existing 800ms reveal and 1.2s `demo-dragon-fly` behavior. Drive the art card/background translate/fade with WAAPI so the card remains stable initially and exits behind the foreground layers.

- [ ] **Step 6: Run focused E2E and legacy regression tests**

Run:

```bash
npx playwright test tests/e2e/templates.spec.ts --grep "isolated art opening|optional opening layer|reduced art opening|fly-on-open decorations" --workers=1
npm run typecheck
```

Expected: all new tests PASS and the existing Song Phụng fly-on-open regression remains PASS.

- [ ] **Step 7: Commit the integration checkpoint after authorization**

```bash
git add src/components/chungdoi-envelope-3d.tsx src/components/chungdoi-demo.tsx tests/e2e/templates.spec.ts
git commit -m "feat: integrate layered art openings with 3d envelopes"
```

### Task 9: Verify all 18 themes on desktop and mobile

**Files:**
- Modify: `tests/e2e/templates.spec.ts`
- Modify only if visual defects are found: effect registry, affected assets, or shared opening component

- [ ] **Step 1: Add the 18-theme automated matrix**

For each approved slug, assert a unique effect ID, expected duration, exactly three ordered subject layers, no original composite source, 3D renderer continuity, no horizontal overflow, invitation reveal, and layer unmount after completion. Run the matrix at 1440×900 and 390×844 with one worker to avoid WebGL contention.

- [ ] **Step 2: Run the automated matrix**

Run: `npx playwright test tests/e2e/templates.spec.ts --grep "all art invitation opening effects" --workers=1`

Expected: 36 viewport/theme cases PASS.

- [ ] **Step 3: Perform visual QA theme by theme**

At both viewports, inspect frame zero, peak, and exit. Confirm clean alpha against the contrasting cover, exact alignment, meaningful theme-specific motion, no clipping, no background pixels traveling with a subject, readable closed-cover names, and normal post-open controls. Fix only the affected asset or manifest motion values, then rerun that theme before continuing.

- [ ] **Step 4: Run the full verification gate**

Run:

```bash
npm run templates:validate-opening-assets
npm run templates:register
npm run test:unit
npm run typecheck
npm run typecheck:tests
npm run lint
npm run build
npx playwright test tests/e2e/templates.spec.ts --workers=1
git diff --check
```

Expected: `18/18` asset sets valid; unit tests, typechecks, build, and E2E pass; lint has zero errors (existing warnings may remain); whitespace check is clean.

- [ ] **Step 5: Review the diff boundary**

Run `git status --short` and `git diff --stat`. Confirm no legacy template manifest, unrelated editor/data file, preview image, or user-owned change was staged or altered by this feature.

- [ ] **Step 6: Commit the final QA checkpoint after authorization**

```bash
git add tests/e2e/templates.spec.ts
git commit -m "test: verify all art invitation opening effects"
```

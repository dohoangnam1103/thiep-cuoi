# Thập Nhị Chi Đỏ Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add the `thap-nhi-chi-do` wedding-invitation template, with bride/groom zodiac selection, dynamic cover/opened-card artwork, and CSS-recolorable generated animal masks.

**Architecture:** Keep the existing Song Phụng `flyOnOpen` envelope and invitation composition. Add pure zodiac metadata/path resolution, pass resolved artwork into the Phoenix-family renderer, and render generated alpha artwork as CSS masks whose color comes from `content.theme.primaryColor`. Store zodiac choices in `InvitationContent`, expose them only for capable templates, and register the new template through the manifest registrar.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript strict, Tailwind CSS v4, next-intl, Prisma 7/SQLite, Sharp, Node test runner, Playwright.

---

### Task 1: Pin zodiac data and resolver contracts

**Files:**
- Modify: `src/lib/vietnamese-lunar-date.ts`
- Create: `src/lib/zodiac.ts`
- Create: `src/lib/zodiac.test.ts`
- Create: `src/lib/zodiac-decor.ts`
- Create: `src/lib/zodiac-decor.test.ts`

- [ ] **Step 1: Write the failing metadata tests**

Assert the twelve records are ordered against exported `EARTHLY_BRANCHES`, IDs are unique, Mão maps to Mèo, and `ZODIAC_IDS` accepts exactly the twelve IDs.

- [ ] **Step 2: Write the failing decoration tests**

Exercise `resolveZodiacCardImages(cardImages, content)` for valid IDs, empty/unknown fallback to Rồng + Phượng, `brideFirst` ordering, line tokens, non-token passthrough, and preservation of `flyOnOpen`/classes.

- [ ] **Step 3: Verify RED**

Run:

```bash
npx tsx --test src/lib/zodiac.test.ts src/lib/zodiac-decor.test.ts
```

Expected: failure because `zodiac.ts` and `zodiac-decor.ts` do not exist.

- [ ] **Step 4: Implement the pure APIs**

Export `EARTHLY_BRANCHES` as a readonly tuple and implement:

```ts
export const ZODIAC = [
  { id: "chuot", branch: "Tý", animal: "Chuột" },
  { id: "trau", branch: "Sửu", animal: "Trâu" },
  { id: "ho", branch: "Dần", animal: "Hổ" },
  { id: "meo", branch: "Mão", animal: "Mèo" },
  { id: "rong", branch: "Thìn", animal: "Rồng" },
  { id: "tran", branch: "Tỵ", animal: "Trăn" },
  { id: "ngua", branch: "Ngọ", animal: "Ngựa" },
  { id: "de", branch: "Mùi", animal: "Dê" },
  { id: "khi", branch: "Thân", animal: "Khỉ" },
  { id: "ga", branch: "Dậu", animal: "Gà" },
  { id: "cho", branch: "Tuất", animal: "Chó" },
  { id: "lon", branch: "Hợi", animal: "Lợn" },
] as const;
```

Use the asset root `/chungdoi/images/themes/_decor/thap-nhi-chi-do`, the fallback IDs `rong` and `phuong`, and `orderByBrideFirst` for positional resolution.

- [ ] **Step 5: Verify GREEN**

Run the Task 1 command and expect all tests to pass.

### Task 2: Generate and normalize recolorable artwork

**Files:**
- Create: `public/chungdoi/images/themes/_decor/thap-nhi-chi-do/source/*.png`
- Create: `public/chungdoi/images/themes/_decor/thap-nhi-chi-do/zodiac-*.webp`
- Create: `public/chungdoi/images/themes/_decor/thap-nhi-chi-do/zodiac-*-line.webp`
- Create: `public/chungdoi/images/themes/_decor/thap-nhi-chi-do/HOA.webp`
- Create: `scripts/generate-zodiac-artwork.mjs`
- Modify: `docs/research/asset-provenance.md`

- [ ] **Step 1: Generate twelve single-subject masters with ImageGen**

Use the existing `songphung-red/Phuong 2.webp` as the style reference. Generate one vertically composed, monochrome Vietnamese lacquer/paper-cut animal per zodiac on a uniform chroma background, with crisp enclosed ornamental cuts, no text, no watermark, and no cast shadow.

- [ ] **Step 2: Validate and select each master**

Inspect every output, rejecting incorrect species, extra animals, cropped limbs/tails, gradients that destroy silhouette readability, or contaminated chroma backgrounds.

- [ ] **Step 3: Implement deterministic Sharp normalization**

`scripts/generate-zodiac-artwork.mjs` reads the selected source PNGs, removes the keyed background into alpha, centers each subject on the Phoenix canvas ratio, creates a filled alpha mask at `1952×4105`, derives a clean edge/engraving variant at `1966×4119`, and writes lossless WebP. Derive the fallback phoenix masks from the existing Song Phụng alpha asset and copy the existing flower decoration.

- [ ] **Step 4: Generate all 26 files and validate alpha**

Run:

```bash
node scripts/generate-zodiac-artwork.mjs
```

Expected: thirteen filled masks and thirteen line masks, each with alpha, transparent corners, non-empty subject bounds, and exact target dimensions.

- [ ] **Step 5: Record provenance**

Append the ImageGen prompt family, generation date, local source paths, derived-output script, and the reused in-repo Song Phụng flower/phoenix fallback sources.

### Task 3: Persist zodiac choices end to end

**Files:**
- Modify: `prisma/schema.prisma`
- Create: `prisma/migrations/20260805_add_zodiac/migration.sql`
- Modify: `src/data/chungdoi-demo-content.ts`
- Modify: `src/lib/to-demo-content.ts`
- Modify: `src/lib/from-demo-content.ts`
- Modify: `src/app/editor/[id]/content-schema.ts`
- Modify: `src/app/editor/[id]/content-schema.test.ts`

- [ ] **Step 1: Add failing schema tests**

Assert valid IDs and the empty string parse, unknown IDs fail, and omitted fields default to the empty string.

- [ ] **Step 2: Verify RED**

Run:

```bash
npx tsx --test 'src/app/editor/[id]/content-schema.test.ts'
```

Expected: zodiac fields are absent or unknown values are not rejected.

- [ ] **Step 3: Add database and TypeScript fields**

Add `brideZodiac String @default("")` and `groomZodiac String @default("")`, a two-column SQLite migration, optional view-model fields, and both mapper directions. Validate with `z.enum(ZODIAC_IDS).or(z.literal("")).optional().default("")`.

- [ ] **Step 4: Regenerate Prisma and verify GREEN**

Run:

```bash
npm run prisma:generate
npx tsx --test 'src/app/editor/[id]/content-schema.test.ts'
```

Expected: schema tests pass and generated Prisma types expose both columns.

### Task 4: Add the capability-gated editor controls

**Files:**
- Modify: `src/data/editor-template-capabilities.ts`
- Modify: `src/app/editor/[id]/EditorForm.tsx`
- Modify: `messages/vi.json`
- Modify: `messages/en.json`
- Modify: `messages/ja.json`
- Modify: `messages/ko.json`
- Modify: `messages/zh.json`

- [ ] **Step 1: Add capability and preview assertions**

Extend unit coverage so only `thap-nhi-chi-do` reports zodiac support and live preview includes both selected values.

- [ ] **Step 2: Verify RED**

Run the focused capability/content tests and expect the new assertions to fail.

- [ ] **Step 3: Implement localized selects**

Expose `templateSupportsZodiac(slug)`, read both values in `buildPreviewContent`, and render two native selects immediately after the bride/groom birth-order controls only when the selected template supports zodiac. Options display `"Thìn — con Rồng"` and store `"rong"`; all visible labels/hints use next-intl messages.

- [ ] **Step 4: Verify GREEN and accessibility**

Run focused unit tests plus `npm run typecheck`; ensure label `htmlFor`, select `id/name`, and keyboard behavior are intact.

### Task 5: Share the Phoenix renderer with dynamic CSS-mask artwork

**Files:**
- Modify: `src/components/chungdoi-tpl-phoenix.tsx`
- Create: `src/components/chungdoi-tpl-thap-nhi-chi.tsx`
- Modify: `src/components/chungdoi-demo.tsx`
- Modify: `src/app/globals.css`

- [ ] **Step 1: Add failing source/contract tests**

Assert the new wrapper resolves ordered bride/groom artwork, the cover token resolver is called from `resolveTokens`, zodiac decorations render through the mask path, and the old Phoenix slugs still dispatch to `PhoenixInvitation` with `demo-dragon-fly` unchanged.

- [ ] **Step 2: Verify RED**

Run the focused zodiac/decor/renderer contract tests and expect missing wrapper/mask integration failures.

- [ ] **Step 3: Extract a narrow artwork override**

Keep `PhoenixInvitation({ content })` public and backward compatible. Add an optional internal artwork set for hero-left, hero-right, parallax-left, and parallax-right. The zodiac wrapper resolves IDs with Rồng/Phượng fallbacks and orders them with `orderByBrideFirst`.

- [ ] **Step 4: Render alpha assets as CSS masks**

Add stable per-file mask classes, `background-color: var(--zodiac-art-color, #d4a24a)`, prefixed/unprefixed mask declarations, responsive containment, and reduced-motion behavior. Set `--zodiac-art-color` from the template primary color so future color selection recolors all zodiac artwork without replacing assets.

- [ ] **Step 5: Resolve cover card tokens**

Call `resolveZodiacCardImages` at the end of `resolveTokens`; render zodiac paths as mask spans while all non-zodiac `cardImages` continue through the existing `<img>` path unchanged.

- [ ] **Step 6: Verify GREEN**

Run focused tests and `npm run test:lightbox` against a running app if available; confirm the legacy keyframes and source paths are unchanged.

### Task 6: Register the template and localize listing metadata

**Files:**
- Create: `src/data/templates/thap-nhi-chi-do.manifest.ts`
- Modify (generated): `src/data/templates/generated-data.ts`
- Modify (generated): `src/components/generated/template-renderers.tsx`
- Modify: `src/data/templates/template-manifest.test.ts`
- Modify: `messages/vi.json`
- Modify: `messages/en.json`
- Modify: `messages/ja.json`
- Modify: `messages/ko.json`
- Modify: `messages/zh.json`

- [ ] **Step 1: Add a failing manifest test**

Assert `thap-nhi-chi-do` is registered, declares exactly 26 zodiac masks plus the shared paper/flower/happiness/music assets, is not in `NEW_ART_TEMPLATE_SLUGS`, has all five listing locales, and its three preview files exist.

- [ ] **Step 2: Verify RED**

Run:

```bash
npx tsx --test --test-name-pattern='thap-nhi-chi-do' src/data/templates/template-manifest.test.ts
```

Expected: the manifest/preview contract is missing.

- [ ] **Step 3: Add manifest and listing translations**

Define a custom manifest with route `thap-nhi-chi-do`, renderer export `ThapNhiChiInvitation`, Song Phụng red cover tokens, zodiac demo values, five i18n names/descriptions, and Vietnamese category/color labels.

- [ ] **Step 4: Generate registries and seed the local demo**

Run:

```bash
npm run templates:register
npm run seed:demos
```

Expected: registrar reports one additional template; demo seed completes without dropping zodiac values.

- [ ] **Step 5: Capture preview assets and verify GREEN**

Run:

```bash
npm run screenshots:templates -- --slug thap-nhi-chi-do --no-sync-production
npx tsx --test --test-name-pattern='thap-nhi-chi-do|generated template manifests are wired through every public data registry|every catalog category and color has a Vietnamese listing label' src/data/templates/template-manifest.test.ts
```

Expected: listing/portrait/landscape previews exist and the manifest tests pass.

### Task 7: Browser regression and final verification

**Files:**
- Modify: `tests/e2e/templates.spec.ts`
- Modify: `tests/e2e/editor.spec.ts`
- Modify: `tests/e2e/dashboard.spec.ts`

- [ ] **Step 1: Add browser assertions**

Cover catalog/editor visibility, fallback Rồng + Phượng, changing both selects, `brideFirst` ordering, exactly two flying masks, static cover clipping, post-open overflow, visible parallax differential, reduced motion, and no horizontal document overflow at `390×844`.

- [ ] **Step 2: Run focused E2E**

```bash
npm run test:e2e -- tests/e2e/templates.spec.ts tests/e2e/editor.spec.ts tests/e2e/dashboard.spec.ts --grep 'thap-nhi-chi-do|template picker shows every completed template|Tạo thiệp mới|fly-on-open decorations stay visible'
```

Expected: all focused flows pass on Chromium.

- [ ] **Step 3: Perform visual comparison**

Capture desktop `1440px` and mobile `390×844` before/after opening. Compare the current Song Phụng reference and zodiac implementation for composition, palette, art density, clipping, two-subject flight, hero placement, parallax visibility, typography, and responsive overflow.

- [ ] **Step 4: Run complete gates**

```bash
npm run typecheck
npm run typecheck:tests
npm run test:unit
npm run lint
NEXT_PUBLIC_SITE_URL=https://thiepmungonline.com SITE_URL=https://thiepmungonline.com npm run build
git diff --check
```

Expected: zero failures. Review `git diff` by file and preserve all pre-existing Beach Journey and unrelated user changes.

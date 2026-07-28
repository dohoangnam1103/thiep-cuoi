# Art Invitation Rounded Cards and Themed Fonts Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give all 18 shared art invitation templates 24px content corners and an approved theme-specific display-font treatment for couple names and headings.

**Architecture:** Keep radius behavior in the shared renderer and add optional radius props to shared gallery/QR components so older templates remain unchanged. Resolve display fonts through a pure family-to-class helper, while each art wrapper supplies its approved default class and each manifest supplies the matching family for envelopes, editor defaults, and Open Graph rendering.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript strict, Tailwind CSS v4, local `@font-face` assets, Node test runner, Playwright preview capture.

---

## File map

- Create `src/lib/art-invitation-typography.ts`: resolve supported font-family strings to global utility classes without inline styles.
- Create `src/lib/art-invitation-typography.test.ts`: TDD coverage for defaults, editor overrides, stacks, and unknown fallbacks.
- Modify `src/app/globals.css`: declare Lora and 14 display-font utilities.
- Modify `src/components/chungdoi-tpl-art-invitation.tsx`: enforce 24px large-surface corners and apply resolved display fonts only to names/headings.
- Modify `src/components/chungdoi-tpl-shared.tsx`: add optional radius props to album tiles and QR surfaces.
- Modify `src/components/chungdoi-tpl-*.tsx` for the 18 art wrappers: add the approved display class and remove generic `font-sans`/`font-serif` from display treatments.
- Modify `src/data/templates/*.manifest.ts` for the same 18 templates: set the approved font family.
- Modify `src/data/templates/template-manifest.test.ts`: protect radius, wrapper, and manifest invariants.
- Modify `src/lib/og-image.ts` and `src/lib/og-image.test.ts`: load every approved local family for social cards.
- Regenerate `src/data/templates/generated-data.ts`, `src/components/generated/template-renderers.tsx`, registry data, 54 preview WebPs, and `src/data/template-preview-version.ts` through existing scripts.
- Modify `docs/research/INSPECTION_GUIDE.md`: record the 24px surface rule and themed display-font rule.

### Task 1: Add a tested font-family resolver

**Files:**
- Create: `src/lib/art-invitation-typography.ts`
- Create: `src/lib/art-invitation-typography.test.ts`

- [ ] **Step 1: Write the failing resolver tests**

Create `src/lib/art-invitation-typography.test.ts`:

```ts
import assert from "node:assert/strict";
import test from "node:test";

import { resolveArtDisplayFontClass } from "@/lib/art-invitation-typography";

test("resolveArtDisplayFontClass maps a template family", () => {
  assert.equal(
    resolveArtDisplayFontClass("SVN-HC Haydon Brush", "font-art-fallback"),
    "font-art-haydon",
  );
});

test("resolveArtDisplayFontClass accepts a quoted editor font stack", () => {
  assert.equal(
    resolveArtDisplayFontClass('"Fz Qellia", Georgia, serif', "font-art-fallback"),
    "font-art-qellia",
  );
});

test("resolveArtDisplayFontClass keeps the template class for an unknown family", () => {
  assert.equal(
    resolveArtDisplayFontClass("Unknown Wedding Font", "font-art-signora"),
    "font-art-signora",
  );
  assert.equal(resolveArtDisplayFontClass(null, "font-art-lora"), "font-art-lora");
});
```

- [ ] **Step 2: Run the focused test and confirm RED**

Run:

```bash
npx tsx --test src/lib/art-invitation-typography.test.ts
```

Expected: FAIL because `@/lib/art-invitation-typography` does not exist.

- [ ] **Step 3: Implement the minimal pure resolver**

Create `src/lib/art-invitation-typography.ts`:

```ts
const ART_DISPLAY_FONT_CLASS_BY_FAMILY: Readonly<Record<string, string>> = {
  "UNI Chu truyen thong": "font-art-uni",
  "SVN-HC Haydon Brush": "font-art-haydon",
  "DFVN New Eddy": "font-art-new-eddy",
  "Fz Qellia": "font-art-qellia",
  Pattaya: "font-art-pattaya",
  "1FTV VIP Signora": "font-art-signora",
  Lora: "font-art-lora",
  "Fz Aghita": "font-art-aghita",
  "The Nautigal": "font-art-nautigal",
  "SVN-HC Built Titling": "font-art-built",
  "Alex Brush": "font-art-alex",
  "SVN-HC Pacifico": "font-art-pacifico",
  HelveticaNeue: "font-art-helvetica",
  "SVN-HC Marvin Visions": "font-art-marvin",
};

function firstFontFamily(stack: string | null | undefined): string | null {
  if (!stack) return null;
  const match = stack.match(/^\s*"?([^",]+)"?/);
  return match ? match[1].trim() : null;
}

export function resolveArtDisplayFontClass(
  fontFamily: string | null | undefined,
  fallbackClass: string,
): string {
  const family = firstFontFamily(fontFamily);
  return family ? ART_DISPLAY_FONT_CLASS_BY_FAMILY[family] ?? fallbackClass : fallbackClass;
}
```

- [ ] **Step 4: Run RED→GREEN verification**

Run:

```bash
npx tsx --test src/lib/art-invitation-typography.test.ts
```

Expected: 3 tests PASS.

- [ ] **Step 5: Commit the resolver**

```bash
git add src/lib/art-invitation-typography.ts src/lib/art-invitation-typography.test.ts
git commit -m "feat: resolve art invitation display fonts"
```

### Task 2: Protect and implement 24px large-surface corners

**Files:**
- Modify: `src/data/templates/template-manifest.test.ts:124-175`
- Modify: `src/components/chungdoi-tpl-art-invitation.tsx:87-97,163-190,260-480`
- Modify: `src/components/chungdoi-tpl-shared.tsx:479-510,700-775`

- [ ] **Step 1: Add failing source invariants**

Add these assertions to the shared-renderer portion of `template-manifest.test.ts`:

```ts
  assert.match(sharedRendererSource, /function contentRadiusClass\(\)/);
  assert.match(sharedRendererSource, /return "rounded-\[1\.5rem\]"/);
  assert.doesNotMatch(sharedRendererSource, /contentRadiusClass\(config\)/);
  assert.doesNotMatch(
    sharedRendererSource,
    /config\.radiusClass === "rounded-(?:none|\[2px\]|\[3px\])"/,
  );
  assert.match(sharedRendererSource, /AlbumGallery[\s\S]*radiusClass=\{contentRadiusClass\(\)\}/);
  assert.match(sharedRendererSource, /GiftQrGrid[\s\S]*radiusClass=\{contentRadiusClass\(\)\}/);
```

Replace the existing `contentRadiusClass(config)` occurrence count with:

```ts
  assert.ok(
    [...sharedRendererSource.matchAll(/contentRadiusClass\(\)/g)].length >= 8,
    "large content surfaces must use the shared 24px radius",
  );
```

Read `src/components/chungdoi-tpl-shared.tsx` into `sharedComponentsSource` and add:

```ts
  assert.match(sharedComponentsSource, /radiusClass = "rounded-xl"/);
  assert.match(sharedComponentsSource, /cn\("size-32 bg-white/);
```

- [ ] **Step 2: Run the manifest test and confirm RED**

Run:

```bash
npx tsx --test src/data/templates/template-manifest.test.ts
```

Expected: FAIL because square exceptions remain and neither shared component accepts `radiusClass`.

- [ ] **Step 3: Make the card radius unconditional**

Replace the helper with:

```ts
function contentRadiusClass() {
  return "rounded-[1.5rem]";
}
```

Replace every `contentRadiusClass(config)` call with `contentRadiusClass()`. In `HeroPortraits`, replace `config.radiusClass` with `contentRadiusClass()`.

- [ ] **Step 4: Add backward-compatible shared radius props**

Update `GiftQrGrid`:

```tsx
export function GiftQrGrid({
  banks,
  heading = "Hộp Quà Mừng",
  accent,
  radiusClass = "rounded-xl",
  headingClassName,
}: {
  banks: GiftBank[];
  heading?: string;
  accent: string;
  radiusClass?: string;
  headingClassName?: string;
}) {
```

Replace its QR surface with:

```tsx
<div className={cn("size-32 bg-white p-2 shadow-lg sm:size-40", radiusClass)}>
```

Apply the optional display font to its heading without changing the default:

```tsx
<h2
  className={cn("text-[20px] font-bold uppercase tracking-wide md:text-[24px]", headingClassName)}
  style={{ color: accent }}
>
  {heading}
</h2>
```

Update `AlbumGallery` props:

```tsx
export function AlbumGallery({
  photos,
  layout = "grid",
  accent,
  gridAspect = "aspect-[3/4]",
  radiusClass = "rounded-xl",
}: {
  photos: string[];
  layout?: AlbumLayout;
  accent: string;
  gridAspect?: string;
  radiusClass?: string;
}) {
```

Use `cn()` for both mosaic and grid buttons:

```tsx
className={cn(
  "group relative aspect-square cursor-pointer overflow-hidden border",
  radiusClass,
  spanFor(i),
)}
```

```tsx
className={cn(
  "group relative cursor-pointer overflow-hidden border",
  gridAspect,
  radiusClass,
)}
```

- [ ] **Step 5: Pass 24px into the shared surfaces**

Use:

```tsx
<AlbumGallery
  photos={gallery}
  layout={content.albumLayout ?? "mosaic"}
  accent={config.accentHex}
  radiusClass={contentRadiusClass()}
/>
```

```tsx
<GiftQrGrid
  banks={banks}
  heading={t("gift")}
  accent={config.accentHex}
  radiusClass={contentRadiusClass()}
/>
```

- [ ] **Step 6: Run focused and shared tests**

Run:

```bash
npx tsx --test src/data/templates/template-manifest.test.ts
npm run test:unit
```

Expected: the focused manifest test and full unit suite PASS.

- [ ] **Step 7: Commit the radius change**

```bash
git add src/data/templates/template-manifest.test.ts src/components/chungdoi-tpl-art-invitation.tsx src/components/chungdoi-tpl-shared.tsx
git commit -m "feat: round art invitation content surfaces"
```

### Task 3: Load font utilities and integrate display typography

**Files:**
- Modify: `src/app/globals.css:28-118`
- Modify: `src/components/chungdoi-tpl-art-invitation.tsx:66-83,119-142,194-235,237-275,278-520`
- Modify: `src/data/templates/template-manifest.test.ts`

- [ ] **Step 1: Add failing typography invariants**

Add:

```ts
  assert.match(sharedRendererSource, /displayFontClass: string/);
  assert.match(sharedRendererSource, /resolveArtDisplayFontClass/);
  assert.match(sharedRendererSource, /config\.displayFontClass/);
```

Add global-style assertions:

```ts
  for (const className of [
    "font-art-uni", "font-art-haydon", "font-art-new-eddy", "font-art-qellia",
    "font-art-pattaya", "font-art-signora", "font-art-lora", "font-art-aghita",
    "font-art-nautigal", "font-art-built", "font-art-alex", "font-art-pacifico",
    "font-art-helvetica", "font-art-marvin",
  ]) {
    assert.match(globalStyles, new RegExp(`\\.${className}\\s*\\{`));
  }
```

- [ ] **Step 2: Run the manifest test and confirm RED**

```bash
npx tsx --test src/data/templates/template-manifest.test.ts
```

Expected: FAIL because no display-font contract or utilities exist.

- [ ] **Step 3: Declare Lora and utility classes**

Add after the existing font faces:

```css
@font-face {
  font-family: "Lora";
  src: url("/chungdoi/fonts/Lora-Regular.ttf") format("truetype");
  font-display: swap;
}

.font-art-uni { font-family: "UNI Chu truyen thong", "Fz Qellia", serif; }
.font-art-haydon { font-family: "SVN-HC Haydon Brush", "Pattaya", cursive; }
.font-art-new-eddy { font-family: "DFVN New Eddy", "Fz Qellia", serif; }
.font-art-qellia { font-family: "Fz Qellia", "Times New Roman", serif; }
.font-art-pattaya { font-family: "Pattaya", cursive; }
.font-art-signora { font-family: "1FTV VIP Signora", "Fz Aghita", cursive; }
.font-art-lora { font-family: "Lora", Georgia, serif; }
.font-art-aghita { font-family: "Fz Aghita", "Pattaya", cursive; }
.font-art-nautigal { font-family: "The Nautigal", "Alex Brush", cursive; }
.font-art-built { font-family: "SVN-HC Built Titling", HelveticaNeue, sans-serif; }
.font-art-alex { font-family: "Alex Brush", "Fz Aghita", cursive; }
.font-art-pacifico { font-family: "SVN-HC Pacifico", "Pattaya", cursive; }
.font-art-helvetica { font-family: HelveticaNeue, Arial, sans-serif; }
.font-art-marvin { font-family: "SVN-HC Marvin Visions", HelveticaNeue, sans-serif; }
```

- [ ] **Step 4: Add and resolve `displayFontClass`**

Import the resolver, add `displayFontClass: string` to `ArtInvitationConfig`, and derive the effective configuration at the top of `ArtInvitation`:

```ts
const effectiveConfig = {
  ...config,
  displayFontClass: resolveArtDisplayFontClass(
    content.theme.fontFamily,
    config.displayFontClass,
  ),
};
```

Pass `effectiveConfig` to `ArtworkHero`, `EventCard`, and every `SectionHeading`. Apply `config.displayFontClass` through `cn()` in `HeroNames`, `SectionHeading`, `EventCard` labels, family-side headings, and the calendar heading. Do not apply it to body paragraphs, dates, controls, or form fields.

Pass the resolved font to the shared gift title:

```tsx
<GiftQrGrid
  banks={banks}
  heading={t("gift")}
  accent={config.accentHex}
  radiusClass={contentRadiusClass()}
  headingClassName={effectiveConfig.displayFontClass}
/>
```

- [ ] **Step 5: Run focused typography tests**

```bash
npx tsx --test src/lib/art-invitation-typography.test.ts src/data/templates/template-manifest.test.ts
```

Expected: resolver and typography source invariants PASS.

- [ ] **Step 6: Commit the typography infrastructure**

```bash
git add src/app/globals.css src/components/chungdoi-tpl-art-invitation.tsx src/data/templates/template-manifest.test.ts
git commit -m "feat: add themed art invitation typography"
```

### Task 4: Apply the approved mapping to 18 wrappers and manifests

**Files:**
- Modify: `src/components/chungdoi-tpl-{dong-ho-folk,tho-cam-highland,son-mai-lacquer,bat-trang-blue,hang-trong-folk,sen-monoline,truc-chi-minimal,long-phung-deco,ao-dai-hue,art-deco-gatsby,celestial-map,coastal-mediterranean,swiss-brutalist,riso-duotone,cinema-credit,aurora-glass-dark,y2k-chrome,botanical-lavender}.tsx`
- Modify: matching 18 files under `src/data/templates/*.manifest.ts`
- Modify: `src/data/templates/template-manifest.test.ts`
- Regenerate: manifest-generated registries

- [ ] **Step 1: Add the exact expected mapping to the manifest test**

```ts
const NEW_ART_TEMPLATE_FONTS = {
  "dong-ho-folk": ["UNI Chu truyen thong", "font-art-uni"],
  "tho-cam-highland": ["SVN-HC Haydon Brush", "font-art-haydon"],
  "son-mai-lacquer": ["DFVN New Eddy", "font-art-new-eddy"],
  "bat-trang-blue": ["Fz Qellia", "font-art-qellia"],
  "hang-trong-folk": ["Pattaya", "font-art-pattaya"],
  "sen-monoline": ["1FTV VIP Signora", "font-art-signora"],
  "truc-chi-minimal": ["Lora", "font-art-lora"],
  "long-phung-deco": ["Fz Aghita", "font-art-aghita"],
  "ao-dai-hue": ["The Nautigal", "font-art-nautigal"],
  "art-deco-gatsby": ["SVN-HC Built Titling", "font-art-built"],
  "celestial-map": ["Alex Brush", "font-art-alex"],
  "coastal-mediterranean": ["SVN-HC Pacifico", "font-art-pacifico"],
  "swiss-brutalist": ["HelveticaNeue", "font-art-helvetica"],
  "riso-duotone": ["SVN-HC Marvin Visions", "font-art-marvin"],
  "cinema-credit": ["Lora", "font-art-lora"],
  "aurora-glass-dark": ["Alex Brush", "font-art-alex"],
  "y2k-chrome": ["SVN-HC Marvin Visions", "font-art-marvin"],
  "botanical-lavender": ["1FTV VIP Signora", "font-art-signora"],
} as const satisfies Record<(typeof NEW_ART_TEMPLATE_SLUGS)[number], readonly [string, string]>;
```

Inside the slug loop assert the demo family, wrapper class, and removal of generic display fonts:

```ts
const [fontFamily, displayFontClass] = NEW_ART_TEMPLATE_FONTS[slug];
assert.equal(chungdoiDemoContent[slug]?.theme.fontFamily, fontFamily, `${slug}: font family`);
assert.match(rendererSource, new RegExp(`displayFontClass: "${displayFontClass}"`));
assert.doesNotMatch(rendererSource, /(?:coupleClass|headingClass): "[^"]*font-(?:sans|serif)/);
```

- [ ] **Step 2: Run the manifest test and confirm RED**

```bash
npx tsx --test src/data/templates/template-manifest.test.ts
```

Expected: FAIL on the first old generic font family/class.

- [ ] **Step 3: Update every wrapper with the approved class and treatment**

Use this exact configuration table as the source of truth:

```ts
const WRAPPER_TREATMENTS = {
  "dong-ho-folk": [
    "font-art-uni",
    "text-[clamp(3rem,11vw,7rem)] font-normal uppercase leading-[0.82] tracking-[-0.035em]",
    "text-3xl font-normal uppercase leading-tight md:text-5xl",
  ],
  "tho-cam-highland": [
    "font-art-haydon",
    "text-[clamp(3.4rem,10vw,6.4rem)] font-normal normal-case leading-[0.88] tracking-normal",
    "text-4xl font-normal normal-case leading-tight md:text-6xl",
  ],
  "son-mai-lacquer": [
    "font-art-new-eddy",
    "text-[clamp(3rem,10vw,7rem)] font-normal leading-[0.88] tracking-[-0.025em]",
    "text-3xl font-normal leading-tight md:text-5xl",
  ],
  "bat-trang-blue": [
    "font-art-qellia",
    "text-[clamp(3rem,10vw,6.8rem)] font-normal leading-[0.9] tracking-[-0.02em]",
    "text-3xl font-normal leading-tight md:text-5xl",
  ],
  "hang-trong-folk": [
    "font-art-pattaya",
    "text-[clamp(3rem,10vw,6.8rem)] font-normal leading-[0.9] tracking-normal",
    "text-3xl font-normal leading-tight md:text-5xl",
  ],
  "sen-monoline": [
    "font-art-signora",
    "text-[clamp(3.3rem,11vw,7rem)] font-normal leading-[0.88] tracking-normal",
    "text-4xl font-normal leading-tight md:text-6xl",
  ],
  "truc-chi-minimal": [
    "font-art-lora",
    "text-[clamp(3rem,10vw,6.2rem)] font-normal leading-[0.95] tracking-[-0.02em]",
    "text-3xl font-normal leading-tight md:text-5xl",
  ],
  "long-phung-deco": [
    "font-art-aghita",
    "text-[clamp(3.6rem,11vw,7.2rem)] font-normal normal-case leading-[0.82] tracking-normal",
    "text-4xl font-normal normal-case leading-tight md:text-6xl",
  ],
  "ao-dai-hue": [
    "font-art-nautigal",
    "text-[clamp(4rem,13vw,8rem)] font-normal leading-[0.78] tracking-normal",
    "text-4xl font-normal leading-none md:text-6xl",
  ],
  "art-deco-gatsby": [
    "font-art-built",
    "text-[clamp(2.8rem,10vw,6.8rem)] font-normal uppercase leading-[0.84] tracking-[0.04em]",
    "text-3xl font-normal uppercase leading-none tracking-[0.06em] md:text-5xl",
  ],
  "celestial-map": [
    "font-art-alex",
    "text-[clamp(4rem,13vw,8rem)] font-normal leading-[0.78] tracking-normal",
    "text-4xl font-normal leading-none md:text-6xl",
  ],
  "coastal-mediterranean": [
    "font-art-pacifico",
    "text-[clamp(3.2rem,10vw,6.5rem)] font-normal normal-case leading-[0.88] tracking-normal",
    "text-3xl font-normal normal-case leading-tight md:text-5xl",
  ],
  "swiss-brutalist": [
    "font-art-helvetica",
    "text-[clamp(3rem,12vw,8rem)] font-light uppercase leading-[0.78] tracking-[-0.055em]",
    "text-4xl font-light uppercase leading-[0.9] tracking-[-0.04em] md:text-6xl",
  ],
  "riso-duotone": [
    "font-art-marvin",
    "text-[clamp(3rem,10vw,6.7rem)] font-normal uppercase leading-[0.84] tracking-[-0.02em]",
    "text-3xl font-normal uppercase leading-none tracking-[0.02em] md:text-5xl",
  ],
  "cinema-credit": [
    "font-art-lora",
    "text-[clamp(2.6rem,9vw,5.8rem)] font-normal uppercase leading-[0.9] tracking-[0.12em]",
    "text-3xl font-normal uppercase leading-tight tracking-[0.1em] md:text-5xl",
  ],
  "aurora-glass-dark": [
    "font-art-alex",
    "text-[clamp(4rem,13vw,8rem)] font-normal leading-[0.78] tracking-normal",
    "text-4xl font-normal leading-none md:text-6xl",
  ],
  "y2k-chrome": [
    "font-art-marvin",
    "text-[clamp(3rem,11vw,7.5rem)] font-normal uppercase leading-[0.82] tracking-[0.04em]",
    "text-4xl font-normal uppercase leading-[0.9] tracking-[0.05em] md:text-6xl",
  ],
  "botanical-lavender": [
    "font-art-signora",
    "text-[clamp(3.5rem,11vw,7.2rem)] font-normal leading-[0.86] tracking-normal",
    "text-4xl font-normal leading-tight md:text-6xl",
  ],
} as const;
```

In each wrapper add `displayFontClass`, preserve its existing responsive sizes/line-heights, replace only the old generic font and weight/tracking tokens with the approved treatment, and keep `radiusClass` unchanged because controls still use it.

- [ ] **Step 4: Update the matching manifest `fontFamily` values**

Use the first value from `NEW_ART_TEMPLATE_FONTS` for every matching manifest. Do not change assets, copy, palette, music, or `heroImageCount`.

- [ ] **Step 5: Run the registrar**

```bash
npm run templates:register
```

Expected: registrar succeeds and rewrites generated registries without missing assets or renderer exports.

- [ ] **Step 6: Run focused tests and typechecks**

```bash
npx tsx --test src/data/templates/template-manifest.test.ts
npm run typecheck
npm run typecheck:tests
```

Expected: all commands exit 0.

- [ ] **Step 7: Commit wrappers, manifests, and generated registries**

```bash
git add \
  src/components/chungdoi-tpl-{dong-ho-folk,tho-cam-highland,son-mai-lacquer,bat-trang-blue,hang-trong-folk,sen-monoline,truc-chi-minimal,long-phung-deco,ao-dai-hue,art-deco-gatsby,celestial-map,coastal-mediterranean,swiss-brutalist,riso-duotone,cinema-credit,aurora-glass-dark,y2k-chrome,botanical-lavender}.tsx \
  src/data/templates/{dong-ho-folk,tho-cam-highland,son-mai-lacquer,bat-trang-blue,hang-trong-folk,sen-monoline,truc-chi-minimal,long-phung-deco,ao-dai-hue,art-deco-gatsby,celestial-map,coastal-mediterranean,swiss-brutalist,riso-duotone,cinema-credit,aurora-glass-dark,y2k-chrome,botanical-lavender}.manifest.ts \
  src/data/templates/template-manifest.test.ts
git commit -m "feat: theme art invitation display fonts"
```

### Task 5: Keep Open Graph typography consistent

**Files:**
- Modify: `src/lib/og-image.ts:21-36`
- Modify: `src/lib/og-image.test.ts:55-75`

- [ ] **Step 1: Add failing OG mapping coverage**

```ts
import { existsSync } from "node:fs";
import path from "node:path";

const ART_OG_FONTS = {
  "dong-ho-folk": ["UNI Chu truyen thong", "UNI_Chu_truyen_thong.ttf"],
  "tho-cam-highland": ["SVN-HC Haydon Brush", "SVN-HC-Haydon-Brush.otf"],
  "son-mai-lacquer": ["DFVN New Eddy", "DFVN-NewEddy-Regular.otf"],
  "bat-trang-blue": ["Fz Qellia", "Fz_Qellia_Fix.ttf"],
  "hang-trong-folk": ["Pattaya", "Pattaya-Regular.woff"],
  "sen-monoline": ["1FTV VIP Signora", "1FTV-VIP-Signora-Regular.otf"],
  "truc-chi-minimal": ["Lora", "Lora-Regular.ttf"],
  "long-phung-deco": ["Fz Aghita", "FzAghita.ttf"],
  "ao-dai-hue": ["The Nautigal", "TheNautigal-Regular.ttf"],
  "art-deco-gatsby": ["SVN-HC Built Titling", "SVN-HC-Built-Titling.otf"],
  "celestial-map": ["Alex Brush", "AlexBrush-Regular.ttf"],
  "coastal-mediterranean": ["SVN-HC Pacifico", "SVN-HC-Pacifico.otf"],
  "swiss-brutalist": ["HelveticaNeue", "HelveticaNeueLight.otf"],
  "riso-duotone": ["SVN-HC Marvin Visions", "SVN-HC-Marvin-Visions.otf"],
} as const;

test("all art invitation families resolve to local OG font files", () => {
  for (const [slug, [family, file]] of Object.entries(ART_OG_FONTS)) {
    assert.deepEqual(resolveOgFont(slug), { family, file }, slug);
    assert.equal(
      existsSync(path.join(process.cwd(), "public", "chungdoi", "fonts", file)),
      true,
      `${slug}: ${file}`,
    );
  }
});
```

- [ ] **Step 2: Run the OG test and confirm RED**

```bash
npx tsx --test src/lib/og-image.test.ts
```

Expected: FAIL on the first family missing from `FONT_FILE_BY_FAMILY`.

- [ ] **Step 3: Complete `FONT_FILE_BY_FAMILY`**

Add these missing entries:

```ts
  "SVN-HC Haydon Brush": "SVN-HC-Haydon-Brush.otf",
  Lora: "Lora-Regular.ttf",
  "Fz Aghita": "FzAghita.ttf",
  "The Nautigal": "TheNautigal-Regular.ttf",
  "SVN-HC Built Titling": "SVN-HC-Built-Titling.otf",
  "Alex Brush": "AlexBrush-Regular.ttf",
  "SVN-HC Pacifico": "SVN-HC-Pacifico.otf",
  HelveticaNeue: "HelveticaNeueLight.otf",
  "SVN-HC Marvin Visions": "SVN-HC-Marvin-Visions.otf",
```

- [ ] **Step 4: Run OG and full unit tests**

```bash
npx tsx --test src/lib/og-image.test.ts
npm run test:unit
```

Expected: OG tests and the full unit suite PASS.

- [ ] **Step 5: Commit OG support**

```bash
git add src/lib/og-image.ts src/lib/og-image.test.ts
git commit -m "feat: align art invitation social fonts"
```

### Task 6: Update the playbook, verify visually, and regenerate previews

**Files:**
- Modify: `docs/research/INSPECTION_GUIDE.md`
- Modify: `public/chungdoi/images/template-previews/en/{listing,portrait,landscape}/*.webp`
- Modify: `src/data/template-preview-version.ts`

- [ ] **Step 1: Record the approved rules in the playbook**

Add these product decisions:

```markdown
- Mọi content card và media frame lớn của nhóm art invitation dùng radius `24px` (`rounded-[1.5rem]`), không giữ ngoại lệ vuông `0–3px`.
- Button và calendar-day highlight tiếp tục dùng `radiusClass` riêng của theme; không dùng radius control để quyết định radius card.
- Tên cặp đôi và tiêu đề chính dùng display font được mapping theo theme; body copy giữ font đọc nội dung.
- Manifest font, wrapper display class và Open Graph font file phải cùng một mapping và đều hỗ trợ dấu tiếng Việt.
```

Update the known-error table and Definition of Done with square-card, generic-font, and OG-fallback regression checks.

- [ ] **Step 2: Start or reuse the local dev server**

```bash
npm run dev
```

Expected: `http://localhost:3000` responds, or the script reports the already-running local server.

- [ ] **Step 3: Run the browser visual matrix**

Inspect desktop 1440×1000 and mobile 390×844 for:

```text
tho-cam-highland      heritage + supplied event-card reference
truc-chi-minimal      light romantic serif
art-deco-gatsby       geometric exception
swiss-brutalist       modernist exception
riso-duotone          playful print exception
y2k-chrome            chrome exception
ao-dai-hue            large calligraphy and Vietnamese accents
botanical-lavender    botanical script
```

For each route verify: 24px large-surface corners, no clipped names/headings, no horizontal overflow, readable body copy, loaded intended font family, no framework overlay, and no relevant console errors.

- [ ] **Step 4: Capture all 18 preview sets safely**

```bash
npm run screenshots:templates -- --slug dong-ho-folk,tho-cam-highland,son-mai-lacquer,bat-trang-blue,hang-trong-folk,sen-monoline,truc-chi-minimal,long-phung-deco,ao-dai-hue,art-deco-gatsby,celestial-map,coastal-mediterranean,swiss-brutalist,riso-duotone,cinema-credit,aurora-glass-dark,y2k-chrome,botanical-lavender --no-sync-production
```

Expected: 18 successful captures and exactly 54 updated WebPs plus a new preview version.

- [ ] **Step 5: Run final verification gates**

Stop the development server, then run:

```bash
npm run typecheck
npm run typecheck:tests
npm run test:unit
npm run lint
NEXT_PUBLIC_SITE_URL=https://thiepmungonline.com SITE_URL=https://thiepmungonline.com npm run build
git diff --check
```

Expected: both typechecks, unit tests, lint error gate, production build, and whitespace check exit 0. Existing lint warnings may remain; no changed file may introduce a new error.

- [ ] **Step 6: Commit docs and previews**

```bash
git add docs/research/INSPECTION_GUIDE.md public/chungdoi/images/template-previews/en src/data/template-preview-version.ts
git commit -m "chore: refresh rounded art invitation previews"
```

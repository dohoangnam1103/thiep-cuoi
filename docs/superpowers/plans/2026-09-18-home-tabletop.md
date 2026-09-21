# Home Tabletop Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the current public Home presentation with an interactive “Bàn Chọn Thiệp” experience that features the real Minimalism Đỏ Đậm template and guides visitors from browsing to demo and creation.

**Architecture:** Keep the current route providers, catalog data, route aliases, authentication redirect, preview modal, and shared chrome. Add a focused `home-tabletop` component family: a client page owns selection and authentication state; section components receive explicit data and callbacks; real catalog previews remain the product source of truth. New generated images are decorative layers only.

**Tech Stack:** Next.js 16 App Router, React 19, strict TypeScript, next-intl, Tailwind CSS v4, Next Image, existing shadcn/Radix primitives, existing template catalog and preview modal.

**Spec:** `docs/superpowers/specs/2026-09-18-home-tabletop-design.md`

## Global Constraints

- Featured template: `minimalism-dark-red` (public Vietnamese route currently resolves to `minimalism-do-dam`).
- All user-facing text must come from `messages/vi.json`.
- No new database fields, APIs, public routes, or invitation renderer changes.
- Preserve `loginHref(TEMPLATE_LIST_PATH)` for signed-out users and `TEMPLATE_LIST_PATH` for signed-in users.
- Product imagery must come from real catalog records; generated images are decorative only.
- Verify at 1440×900, 768×1024, 390×844, and 320×568.
- Respect `prefers-reduced-motion`.

---

## File Structure

### Create

- `src/components/home-tabletop/home-tabletop-page.tsx` — Home state, auth-derived create URL, selected template, modal state, and section composition.
- `src/components/home-tabletop/home-tabletop-data.ts` — Curated real-template selection and category metadata.
- `src/components/home-tabletop/home-tabletop-hero.tsx` — Interactive tabletop and selected-template controls.
- `src/components/home-tabletop/home-style-gallery.tsx` — Category filtering and catalog navigation.
- `src/components/home-tabletop/home-live-preview.tsx` — Burgundy invitation preview chapter.
- `src/components/home-tabletop/home-creation-steps.tsx` — Three-step creation narrative.
- `src/components/home-tabletop/home-guest-experience.tsx` — Guest-link and RSVP product section.
- `src/components/home-tabletop/home-closing-cta.tsx` — Final conversion and footer transition.
- `src/components/home-tabletop/home-tabletop.module.css` — Scoped paper, lift, preview, and responsive motion styles.
- `src/components/home-tabletop/home-tabletop.test.tsx` — Component contract and selection tests.
- `tests/e2e/home-tabletop.spec.ts` — Browser interaction and viewport assertions.

### Modify

- `src/app/[locale]/page.tsx` — Render `HomeTabletopPage` inside the existing providers.
- `messages/vi.json` — Add the `home.tabletop` copy namespace.
- `src/i18n/translation-coverage.test.ts` — Point Home coverage at the new component family while retaining the same namespace set.

### Preserve

- `src/components/template-preview-modal.tsx`
- `src/components/chungdoi-chrome.tsx`
- `src/data/chungdoi.ts`
- `src/lib/template-route-aliases.ts`
- Existing invitation renderer and template assets.

---

### Task 1: Lock the Real Template Data Contract

**Files:**

- Create: `src/components/home-tabletop/home-tabletop-data.ts`
- Create: `src/components/home-tabletop/home-tabletop.test.tsx`

**Interfaces:**

- Produces: `HOME_FEATURED_TEMPLATE_SLUG`, `HOME_TABLETOP_TEMPLATE_SLUGS`, `HomeTemplateCategory`, `getHomeTabletopTemplates()`.
- Consumes: `templates` and `ChungDoiTemplate` from `@/data/chungdoi`.

- [ ] **Step 1: Write the data-contract test**

```tsx
import assert from "node:assert/strict";
import test from "node:test";

import {
  HOME_FEATURED_TEMPLATE_SLUG,
  getHomeTabletopTemplates,
} from "./home-tabletop-data";

test("home tabletop starts with the real Minimalism Đỏ Đậm template", () => {
  const items = getHomeTabletopTemplates();
  assert.equal(HOME_FEATURED_TEMPLATE_SLUG, "minimalism-dark-red");
  assert.equal(items[0]?.slug, HOME_FEATURED_TEMPLATE_SLUG);
  assert.match(items[0]?.portrait ?? "", /minimalism_darkred\.webp$/);
  assert.ok(items.every((item) => item.portrait && item.landscape));
});
```

- [ ] **Step 2: Run the test and verify the missing module failure**

Run: `npx tsx --test src/components/home-tabletop/home-tabletop.test.tsx`

Expected: FAIL because `home-tabletop-data.ts` does not exist.

- [ ] **Step 3: Implement the curated catalog selector**

```ts
import { templates, type ChungDoiTemplate } from "@/data/chungdoi";

export const HOME_FEATURED_TEMPLATE_SLUG = "minimalism-dark-red" as const;

export const HOME_TABLETOP_TEMPLATE_SLUGS = [
  HOME_FEATURED_TEMPLATE_SLUG,
  "minimalism-green",
  "song-hy-red",
  "glass-garden-pink",
] as const;

export type HomeTemplateCategory = "all" | "traditional" | "modern" | "photo";

export function getHomeTabletopTemplates(): ChungDoiTemplate[] {
  const bySlug = new Map(templates.map((template) => [template.slug, template]));
  return HOME_TABLETOP_TEMPLATE_SLUGS.flatMap((slug) => {
    const template = bySlug.get(slug);
    return template ? [template] : [];
  });
}
```

- [ ] **Step 4: Run the test**

Run: `npx tsx --test src/components/home-tabletop/home-tabletop.test.tsx`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/home-tabletop/home-tabletop-data.ts src/components/home-tabletop/home-tabletop.test.tsx
git commit -m "feat: define home tabletop template set"
```

---

### Task 2: Add Translated Copy and the Page Shell

**Files:**

- Create: `src/components/home-tabletop/home-tabletop-page.tsx`
- Modify: `src/app/[locale]/page.tsx`
- Modify: `messages/vi.json`
- Modify: `src/i18n/translation-coverage.test.ts`

**Interfaces:**

- Produces: `HomeTabletopPage`.
- Consumes: existing template-name/mobile-thumbnail/route providers from the route, `SiteHeader`, `SiteFooter`, `TemplatePreviewModal`, and the Task 1 selector.

- [ ] **Step 1: Extend the test with Home shell expectations**

Add a source contract test that reads `home-tabletop-page.tsx` and asserts that it uses `SiteHeader`, `SiteFooter`, `TemplatePreviewModal`, `loginHref`, and `TEMPLATE_LIST_PATH`. This test avoids duplicating React rendering infrastructure.

```tsx
import { readFileSync } from "node:fs";

test("home tabletop preserves shared chrome and auth redirect", () => {
  const source = readFileSync(
    new URL("./home-tabletop-page.tsx", import.meta.url),
    "utf8",
  );
  for (const token of [
    "SiteHeader",
    "SiteFooter",
    "TemplatePreviewModal",
    "loginHref",
    "TEMPLATE_LIST_PATH",
  ]) assert.match(source, new RegExp(token));
});
```

- [ ] **Step 2: Run the test and verify failure**

Run: `npx tsx --test src/components/home-tabletop/home-tabletop.test.tsx`

Expected: FAIL because `home-tabletop-page.tsx` does not exist.

- [ ] **Step 3: Add the `home.tabletop` catalog**

Add these exact groups under `home.tabletop`: `hero`, `filters`, `gallery`, `preview`, `steps`, `guests`, `closing`, and `accessibility`. Copy must include:

- `hero.title`: `Một chiếc thiệp. Đúng gu hai bạn.`
- `hero.subtitle`: `Chọn một tấm trên bàn để khám phá.`
- `hero.useTemplate`: `Dùng mẫu này`
- `hero.viewTemplate`: `Xem thiệp`
- `preview.title`: `Không chỉ nhìn. Hãy mở thiệp.`
- `steps.title`: `Từ tên hai bạn đến một lời mời hoàn chỉnh.`
- `guests.title`: `Gửi lời mời. Nhận câu trả lời.`
- `closing.title`: `Lời mời của hai bạn bắt đầu từ đây.`

- [ ] **Step 4: Implement `HomeTabletopPage`**

Use `useState<ChungDoiTemplate | null>` for modal state, `useState` for the selected template, and the existing `SiteHeader onSessionChange` callback to derive `createHref`. Keep state changes discrete; do not track pointer or scroll positions in React state.

```tsx
export function HomeTabletopPage() {
  const templates = getHomeTabletopTemplates();
  const [selected, setSelected] = useState(templates[0]);
  const [previewing, setPreviewing] = useState<ChungDoiTemplate | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const createHref = isAuthenticated
    ? TEMPLATE_LIST_PATH
    : loginHref(TEMPLATE_LIST_PATH);

  return (
    <main className="home-tabletop min-h-screen">
      <SiteHeader onSessionChange={setIsAuthenticated} />
      {/* Section components are added in Tasks 3–7. */}
      <SiteFooter />
      {previewing ? (
        <TemplatePreviewModal template={previewing} onClose={() => setPreviewing(null)} />
      ) : null}
    </main>
  );
}
```

- [ ] **Step 5: Switch the route import**

Replace `ChungDoiClone` with `HomeTabletopPage` inside the existing provider tree. Do not change metadata, `revalidate`, provider ordering, or static-params behavior.

- [ ] **Step 6: Update translation coverage and run checks**

Run:

```bash
npx tsx --test src/components/home-tabletop/home-tabletop.test.tsx src/i18n/translation-coverage.test.ts
npm run typecheck
```

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add src/app/[locale]/page.tsx src/components/home-tabletop/home-tabletop-page.tsx messages/vi.json src/i18n/translation-coverage.test.ts src/components/home-tabletop/home-tabletop.test.tsx
git commit -m "feat: add home tabletop shell"
```

---

### Task 3: Build the Interactive Tabletop Hero

**Files:**

- Create: `src/components/home-tabletop/home-tabletop-hero.tsx`
- Create: `src/components/home-tabletop/home-tabletop.module.css`
- Modify: `src/components/home-tabletop/home-tabletop-page.tsx`
- Modify: `src/components/home-tabletop/home-tabletop.test.tsx`

**Interfaces:**

- Consumes:

```ts
type HomeTabletopHeroProps = {
  templates: ChungDoiTemplate[];
  selected: ChungDoiTemplate;
  createHref: string;
  onSelect: (template: ChungDoiTemplate) => void;
  onPreview: (template: ChungDoiTemplate) => void;
};
```

- Produces: `HomeTabletopHero` with `data-home-tabletop-hero`, `data-home-template-card`, and `data-selected` hooks.

- [ ] **Step 1: Add source assertions for real asset usage and accessible selection**

Assert the hero source contains `surface-paper.webp`, `aria-pressed`, `onSelect`, `onPreview`, and `priority`. The catalog-backed `selected.name` must supply the visible template name; no literal product name belongs in the component.

- [ ] **Step 2: Run the test and verify failure**

Run: `npx tsx --test src/components/home-tabletop/home-tabletop.test.tsx`

Expected: FAIL because the hero module is missing.

- [ ] **Step 3: Implement the hero structure**

- Render the surface texture as a CSS background.
- Render notes, clips, and pencil through `next/image` with empty alt text, `aria-hidden`, and `pointer-events: none`.
- Render each template as a real button containing its `portrait` image and translated name.
- The selected template card receives `aria-pressed="true"`, a stronger shadow, a higher stacking order, and the attached action panel.
- The action panel must use `createHref` for “Dùng mẫu này” and call `onPreview(selected)` for “Xem thiệp”.
- Mark only the selected hero preview `priority`.

- [ ] **Step 4: Implement scoped motion and responsive behavior**

Use CSS variables for each card’s desktop rotation/position. At `max-width: 767px`, reset absolute positions and render one selected specimen with a horizontal thumbnail rail. In `prefers-reduced-motion: reduce`, remove transform transitions and parallax.

- [ ] **Step 5: Run tests, lint, and typecheck**

```bash
npx tsx --test src/components/home-tabletop/home-tabletop.test.tsx
npm run lint -- src/components/home-tabletop
npm run typecheck
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/components/home-tabletop
git commit -m "feat: build interactive invitation tabletop"
```

---

### Task 4: Add the Real-Template Style Gallery

**Files:**

- Create: `src/components/home-tabletop/home-style-gallery.tsx`
- Modify: `src/components/home-tabletop/home-tabletop-page.tsx`
- Modify: `src/components/home-tabletop/home-tabletop.module.css`
- Modify: `src/components/home-tabletop/home-tabletop.test.tsx`

**Interfaces:**

```ts
type HomeStyleGalleryProps = {
  templates: ChungDoiTemplate[];
  selectedSlug: string;
  onSelect: (template: ChungDoiTemplate) => void;
};
```

- [ ] **Step 1: Test that gallery cards use catalog `portrait` paths**

Add assertions for `data-home-style-gallery`, category buttons, `template.portrait`, and the full-listing `Link`.

- [ ] **Step 2: Implement category metadata without mutating catalog data**

Keep category-to-slug mapping local to `home-tabletop-data.ts`. Filter only the curated Home list; “Tất cả” restores original order with Minimalism Đỏ Đậm first.

- [ ] **Step 3: Build the staggered gallery**

Use a semantic section heading, a tab-like filter row, four real preview links/buttons, translated names, and a full-listing link. On mobile use CSS scroll snap. Do not autoplay.

- [ ] **Step 4: Verify**

```bash
npx tsx --test src/components/home-tabletop/home-tabletop.test.tsx
npm run lint -- src/components/home-tabletop
npm run typecheck
```

- [ ] **Step 5: Commit**

```bash
git add src/components/home-tabletop
git commit -m "feat: add home style gallery"
```

---

### Task 5: Add the Live Invitation Preview Chapter

**Files:**

- Create: `src/components/home-tabletop/home-live-preview.tsx`
- Modify: `src/components/home-tabletop/home-tabletop-page.tsx`
- Modify: `src/components/home-tabletop/home-tabletop.module.css`
- Modify: `src/components/home-tabletop/home-tabletop.test.tsx`

**Interfaces:**

```ts
type HomeLivePreviewProps = {
  template: ChungDoiTemplate;
  onPreview: (template: ChungDoiTemplate) => void;
};
```

- [ ] **Step 1: Add a test for the full listing image and real preview action**

Assert that the component selects `/listing/minimalism_darkred.webp`, exposes four translated chapter labels, and calls `onPreview(template)` from a button.

- [ ] **Step 2: Build the section**

Use the real listing preview in a fixed-aspect clipped viewport. The envelope illustration is decorative. The chapter rail is a semantic ordered list. The demo control is a button that opens the existing `TemplatePreviewModal`, not an inert link.

- [ ] **Step 3: Add progressive enhancement**

Desktop may use CSS sticky positioning for the preview window. Mobile and reduced-motion modes must render normal document flow. Do not add a window scroll listener.

- [ ] **Step 4: Verify**

```bash
npx tsx --test src/components/home-tabletop/home-tabletop.test.tsx
npm run lint -- src/components/home-tabletop
npm run typecheck
```

- [ ] **Step 5: Commit**

```bash
git add src/components/home-tabletop
git commit -m "feat: add live invitation preview chapter"
```

---

### Task 6: Add Creation Steps and Guest Experience

**Files:**

- Create: `src/components/home-tabletop/home-creation-steps.tsx`
- Create: `src/components/home-tabletop/home-guest-experience.tsx`
- Modify: `src/components/home-tabletop/home-tabletop-page.tsx`
- Modify: `src/components/home-tabletop/home-tabletop.module.css`
- Modify: `src/components/home-tabletop/home-tabletop.test.tsx`

**Interfaces:**

```ts
type HomeCreationStepsProps = { createHref: string };
type HomeGuestExperienceProps = { createHref: string };
```

- [ ] **Step 1: Add asset and CTA contract tests**

Assert the steps component uses the real Minimalism Đỏ Đậm envelope assets and the guests component uses `/chungdoi/images/rsvp-showcase.png`. Assert both receive `createHref` rather than constructing auth URLs.

- [ ] **Step 2: Implement the creation sequence**

Render an inert HTML name slip with `aria-hidden="true"`, the real open envelope, and the real portrait preview. Add the three translated numbered captions and one creation link.

- [ ] **Step 3: Implement the RSVP diptych**

Render the existing RSVP showcase with stable dimensions. Add the three translated benefits as plain lines, followed by a single CTA. Do not display invented counts from the concept image.

- [ ] **Step 4: Verify**

```bash
npx tsx --test src/components/home-tabletop/home-tabletop.test.tsx
npm run lint -- src/components/home-tabletop
npm run typecheck
```

- [ ] **Step 5: Commit**

```bash
git add src/components/home-tabletop
git commit -m "feat: explain invitation creation and RSVP"
```

---

### Task 7: Add the Closing CTA and Complete the Responsive Page

**Files:**

- Create: `src/components/home-tabletop/home-closing-cta.tsx`
- Modify: `src/components/home-tabletop/home-tabletop-page.tsx`
- Modify: `src/components/home-tabletop/home-tabletop.module.css`
- Modify: `src/components/home-tabletop/home-tabletop.test.tsx`

**Interfaces:**

```ts
type HomeClosingCtaProps = {
  createHref: string;
  onBrowseAgain: () => void;
};
```

- [ ] **Step 1: Add contract tests**

Assert the closing section uses the real Minimalism Đỏ Đậm landscape path, receives `createHref`, and implements browse-again as a button that focuses or scrolls to `#home-style-gallery`.

- [ ] **Step 2: Implement the closing section**

Use a burgundy background, large translated headline, butter creation CTA, trial note, and real landscape crop. Keep `SiteFooter` outside this component so the existing footer remains authoritative.

- [ ] **Step 3: Complete page assembly**

Render sections in this order:

```tsx
<HomeTabletopHero />
<HomeStyleGallery />
<HomeLivePreview />
<HomeCreationSteps />
<HomeGuestExperience />
<WeddingFaqSection id="pricing" />
<HomeClosingCta />
```

Keep the existing FAQ behavior and shared footer after the closing CTA.

- [ ] **Step 4: Audit responsive CSS**

Confirm no two adjacent sections reuse the same composition family. Add container padding, stable aspect ratios, focus styles, and reduced-motion overrides. Ensure decorative props disappear before they reduce CTA hit areas.

- [ ] **Step 5: Verify unit gates**

```bash
npx tsx --test src/components/home-tabletop/home-tabletop.test.tsx src/i18n/translation-coverage.test.ts
npm run lint
npm run typecheck
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/app/[locale]/page.tsx src/components/home-tabletop messages/vi.json src/i18n/translation-coverage.test.ts
git commit -m "feat: complete tabletop home narrative"
```

---

### Task 8: Add Browser Verification and Visual Evidence

**Files:**

- Create: `tests/e2e/home-tabletop.spec.ts`
- Create: `docs/research/home-tabletop-verification.md`
- Modify only if verification finds defects: files from Tasks 2–7.

**Interfaces:**

- Consumes E2E hooks: `data-home-tabletop-hero`, `data-home-template-card`, `data-selected`, `data-home-style-gallery`.
- Produces screenshots in the normal Playwright output directory and a verification record.

- [ ] **Step 1: Write the E2E interaction test**

```ts
import { expect, test } from "@playwright/test";

test("tabletop selects a real template and keeps actions aligned", async ({ page }) => {
  await page.goto("/");
  const hero = page.locator("[data-home-tabletop-hero]");
  await expect(hero).toBeVisible();
  await expect(hero.locator('[data-selected="true"]')).toContainText("Minimalism");

  const cards = hero.locator("[data-home-template-card]");
  await cards.nth(1).click();
  await expect(cards.nth(1)).toHaveAttribute("aria-pressed", "true");
  await expect(hero.getByRole("link", { name: "Dùng mẫu này" })).toBeVisible();
  await expect(hero.getByRole("button", { name: "Xem thiệp" })).toBeVisible();
});
```

- [ ] **Step 2: Add viewport and reduced-motion cases**

Test 1440×900, 768×1024, 390×844, and 320×568. At every viewport assert no horizontal overflow. In reduced-motion mode, assert selection still changes and the live-preview section is not pinned.

- [ ] **Step 3: Run targeted E2E**

Run: `npx playwright test tests/e2e/home-tabletop.spec.ts`

Expected: PASS.

- [ ] **Step 4: Perform visual review**

Capture the six sections at 1440×900 and 390×844. Compare against the matching files under `docs/research/home-tabletop/concepts/`. Record composition differences rather than pixel equality because the concepts contain generated incidental artwork.

- [ ] **Step 5: Run final gates**

```bash
npm run lint
npm run typecheck
npm run typecheck:tests
npm run test:unit
npm run build:local
```

Expected: all commands PASS. If a pre-existing unrelated failure occurs, record its command and exact output in the verification note.

- [ ] **Step 6: Complete the verification report**

For each section, record desktop/mobile state, assets checked, keyboard behavior, reduced-motion behavior, and any unverified difference. Use the required phase report format from `docs/wedding-invitation-agent-rules.md`.

- [ ] **Step 7: Commit**

```bash
git add tests/e2e/home-tabletop.spec.ts docs/research/home-tabletop-verification.md
git commit -m "test: verify tabletop home experience"
```

---

## Plan Self-Review

- Spec coverage: all six sections, real-template requirement, auth redirect, i18n, responsive behavior, reduced motion, accessibility, assets, and visual evidence have implementation tasks.
- Type consistency: selection callbacks consistently accept `ChungDoiTemplate`; creation links are passed as `createHref`; modal state uses `ChungDoiTemplate | null`.
- Asset consistency: Minimalism Đỏ Đậm uses `minimalism_darkred.webp`; generated files are decorative and have no product role.
- Scope: Home presentation only. No renderer, schema, API, deployment, or invitation behavior changes.

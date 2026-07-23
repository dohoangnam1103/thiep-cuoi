# Dashboard Template-Themed Invitation Cards Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Render every invitation on `/dashboard` as a full-width row whose background, text tint, and edge decorations are derived from the invitation's selected template, while staying readable and preserving all current data and actions.

**Architecture:** A pure resolver (`src/lib/dashboard-card-theme.ts`) turns a `templateId` into a small, dashboard-safe presentation object using `chungdoiThemeConfig` (background, contrast-checked text colors, up to two decoration image paths). A server-rendered presentational component (`src/app/dashboard/DashboardInvitationCard.tsx`) consumes that object plus the invitation data the page already loads. The dashboard page (`src/app/dashboard/page.tsx`) switches the list from a two-column grid to one card per row and delegates each row to the component. Templates without a config fall back to the existing neutral card.

**Tech Stack:** Next.js 16 App Router (React 19 server components), TypeScript strict, Tailwind CSS v4, `node:test` + `tsx` for unit tests, Playwright for E2E.

## Global Constraints

- TypeScript strict mode, no `any` (copy verbatim from `AGENTS.md`).
- Named exports, PascalCase components, camelCase utils.
- 2-space indentation, mobile-first responsive.
- Tailwind utility classes for all *static* styling. **Documented exception:** per-template `background` and text `color` are runtime data values that Tailwind cannot express as static classes, so they are applied via the `style` attribute on the themed card only. Decoration images use `style={{ backgroundImage }}` for the same reason. No other inline styles are permitted.
- User-facing copy already exists in the current dashboard (`Chỉnh sửa`, `Xem xác nhận`, `Khách mời`, `Xem thiệp`, `Thanh toán`, `Đã thanh toán`, `Đã xuất bản`, `Bản nháp`, `xác nhận`, `lời chúc`). Reuse these exact strings; do not add new hardcoded copy.
- Do not change invitation data, server actions, routing, payment behavior, or the dashboard page background.
- Unit tests run via `npm run test:unit` (`tsx --test "src/**/*.test.ts"`). Full gate is `npm run check`.

---

## File Structure

- **Create** `src/lib/dashboard-card-theme.ts` — resolver + color-contrast helpers. One responsibility: map `templateId` → dashboard-safe presentation object. Pure, no React.
- **Create** `src/lib/dashboard-card-theme.test.ts` — unit tests for the resolver and color helpers.
- **Create** `src/app/dashboard/DashboardInvitationCard.tsx` — presentational server component for one invitation row. One responsibility: layout + links + theme application.
- **Modify** `src/app/dashboard/page.tsx:42-124` — replace the two-column grid + inline `<li>` body with a single-column list that maps to `DashboardInvitationCard`.
- **Modify** `tests/e2e/dashboard.spec.ts` — add a `template-themed cards` describe (single-column desktop, themed background + decoration, unknown-template fallback).

---

## Task 1: Theme resolver + color helpers

**Files:**
- Create: `src/lib/dashboard-card-theme.ts`
- Test: `src/lib/dashboard-card-theme.test.ts`

**Interfaces:**
- Consumes: `chungdoiThemeConfig` from `@/data/chungdoi-theme-config` (shape: `Record<string, { theme: { background: string; textPrimary: string; textSecondary: string; accent: string; ... }; decorations: { cardImages: { src: string; className: string; flyOnOpen: boolean }[] } }>`).
- Produces:
  - `type DashboardCardTheme = { background: string; textColor: string; mutedTextColor: string; decorations: string[] }`
  - `function resolveDashboardCardTheme(templateId: string): DashboardCardTheme | null`
  - `function relativeLuminance(color: string): number | null`
  - `function pickReadableColor(color: string, fallback: string): string`

- [ ] **Step 1: Write the failing test**

Create `src/lib/dashboard-card-theme.test.ts`:

```ts
import assert from "node:assert/strict";
import test from "node:test";

import {
  pickReadableColor,
  relativeLuminance,
  resolveDashboardCardTheme,
} from "@/lib/dashboard-card-theme";

test("resolveDashboardCardTheme returns null for an unknown template", () => {
  assert.equal(resolveDashboardCardTheme("nope-not-real"), null);
});

test("resolveDashboardCardTheme exposes the template background", () => {
  const theme = resolveDashboardCardTheme("song-hy-red");
  if (!theme) throw new Error("expected a theme for song-hy-red");
  assert.match(theme.background, /linear-gradient/);
});

test("resolveDashboardCardTheme dedupes decorations and caps at two", () => {
  const theme = resolveDashboardCardTheme("song-hy-red");
  if (!theme) throw new Error("expected a theme for song-hy-red");
  // song-hy-red lists chu-hy.webp twice → one unique decoration.
  assert.deepEqual(theme.decorations, [
    "/chungdoi/images/themes/_decor/song-hy-red/chu-hy.webp",
  ]);
});

test("resolveDashboardCardTheme returns two decorations for double-phoenix-red", () => {
  const theme = resolveDashboardCardTheme("double-phoenix-red");
  if (!theme) throw new Error("expected a theme for double-phoenix-red");
  assert.equal(theme.decorations.length, 2);
});

test("pickReadableColor keeps a dark theme color on a light surface", () => {
  assert.equal(pickReadableColor("#710001", "#111111"), "#710001");
});

test("pickReadableColor falls back when the theme color is too light", () => {
  assert.equal(pickReadableColor("#f0d497", "#111111"), "#111111");
});

test("pickReadableColor falls back for an unparseable color", () => {
  assert.equal(pickReadableColor("var(--x)", "#111111"), "#111111");
});

test("relativeLuminance parses rgb and hex consistently", () => {
  const hex = relativeLuminance("#ffffff");
  const rgb = relativeLuminance("rgb(255,255,255)");
  if (hex === null || rgb === null) throw new Error("expected parseable colors");
  assert.ok(Math.abs(hex - rgb) < 1e-9);
  assert.ok(hex > 0.99);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test:unit`
Expected: FAIL — cannot resolve module `@/lib/dashboard-card-theme` (file not created yet).

- [ ] **Step 3: Write the resolver**

Create `src/lib/dashboard-card-theme.ts`:

```ts
import { chungdoiThemeConfig } from "@/data/chungdoi-theme-config";

export type DashboardCardTheme = {
  background: string;
  textColor: string;
  mutedTextColor: string;
  decorations: string[];
};

const NEUTRAL_TEXT = "#1f2937";
const NEUTRAL_MUTED = "#4b5563";
const READABLE_LUMINANCE_MAX = 0.6;
const MAX_DECORATIONS = 2;

function parseColorChannels(color: string): [number, number, number] | null {
  const value = color.trim();
  const hexMatch = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.exec(value);
  if (hexMatch) {
    let hex = hexMatch[1];
    if (hex.length === 3) {
      hex = hex
        .split("")
        .map((channel) => channel + channel)
        .join("");
    }
    return [
      parseInt(hex.slice(0, 2), 16),
      parseInt(hex.slice(2, 4), 16),
      parseInt(hex.slice(4, 6), 16),
    ];
  }
  const rgbMatch = /^rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)/.exec(value);
  if (rgbMatch) {
    return [Number(rgbMatch[1]), Number(rgbMatch[2]), Number(rgbMatch[3])];
  }
  return null;
}

function linearize(channel: number): number {
  const c = channel / 255;
  return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

export function relativeLuminance(color: string): number | null {
  const channels = parseColorChannels(color);
  if (!channels) return null;
  const [r, g, b] = channels;
  return 0.2126 * linearize(r) + 0.7152 * linearize(g) + 0.0722 * linearize(b);
}

export function pickReadableColor(color: string, fallback: string): string {
  const luminance = relativeLuminance(color);
  if (luminance === null) return fallback;
  return luminance <= READABLE_LUMINANCE_MAX ? color : fallback;
}

function uniqueDecorations(images: { src: string }[], limit: number): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const image of images) {
    if (!image.src || seen.has(image.src)) continue;
    seen.add(image.src);
    result.push(image.src);
    if (result.length >= limit) break;
  }
  return result;
}

export function resolveDashboardCardTheme(
  templateId: string,
): DashboardCardTheme | null {
  const config = chungdoiThemeConfig[templateId];
  if (!config) return null;
  return {
    background: config.theme.background,
    textColor: pickReadableColor(config.theme.textPrimary, NEUTRAL_TEXT),
    mutedTextColor: pickReadableColor(config.theme.textSecondary, NEUTRAL_MUTED),
    decorations: uniqueDecorations(config.decorations.cardImages, MAX_DECORATIONS),
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test:unit`
Expected: PASS — all `dashboard-card-theme` tests green.

- [ ] **Step 5: Commit**

```bash
git add src/lib/dashboard-card-theme.ts src/lib/dashboard-card-theme.test.ts
git commit -m "feat(dashboard): add template theme resolver for invitation cards"
```

---

## Task 2: Themed single-column dashboard list

**Files:**
- Create: `src/app/dashboard/DashboardInvitationCard.tsx`
- Modify: `src/app/dashboard/page.tsx:42-124`
- Test: `tests/e2e/dashboard.spec.ts` (append a new `describe`)

**Interfaces:**
- Consumes: `resolveDashboardCardTheme` and `DashboardCardTheme` from Task 1; `templateLabel` from `@/app/editor/[id]/templates`.
- Produces:
  - `type DashboardInvitationCardProps = { id: string; templateId: string; templateName: string; title: string; hasNames: boolean; status: string; slug: string | null; paid: boolean; rsvpCount: number; wishCount: number }`
  - `function DashboardInvitationCard(props: DashboardInvitationCardProps): JSX.Element` — renders one `<li>` with `data-template-id`, `data-themed`, and `[data-decoration]` children when themed.

- [ ] **Step 1: Write the failing E2E test**

Append this describe to `tests/e2e/dashboard.spec.ts` (after the existing `dashboard — navigation` describe, before `dashboard — guest manager v2`):

```ts
test.describe("dashboard — template-themed cards", () => {
  test("invitations render one full-width card per row on desktop", async ({
    page,
    context,
  }) => {
    const user = createUser();
    createInvitation(user.id, { templateId: "song-hy-red" });
    createInvitation(user.id, { templateId: "royal-blue" });
    try {
      await page.setViewportSize({ width: 1280, height: 800 });
      await loginAsUser(context, user.id);
      await page.goto("/dashboard");
      const cards = page.locator("ul li");
      await expect(cards).toHaveCount(2);
      const first = await cards.nth(0).boundingBox();
      const second = await cards.nth(1).boundingBox();
      if (!first || !second) throw new Error("expected two visible cards");
      // Stacked vertically: the second card starts at or below the first card's bottom.
      expect(second.y).toBeGreaterThanOrEqual(first.y + first.height - 1);
    } finally {
      cleanupUser(user.id);
    }
  });

  test("a themed template exposes its background and a decoration", async ({
    page,
    context,
  }) => {
    const user = createUser();
    createInvitation(user.id, { templateId: "song-hy-red" });
    try {
      await loginAsUser(context, user.id);
      await page.goto("/dashboard");
      const card = page.locator('li[data-template-id="song-hy-red"]');
      await expect(card).toHaveAttribute("data-themed", "true");
      await expect(card).toHaveAttribute("style", /linear-gradient|url\(/);
      const decorations = await card.locator("[data-decoration]").count();
      expect(decorations).toBeGreaterThan(0);
    } finally {
      cleanupUser(user.id);
    }
  });

  test("an unknown template falls back to the neutral card", async ({
    page,
    context,
  }) => {
    const user = createUser();
    createInvitation(user.id, { templateId: "totally-unknown-template" });
    try {
      await loginAsUser(context, user.id);
      await page.goto("/dashboard");
      const card = page.locator('li[data-template-id="totally-unknown-template"]');
      await expect(card).toHaveAttribute("data-themed", "false");
      await expect(card.locator("[data-decoration]")).toHaveCount(0);
    } finally {
      cleanupUser(user.id);
    }
  });
});
```

- [ ] **Step 2: Run the E2E test to verify it fails**

Run: `npx playwright test tests/e2e/dashboard.spec.ts -g "template-themed"`
Expected: FAIL — no `[data-template-id]` / `[data-themed]` attributes exist yet (current list uses plain `<li>` with no data attributes), and the single-column assertion may fail because the current list is a two-column grid.

- [ ] **Step 3: Create the card component**

Create `src/app/dashboard/DashboardInvitationCard.tsx`:

```tsx
import Link from "next/link";

import { resolveDashboardCardTheme } from "@/lib/dashboard-card-theme";

export type DashboardInvitationCardProps = {
  id: string;
  templateId: string;
  templateName: string;
  title: string;
  hasNames: boolean;
  status: string;
  slug: string | null;
  paid: boolean;
  rsvpCount: number;
  wishCount: number;
};

export function DashboardInvitationCard({
  id,
  templateId,
  templateName,
  title,
  hasNames,
  status,
  slug,
  paid,
  rsvpCount,
  wishCount,
}: DashboardInvitationCardProps) {
  const theme = resolveDashboardCardTheme(templateId);
  const published = status === "published";

  return (
    <li
      data-template-id={templateId}
      data-themed={theme ? "true" : "false"}
      className={`relative overflow-hidden rounded-2xl border p-4 shadow sm:p-5 ${
        theme ? "border-black/10" : "border-border bg-card"
      }`}
      style={theme ? { background: theme.background } : undefined}
    >
      {theme
        ? theme.decorations.map((src, index) => (
            <div
              key={`${src}-${index}`}
              data-decoration
              aria-hidden
              className={`pointer-events-none absolute top-1/2 h-24 w-24 -translate-y-1/2 bg-contain bg-no-repeat opacity-20 transition-opacity sm:h-36 sm:w-36 ${
                index === 0
                  ? "left-0 -translate-x-1/4 bg-left"
                  : "right-0 translate-x-1/4 bg-right"
              }`}
              style={{ backgroundImage: `url(${src})` }}
            />
          ))
        : null}

      <div
        className={`relative z-10 ${
          theme ? "rounded-xl bg-white/85 p-4 backdrop-blur-sm sm:p-5" : ""
        }`}
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-3">
              <h2
                className={`font-heading text-lg font-semibold ${
                  theme ? "" : "text-foreground"
                }`}
                style={theme ? { color: theme.textColor } : undefined}
              >
                {title}
              </h2>
              <span
                className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${
                  published
                    ? "bg-green-500/15 text-green-700"
                    : "bg-amber-500/15 text-amber-700"
                }`}
              >
                {published ? "Đã xuất bản" : "Bản nháp"}
              </span>
            </div>
            {hasNames ? (
              <p
                className={`mt-0.5 text-sm ${theme ? "" : "text-muted-foreground"}`}
                style={theme ? { color: theme.mutedTextColor } : undefined}
              >
                {templateName}
              </p>
            ) : null}
            <div
              className={`mt-2 flex gap-4 text-sm ${
                theme ? "" : "text-muted-foreground"
              }`}
              style={theme ? { color: theme.mutedTextColor } : undefined}
            >
              <span>{rsvpCount} xác nhận</span>
              <span>{wishCount} lời chúc</span>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 text-sm sm:justify-end">
            <Link
              href={`/editor/${id}`}
              className="rounded-full bg-secondary px-4 py-1.5 font-medium text-secondary-foreground transition hover:bg-muted"
            >
              Chỉnh sửa
            </Link>
            <Link
              href={`/dashboard/${id}/rsvp`}
              className="rounded-full bg-secondary px-4 py-1.5 font-medium text-secondary-foreground transition hover:bg-muted"
            >
              Xem xác nhận
            </Link>
            <Link
              href={`/dashboard/${id}/guests`}
              className="rounded-full bg-secondary px-4 py-1.5 font-medium text-secondary-foreground transition hover:bg-muted"
            >
              Khách mời
            </Link>
            {published && slug ? (
              <Link
                href={`/thiep/${slug}`}
                className="rounded-full bg-primary px-4 py-1.5 font-medium text-primary-foreground transition hover:bg-primary/90"
              >
                Xem thiệp
              </Link>
            ) : null}
            {paid ? (
              <span className="rounded-full bg-green-500/15 px-4 py-1.5 font-medium text-green-700">
                Đã thanh toán
              </span>
            ) : (
              <Link
                href={`/dashboard/${id}/thanh-toan`}
                data-ga-event="checkout_click"
                data-ga-param-source="dashboard"
                className="rounded-full bg-primary px-4 py-1.5 font-medium text-primary-foreground transition hover:bg-primary/90"
              >
                Thanh toán
              </Link>
            )}
          </div>
        </div>
      </div>
    </li>
  );
}
```

- [ ] **Step 4: Wire the component into the page**

In `src/app/dashboard/page.tsx`, add the import near the other local imports (after line 7, `import { NewInvitationButton } from "./NewInvitationButton";`):

```tsx
import { DashboardInvitationCard } from "./DashboardInvitationCard";
```

Then replace the entire `<ul>...</ul>` block (currently lines 43-123, from `<ul className="mt-8 grid gap-4 sm:grid-cols-2">` through its closing `</ul>`) with:

```tsx
        <ul className="mt-8 flex flex-col gap-4">
          {invitations.map((inv) => {
            const bride = inv.content?.brideFullName?.trim();
            const groom = inv.content?.groomFullName?.trim();
            const names = [groom, bride].filter(Boolean).join(" & ");
            const templateName = templateLabel(inv.templateId);
            return (
              <DashboardInvitationCard
                key={inv.id}
                id={inv.id}
                templateId={inv.templateId}
                templateName={templateName}
                title={names || templateName}
                hasNames={Boolean(names)}
                status={inv.status}
                slug={inv.slug}
                paid={inv.paid}
                rsvpCount={inv._count.rsvps}
                wishCount={inv._count.wishes}
              />
            );
          })}
        </ul>
```

The `Link` import at the top of `page.tsx` is now only used elsewhere? Verify: after this change `page.tsx` no longer uses `Link` directly. Remove the now-unused `import Link from "next/link";` (line 1) to keep lint clean. Keep `templateLabel` import — it is still used.

- [ ] **Step 5: Run the E2E test to verify it passes**

Run: `npx playwright test tests/e2e/dashboard.spec.ts -g "template-themed"`
Expected: PASS — all three themed-card tests green.

- [ ] **Step 6: Run the existing dashboard E2E to confirm no regressions**

Run: `npx playwright test tests/e2e/dashboard.spec.ts`
Expected: PASS — existing list/auth/navigation/create/guest tests still green (same `<ul><li>` structure, same link/status copy, same counts).

- [ ] **Step 7: Run the full gate**

Run: `npm run check`
Expected: lint clean (no unused `Link` import), typecheck + typecheck:tests clean, unit tests pass, production build succeeds.

- [ ] **Step 8: Commit**

```bash
git add src/app/dashboard/DashboardInvitationCard.tsx src/app/dashboard/page.tsx tests/e2e/dashboard.spec.ts
git commit -m "feat(dashboard): one themed full-width card per invitation"
```

---

## Manual Verification (per spec §Verification #4)

After the automated gate passes, verify on a real mobile viewport (browser devtools or a phone) at `/dashboard` with at least one themed and one unknown-template invitation:

- Each invitation is one full-width row; nothing sits in a second column.
- Content and action buttons never sit on top of, or get blocked by, the edge decorations.
- Text on the translucent surface is readable for both light-background themes (e.g. `spring-garden-red`) and dark-background themes (e.g. `song-hy-red`, `royal-blue`).
- Tap targets (buttons/links) remain comfortably tappable and wrap cleanly.
- The unknown-template row shows the current neutral card with no decorations.

---

## Self-Review

**1. Spec coverage:**
- One card per row → Task 2 Step 4 (`flex flex-col`) + E2E single-column test.
- Colors/decorations from `templateId` → Task 1 resolver + Task 2 themed rendering + E2E themed test.
- Preserve all info and actions → Task 2 component keeps every label, count, status, and link from the original page; existing E2E re-run in Step 6.
- Readable on mobile → translucent `bg-white/85` surface + contrast-checked text + manual mobile verification.
- Neutral fallback for missing config → resolver returns `null`, component branches to `bg-card`; E2E unknown-template test.
- No change to data/actions/routing/payment/page background → page change is scoped to the list `<ul>` only; header, queries, and `NewInvitationButton` untouched.
- Decorative images `aria-hidden` + `pointer-events-none` + below content in stacking order → component decoration divs use `aria-hidden`, `pointer-events-none`, and content surface is `relative z-10`.
- No continuous animation; hover is enhancement only → decorations use `transition-opacity` (no keyframes); no required info conveyed by hover.

**2. Placeholder scan:** No `TBD`/`TODO`/"add validation"/"similar to". Every code step shows full code; every run step shows the command and expected result.

**3. Type consistency:** `DashboardCardTheme` fields (`background`, `textColor`, `mutedTextColor`, `decorations`) are produced in Task 1 and consumed identically in Task 2. `DashboardInvitationCardProps` names match the page's `map` call in Task 2 Step 4 (`id`, `templateId`, `templateName`, `title`, `hasNames`, `status`, `slug`, `paid`, `rsvpCount`, `wishCount`). `resolveDashboardCardTheme` signature is identical across tasks.

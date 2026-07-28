# New Invitation Layouts Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship four genuinely distinct, asset-independent wedding invitation demos: Editorial Noir, Ticket Terracotta, Zen Sand, and Arch Sage.

**Architecture:** Each layout is a dedicated client renderer selected through the audited renderer registry. Shared hand-authored SVG ornaments provide decorative marks without third-party raster assets, while catalog data, localized routes, theme tokens, demo content, and database seeding follow the existing template pipeline. A filesystem-backed integration test guards every registration point and preview artifact.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript strict, Tailwind CSS v4, next-intl, Node test runner, Prisma 7/SQLite, Playwright preview capture.

---

### Task 1: Integration contract

**Files:**
- Create: `src/lib/new-invitation-layouts.test.ts`
- Modify: `src/lib/audited-template-renderers.test.ts`

- [ ] Write an audit that checks all four slugs across the catalog, localized route map, audited renderer list, theme config, demo content, five locale catalogs, preview files, and renderer source rules.
- [ ] Run `npx tsx --test src/lib/new-invitation-layouts.test.ts` and confirm it fails because the interrupted implementation is incomplete.

### Task 2: Complete template registration

**Files:**
- Modify: `src/components/chungdoi-demo.tsx`
- Modify: `src/lib/audited-template-renderers.ts`
- Modify: `src/data/chungdoi.ts`
- Modify: `src/data/template-route-slugs.ts`
- Modify: `src/data/chungdoi-theme-config.ts`
- Modify: `src/data/chungdoi-demo-content.ts`

- [ ] Register dynamic renderer imports and the four audited renderer mappings.
- [ ] Add envelope/theme tokens with no third-party decorations.
- [ ] Add seedable demo content derived from an existing local demo dataset, overriding slug, palette, gallery/hero choices, and music per layout.
- [ ] Re-run the targeted audit and confirm remaining failures are limited to localization and preview artifacts.

### Task 3: Localize renderer copy and enforce project styling rules

**Files:**
- Modify: `src/components/chungdoi-tpl-ornaments.tsx`
- Modify: `src/components/chungdoi-tpl-editorial-noir.tsx`
- Modify: `src/components/chungdoi-tpl-ticket-terracotta.tsx`
- Modify: `src/components/chungdoi-tpl-zen-sand.tsx`
- Modify: `src/components/chungdoi-tpl-arch-sage.tsx`
- Modify: `messages/vi.json`
- Modify: `messages/en.json`
- Modify: `messages/ko.json`
- Modify: `messages/ja.json`
- Modify: `messages/zh.json`
- Modify: `src/app/editor/layout.tsx`
- Modify: `src/app/admin/demos/[id]/page.tsx`
- Modify: `src/app/thiep/layout.tsx`

- [ ] Add one shared `invitationTemplate` namespace in every locale and catalog entries for all four template names/descriptions.
- [ ] Read labels with `useTranslations("invitationTemplate")` in each new renderer.
- [ ] Replace new inline style props with static Tailwind utilities while preserving each visual concept.
- [ ] Supply the namespace to non-localized editor/admin/published invitation providers.
- [ ] Run the targeted audit, unit tests, lint, and typecheck.

### Task 4: Seed and preview generation

**Files:**
- Modify local ignored SQLite database through `scripts/seed-demos.ts`.
- Create: `public/chungdoi/images/template-previews/en/{listing,portrait,landscape}/{editorial_noir,ticket_terracotta,zen_sand,arch_sage}.webp`
- Modify: `src/data/template-preview-version.ts` when the capture script updates it.

- [ ] Run `npx tsx scripts/seed-demos.ts` and verify all four `demo-<slug>` records exist with content.
- [ ] Run `npm run screenshots:templates -- --slug editorial-noir,ticket-terracotta,zen-sand,arch-sage --no-sync-production`.
- [ ] Inspect generated previews for blank pages, clipping, missing media, and layout duplication.
- [ ] Re-run the targeted audit and confirm it passes.

### Task 5: Full verification and branch handoff

**Files:**
- Review all changed files from `git diff --stat` and `git diff --check`.

- [ ] Run `npm run check` with a safe local production URL override if required by the repository guard.
- [ ] Run targeted browser checks for all four Vietnamese demo routes at mobile and desktop widths.
- [ ] Confirm the database has four seedable demos and all twelve previews are valid WebP files.
- [ ] Review `git status`, summarize results, and use the finishing-development-branch workflow to ask how the user wants the feature branch integrated.

<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

> Scope for the rule above: `node_modules/next/dist/docs/` is 423 files / 3.6MB. Read only the one guide covering the API you are about to touch, and only when this repo has no existing example of it. Following an existing pattern in `src/app/` is cheaper and usually sufficient. Skip it entirely for edits that do not touch Next APIs (styling, copy, component internals, data files).

# Chungdoi — Wedding Invitation App

## What This Is
A web app for creating and sharing digital wedding invitations (thiệp cưới). Users pick a template, customize couple/family/event details in an editor, and publish a shareable invitation page. Supports multiple languages and multiple visual themes.

## Tech Stack
- **Framework:** Next.js 16 (App Router, React 19, TypeScript strict)
- **UI:** shadcn/ui (Radix primitives, Tailwind CSS v4, `cn()` utility)
- **Styling:** Tailwind CSS v4 with oklch design tokens
- **Icons:** Lucide React
- **Database:** Prisma 7 + SQLite (better-sqlite3 adapter)
- **Auth:** session-based (`jose` JWT, `bcryptjs` password hashing)
- **i18n:** next-intl — Vietnamese only (`messages/vi.json`). en/ko/ja/zh were removed; `src/i18n/routing.ts` serves `vi` with no URL prefix and every other prefix 404s. Copy still goes through the catalog, so do not hardcode strings.
- **Deployment:** minipc / Docker (see `docs/deploy-minipc.md`)

## Commands
- `npm run dev` — Start dev server
- `npm run build` — Production build. **Fails locally on purpose**: `next build` forces `NODE_ENV=production` and `src/lib/site-url.ts` rejects the `http://localhost` value in `.env.local`. CI and Docker pass a real HTTPS `NEXT_PUBLIC_SITE_URL`, so this script stays untouched.
- `npm run build:local` — Same build with `ALLOW_INSECURE_SITE_URL=1`. Use this one locally; the failure above is not a bug to fix.
- `npm run lint` — ESLint check (fastest gate, run this first)
- `npm run typecheck` — TypeScript check for `src/`
- `npm run typecheck:tests` — TypeScript check for `tests/`
- `npm run test:unit` — Unit tests (`src/**/*.test.ts` via tsx)
- `npm run check` — lint + typecheck + typecheck:tests + test:unit + build:local. Slow; use only as the final gate.
- `npm run test:e2e` — Playwright E2E. Target one spec (`npx playwright test tests/e2e/<file>`) instead of the whole suite.
- `npm run prisma:migrate` — Run Prisma migrations (dev)
- `npm run prisma:generate` — Regenerate Prisma client
- `npm run test:lightbox` — Playwright check for the demo lightbox
- `npm run deploy` — Deploy to minipc (`scripts/deploy-fast.sh`, helpers in `scripts/lib/`). `deploy:smoke` runs smoke checks only, `deploy:setup` provisions the host once, `deploy:legacy` is the old `deploy-minipc.sh` path. Details in `docs/deploy-minipc.md`.

## Code Style
- TypeScript strict mode, no `any`
- Named exports, PascalCase components, camelCase utils
- Tailwind utility classes, no inline styles
- 2-space indentation
- Responsive: mobile-first
- All user-facing copy goes through next-intl message catalogs (`messages/*.json`), never hardcoded

## Project Structure
```
src/
  app/
    (auth)/         # login, signup, auth actions
    [locale]/       # public localized pages (home, pricing, blog, help, templates, policies, tools)
    api/            # route handlers
    dashboard/      # authenticated user dashboard
    editor/[id]/    # invitation editor
    thiep/          # published invitation pages
  components/       # React components (chungdoi-*.tsx) + ui/ (shadcn primitives)
  data/             # invitation content, demo content, theme config
  generated/prisma/ # generated Prisma client (do not edit)
  hooks/            # custom React hooks
  i18n/             # next-intl config
  lib/              # dal.ts, prisma.ts, session.ts, utils.ts
  types/            # TypeScript interfaces
prisma/
  schema.prisma     # DB schema
  migrations/       # DB migrations
messages/           # i18n catalogs: vi, en, ko, ja, zh
public/chungdoi/    # fonts, images, music, uploads, icons
docs/               # deploy guides + research notes
```

## Notes
- `dev.db` and `prisma/*.db` are gitignored — the SQLite database is local only.
- Files in `src/data/` marked `// Auto-generated` were seeded from research crawls; edit them directly. The crawl scripts they name (e.g. `scripts/crawl-chungdoi-demo-content.mjs`) no longer exist — do not go looking for them.
- Some Prisma writes are wrapped in a data-access layer (`src/lib/dal.ts`) — prefer it over calling the client directly from components.
- `public/chungdoi/images/template-previews/en/` is **not** a locale folder. It is a legacy directory name inherited from the cloned source and is the only preview directory; leave the path alone.

## Reference Docs — Read On Demand Only
Do NOT read these unless the current task actually needs them. They are large and cost a lot of context.
- `docs/research/INSPECTION_GUIDE.md` (36KB) — checklist for reverse-engineering a target website. Only for crawl/clone-a-template tasks.
- `docs/research/DISTINCTIVE_TEMPLATE_ROADMAP.md` (50KB) — template roadmap.
- `docs/research/asset-provenance.md` (57KB) — where each public asset came from.
- `docs/deploy-minipc.md` — deployment. Read before touching deploy scripts.
- `docs/superpowers/plans/*.md` — historical plan docs, some 80-175KB. Skim by heading, never read whole.

## Context Efficiency Rules
These matter: the repo has several files big enough to blow a context window in one read.

**Never read whole; jump to the section you need:**

| File | Size | How to navigate |
|---|---|---|
| `src/app/editor/[id]/EditorForm.tsx` | 3488 lines | Field components ~370-1740, `EditorFormBody` 1737-2765, `DemoEditorFormBody` 2766-3420, `EditorForm` export 3421+. Grep the field label first. |
| `src/data/chungdoi-demo-content.ts` | 4422 lines | Type `ChungDoiDemoContent` at top (~lines 1-300); rest is data. Read the type only. |
| `messages/vi.json` | 131KB | Grep the message key, then read that namespace's line range. Top keys: `home`, `weddingGuide`, `templateSeoFacets`, `listing`, `guestManager`, `templateStudio`, `editor`. |
| `src/components/chungdoi-demo.tsx` | 1986 lines | Grep the section name. |
| `src/data/chungdoi-theme-config.ts` | 1776 lines | Keyed by template id — grep the id. |
| `tests/e2e/forest-wedding-journey-lab.spec.ts` | 3288 lines | Grep the test name. |

**Never read or search these (generated, duplicated, or disposable):**
- `src/generated/prisma/**` — generated client, some files 100-176KB. Import types from it, never open it.
- `.deploy-worktree/` — full duplicate of the source tree. Any hit here is a false positive.
- `.next/`, `tmp/`, `temp/`, `.playwright-mcp/`, `.capture/`, `tests/e2e/.report/`, `.claude-flow/logs/`
- `docs/research/original-dom/`, `docs/research/templates/` — raw crawl dumps.

**Verification order — cheapest first.** Run `npm run lint` and `npm run typecheck` before reaching for `npm run check`; a full build of 48 pages × 5 locales produces a long log. When a command output is long, pipe it (`2>&1 | tail -40`).

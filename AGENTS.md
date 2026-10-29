<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

> Scope for the rule above: `node_modules/next/dist/docs/` is 423 files / 3.6MB. Read only the one guide covering the API you are about to touch, and only when this repo has no existing example of it. Following an existing pattern in `src/app/` is cheaper and usually sufficient. Skip it entirely for edits that do not touch Next APIs (styling, copy, component internals, data files).

# Chungdoi — Wedding Invitation App

Vietnamese digital wedding invitations: choose a template, edit couple/family/event details, publish a shareable page. Next.js 16 / React 19 / TypeScript strict, Tailwind v4, shadcn primitives, Lucide, Prisma 7 + SQLite (`better-sqlite3`), session auth (`jose`, `bcryptjs`).

## Read less, follow the active code

- Begin with `git status --short`. Preserve unrelated changes.
- Use [docs/ai-context-map.md](docs/ai-context-map.md) only for the task's feature row. Do not read every linked file.
- Find paths in the relevant directory (`rg --files src/components/editor2`), locate symbols (`rg -n`), then read a small surrounding range. Avoid whole-repo content searches and entire large files.
- `.rgignore` excludes historical research/plans, Git internals, logs, minified bundles and the lockfile from default ripgrep searches. For relevant history, pass an explicit file or use `rg --no-ignore-dot` with a narrow path. Never use root-wide `--no-ignore` / `-uuu`. Other search tools must use the same exclusions explicitly.
- Start with the app route in `src/` and follow imports. `packages/` contains overlapping code but is also used directly by the app. Do not delete it, read both copies by default, or assume matching filenames have the same runtime consumers.
- Do not output environment files, databases, agent memory or deployment receipts. Keep verbose command output in temporary logs and show only relevant failures / a short tail.

## Wedding Invitation Agent Rules

For any task that creates, clones, redesigns, or materially changes the UI, assets, sections, or presentation flow of a wedding invitation template, read [docs/wedding-invitation-agent-rules.md](docs/wedding-invitation-agent-rules.md) **before planning, inspecting, or editing**. Do not read it for unrelated work. Its rules apply in addition to this file.

Before cloning a template or correcting visual fidelity, also read [docs/template-clone-quality.md](docs/template-clone-quality.md) and apply its inspection, implementation and visual acceptance checklist:

- Inspect the complete reference on desktop and mobile, including opening cover, calendar, guestbook, gift envelope and footer. Record each decoration's containing block; do not copy percentage offsets without checking parent dimensions.
- Reuse shared behavior, but match each template's artwork and styles explicitly. Do not fall back silently to generic gift artwork or forms.
- Compare every section at matching viewport, zoom, scroll and interaction state. Record evidence and unverified differences in a per-template research note. Lint/typecheck do not establish visual fidelity; incomplete visual checks must not be marked passed.

## Commands and verification

Use pnpm for dependencies; `pnpm-lock.yaml` and `pnpm-workspace.yaml` are authoritative. `npm run` works with installed dependencies.

- `npm run dev`: development server.
- `npm run lint`: first application-code gate; then `npm run typecheck` (`src/`).
- `npm run typecheck:tests`: test types. `npm run test:unit`: `src/**/*.test.ts` via tsx.
- `npx playwright test tests/e2e/<file>`: target relevant E2E specs instead of the whole suite. `npm run test:lightbox`: demo lightbox checks.
- `npm run build:local`: local production build with `ALLOW_INSECURE_SITE_URL=1`. Plain `npm run build` deliberately rejects the localhost URL in `.env.local`; CI/Docker pass real HTTPS `NEXT_PUBLIC_SITE_URL`. Do not change this safeguard.
- `npm run check`: lint + both typechecks + unit tests + local build; use only as a final gate when appropriate. Do not build for documentation/search-filter-only edits.
- `npm run prisma:migrate` / `npm run prisma:generate`: dev migrations / generated client.
- `npm run deploy`: current VPS pipeline (`scripts/deploy-vps.sh`, `scripts/deploy-fast.sh`). Read [docs/deploy-vps.md](docs/deploy-vps.md) first; requires at least 6 GiB free before build. `deploy:smoke` checks production; `deploy:setup` checks provisioning/timers. `deploy:legacy` is guarded and retired.

Production is VPS `163.61.110.34`; `163.223.9.198` and the minipc deployment are retired. Historical deployment documents are not current instructions.

## Code and structure

- Named exports, PascalCase components, camelCase utilities, strict TypeScript without `any`, two-space indentation.
- Mobile-first Tailwind utility classes with oklch tokens and `cn()`; no inline styles.
- All user-visible copy uses next-intl `messages/vi.json`. Vietnamese only: `src/i18n/routing.ts` serves `vi` without a URL prefix; other locale prefixes 404. Do not restore removed en/ko/ja/zh catalogs.
- Routes live in `src/app/`: `(auth)/`, `[locale]/`, `dashboard/`, `admin/`, `editor/[id]/`, `editor2/`, `thiep/`, `api/`. Shared UI is in `src/components/`; data/theme configs in `src/data/`; utilities/DAL/session in `src/lib/`; hooks/types in their own directories.
- Prefer existing data access in `src/lib/dal.ts` over direct Prisma writes from components. Schema/migrations are in `prisma/`; never edit or read generated `src/generated/prisma/` client files. Import their types instead.
- `src/data/` files marked auto-generated were seeded from research crawls and may be edited directly. The old crawl scripts named there no longer exist; do not search for them.
- SQLite files and uploads are local/operational data, not source. `public/chungdoi/images/template-previews/en/` is a legacy asset directory, not a locale; preserve its path.
- `CLAUDE.md` / `GEMINI.md` reference this file; keep a single instruction source.

## Large files and opt-in material

Do not read these whole. Use symbol/key searches instead of fixed line numbers, which drift:

| File | Locate first |
|---|---|
| `src/app/editor/[id]/EditorForm.tsx` | Field label, `EditorFormBody`, `DemoEditorFormBody` |
| `src/components/editor2/workspace.tsx` | Save/publish handler or panel name |
| `src/data/chungdoi-demo-content.ts` | `ChungDoiDemoContent` type or template ID |
| `src/data/chungdoi-theme-config.ts` | Template ID |
| `src/components/chungdoi-demo.tsx` | Section/component name |
| `messages/vi.json` | Requested namespace/key; extract that subtree only |
| `tests/e2e/editor2.spec.ts`, `tests/e2e/forest-wedding-journey-lab.spec.ts` | Matching test title |

Read research notes only when the feature needs them. `docs/research/INSPECTION_GUIDE.md` is for crawl/clone work; `DISTINCTIVE_TEMPLATE_ROADMAP.md` for roadmap work; `asset-provenance.md` for asset origins. `docs/superpowers/` contains historical plans/specs, not current requirements.

Do not search/read generated or disposable trees: `.git/`, `node_modules/` (except the specific Next guide above), `.next*/`, `.deploy-worktree/`, `.worktrees/`, `.codegraph/`, `tmp/`, `temp/`, `.playwright-mcp/`, `.capture/`, test artifacts/reports, `.claude-flow/`, `docs/research/original-dom/`, `docs/research/templates/`. Do not delete active worktrees or real user data as a context optimization.

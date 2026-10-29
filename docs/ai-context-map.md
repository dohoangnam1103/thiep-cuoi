# AI context map

Use this as an index, not a reading list. Read only the row relevant to the task, then follow imports. Paths below are relative to the repository root.

## Feature entry points

| Task | Start here | Focused verification / notes |
|---|---|---|
| Editor2 save, autosave, modal sequence, publish, share | `src/components/editor2/workspace.tsx`, `src/app/editor2/actions.ts`, `src/lib/editor2-publication.ts` | `tests/e2e/editor2-save-feedback.spec.ts`, `tests/e2e/editor2.spec.ts`; search for the affected test name |
| Editor2 first visit / creation defaults | `src/components/editor2/start.tsx`, `src/lib/editor2-defaults.ts`, `src/lib/editor2-starter.ts` | Corresponding `src/lib/*.test.ts` |
| Editor2 venue and date fields | `src/components/editor2/venue-fields.tsx`, `src/components/editor2/date-field.tsx` | `tests/e2e/helpers/editor2-date.ts`, date cases in `tests/e2e/editor2.spec.ts` |
| Old editor | `src/app/editor/[id]/EditorForm.tsx`, `src/app/editor/[id]/actions.ts` | Locate a field/component with `rg -n` before reading a slice |
| Date formatting throughout the app | `src/lib/calendar-date.ts` → `packages/invitation-data/src/calendar-date.ts`, `src/components/ui/date-input.tsx` | `src/lib/calendar-date.test.ts`; storage values and display labels have different formats |
| Image upload / WebP compression | `src/lib/compress-upload-image.ts`, `src/app/api/upload/route.ts`, `src/lib/process-uploaded-image.ts` | `tests/e2e/image-upload-compression.spec.ts`, `src/lib/process-uploaded-image.test.ts` |
| Public invitation rendering | `src/components/template-renderer-entry.ts`, `src/components/generated/template-renderers.tsx`, `src/components/chungdoi-demo.tsx` | Follow the selected template's imports; read `docs/wedding-invitation-agent-rules.md` first when changing invitation presentation |
| Invitation data / styling | `src/data/chungdoi-demo-content.ts`, `src/data/chungdoi-theme-config.ts`, selected `src/components/chungdoi-tpl-*` | Search by template ID; do not load the entire catalog |
| Admin invitation editing | `src/app/admin/invitations/[id]/edit/page.tsx`, adjacent `actions.ts` | Follow form and data-access imports |
| Copy / translations | `messages/vi.json` | Extract only the requested namespace, e.g. `node -e 'const m=require("./messages/vi.json"); console.log(JSON.stringify(m.editor2,null,2))'` |
| Production deploy | `docs/deploy-vps.md`, then `scripts/deploy-vps.sh` / `scripts/deploy-fast.sh` | Use the current VPS instructions; historical deployment documents are not the runbook |

## Source copies and workspace packages

`src/` and `packages/` contain overlapping invitation implementations from a partial extraction. Neither directory can be deleted wholesale. The root `package.json`, `tsconfig.json` aliases and the packages' `exports` determine which implementation an import uses.

Known direct app consumers include:

- `src/lib/calendar-date.ts` re-exports the implementation in `@chungdoi/invitation-data/calendar-date`.
- `src/components/chungdoi-tpl-jasmine-white.tsx` uses `@chungdoi/invitation-core/signature`.

Start with the route/component in `src/`, follow its import to the implementation, and inspect the matching package copy only when that import or the task requires it. Search both copies for regressions when changing shared behavior; do not edit both solely because filenames match.

## Small, scoped reads

```sh
# Find paths, then locate a symbol, then read only its surrounding code.
rg --files src/components/editor2 src/lib | rg 'workspace|publication'
rg -n 'saveNow|persistDraft|publishVisualInvitation' src/components/editor2/workspace.tsx
sed -n '180,260p' src/components/editor2/workspace.tsx

# History is excluded from broad searches, but a specific file is still readable.
rg -n 'save|toast' docs/research/editor2-save-feedback.md
# Discover filenames in one historical area while honoring .gitignore.
rg --no-ignore-dot --files docs/research -g '*save-feedback*'
```

`.rgignore` changes ripgrep search defaults. It does not alter Git tracking, TypeScript, builds, or guarantee filtering by every AI/indexing tool. Explicit file reads still work. Keep workspace packages searchable. Use narrow paths with `--no-ignore-dot` when history or the lockfile is relevant; avoid repository-wide `--no-ignore` / `-uuu`.

Build caches, uploads, SQLite files, screenshots and extra worktrees mainly consume disk. Deleting them does not directly recover chat context. Keep real user data and active worktrees intact. Do not print environment files, databases, agent memory or deployment receipts to investigate context usage.

For command results, write verbose output to a temporary log and report the relevant failure or a short tail. Do not paste complete lint, build or test logs into the conversation.

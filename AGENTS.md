<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

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
- **i18n:** next-intl — vi (default), en, ko, ja, zh
- **Deployment:** minipc / Docker (see `docs/deploy-minipc.md`)

## Commands
- `npm run dev` — Start dev server
- `npm run build` — Production build
- `npm run lint` — ESLint check
- `npm run typecheck` — TypeScript check
- `npm run check` — Run lint + typecheck + build
- `npm run prisma:migrate` — Run Prisma migrations (dev)
- `npm run prisma:generate` — Regenerate Prisma client
- `npm run test:lightbox` — Playwright check for the demo lightbox

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
- Files in `src/data/` marked `// Auto-generated` were seeded from research crawls; edit them directly, there is no regeneration script anymore.
- Some Prisma writes are wrapped in a data-access layer (`src/lib/dal.ts`) — prefer it over calling the client directly from components.

@docs/research/INSPECTION_GUIDE.md

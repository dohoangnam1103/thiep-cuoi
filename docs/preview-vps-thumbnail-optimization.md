# VPS preview: thumbnail optimization — 2026-08-30

Scope: only the preview at `https://cole-hrs-representatives-lot.trycloudflare.com` on
`163.223.9.198`. Production domain/DNS, production database, minipc services and
the existing `lv-clone.service` were not changed.

## Deployed changes

- Gateway preserves explicitly public cache policies for approved static asset
  paths and their Next image variants. HTML, dashboard, API responses, raw uploads,
  errors, authenticated responses and responses with Set-Cookie remain no-store.
  Noindex, blocked integration routes and app authentication remain intact.
- Desktop listing uses pre-generated, top-cropped WebP variants rather than
  downloading a full-page screenshot. Original composition and the 460px card
  window are preserved. Full-page images load only on mouse hover or desktop
  keyboard focus; the thumbnail remains visible while the long image loads.
- The 40 mobile thumbnail overrides already published in the listing have their
  own pre-generated variants. Admin selections are preserved. Only these public
  images were fetched, not the uploads directory or database. Unknown/new overrides
  fall back to the original Next image path until the next preparation run.
- The first card is eager/high-priority. Other first-row images have media-scoped
  desktop preloads; offscreen mobile cards remain lazy. Picture art direction
  avoids fetching both desktop and mobile assets. Corrected sizes reflect actual
  card widths, including high-DPR mobile screens.
- Content-addressed filenames prevent stale generated thumbnails. Existing server
  image cache and old hashed JS/CSS files were retained during promotion.

No runtime resize is necessary for a prepared thumbnail, even if the Next image
cache is empty. Full-page hover/modal images and newly added mobile overrides can
still incur an optimizer miss; there is no claim that every image route is now static.

## Measured results

Fresh isolated Chromium contexts, desktop 1440×1000 DPR2, no CPU/network throttling.
The server's original full-image cache was already warm for the baseline.

| Metric | Baseline | Optimized final build |
| --- | ---: | ---: |
| Initially fetched desktop thumbnails | 12 | 12 |
| Thumbnail payload | 2,042,554 B | 740,822 B (−63.7%) |
| LCP | 2,372 ms | 1,129 ms |
| LCP resource discovery delay | 702 ms | 6 ms |
| Last initial thumbnail finished | 2,744 ms | 1,534 ms |
| CLS | 0 | 0 |
| Repeat-navigation thumbnail transfer | previously re-downloaded | 0 B, 12/12 cache hits |

An earlier intermediate optimized build measured LCP 1,785 ms. Navigation TTFB
varied from 559–1,203 ms across final mobile/desktop runs; network/tunnel timing
is not controlled. These are lab samples, not field p75 or a guaranteed speedup.

Mobile final: 390×844 DPR3, LCP 1,889 ms, CLS 0, no horizontal overflow.
Three nearby mobile thumbnails total 277,696 B; no desktop thumbnails or hidden
full-page images load initially. Repeat navigation: all three served from browser
cache, 0 B image transfer. Mobile quality was preserved at WebP 82, not reduced to
force a smaller byte count. Screenshot inspection confirmed the admin-selected art.

## Verification

- Production build and TypeScript succeeded in a separate source snapshot copied
  read-only from the deployed release. Local unpublished V11 changes were excluded.
- `npm run typecheck`, `npm run typecheck:tests`, six thumbnail unit tests and two
  gateway policy unit tests pass. Focused ESLint on changed files passes.
- Full repository lint was attempted but fails outside this change set, including
  an existing `react-hooks/set-state-in-effect` error in `chungdoi-tpl-shared.tsx`
  and many unrelated files. Those files were not changed for this optimization.
- Browser checks: matching desktop composition, real mobile overrides, hover
  scroll, keyboard-triggered full image, modal open on desktop/mobile, and caching.
  Listing load had no console errors/warnings. Opening the existing modal can emit
  its existing aria-hidden/focus warning; modal focus handling was not redesigned.
- Public smoke checks pass for listing, home, JS/CSS, thumbnail, demo, login,
  auth/session, unauthenticated dashboard redirect and blocked payment/cron routes.
- A bounded origin-only check used 1, 3 then 5 concurrent visitors, each fetching
  one listing and four thumbnails (45 requests total). All responses succeeded;
  batch times 300, 632 and 1,248 ms. This is not a sustained capacity benchmark.
- Preview cgroup memory stayed below its limits: ~388 MB after that check,
  memory.events high/max/oom/oom_kill all zero. Existing app PID remained 70311,
  NRestarts 0, HTTP 200. CPU/RAM caps were not increased.

## Build / deploy notes

Current deployment ID: `preview-thumb-mobile-opt-20260830`.
Build workspace used: `/tmp/thiepmung-preview-opt.llKGrH` (disposable, no production
secrets or production database copied). Runtime remains at
`/srv/thiepmungonline-preview/app`, with its original native Linux dependencies,
preview database and isolated environment files.

`npm run build` and `npm run build:local` now regenerate desktop thumbnail assets
incrementally through their prebuild hooks. For public mobile overrides, run on
the build machine before building:

```bash
LISTING_THUMBNAIL_ORIGIN=https://cole-hrs-representatives-lot.trycloudflare.com npm run thumbnails:mobile
```

Keep the generated JSON manifests and corresponding public assets together.
Mobile preparation is explicit because it fetches currently public remote images;
ordinary offline builds do not contact the preview or production domain.

Only standalone `.next` artifacts, `server.js` and prepared public image assets
were promoted. Never transfer Mac `node_modules` to the Linux VPS. No migrations
were run on either server database. Prisma migrations during build setup targeted
only the empty disposable `build.db` on the Mac.

Preview services remain temporary/not enabled at boot. The tunnel was not
restarted; its public URL is unchanged. No background backup was enabled.

## Operations / rollback

Remote validation:

```bash
/srv/thiepmungonline-preview/bin/node /srv/thiepmungonline-preview/control/verify-preview.mjs http://127.0.0.1:3210
```

Original pre-optimization app artifact:
`/srv/thiepmungonline-preview/releases/pre-thumbnail-opt-20260830`.
Immediate previous desktop-only optimized artifact:
`/srv/thiepmungonline-preview/releases/before-20260830-thumbnail-opt-mobile`.
Original gateway:
`/srv/thiepmungonline-preview/control/preview-gateway.pre-optimization-20260830.cjs`.

To roll back, stop only `thiepmungonline-preview.service`, preserve the current
`app/.next` under a new release name, restore the chosen backup's `.next` and
`server.js`, then start that service and run smoke checks. Do not replace
`app/data`, `control/app.env`, native dependencies or the tunnel. Restoring the
original gateway is optional and would reintroduce the no-store asset issue.
Prepared public files may remain during rollback; old bundles do not reference them.

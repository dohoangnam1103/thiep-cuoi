# Long–Hậu: share thumbnail inspection and fix

Inspected on 2026-10-26 (Asia/Ho_Chi_Minh).

Reference: https://thiepmungonline.com/thiep/long-hau-wedding

## Scope and acceptance

Only the public share metadata and its 1200 × 630 PNG are in scope. This is
not a template clone or redesign of the invitation page. Editor, saving,
publishing, authentication, guest tokens, invitation sections, RSVP and gift
flows remain unchanged. Existing public invitation and image endpoints remain
compatible; only the image URL in metadata gains a content version query.

Accept when the image shows the bride, `&`, and groom on three independent
lines, dates remain calendar dates, edits change the share image URL, and share
crawlers receive one complete image declaration in the initial HTML head and
can fetch a valid PNG without authentication.

## Inspection evidence

- Live invitation data: `couple.date = "2026-12-06"`,
  `couple.ceremonyDate = "2026-12-06"`; the ceremony list also has that date.
- Bride: Lê Thị Hậu. Groom: Lê Văn Long. `brideFirst = false` on the invitation.
  The requested thumbnail order is explicitly bride first, regardless of that
  page setting. The page title continues to respect the invitation setting.
- The live PNG downloaded during inspection displayed `2026-12-06`, not day 5.
  Day 5 could not be reproduced. The old image URL contained only Next's file
  hash, which does not change when a customer edits the date or names. Stale
  platform cache is a hypothesis, not a confirmed historical cause.
- The downloaded old PNG wrapped the text as `Lê Văn Long & Lê` / `Thị Hậu`.
- Requests using `facebookexternalhit/1.1`, `Facebot`, and a Zalo user-agent
  returned HTTP 200 HTML with an image in the head. The image returned HTTP 200,
  `image/png`, 151048 bytes, 1200 × 630. `robots.txt` allows `/thiep/`.
  This verifies responses to those user-agent strings from this workstation;
  it does not establish reachability from Meta's own crawler infrastructure.
- Meta Sharing Debugger was opened for this exact URL. It says
  "Log into Facebook to use this tool." No authenticated scrape report was
  available, so the Facebook preview's root cause remains unconfirmed.

## Surface, data and asset inventory

| Surface | Owner / source | Presentation and behavior |
| --- | --- | --- |
| Thumbnail names | `src/lib/og-image.ts`, `src/app/thiep/[slug]/opengraph-image.tsx`; published content short/full names | Separate bride / ampersand / groom rows; trim whitespace, fall back to full names, omit empty rows; shrink longer names and prevent automatic wrapping |
| Thumbnail date | Published `InvitationContent.date` | ISO calendar date becomes `DD.MM.YYYY` by string extraction; no timezone conversion; retain free text and omit empty date |
| Thumbnail styling | Existing `resolveOgTheme` and `resolveOgFont` | Retain theme colors, decorations and font mapping; retain static Viaoda Libre fallback for unsupported Lora font |
| Card geometry | Existing PNG renderer | Fixed 1200 × 630 canvas; centered 1000 × 550 card; padding 40 × 56; radius 28; names at most 88px, ampersand 48px, date 40px |
| Share metadata | `src/app/thiep/[slug]/page.tsx` | Absolute image URL, secure URL, PNG type, 1200 × 630, translated alt, Vietnamese locale; same image on Twitter metadata |
| Copy | `messages/vi.json`, `publicInvitation.metadata` | Existing metadata copy moved into the translation catalog |

Decorations retain their original four 280 × 280 corner containing blocks,
opacity 0.18, and paths from theme config. Fonts remain the original local
assets under `public/chungdoi/fonts/`. No assets were added, replaced, or
downloaded into the product. Thumbnail generation continues to omit decoration
files that cannot be read, and retains the existing branded fallback when
published content is absent. No new controls, motion, or interaction states.

The thumbnail is a fixed raster image on desktop, tablet and mobile; viewport
breakpoints do not change its internal composition. Platform cropping and
actual Facebook/Zalo client layouts are outside the locally verified surface.

## Phase report

```text
PHASE: inspect
STATUS: complete
CHANGED: none
VERIFIED: live HTML/data, original PNG, Facebook/Facebot/Zalo user-agent requests, robots, existing date and name mapping
UNVERIFIED: historical day-5 thumbnail, authenticated Facebook scrape report
RISKS: platform cache or crawler-network restrictions cannot be established from a simulated user-agent
NEXT: plan targeted share-image fix

PHASE: plan
STATUS: complete
CHANGED: none
VERIFIED: scope restricted to thumbnail renderer, metadata, helpers, translation catalog and tests
UNVERIFIED: platform previews after deployment
RISKS: changing image URL does not itself force a platform to re-fetch already cached page metadata
NEXT: implement independent name rows and content-versioned image metadata

PHASE: implement
STATUS: complete
CHANGED: src/lib/og-image.ts; src/app/thiep/[slug]/opengraph-image.tsx; src/app/thiep/[slug]/page.tsx; messages/vi.json; src/lib/og-image.test.ts; tests/e2e/invitation-share.spec.ts
VERIFIED: primary date is read without timezone conversion; names and theme determine image version; existing invitation URLs remain unchanged
UNVERIFIED: none within the implementation scope
RISKS: existing Facebook page cache may need a new scrape
NEXT: verify production renderer and inspect PNGs

PHASE: verify
STATUS: complete
CHANGED: none
VERIFIED: production PNGs visually inspected for Long–Hậu and two long full names; bride / ampersand / groom have independent rows; 06.12.2026 visible; no clipped text
UNVERIFIED: platform-specific cropping and real Facebook/Zalo preview clients
RISKS: a fixed raster image cannot control how each platform crops its preview
NEXT: complete regression checks and document evidence

PHASE: regression
STATUS: complete
CHANGED: docs/research/long-hau-wedding-share-thumbnail.md
VERIFIED: lint, source and test typechecks, 15 targeted unit tests, targeted Playwright test, production build, PNG dimensions and crawler access; git diff --check
UNVERIFIED: deployment, authenticated Meta Sharing Debugger report, actual Facebook/Zalo clients
RISKS: platform page cache may require a fresh scrape after deployment; Facebook issue not yet confirmed resolved
NEXT: deploy through the normal release workflow, then inspect the exact public URL in Meta Sharing Debugger with an authenticated account
```

## Verification

- `npm run lint`: passed, 0 errors; 401 existing project warnings.
- `npm run typecheck`: passed.
- `npm run typecheck:tests`: passed.
- `npx tsx --test src/lib/og-image.test.ts`: 15 passed.
- Targeted Playwright spec builds and starts production Next.js with an
  isolated database and the documented insecure-site-URL test opt-in.
  It checks both date changes (5 → 6) and actual PNG byte changes, image URL
  versioning, exactly one complete image declaration in the initial head,
  accessibility to Facebook/Facebot/Meta fetcher/Zalo user-agent strings,
  image format/dimensions/size, long names, and the previous image endpoint.
  Result: 1 passed. A second run with saved PNG artifacts also passed.
- Targeted ESLint on all changed TypeScript files: 0 errors, one pre-existing
  decorative-image alt warning in the OG route.
- Visual review: both saved PNGs show the three requested name rows and
  `06.12.2026`; long full names stay on independent single rows.
- PNG evidence (Playwright output, ignored by Git):
  `tests/e2e/.artifacts/invitation-share-share-cra-34d2a-shes-after-editing-the-date-chromium/long-hau-share-06-12-2026.png`
  and the adjacent `long-names-share.png`.
- Live pre-fix downloads and response evidence were retained in this session at
  `/tmp/long-hau-facebook.png`, `/tmp/long-hau-facebook.html`, and
  `/tmp/long-hau-headers.txt`.
- Full invitation desktop/mobile interactions: not applicable to this narrow
  metadata/thumbnail change. No template layout or client behavior was edited.
- Deployment and real Facebook/Zalo client previews: not performed.

## Production deployment and verification — 2026-10-26

This supersedes the pre-deployment status above. The user explicitly authorized
commit, push, and production deployment after reviewing the local result.

- Application commit: `ff472d51250bc260dec1745047d0e9b0acb5e243`, pushed to
  `origin/codex/remove-site-2`.
- Deployed through `npm run deploy` to `163.61.110.34`, deployment ID
  `20261026060523`, release `20261026060523-67289`.
- Initial local preflight stopped because Chromium was missing. Installed it
  with `npx playwright install chromium`, then reran the unchanged pipeline.
- All 131 mandatory browser gate checks passed; production build, source sync,
  verified database backup, image assembly and activation completed. No schema
  migration or track seeding was needed.
- Running image:
  `sha256:f698e83b96467e374010dac9c906e2193075d2b48da0ce2a051a588a79b21ffe`.
  Container health is `healthy`; deployment lock released. Origin checks,
  public home/demo checks, assets, database and scheduler verification passed.
- The exact Long–Hậu public URL returns one versioned image declaration in
  the initial HTML head, including secure URL, dimensions and matching Twitter
  image. Facebook and Zalo user-agent requests both received page HTTP 200 and
  image HTTP 200, `image/png`, 1200 × 630, 114639 bytes.
- Live image URL:
  https://thiepmungonline.com/thiep/long-hau-wedding/opengraph-image?v=f54551abee15afe7
- Live PNG SHA-256 (identical for both user-agents):
  `33d8293572416a03022b65739fdb9064c8cf599fb45782798d065be768c6efd8`.
- Visually inspected the live PNG: Lê Thị Hậu, `&`, Lê Văn Long are on separate
  rows; date is `06.12.2026`; no clipped text. Session evidence:
  `/tmp/long-hau-share-live-facebook.png`,
  `/tmp/long-hau-live-verification.jsonl`,
  `/tmp/long-hau-thumbnail-deploy.log`.
- Actual Facebook/Zalo client previews and authenticated Meta cache refresh
  remain unverified. A platform with old page metadata may still require a
  fresh scrape in Sharing Debugger; successful user-agent checks do not prove
  the platform has refreshed its own cache.

```text
PHASE: regression
STATUS: complete
CHANGED: production release and this deployment record
VERIFIED: commit pushed; 131 browser checks; build; backup; production healthy; public Long–Hậu HTML/PNG; live image visual review; deployment lock released
UNVERIFIED: authenticated Meta Sharing Debugger report and actual Facebook/Zalo client previews
RISKS: previously cached platform page metadata may require a fresh scrape
NEXT: use authenticated Meta Sharing Debugger if Facebook still displays a stale or missing preview
```

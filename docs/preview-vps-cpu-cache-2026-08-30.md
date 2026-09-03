# Preview VPS — public HTML cache, polling and i18n

Deployed 2026-08-30, deployment ID `preview-cpu-cache-20260830`, to
<https://cole-hrs-representatives-lot.trycloudflare.com> on `163.223.9.198`.

## Scope and behavior

1. Home and pricing use Next's internal Full Route Cache with a 300-second
   revalidation interval. Paths generate on the first runtime request, not from
   the build machine's SQLite database. Admin price/name/thumbnail actions
   invalidate the relevant data and route entries. Runtime-only name/thumbnail
   reads throw on DB errors rather than caching a fallback after a failed read.
2. Sample demos use the same internal HTML cache. Admin demo saves invalidate the
   existing demo-data tag and HTML; name changes also invalidate demo metadata.
   The cover toggle invalidates its data tag and the route tree. Legacy
   `?capture=1` redirects to a separate dynamic `/demo/capture` route with noindex,
   no cover and no creation CTA; it cannot populate the ordinary demo cache.
3. Payment polling is sequential, pauses/aborts while hidden, refreshes on return,
   and uses 4s / 8s / 15s delays after completion as elapsed time increases
   (<1min / 1–3min / >3min). Errors back off to at most 30s; each request has a
   10s timeout. A bounded, per-process gate coalesces concurrent payOS lookups
   for the same payment and imposes a 15s cooldown after completion. Every status
   request still verifies ownership and reads SQLite; payment status is not
   cached. Webhooks and the reconciliation cron are unchanged.
4. Home, pricing, sample demos and published invitations receive selected client
   translation namespaces. The shared invitation/wish components no longer
   import the entire catalog into client JS. Other route groups retain their
   full catalog for compatibility. The root keeps the small error-boundary
   namespace so segment errors remain translated.

No persistent cache was added to `/thiep/...`. Its published content, guest
personalization, wishes and RSVP handling remain dynamic. Listing `/mau-thiep`
keeps its existing dynamic behavior; its only new wrapper restores its original
full translation context after scoping the parent layout.

The preview gateway still sends **private, no-store for HTML**. These savings
come from the server's internal Next cache, not a new browser/CDN HTML cache.
Administrative edits invalidate subsequent server requests; already-open pages
are not updated via a new real-time push mechanism. Out-of-band DB edits must
explicitly invalidate caches or wait for timed revalidation.

## Same-endpoint bounded origin test

Same VPS, CPU/RAM limits and load script; 10 concurrent HTTP clients, 8 seconds
per route, direct app port 3211. Final measurements used warm HTML entries.
The loader consumes the complete response body. These are short lab samples,
not a capacity guarantee for 1,000 authenticated users or editor writes.

| Route | Before req/s | After req/s | Before p95 | After p95 |
| --- | ---: | ---: | ---: | ---: |
| `/` | 14.55 | 53.39 | 1,276 ms | 349 ms |
| `/bang-gia` | 21.33 | 130.98 | 678 ms | 121 ms |
| `/mau-thiep/long-phung-v3-do/demo` | 22.01 | 134.46 | 696 ms | 109 ms |

Final counts: 431 / 1,056 / 1,081 requests respectively; all HTTP 200, zero
timeouts or request errors. Baseline counts: 119 / 172 / 178, also zero errors.
Uncompressed payload averages fell from about 410 / 245 / 221 KiB to
311 / 86 / 72 KiB. Home's live admin thumbnail overrides account for a sizable
part of its remaining response, and listing was deliberately not redesigned.

After the run: preview app `MemoryCurrent=243236864` (~232 MiB), `NRestarts=0`;
preview slice memory high/max/oom/oom_kill counters all zero. Existing
`lv-clone.service` kept PID 70311, `NRestarts=0`, HTTP 200 on port 3005.
No percentage reduction in absolute CPU usage is claimed: a saturated benchmark
uses the newly available CPU headroom to serve more requests.

## Correctness checks

- 829 unit tests pass, including injected-clock polling/backoff/abort/disposal
  tests, gate coalescing/cooldown/capacity tests, and translation-scope checks.
- Production build and its TypeScript phase pass; test TypeScript passes.
- An explicit production-only TypeScript check also passes. The repository's
  stock `npm run typecheck` currently collides between generated development and
  production `LayoutRoutes` declarations. No user dev server or generated dev
  tree was removed to hide that conflict.
- Focused lint on new code/actions/pages passes. Full lint is not clean: an
  existing synchronous `setIsFacebookWebview` effect in `chungdoi-tpl-shared.tsx`
  still triggers `react-hooks/set-state-in-effect`, with existing img warnings.
  That unrelated behavior was preserved. `git diff --check` passes.
- `scripts/preview/check-cpu-cache.mjs` passes against the production build and
  a disposable local SQLite database. It tests real admin price changes, name
  changes, demo saves, cover toggles, guest-visible cache invalidation, capture
  isolation, immediate published edits, guest A/B isolation, authenticated fresh
  payment status, and the real checkout component's hidden-tab/paid behavior.
- The same integration script exercises Home, pricing, listing, help, tools,
  privacy policy, blog, V11, capture and published pages without client errors,
  missing translations or failed non-image server responses. No external payment
  provider was contacted. The local test server was stopped afterward.
- A resource-limited candidate ran on port 3212 before promotion and verified
  Home/pricing/demo cache HITs. The candidate is stopped. Origin and public tunnel
  smoke checks pass, including existing blocked integration routes.
- Browser checks through the tunnel: Home/pricing render without console errors;
  demo opens, Vietnamese wish fields render, no horizontal overflow observed.

The preview remains integration-disabled as before: this deployment does not
enable email, real payments, cron, backups or Google sign-in.

## Deployment and rollback

Only the standalone `.next` artifact and `server.js` were promoted. Existing
Linux native dependencies, database, uploads and public files were preserved.
The image cache and old hashed static chunks were retained; old data caches were
not copied into the new release. No database migration or resync was performed.
The tunnel/gateway and existing app were not restarted. Production domain/DNS and
minipc were not changed.

Promotion script: `scripts/preview/promote-cpu-build.sh` (one-shot dated preview
release, with candidate checks and rollback on promotion failure).

Rollback artifact:
`/srv/thiepmungonline-preview/releases/before-cpu-cache-20260830`.
Stop only `thiepmungonline-preview.service`, move the current app artifact into a
new recovery directory, restore that backup's `.next` and `server.js`, restart
the same service and run `control/verify-preview.mjs`. Do not replace `app/data`,
environment files, dependencies, public assets, gateway or tunnel.

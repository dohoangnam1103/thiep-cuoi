# Production CPU optimization deployment — 2026-08-30

Promoted at 14:23 ICT to <https://thiepmungonline.com> on the existing Mini PC
(`192.168.0.57`), not the preview VPS. Release: `cpu-opt-20260830`.

## Scope

- Includes the four optimization groups described in
  [the preview report](preview-vps-cpu-cache-2026-08-30.md): Home/pricing cache,
  sample-demo cache, payment polling/reconciliation coalescing, scoped client
  translation messages.
- The user approved deploying the current working tree, including V11. The
  official Home remains unchanged in design; `/home-2/lab/v11` remains a separate
  noindex experimental URL, absent from the Home navigation. This is not access
  control.
- Published invitations remain dynamic with `private, no-cache, no-store`;
  listing remains dynamic. No published-invitation HTML cache was introduced.
- No migration or seed was needed or run. No database resync or replacement,
  environment/credential changes, DNS changes or scheduled-job changes occurred.
  Automatic backups were not re-enabled. The new preview VPS was untouched.

## Deployment method

The normal fast-deploy script was deliberately not run: it synchronizes the
live bind-mounted public directory before verification and manages cron jobs.
This deployment staged source, public files and the standalone build separately,
retained old hashed static chunks, and built Linux native dependencies using
`Dockerfile.prebuilt`. The dependency lock was unchanged.

A network-isolated candidate used a copied SQLite database, dummy auth secrets
and no production integration credentials. After successful checks, Linux
`renameat2(RENAME_EXCHANGE)` atomically exchanged staged/current source trees.
Only the compose `web` service was recreated; tunnel and other containers were
not restarted. Existing production data, uploads and image-cache mounts remain.

New image tag: `thiepmungonline-web:cpu-opt-20260830`.
Running image ID:
`sha256:d56edf8a1fae2ff4d823ddcfc64376b0a0cbb95ef58dbac0338a67d4d444964d`.

## Verification

- Production build, production-only TypeScript, test TypeScript and all 829 unit
  tests passed. Focused ESLint and deployment-script syntax checks passed.
- Existing full-lint failure and generated dev/prod TypeScript collision remain
  as documented in the preview report; they were not hidden by deleting files.
- Candidate and live checks passed for Home/pricing/demo cache HIT, new release
  markers, production canonicals, JS/CSS assets, listing no-store, V11 noindex,
  legacy capture redirect and dynamic capture mode, authentication boundaries,
  unauthorized cron rejection and malformed-webhook rejection.
- Signup correctly redirects to login. Streaming auth-page redirects are checked
  through their redirect payload as well as ordinary 3xx responses.
- Public Home/pricing/demo returned HTTP 200, `x-nextjs-cache: HIT` and Cloudflare
  `DYNAMIC`. Unlike the preview gateway, production exposes Next's default
  `s-maxage=300, stale-while-revalidate=31535700` on these public cacheable pages.
  No new Cloudflare cache rule was installed.
- One real paid/published invitation returned 200 and no-store both internally
  and through the public domain. The verification bot did not increment its
  view count. Its slug/content are intentionally omitted from this report.
- Browser checks: official Home renders with no broken loaded images or
  horizontal overflow; pricing navigation works; the demo opens and Vietnamese
  content/wish fields render. No browser error/warning was observed in these
  checks. No real wish/RSVP/payment was submitted.
- Environment, compose file and crontab fingerprints match the predeploy
  checkpoint. SQLite quick_check passed before and after promotion.
- Live payOS and Resend configuration remains present. No real transaction,
  outgoing email or Google sign-in was exercised; those integrations are not
  claimed as end-to-end verified by this deploy.
- Container healthy, zero restarts, no OOM. Post-deploy idle snapshot: ~189 MiB
  application RAM, 0.43% CPU, host ~4.5 GiB available RAM. This is not a load test
  or a production capacity guarantee. No production stress test was performed.
- Server logs showed Next's metadataBase fallback warning on one checked route,
  but no application exception. The tested public cacheable pages have correct
  production canonical URLs. The metadata warning remains for separate review.

## Backup and rollback

One-time predeploy checkpoint on the Mini PC:
`/home/namdo/apps/thiepmungonline/deployments/cpu-opt-20260830`.
It contains `predeploy.db` (online SQLite backup, mode 600), immutable-upload
hardlink snapshots, checkpoint fingerprints and deployment helpers. The
candidate container was removed after verification; its disposable DB remains
in the restricted checkpoint directory.

Previous source/public tree after the exchange:
`/home/namdo/apps/thiepmungonline/releases/cpu-opt-20260830`.

Previous image tag: `thiepmungonline-web:rollback-cpu-opt-20260830`.
Previous image ID:
`sha256:62533b58106a5eac3b170df80d34ec57d23840917db05d9ddfc31b7e3a5adcdd`.

For an explicitly approved rollback, first confirm the running image is still
this release and the old tree/tag above are intact. Exchange the two source
directories once using the checkpoint's `production-release-state.py exchange
cpu-opt-20260830`, tag the rollback image as `thiepmungonline-web:latest`, then
recreate only `web` using `docker compose up -d --no-build --no-deps
--force-recreate web` from the application root. Verify health, public pages and
dynamic invitation/auth behavior afterward. **Do not restore the DB for a code
rollback**: production writes since deployment must be preserved. Do not rerun
the one-shot candidate/promote phases after the source exchange.

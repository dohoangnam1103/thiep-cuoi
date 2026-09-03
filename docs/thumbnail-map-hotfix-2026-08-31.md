# Production-origin thumbnail capture hotfix — 2026-08-31

## Scope

The previous local capture accepted Google Maps error documents as valid iframe
screenshots. Re-capture from the public production origin instead, with the
browser on Mac. No production SQLite/media download, no Chrome installation on
the VPS, no API key restrictions changed, no new admin capture feature.

## Changes and capture

- `CAPTURE_BASE_URL=https://thiepmungonline.com` with `--no-sync-production`.
- All 53 active templates captured; 53 Google Maps frames validated; 53 PNGs
  plus 159 listing/portrait/landscape WebPs generated.
- Validate Google error text and loaded visible map tiles before rasterization;
  abort the batch before asset installation if any capture fails.
- Stable iframe handles prevent skipping frames when one is replaced by an image.
- Preserve the captured appearance without applying iframe opacity/filter twice.
  Royal V2 Green was re-captured after this correction.
- Final preview URL version: `34c270afa6e9e46f`.
- Prepared content-addressed listing crops; custom uploaded mobile overrides kept.
- Script/module scoped ESLint, source and test TypeScript passed. Two browser
  regression tests cover API/referrer failure, multiple maps, and opacity.
  Six existing thumbnail tests passed.
- All 53 iframe proofs visually reviewed; final full-page PNG map regions
  extracted separately for verification. Pilot on Minimalism Purple succeeded.
- Local build Maps key matches the key served by production; no key is included
  in the audit report.

## Deployment

Deployed successfully as `20260831165423`; current image:
`sha256:31239db32ea55792f660184f7c83d8bd98f75b39ad174dd747f45637a0aab67a`.
Deployment finished at approximately 2026-09-01 00:01 Vietnam time.

- Mandatory i18n unit gate and 114 browser tests passed, then a fresh production
  build. No migrations or track seeding were needed; database integrity OK.
- All 597 related image/manifest/script files matched SHA-256 between the release
  workspace, main project, and VPS. Unrelated main-project edits were not deployed.
- All 53 maps were present in the final PNGs: comparison against the independently
  saved map proofs passed, with maximum mean channel difference 5.45/255 after
  accounting for fractional layout positions/resampling.
- Live PNGs for Minimalism Purple, Brown and Royal V2 Green: HTTP 200, exact hashes.
  Public listing HTML references the newly hashed thumbnails for all three.
- A fresh post-deployment capture of Minimalism Purple passed the Google Maps
  checks using the live application.
- Wedding app healthy; public home/demo HTTP 200; lv-clone HTTP 200; all existing
  backup/payment/reminder timers remain active. Only the wedding web container
  was recreated, by the normal deploy pipeline.
- PNG originals total 259,475,939 bytes; all 212 previews total 287,939,893 bytes.
- About 3.8 GiB free (84% used) after the cold image build. The next deployment
  needs capacity review to satisfy the unchanged 6 GiB gate. Do not bypass it.
- The unchanged dependency installation emitted 8 npm audit warnings (3 moderate,
  5 high); dependency remediation was not part of this image-only hotfix.

## Recovery and evidence

Private backup: `/Users/namdo/Documents/thiepmung-map-hotfix-backup-20260831/`.
Contains pre-hotfix previews, old manifest/version/script, generated image hashes,
all map contact sheets and crops. Capture log: `/tmp/thiepmung-map-capture-all.log`;
Royal correction: `/tmp/thiepmung-map-royal.log`.
Audit images/report: `/tmp/thiepmung-production-map-hotfix/all/`.
Rollback application/assets only; never restore an old DB/media snapshot to undo
this thumbnail update.

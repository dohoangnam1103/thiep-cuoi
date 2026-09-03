# Opening photos: album default, optional dedicated upload

Requested behavior: one-photo headers use the first album photo; two-photo
headers use the first two album photos in display order. A dedicated upload
overrides its slot. Removing the upload restores the live album fallback.
No mode selector is needed. The existing hide/show option remains respected.

## Changes

- Register one-photo upload fields for `minimalism-purple` and `minimalism-brown`.
- Enable album fallback by default in the shared two-photo resolver.
- Treat bundled `/chungdoi/images/` URLs as template defaults, not dedicated
  uploads. Old demo seeds stored these URLs in `heroImage`, causing a hidden
  stale image to override changes to the album. Uploaded and external URLs are
  preserved. No production image data is deleted or overwritten.
- Normalize these defaults in seed conversion, database-to-view conversion,
  and editor upload fields. Resolve the album at render time rather than
  persisting the first album URL as a dedicated image.
- Make all Minimalism Dark Red variants use the shared single-image resolver,
  including the existing show/hide flag.
- Explain the fallback beside the optional upload controls through the
  Vietnamese message catalog.

Templates whose design contains no opening photograph keep no upload control;
for example `crystal-floral-red` and `royal-v2-green` use decorative artwork.

## Verification

- Scoped ESLint, TypeScript and test TypeScript passed.
- 26 focused unit tests passed, including album reorder, dedicated precedence,
  removal, empty albums, two-photo order and legacy bundled defaults.
- 3 browser tests passed for Purple, Green and Brown: real upload, save, reload,
  preview, remove and return to album fallback. These used an isolated test DB.
- The required 114-test i18n browser gate passed. The first production build
  stopped safely because the isolated checkout lacked build environment files;
  those files were restored and the entire gate was rerun, also passing.

## Release isolation

The release is built from a copy of the deployed source at
`/Users/namdo/Documents/learning/clone-hero-release-20260831`, with only this
feature's changes applied. Existing local uncommitted application work was not
included. Current local i18n tests were copied because the deployed source tree
retained stale tests (deployment excludes test files).

The earlier one-off database backup for adding Minimalism Brown is retained on
Mac at `/Users/namdo/Documents/thiepmung-hero-backup-20260831/` as a checksum-verified
gzip. Historical source-tree DB snapshots in `releases/current/backups/prod-db`
were also compressed losslessly to satisfy the VPS disk-space gate. Production
DB and scheduled runtime backups remain untouched by that compression.

## Deployment result

Release `20260831100604` deployed successfully. Runtime health, public routes,
assets and database integrity passed. No database migration or music reseed ran;
the 56 demo records remain present.

Verified the normal public `/mau-thiep/minimalism-tim/demo` route in the browser:
after opening the invitation, the header image URL matches the first uploaded
album image currently stored for `demo-minimalism-purple`, and the image loaded
successfully. Its legacy bundled hero URL remains in the DB but no longer wins
over the live album. Use the normal route for this check, not the capture view.

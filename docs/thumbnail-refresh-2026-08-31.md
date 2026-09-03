# Thumbnail refresh — 2026-08-31

## Result

Deployed successfully as `20260831160712` on the current VPS, image `sha256:dac3e7b4f47808572fc4bc812c09b98b1765ca72364363f9ee3ad460858fb5f0`.
Preview URL version: `260e9c119e8af05c`.

- Read-only production sync: 56 demo records, 533 gallery rows, 395 referenced editor uploads.
- Regenerated 53 active templates: 53 original PNGs and 159 WebPs (listing/portrait/landscape).
- PNG originals total 253,130,610 bytes; all 212 preview files total 280,717,242 bytes.
- Regenerated content-addressed listing crops. Existing admin-uploaded mobile overrides were preserved.
- No local database was uploaded to production; migrations and track seeding were skipped.

## Source and files

Isolated source copied from production: `/Users/namdo/Documents/learning/clone-thumbnail-release-20260831`.
Capture-only SQLite: `capture.db` in that directory; referenced photos: `data/editor-uploads/`.
Updated previews and thumbnail manifest were also copied to the primary project `/Users/namdo/Documents/learning/clone`.
PNG path: `public/chungdoi/images/template-previews/en/png/`.

Script changes: use the current VPS by default; retain original PNGs; avoid Next/next-intl loopback rewrite loops by starting the managed server on localhost; hide the Next development indicator in screenshots; support optional 1–4 concurrent captures; filter both retired-demo registries; export production demo tables within one read transaction.

## Verification

- Scoped script ESLint, source TypeScript, test TypeScript: passed.
- Thumbnail unit tests: 6 passed against the refreshed assets.
- Mandatory i18n unit gate: 6 passed; mandatory browser gate: 114 passed.
- 212 image files passed format/dimension validation; contact sheets visually inspected for all 53 templates.
- Main local project: all 212 image checksums match the capture manifest.
- VPS source/assets: 595 files checked, zero checksum mismatches.
- Live CDN PNG for Minimalism Purple, listing WebP for Brown and portrait WebP for Green: HTTP 200 and exact local SHA-256 matches.
- Live `/mau-thiep` HTML uses new hashed desktop thumbnail URLs for Purple, Brown and Green.
- Container healthy, database integrity OK, public home/demo HTTP 200; existing systemd schedules preserved.

## Recovery and capacity

Private backups and image manifests: `/Users/namdo/Documents/thiepmung-thumbnail-backup-20260831/` (directory mode 700).
Includes pre-refresh production previews, primary local previews before replacement, demo snapshot manifest and verified archives of two inactive historical Docker images removed from the VPS to satisfy its 6 GiB pre-deployment capacity gate. Production data/volumes/current backups were not deleted.

The latest running image and previous rollback were retained during cleanup. After deployment the VPS has about 2.6 GiB free (89% used); the next deployment will require capacity review to satisfy the unchanged 6 GiB gate. Do not bypass the gate or delete live data to make room.

Logs: `/tmp/thumbnail-capture-all-final.log`, `/tmp/thumbnail-deploy.log`.

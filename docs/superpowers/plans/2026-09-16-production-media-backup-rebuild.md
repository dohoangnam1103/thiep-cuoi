# Production Media Backup and Rebuild Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Preserve the production database and user-uploaded assets for `chonanh.online` (Photo Filter) and the three `harvenkiori.*` domains (LV Clone) before reinstalling VPS `163.61.110.34`, then restore and redeploy from known-clean source trees.

**Architecture:** Treat the current VPS as compromised. Export only application data and user media with SQLite-consistent snapshots and SHA-256 manifests; rebuild application code from the local `photos filter` and `LV clone` repositories rather than copying executable files from the VPS. Keep encrypted, project-scoped backup bundles on the Mac/MiniPC and perform a restore drill before the OS reinstall.

**Tech Stack:** SQLite (`sqlite3 .backup`), rsync, tar/zstd, SHA-256, Bun/Hono Photo Filter, Next.js/Prisma LV Clone, systemd/Caddy/Cloudflare Tunnel.

**Spec:** This operational plan is based on `docs/deploy-vps.md`, `../photos filter/README.md`, `../photos filter/server/src/config.ts`, and `../LV clone/docs/DEPLOY.md`.

## Global Constraints

- Do not copy executable code, `node_modules`, `.next`, system files, SSH keys, or tunnel credentials from the compromised VPS into the rebuilt host.
- Do not commit `.env`, SQLite databases, uploaded media, backup archives, or secret manifests to Git.
- Preserve the original VPS as forensic evidence until the backup and restore checks pass; do not delete/quarantine additional evidence during this procedure.
- Stop application writes for each final snapshot; never copy a live SQLite file with a raw `cp` while its WAL is active.
- Use a unique UTC timestamp for every bundle and retain at least two independent copies.

## Target and ownership map

| Site(s) | Project | Production data to preserve | Rebuild source |
|---|---|---|---|
| `chonanh.online` | `photos filter` | Photo Filter SQLite DB, `DATA_DIR/originals`, avatar originals, optional cache, Drive/Telegram metadata | `/Users/namdo/Documents/learning/photos filter` |
| `harvenkiori.com`, `.us`, `.uk` (+ `www`) | `LV clone` | `/srv/lv-clone/prisma/dev.db`, `/var/lib/lv-clone/uploads`, production asset manifest | `/Users/namdo/Documents/learning/LV clone` |

Backups should live outside the Git working trees, for example:
`/Users/namdo/Documents/production-backups/<UTC>/photos-filter/` and
`/Users/namdo/Documents/production-backups/<UTC>/lv-clone/`. Add a small, secret-free restore manifest to each project only if desired.

### Task 1: Preflight and freeze the migration window

**Files:**
- Read: `docs/deploy-vps.md`
- Read: `../LV clone/docs/DEPLOY.md`
- Read: `../photos filter/server/src/config.ts`

- [ ] Confirm SSH key access to `root@163.61.110.34` and that the MiniPC has enough free space for a second copy. Record disk free space, current service state, file counts, and byte sizes without printing secret values.
- [ ] Confirm the actual production paths on the VPS from the running service environment. Do not assume the local development paths (`server/data-prod` or `prisma/dev.db`) are production.
- [ ] Announce a short maintenance window and stop new uploads/orders before the final snapshot. Keep the site in read-only/maintenance mode while each database is copied.
- [ ] Create a timestamped, mode-0700 destination directory on the Mac and a separate destination on `192.168.0.57`; never reuse an older bundle.

### Task 2: Snapshot Photo Filter (`chonanh.online`)

**Files/data:**
- Production SQLite: `<PHOTO_DATA_DIR>/app.sqlite` plus any WAL/SHM files, captured with SQLite online backup.
- User originals: `<PHOTO_DATA_DIR>/originals/` and the configured `UPLOADS_FALLBACK_DIR` if non-empty.
- Studio avatars: the avatar files under `originals/_avatars/` and their database rows.
- Optional warm cache: `<PHOTO_DATA_DIR>/cache/` (rebuildable; include only if capacity permits).
- Configuration inventory: env variable names and non-secret settings only; secret values are rotated, not restored.

- [ ] Stop the Photo Filter service/offloader, run `PRAGMA wal_checkpoint(TRUNCATE)` only after writes are frozen, and create `app.sqlite` with `sqlite3 <db> ".backup '<bundle>/app.sqlite'"`.
- [ ] Verify the snapshot with `PRAGMA quick_check`, record SQLite schema/table counts, and compare the backup hash to a second independent online backup.
- [ ] Copy `originals/` and any fallback upload directory with `rsync -aHAX --numeric-ids --delete --info=stats2`, preserving file names, modes, and mtimes. Never use `--inplace`.
- [ ] Export a filename/size/SHA-256 manifest for originals and avatars. For every database row in `upload_blobs`/`avatar_blobs`, verify that either the referenced local file exists or a Telegram/remote file ID exists.
- [ ] Record Google Drive folder URLs/IDs and Telegram file-ID metadata from the database, but do not attempt to re-download remote originals during this migration.
- [ ] Include cache files only as an optimization; mark them disposable in the manifest because Drive/Telegram or the original upload is the source of truth.
- [ ] Package the snapshot as `photos-filter-data-<UTC>.tar.zst`, encrypt it with a password-managed archive tool, and store the plaintext SQLite only inside the 0700 backup directory.

### Task 3: Snapshot LV Clone (`harvenkiori.*`)

**Files/data:**
- Production SQLite: `/srv/lv-clone/prisma/dev.db` (and verify no active `-wal`/`-shm` is omitted).
- User-uploaded originals: `/var/lib/lv-clone/uploads/` (configured by `UPLOAD_DIR`).
- Repo-managed static assets: restore from the clean local repository; do not trust the VPS copy. Generate a manifest of the local `public/assets` tree if exact production comparison is required.
- Runtime config inventory: `/srv/lv-clone/.env` key names only; rotate all values.

- [ ] Stop `lv-clone.service` and create a consistent SQLite snapshot with `sqlite3 /srv/lv-clone/prisma/dev.db ".backup '<bundle>/dev.db'"`; run `PRAGMA quick_check` and record product/blog/order/admin counts.
- [ ] Copy `/var/lib/lv-clone/uploads/` into the LV bundle with `rsync -aHAX --numeric-ids --delete --info=stats2`; preserve ownership metadata in a separate manifest and restore ownership to `lvclone:lvclone` later.
- [ ] Generate a SHA-256 manifest for every uploaded file and a total count/byte summary. Spot-check representative product, blog, and admin-uploaded media by MIME type and image decode.
- [ ] Record the three domain routes and the Caddy/Tunnel topology from `../LV clone/docs/DEPLOY.md`; regenerate Caddy certificates and Cloudflare tunnel credentials on the clean host instead of restoring secret files.
- [ ] Package and encrypt `lv-clone-data-<UTC>.tar.zst`; keep source code and dependencies out of the data archive.

### Task 4: Independent-copy and restore drill

- [ ] Copy both encrypted bundles and their manifests to `192.168.0.57` and one offline/external destination. Verify SHA-256 of the encrypted archives at all locations.
- [ ] On a disposable clean directory/container, restore each archive, run SQLite `quick_check`, compare table counts, and verify 100% of media manifest entries.
- [ ] Start Photo Filter against the restored database and originals with a temporary `PUBLIC_BASE_URL`; verify login, album listing, guest gallery, comments/likes, avatar, and download paths.
- [ ] Start LV Clone against the restored `dev.db` and upload directory; verify admin login, products, blog media, order history, and `/uploads/<file>` for a representative sample.
- [ ] Record restore duration, archive hashes, counts, and any missing remote-only media in a secret-free `RESTORE-REPORT.md`.

### Task 5: Clean VPS rebuild and redeploy (after restore passes)

- [ ] Rotate SSH keys, database/API/SMTP/payment credentials, Photo Filter session/admin/Turso/Telegram secrets, LV session/admin secrets, and both Cloudflare Tunnel tokens before bringing services online.
- [ ] Reinstall the VPS OS from a trusted image; apply updates, create the least-privilege service users, disable password SSH authentication, and restrict SSH by allowlist/VPN where possible.
- [ ] Clone/deploy clean source from the two local project repositories. Do not rsync `.env`, databases, uploads, `node_modules`, `.next`, or old system configuration.
- [ ] Restore the verified SQLite snapshots and media directories, set ownership/permissions, run migrations only after backups, and rebuild dependencies on the clean host.
- [ ] Configure fresh Caddy/Cloudflare Tunnel ingress: `chonanh.online` for Photo Filter and `harvenkiori.com/.us/.uk` for LV Clone. Keep public app ports bound to loopback.
- [ ] Run domain smoke tests, upload/download tests, database count checks, and SHA-256 spot checks before opening writes. Keep the old VPS powered off/isolated until post-cutover verification is complete.

### Task 6: Post-cutover backup and monitoring

- [ ] Enable scheduled SQLite online backups and media manifests for both projects with non-overlapping schedules.
- [ ] Keep daily/weekly retention on two independent targets and alert on failed backup, checksum drift, low disk space, or upload growth.
- [ ] Monitor SSH logs and service integrity on the rebuilt host for 24–48 hours; review Cloudflare Tunnel connection logs and rotate again if any token exposure is suspected.

## Acceptance checklist

- [ ] Both encrypted archives exist on Mac, MiniPC, and offline storage with matching SHA-256.
- [ ] SQLite `quick_check=ok`; table counts match the final pre-freeze inventory.
- [ ] Every local user-uploaded file is present and hash-matched after restore; remote-only Drive/Telegram references are documented.
- [ ] All four domains serve the clean rebuild, and representative authenticated/public media requests return expected status and bytes.
- [ ] No compromised VPS executable, `.env` value, SSH key, or tunnel credential was restored.


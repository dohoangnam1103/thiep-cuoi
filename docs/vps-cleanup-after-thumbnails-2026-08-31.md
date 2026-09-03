# VPS cleanup after thumbnail deployment — 2026-08-31

## Result

VPS: `163.223.9.198`. Root filesystem capacity: 24,246,272 KiB.
Free space increased from 2,680,948 KiB (89% used) to 7,638,236 KiB (69% used): approximately 4.73 GiB reclaimed, 7.28 GiB free. The unchanged 6 GiB deployment capacity gate passes.

## Removed or archived

- Pruned unused Docker build cache after confirming no deployment/build was running. A second age-filtered prune removed cache references left after archiving the old image. Remaining build-cache records are shared with the active image; they are not additional independently reclaimable disk space.
- Cleaned downloaded APT packages and removed 56 MiB of old archived system journals, retaining about 100 MiB. These journal entries were not backed up.
- Archived inactive image `c855514e028bdccaf44bdc066d5338e013c9210a17bd7d2f8b5c02b200939e7a` to Mac, verified every OCI blob and gzip integrity, then removed only its exact dated and rollback tags.
- Archived the immediately previous image `3068cece7fbf4b79c93099ab23f6fd927bdb0036d248a4f41a26eb2fb5f67fc9` to both Mac and VPS, verified all OCI blobs and matching archive checksums, then removed its unpacked Docker image/tags.
- Archived `/srv/thiepmungonline/releases/current/.next-prebuilt` to Mac and compared its uncompressed tar SHA-256 with a fresh server tar stream before removing the directory. This is deployment staging, not a runtime mount; the next deploy recreates it.

## Preserved and checked

Current application image: `sha256:dac3e7b4f47808572fc4bc812c09b98b1765ca72364363f9ee3ad460858fb5f0` (`20260831160712`).
Container ID stayed `b0c091e1c17b8225aecd24f350e4e12709179eed0c6cf26edeef6fe1a9cac3d3`, StartedAt stayed `2026-08-31T16:14:37.388794247Z`, health is healthy. No application/container restart was performed.

Database quick_check OK; 56 demo records. Production DB, editor/guest/blog media, 53 newly generated PNGs, all public assets, live image-optimizer cache volume, recurring backups, runtime environment and tunnel configuration were kept. No Docker volumes were pruned.
The other app's 7.3 GiB upload store `/var/lib/lv-clone/uploads` was not touched. `lv-clone.service` stayed active with MainPID 674. Its HTTP endpoint on port 3005, the wedding home/listing and the new PNG endpoint all returned 200. All three wedding backup/payment/reminder timers stayed active; no new schedules were added.

## Archive locations and integrity

Private Mac directory: `/Users/namdo/Documents/thiepmung-vps-cleanup-20260831-after-thumbnails/` (700).

- `image-20260831051011.tar.gz`: 407,503,122 bytes; SHA-256 `f9f4f2e9090f776b23f41ee0c6c13615bae9a247005b1abb901ff859dab0bd58`.
- `rollback-20260831100604.tar.gz`: 407,353,410 bytes; SHA-256 `3f14e4ad288681ffefe0e2453ca1ce81f50c920215b890494f2976925e116e8c`.
- `prebuilt-20260831160712.tar.gz`: 11,932,160 bytes; uncompressed tar SHA-256 `bbfa2445c46e43e7a05cda7d0d22dd38fb9ed6f6e8589fdf63c20dec44172637`.

The immediate rollback also resides on the VPS:
`/srv/thiepmungonline/rollback-archives/rollback-20260831100604.tar.gz` (600, parent directory 700), with its `.sha256` sidecar.

## Recovery caution

The previous version is retained as a compressed archive rather than a preloaded image. Before a deliberate application rollback, verify and load it on the VPS:

```bash
cd /srv/thiepmungonline/rollback-archives
sha256sum -c rollback-20260831100604.sha256
gzip -dc rollback-20260831100604.tar.gz | docker image load
```

Loading restores the dated/rollback tags only; it does not switch the running production app. Then follow the app-only rollback procedure and verify health. Do not restore an old database or media snapshot to undo an application build. The archive was validated cryptographically, not by replacing the live app for a rollback test.

Build caches were cleared, so a later cold deployment can take longer and consume space again. Do not bypass the deployment capacity gate.

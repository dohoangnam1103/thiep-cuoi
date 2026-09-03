# Production VPS — thiepmungonline.com

Production moved from minipc to **163.223.9.198** on **2026-08-31**.
Use SSH key authentication: `ssh root@163.223.9.198`. Do not put passwords in
source, docs, shell history, or deployment commands.

## Verified cutover

- Exact existing production image preserved:
  `sha256:84ff88f82d347fe2c0c134c85d36d0ec62cafe6f1412c899428862a34f20c1f7`.
- Existing application deployment ID: `20260830084854`.
- Source writes stopped before the final SQLite backup and media delta transfer.
- Final checkpoint: 253 users, 357 invitations, 72 payment records; all table
  counts matched. SQLite `quick_check=ok`; the activated DB matched the final
  backup byte-for-byte before starting production.
- SHA-256 matched for all 1,467 files: 1,414 editor uploads, 25 guest media,
  28 blog media, across minipc, Mac backup, and VPS.
- The complete public-assets tree (2,316 files) also matched SHA-256 between
  minipc and VPS. Editor and blog media sample requests returned 200 from both
  origin and public domain with normal browser request headers.
- External 1 Hz sampling observed errors at **08:33:41–08:33:50 Vietnam time**,
  then HTTP 200 at **08:33:51**: approximately **10 seconds** interruption.
  The 180-sample run had no errors after recovery. This is one probe location,
  not a guarantee of every visitor's exact interruption duration.
- Home, pricing, demos, JS/CSS, assets, capture isolation, canonical domain,
  auth boundaries and rejected invalid webhook/cron requests passed on origin
  and public domain. Three paid invitations rendered in the isolated candidate.
- Google provider is configured. No real checkout or customer email was sent
  solely for testing. A normal payOS reconciliation run succeeded after cutover.
- Existing `lv-clone.service` was not restarted (PID 674 during migration).
- Bash/Python syntax, systemd unit validation, scoped JavaScript lint and VPS
  deploy preflight passed. Full repository lint is not clean (including the
  existing `setIsFacebookWebview` effect error in `chungdoi-tpl-shared.tsx`);
  unrelated local application edits were neither rebuilt nor deployed.

## Traffic and state

```text
thiepmungonline.com / www
  -> existing Cloudflare tunnel 82b89851-396e-4501-af77-89e2bcf15a01
  -> VPS thiepmungonline-tunnel
  -> Docker service web:3000
  -> /srv/thiepmungonline/data/prod.db and media
```

DNS, domain, HTTPS, callback/webhook URLs, session signing keys and integration
credentials were preserved. Only the connector's host changed. The actual
running container environment was copied rather than trusting a potentially
stale `.env` file. Compose uses `env_file: format: raw` to preserve its values.

The old minipc web/tunnel are stopped with `restart=no`; app cron entries were
removed while unrelated cron jobs were preserved. `/home/namdo/apps/thiepmungonline/RETIRED`
blocks the repository's old deploy/setup scripts. Do not remove it casually.

## Layout

```text
/srv/thiepmungonline/
  compose.yaml                   # docker-compose.yml is a compatibility symlink
  .env                           # actual production runtime env, private
  .env.source-file                # original source env file, private
  tunnel.env                     # existing production tunnel credential, private
  LIVE                           # permits production timer jobs
  data/                          # SQLite + editor/guest/blog media, UID 1000
  releases/current/              # copied production source and public assets
  ops/                           # maintenance helpers and cutover checkpoints
  backups/                       # verified recurring backups, seven-day retention
  historical-backups-minipc/      # original backups, excluded from new retention
```

The previous preview and migration candidate were archived to Mac and removed
from the VPS during the approved 2026-08-31 disk cleanup. Their service units
were also archived/removed; production does not depend on them.

Docker and containers start automatically after reboot. Public app/metrics
ports bind only to loopback (3211 and 20246); traffic arrives via Cloudflare.
Web has 3 CPUs / 1.5 GiB memory limit; tunnel has 0.5 CPU / 192 MiB limit.
The VPS has 4 vCPUs and approximately 3 GiB RAM. Do not reboot it as a routine
verification step while customers are using it.

## Deploy

```bash
npm run deploy:setup               # read-only VPS provisioning/timer check
bash scripts/deploy-vps.sh --check # same check
npm run deploy:smoke               # existing prebuilt pipeline, VPS target
npm run deploy                     # build on Mac, assemble/promote on VPS
```

The VPS entrypoint pins the target to the new host, uses image tag
`thiepmungonline-web:production`, and preserves systemd schedules instead of
installing duplicate minipc cron jobs. The `migration-20260831` tag preserves
the cutover image. No local uncommitted application changes were deployed as
part of the migration. The new wrapper was syntax/preflight checked, not used
to publish a different application build during this cutover.

**Mandatory i18n gate:** `npm run deploy`, `npm run deploy:smoke`, and direct
`bash scripts/deploy-fast.sh` run `npm run check:i18n` followed by
`npm run test:i18n:e2e` before source sync, backup, migration or container changes.
A failed test, missing browser/dependency, or occupied test-server port stops
deployment. There is no skip flag. `--check` / `--setup` remain read-only
provisioning checks and do not run this gate.

The browser gate builds current source against the isolated E2E database and
requires a fresh test server (no reuse of an existing server). It automatically
checks all registered templates, plus editor/admin/public routes. Install
Chromium once with `npx playwright install chromium` if needed. Default test
port is 3100; stop the process using it or set `E2E_PORT` to an unused port.
The test DB is shared with the normal E2E suite; do not run both concurrently.

`SKIP_BUILD=1` is rejected: the E2E build has test configuration, so a fresh
production build must follow a successful gate. Do not deploy the E2E `.next`
artifact. If a gate fails, fix the reported issue and rerun deploy.

**Capacity gate:** after the approved cleanup, approximately **8.2 GiB is free
on the 24 GiB disk (65% used)**, up from 4 GiB immediately after migration.
The deploy wrapper refuses to start a new build/source sync below 6 GiB free.
Keep watching capacity as uploads/backups grow; do not blindly prune images or
backups. The old stress test used 1 CPU /
2 GiB; it does not establish capacity of the upgraded machine.

`deploy:legacy` is historical and refuses the retired host. Do not bypass this
guard or run the old compose project to "rollback" without synchronizing data.

## Scheduled jobs (all schedules use Asia/Ho_Chi_Minh)

| Timer | Schedule | Purpose |
| --- | --- | --- |
| `thiepmungonline-payos-reconcile.timer` | Even hours, minute 23 | Existing payment reconciliation |
| `thiepmungonline-trial-reminders.timer` | Hourly, 09:00 through 21:00 inclusive (13 runs/day) | Existing trial reminder email job |
| `thiepmungonline-backup.timer` | 00/06/12/18:41 | SQLite online backup + media/config snapshot |

Reminder catch-up is disabled to avoid sending overnight after reboot. Backups
verify SQLite before completion and deduplicate unchanged media between snapshots.
The first backup and first payment reconciliation completed successfully.

2026-09-03: reminder timer updated live to hourly, 09:00–21:00 inclusive.
Verified systemd calendar, active/enabled state and next run at 20:00 Vietnam time.
Only the timer was restarted; no manual reminder send or web rebuild was performed.
Reminder eligibility, markers and email deduplication are unchanged. The previous
unit is saved at `ops/trial-reminders-before-hourly-20260903.timer`.
Admin forecast uses the same 13 daily runs (31 reminder/forecast tests pass).
Its production display was deployed in release `20260903123442` on 2026-09-03,
along with the left-side Aa control, demo usage counts and payment user links.
All 116 browser gate tests passed; web/asset/database checks passed. Hourly timer
remained active and both new demo records were verified after deployment.
Disk remaining: approximately 2.7 GiB. The preceding inactive rollback image was
archived and verified at `/Users/namdo/Documents/thiepmung-deploy-20260903-admin-updates/`
before cache cleanup; the active image and production data were preserved.

```bash
ssh root@163.223.9.198 'docker ps; df -h /'
ssh root@163.223.9.198 'curl -fsS http://127.0.0.1:20246/ready'
ssh root@163.223.9.198 'systemctl list-timers --all | grep thiepmungonline'
ssh root@163.223.9.198 'journalctl -u thiepmungonline-payos-reconcile.service -n 30'
ssh root@163.223.9.198 'journalctl -u thiepmungonline-trial-reminders.service -n 30'
ssh root@163.223.9.198 'systemctl start thiepmungonline-backup.service'
```

## Backups and rollback

The Mac migration backup is outside the Git repository:
`/Users/namdo/Documents/thiepmung-migration-20260831.HJad8n/`.
It contains source/assets, media, historical backups, original environment and
the final frozen DB checkpoint. Treat it as sensitive customer data. The latest
ongoing production state is on the VPS, not in this historical Mac snapshot.

Recurring backups currently stay **on the same VPS**. The Mac copy gives an
off-host cutover recovery point, but recurring off-host backup still needs an
approved independent destination. Do not describe local VPS snapshots as
protection against complete VPS/disk loss.

After the VPS accepts writes, never restart the minipc's old database as-is.
To return to minipc: pause VPS timers and stop/drain its web/tunnel; back up and
copy the latest VPS DB and media to minipc; verify integrity; then start the old
application/tunnel and restore only one set of scheduled jobs. Preserve both
sides' checkpoints. Reusing the frozen pre-migration DB would lose new users,
edits, RSVP and payments.

For an app-only rollback on the VPS, preserve the current DB/uploads and select
the known previous image/source; check schema compatibility before promotion.
Do not restore an old database just to undo application code.

The migration helpers in `scripts/vps/` are dated one-shot audit/recovery tools;
do not rerun the freeze/cutover/activation scripts on live production.

## Approved disk cleanup — 2026-08-31

Follow-up after release `20260831051011`: historical minipc backups were moved
off the VPS to `/Users/namdo/Documents/thiepmung-vps-archive-20260831/`.
The local gzip archive's uncompressed tar checksum matched a fresh tar stream
of the VPS originals before their directory was removed. Current recurring
backups, production data, and production/rollback/migration images were kept.
APT package-list metadata was cleared (run `apt-get update` before the next
package operation). The separate running `lv-clone` app has approximately
7.3 GiB of uploads; these are application data and were not removed.

Reclaimed approximately 4.2 GiB without restarting production or lv-clone:

- Archived and removed `/srv/thiepmungonline-preview`, the copied
  `/srv/thiepmungonline/releases/current/.worktrees`, and `candidate-data`.
- Removed only the stopped migration-candidate container and inactive preview
  service/slice definitions. Production Docker images and volumes were retained.
- Cleared downloaded APT packages (redownloadable) and vacuumed old journals
  with a 200 MiB budget; actual journal use afterward was approximately 152 MiB.
  Removed old journal entries were not backed up.
- Production data, all current/historical backups and lv-clone uploads stayed
  in place. Deploy rsync now excludes `.worktrees` to prevent copying it back.

The private recovery archive is on Mac:
`/Users/namdo/Documents/thiepmung-vps-cleanup-20260831.JYWNWU/cleanup-20260831.tar.gz`.
SHA-256: `92ea2b3e5ba74b27db352217a8e150bac3fcc303a29086a2489c94955dd21834`.
Both copies matched SHA-256 and the archive was compared against the original
VPS files before deletion. The redundant VPS archive was then removed.
See the adjacent `README.md` for contents and recovery cautions.

## Cleanup after thumbnail release — 2026-08-31

After release `20260831160712`, the user requested VPS cleanup. Free space increased from 2.6 to 7.3 GiB (89% to 69% used), without restarting either application or deleting runtime data. Old images and build staging were archived to Mac before removal; the immediate rollback is also stored compressed on the VPS at `/srv/thiepmungonline/rollback-archives/rollback-20260831100604.tar.gz`. Load that archive before an app-only rollback; it is no longer a preloaded image. See `docs/vps-cleanup-after-thumbnails-2026-08-31.md` for verified hashes and recovery notes.

## Thumbnail Maps hotfix — 2026-09-01 Vietnam time

Release `20260831165423` regenerated all 53 active demos from the production origin so Google Maps appears correctly in the PNG/WebP previews. Current image: `sha256:31239db32ea55792f660184f7c83d8bd98f75b39ad174dd747f45637a0aab67a`; preview version `34c270afa6e9e46f`. All 53 maps checked, 114 browser gate tests passed, live samples verified. No migrations/data restores were performed. Cold build leaves about 3.8 GiB free (84% used), so review capacity before the next deploy; the unchanged 6 GiB gate must not be bypassed. See `docs/thumbnail-map-hotfix-2026-08-31.md`.

#!/usr/bin/env bash
#
# Deploy nhanh: build Next trên Mac, lắp image trên Mini PC.
#
# Khác biệt so với scripts/deploy-minipc.sh (vẫn giữ làm fallback):
#
#   1. Đi thẳng LAN tới Mini PC thay vì qua `cloudflared access ssh`.
#      Đo được: ~21 MB/s so với <0.33 MB/s qua tunnel.
#   2. Ghép mọi lệnh remote vào một SSH connection (ControlMaster) thay vì
#      mở lại hơn 10 lần.
#   3. Compile Next native trên Mac (~35s) thay vì trên Mini PC, nơi chỉ còn
#      ~2.6GB RAM và đã swap 3GB.
#   4. Chỉ rsync 105MB artifact rồi để Mini PC chạy COPY, thay vì
#      `docker save | ssh docker load` cả image 1.84GB mỗi lần deploy dù chỉ
#      ~83MB thực sự đổi.
#   5. Chạy song song: build trên Mac ‖ rsync source ‖ backup trên Mini PC.
#   6. public/ (539MB) bind-mount từ host thay vì nằm trong image.
#   7. Backup uploads bằng hardlink snapshot thay vì gzip lại 78MB mỗi deploy,
#      kèm dọn retention (data/backups từng phình lên 3.6GB).
#
# Giữ nguyên toàn bộ rào an toàn của script cũ: xác minh đúng host, backup
# trước khi đổi gì, migration preflight fail-closed, rollback tag + tự rollback,
# healthcheck, kiểm tra deployment ID / canonical / SQLite integrity, verify
# URL public. Thêm mới: kiểm tra asset trong public/ để bắt lỗi mount hỏng.
#
# Biến môi trường ghi đè:
#   REMOTE_LAN_IP        IP LAN Mini PC                     (192.168.0.57)
#   REMOTE_LAN_USER      user SSH trên LAN                  (namdo)
#   REMOTE_TUNNEL_ALIAS  alias fallback khi ở ngoài mạng    (minipc)
#   REMOTE_APP_DIR       thư mục app                        (/home/namdo/apps/thiepmungonline)
#   WEB_IMAGE            image compose dùng                 (thiepmungonline-web:latest)
#   PUBLIC_URL           URL public                         (https://thiepmungonline.com)
#   WEB_PORT             cổng LAN                           (3211)
#   DEPLOYMENT_ID         mã version / cache-bust Next.js   (UTC timestamp)
#   BACKUP_RETENTION     số bản backup giữ lại              (10)
#   SKIP_BUILD=1         rejected: deploy must rebuild the source checked for i18n
#   VERIFY_ASSET         đường dẫn asset public để kiểm tra (/chungdoi/icon-v2.png)

set -euo pipefail

cd "$(dirname "$0")/.."
# shellcheck source=scripts/lib/ssh-transport.sh
source "scripts/lib/ssh-transport.sh"

REMOTE_LAN_IP="${REMOTE_LAN_IP:-192.168.0.57}"
REMOTE_LAN_USER="${REMOTE_LAN_USER:-namdo}"
REMOTE_TUNNEL_ALIAS="${REMOTE_TUNNEL_ALIAS:-minipc}"
REMOTE_APP_DIR="${REMOTE_APP_DIR:-/home/namdo/apps/thiepmungonline}"
WEB_IMAGE="${WEB_IMAGE:-thiepmungonline-web:latest}"
PUBLIC_URL="${PUBLIC_URL:-https://thiepmungonline.com}"
WEB_PORT="${WEB_PORT:-3211}"
DEPLOYMENT_ID="${DEPLOYMENT_ID:-$(date -u +%Y%m%d%H%M%S)}"
BACKUP_RETENTION="${BACKUP_RETENTION:-10}"
SKIP_BUILD="${SKIP_BUILD:-0}"
# SMOKE_ONLY=1: dựng image mới rồi chạy thử trong container tạm ở cổng khác,
# xác minh xong thì dừng. Không backup, không migrate, không đụng container
# production. Dùng để kiểm tra pipeline trước khi deploy thật.
SMOKE_ONLY="${SMOKE_ONLY:-0}"
SMOKE_PORT="${SMOKE_PORT:-3299}"
VERIFY_ASSET="${VERIFY_ASSET:-/chungdoi/icon-v2.png}"
VERIFY_DEMO_PATH="${VERIFY_DEMO_PATH:-/mau-thiep/long-phung-v3-do/demo}"

IMAGE_REPOSITORY="${WEB_IMAGE%:*}"
VERSION_IMAGE="${IMAGE_REPOSITORY}:${DEPLOYMENT_ID}"
MIGRATE_IMAGE="${IMAGE_REPOSITORY}:migrate-${DEPLOYMENT_ID}"
ROLLBACK_IMAGE="${IMAGE_REPOSITORY}:rollback-${DEPLOYMENT_ID}"

export DEPLOY_LAN_USER="$REMOTE_LAN_USER"

SECONDS=0
LAST_STEP_TS=0
log_step() {
  local now=$SECONDS
  local delta=$((now - LAST_STEP_TS))
  echo "⏱️  $1: ${delta}s (tổng ${now}s)"
  LAST_STEP_TS=$now
}

# Must finish before transport setup, source rsync, backups or remote mutations.
# Keep this in the shared pipeline so direct deploy-fast and VPS smoke use it too.
bash scripts/check-deploy-i18n.sh

echo "🚀 Deploy nhanh thiepmungonline → ${REMOTE_APP_DIR} (dpl=${DEPLOYMENT_ID})"

# ---------------------------------------------------------------------------
# 0. Chọn đường truyền + xác minh đúng máy production
# ---------------------------------------------------------------------------
transport_init "$REMOTE_LAN_IP" "$REMOTE_LAN_USER" "$REMOTE_TUNNEL_ALIAS"
trap transport_close EXIT

# Mở sẵn master connection để các job song song bên dưới không đua nhau tạo socket.
rsh true

REMOTE_IPS=$(rsh "hostname -I")
if [[ " ${REMOTE_IPS} " != *" ${REMOTE_LAN_IP} "* ]]; then
  echo "❌ Host không trỏ tới ${REMOTE_LAN_IP} (nhận được: ${REMOTE_IPS})."
  exit 1
fi

if ! rsh "test -f ${REMOTE_APP_DIR}/docker-compose.yml && grep -q 'releases/current/public:/app/public' ${REMOTE_APP_DIR}/docker-compose.yml"; then
  echo "❌ docker-compose.yml trên Mini PC chưa có bind-mount public/."
  echo "   Chạy một lần: ./scripts/setup-fast-deploy.sh"
  exit 1
fi

if ! rsh "test ! -e ${REMOTE_APP_DIR}/RETIRED"; then
  echo "❌ This production host is retired. Use npm run deploy (VPS)."
  exit 1
fi

echo "   transport=${TRANSPORT_KIND} target=${SSH_TARGET}"
log_step "xác minh production host"

# ---------------------------------------------------------------------------
# 1. Song song: build trên Mac ‖ rsync source ‖ backup trên Mini PC
# ---------------------------------------------------------------------------
echo "⚡ Chạy song song: build Next (Mac) ‖ rsync source ‖ backup (Mini PC)"

RSYNC_RSH="$(rsync_rsh)"
# mktemp của BSD (macOS) chỉ thay XXXXXX khi nó nằm ở CUỐI template. Nếu để
# hậu tố ".log" phía sau, nó tạo file tên literal "...XXXXXX.log" rồi lần chạy
# sau fail vì "File exists".
BUILD_LOG="$(mktemp "${TMPDIR:-/tmp}/thiepmungonline-build.XXXXXX")"
RSYNC_LOG="$(mktemp "${TMPDIR:-/tmp}/thiepmungonline-rsync.XXXXXX")"
BACKUP_LOG="$(mktemp "${TMPDIR:-/tmp}/thiepmungonline-backup.XXXXXX")"

build_next() {
  if [[ "$SKIP_BUILD" == "1" ]]; then
    echo "build_skipped=1"
    return 0
  fi
  npm run prisma:generate
  NEXT_DEPLOYMENT_ID="$DEPLOYMENT_ID" \
  NEXT_PUBLIC_SITE_URL="$PUBLIC_URL" \
  NODE_ENV=production \
    npm run build
}

rsync_source() {
  # --delete giữ releases/current sạch. .next-prebuilt do rsync artifact tạo ở
  # bước sau nên phải loại trừ, nếu không --delete sẽ xoá mất artifact.
  rsync -a --delete \
    --rsh "$RSYNC_RSH" \
    --exclude '/.next-prebuilt/' \
    --exclude '.git' \
    --exclude 'node_modules' \
    --exclude '.next' \
    --exclude '.env' \
    --exclude '.env.local' \
    --exclude '.env.*.local' \
    --exclude '.DS_Store' \
    --exclude '/*.png' \
    --exclude '/*.jpg' \
    --exclude '/*.jpeg' \
    --exclude '/*.db' \
    --exclude '/*.db-journal' \
    --exclude '/*.db-shm' \
    --exclude '/*.db-wal' \
    --exclude '/*.sqlite' \
    --exclude '/*.sqlite-journal' \
    --exclude '/*.sqlite-shm' \
    --exclude '/*.sqlite-wal' \
    --exclude '/data/' \
    --exclude '/prisma/*.db' \
    --exclude '/prisma/*.db-journal' \
    --exclude '/prisma/*.db-shm' \
    --exclude '/prisma/*.db-wal' \
    --exclude '/prisma/*.sqlite' \
    --exclude '/prisma/*.sqlite-journal' \
    --exclude '/prisma/*.sqlite-shm' \
    --exclude '/prisma/*.sqlite-wal' \
    --exclude '/public/uploads/' \
    --exclude '/temp/' \
    --exclude '/tmp/' \
    --exclude '/.claude/' \
    --exclude '/.deploy-worktree/' \
    --exclude '/.worktrees/' \
    --exclude '.playwright-mcp' \
    --exclude '.capture' \
    --exclude '/.production-archives/' \
    --exclude '/docs/research/.*-qa-*.png' \
    --exclude '/.claude-flow' \
    --exclude '/.codegraph' \
    --exclude '/.kiro' \
    --exclude '*.tsbuildinfo' \
    --exclude '*.test.ts' \
    --exclude '*.test.tsx' \
    --exclude '/tests' \
    --exclude '/docs/superpowers' \
    ./ "${SSH_TARGET}:${REMOTE_APP_DIR}/releases/current/"
}

backup_remote() {
  rsh_stdin "$REMOTE_APP_DIR" "$DEPLOYMENT_ID" "$BACKUP_RETENTION" <<'REMOTE_BACKUP'
set -euo pipefail
app_dir="$1"
deployment_id="$2"
retention="$3"
cd "$app_dir"
mkdir -p data/backups

# SQLite online backup + quick_check. File chỉ ~1MB nên vẫn làm mỗi deploy.
db_backup="data/backups/prod-predeploy-${deployment_id}.db"
python3 - "$db_backup" <<'PY'
import sqlite3
import sys

destination = sys.argv[1]
source = sqlite3.connect("file:data/prod.db?mode=ro", uri=True)
backup = sqlite3.connect(destination)
source.backup(backup)
result = backup.execute("pragma quick_check").fetchone()[0]
backup.close()
source.close()
if result != "ok":
    raise SystemExit(f"SQLite backup quick_check failed: {result}")
print(f"database_backup={destination}")
PY

# Các bản cũ ghi ảnh editor vào writable layer của container. Di chuyển sang
# volume /app/data trước khi thay container để không mất ảnh đã tải.
mkdir -p data/editor-uploads
if docker inspect thiepmungonline-web >/dev/null 2>&1 &&
   docker exec thiepmungonline-web test -d /app/public/uploads 2>/dev/null; then
  docker cp thiepmungonline-web:/app/public/uploads/. data/editor-uploads/
fi

# Hardlink snapshot thay cho `tar -czf`. Ảnh editor được đặt tên theo uuid và
# không bị ghi đè, nên hardlink an toàn: snapshot chỉ tốn chỗ cho file mới,
# và thao tác gần như tức thì thay vì gzip lại 78MB mỗi deploy.
snapshot_uploads="data/backups/editor-uploads-snapshot-${deployment_id}"
rm -rf -- "$snapshot_uploads"
cp -al data/editor-uploads "$snapshot_uploads"
echo "uploads_snapshot=$snapshot_uploads"

if [ -d data/guest-media ]; then
  snapshot_guest="data/backups/guest-media-snapshot-${deployment_id}"
  rm -rf -- "$snapshot_guest"
  cp -al data/guest-media "$snapshot_guest"
  echo "guest_media_snapshot=$snapshot_guest"
fi

if [ -d data/slideshow-media ]; then
  snapshot_slideshow="data/backups/slideshow-media-snapshot-${deployment_id}"
  rm -rf -- "$snapshot_slideshow"
  cp -al data/slideshow-media "$snapshot_slideshow"
  echo "slideshow_media_snapshot=$snapshot_slideshow"
fi

# find trả 0 kể cả khi không khớp gì, nên không làm `set -o pipefail` giết
# script như `ls glob`. Sắp theo mtime giảm dần rồi bỏ N bản mới nhất.
prune_group() {
  local pattern="$1"
  find data/backups -maxdepth 1 -name "$pattern" -printf '%T@\t%p\n' 2>/dev/null \
    | sort -rn \
    | tail -n "+$((retention + 1))" \
    | cut -f2- \
    | while IFS= read -r stale; do
        rm -rf -- "$stale"
      done
}
prune_group 'prod-predeploy-*.db'
prune_group 'editor-uploads-predeploy-*.tar.gz'
prune_group 'guest-media-predeploy-*.tar.gz'
prune_group 'editor-uploads-snapshot-*'
prune_group 'guest-media-snapshot-*'
prune_group 'slideshow-media-snapshot-*'
echo "backups_mb=$(du -sm data/backups | cut -f1)"
REMOTE_BACKUP
}

build_next > "$BUILD_LOG" 2>&1 &
build_pid=$!
rsync_source > "$RSYNC_LOG" 2>&1 &
rsync_pid=$!
backup_pid=""
if [[ "$SMOKE_ONLY" != "1" ]]; then
  backup_remote > "$BACKUP_LOG" 2>&1 &
  backup_pid=$!
fi

parallel_failed=0
wait "$build_pid" || { echo "❌ Build Next thất bại:"; tail -40 "$BUILD_LOG"; parallel_failed=1; }
wait "$rsync_pid" || { echo "❌ Rsync source thất bại:"; tail -20 "$RSYNC_LOG"; parallel_failed=1; }
if [[ -n "$backup_pid" ]]; then
  wait "$backup_pid" || { echo "❌ Backup thất bại:"; tail -20 "$BACKUP_LOG"; parallel_failed=1; }
fi

if [[ "$parallel_failed" == 1 ]]; then
  echo "❌ Dừng deploy, container cũ giữ nguyên."
  exit 1
fi

grep -E '^(database_backup|uploads_snapshot|guest_media_snapshot|slideshow_media_snapshot|backups_mb)=' "$BACKUP_LOG" | sed 's/^/   /' || true
rm -f "$BUILD_LOG" "$RSYNC_LOG" "$BACKUP_LOG"
log_step "build Next + rsync source + backup (song song)"

# ---------------------------------------------------------------------------
# 2. Rsync artifact đã build sang Mini PC
# ---------------------------------------------------------------------------
if [[ ! -f .next/standalone/server.js ]]; then
  echo "❌ Không tìm thấy .next/standalone/server.js. Next có bật output: 'standalone' không?"
  exit 1
fi

echo "📦 Rsync artifact (~105MB, delta) → releases/current/.next-prebuilt/"
ARTIFACT_STAGE="$(mktemp -d "${TMPDIR:-/tmp}/thiepmungonline-prebuilt.XXXXXX")"
cleanup_artifact() {
  rm -rf -- "$ARTIFACT_STAGE"
  transport_close
}
trap cleanup_artifact EXIT

mkdir -p "$ARTIFACT_STAGE/.next" "$ARTIFACT_STAGE/static"
cp .next/standalone/server.js "$ARTIFACT_STAGE/server.js"

# Sinh package.json "chỉ dependency" cho stage dependencies của Dockerfile.
# Giữ đúng những field ảnh hưởng tới việc npm giải dependency, bỏ scripts /
# description / keywords... Nhờ vậy sửa scripts hay đổi mô tả không còn làm
# npm ci + npm prune chạy lại ~200s trên Mini PC.
node -e '
const fs = require("node:fs");
const pkg = JSON.parse(fs.readFileSync("package.json", "utf8"));
// name + version phải giữ để npm ci không báo lệch với package-lock.json.
// overrides + engines ảnh hưởng trực tiếp tới cây dependency được cài.
const fields = [
  "name",
  "version",
  "private",
  "engines",
  "overrides",
  "dependencies",
  "devDependencies",
  "optionalDependencies",
  "peerDependencies",
  "peerDependenciesMeta",
  "bundleDependencies",
  "packageManager",
  "workspaces",
];
const trimmed = {};
for (const field of fields) {
  if (pkg[field] !== undefined) trimmed[field] = pkg[field];
}
fs.writeFileSync(process.argv[1], JSON.stringify(trimmed, null, 2) + "\n");
' "$ARTIFACT_STAGE/package.deps.json"
# Chỉ lấy .next của standalone + static. Bỏ .next/standalone/node_modules:
# nó được trace trên macOS nên có thể chứa native addon Mach-O; Mini PC dựng
# node_modules amd64 riêng trong layer cache của nó.
rsync -a --delete .next/standalone/.next/ "$ARTIFACT_STAGE/.next/"
rsync -a --delete .next/static/ "$ARTIFACT_STAGE/static/"

rsync -a --delete \
  --rsh "$RSYNC_RSH" \
  "$ARTIFACT_STAGE/" "${SSH_TARGET}:${REMOTE_APP_DIR}/releases/current/.next-prebuilt/"
log_step "rsync artifact"

# ---------------------------------------------------------------------------
# 3. Migration preflight (read-only, fail-closed)
# ---------------------------------------------------------------------------
echo "🔎 Migration preflight (read-only)"
set +e
rsh_stdin "$REMOTE_APP_DIR" <<'REMOTE_PREFLIGHT'
set -euo pipefail
app_dir="$1"
cd "$app_dir"
python3 releases/current/scripts/migration-preflight.py \
  releases/current/prisma/migrations \
  data/prod.db
REMOTE_PREFLIGHT
preflight_status=$?
set -e

case "$preflight_status" in
  0)
    NEEDS_MIGRATION=0
    echo "   Không có migration pending → bỏ qua migration image."
    ;;
  10)
    NEEDS_MIGRATION=1
    echo "   Có migration pending → sẽ build migration image và migrate."
    ;;
  *)
    echo "❌ Migration preflight fail-closed (exit ${preflight_status}). Dừng deploy, giữ container cũ."
    exit 1
    ;;
esac
log_step "migration preflight"

# ---------------------------------------------------------------------------
# 4. Lắp image trên Mini PC (chỉ COPY, không compile) + migrate nếu cần
# ---------------------------------------------------------------------------
echo "🏗️  Lắp ${VERSION_IMAGE} trên Mini PC (native amd64, chỉ COPY)"
rsh_stdin \
  "$REMOTE_APP_DIR" "$VERSION_IMAGE" "$MIGRATE_IMAGE" \
  "$([[ "$SMOKE_ONLY" == "1" ]] && echo 0 || echo "$NEEDS_MIGRATION")" <<'REMOTE_BUILD'
set -euo pipefail
app_dir="$1"
version_image="$2"
migrate_image="$3"
needs_migration="$4"
cd "$app_dir/releases/current"

# Không cần --platform: Mini PC vốn là amd64 nên build native, không QEMU.
# node_modules nằm ở stage `dependencies`, chỉ rebuild khi package-lock đổi.
#
# --provenance=false là bắt buộc, không phải tuỳ chọn: mặc định BuildKit gắn
# thêm attestation và bọc image trong một manifest list. Khi đó
# `docker image inspect --format '{{.Id}}'` trả digest của manifest list, không
# bao giờ khớp `{{.Image}}` của container, nên bước kiểm tra "chạy đúng image"
# ở phần promote sẽ fail và rollback oan.
docker build \
  --provenance=false \
  --file Dockerfile.prebuilt \
  --target runner \
  --tag "$version_image" \
  .

docker image inspect "$version_image" --format 'built_image={{.Id}} created={{.Created}}'

if [ "$needs_migration" = 1 ]; then
  docker build \
    --provenance=false \
    --file Dockerfile.prebuilt \
    --target migrate \
    --tag "$migrate_image" \
    .

  docker run --rm \
    --user "$(id -u):$(id -g)" \
    -v "$app_dir/data:/app/data" \
    -e DATABASE_URL=file:/app/data/prod.db \
    "$migrate_image" \
    npx prisma migrate deploy

  docker image rm "$migrate_image" >/dev/null 2>&1 || true
else
  echo "migration_skipped=1"
fi
REMOTE_BUILD
log_step "lắp image + migrate database"

# ---------------------------------------------------------------------------
# 4b. SMOKE_ONLY: chạy thử image mới ở cổng riêng rồi dừng
# ---------------------------------------------------------------------------
if [[ "$SMOKE_ONLY" == "1" ]]; then
  echo "🩺 Smoke test ${VERSION_IMAGE} trong container tạm (cổng ${SMOKE_PORT}), không đụng production"
  rsh_stdin \
    "$REMOTE_APP_DIR" "$VERSION_IMAGE" "$SMOKE_PORT" "$VERIFY_ASSET" "$VERIFY_DEMO_PATH" "$DEPLOYMENT_ID" <<'REMOTE_SMOKE'
set -euo pipefail
app_dir="$1"
image="$2"
port="$3"
verify_asset="$4"
demo_path="$5"
deployment_id="$6"
cd "$app_dir"

name="thiepmungonline-smoke-${deployment_id}"
cleanup() {
  docker rm -f "$name" >/dev/null 2>&1 || true
}
trap cleanup EXIT

# Native module phải load được trên Linux amd64 trước khi thử chạy server.
docker run --rm --entrypoint node "$image" -e \
  'require("better-sqlite3"); require("sharp"); console.log("native_modules_ok")'

# Database mount read-only để smoke test không thể ghi vào prod.db.
docker run -d --name "$name" \
  -p "127.0.0.1:${port}:3000" \
  --env-file .env \
  -e NODE_ENV=production \
  -e DATABASE_URL=file:/app/data/prod.db \
  -e PORT=3000 \
  -e HOSTNAME=0.0.0.0 \
  -v "$app_dir/data:/app/data:ro" \
  -v "$app_dir/releases/current/public:/app/public:ro" \
  "$image" >/dev/null

ready=0
for _ in $(seq 1 60); do
  code=$(curl -sS -o /dev/null -w '%{http_code}' "http://127.0.0.1:${port}/" || true)
  if [ "$code" = 200 ]; then ready=1; break; fi
  sleep 1
done
if [ "$ready" != 1 ]; then
  echo "❌ Smoke container không trả 200."
  docker logs --tail 120 "$name" 2>&1 || true
  exit 1
fi
echo "smoke_home=200"

asset_code=$(curl -sS -o /dev/null -w '%{http_code}' "http://127.0.0.1:${port}${verify_asset}" || true)
echo "smoke_asset=${asset_code}"
[ "$asset_code" = 200 ] || { echo "❌ Bind-mount public/ không phục vụ được ${verify_asset}."; exit 1; }

html=$(curl -sS "http://127.0.0.1:${port}${demo_path}")
case "$html" in
  *"data-dpl-id=\"${deployment_id}\""*) echo "smoke_dpl_id=ok" ;;
  *) echo "❌ Deployment ID không có trong HTML."; exit 1 ;;
esac
echo "smoke=ok"
REMOTE_SMOKE
  log_step "smoke test"
  echo "✅ Smoke test ${DEPLOYMENT_ID} PASS trong ${SECONDS}s. Production không bị thay đổi."
  echo "   Deploy thật: ./scripts/deploy-fast.sh"
  exit 0
fi

# ---------------------------------------------------------------------------
# 5. Seed danh sách nhạc nếu Track đang trống
# ---------------------------------------------------------------------------
echo "🎵 Seed danh sách nhạc nếu Track đang trống"
rsh_stdin "$REMOTE_APP_DIR" <<'REMOTE_TRACK_SEED'
set -euo pipefail
app_dir="$1"
cd "$app_dir"
python3 releases/current/scripts/seed-tracks-if-empty.py \
  data/prod.db \
  releases/current/prisma/tracks.json
REMOTE_TRACK_SEED
log_step "seed danh sách nhạc"

# ---------------------------------------------------------------------------
# 6. Promote + restart + verify (tự rollback nếu bất kỳ kiểm tra nào fail)
# ---------------------------------------------------------------------------
echo "🔄 Promote image và recreate riêng web"
rsh_stdin \
  "$REMOTE_APP_DIR" "$WEB_IMAGE" "$VERSION_IMAGE" "$ROLLBACK_IMAGE" \
  "$WEB_PORT" "$DEPLOYMENT_ID" "$PUBLIC_URL" "$VERIFY_ASSET" "$VERIFY_DEMO_PATH" <<'REMOTE_RESTART'
set -euo pipefail
app_dir="$1"
web_image="$2"
version_image="$3"
rollback_image="$4"
web_port="$5"
deployment_id="$6"
public_url="$7"
verify_asset="$8"
demo_path="$9"
cd "$app_dir"

old_image_id=$(docker inspect thiepmungonline-web --format '{{.Image}}')
docker image tag "$old_image_id" "$rollback_image"
docker image tag "$version_image" "$web_image"

rollback() {
  echo "↩️  Rollback về $rollback_image"
  docker image tag "$rollback_image" "$web_image"
  docker compose up -d --no-build --no-deps --force-recreate web
}
trap 'rollback' ERR

docker compose up -d --no-build --no-deps --force-recreate web

ready=0
for _ in $(seq 1 90); do
  code=$(curl -sS -o /dev/null -w '%{http_code}' "http://127.0.0.1:${web_port}/" || true)
  health=$(docker inspect thiepmungonline-web --format '{{if .State.Health}}{{.State.Health.Status}}{{else}}none{{end}}' 2>/dev/null || true)
  if [ "$code" = 200 ] && [ "$health" = healthy ]; then
    ready=1
    break
  fi
  sleep 1
done

if [ "$ready" != 1 ]; then
  echo "❌ Web không healthy trước timeout."
  docker logs --tail 200 thiepmungonline-web 2>&1 || true
  false
fi

running_image=$(docker inspect thiepmungonline-web --format '{{.Image}}')
expected_image=$(docker image inspect "$version_image" --format '{{.Id}}')
if [ "$running_image" != "$expected_image" ]; then
  echo "❌ Container chạy sai image: $running_image != $expected_image"
  false
fi

# public/ giờ là bind-mount, không còn nằm trong image. Kiểm tra một asset thật
# để bắt trường hợp mount thiếu hoặc sai đường dẫn trước khi giữ bản mới.
asset_code=$(curl -sS -o /dev/null -w '%{http_code}' "http://127.0.0.1:${web_port}${verify_asset}" || true)
if [ "$asset_code" != 200 ]; then
  echo "❌ Asset public ${verify_asset} trả HTTP ${asset_code}. Bind-mount public/ có vấn đề."
  false
fi

html=$(curl -sS "http://127.0.0.1:${web_port}${demo_path}")
if [[ "$html" != *"data-dpl-id=\"${deployment_id}\""* ]]; then
  echo "❌ Deployment ID chưa xuất hiện trong HTML production."
  false
fi
if [[ "$html" != *"rel=\"canonical\" href=\"${public_url}${demo_path}\""* ]]; then
  echo "❌ Canonical production không đúng ${public_url}."
  false
fi

db_check=$(python3 - <<'PY'
import sqlite3

connection = sqlite3.connect("file:data/prod.db?mode=ro", uri=True)
print(connection.execute("pragma quick_check").fetchone()[0])
connection.close()
PY
)
if [ "$db_check" != ok ]; then
  echo "❌ SQLite quick_check thất bại: $db_check"
  false
fi

trap - ERR
echo "running_image=$running_image health=$health asset=$asset_code database=$db_check"
REMOTE_RESTART
log_step "restart + healthcheck"

# ---------------------------------------------------------------------------
# 7. Verify URL public
# ---------------------------------------------------------------------------
echo "🌐 Verify public URLs"
for path in "/" "$VERIFY_DEMO_PATH"; do
  code=$(curl -L -sS -o /dev/null -w '%{http_code}' --max-time 30 "${PUBLIC_URL}${path}" || true)
  echo "   ${path} → HTTP ${code}"
  if [ "${code}" != 200 ]; then
    echo "❌ Public healthcheck thất bại tại ${path}."
    exit 1
  fi
done
log_step "verify public"

# VPS uses timezone-explicit systemd timers. Never add duplicate legacy cron jobs.
if [[ "${MANAGED_SCHEDULERS:-}" == systemd ]]; then
  rsh 'systemctl is-active --quiet thiepmungonline-payos-reconcile.timer thiepmungonline-trial-reminders.timer thiepmungonline-backup.timer'
  echo "✅ Deploy ${DEPLOYMENT_ID} complete; existing systemd schedules preserved."
  exit 0
fi

# ---------------------------------------------------------------------------
# 8. Đảm bảo cron dọn Docker storage đã cài (không prune đồng bộ trong deploy)
# ---------------------------------------------------------------------------
echo "🧹 Đảm bảo cron dọn Docker storage đã được cài"
rsh_stdin "$REMOTE_APP_DIR" <<'REMOTE_CLEANUP'
set -euo pipefail
app_dir="$1"

marker='# thiepmungonline Docker storage maintenance'
# Chạy hàng ngày, không phải hàng tuần. Build cache sinh ra tới ~10GB trong một
# ngày build nhiều, nên chu kỳ tuần cộng với chính sách giữ 120h có thể tích tụ
# gần hai tuần cache giữa hai lần dọn. Đĩa đã từng bò lên 93% đúng vì vậy.
cron_job="17 4 * * * $app_dir/releases/current/scripts/docker-storage-maintenance.sh >> $app_dir/docker-storage-maintenance.log 2>&1 $marker"
(
  crontab -l 2>/dev/null | grep -Fv "$marker" || true
  printf '%s\n' "$cron_job"
) | crontab -
echo "cron_installed=1"
REMOTE_CLEANUP
log_step "cleanup Docker storage"

# ---------------------------------------------------------------------------
# 9. Đảm bảo cron đối soát payOS đã cài
# ---------------------------------------------------------------------------
# Gọi HTTP route của app đang chạy, KHÔNG dùng `docker exec ... npm run`. Image
# production là Next standalone build: trong container chỉ có `server.js`,
# `node_modules`, `public`, `data` — không có `package.json`, `src/`, `scripts/`
# hay `tsx`, nên mọi lệnh `npm run` trong đó đều chết với ENOENT.
echo "⏰ Đảm bảo cron đối soát payOS đã được cài"
rsh_stdin "$REMOTE_APP_DIR" <<'REMOTE_CRON'
set -euo pipefail
app_dir="$1"

runner="$app_dir/releases/current/scripts/cron-hit-endpoint.sh"
if [[ ! -x "$runner" ]]; then
  echo "❌ Không thấy $runner (hoặc chưa có quyền chạy)."
  exit 1
fi

reconcile_marker='# thiepmungonline payOS reconciliation'
reminder_marker='# thiepmungonline trial reminder emails'
legacy_reminder_marker='# thiepmungonline trial payment reminder'

# Đối soát mỗi 2 tiếng. Webhook payOS là đường xác nhận duy nhất khi khách đã đóng
# tab; webhook mất thì tiền vào mà thiệp vẫn ẩn và không ai biết. 2 tiếng là mức
# phát hiện đủ nhanh trong khi số đơn chưa chốt trong cửa sổ 7 ngày vẫn nhỏ.
reconcile_job="23 */2 * * * $runner /api/cron/payos-reconcile >> $app_dir/payos-reconcile.log 2>&1 $reconcile_marker"

# Mỗi giờ từ 09:00 đến 21:00 giờ Việt Nam (13 lượt/ngày).
# Mỗi lượt chỉ xử lý email mới đủ điều kiện hoặc retry an toàn.
# Không chạy ban đêm; lượt 09:00 xử lý phần phát sinh sau 21:00 hôm trước.
# Điều kiện gửi và các marker chống gửi trùng giữ nguyên.
# Chạy dày hơn KHÔNG sinh email trùng, ba lớp độc lập cùng chặn: marker
# `reminderSentAt`/`expiredReminderSentAt` trên thiệp, `dedupeKey` unique trên
# EmailDelivery (status `sent` -> không gọi provider), và idempotency key gửi kèm
# cho Resend. Bốn lượt sau cũng thay luôn vai trò retry của lượt 09:15 cũ, và vẫn
# nằm gọn trong cửa sổ retry an toàn 23h của `email-delivery.ts` — quá mốc đó
# delivery bị chặn thành `manual-review` thay vì mạo hiểm gọi provider lần nữa.
#
# Runner kiểm tra HTTP 2xx và nằm trong repo nên dựng lại host không làm cron biến
# mất. Job legacy `trigger-trial-reminders.sh` được lọc khỏi crontab trong cùng
# phép ghi để không bao giờ tồn tại hai scheduler.
reminder_job="0 9,10,11,12,13,14,15,16,17,18,19,20,21 * * * $runner /api/cron/trial-reminders >> $app_dir/trial-reminders.log 2>&1 $reminder_marker"
(
  crontab -l 2>/dev/null \
    | grep -Fv "$reconcile_marker" \
    | grep -Fv "$reminder_marker" \
    | grep -Fv "$legacy_reminder_marker" \
    | grep -Fv 'trigger-trial-reminders.sh' \
    | grep -Fv 'npm run reconcile:payos' \
    | grep -Fv 'npm run reminders:trial' \
    || true
  printf '%s\n' "$reconcile_job"
  printf '%s\n' "$reminder_job"
) | crontab -
echo "cron_installed=1"
REMOTE_CRON
log_step "cron đối soát payOS"

echo "✅ Deploy ${DEPLOYMENT_ID} hoàn tất trong ${SECONDS}s (transport=${TRANSPORT_KIND})."

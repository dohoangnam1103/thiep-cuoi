#!/usr/bin/env bash
# Build and verify Next on the Mac; assemble native dependencies/image on VPS.
# Gate/build receipts reuse only identical inputs and verified artifacts.
# Each attempt stages an independent source release; promote source + image
# together, keeping rollback active through origin/public/scheduler checks.
# Options: DEPLOY_PREPARE_ONLY=1 (local only), SMOKE_ONLY=1 (isolated VPS),
# PUBLIC_URL, VERIFY_DEMO_PATH (follows canonical renamed through the DB).

set -euo pipefail

cd "$(dirname "$0")/.."
export DEPLOY_CACHE_DIR="${DEPLOY_CACHE_DIR:-$PWD/.deploy-cache}"

if [[ "${DEPLOY_LOCAL_BUILD_CONTEXT:-0}" != "1" ]]; then
  bash scripts/run-in-local-build-context.sh bash scripts/deploy-fast.sh
  exit $?
fi

# shellcheck source=scripts/lib/ssh-transport.sh
source "scripts/lib/ssh-transport.sh"

REMOTE_LAN_IP="${REMOTE_LAN_IP:-163.223.9.198}"
REMOTE_LAN_USER="${REMOTE_LAN_USER:-root}"
REMOTE_TUNNEL_ALIAS="${REMOTE_TUNNEL_ALIAS:-root@163.223.9.198}"
REMOTE_APP_DIR="${REMOTE_APP_DIR:-/srv/thiepmungonline}"
WEB_IMAGE="${WEB_IMAGE:-thiepmungonline-web:production}"
PUBLIC_URL="${PUBLIC_URL:-https://thiepmungonline.com}"
WEB_PORT="${WEB_PORT:-3211}"
DEPLOYMENT_ID="${DEPLOYMENT_ID:-$(date -u +%Y%m%d%H%M%S)}"
RELEASE_ID="$(date -u +%Y%m%d%H%M%S)-$$"
CANDIDATE_DIR="$REMOTE_APP_DIR/releases/candidate-$RELEASE_ID"
BACKUP_RETENTION="${BACKUP_RETENTION:-10}"
SKIP_BUILD="${SKIP_BUILD:-0}"
MANAGED_SCHEDULERS="${MANAGED_SCHEDULERS:-systemd}"
# SMOKE_ONLY=1: dựng image mới rồi chạy thử trong container tạm ở cổng khác,
# xác minh xong thì dừng. Không backup, không migrate, không đụng container
# production. Dùng để kiểm tra pipeline trước khi deploy thật.
SMOKE_ONLY="${SMOKE_ONLY:-0}"
SMOKE_PORT="${SMOKE_PORT:-3299}"
VERIFY_ASSET="${VERIFY_ASSET:-/chungdoi/icon-v2.png}"
VERIFY_DEMO_PATH="${VERIFY_DEMO_PATH:-/mau-thiep/long-phung-v3-do/demo}"

IMAGE_REPOSITORY="${WEB_IMAGE%:*}"
VERSION_IMAGE="${IMAGE_REPOSITORY}:${RELEASE_ID}"
MIGRATE_IMAGE="${IMAGE_REPOSITORY}:migrate-${RELEASE_ID}"
ROLLBACK_IMAGE="${IMAGE_REPOSITORY}:rollback-${RELEASE_ID}"

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
source scripts/prepare-deploy.sh
prepare_deploy_gate
log_step "local preflight + i18n gate"
VERSION_IMAGE="${IMAGE_REPOSITORY}:${RELEASE_ID}"
MIGRATE_IMAGE="${IMAGE_REPOSITORY}:migrate-${RELEASE_ID}"
if [[ "${DEPLOY_PREPARE_ONLY:-0}" == 1 ]]; then
  (build_next)
  log_step "production artifact prepared on Mac"
  exit 0
fi

echo "🚀 Deploy nhanh thiepmungonline → ${REMOTE_APP_DIR} (dpl=${DEPLOYMENT_ID})"

# ---------------------------------------------------------------------------
# 0. Chọn đường truyền + xác minh đúng máy production
# ---------------------------------------------------------------------------
transport_init "$REMOTE_LAN_IP" "$REMOTE_LAN_USER" "$REMOTE_TUNNEL_ALIAS"

RELEASE_STAGED=0
PROMOTION_STARTED=0
DEPLOY_COMMITTED=0
ARTIFACT_STAGE=""

deploy_release() {
  rsh_stdin "$1" "$REMOTE_APP_DIR" "$RELEASE_ID" < scripts/deploy-release.sh
}

cleanup_deploy() {
  local status="$1"
  if [[ "$PROMOTION_STARTED" == 1 && "$DEPLOY_COMMITTED" != 1 ]]; then
    echo "↩️  Restoring previous source and image after failed promotion" >&2
    if deploy_release restore && rsh_stdin "$REMOTE_APP_DIR" "$ROLLBACK_IMAGE" "$WEB_IMAGE" <<'REMOTE_ROLLBACK'
set -euo pipefail
cd "$1"
docker image tag "$2" "$3"
docker compose up -d --no-build --no-deps --force-recreate web
REMOTE_ROLLBACK
    then
      echo 'rollback=ok'
    else
      echo '❌ Rollback incomplete. Deployment lock retained; inspect production before retry.' >&2
      transport_close
      return 1
    fi
  fi
  if [[ "$RELEASE_STAGED" == 1 ]]; then deploy_release cleanup || true; fi
  transport_close
  return "$status"
}
trap 'cleanup_deploy $?' EXIT

# Mở sẵn master connection để các job song song bên dưới không đua nhau tạo socket.
rsh true

REMOTE_IPS=$(rsh "hostname -I")
if [[ " ${REMOTE_IPS} " != *" ${REMOTE_LAN_IP} "* ]]; then
  echo "❌ Host không trỏ tới ${REMOTE_LAN_IP} (nhận được: ${REMOTE_IPS})."
  exit 1
fi

if ! rsh "test -f ${REMOTE_APP_DIR}/docker-compose.yml && grep -q 'releases/current/public:/app/public' ${REMOTE_APP_DIR}/docker-compose.yml"; then
  echo "❌ docker-compose.yml trên VPS chưa có bind-mount public/."
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
# 1. Song song: build trên Mac ‖ rsync source ‖ backup trên VPS
# ---------------------------------------------------------------------------
echo "⚡ Chạy song song: build Next (Mac) ‖ rsync source ‖ backup (VPS)"

RSYNC_RSH="$(rsync_rsh)"
# mktemp của BSD (macOS) chỉ thay XXXXXX khi nó nằm ở CUỐI template. Nếu để
# hậu tố ".log" phía sau, nó tạo file tên literal "...XXXXXX.log" rồi lần chạy
# sau fail vì "File exists".
BUILD_LOG="$(mktemp "${TMPDIR:-/tmp}/thiepmungonline-build.XXXXXX")"
RSYNC_LOG="$(mktemp "${TMPDIR:-/tmp}/thiepmungonline-rsync.XXXXXX")"
BACKUP_LOG="$(mktemp "${TMPDIR:-/tmp}/thiepmungonline-backup.XXXXXX")"

rsync_source() {
  bash scripts/deploy-sync-source.sh "$PWD" "$SSH_TARGET" "$CANDIDATE_DIR" "$RSYNC_RSH" "$BASELINE_DIR"
}

run_timed() {
  local label="$1"; shift
  local started=$SECONDS
  "$@"
  echo "duration_${label}_seconds=$((SECONDS - started))"
}

backup_remote() {
  rsh_stdin "$REMOTE_APP_DIR" "$RELEASE_ID" "$BACKUP_RETENTION" <<'REMOTE_BACKUP'
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

deploy_release stage
RELEASE_STAGED=1
BASELINE_DIR=$(deploy_release baseline)
run_timed build build_next > "$BUILD_LOG" 2>&1 &
build_pid=$!
run_timed source_sync rsync_source > "$RSYNC_LOG" 2>&1 &
rsync_pid=$!
backup_pid=""
if [[ "$SMOKE_ONLY" != "1" ]]; then
  run_timed backup backup_remote > "$BACKUP_LOG" 2>&1 &
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

# Catch edits made while source sync/build ran, including cache-hit attempts.
[[ "$GATE_KEY" == "$(python3 scripts/deploy-cache.py key gate "$PWD")" &&
   "$BUILD_KEY" == "$(python3 scripts/deploy-cache.py key build "$PWD")" &&
   "$DEPLOY_BUILD_DB_HASH" == "$(node scripts/check-deploy-inputs.mjs --db-hash)" ]] || {
  echo 'Inputs changed during deployment preparation; production was not promoted.' >&2
  exit 1
}

grep -E '^(database_backup|uploads_snapshot|guest_media_snapshot|slideshow_media_snapshot|backups_mb)=' "$BACKUP_LOG" | sed 's/^/   /' || true
grep -E '^(duration_|Number of files|Total transferred file size|Total bytes sent|Total bytes received)' "$BUILD_LOG" "$RSYNC_LOG" "$BACKUP_LOG" | sed 's/^[^:]*:/   /' || true
rm -f "$BUILD_LOG" "$RSYNC_LOG" "$BACKUP_LOG"
log_step "build Next + rsync source + backup (song song)"

# ---------------------------------------------------------------------------
# 2. Rsync artifact đã build sang VPS
# ---------------------------------------------------------------------------
ARTIFACT_STAGE=$(python3 scripts/deploy-cache.py build-path "$DEPLOY_CACHE_DIR" "$BUILD_KEY")
echo "📦 Rsync verified artifact → candidate release"
rsync -a --checksum --delete --stats \
  --link-dest="$BASELINE_DIR/.next-prebuilt" \
  --rsh "$RSYNC_RSH" \
  "$ARTIFACT_STAGE/" "${SSH_TARGET}:${CANDIDATE_DIR}/.next-prebuilt/"
deploy_release cache
log_step "rsync artifact"

# ---------------------------------------------------------------------------
# 3. Migration preflight (read-only, fail-closed)
# ---------------------------------------------------------------------------
echo "🔎 Migration preflight (read-only)"
set +e
rsh_stdin "$REMOTE_APP_DIR" "$CANDIDATE_DIR" <<'REMOTE_PREFLIGHT'
set -euo pipefail
app_dir="$1"
cd "$app_dir"
python3 "$2/scripts/migration-preflight.py" \
  "$2/prisma/migrations" \
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
# 4. Lắp image trên VPS (chỉ COPY, không compile) + migrate nếu cần
# ---------------------------------------------------------------------------
echo "🏗️  Lắp ${VERSION_IMAGE} trên VPS (native amd64, chỉ COPY)"
rsh_stdin \
  "$REMOTE_APP_DIR" "$VERSION_IMAGE" "$MIGRATE_IMAGE" \
  "$([[ "$SMOKE_ONLY" == "1" ]] && echo 0 || echo "$NEEDS_MIGRATION")" "$CANDIDATE_DIR" <<'REMOTE_BUILD'
set -euo pipefail
app_dir="$1"
version_image="$2"
migrate_image="$3"
needs_migration="$4"
cd "$5"

# Resolve the immutable base before choosing a cached assembled image. No Next
# compilation runs here; native dependencies stay in existing Docker layers.
platform=$(docker version --format '{{.Server.Os}}/{{.Server.Arch}}')
node_version=$(python3 - <<'PY_NODE_VERSION'
import re
from pathlib import Path
match = re.search(r"^ARG NODE_VERSION=([A-Za-z0-9_.:@/-]+)$", Path("Dockerfile.prebuilt").read_text(), re.M)
if not match:
    raise SystemExit("Dockerfile.prebuilt must declare one valid NODE_VERSION default")
print(match.group(1))
PY_NODE_VERSION
)
base_digest=$(timeout --kill-after=5s 30s docker buildx imagetools inspect "node:$node_version" --format '{{.Manifest.Digest}}')
[[ "$base_digest" =~ ^sha256:[a-f0-9]{64}$ ]] || { echo 'Invalid Node base digest'; exit 1; }
pinned_node_version="${node_version%%@*}@$base_digest"
assembly_key=$(python3 scripts/deploy-assembled-image-cache.py key .next-prebuilt "$PWD" "$base_digest" "$platform")
assembly_cache="$app_dir/.assembled-image-cache"
if image_id=$(python3 scripts/deploy-assembled-image-cache.py hit "$assembly_cache" "$assembly_key"); then
  echo "assembly_cache=hit image=$image_id"
  docker image tag "$image_id" "$version_image"
else
  echo 'assembly_cache=miss'
  # --provenance=false keeps the image ID comparable with container .Image.
  timeout --kill-after=15s 300s docker build \
    --provenance=false \
    --build-arg "NODE_VERSION=$pinned_node_version" \
    --label "io.thiepmungonline.assembly-key=$assembly_key" \
    --file Dockerfile.prebuilt \
    --target runner \
    --tag "$version_image" \
    .
  image_id=$(docker image inspect "$version_image" --format '{{.Id}}')
  python3 scripts/deploy-assembled-image-cache.py save "$assembly_cache" "$assembly_key" "$image_id" "$platform"
fi
docker image inspect "$version_image" --format 'built_image={{.Id}} created={{.Created}}'

if [ "$needs_migration" = 1 ]; then
  timeout --kill-after=15s 300s docker build \
    --build-arg "NODE_VERSION=$pinned_node_version" \
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
    "$REMOTE_APP_DIR" "$VERSION_IMAGE" "$SMOKE_PORT" "$VERIFY_ASSET" "$VERIFY_DEMO_PATH" "$DEPLOYMENT_ID" "$PUBLIC_URL" "$CANDIDATE_DIR" <<'REMOTE_SMOKE'
set -euo pipefail
app_dir="$1"
image="$2"
port="$3"
verify_asset="$4"
demo_path="$5"
deployment_id="$6"
public_url="$7"
candidate_dir="$8"
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
  -v "$candidate_dir/public:/app/public:ro" \
  "$image" >/dev/null

ready=0
deadline=$((SECONDS + 60))
while (( SECONDS < deadline )); do
  code=$(curl --connect-timeout 3 --max-time 8 -sS -o /dev/null -w '%{http_code}' "http://127.0.0.1:${port}/" || true)
  if [ "$code" = 200 ]; then ready=1; break; fi
  sleep 1
done
if [ "$ready" != 1 ]; then
  echo "❌ Smoke container không trả 200."
  docker logs --tail 120 "$name" 2>&1 || true
  exit 1
fi
echo "smoke_home=200"

asset_code=$(curl --connect-timeout 3 --max-time 8 -sS -o /dev/null -w '%{http_code}' "http://127.0.0.1:${port}${verify_asset}" || true)
echo "smoke_asset=${asset_code}"
[ "$asset_code" = 200 ] || { echo "❌ Bind-mount public/ không phục vụ được ${verify_asset}."; exit 1; }

# The stable probe path may be an alias whose canonical slug was edited in the
# production database. Follow that same-origin redirect before checking HTML.
html=$(curl --connect-timeout 3 --max-time 8 -sS -L --max-redirs 5 \
  "http://127.0.0.1:${port}${demo_path}")
case "$html" in
  *"data-dpl-id=\"${deployment_id}\""*) echo "smoke_dpl_id=ok" ;;
  *) echo "❌ Deployment ID không có trong HTML."; exit 1 ;;
esac
canonical_path=$(printf '%s' "$html" | \
  python3 "$candidate_dir/scripts/canonical-path-from-html.py" "$public_url")
canonical_html=$(curl --connect-timeout 3 --max-time 8 -sS "http://127.0.0.1:${port}${canonical_path}")
if [[ "$canonical_html" != *"data-dpl-id=\"${deployment_id}\""* ]]; then
  echo "❌ Canonical của image ứng viên không thuộc deployment hiện tại."
  exit 1
fi
if [[ "$canonical_html" != *"rel=\"canonical\" href=\"${public_url}${canonical_path}\""* ]]; then
  echo "❌ Canonical của image ứng viên không tự trỏ về chính nó."
  exit 1
fi
echo "smoke_canonical=${canonical_path}"
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
rsh_stdin "$REMOTE_APP_DIR" "$CANDIDATE_DIR" <<'REMOTE_TRACK_SEED'
set -euo pipefail
app_dir="$1"
cd "$app_dir"
python3 "$2/scripts/seed-tracks-if-empty.py" \
  data/prod.db \
  "$2/prisma/tracks.json"
REMOTE_TRACK_SEED
log_step "seed danh sách nhạc"

# ---------------------------------------------------------------------------
# 6. Promote + restart + verify (tự rollback nếu bất kỳ kiểm tra nào fail)
# ---------------------------------------------------------------------------
echo "🔄 Promote image và recreate riêng web"
rsh_stdin "$ROLLBACK_IMAGE" <<'REMOTE_SAVE_IMAGE'
set -euo pipefail
old_image_id=$(docker inspect thiepmungonline-web --format '{{.Image}}')
docker image tag "$old_image_id" "$1"
REMOTE_SAVE_IMAGE
PROMOTION_STARTED=1
deploy_release activate
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

docker image tag "$version_image" "$web_image"


docker compose up -d --no-build --no-deps --force-recreate web

ready=0
deadline=$((SECONDS + 90))
while (( SECONDS < deadline )); do
  code=$(curl --connect-timeout 3 --max-time 8 -sS -o /dev/null -w '%{http_code}' "http://127.0.0.1:${web_port}/" || true)
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
asset_code=$(curl --connect-timeout 3 --max-time 8 -sS -o /dev/null -w '%{http_code}' "http://127.0.0.1:${web_port}${verify_asset}" || true)
if [ "$asset_code" != 200 ]; then
  echo "❌ Asset public ${verify_asset} trả HTTP ${asset_code}. Bind-mount public/ có vấn đề."
  false
fi

html=$(curl --connect-timeout 3 --max-time 8 -sS -L --max-redirs 5 \
  "http://127.0.0.1:${web_port}${demo_path}")
if [[ "$html" != *"data-dpl-id=\"${deployment_id}\""* ]]; then
  echo "❌ Deployment ID chưa xuất hiện trong HTML production."
  false
fi
canonical_path=$(printf '%s' "$html" | \
  python3 releases/current/scripts/canonical-path-from-html.py "$public_url")
canonical_html=$(curl --connect-timeout 3 --max-time 8 -sS "http://127.0.0.1:${web_port}${canonical_path}")
if [[ "$canonical_html" != *"data-dpl-id=\"${deployment_id}\""* ]]; then
  echo "❌ Canonical production không thuộc deployment hiện tại."
  false
fi
if [[ "$canonical_html" != *"rel=\"canonical\" href=\"${public_url}${canonical_path}\""* ]]; then
  echo "❌ Canonical production không tự trỏ về chính nó."
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

echo "running_image=$running_image health=$health asset=$asset_code canonical=$canonical_path database=$db_check"
REMOTE_RESTART
log_step "restart + healthcheck"

# ---------------------------------------------------------------------------
# 7. Verify URL public
# ---------------------------------------------------------------------------
echo "🌐 Verify public URLs"
for path in "/" "$VERIFY_DEMO_PATH"; do
  code=$(curl --connect-timeout 5 -L -sS -o /dev/null -w '%{http_code}' --max-time 30 "${PUBLIC_URL}${path}" || true)
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
  DEPLOY_COMMITTED=1
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

DEPLOY_COMMITTED=1
echo "✅ Deploy ${DEPLOYMENT_ID} hoàn tất trong ${SECONDS}s (transport=${TRANSPORT_KIND})."

#!/usr/bin/env bash
#
# Deploy thiepmungonline trực tiếp trên Mini PC production.
#
# Chiến lược:
#   1. Rsync source (không đụng .env, database, uploads).
#   2. Backup SQLite bằng online-backup API và archive uploads.
#   3. Build native amd64 ngay trên production, tái dùng BuildKit/Turbopack cache.
#   4. Gắn version tag + rollback tag, recreate riêng web, chờ healthy.
#   5. Xác minh deployment ID, public URL và database integrity.
#
# Biến môi trường ghi đè được:
#   REMOTE_HOST       SSH host/alias production          (minipc)
#   EXPECTED_REMOTE_IP IP production để chống nhầm máy   (192.168.0.57)
#   REMOTE_APP_DIR    Thư mục app                        (/home/namdo/apps/thiepmungonline)
#   WEB_IMAGE         Image compose sử dụng              (thiepmungonline-web:latest)
#   WEB_PLATFORM      Kiến trúc                           (linux/amd64)
#   PUBLIC_URL        URL public                          (https://thiepmungonline.com)
#   WEB_PORT          Cổng LAN                            (3211)
#   DEPLOYMENT_ID     Mã version/cache-bust Next.js      (UTC timestamp)

set -euo pipefail

REMOTE_HOST="${REMOTE_HOST:-minipc}"
EXPECTED_REMOTE_IP="${EXPECTED_REMOTE_IP:-192.168.0.57}"
REMOTE_APP_DIR="${REMOTE_APP_DIR:-/home/namdo/apps/thiepmungonline}"
WEB_IMAGE="${WEB_IMAGE:-thiepmungonline-web:latest}"
WEB_PLATFORM="${WEB_PLATFORM:-linux/amd64}"
PUBLIC_URL="${PUBLIC_URL:-https://thiepmungonline.com}"
WEB_PORT="${WEB_PORT:-3211}"
DEPLOYMENT_ID="${DEPLOYMENT_ID:-$(date -u +%Y%m%d%H%M%S)}"
IMAGE_REPOSITORY="${WEB_IMAGE%:*}"
VERSION_IMAGE="${IMAGE_REPOSITORY}:${DEPLOYMENT_ID}"
MIGRATE_IMAGE="${IMAGE_REPOSITORY}:migrate-${DEPLOYMENT_ID}"
ROLLBACK_IMAGE="${IMAGE_REPOSITORY}:rollback-${DEPLOYMENT_ID}"

cd "$(dirname "$0")/.."

SECONDS=0
LAST_STEP_TS=0
log_step() {
  local now=$SECONDS
  local delta=$((now - LAST_STEP_TS))
  echo "⏱️  $1: ${delta}s (tổng ${now}s)"
  LAST_STEP_TS=$now
}

echo "🚀 Deploy thiepmungonline → ${REMOTE_HOST}:${REMOTE_APP_DIR} (dpl=${DEPLOYMENT_ID})"

# Docker context tên "minipc" trên máy phát triển có thể trỏ sang máy khác.
# Luôn đi qua đúng SSH alias production và chặn deploy nếu IP không khớp.
REMOTE_IPS=$(ssh "${REMOTE_HOST}" "hostname -I")
if [[ " ${REMOTE_IPS} " != *" ${EXPECTED_REMOTE_IP} "* ]]; then
  echo "❌ ${REMOTE_HOST} không trỏ tới ${EXPECTED_REMOTE_IP} (nhận được: ${REMOTE_IPS})."
  exit 1
fi
log_step "xác minh production host"

echo "📁 Rsync source → ${REMOTE_APP_DIR}/releases/current/"
rsync -az --delete \
  --exclude '.git' \
  --exclude 'node_modules' \
  --exclude '.next' \
  --exclude '.env' \
  --exclude '.env.local' \
  --exclude '.env.*.local' \
  --exclude '.DS_Store' \
  --exclude 'prisma/*.db' \
  --exclude 'prisma/*.db-journal' \
  --exclude 'public/uploads' \
  --exclude '.playwright-mcp' \
  --exclude '.capture' \
  --exclude 'temp' \
  ./ "${REMOTE_HOST}:${REMOTE_APP_DIR}/releases/current/"
log_step "rsync source"

echo "🛟 Backup database + uploads"
ssh "${REMOTE_HOST}" bash -s -- "${REMOTE_APP_DIR}" "${DEPLOYMENT_ID}" <<'REMOTE_BACKUP'
set -euo pipefail
app_dir="$1"
deployment_id="$2"
cd "$app_dir"
mkdir -p data/backups
db_backup="data/backups/prod-predeploy-${deployment_id}.db"
uploads_backup="data/backups/uploads-predeploy-${deployment_id}.tar.gz"
guest_media_backup="data/backups/guest-media-predeploy-${deployment_id}.tar.gz"

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

if [ -d releases/current/public/uploads ]; then
  tar -czf "$uploads_backup" -C releases/current/public uploads
  echo "uploads_backup=$uploads_backup"
fi

if [ -d data/guest-media ]; then
  tar -czf "$guest_media_backup" -C data guest-media
  echo "guest_media_backup=$guest_media_backup"
fi
REMOTE_BACKUP
log_step "backup dữ liệu"

echo "🔎 Migration preflight (read-only)"
set +e
ssh "${REMOTE_HOST}" bash -s -- "${REMOTE_APP_DIR}" <<'REMOTE_PREFLIGHT'
set -euo pipefail
app_dir="$1"
cd "$app_dir"
python3 releases/current/scripts/migration-preflight.py \
  releases/current/prisma/migrations \
  data/prod.db
REMOTE_PREFLIGHT
preflight_status=$?
set -e

if [[ $preflight_status -eq 0 ]]; then
  NEEDS_MIGRATION=0
  echo "   Không có migration pending → bỏ qua migration image."
elif [[ $preflight_status -eq 10 ]]; then
  NEEDS_MIGRATION=1
  echo "   Có migration pending → sẽ build migration image và migrate."
else
  echo "❌ Migration preflight fail-closed (exit ${preflight_status}). Dừng deploy, giữ container cũ."
  exit 1
fi
log_step "migration preflight"

echo "🏗️  Build native ${VERSION_IMAGE} trên production"
ssh "${REMOTE_HOST}" bash -s -- \
  "${REMOTE_APP_DIR}" "${VERSION_IMAGE}" "${MIGRATE_IMAGE}" "${WEB_PLATFORM}" "${DEPLOYMENT_ID}" "${PUBLIC_URL}" "${NEEDS_MIGRATION}" <<'REMOTE_BUILD'
set -euo pipefail
app_dir="$1"
version_image="$2"
migrate_image="$3"
platform="$4"
deployment_id="$5"
public_url="$6"
needs_migration="$7"
cd "$app_dir"

docker buildx build \
  --builder default \
  --platform "$platform" \
  --provenance=false \
  --build-arg "NEXT_DEPLOYMENT_ID=$deployment_id" \
  --build-arg "NEXT_PUBLIC_SITE_URL=$public_url" \
  --load \
  -t "$version_image" \
  -f releases/current/Dockerfile \
  releases/current

docker image inspect "$version_image" --format 'built_image={{.Id}} created={{.Created}}'

if [ "$needs_migration" = 1 ]; then
  # Tag the already cached builder stage as a short-lived migration image. Migrations
  # run before the web container changes, against the same source revision as the
  # image that is about to be promoted.
  docker buildx build \
    --builder default \
    --platform "$platform" \
    --provenance=false \
    --target builder \
    --build-arg "NEXT_DEPLOYMENT_ID=$deployment_id" \
    --build-arg "NEXT_PUBLIC_SITE_URL=$public_url" \
    --load \
    -t "$migrate_image" \
    -f releases/current/Dockerfile \
    releases/current

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
log_step "build + migrate database"

echo "🔄 Promote image và recreate riêng web"
ssh "${REMOTE_HOST}" bash -s -- \
  "${REMOTE_APP_DIR}" "${WEB_IMAGE}" "${VERSION_IMAGE}" "${ROLLBACK_IMAGE}" \
  "${WEB_PORT}" "${DEPLOYMENT_ID}" "${PUBLIC_URL}" <<'REMOTE_RESTART'
set -euo pipefail
app_dir="$1"
web_image="$2"
version_image="$3"
rollback_image="$4"
web_port="$5"
deployment_id="$6"
public_url="$7"
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
  sleep 2
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

html=$(curl -sS "http://127.0.0.1:${web_port}/mau-thiep/long-phung-v3-do/demo")
if [[ "$html" != *"data-dpl-id=\"${deployment_id}\""* ]]; then
  echo "❌ Deployment ID chưa xuất hiện trong HTML production."
  false
fi
if [[ "$html" != *"rel=\"canonical\" href=\"${public_url}/mau-thiep/long-phung-v3-do/demo\""* ]]; then
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
echo "running_image=$running_image health=$health database=$db_check"
REMOTE_RESTART
log_step "restart + healthcheck"

echo "🌐 Verify public URLs"
for path in "/" "/mau-thiep/long-phung-v3-do/demo"; do
  code=$(curl -L -sS -o /dev/null -w '%{http_code}' --max-time 30 "${PUBLIC_URL}${path}" || true)
  echo "   ${path} → HTTP ${code}"
  if [ "${code}" != 200 ]; then
    echo "❌ Public healthcheck thất bại tại ${path}."
    exit 1
  fi
done
log_step "verify public"

echo "🧹 Đảm bảo cron dọn Docker storage đã được cài (không prune đồng bộ)"
ssh "${REMOTE_HOST}" bash -s -- "${REMOTE_APP_DIR}" <<'REMOTE_CLEANUP'
set -euo pipefail
app_dir="$1"

marker='# thiepmungonline Docker storage maintenance'
cron_job="17 4 * * 0 $app_dir/releases/current/scripts/docker-storage-maintenance.sh >> $app_dir/docker-storage-maintenance.log 2>&1 $marker"
(
  crontab -l 2>/dev/null | grep -Fv "$marker" || true
  printf '%s\n' "$cron_job"
) | crontab -
REMOTE_CLEANUP
log_step "cleanup Docker storage"

echo "✅ Deploy ${DEPLOYMENT_ID} hoàn tất trong ${SECONDS}s."

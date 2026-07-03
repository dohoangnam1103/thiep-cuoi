#!/usr/bin/env bash
#
# Deploy thiepmungonline lên Mini PC.
#
# Chiến lược: build image linux/amd64 ngay trên Mac (nhanh), stream image sang
# Mini PC qua SSH, rồi restart container web + tunnel bằng docker compose.
# Mini PC KHÔNG build lại (--no-build) nên deploy nhanh và không phụ thuộc
# tài nguyên của Mini PC.
#
# Cách dùng:
#   ./scripts/deploy-minipc.sh
#
# Biến môi trường ghi đè được (mặc định trong ngoặc):
#   REMOTE_HOST      SSH host/alias tới Mini PC        (minipc)
#   REMOTE_APP_DIR   Thư mục app trên Mini PC          (/home/namdo/apps/thiepmungonline)
#   WEB_IMAGE        Tên image                         (thiepmungonline-web:latest)
#   WEB_PLATFORM     Kiến trúc build                   (linux/amd64)
#   PUBLIC_URL       URL public để healthcheck cuối    (https://thiepmungonline.com)
#   WEB_PORT         Cổng LAN app trên Mini PC         (3211)

set -euo pipefail

REMOTE_HOST="${REMOTE_HOST:-minipc}"
REMOTE_APP_DIR="${REMOTE_APP_DIR:-/home/namdo/apps/thiepmungonline}"
WEB_IMAGE="${WEB_IMAGE:-thiepmungonline-web:latest}"
WEB_PLATFORM="${WEB_PLATFORM:-linux/amd64}"
PUBLIC_URL="${PUBLIC_URL:-https://thiepmungonline.com}"
WEB_PORT="${WEB_PORT:-3211}"

# Chạy từ gốc repo dù script được gọi từ đâu.
cd "$(dirname "$0")/.."

SECONDS=0
LAST_STEP_TS=0
log_step() {
  local now=$SECONDS
  local delta=$((now - LAST_STEP_TS))
  echo "⏱️  $1: ${delta}s (tổng ${now}s)"
  LAST_STEP_TS=$now
}

ensure_local_docker() {
  if docker info >/dev/null 2>&1; then
    return 0
  fi
  if [ "$(uname -s)" = "Darwin" ]; then
    echo "🐳 Docker chưa chạy. Mở Docker Desktop..."
    open -a Docker >/dev/null 2>&1 || true
    for _ in $(seq 1 90); do
      if docker info >/dev/null 2>&1; then
        echo "🐳 Docker Desktop sẵn sàng."
        return 0
      fi
      sleep 2
    done
  fi
  echo "❌ Docker không khả dụng. Bật Docker Desktop rồi chạy lại."
  exit 1
}

echo "🚀 Deploy thiepmungonline → ${REMOTE_HOST}:${REMOTE_APP_DIR}"

ensure_local_docker

# 1) Đồng bộ source lên releases/current (để Mini PC có bản code khớp image,
#    và có thể fallback build-on-minipc nếu cần). KHÔNG đụng .env / data.
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

# 2) Build image amd64 trên Mac.
echo "🏗️  Build ${WEB_IMAGE} (${WEB_PLATFORM}) trên Mac..."
docker buildx build \
  --platform "${WEB_PLATFORM}" \
  --load \
  -t "${WEB_IMAGE}" \
  -f Dockerfile \
  .
log_step "build image trên Mac"

# 3) Stream image sang Mini PC (zstd nếu cả 2 đầu có, không thì gzip).
echo "📦 Chuyển image → ${REMOTE_HOST}..."
if command -v zstd >/dev/null 2>&1 \
  && ssh "${REMOTE_HOST}" "command -v zstd >/dev/null 2>&1"; then
  docker save "${WEB_IMAGE}" | zstd -1 -T0 | ssh "${REMOTE_HOST}" "zstd -d | docker load"
else
  docker save "${WEB_IMAGE}" | gzip -1 | ssh "${REMOTE_HOST}" "gunzip | docker load"
fi
log_step "transfer + load image"

# 4) Restart web (dùng image vừa load, KHÔNG build lại), chờ healthy, rồi tunnel.
echo "🔄 Restart container trên Mini PC..."
ssh "${REMOTE_HOST}" "
  set -e
  cd '${REMOTE_APP_DIR}'
  docker compose up -d --no-build --no-deps web

  echo '⏳ Chờ web trên 127.0.0.1:${WEB_PORT}...'
  READY=0
  for i in \$(seq 1 90); do
    code=\$(curl -s -o /dev/null -w '%{http_code}' -A 'deploy-healthcheck' http://127.0.0.1:${WEB_PORT}/ || true)
    if [ \"\$code\" = '200' ]; then READY=1; break; fi
    sleep 2
  done
  if [ \"\$READY\" != '1' ]; then
    echo '❌ Web không healthy trước timeout. Log 200 dòng cuối:'
    docker logs --tail 200 thiepmungonline-web 2>&1 || true
    exit 1
  fi
  echo '✅ Web healthy trên LAN.'

  docker compose up -d --no-deps tunnel
"
log_step "restart + healthcheck trên Mini PC"

# 5) Verify public qua Cloudflare tunnel.
echo "🌐 Verify ${PUBLIC_URL}"
PUB_CODE=$(curl -s -o /dev/null -w '%{http_code}' --max-time 20 "${PUBLIC_URL}/" || true)
echo "   → HTTP ${PUB_CODE}"
if [ "${PUB_CODE}" != "200" ]; then
  echo "⚠️  Public chưa trả 200 (có thể edge Cloudflare cache/độ trễ DNS). Kiểm tra lại sau vài giây."
fi

log_step "verify public"
echo "✅ Deploy hoàn tất."

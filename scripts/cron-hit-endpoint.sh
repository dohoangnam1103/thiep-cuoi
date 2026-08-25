#!/usr/bin/env bash
#
# Gọi một route cron của app đang chạy trong container.
#
# Vì sao phải qua HTTP thay vì `docker exec npm run <script>`: image production là
# Next standalone build. Trong container chỉ có `server.js`, `node_modules`,
# `public` và `data` — không có `package.json`, `src/`, `scripts/` hay `tsx`. Mọi
# lệnh `docker exec ... npm run ...` đều chết với `ENOENT: /app/package.json`.
#
# Dùng:
#   scripts/cron-hit-endpoint.sh /api/cron/payos-reconcile
#   scripts/cron-hit-endpoint.sh /api/cron/trial-reminders
set -euo pipefail

APP_DIR="${APP_DIR:-/home/namdo/apps/thiepmungonline}"
CONTAINER="${CONTAINER:-thiepmungonline-web}"
ENDPOINT="${1:?Thiếu đường dẫn endpoint, ví dụ /api/cron/payos-reconcile}"
MAX_TIME="${MAX_TIME:-900}"

log() { printf '%s %s\n' "$(date -Iseconds)" "$*"; }

env_file="$APP_DIR/.env"
if [[ ! -f "$env_file" ]]; then
  log "LỖI: không thấy $env_file"
  exit 1
fi

# Đọc đúng một biến, không `source` cả file: .env chứa nhiều secret khác và không
# có lý do gì để nạp hết chúng vào môi trường của tiến trình này.
cron_secret="$(
  grep -m1 -E '^CRON_SECRET=' "$env_file" | cut -d= -f2- | sed -E 's/^"(.*)"$/\1/; s/^'"'"'(.*)'"'"'$/\1/'
)"
if [[ -z "$cron_secret" ]]; then
  log "LỖI: .env không có CRON_SECRET"
  exit 1
fi

# Lấy cổng động thay vì cắm cứng: cổng do compose map ra và có thể đổi.
addr="$(docker port "$CONTAINER" 3000/tcp 2>/dev/null | head -1)"
if [[ -z "$addr" ]]; then
  log "LỖI: container $CONTAINER không map cổng 3000"
  exit 1
fi

log "POST http://$addr$ENDPOINT"
http_code="$(
  curl -sS --max-time "$MAX_TIME" -o /tmp/cron-endpoint-body.$$ -w '%{http_code}' \
    -X POST \
    -H "Authorization: Bearer $cron_secret" \
    "http://$addr$ENDPOINT"
)" || {
  log "LỖI: curl thất bại"
  rm -f "/tmp/cron-endpoint-body.$$"
  exit 1
}

body="$(cat "/tmp/cron-endpoint-body.$$")"
rm -f "/tmp/cron-endpoint-body.$$"
log "HTTP $http_code $body"

# 2xx mới coi là thành công. Route đối soát cố ý trả 500 khi có đơn hỏi không
# được, để lỗi nổi lên log cron chứ không im lặng.
if [[ "$http_code" -lt 200 || "$http_code" -ge 300 ]]; then
  exit 1
fi

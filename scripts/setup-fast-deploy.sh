#!/usr/bin/env bash
#
# Chuẩn bị Mini PC cho deploy-fast.sh. Chạy một lần (idempotent, chạy lại vô hại).
#
# Việc script làm:
#   1. Kiểm tra nối LAN trực tiếp tới Mini PC (bỏ qua Cloudflare tunnel).
#   2. Thêm bind-mount public/ read-only vào docker-compose.yml production,
#      có backup file cũ trước khi sửa.
#   3. Dọn backup cũ về mức retention và báo lại dung lượng đĩa.
#
# Không đụng .env, không đụng database, không restart container.

set -euo pipefail

cd "$(dirname "$0")/.."
# shellcheck source=scripts/lib/ssh-transport.sh
source "scripts/lib/ssh-transport.sh"

REMOTE_LAN_IP="${REMOTE_LAN_IP:-192.168.0.57}"
REMOTE_LAN_USER="${REMOTE_LAN_USER:-namdo}"
REMOTE_TUNNEL_ALIAS="${REMOTE_TUNNEL_ALIAS:-minipc}"
REMOTE_APP_DIR="${REMOTE_APP_DIR:-/home/namdo/apps/thiepmungonline}"
BACKUP_RETENTION="${BACKUP_RETENTION:-10}"
# Xoá backup là hành động không hoàn tác được, nên mặc định chỉ xem trước.
PRUNE_APPLY="${PRUNE_APPLY:-0}"

export DEPLOY_LAN_USER="$REMOTE_LAN_USER"

echo "🔧 Setup fast deploy trên ${REMOTE_TUNNEL_ALIAS} (${REMOTE_LAN_IP})"

transport_init "$REMOTE_LAN_IP" "$REMOTE_LAN_USER" "$REMOTE_TUNNEL_ALIAS"
trap transport_close EXIT

if [[ "$TRANSPORT_KIND" == "lan" ]]; then
  echo "✅ Nối LAN trực tiếp tới ${REMOTE_LAN_IP} (bỏ qua Cloudflare tunnel)."
else
  echo "⚠️  Không nối được LAN, đang dùng tunnel '${REMOTE_TUNNEL_ALIAS}'."
  echo "    Deploy vẫn chạy nhưng chậm hơn nhiều. Kiểm tra lại nếu Mac đang cùng mạng với Mini PC."
fi

echo "📝 Thêm bind-mount public/ vào docker-compose.yml (nếu chưa có)"
rsh_stdin "$REMOTE_APP_DIR" <<'REMOTE_COMPOSE'
set -euo pipefail
app_dir="$1"
cd "$app_dir"

python3 - <<'PY'
import re
import shutil
import time

path = "docker-compose.yml"
mount = "./releases/current/public:/app/public:ro"

with open(path, encoding="utf-8") as handle:
    original = handle.read()

if mount in original:
    print("compose_mount=already_present")
    raise SystemExit(0)

anchor = re.search(r"^(?P<indent>[ \t]*)- \./data:/app/data[ \t]*$", original, re.MULTILINE)
if anchor is None:
    raise SystemExit("không tìm thấy dòng './data:/app/data' để chèn mount public")

backup = f"{path}.bak-{time.strftime('%Y%m%d%H%M%S')}"
shutil.copy2(path, backup)

indent = anchor.group("indent")
insertion = f"{anchor.group(0)}\n{indent}- {mount}"
updated = original[: anchor.start()] + insertion + original[anchor.end() :]

with open(path, "w", encoding="utf-8") as handle:
    handle.write(updated)

print(f"compose_backup={backup}")
print("compose_mount=added")
PY

docker compose config >/dev/null
echo "compose_validated=ok"
REMOTE_COMPOSE

if [[ "$PRUNE_APPLY" == "1" ]]; then
  echo "🧹 Dọn backup cũ (giữ ${BACKUP_RETENTION} bản mới nhất mỗi loại)"
else
  echo "🧹 Xem trước dung lượng backup có thể thu hồi (chưa xoá gì)"
  echo "   Chạy lại với PRUNE_APPLY=1 để xoá thật."
fi
rsh_stdin "$REMOTE_APP_DIR" "$BACKUP_RETENTION" "$PRUNE_APPLY" <<'REMOTE_PRUNE'
set -euo pipefail
app_dir="$1"
retention="$2"
apply="$3"
cd "$app_dir"

before=$(du -sm data/backups 2>/dev/null | cut -f1 || echo 0)

# Dùng find thay vì `ls glob`: find trả 0 kể cả khi không khớp gì, nên không
# làm `set -o pipefail` giết script. Sắp theo mtime giảm dần rồi bỏ N bản đầu.
prune_group() {
  local pattern="$1"
  find data/backups -maxdepth 1 -name "$pattern" -printf '%T@\t%p\n' 2>/dev/null \
    | sort -rn \
    | tail -n "+$((retention + 1))" \
    | cut -f2- \
    | while IFS= read -r stale; do
        if [ "$apply" = 1 ]; then
          rm -rf -- "$stale"
        else
          du -sm -- "$stale" | cut -f1
        fi
      done
}

reclaimable=0
for pattern in \
  'prod-predeploy-*.db' \
  'editor-uploads-predeploy-*.tar.gz' \
  'guest-media-predeploy-*.tar.gz' \
  'editor-uploads-snapshot-*' \
  'guest-media-snapshot-*'
do
  if [ "$apply" = 1 ]; then
    prune_group "$pattern"
  else
    group_mb=$(prune_group "$pattern" | paste -sd+ - | sed 's/^$/0/' | bc)
    count=$(find data/backups -maxdepth 1 -name "$pattern" | wc -l)
    echo "  ${pattern}: ${count} bản, thu hồi được ~${group_mb}MB"
    reclaimable=$((reclaimable + group_mb))
  fi
done

after=$(du -sm data/backups 2>/dev/null | cut -f1 || echo 0)
if [ "$apply" = 1 ]; then
  echo "backups_mb_before=${before} backups_mb_after=${after} freed_mb=$((before - after))"
else
  echo "backups_mb_now=${before} reclaimable_mb=${reclaimable}"
fi
df -h / | tail -1
REMOTE_PRUNE

echo "✅ Setup xong. Giờ chạy: ./scripts/deploy-fast.sh"

#!/usr/bin/env bash
set -euo pipefail

repo_root=$(cd "$(dirname "$0")/.." && pwd)
deploy="$repo_root/scripts/deploy-minipc.sh"

# 1. Deploy script gọi preflight utility.
grep -Fq 'scripts/migration-preflight.py' "$deploy" \
  || { echo "FAIL: deploy không gọi migration-preflight.py"; exit 1; }

# 2. Có biến NEEDS_MIGRATION điều khiển nhánh migration.
grep -Fq 'NEEDS_MIGRATION' "$deploy" \
  || { echo "FAIL: thiếu NEEDS_MIGRATION"; exit 1; }

# 3. Preflight exit 10 được nhận diện là có pending.
grep -Eq 'preflight_status[[:space:]]*-eq[[:space:]]*10' "$deploy" \
  || { echo "FAIL: không xử lý exit 10 của preflight"; exit 1; }

# 4. KHÔNG còn chạy docker-storage-maintenance.sh đồng bộ (dòng execute trần).
if grep -Eq '^[[:space:]]*"\$app_dir/releases/current/scripts/docker-storage-maintenance\.sh"[[:space:]]*$' "$deploy"; then
  echo "FAIL: vẫn chạy docker-storage-maintenance.sh đồng bộ"; exit 1
fi

# 5. Cron maintenance vẫn được cài (marker + lịch).
grep -Fq '# thiepmungonline Docker storage maintenance' "$deploy" \
  || { echo "FAIL: mất cron marker"; exit 1; }
grep -Eq '^[[:space:]]*cron_job=.*17 4 \* \* 0' "$deploy" \
  || { echo "FAIL: mất lịch cron 17 4 * * 0"; exit 1; }

# 6. bash -n cú pháp hợp lệ.
bash -n "$deploy" || { echo "FAIL: bash -n lỗi cú pháp"; exit 1; }

echo "OK deploy-minipc-preflight"

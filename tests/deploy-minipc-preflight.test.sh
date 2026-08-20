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

# 6. Local build là opt-in và stream image qua SSH, không tạo tar trên VPS.
grep -Fq 'BUILD_ON="${BUILD_ON:-remote}"' "$deploy" \
  || { echo "FAIL: thiếu BUILD_ON mặc định remote"; exit 1; }
grep -Fq 'remote|local)' "$deploy" \
  || { echo "FAIL: BUILD_ON không nhận local"; exit 1; }
grep -Fq 'docker save "$image" | ssh "$REMOTE_HOST" docker load' "$deploy" \
  || { echo "FAIL: local build không stream image qua SSH"; exit 1; }
grep -Fq 'native_modules_ok' "$deploy" \
  || { echo "FAIL: local build không smoke native module trên Mini PC"; exit 1; }
grep -Fq -- '--builder "$LOCAL_BUILDER"' "$deploy" \
  || { echo "FAIL: local build không dùng Docker Buildx builder"; exit 1; }
grep -Fq -- "--exclude '/.deploy-worktree/'" "$deploy" \
  || { echo "FAIL: deploy vẫn rsync worktree phụ"; exit 1; }
grep -Fq 'Dockerfile.local-build' "$deploy" \
  || { echo "FAIL: local build không dùng Dockerfile artifact"; exit 1; }
test -f "$repo_root/Dockerfile.local-build" \
  || { echo "FAIL: thiếu Dockerfile.local-build"; exit 1; }
grep -Fq 'FROM dependencies AS runtime-dependencies' "$repo_root/Dockerfile.local-build" \
  || { echo "FAIL: thiếu runtime dependency stage Linux"; exit 1; }
grep -Fq 'npm prune --omit=dev --ignore-scripts' "$repo_root/Dockerfile.local-build" \
  || { echo "FAIL: runner vẫn giữ dependency dev"; exit 1; }
grep -Fq 'COPY --from=runtime-dependencies --chown=node:node /app/node_modules ./node_modules' "$repo_root/Dockerfile.local-build" \
  || { echo "FAIL: runner không dùng dependency Linux runtime"; exit 1; }

# 7. bash -n cú pháp hợp lệ.
bash -n "$deploy" || { echo "FAIL: bash -n lỗi cú pháp"; exit 1; }

echo "OK deploy-minipc-preflight"

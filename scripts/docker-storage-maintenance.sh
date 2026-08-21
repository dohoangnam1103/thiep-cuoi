#!/usr/bin/env bash
set -euo pipefail

repository=${DOCKER_IMAGE_REPOSITORY:-thiepmungonline-web}
container=${DOCKER_CONTAINER_NAME:-thiepmungonline-web}
# Tuổi tối đa của build cache. Xem ghi chú ở hàm prune_build_cache bên dưới về
# lý do không dùng --max-used-space nữa.
cache_max_age=${DOCKER_BUILD_CACHE_MAX_AGE:-120h}
dry_run=0

if [[ ${1:-} == --dry-run ]]; then
  dry_run=1
elif [[ $# -gt 0 ]]; then
  printf 'usage: %s [--dry-run]\n' "$0" >&2
  exit 2
fi

rollback_keep=${DOCKER_ROLLBACK_KEEP:-2}

current_id=$(docker inspect --format '{{.Image}}' "$container")
image_rows=$(docker image ls --no-trunc "$repository" --format '{{.Tag}}|{{.ID}}')

# Chọn rollback để giữ theo THỜI ĐIỂM TẠO IMAGE, không theo thứ tự chữ của tag.
#
# Bản cũ dùng `grep '^rollback-' | sort -r | head -n1`. Vì sort so sánh chuỗi,
# một tag như `rollback-songhy-bank-20260820064712` luôn đứng trên
# `rollback-20260820185043` ('s' > 'd' > '2'), nên script giữ đúng bản rollback
# cũ và xoá mất bản rollback thật sự mới nhất — tức là image mà quy trình
# rollback tay trong docs/deploy-minipc.md cần tới.
rollback_ids=$(
  docker image ls --no-trunc "$repository" --format '{{.Tag}}|{{.ID}}|{{.CreatedAt}}' \
    | awk -F'|' '$1 ~ /^rollback-/' \
    | sort -t'|' -k3 -r \
    | head -n "$rollback_keep" \
    | cut -d'|' -f2
)

is_kept_rollback() {
  local candidate="$1"
  [[ -n $rollback_ids ]] || return 1
  printf '%s\n' "$rollback_ids" | grep -qxF "$candidate"
}

cache_total() {
  docker buildx du 2>/dev/null | awk '/^Total:/ { print $2; exit }'
}

disk_free() {
  df -h / | awk 'NR == 2 { print $4 " free (" $5 " used)" }'
}

# Trước đây bước này là `docker buildx prune --all --force --max-used-space 8gb`.
# Trên setup này (driver `docker`, BuildKit v0.30.0 nhúng trong daemon) cờ đó
# KHÔNG làm gì cả: đã thử cả `8gb`, `20gb` và cả giá trị bytes tường minh
# (18000000000), lần nào cũng báo "Total: 0B" và cache vẫn nguyên 22.65GB.
# Vì thế build cache phình tới 25GB và đĩa bò lên 93% dù cron vẫn chạy đều.
#
# `--filter until=<duration>` thì hoạt động thật (đo được: giải phóng 1.778GB),
# nên chuyển sang chính sách theo tuổi. Có in trước/sau để một no-op im lặng
# như vậy không lặp lại mà không ai thấy.
prune_build_cache() {
  local before after
  before=$(cache_total)

  # KHÔNG dùng --all. Ngay khi một build kết thúc, cache record của nó được coi
  # là "unused", nên --all xoá sạch cả cache vừa tạo bất chấp filter until.
  # Đo được: sau một lần prune có --all, deploy kế tiếp mất 249s thay vì 16s vì
  # npm ci + npm prune phải chạy lại. Bỏ --all thì until mới thực sự là chính
  # sách theo tuổi.
  printf 'docker buildx prune --force --filter until=%s\n' "$cache_max_age"
  if [[ $dry_run -eq 1 ]]; then
    printf '  build_cache_now=%s %s\n' "${before:-unknown}" "$(disk_free)"
    return 0
  fi

  docker buildx prune --force --filter "until=${cache_max_age}" >/dev/null
  after=$(cache_total)
  printf '  build_cache before=%s after=%s | %s\n' \
    "${before:-unknown}" "${after:-unknown}" "$(disk_free)"

  # Chỉ cảnh báo khi cache vừa KHÔNG giảm vừa đã vượt ngưỡng mềm. Cache không
  # giảm là bình thường nếu mọi record đều còn trẻ hơn cache_max_age.
  local after_gb budget_gb
  after_gb=$(printf '%s' "${after:-0}" | awk '{ v = $0 + 0; if ($0 ~ /GB/) print v; else if ($0 ~ /MB/) print v / 1024; else print 0 }')
  budget_gb=${DOCKER_BUILD_CACHE_SOFT_BUDGET_GB:-20}
  if [[ -n $before && $before == "$after" ]] &&
     awk -v a="$after_gb" -v b="$budget_gb" 'BEGIN { exit !(a > b) }'; then
    printf '  ⚠️  build cache %s vượt ngưỡng %sGB mà không giảm. Cân nhắc hạ DOCKER_BUILD_CACHE_MAX_AGE (hiện %s).\n' \
      "$after" "$budget_gb" "$cache_max_age"
  fi
}

prune_build_cache

while IFS='|' read -r tag image_id; do
  [[ -n $tag && $tag != '<none>' ]] || continue
  if [[ $tag == latest || $image_id == "$current_id" ]] || is_kept_rollback "$image_id"; then
    continue
  fi

  printf 'remove %s:%s\n' "$repository" "$tag"
  if [[ $dry_run -eq 0 ]]; then
    docker image rm "$repository:$tag"
  fi
done <<< "$image_rows"

printf 'docker image prune --force\n'
if [[ $dry_run -eq 0 ]]; then
  docker image prune --force
fi

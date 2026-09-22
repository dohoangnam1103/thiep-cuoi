#!/usr/bin/env bash
set -euo pipefail

repo_root=$(cd "$(dirname "$0")/.." && pwd)
script="$repo_root/scripts/docker-storage-maintenance.sh"
deploy_script="$repo_root/scripts/deploy-minipc.sh"
deploy_fast="$repo_root/scripts/deploy-fast.sh"
tmp=$(mktemp -d)
trap 'rm -rf "$tmp"' EXIT
mkdir -p "$tmp/bin"

# `set -e` ignores failures of commands inverted with `!`, so a bare
# `! grep -Fq ...` assertion never fails the test. Use explicit checks instead.
expect_contains() {
  grep -Fq "$1" <<< "$2" || { echo "FAIL: thiếu '$1'"; exit 1; }
}
expect_absent() {
  if grep -Fq "$1" <<< "$2"; then echo "FAIL: không được có '$1'"; exit 1; fi
}

cat > "$tmp/bin/docker" <<'DOCKER'
#!/usr/bin/env bash
set -euo pipefail
printf '%q ' "$@" >> "$DOCKER_CALLS"
printf '\n' >> "$DOCKER_CALLS"

rows() {
  # Mirrors production: repeated deploys that hit the assembly cache tag the
  # SAME running image with several rollback-* tags, so the two newest rollback
  # tags point at the current image while the real previous release is older.
  cat <<'IMAGES'
latest|sha256:current1234567890abcdef|2026-09-22 01:51:18 -0400 EDT
production|sha256:current1234567890abcdef|2026-09-22 01:51:18 -0400 EDT
rollback-20260922060549-83692|sha256:current1234567890abcdef|2026-09-22 01:51:18 -0400 EDT
rollback-20260922055908-78298|sha256:current1234567890abcdef|2026-09-22 01:51:18 -0400 EDT
20260922060549-83692|sha256:current1234567890abcdef|2026-09-22 01:51:18 -0400 EDT
rollback-20260922054745-63730|sha256:prev1234567890abcdef|2026-09-21 12:21:46 -0400 EDT
20260921161634-80035|sha256:prev1234567890abcdef|2026-09-21 12:21:46 -0400 EDT
rollback-20260921161634-80035|sha256:old1234567890abcdef|2026-09-19 13:12:58 -0400 EDT
20260919171112-34558|sha256:old1234567890abcdef|2026-09-19 13:12:58 -0400 EDT
IMAGES
}

if [[ "$*" == "inspect --format {{.Image}} thiepmungonline-web" ]]; then
  printf '%s\n' 'sha256:current1234567890abcdef'
elif [[ "$*" == "image ls --no-trunc thiepmungonline-web --format {{.Tag}}|{{.ID}}|{{.CreatedAt}}" ]]; then
  rows
elif [[ "$*" == "image ls --no-trunc thiepmungonline-web --format {{.Tag}}|{{.ID}}" ]]; then
  rows | cut -d'|' -f1,2
elif [[ "$*" == "system df --format {{.Type}}|{{.Size}}" ]]; then
  printf '%s\n' 'Build Cache|3.959GB'
fi
DOCKER
chmod +x "$tmp/bin/docker"

export PATH="$tmp/bin:$PATH"
export DOCKER_CALLS="$tmp/docker-calls"
: > "$DOCKER_CALLS"

output=$("$script" --dry-run)

# The maintenance host has no buildx plugin, so the script must prune through the
# core `docker builder prune` and measure through `docker system df`.
expect_contains 'docker builder prune --force --filter until=120h' "$output"
expect_contains 'docker image prune --force' "$output"
# Only the oldest distinct rollback image is surplus.
expect_contains 'remove thiepmungonline-web:20260919171112-34558' "$output"
expect_contains 'remove thiepmungonline-web:rollback-20260921161634-80035' "$output"
# Current and previous releases must survive, even though the current image owns
# the two newest rollback tags.
expect_absent 'remove thiepmungonline-web:latest' "$output"
expect_absent 'remove thiepmungonline-web:production' "$output"
expect_absent 'remove thiepmungonline-web:20260922060549-83692' "$output"
expect_absent 'remove thiepmungonline-web:rollback-20260922060549-83692' "$output"
expect_absent 'remove thiepmungonline-web:rollback-20260922055908-78298' "$output"
expect_absent 'remove thiepmungonline-web:20260921161634-80035' "$output"
expect_absent 'remove thiepmungonline-web:rollback-20260922054745-63730' "$output"
if grep -Eq '^[[:space:]]*docker buildx' "$script"; then
  echo "FAIL: script còn gọi docker buildx"; exit 1
fi
# inspect + image ls + system df.
[[ $(wc -l < "$DOCKER_CALLS") -eq 3 ]]

: > "$DOCKER_CALLS"
"$script" >/dev/null
expect_contains 'builder prune --force --filter until=120h' "$(cat "$DOCKER_CALLS")"
expect_contains 'image rm thiepmungonline-web:20260919171112-34558' "$(cat "$DOCKER_CALLS")"
expect_contains 'image rm thiepmungonline-web:rollback-20260921161634-80035' "$(cat "$DOCKER_CALLS")"
expect_contains 'image prune --force' "$(cat "$DOCKER_CALLS")"
expect_absent 'image rm thiepmungonline-web:latest' "$(cat "$DOCKER_CALLS")"
expect_absent 'image rm thiepmungonline-web:20260921161634-80035' "$(cat "$DOCKER_CALLS")"
expect_absent 'image rm thiepmungonline-web:rollback-20260922054745-63730' "$(cat "$DOCKER_CALLS")"

expect_contains 'scripts/docker-storage-maintenance.sh' "$(cat "$deploy_script")"
expect_contains '# thiepmungonline Docker storage maintenance' "$(cat "$deploy_script")"
grep -Eq '^[[:space:]]*cron_job=.*17 4 \* \* 0' "$deploy_script" \
  || { echo "FAIL: mất lịch cron 17 4 * * 0"; exit 1; }

# Production deploy must install the cron from the release script and replace any
# legacy `ops/` maintenance line instead of appending a second job.
expect_contains '# thiepmungonline Docker storage maintenance' "$(cat "$deploy_fast")"
expect_contains 'releases/current/scripts/docker-storage-maintenance.sh' "$(cat "$deploy_fast")"
expect_contains "grep -Fv 'docker-storage-maintenance.sh'" "$(cat "$deploy_fast")"
grep -Eq '^[[:space:]]*cron_job=.*17 4 \* \* \*' "$deploy_fast" \
  || { echo "FAIL: mất lịch cron 17 4 * * *"; exit 1; }

echo "OK docker-storage-maintenance"

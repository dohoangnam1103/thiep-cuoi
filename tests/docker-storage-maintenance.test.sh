#!/usr/bin/env bash
set -euo pipefail

repo_root=$(cd "$(dirname "$0")/.." && pwd)
script="$repo_root/scripts/docker-storage-maintenance.sh"
deploy_script="$repo_root/scripts/deploy-minipc.sh"
deploy_fast="$repo_root/scripts/deploy-fast.sh"
tmp=$(mktemp -d)
trap 'rm -rf "$tmp"' EXIT
mkdir -p "$tmp/bin"

cat > "$tmp/bin/docker" <<'DOCKER'
#!/usr/bin/env bash
set -euo pipefail
printf '%q ' "$@" >> "$DOCKER_CALLS"
printf '\n' >> "$DOCKER_CALLS"

if [[ "$*" == "inspect --format {{.Image}} thiepmungonline-web" ]]; then
  printf '%s\n' 'sha256:current1234567890abcdef'
elif [[ "$*" == "image ls --no-trunc thiepmungonline-web --format {{.Tag}}|{{.ID}}" ]]; then
  cat <<'IMAGES'
latest|sha256:current1234567890abcdef
20260716062443|sha256:current1234567890abcdef
rollback-20260716061307|sha256:rollback1234567890abcdef
20260716061307|sha256:rollback1234567890abcdef
rollback-20260716060151|sha256:old1234567890abcdef
20260716060151|sha256:old1234567890abcdef
IMAGES
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
grep -Fq 'docker builder prune --force --filter until=120h' <<< "$output"
grep -Fq 'docker image prune --force' <<< "$output"
grep -Fq 'remove thiepmungonline-web:rollback-20260716060151' <<< "$output"
grep -Fq 'remove thiepmungonline-web:20260716060151' <<< "$output"
! grep -Fq 'remove thiepmungonline-web:latest' <<< "$output"
! grep -Fq 'remove thiepmungonline-web:20260716062443' <<< "$output"
! grep -Fq 'remove thiepmungonline-web:rollback-20260716061307' <<< "$output"
! grep -Fq 'remove thiepmungonline-web:20260716061307' <<< "$output"
! grep -Fq 'buildx' "$script"
# inspect + image ls + system df.
[[ $(wc -l < "$DOCKER_CALLS") -eq 3 ]]

: > "$DOCKER_CALLS"
"$script" >/dev/null
grep -Fq 'builder prune --force --filter until=120h' "$DOCKER_CALLS"
grep -Fq 'image rm thiepmungonline-web:rollback-20260716060151' "$DOCKER_CALLS"
grep -Fq 'image rm thiepmungonline-web:20260716060151' "$DOCKER_CALLS"
grep -Fq 'image prune --force' "$DOCKER_CALLS"
! grep -Fq 'image rm thiepmungonline-web:latest' "$DOCKER_CALLS"
! grep -Fq 'image rm thiepmungonline-web:20260716062443' "$DOCKER_CALLS"
! grep -Fq 'image rm thiepmungonline-web:rollback-20260716061307' "$DOCKER_CALLS"
! grep -Fq 'image rm thiepmungonline-web:20260716061307' "$DOCKER_CALLS"

grep -Fq 'scripts/docker-storage-maintenance.sh' "$deploy_script"
grep -Fq '# thiepmungonline Docker storage maintenance' "$deploy_script"
grep -Eq '^[[:space:]]*cron_job=.*17 4 \* \* 0' "$deploy_script"

# Production deploy must install the cron from the release script and replace any
# legacy `ops/` maintenance line instead of appending a second job.
grep -Fq '# thiepmungonline Docker storage maintenance' "$deploy_fast"
grep -Fq 'releases/current/scripts/docker-storage-maintenance.sh' "$deploy_fast"
grep -Fq "grep -Fv 'docker-storage-maintenance.sh'" "$deploy_fast"
grep -Eq '^[[:space:]]*cron_job=.*17 4 \* \* \*' "$deploy_fast"

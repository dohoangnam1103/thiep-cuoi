#!/usr/bin/env bash
set -euo pipefail

repo_root=$(cd "$(dirname "$0")/.." && pwd)
script="$repo_root/scripts/docker-storage-maintenance.sh"
deploy_script="$repo_root/scripts/deploy-minipc.sh"
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
fi
DOCKER
chmod +x "$tmp/bin/docker"

export PATH="$tmp/bin:$PATH"
export DOCKER_CALLS="$tmp/docker-calls"
: > "$DOCKER_CALLS"

output=$("$script" --dry-run)

grep -Fq 'docker buildx prune --all --force --max-used-space 8gb' <<< "$output"
grep -Fq 'docker image prune --force' <<< "$output"
grep -Fq 'remove thiepmungonline-web:rollback-20260716060151' <<< "$output"
grep -Fq 'remove thiepmungonline-web:20260716060151' <<< "$output"
! grep -Fq 'remove thiepmungonline-web:latest' <<< "$output"
! grep -Fq 'remove thiepmungonline-web:20260716062443' <<< "$output"
! grep -Fq 'remove thiepmungonline-web:rollback-20260716061307' <<< "$output"
! grep -Fq 'remove thiepmungonline-web:20260716061307' <<< "$output"
[[ $(wc -l < "$DOCKER_CALLS") -eq 2 ]]

: > "$DOCKER_CALLS"
"$script" >/dev/null
grep -Fq 'buildx prune --all --force --max-used-space 8gb' "$DOCKER_CALLS"
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

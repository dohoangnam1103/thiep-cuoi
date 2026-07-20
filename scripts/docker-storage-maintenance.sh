#!/usr/bin/env bash
set -euo pipefail

repository=${DOCKER_IMAGE_REPOSITORY:-thiepmungonline-web}
container=${DOCKER_CONTAINER_NAME:-thiepmungonline-web}
cache_limit=${DOCKER_BUILD_CACHE_LIMIT:-8gb}
dry_run=0

if [[ ${1:-} == --dry-run ]]; then
  dry_run=1
elif [[ $# -gt 0 ]]; then
  printf 'usage: %s [--dry-run]\n' "$0" >&2
  exit 2
fi

current_id=$(docker inspect --format '{{.Image}}' "$container")
image_rows=$(docker image ls --no-trunc "$repository" --format '{{.Tag}}|{{.ID}}')
newest_rollback=$(printf '%s\n' "$image_rows" | cut -d'|' -f1 | grep '^rollback-' | sort -r | head -n 1 || true)
rollback_id=''

if [[ -n $newest_rollback ]]; then
  rollback_id=$(printf '%s\n' "$image_rows" | awk -F'|' -v tag="$newest_rollback" '$1 == tag { print $2; exit }')
fi

printf 'docker buildx prune --all --force --max-used-space %s\n' "$cache_limit"
if [[ $dry_run -eq 0 ]]; then
  docker buildx prune --all --force --max-used-space "$cache_limit"
fi

while IFS='|' read -r tag image_id; do
  [[ -n $tag && $tag != '<none>' ]] || continue
  if [[ $tag == latest || $image_id == "$current_id" || (-n $rollback_id && $image_id == "$rollback_id") ]]; then
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

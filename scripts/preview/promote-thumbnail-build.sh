#!/usr/bin/env bash
# Run ONLY on the isolated preview VPS after uploading the compiled artifact.
set -euo pipefail
root=/srv/thiepmungonline-preview
release_id="${PREVIEW_RELEASE_ID:-20260830-thumbnail-opt}"
[[ "$release_id" =~ ^[a-zA-Z0-9-]+$ ]]
release="$root/releases/$release_id"
backup="$root/releases/before-$release_id"
unit=thiepmungonline-preview.service

test -f "$release/server.js"
test -f "$release/.next/BUILD_ID"
test -f "$root/app/server.js"
test ! -e "$backup"
mkdir "$backup"
cp -p "$root/app/server.js" "$backup/server.js"
# Preserve cache and old hashed JS/CSS, including clients open during promotion.
mkdir -p "$release/.next/cache"
cp -a "$root/app/.next/cache/." "$release/.next/cache/"
cp -an "$root/app/.next/static/." "$release/.next/static/"
chown -R thiepmung-preview:thiepmung-preview "$release/.next" "$release/server.js"

rollback() {
  systemctl stop "$unit"
  if test -d "$backup/.next"; then
    if test -d "$root/app/.next"; then mv "$root/app/.next" "$release/.next.failed"; fi
    mv "$backup/.next" "$root/app/.next"
  fi
  cp -p "$backup/server.js" "$root/app/server.js"
  systemctl start "$unit"
  echo 'Preview promotion failed; previous app restored.' >&2
}
trap rollback ERR
systemctl stop "$unit"
mv "$root/app/.next" "$backup/.next"
mv "$release/.next" "$root/app/.next"
cp -p "$release/server.js" "$root/app/server.js"
systemctl start "$unit"
healthy=0
for attempt in {1..20}; do
  if curl --fail --silent --max-time 3 http://127.0.0.1:3211/mau-thiep | grep 'listing-thumbnails' > /dev/null; then
    healthy=1
    break
  fi
  sleep 1
done
test "$healthy" = 1
trap - ERR
echo "Preview promoted; rollback artifact: $backup"
systemctl show "$unit" -p ActiveState -p NRestarts -p MemoryCurrent

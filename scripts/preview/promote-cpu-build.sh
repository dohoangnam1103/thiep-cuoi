#!/usr/bin/env bash
# Run only on 163.223.9.198, after uploading the standalone CPU-cache artifact.
set -euo pipefail
root=/srv/thiepmungonline-preview
release="$root/releases/cpu-cache-20260830"
backup="$root/releases/before-cpu-cache-20260830"
unit=thiepmungonline-preview.service
candidate=thiepmung-preview-cpu-candidate.service

test -f "$release/server.js"
test -f "$release/.next/BUILD_ID"
test -f "$root/app/server.js"
test ! -e "$backup"
if ! test -L "$release/node_modules"; then ln -s "$root/app/node_modules" "$release/node_modules"; fi
if ! test -L "$release/public"; then ln -s "$root/app/public" "$release/public"; fi
if ! test -L "$release/data"; then ln -s "$root/data" "$release/data"; fi
test "$(readlink "$release/node_modules")" = "$root/app/node_modules"
test "$(readlink "$release/public")" = "$root/app/public"
test "$(readlink "$release/data")" = "$root/data"
# Keep only the expensive image cache, not local-build or previous data caches.
mkdir -p "$release/.next/cache/images"
if test -d "$root/app/.next/cache/images"; then
  cp -a "$root/app/.next/cache/images/." "$release/.next/cache/images/"
fi
cp -an "$root/app/.next/static/." "$release/.next/static/"
chown -R thiepmung-preview:thiepmung-preview "$release"

cleanup_candidate() { systemctl stop "$candidate" >/dev/null 2>&1 || true; }
trap cleanup_candidate EXIT
systemd-run --unit="$candidate" --collect \
  -p User=thiepmung-preview -p Group=thiepmung-preview \
  -p Slice=thiepmungpreview.slice -p CPUQuota=40% -p MemoryMax=350M \
  -p WorkingDirectory="$release" \
  -p "EnvironmentFile=$root/control/app.env" \
  -p NoNewPrivileges=true -p PrivateTmp=true -p ProtectHome=true -p ProtectSystem=strict \
  -p "ReadWritePaths=$root/data $release/.next" \
  -p IPAddressDeny=any -p IPAddressAllow=localhost -p RuntimeMaxSec=180 \
  /usr/bin/env PORT=3212 HOSTNAME=localhost NODE_OPTIONS=--dns-result-order=ipv4first \
  "$root/bin/node" --max-old-space-size=256 server.js
healthy=0
for attempt in {1..15}; do
  if curl --fail --silent --max-time 5 http://localhost:3212/bang-gia -o /dev/null; then
    healthy=1
    break
  fi
  sleep 1
done
test "$healthy" = 1
for route in / /bang-gia /mau-thiep/long-phung-v3-do/demo; do
  curl --fail --silent --max-time 10 "http://localhost:3212$route" -o /dev/null
  curl --fail --silent --max-time 10 -D - "http://localhost:3212$route" -o /dev/null | grep -qi '^x-nextjs-cache: HIT'
done
curl --fail --silent --max-time 10 http://localhost:3212/mau-thiep -o /dev/null
cleanup_candidate

mkdir "$backup"
cp -p "$root/app/server.js" "$backup/server.js"
rollback() {
  systemctl stop "$unit"
  if test -d "$backup/.next"; then
    if test -d "$root/app/.next"; then mv "$root/app/.next" "$release/.next.failed"; fi
    mv "$backup/.next" "$root/app/.next"
  fi
  cp -p "$backup/server.js" "$root/app/server.js"
  systemctl start "$unit"
  echo 'CPU-cache promotion failed; previous preview restored.' >&2
}
trap rollback ERR
systemctl stop "$unit"
mv "$root/app/.next" "$backup/.next"
mv "$release/.next" "$root/app/.next"
cp -p "$release/server.js" "$root/app/server.js"
systemctl start "$unit"
healthy=0
for attempt in {1..20}; do
  if curl --fail --silent --max-time 5 http://localhost:3211/bang-gia -o /dev/null; then
    healthy=1
    break
  fi
  sleep 1
done
test "$healthy" = 1
"$root/bin/node" "$root/control/verify-preview.mjs" http://127.0.0.1:3210
trap - ERR
echo "Preview promoted; rollback artifact: $backup"
systemctl show "$unit" -p ActiveState -p NRestarts -p MemoryCurrent

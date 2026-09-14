#!/usr/bin/env bash
# Site-2 deploy isolation: no SSH, no Docker, no production mutation.
# Fails if site-2 shares any identity, path, port or writable mount with master.
set -euo pipefail

repo_root=$(cd "$(dirname "$0")/.." && pwd)
pass=0
fail=0
check() {
  local desc="$1"; shift
  if "$@" >/dev/null 2>&1; then
    pass=$((pass + 1))
  else
    fail=$((fail + 1))
    echo "NOT OK: $desc" >&2
  fi
}

site2_json=$(npx tsx scripts/deploy/app-manifests.ts site-2)
manifest() { python3 -c "import json,sys; print(json.load(sys.stdin)$1)" <<<"$site2_json"; }
site2_root=$(manifest "['remoteAppDir']")
site2_port=$(manifest "['webPort']")
site2_container=$(manifest "['webContainer']")
site2_image=$(manifest "['webImage']")

master_json=$(npx tsx scripts/deploy/app-manifests.ts master)
master_root=$(python3 -c "import json,sys; print(json.load(sys.stdin)['remoteAppDir'])" <<<"$master_json")
master_container=$(python3 -c "import json,sys; print(json.load(sys.stdin)['webContainer'])" <<<"$master_json")
master_port=$(python3 -c "import json,sys; print(json.load(sys.stdin)['webPort'])" <<<"$master_json")

test "$site2_root" = "/srv/chungdoi-site2"
check "site-2 root is /srv/chungdoi-site2" test "$site2_root" = "/srv/chungdoi-site2"
check "site-2 root differs from master" test "$site2_root" != "$master_root"
check "master root unchanged" test "$master_root" = "/srv/thiepmungonline"
check "site-2 port is 3221" test "$site2_port" = "3221"
check "site-2 port differs from master" test "$site2_port" != "$master_port"
check "site-2 container is chungdoi-site2-web" test "$site2_container" = "chungdoi-site2-web"
check "site-2 container differs from master" test "$site2_container" != "$master_container"
check "site-2 image differs from master" test "$site2_image" != "$(python3 -c "import json,sys; print(json.load(sys.stdin)['webImage'])" <<<"$master_json")"

COMPOSE_FILE="$repo_root/infra/compose/site-2.yaml"
check "compose file exists" test -f "$COMPOSE_FILE"
check "compose keeps loopback-only 3221" grep -q "127.0.0.1:3221:3000" "$COMPOSE_FILE"
check "compose memory limit 768m" grep -q "mem_limit: 768m" "$COMPOSE_FILE"
check "compose cpu limit" grep -q "cpus: 1.0" "$COMPOSE_FILE"
check "compose bounded logs" grep -q 'max-size: "10m"' "$COMPOSE_FILE"
if grep -E -q "^\s*-\s*\"?/srv/thiepmungonline" "$COMPOSE_FILE"; then
  fail=$((fail + 1)); echo "NOT OK: site-2 compose mounts master dir" >&2
else
  pass=$((pass + 1))
fi

check "check-only preflight passes" \
  env NEXT_PUBLIC_SITE_URL=https://site2.example bash scripts/deploy/deploy-app.sh site-2 --check-only
if env NEXT_PUBLIC_SITE_URL=https://thiepmungonline.com bash scripts/deploy/deploy-app.sh site-2 --check-only >/dev/null 2>&1; then
  fail=$((fail + 1)); echo "NOT OK: master origin accepted for site-2" >&2
else
  pass=$((pass + 1))
fi

check "deploy:site-2 script exists" bash -c "node -e \"const p=require('./package.json'); if(!p.scripts['deploy:site-2']) process.exit(1)\""
check "npm run deploy still pinned to master" grep -q '"deploy": "bash scripts/deploy-vps.sh"' package.json
check "master deploy script untouched by site-2" bash -c "! grep -q site-2 scripts/deploy-vps.sh"
check "site-2 env schema exists" test -f "$repo_root/infra/apps/site-2.env.schema"
check "site-2 env schema bans payment creds" bash -c "! grep -q PAYOS infra/apps/site-2.env.schema"

echo "site-2 isolation: $pass passed, $fail failed"
[[ "$fail" == "0" ]]

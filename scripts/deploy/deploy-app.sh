#!/usr/bin/env bash
# Manifest-driven deploy for one app (master or site-2).
# Usage: bash scripts/deploy/deploy-app.sh <master|site-2> [--check-only]
# Full deploy needs SSH access to the VPS; --check-only validates the manifest,
# compose file, env schema and cross-app isolation without SSH or Docker.
set -euo pipefail

repo_root=$(cd "$(dirname "$0")/../.." && pwd)
APP_ID="${1:-}"
CHECK_ONLY=0
if [[ "${2:-}" == "--check-only" ]]; then CHECK_ONLY=1; fi

if [[ "$APP_ID" != "master" && "$APP_ID" != "site-2" ]]; then
  echo "Usage: bash scripts/deploy/deploy-app.sh <master|site-2> [--check-only]" >&2
  exit 2
fi

manifest_json=$(npx tsx scripts/deploy/app-manifests.ts "$APP_ID")
manifest() { python3 -c "import json,sys; print(json.load(sys.stdin)$1)" <<<"$manifest_json"; }

REMOTE_APP_DIR=$(manifest "['remoteAppDir']")
WEB_IMAGE=$(manifest "['webImage']")
WEB_CONTAINER=$(manifest "['webContainer']")
COMPOSE_PROJECT=$(manifest "['composeProject']")
WEB_PORT=$(manifest "['webPort']")
HEALTH_ENDPOINT=$(manifest "['healthEndpoint']")
DATA_HOST_DIR=$(manifest "['dataHostDir']")
SSH_TARGET="${SSH_TARGET:-root@163.223.9.198}"

fail() { echo "deploy-app($APP_ID): $1" >&2; exit 1; }

# --- Cross-app isolation guards (always enforced, even in --check-only) ---
MASTER_DIR="/srv/thiepmungonline"
if [[ "$APP_ID" == "site-2" ]]; then
  [[ "$REMOTE_APP_DIR" == "/srv/chungdoi-site2" ]] || fail "site-2 remote dir must be /srv/chungdoi-site2"
  [[ "$WEB_CONTAINER" == "chungdoi-site2-web" ]] || fail "unexpected site-2 container"
  [[ "$WEB_PORT" == "3221" ]] || fail "site-2 loopback port must be 3221"
else
  [[ "$REMOTE_APP_DIR" == "$MASTER_DIR" ]] || fail "master remote dir must stay $MASTER_DIR"
fi
[[ "$REMOTE_APP_DIR" != /* ]] && fail "remote dir must be absolute"

PUBLIC_URL="${NEXT_PUBLIC_SITE_URL:-}"
[[ -n "$PUBLIC_URL" ]] || fail "NEXT_PUBLIC_SITE_URL is required (build input, per-image origin)"
if [[ "$APP_ID" == "site-2" ]]; then
  case "$PUBLIC_URL" in
    https://thiepmungonline.com|https://*.thiepmungonline.com)
      fail "site-2 must not reuse the master hostname" ;;
    https://*) ;;
    *) fail "site-2 requires its own HTTPS origin" ;;
  esac
fi

SCHEMA_FILE="$repo_root/infra/apps/${APP_ID}.env.schema"
[[ -f "$SCHEMA_FILE" ]] || fail "missing $SCHEMA_FILE"
while read -r name; do
  [[ -z "$name" || "$name" == \#* ]] && continue
  if [[ -z "${!name:-}" ]]; then
    echo "deploy-app($APP_ID): note: $name is not set in this shell (required on the target)" >&2
  fi
done < "$SCHEMA_FILE"

if [[ "$APP_ID" == "site-2" ]]; then
  COMPOSE_FILE="$repo_root/infra/compose/site-2.yaml"
  [[ -f "$COMPOSE_FILE" ]] || fail "missing site-2 compose file"
  grep -q "container_name: chungdoi-site2-web" "$COMPOSE_FILE" || fail "compose container mismatch"
  grep -q "127.0.0.1:3221:3000" "$COMPOSE_FILE" || fail "compose must bind loopback 3221 only"
  grep -q "mem_limit: 768m" "$COMPOSE_FILE" || fail "compose memory limit missing"
  if grep -E "^\s*-\s*\"?/srv/thiepmungonline" "$COMPOSE_FILE"; then
    fail "site-2 compose must not mount master's directory"
  fi
  if grep -E "^\s*-\s*\"?0\.0\.0\.0:[0-9]+|^\s*-\s*\"?[0-9]+:3000" "$COMPOSE_FILE"; then
    fail "site-2 compose must not publish a public port"
  fi
fi

echo "deploy-app($APP_ID): manifest + isolation preflight ok (image=$WEB_IMAGE port=$WEB_PORT dir=$REMOTE_APP_DIR)"
[[ "$CHECK_ONLY" == "1" ]] && exit 0

# --- Remote capacity preflight (shared VPS must sustain master + site-2) ---
echo "deploy-app($APP_ID): remote capacity preflight on $SSH_TARGET"
ssh -o BatchMode=yes -o ConnectTimeout=10 "$SSH_TARGET" \
  "set -e; df -Pk ${REMOTE_APP_DIR%/*} | awk 'NR==2 && \$4 < 6291456 {print \"low disk\"; exit 1}'; free -m | awk '/^Mem:/ && \$7 < 512 {print \"low memory\"; exit 1}'; test \"\$(docker ps -q | wc -l)\" -ge 0"

# --- Build with the app's own origin baked in ---
if [[ "$APP_ID" == "site-2" ]]; then
  docker build -f apps/site-2/Dockerfile \
    --build-arg "NEXT_PUBLIC_SITE_URL=$PUBLIC_URL" \
    -t "$WEB_IMAGE" "$repo_root"
else
  echo "deploy-app(master): master keeps its existing pipeline (npm run deploy); refusing to rebuild it here." >&2
  exit 2
fi

# --- Transfer, release, health check ---
IMAGE_TAR="$(mktemp -t "${WEB_CONTAINER}.XXXXXX.tar")"
trap 'rm -f "$IMAGE_TAR"' EXIT
docker save -o "$IMAGE_TAR" "$WEB_IMAGE"
scp -o BatchMode=yes "$IMAGE_TAR" "$SSH_TARGET:/tmp/${WEB_CONTAINER}.tar"
ssh -o BatchMode=yes "$SSH_TARGET" "set -euo pipefail
  docker load -i /tmp/${WEB_CONTAINER}.tar && rm /tmp/${WEB_CONTAINER}.tar
  mkdir -p '$DATA_HOST_DIR' '${REMOTE_APP_DIR}/releases' '${REMOTE_APP_DIR}/backups'"
scp -o BatchMode=yes "$repo_root/infra/compose/site-2.yaml" "$SSH_TARGET:${REMOTE_APP_DIR}/compose.yaml"
ssh -o BatchMode=yes "$SSH_TARGET" "set -euo pipefail
  cd '$REMOTE_APP_DIR'
  test ! -f RETIRED || { echo 'target is retired'; exit 1; }
  docker compose -p '$COMPOSE_PROJECT' -f compose.yaml up -d
  for i in \$(seq 1 30); do
    code=\$(curl -s -o /dev/null -w '%{http_code}' 'http://127.0.0.1:${WEB_PORT}${HEALTH_ENDPOINT}' || true)
    [[ \"\$code\" == '200' ]] && break
    sleep 2
  done
  [[ \"\$code\" == '200' ]] || { echo 'health check failed'; exit 1; }
  date -u +%FT%TZ > LIVE
  echo \"deployed $WEB_IMAGE healthy on 127.0.0.1:${WEB_PORT}${HEALTH_ENDPOINT}\""

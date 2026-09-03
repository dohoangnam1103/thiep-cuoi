#!/usr/bin/env bash
# Run on the Mini PC only, after a production artifact is staged and built.
# No source rsync, migrations, cron changes, cleanup jobs or provider calls here.
set -euo pipefail
phase="${1:?candidate or promote}"
release_id="${2:?explicit release id required}"
[[ "$release_id" =~ ^(cpu-opt|detail-preload)-[0-9]{8}(-[0-9]{6})?$ ]]
root=/home/namdo/apps/thiepmungonline
stage="$root/releases/$release_id"
ops="$root/deployments/$release_id"
image="thiepmungonline-web:$release_id"
rollback_image="thiepmungonline-web:rollback-$release_id"
candidate="thiepmungonline-candidate-$release_id"
[[ " $(hostname -I) " == *" 192.168.0.57 "* ]]
test -f "$root/.env"
docker image inspect "$image" >/dev/null

if [[ "$phase" == candidate ]]; then
  test -f "$stage/scripts/production-release-state.py"
  python3 "$stage/scripts/migration-preflight.py" "$stage/prisma/migrations" "$root/data/prod.db"
  if ! test -f "$ops/checkpoint.json"; then
    python3 "$stage/scripts/production-release-state.py" prepare "$release_id"
  fi
  cp -p "$stage/scripts/production-release-state.py" "$stage/scripts/verify-production-release.mjs" "$stage/scripts/deploy-staged-cpu-production.sh" "$ops/"
  cleanup_candidate() {
    if docker container inspect "$candidate" >/dev/null 2>&1; then
      docker stop -t 5 "$candidate" >/dev/null 2>&1 || true
      docker rm "$candidate" >/dev/null 2>&1 || true
    fi
  }
  trap cleanup_candidate EXIT
  docker run --rm --network none --entrypoint node "$image" -e 'require("better-sqlite3"); require("sharp"); console.log("native_modules=ok")'
  docker run -d --name "$candidate" --network none \
    --cpus=1 --memory=768m --pids-limit=256 \
    --user "$(id -u):$(id -g)" \
    -e NODE_ENV=production -e PORT=3000 -e HOSTNAME=0.0.0.0 \
    -e NEXT_PUBLIC_SITE_URL=https://thiepmungonline.com \
    -e SESSION_SECRET=isolated-candidate-not-a-production-secret \
    -e AUTH_SECRET=isolated-candidate-not-a-production-secret \
    -e PAYMENT_PROVIDER=casso -e DATABASE_URL=file:/app/data/candidate.db \
    -v "$ops:/app/data" -v "$stage/public:/app/public:ro" \
    "$image" >/dev/null
  ready=0
  for attempt in {1..30}; do
    if docker exec "$candidate" node -e 'fetch("http://127.0.0.1:3000/",{signal:AbortSignal.timeout(3000)}).then(r=>process.exit(r.status===200?0:1)).catch(()=>process.exit(1))' >/dev/null 2>&1; then
      ready=1
      break
    fi
    sleep 1
  done
  if [[ "$ready" != 1 ]]; then docker logs --tail 30 "$candidate"; exit 1; fi
  docker exec -i "$candidate" node --input-type=module - http://127.0.0.1:3000 "$release_id" < "$ops/verify-production-release.mjs"
  python3 "$ops/production-release-state.py" prepromote "$release_id"
  python3 "$ops/production-release-state.py" candidate-ok "$release_id"
  echo "candidate_verified=1 live_container_unchanged=1"
elif [[ "$phase" == promote ]]; then
  test -f "$ops/candidate-ok"
  python3 "$ops/production-release-state.py" prepromote "$release_id"
  old_image=$(python3 "$ops/production-release-state.py" old-image "$release_id")
  docker image tag "$old_image" "$rollback_image"
  swapped=0
  rollback() {
    trap - ERR INT TERM
    echo 'Promotion failed; restoring the previous image and public/source tree.' >&2
    if [[ "$swapped" == 1 ]]; then
      python3 "$ops/production-release-state.py" exchange "$release_id"
    fi
    docker image tag "$rollback_image" thiepmungonline-web:latest
    (cd "$root" && docker compose up -d --no-build --no-deps --force-recreate web)
  }
  trap 'rollback; exit 1' ERR INT TERM
  python3 "$ops/production-release-state.py" exchange "$release_id"
  swapped=1
  docker image tag "$image" thiepmungonline-web:latest
  (cd "$root" && docker compose up -d --no-build --no-deps --force-recreate web)
  ready=0
  for attempt in {1..45}; do
    health=$(docker inspect thiepmungonline-web --format '{{if .State.Health}}{{.State.Health.Status}}{{end}}')
    if [[ "$health" == healthy ]] && curl --fail --silent --max-time 4 http://127.0.0.1:3211/ -o /dev/null; then
      ready=1
      break
    fi
    sleep 1
  done
  test "$ready" = 1
  test "$(docker inspect thiepmungonline-web --format '{{.Image}}')" = "$(docker image inspect "$image" --format '{{.Id}}')"
  docker exec -i thiepmungonline-web node --input-type=module - http://127.0.0.1:3000 "$release_id" < "$ops/verify-production-release.mjs"
  python3 "$ops/production-release-state.py" unchanged "$release_id"
  for route in / /bang-gia /mau-thiep/long-phung-v3-do/demo; do
    curl --fail --silent --max-time 20 "https://thiepmungonline.com$route" -o /dev/null
  done
  trap - ERR INT TERM
  echo "production_promoted=$release_id rollback_image=$rollback_image old_source=$stage"
else
  echo 'Expected candidate or promote' >&2
  exit 1
fi

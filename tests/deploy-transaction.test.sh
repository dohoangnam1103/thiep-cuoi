#!/usr/bin/env bash
# Exercise the real pipeline and release pointer helper against local fixtures.
# Every transport/container boundary is stubbed; no SSH or Docker daemon access.
set -euo pipefail

repo_root=$(cd "$(dirname "$0")/.." && pwd)
fixture_root=$(mktemp -d "${TMPDIR:-/tmp}/deploy-transaction.XXXXXX")
fixture_root=$(cd "$fixture_root" && pwd -P)
trap 'rm -rf -- "$fixture_root"' EXIT
export TEST_REAL_RSYNC
TEST_REAL_RSYNC=$(command -v rsync)

for scenario in smoke public-failure timer-failure success; do
  export TEST_CASE="$fixture_root/$scenario" TEST_SCENARIO="$scenario"
  export TEST_EVENTS="$TEST_CASE/events" TEST_ARTIFACT="$TEST_CASE/artifact"
  source_dir="$TEST_CASE/source"
  export REMOTE_APP_DIR="$TEST_CASE/remote" WEB_IMAGE=fixture:production
  mkdir -p "$source_dir/scripts/lib" "$source_dir/public" "$TEST_CASE/bin" \
    "$REMOTE_APP_DIR/releases/current/public" "$REMOTE_APP_DIR/data" "$TEST_ARTIFACT"
  : > "$TEST_EVENTS"
  printf 'old-source\n' > "$REMOTE_APP_DIR/releases/current/marker.txt"
  printf 'old-asset\n' > "$REMOTE_APP_DIR/releases/current/public/asset.txt"
  printf 'new-source\n' > "$source_dir/marker.txt"
  printf 'new-asset\n' > "$source_dir/public/asset.txt"
  printf 'fixture artifact\n' > "$TEST_ARTIFACT/server.js"
  printf 'ARG NODE_VERSION=24.18.0-slim\n' > "$source_dir/Dockerfile.prebuilt"
  printf 'releases/current/public:/app/public\n' > "$REMOTE_APP_DIR/docker-compose.yml"
  : > "$REMOTE_APP_DIR/.env"
  printf '{"running":"old-image","tags":{"fixture:production":"old-image"}}' > "$TEST_CASE/docker-state.json"
  python3 - "$REMOTE_APP_DIR/data/prod.db" <<'PY'
import sqlite3, sys
with sqlite3.connect(sys.argv[1]) as db:
    db.execute("CREATE TABLE fixture (id INTEGER)")
PY

  cp "$repo_root/scripts/deploy-fast.sh" "$repo_root/scripts/deploy-release.sh" \
    "$repo_root/scripts/deploy-sync-source.sh" \
    "$repo_root/scripts/canonical-path-from-html.py" "$source_dir/scripts/"
  cat > "$source_dir/scripts/prepare-deploy.sh" <<'SH'
prepare_deploy_gate() {
  GATE_KEY=gate BUILD_KEY=build BUILD_CACHED=1 DEPLOY_BUILD_DB_HASH=dbhash
  printf 'prepared\n' >> "$TEST_EVENTS"
}
build_next() { printf 'build-reused\n' >> "$TEST_EVENTS"; }
SH
  cat > "$source_dir/scripts/check-deploy-inputs.mjs" <<'JS'
console.log("dbhash");
JS
  cat > "$source_dir/scripts/deploy-cache.py" <<'PY'
import os, sys
if sys.argv[1] == "key":
    print(sys.argv[2])
elif sys.argv[1] == "build-path":
    print(os.environ["TEST_ARTIFACT"])
else:
    raise SystemExit("Unexpected cache boundary")
PY
  cat > "$source_dir/scripts/deploy-assembled-image-cache.py" <<'PY'
import os, sys
command = sys.argv[1]
with open(os.environ["TEST_EVENTS"], "a") as log:
    log.write("assembly-cache:" + command + "\n")
if command == "key":
    print("a" * 64)
elif command == "hit":
    raise SystemExit(1)
elif command != "save":
    raise SystemExit("Unexpected assembled image cache boundary")
PY
  cat > "$source_dir/scripts/migration-preflight.py" <<'PY'
print("fixture migration preflight: no pending migrations")
PY
  cat > "$source_dir/scripts/seed-tracks-if-empty.py" <<'PY'
print("fixture track seed: unchanged")
PY
  cat > "$source_dir/scripts/lib/ssh-transport.sh" <<'SH'
transport_init() { SSH_TARGET=fixture TRANSPORT_KIND=fixture; }
transport_close() { printf 'transport-close\n' >> "$TEST_EVENTS"; }
rsync_rsh() { printf 'fixture-no-network\n'; }
rsh() {
  case "$*" in
    true) return 0 ;;
    'hostname -I') printf '192.0.2.50\n' ;;
    test\ *) bash -c "$*" ;;
    systemctl\ *)
      printf 'timers-check\n' >> "$TEST_EVENTS"
      [[ "$TEST_SCENARIO" != timer-failure ]]
      ;;
    *) printf 'Unsupported fixture remote command\n' >&2; return 92 ;;
  esac
}
rsh_stdin() {
  local script
  script=$(mktemp "$TEST_CASE/remote-script.XXXXXX")
  cat > "$script"
  if [[ "$#" == 3 && "$1" =~ ^(stage|baseline|cache|activate|restore|cleanup)$ ]]; then
    printf 'release:%s\n' "$1" >> "$TEST_EVENTS"
  elif grep -q '^db_backup=' "$script"; then
    printf 'backup\n' >> "$TEST_EVENTS"
    rm -f "$script"
    return 0
  fi
  local status=0
  bash "$script" "$@" || status=$?
  rm -f "$script"
  return "$status"
}
SH
  cat > "$TEST_CASE/bin/ssh" <<'SH'
#!/usr/bin/env bash
echo 'FAIL: transaction fixture attempted real SSH' >&2
exit 99
SH
  cat > "$TEST_CASE/bin/rsync" <<'PY'
#!/usr/bin/env python3
import os, subprocess, sys
args = sys.argv[1:]
destination_text = args[-1]
if not destination_text.startswith("fixture:"):
    raise SystemExit("Unexpected rsync target; refusing network access")
# Translate only the fixture host; preserve checksum/link-dest and all actual
# filters so the local receiver exercises production's source/artifact behavior.
args[-1] = destination_text[len("fixture:"):]
subprocess.run([os.environ["TEST_REAL_RSYNC"], *args], check=True)
with open(os.environ["TEST_EVENTS"], "a") as log:
    log.write("rsync\n")
PY
  cat > "$TEST_CASE/bin/docker" <<'PY'
#!/usr/bin/env python3
import json, os, pathlib, sys
args = sys.argv[1:]
state_file = pathlib.Path(os.environ["TEST_CASE"]) / "docker-state.json"
state = json.loads(state_file.read_text())
def log(message):
    with open(os.environ["TEST_EVENTS"], "a") as stream:
        stream.write(message + "\n")
if args[:2] == ["image", "tag"]:
    source, target = args[2:4]
    state["tags"][target] = state["tags"].get(source, source)
    log("tag:" + state["tags"][target])
elif args[:2] == ["image", "inspect"]:
    values = args[2:]
    template = ""
    if "--format" in values:
        index = values.index("--format")
        template = values[index + 1]
        values = values[:index] + values[index + 2:]
    image = state["tags"].get(values[0], values[0])
    print(image if template == "{{.Id}}" else "built_image=" + image)
elif args and args[0] == "version":
    print("linux/amd64")
elif args[:3] == ["buildx", "imagetools", "inspect"]:
    print("sha256:" + "a" * 64)
elif args and args[0] == "inspect":
    print("healthy" if "Health" in args[-1] else state["running"])
elif args[:2] == ["compose", "up"]:
    state["running"] = state["tags"][os.environ["WEB_IMAGE"]]
    log("compose:" + state["running"])
elif args and args[0] == "build":
    state["tags"][args[args.index("--tag") + 1]] = "new-image"
    log("image-built")
elif args and args[0] == "run":
    print("fixture-container")
elif args and args[0] in {"rm", "logs"}:
    pass
else:
    raise SystemExit("Unexpected Docker command; no daemon access is permitted")
state_file.write_text(json.dumps(state))
PY
  cat > "$TEST_CASE/bin/timeout" <<'SH'
#!/usr/bin/env bash
set -euo pipefail
# Remote production uses GNU timeout; macOS fixtures forward only the observed
# bounded Docker operations, whose docker executable is itself a strict stub.
while [[ "$#" -gt 0 && "$1" == --* ]]; do shift; done
[[ "$#" -gt 1 && "$1" =~ ^[0-9]+[smhd]?$ ]] || exit 97
shift
[[ "$1" == docker ]] || exit 98
exec "$@"
SH
  cat > "$TEST_CASE/bin/curl" <<'PY'
#!/usr/bin/env python3
import os, sys
args = sys.argv[1:]
url = args[-1]
if not (url.startswith("https://fixture.invalid") or url.startswith("http://127.0.0.1:")):
    raise SystemExit("Unexpected curl URL; refusing network access")
if "-w" in args:
    external = url.startswith("https://fixture.invalid")
    failed = external and os.environ["TEST_SCENARIO"] == "public-failure"
    print("503" if failed else "200", end="")
else:
    print('<html data-dpl-id="fixture-build"><head><link rel="canonical" href="https://fixture.invalid/mau-thiep/en-do/demo"></head></html>')
PY
  chmod +x "$TEST_CASE/bin/ssh" "$TEST_CASE/bin/rsync" "$TEST_CASE/bin/docker" \
    "$TEST_CASE/bin/curl" "$TEST_CASE/bin/timeout"

  smoke=0
  [[ "$scenario" == smoke ]] && smoke=1
  set +e
  PATH="$TEST_CASE/bin:$PATH" DEPLOY_LOCAL_BUILD_CONTEXT=1 \
    REMOTE_LAN_IP=192.0.2.50 REMOTE_LAN_USER=fixture \
    PUBLIC_URL=https://fixture.invalid DEPLOYMENT_ID=fixture-build \
    DEPLOY_PREPARE_ONLY=0 MANAGED_SCHEDULERS=systemd SMOKE_ONLY="$smoke" \
    bash "$source_dir/scripts/deploy-fast.sh" > "$TEST_CASE/output" 2>&1
  status=$?
  set -e

  fail() { cat "$TEST_CASE/output" >&2; printf 'FAIL %s: %s\n' "$scenario" "$1" >&2; exit 1; }
  current_source=$(cat "$REMOTE_APP_DIR/releases/current/marker.txt")
  running_image=$(python3 -c 'import json,sys; print(json.load(open(sys.argv[1]))["running"])' "$TEST_CASE/docker-state.json")
  [[ ! -e "$REMOTE_APP_DIR/.deploy-lock" ]] || fail 'deployment lock was not released'
  grep -q '^release:stage$' "$TEST_EVENTS" || fail 'candidate was not staged'
  grep -q '^release:cleanup$' "$TEST_EVENTS" || fail 'candidate cleanup did not run'

  case "$scenario" in
    smoke)
      [[ "$status" == 0 ]] || fail "smoke exited $status"
      [[ "$current_source" == old-source && "$running_image" == old-image ]] || fail 'smoke changed production'
      ! grep -q '^release:activate$' "$TEST_EVENTS" || fail 'smoke activated source'
      ! grep -q '^compose:' "$TEST_EVENTS" || fail 'smoke restarted production'
      ;;
    public-failure|timer-failure)
      [[ "$status" != 0 ]] || fail 'failed check was reported as successful'
      [[ "$current_source" == old-source && "$running_image" == old-image ]] || fail 'source/image rollback did not restore both'
      [[ "$(cat "$REMOTE_APP_DIR/releases/current/public/asset.txt")" == old-asset ]] || fail 'rollback lost old assets'
      grep -q '^release:activate$' "$TEST_EVENTS" || fail 'failure occurred before promotion'
      grep -q '^compose:new-image$' "$TEST_EVENTS" || fail 'candidate image was never started'
      grep -q '^release:restore$' "$TEST_EVENTS" || fail 'failed public/scheduler check did not restore source'
      grep -q '^compose:old-image$' "$TEST_EVENTS" || fail 'rollback did not recreate previous image'
      [[ "$scenario" != timer-failure ]] || grep -q '^timers-check$' "$TEST_EVENTS" || fail 'timer check was not reached'
      ;;
    success)
      [[ "$status" == 0 ]] || fail "successful deploy exited $status"
      [[ "$current_source" == new-source && "$running_image" == new-image ]] || fail 'successful deployment did not select both new source and image'
      ! grep -q '^release:restore$' "$TEST_EVENTS" || fail 'successful deploy was rolled back'
      grep -q '^timers-check$' "$TEST_EVENTS" || fail 'success bypassed scheduler check'
      ;;
  esac
  printf 'OK deploy transaction: %s\n' "$scenario"
done

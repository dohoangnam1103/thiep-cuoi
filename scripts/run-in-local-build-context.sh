#!/usr/bin/env bash
set -euo pipefail

if [[ "$#" -eq 0 ]]; then
  echo "Usage: run-in-local-build-context.sh <command> [args...]" >&2
  exit 2
fi

if [[ "${DEPLOY_LOCAL_BUILD_CONTEXT:-0}" == "1" ]]; then
  exec "$@"
fi

source_root=$(pwd -P)
context_started=$SECONDS
# Keep verified receipts after the temporary context is removed. Resolve a
# caller's relative cache directory against the checkout before changing cwd.
export DEPLOY_CACHE_DIR
DEPLOY_CACHE_DIR=$(python3 - "$source_root" "${DEPLOY_CACHE_DIR:-.deploy-cache}" <<'PY'
import pathlib, sys
print((pathlib.Path(sys.argv[1]) / sys.argv[2]).resolve())
PY
)

# Every deployment uses a frozen copy, including ordinary checkouts. Editing the
# user's working tree while tests run must not invalidate or alter this release.
# The private directory also protects copied environment files and DB snapshots.
umask 077
build_context=$(mktemp -d "${TMPDIR:-/tmp}/thiepmungonline-deploy-context.XXXXXX")
cleanup() {
  rm -rf -- "$build_context"
}
trap cleanup EXIT
trap 'exit 130' INT
trap 'exit 143' TERM

echo "Preparing independent Mac build context: $build_context" >&2
rsync -aL --delete \
  --exclude '/.git' \
  --exclude '/.deploy-cache' \
  --exclude '/backups' \
  --exclude '/.next' \
  --exclude '/.next-prebuilt' \
  --exclude '/node_modules' \
  --exclude '/.deploy-worktree' \
  --exclude '/.worktrees' \
  --exclude '/docs' \
  --exclude '/.superpowers' \
  --exclude '/.claude' \
  --exclude '/.claude-flow' \
  --exclude '/.codegraph' \
  --exclude '/.kiro' \
  --exclude '/.production-archives' \
  --exclude '/data' \
  --exclude '/public/uploads' \
  --exclude '/tests/e2e/.data' \
  --exclude '/tests/e2e/.report' \
  --exclude '/test-results' \
  --exclude '/semantic-review' \
  --exclude '/temp' \
  --exclude '/tmp' \
  --exclude '/.capture' \
  --exclude '/.playwright-mcp' \
  --exclude '*.db' --exclude '*.db-wal' --exclude '*.db-shm' --exclude '*.db-journal' \
  --exclude '*.sqlite' --exclude '*.sqlite-wal' --exclude '*.sqlite-shm' --exclude '*.sqlite-journal' \
  "$source_root/" "$build_context/"
# rsync -a also copies directory permissions; restore the private boundary.
chmod 700 "$build_context"
for environment_file in "$build_context"/.env*; do
  [[ ! -f "$environment_file" ]] || chmod 600 "$environment_file"
done

if [[ ! -d "$source_root/node_modules" ]]; then
  echo "Deploy requires node_modules in the source checkout." >&2
  exit 1
fi
if [[ "$(uname -s)" == "Darwin" ]]; then
  # APFS clones avoid copying dependency bytes and preserve .bin symlinks.
  cp -cR "$source_root/node_modules" "$build_context/node_modules"
else
  cp -a "$source_root/node_modules" "$build_context/node_modules"
fi

# Resolve exactly the production build environment, without sourcing dotenv
# files as shell code or printing their contents. Metadata stays private and is
# removed before the deployment command can sync the context to the VPS.
node - "$source_root" "$build_context" <<'JS'
const fs = require('node:fs');
const path = require('node:path');
const {createRequire} = require('node:module');
const {fileURLToPath} = require('node:url');
const [root, context] = process.argv.slice(2);
const requireLocal = createRequire(path.join(root, 'package.json'));
let loadEnvConfig;
try {
  ({loadEnvConfig} = requireLocal('@next/env'));
} catch {
  // Small command fixtures can have no application/configuration at all. An
  // actual app always needs @next/env; do not silently ignore its DB settings.
  const hasConfig = fs.existsSync(path.join(root, 'package.json')) ||
    fs.existsSync(path.join(root, 'dev.db')) || process.env.DATABASE_URL ||
    fs.readdirSync(root).some(name => name.startsWith('.env'));
  if (hasConfig) throw new Error('Cannot snapshot build database: install @next/env dependencies first.');
  process.exit(0);
}
let failed = false;
const {combinedEnv} = loadEnvConfig(context, false, {info() {}, error() {failed = true;}}, true);
if (failed) throw new Error('Cannot load build environment for database snapshot.');
const url = combinedEnv.DATABASE_URL ?? 'file:./dev.db';
if (!url.startsWith('file:') || !url.slice(5) || url.slice(5) === ':memory:' || /[?#]/.test(url)) {
  throw new Error('Build database must be a local SQLite file without query or fragment.');
}
const configured = url.slice(5).startsWith('//') ? fileURLToPath(url) : path.resolve(root, url.slice(5));
let filename;
try {
  filename = fs.realpathSync(configured);
} catch {
  throw new Error('Build database is missing; pull the production database before deploying.');
}
// Match copied relative configuration where possible. An external DB receives
// a stable private relative name, never a temp path that would break cache hits.
const relative = path.relative(root, filename);
const snapshot = relative && relative !== '..' && !relative.startsWith('../') && !path.isAbsolute(relative)
  ? relative : '.deploy-build.db';
const override = path.isAbsolute(url.slice(5)) || snapshot !== relative || filename !== configured
  ? `file:./${snapshot}` : null;
fs.writeFileSync(path.join(context, '.deploy-db-snapshot.json'), JSON.stringify({filename, snapshot, override}), {mode: 0o600});
JS

if [[ -f "$build_context/.deploy-db-snapshot.json" ]]; then
  python3 - "$build_context" <<'PY'
import json, pathlib, sqlite3, sys, time
context = pathlib.Path(sys.argv[1])
metadata = json.loads((context / '.deploy-db-snapshot.json').read_text())
source_path = pathlib.Path(metadata['filename'])
if not source_path.is_file():
    raise SystemExit('Build database is missing; pull the production database before deploying.')
destination = context / metadata['snapshot']
try:
    destination.resolve().relative_to(context.resolve())
except ValueError:
    raise SystemExit('Build database snapshot path escapes the independent context.')
destination.parent.mkdir(parents=True, exist_ok=True)
# Never copy a live .db file directly: committed rows can still be in its WAL.
started = time.monotonic()
def progress(status, remaining, total):
    if time.monotonic() - started > 30:
        raise RuntimeError('Local database snapshot exceeded 30 seconds; retry when writes settle.')
with sqlite3.connect(source_path.resolve().as_uri() + '?mode=ro', uri=True, timeout=5) as source:
    with sqlite3.connect(str(destination)) as target:
        source.backup(target, pages=1000, progress=progress, sleep=0.05)
        if target.execute('PRAGMA quick_check').fetchone() != ('ok',):
            raise RuntimeError('Local build database snapshot failed integrity validation.')
destination.chmod(0o600)
if metadata['override'] is not None:
    (context / '.deploy-db-override').write_text(metadata['override'])
(context / '.deploy-db-snapshot.json').unlink()
print('Local build database snapshot ready (committed WAL included).', file=sys.stderr)
PY
  if [[ -f "$build_context/.deploy-db-override" ]]; then
    export DATABASE_URL
    DATABASE_URL=$(cat "$build_context/.deploy-db-override")
    rm "$build_context/.deploy-db-override"
  fi
fi

echo "context_prepare_seconds=$((SECONDS - context_started))" >&2
cd "$build_context"
set +e
DEPLOY_LOCAL_BUILD_CONTEXT=1 "$@"
status=$?
set -e
exit "$status"

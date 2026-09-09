#!/usr/bin/env bash
# Sourced by deploy-fast.sh. Receipts are local and content-verified.
prepare_deploy_gate() {
  if [[ "${SKIP_BUILD:-0}" == 1 ]]; then
    echo 'Deploy blocked: SKIP_BUILD=1 is unsafe. Verified cache reuse is automatic.' >&2
    return 1
  fi
  export PUBLIC_URL NEXT_PUBLIC_SITE_URL="$PUBLIC_URL"
  node scripts/check-deploy-inputs.mjs
  # Generate deterministic inputs before fingerprinting (also needed by E2E).
  node scripts/prepare-listing-thumbnails.mjs
  npm run prisma:generate
  export DEPLOY_BUILD_DB_HASH
  DEPLOY_BUILD_DB_HASH=$(node scripts/check-deploy-inputs.mjs --db-hash)
  GATE_KEY=$(python3 scripts/deploy-cache.py key gate "$PWD")
  if python3 scripts/deploy-cache.py gate-hit "$DEPLOY_CACHE_DIR" "$GATE_KEY"; then
    echo 'gate_cache=hit (verified inputs, successful gate receipt)'
  else
    echo 'gate_cache=miss'
    bash scripts/check-deploy-i18n.sh
    [[ "$GATE_KEY" == "$(python3 scripts/deploy-cache.py key gate "$PWD")" ]] || {
      echo 'Source changed during tests; rerun deploy with stable inputs.' >&2; return 1;
    }
    python3 scripts/deploy-cache.py gate-save "$DEPLOY_CACHE_DIR" "$GATE_KEY"
  fi
  BUILD_KEY=$(python3 scripts/deploy-cache.py key build "$PWD")
  if python3 scripts/deploy-cache.py build-hit "$DEPLOY_CACHE_DIR" "$BUILD_KEY"; then
    BUILD_CACHED=1
    DEPLOYMENT_ID=$(python3 scripts/deploy-cache.py build-id "$DEPLOY_CACHE_DIR" "$BUILD_KEY")
    echo "build_cache=hit (verified artifact, dpl=$DEPLOYMENT_ID)"
  else
    BUILD_CACHED=0
    echo 'build_cache=miss'
  fi
}

build_next() {
  [[ "$BUILD_CACHED" == 1 ]] && return 0
  NEXT_DEPLOYMENT_ID="$DEPLOYMENT_ID" NODE_ENV=production npm run build
  test -f .next/standalone/server.js || {
    echo 'Missing flat standalone server.js; build context is invalid.' >&2; return 1;
  }
  local ARTIFACT_STAGE
  ARTIFACT_STAGE=$(mktemp -d "${TMPDIR:-/tmp}/thiepmungonline-prebuilt.XXXXXX")
  trap 'rm -rf -- "$ARTIFACT_STAGE"' EXIT
mkdir -p "$ARTIFACT_STAGE/.next" "$ARTIFACT_STAGE/static"
cp .next/standalone/server.js "$ARTIFACT_STAGE/server.js"

# Sinh package.json "chỉ dependency" cho stage dependencies của Dockerfile.
# Giữ đúng những field ảnh hưởng tới việc npm giải dependency, bỏ scripts /
# description / keywords... Nhờ vậy sửa scripts hay đổi mô tả không còn làm
# npm ci + npm prune chạy lại ~200s trên VPS.
node -e '
const fs = require("node:fs");
const pkg = JSON.parse(fs.readFileSync("package.json", "utf8"));
// name + version phải giữ để npm ci không báo lệch với package-lock.json.
// overrides + engines ảnh hưởng trực tiếp tới cây dependency được cài.
const fields = [
  "name",
  "version",
  "private",
  "engines",
  "overrides",
  "dependencies",
  "devDependencies",
  "optionalDependencies",
  "peerDependencies",
  "peerDependenciesMeta",
  "bundleDependencies",
  "packageManager",
  "workspaces",
];
const trimmed = {};
for (const field of fields) {
  if (pkg[field] !== undefined) trimmed[field] = pkg[field];
}
fs.writeFileSync(process.argv[1], JSON.stringify(trimmed, null, 2) + "\n");
' "$ARTIFACT_STAGE/package.deps.json"
# Chỉ lấy .next của standalone + static. Bỏ .next/standalone/node_modules:
# nó được trace trên macOS nên có thể chứa native addon Mach-O; VPS dựng
# node_modules amd64 riêng trong layer cache của nó.
rsync -a --delete .next/standalone/.next/ "$ARTIFACT_STAGE/.next/"
rsync -a --delete .next/static/ "$ARTIFACT_STAGE/static/"
bash scripts/validate-standalone-artifact.sh "$ARTIFACT_STAGE"

  [[ "$BUILD_KEY" == "$(python3 scripts/deploy-cache.py key build "$PWD")" ]] || {
    echo 'Source changed during build; refusing to cache or deploy it.' >&2; return 1;
  }
  [[ "$DEPLOY_BUILD_DB_HASH" == "$(node scripts/check-deploy-inputs.mjs --db-hash)" ]] || {
    echo 'Local database changed during build; rerun deploy.' >&2; return 1;
  }
  python3 scripts/deploy-cache.py build-save "$DEPLOY_CACHE_DIR" "$BUILD_KEY" "$ARTIFACT_STAGE" "$DEPLOYMENT_ID"
  rm -rf -- "$ARTIFACT_STAGE"
  trap - EXIT
}

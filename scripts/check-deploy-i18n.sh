#!/usr/bin/env bash
# Mandatory, local-only gate. Never reuse an unverified production artifact.
set -euo pipefail
cd "$(dirname "$0")/.."

if [[ "${SKIP_BUILD:-0}" == "1" ]]; then
  echo 'Deploy blocked: SKIP_BUILD=1 could publish an artifact different from the source checked for i18n.' >&2
  echo 'Run deploy without SKIP_BUILD so production is rebuilt after the i18n gate.' >&2
  exit 1
fi

echo 'Checking i18n catalogs, keys and provider coverage...'
npm run check:i18n
echo 'Checking all invitation templates and editor/admin previews in a fresh test server...'
npm run test:i18n:e2e
echo 'i18n gate passed. Production build and deployment may proceed.'

#!/usr/bin/env bash
set -euo pipefail

artifact_root=${1:?Usage: validate-standalone-artifact.sh <artifact-root>}
artifact_root=$(cd "$artifact_root" && pwd -P)
alias_dir="$artifact_root/.next/node_modules"
runtime_node_modules="$artifact_root/node_modules"

[[ -d "$alias_dir" ]] || exit 0

while IFS= read -r -d '' link; do
  if [[ ! -e "$link" ]]; then
    resolved_target=$(python3 - "$link" <<'PY'
import os
import sys

print(os.path.realpath(sys.argv[1]))
PY
)
    case "$resolved_target" in
      "$runtime_node_modules"/*) continue ;;
    esac
    echo "Broken standalone dependency symlink: $link -> $(readlink "$link")" >&2
    exit 1
  fi
done < <(find "$alias_dir" -type l -print0)

echo "standalone_dependency_symlinks=ok"

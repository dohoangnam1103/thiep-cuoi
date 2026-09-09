#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
TASK_TMP="$(mktemp -d "${TMPDIR:-/tmp}/deploy-release-test.XXXXXX")"
trap 'rm -rf "$TASK_TMP"' EXIT

release() {
  # Production sends this script on stdin; tests exercise that exact interface.
  bash -s -- "$@" < "$ROOT/scripts/deploy-release.sh"
}

assert_file() {
  [[ "$(cat "$1")" == "$2" ]] || { echo "Unexpected content: $1" >&2; exit 1; }
}

# Populate only after staging an empty candidate, as the pipeline does. Starting
# empty is essential: --link-dest links only byte/attribute-identical files.
stage_populated() {
  local app="$1" identifier="$2" source="${3:-}" transfer_baseline
  release stage "$app" "$identifier"
  python3 - "$app/releases/candidate-$identifier" <<'PY_EMPTY'
from pathlib import Path
import sys
assert not any(Path(sys.argv[1]).iterdir()), "stage must create an empty candidate"
PY_EMPTY
  transfer_baseline=$(release baseline "$app" "$identifier")
  [[ "$transfer_baseline" == /* && "$transfer_baseline" != *$'\n'* ]]
  source="${source:-$transfer_baseline}"
  rsync -ac --link-dest="$transfer_baseline" "$source/" "$app/releases/candidate-$identifier/"
}

# Legacy bootstrap: candidate rsync cannot modify the active hardlinked source.
APP="$TASK_TMP/legacy"
mkdir -p "$APP/releases/current" "$TASK_TMP/upload"
printf 'old production\n' > "$APP/releases/current/page.txt"
ln -s page.txt "$APP/releases/current/link.txt"
printf 'new candidate source\n' > "$TASK_TMP/upload/page.txt"
stage_populated "$APP" one
[[ -L "$APP/releases/candidate-one/link.txt" ]]
python3 - "$APP" <<'PY'
from pathlib import Path
import os
import sys
app = Path(sys.argv[1])
assert os.stat(app / 'releases/current/page.txt').st_ino == os.stat(app / 'releases/candidate-one/page.txt').st_ino
PY
if release stage "$APP" concurrent; then
  echo 'Concurrent deployment unexpectedly acquired the lock' >&2
  exit 1
fi
rsync -a --checksum "$TASK_TMP/upload/" "$APP/releases/candidate-one/"
assert_file "$APP/releases/current/page.txt" 'old production'
assert_file "$APP/releases/candidate-one/page.txt" 'new candidate source'
release restore "$APP" one
assert_file "$APP/releases/current/page.txt" 'old production'
release activate "$APP" one
[[ -L "$APP/releases/current" ]]
assert_file "$APP/releases/current/page.txt" 'new candidate source'
assert_file "$APP/releases/previous-one/page.txt" 'old production'
release activate "$APP" one
release restore "$APP" one
release restore "$APP" one
assert_file "$APP/releases/current/page.txt" 'old production'
release cleanup "$APP" one
[[ ! -e "$APP/releases/candidate-one" && ! -e "$APP/.deploy-lock" ]]
assert_file "$APP/releases/previous-one/page.txt" 'old production'

# Existing symlink: successful cleanup retains the active release and the next
# activation retains it as a previous release even if older cleanup is retried.
APP="$TASK_TMP/symlink"
mkdir -p "$APP/releases/original"
printf 'original\n' > "$APP/releases/original/page.txt"
ln -s original "$APP/releases/current"
stage_populated "$APP" two
release activate "$APP" two
release cleanup "$APP" two
[[ -d "$APP/releases/candidate-two" && ! -e "$APP/.deploy-lock" ]]
stage_populated "$APP" three
release activate "$APP" three
assert_file "$APP/releases/original/page.txt" original
release restore "$APP" three
[[ "$(readlink "$APP/releases/current")" == candidate-two ]]
release cleanup "$APP" three
[[ -d "$APP/releases/candidate-two" && ! -e "$APP/releases/candidate-three" ]]

# Smoke or any failure before activation simply discards the staged candidate.
stage_populated "$APP" smoke
if release cleanup "$APP" wrong-owner; then
  echo 'Another release unexpectedly released the deployment lock' >&2
  exit 1
fi
[[ "$(cat "$APP/.deploy-lock/owner")" == smoke ]]
release restore "$APP" smoke
release cleanup "$APP" smoke
[[ "$(readlink "$APP/releases/current")" == candidate-two ]]
[[ ! -e "$APP/releases/candidate-smoke" && ! -e "$APP/.deploy-lock" ]]

# Interrupted legacy conversion is restorable using metadata outside current.
APP="$TASK_TMP/interrupted"
mkdir -p "$APP/releases/current"
printf 'recoverable\n' > "$APP/releases/current/page.txt"
stage_populated "$APP" four
printf '{"previous":"previous-four","legacy":true}\n' > "$APP/.deploy-release-state/four.json"
mv "$APP/releases/current" "$APP/releases/previous-four"
release restore "$APP" four
assert_file "$APP/releases/current/page.txt" recoverable
release cleanup "$APP" four

# Three successful releases retain exactly current + immediate rollback source.
# Pruning only runs on final cleanup; old source is still present during checks.
APP="$TASK_TMP/retention"
mkdir -p "$APP/releases/current" "$APP/releases/manual-backup" "$APP/backups"
printf 'retention-source\n' > "$APP/releases/current/page.txt"
printf 'manual\n' > "$APP/releases/manual-backup/keep.txt"
printf 'database-backup\n' > "$APP/backups/keep.txt"
for ID in retain-a retain-b retain-c; do
  stage_populated "$APP" "$ID"
  release activate "$APP" "$ID"
  if [[ "$ID" == retain-c ]]; then
    [[ -d "$APP/releases/candidate-retain-a" ]]
  fi
  release cleanup "$APP" "$ID"
done
[[ "$(readlink "$APP/releases/current")" == candidate-retain-c ]]
[[ -d "$APP/releases/candidate-retain-b" ]]
[[ ! -e "$APP/releases/candidate-retain-a" && ! -e "$APP/releases/previous-retain-a" ]]
assert_file "$APP/releases/manual-backup/keep.txt" manual
assert_file "$APP/backups/keep.txt" database-backup

# Identical bytes with changed mode/mtime must receive separate inodes. A
# prelinked candidate plus ordinary rsync would alter production metadata here.
METADATA_APP="$TASK_TMP/metadata-only"
METADATA_UPLOAD="$TASK_TMP/metadata-upload"
mkdir -p "$METADATA_APP/releases/current" "$METADATA_UPLOAD"
printf 'same bytes\n' > "$METADATA_APP/releases/current/mode.txt"
printf 'same bytes\n' > "$METADATA_APP/releases/current/time.txt"
printf 'same bytes\n' > "$METADATA_APP/releases/current/unchanged.txt"
chmod 644 "$METADATA_APP/releases/current/"*.txt
python3 - "$METADATA_APP" <<'PY'
import os
from pathlib import Path
import sys
for path in (Path(sys.argv[1]) / 'releases/current').glob('*.txt'):
    os.utime(path, (1_700_000_000, 1_700_000_000))
PY
rsync -a "$METADATA_APP/releases/current/" "$METADATA_UPLOAD/"
chmod 755 "$METADATA_UPLOAD/mode.txt"
python3 - "$METADATA_APP" "$METADATA_UPLOAD" <<'PY'
import os
from pathlib import Path
import sys
original = Path(sys.argv[1]) / 'releases/current/time.txt'
modified = Path(sys.argv[2]) / 'time.txt'
info = original.stat()
os.utime(modified, ns=(info.st_atime_ns, info.st_mtime_ns + 10_000_000_000))
PY
stage_populated "$METADATA_APP" metadata-only "$METADATA_UPLOAD"
python3 - "$METADATA_APP" "$METADATA_UPLOAD" <<'PY'
from pathlib import Path
import sys
app, upload = Path(sys.argv[1]), Path(sys.argv[2])
current = app / 'releases/current'
candidate = app / 'releases/candidate-metadata-only'
for name in ('mode.txt', 'time.txt'):
    assert (current / name).stat().st_ino != (candidate / name).stat().st_ino
assert (current / 'mode.txt').stat().st_mode & 0o777 == 0o644
assert (candidate / 'mode.txt').stat().st_mode & 0o777 == 0o755
assert (current / 'time.txt').stat().st_mtime_ns != (candidate / 'time.txt').stat().st_mtime_ns
assert (candidate / 'time.txt').stat().st_mtime_ns == (upload / 'time.txt').stat().st_mtime_ns
assert (current / 'unchanged.txt').stat().st_ino == (candidate / 'unchanged.txt').stat().st_ino
PY
if release baseline "$METADATA_APP" wrong-owner; then
  echo 'Another release unexpectedly read the staging baseline' >&2
  exit 1
fi
release cleanup "$METADATA_APP" metadata-only
if release baseline "$METADATA_APP" metadata-only; then
  echo 'Staging baseline unexpectedly readable without a lock' >&2
  exit 1
fi

# A failed activation restores current and preserves that release's own rollback.
stage_populated "$APP" retain-failed
release activate "$APP" retain-failed
[[ -d "$APP/releases/candidate-retain-b" && -d "$APP/releases/candidate-retain-c" ]]
release restore "$APP" retain-failed
release cleanup "$APP" retain-failed
[[ "$(readlink "$APP/releases/current")" == candidate-retain-c ]]
[[ -d "$APP/releases/candidate-retain-b" && ! -e "$APP/releases/candidate-retain-failed" ]]
stage_populated "$APP" retain-smoke
release cleanup "$APP" retain-smoke
[[ -d "$APP/releases/candidate-retain-b" && -d "$APP/releases/candidate-retain-c" ]]
[[ ! -e "$APP/releases/candidate-retain-smoke" ]]

# Completed smoke uploads survive cleanup and seed the next retry. The active
# legacy source remains untouched; only one extra transfer baseline is retained.
APP="$TASK_TMP/transfer"
mkdir -p "$APP/releases/current/.next-prebuilt" "$TASK_TMP/transfer-upload/.next-prebuilt"
printf 'production artifact\n' > "$APP/releases/current/.next-prebuilt/server.js"
printf 'uploaded artifact\n' > "$TASK_TMP/transfer-upload/.next-prebuilt/server.js"
stage_populated "$APP" cache-one
rsync -a --checksum "$TASK_TMP/transfer-upload/" "$APP/releases/candidate-cache-one/"
release cache "$APP" cache-one
release cleanup "$APP" cache-one
[[ -d "$APP/releases/candidate-cache-one" && ! -e "$APP/.deploy-lock" ]]
assert_file "$APP/releases/current/.next-prebuilt/server.js" 'production artifact'
stage_populated "$APP" cache-two
python3 - "$APP" <<'PY'
from pathlib import Path
import os
import sys
app = Path(sys.argv[1])
first = app / 'releases/candidate-cache-one/.next-prebuilt/server.js'
second = app / 'releases/candidate-cache-two/.next-prebuilt/server.js'
current = app / 'releases/current/.next-prebuilt/server.js'
assert os.stat(first).st_ino == os.stat(second).st_ino
assert os.stat(first).st_ino != os.stat(current).st_ino
assert not list((app / 'releases/candidate-cache-two').glob('*.json'))
PY
rsync -a --checksum "$TASK_TMP/transfer-upload/" "$APP/releases/candidate-cache-two/"
if release cache "$APP" wrong-owner; then
  echo 'Another release unexpectedly updated the transfer cache' >&2
  exit 1
fi
release cache "$APP" cache-two
release cleanup "$APP" cache-two
[[ ! -e "$APP/releases/candidate-cache-one" && -d "$APP/releases/candidate-cache-two" ]]
assert_file "$APP/releases/current/.next-prebuilt/server.js" 'production artifact'
if release cache "$APP" cache-two; then
  echo 'Transfer cache unexpectedly updated without a lock' >&2
  exit 1
fi

# A partial retry never supersedes the last verified upload.
stage_populated "$APP" partial-retry
printf 'partial upload\n' > "$TASK_TMP/transfer-upload/.next-prebuilt/server.js"
rsync -a --checksum "$TASK_TMP/transfer-upload/" "$APP/releases/candidate-partial-retry/"
release cleanup "$APP" partial-retry
[[ ! -e "$APP/releases/candidate-partial-retry" ]]
assert_file "$APP/releases/candidate-cache-two/.next-prebuilt/server.js" 'uploaded artifact'
assert_file "$APP/releases/current/.next-prebuilt/server.js" 'production artifact'

# Cache may overlap active or previous; successful deployment keeps its legacy
# rollback and subsequent cached smoke keeps both alongside one transfer copy.
stage_populated "$APP" cached-live
release cache "$APP" cached-live
release activate "$APP" cached-live
release cleanup "$APP" cached-live
[[ ! -e "$APP/releases/candidate-cache-two" ]]
assert_file "$APP/releases/previous-cached-live/.next-prebuilt/server.js" 'production artifact'
stage_populated "$APP" cached-smoke
release cache "$APP" cached-smoke
release cleanup "$APP" cached-smoke
[[ "$(readlink "$APP/releases/current")" == candidate-cached-live ]]
[[ -d "$APP/releases/previous-cached-live" && -d "$APP/releases/candidate-cached-smoke" ]]
stage_populated "$APP" cached-failed
release cache "$APP" cached-failed
release activate "$APP" cached-failed
release restore "$APP" cached-failed
release cleanup "$APP" cached-failed
[[ "$(readlink "$APP/releases/current")" == candidate-cached-live ]]
[[ -d "$APP/releases/previous-cached-live" && -d "$APP/releases/candidate-cached-failed" ]]
[[ ! -e "$APP/releases/candidate-cached-smoke" ]]

# Invalid/missing/foreign transfer pointers are only cache misses. No pointer
# can authorize traversing outside releases, following symlinks or pruning a
# manually created directory. The new candidate must come from current.
APP="$TASK_TMP/invalid-transfer"
mkdir -p "$APP/releases/current" "$APP/releases/manual-backup" "$APP/.deploy-release-state/transfer-cache"
printf 'safe current\n' > "$APP/releases/current/page.txt"
printf 'manual keep\n' > "$APP/releases/manual-backup/page.txt"
for CASE in missing malformed traversal unknown missing-receipt mismatched-receipt symlink-pointer symlink-candidate; do
  python3 - "$APP" "$CASE" <<'PY'
import json
from pathlib import Path
import sys
app, case = Path(sys.argv[1]), sys.argv[2]
metadata = app / '.deploy-release-state/transfer-cache'
pointer = metadata / '.current'
if pointer.exists() or pointer.is_symlink():
    pointer.unlink()
if case == 'missing':
    pass
elif case == 'malformed':
    pointer.write_text('not json')
elif case == 'traversal':
    pointer.write_text(json.dumps({'version': 1, 'release_id': '../manual-backup'}))
else:
    pointer.write_text(json.dumps({'version': 1, 'release_id': 'foreign'}))
    if case == 'missing-receipt':
        (app / 'releases/candidate-foreign').mkdir(exist_ok=True)
    elif case == 'mismatched-receipt':
        (metadata / 'foreign.json').write_text(json.dumps({'version': 1, 'release_id': 'other'}))
    elif case == 'symlink-pointer':
        pointer.unlink()
        pointer.symlink_to(app / 'releases/manual-backup/page.txt')
    elif case == 'symlink-candidate':
        target = app / 'releases/candidate-foreign'
        if target.exists():
            target.rmdir()
        target.symlink_to('manual-backup')
        (metadata / 'foreign.json').write_text(json.dumps({'version': 1, 'release_id': 'foreign'}))
PY
  stage_populated "$APP" "invalid-$CASE"
  assert_file "$APP/releases/candidate-invalid-$CASE/page.txt" 'safe current'
  release cleanup "$APP" "invalid-$CASE"
  assert_file "$APP/releases/manual-backup/page.txt" 'manual keep'
done

for BAD_ID in ../escape a/b '..'; do
  if release stage "$APP" "$BAD_ID"; then
    echo 'Traversal release ID unexpectedly accepted' >&2
    exit 1
  fi
done
if release stage relative/path five; then
  echo 'Relative app directory unexpectedly accepted' >&2
  exit 1
fi
echo 'Deploy release transaction tests passed.'

#!/usr/bin/env bash
# Pull a verified, read-only production SQLite snapshot from the active VPS.
# ./scripts/pull-prod-db.sh [--db-only] (default also adds uploaded media)
set -euo pipefail
umask 077

case "${1:-}" in
  ''|--db-only) ;;
  *) echo "Usage: $0 [--db-only]" >&2; exit 2 ;;
esac
[[ $# -le 1 ]] || { echo "Usage: $0 [--db-only]" >&2; exit 2; }

HOST=${PROD_SSH_HOST:-root@163.223.9.198}
case "$HOST" in
  *minipc*|*MINIPC*|-*|*[!a-zA-Z0-9_.@:-]*)
    echo "Refusing retired/invalid host. Use the active VPS: root@163.223.9.198." >&2
    exit 1
    ;;
esac
REMOTE_APP=/srv/thiepmungonline
REMOTE_DATA="$REMOTE_APP/data"
DIR=backups/prod-db
DB_ONLY=${1:-}
SSH_OPTIONS=(-o BatchMode=yes -o ConnectTimeout=10)
REMOTE_SNAP=''
DOWNLOAD=''
LOCAL_STAGE=''

cd "$(dirname "$0")/.."
for required in python3 ssh scp lsof; do
  command -v "$required" >/dev/null || { echo "Required command missing: $required" >&2; exit 1; }
done
if [[ "$DB_ONLY" != --db-only ]]; then
  command -v rsync >/dev/null || { echo "Required command missing: rsync" >&2; exit 1; }
fi

assert_local_db_closed() {
  local open_pids
  open_pids=$(lsof -t -- dev.db dev.db-wal dev.db-shm dev.db-journal 2>/dev/null || true)
  if [[ -n "$open_pids" ]]; then
    echo "Local dev.db is open (PID(s): $(printf '%s' "$open_pids" | tr '\n' ' '))." >&2
    echo "Stop the local dev server and other DB clients, then rerun this command. Nothing was replaced." >&2
    exit 1
  fi
}
assert_local_db_closed

cleanup() {
  if [[ -n "$REMOTE_SNAP" ]]; then
    ssh "${SSH_OPTIONS[@]}" "$HOST" "rm -f -- '$REMOTE_SNAP' '$REMOTE_SNAP-wal' '$REMOTE_SNAP-shm'" >/dev/null 2>&1 || true
  fi
  [[ -z "$DOWNLOAD" ]] || rm -f -- "$DOWNLOAD"
  [[ -z "$LOCAL_STAGE" ]] || rm -f -- "$LOCAL_STAGE"
}
trap cleanup EXIT
mkdir -p "$DIR"
chmod 700 "$DIR"
DOWNLOAD=$(mktemp "$DIR/.download.XXXXXX")
TS="$(date +%Y%m%d-%H%M%S)-${DOWNLOAD##*.}"

echo "==> Snapshotting the active VPS database (read-only SQLite online backup)"
snapshot_result=$(ssh "${SSH_OPTIONS[@]}" "$HOST" "python3 - '$REMOTE_APP'" <<'PY'
import hashlib
import os
from pathlib import Path
import sqlite3
import sys
import tempfile

app = Path(sys.argv[1])
if not (app / "LIVE").is_file() or (app / "RETIRED").exists():
    raise SystemExit("Production guard failed: LIVE must exist and RETIRED must be absent. No database was read.")

os.umask(0o077)
fd, snapshot = tempfile.mkstemp(prefix="thiepmung-db-pull-", suffix=".db", dir="/tmp")
os.close(fd)
try:
    source = sqlite3.connect((app / "data/prod.db").as_uri() + "?mode=ro", uri=True)
    destination = sqlite3.connect(snapshot)
    try:
        source.backup(destination)
        result = destination.execute("PRAGMA integrity_check").fetchall()
        if result != [("ok",)]:
            raise RuntimeError("Production snapshot failed integrity check")
    finally:
        destination.close()
        source.close()
    digest = hashlib.sha256()
    with open(snapshot, "rb") as stream:
        for chunk in iter(lambda: stream.read(1024 * 1024), b""):
            digest.update(chunk)
    print(snapshot, digest.hexdigest())
except BaseException:
    os.unlink(snapshot)
    raise
PY
)
if [[ ! "$snapshot_result" =~ ^(/tmp/thiepmung-db-pull-[a-zA-Z0-9_-]+\.db)[[:space:]]([a-f0-9]{64})$ ]]; then
  echo "Invalid snapshot response from VPS; local DB was not replaced." >&2
  exit 1
fi
REMOTE_SNAP=${BASH_REMATCH[1]}
EXPECTED_SHA=${BASH_REMATCH[2]}

echo "==> Downloading and verifying SHA-256 and SQLite integrity"
scp "${SSH_OPTIONS[@]}" -q "$HOST:$REMOTE_SNAP" "$DOWNLOAD"
python3 - "$DOWNLOAD" "$EXPECTED_SHA" <<'PY'
import hashlib
from pathlib import Path
import sqlite3
import sys

snapshot = Path(sys.argv[1]).resolve()
digest = hashlib.sha256()
with snapshot.open("rb") as stream:
    for chunk in iter(lambda: stream.read(1024 * 1024), b""):
        digest.update(chunk)
if digest.hexdigest() != sys.argv[2]:
    raise SystemExit("Snapshot SHA-256 mismatch; local DB was not replaced.")
connection = sqlite3.connect(snapshot.as_uri() + "?mode=ro", uri=True)
try:
    if connection.execute("PRAGMA integrity_check").fetchall() != [("ok",)]:
        raise SystemExit("Downloaded snapshot failed integrity check; local DB was not replaced.")
finally:
    connection.close()
PY
SNAPSHOT="$DIR/prod-$TS.db"
mv "$DOWNLOAD" "$SNAPSHOT"
DOWNLOAD=''

# Recheck after the download: a dev server may have started in the meantime.
assert_local_db_closed
echo "==> Backing up the previous local database (including committed WAL data)"
LOCAL_STAGE=$(mktemp .dev.db.prod-pull.XXXXXX)
python3 - "$SNAPSHOT" "$DIR/dev.db.before-prod-pull-$TS" "$LOCAL_STAGE" <<'PY'
import os
from pathlib import Path
import shutil
import sqlite3
import sys

snapshot, backup, stage = map(Path, sys.argv[1:])
local = Path("dev.db")
if local.exists():
    source = sqlite3.connect(local.resolve().as_uri() + "?mode=ro", uri=True)
    destination = sqlite3.connect(backup)
    try:
        source.backup(destination)
        if destination.execute("PRAGMA integrity_check").fetchall() != [("ok",)]:
            raise RuntimeError("Local backup failed integrity check; local DB was not replaced.")
    finally:
        destination.close()
        source.close()
    os.chmod(backup, 0o600)
shutil.copyfile(snapshot, stage)
os.chmod(stage, 0o600)
with stage.open("rb") as stream:
    os.fsync(stream.fileno())
# No local clients are running; the old DB is safely archived before its
# journals are removed and the complete replacement is atomically installed.
for suffix in ("-journal", "-wal", "-shm"):
    Path(str(local) + suffix).unlink(missing_ok=True)
os.replace(stage, local)
PY
LOCAL_STAGE=''
echo "    Verified snapshot kept at $SNAPSHOT"

if [[ "$DB_ONLY" != --db-only ]]; then
  echo "==> Adding production uploaded media to data/"
  for media_dir in editor-uploads guest-media blog-media slideshow-media; do
    mkdir -p "data/$media_dir"
    if ! ssh "${SSH_OPTIONS[@]}" "$HOST" "test -d '$REMOTE_DATA/$media_dir'"; then
      echo "    $media_dir: absent on production, skipped"
      continue
    fi
    # No --delete: retain local-only media. Do not print uploaded filenames.
    rsync -a -e 'ssh -o BatchMode=yes -o ConnectTimeout=10' \
      "$HOST:$REMOTE_DATA/$media_dir/" "data/$media_dir/"
  done
fi
echo "Done. Latest production database is installed locally. Start your dev server when ready."

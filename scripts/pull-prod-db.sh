#!/usr/bin/env bash
#
# Pull the production SQLite DB (and uploaded media) from minipc down to local.
#
#   ./scripts/pull-prod-db.sh            # DB + media
#   ./scripts/pull-prod-db.sh --db-only  # DB only
#
# Safety properties:
#   * Prod is only ever READ. The snapshot uses SQLite's online backup API
#     (python3 stdlib) against a mode=ro connection, so it cannot tear a
#     concurrent write and never locks out the running app.
#   * The current local dev.db is copied to backups/prod-db/ before it is
#     replaced, so the swap is reversible.
#   * Every downloaded snapshot is kept in backups/prod-db/ as a dated backup.
#   * backups/ and data/ are gitignored: production data must never reach git.
#
set -euo pipefail

HOST=${PROD_SSH_HOST:-minipc}
REMOTE_DATA=/home/namdo/apps/thiepmungonline/data
REMOTE_DB="$REMOTE_DATA/prod.db"
REMOTE_SNAP=/tmp/prod-db-snapshot-$$.db
DIR=backups/prod-db
TS=$(date +%Y%m%d-%H%M%S)
DB_ONLY=${1:-}

cd "$(dirname "$0")/.."
mkdir -p "$DIR"

cleanup() { ssh "$HOST" "rm -f $REMOTE_SNAP" >/dev/null 2>&1 || true; }
trap cleanup EXIT

echo "==> [1/5] snapshotting $HOST:$REMOTE_DB (read-only, online backup API)"
ssh "$HOST" "REMOTE_DB='$REMOTE_DB' REMOTE_SNAP='$REMOTE_SNAP' python3 -" <<'PY'
import hashlib, os, sqlite3
src_path, dst_path = os.environ["REMOTE_DB"], os.environ["REMOTE_SNAP"]
src = sqlite3.connect(f"file:{src_path}?mode=ro", uri=True)
dst = sqlite3.connect(dst_path)
with dst:
    src.backup(dst)
dst.close(); src.close()

con = sqlite3.connect(f"file:{dst_path}?mode=ro", uri=True)
assert con.execute("PRAGMA integrity_check").fetchone()[0] == "ok", "integrity check FAILED"
tables = [r[0] for r in con.execute(
    "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'")]
rows = sum(con.execute(f'SELECT COUNT(*) FROM "{t}"').fetchone()[0] for t in tables)
con.close()
h = hashlib.sha256()
with open(dst_path, "rb") as f:
    for c in iter(lambda: f.read(1 << 20), b""):
        h.update(c)
print(f"    integrity=ok tables={len(tables)} rows={rows}")
print(f"    sha256={h.hexdigest()}")
PY

echo "==> [2/5] backing up current local dev.db"
if [ -f dev.db ]; then
  cp dev.db "$DIR/dev.db.before-prod-pull-$TS"
  echo "    saved $DIR/dev.db.before-prod-pull-$TS"
else
  echo "    (no local dev.db yet)"
fi

echo "==> [3/5] downloading snapshot"
scp -q "$HOST:$REMOTE_SNAP" "$DIR/prod-$TS.db"
echo "    kept as backup: $DIR/prod-$TS.db"
shasum -a 256 "$DIR/prod-$TS.db" | sed 's/^/    local sha256=/'

echo "==> [4/5] installing as dev.db"
rm -f dev.db-journal dev.db-wal dev.db-shm   # stale journals from the old file
cp "$DIR/prod-$TS.db" dev.db
python3 - <<'PY'
import sqlite3
con = sqlite3.connect("file:dev.db?mode=ro", uri=True)
print("    integrity:", con.execute("PRAGMA integrity_check").fetchone()[0])
print("    migrations:", con.execute("SELECT COUNT(*) FROM _prisma_migrations").fetchone()[0])
con.close()
PY

if [ "$DB_ONLY" = "--db-only" ]; then
  echo "==> [5/5] skipping media (--db-only)"
else
  echo "==> [5/5] syncing uploaded media into data/"
  for d in editor-uploads guest-media blog-media; do
    mkdir -p "data/$d"
    # No --delete: prod files are added, local-only extras are left in place.
    # NOTE: macOS ships rsync 2.6.9 which rejects --info=; use --stats.
    rsync -a --stats "$HOST:$REMOTE_DATA/$d/" "data/$d/" \
      | grep -E "^Number of files transferred" | sed "s/^/    $d: /"
  done
fi

echo
echo "Done. Prod data is local. Restart the dev server so it reopens the DB file."

#!/usr/bin/env bash
set -euo pipefail

repo_root=$(cd "$(dirname "$0")/.." && pwd)
script="$repo_root/scripts/migration-preflight.py"
tmp=$(mktemp -d)
trap 'rm -rf "$tmp"' EXIT

# Tạo thư mục migration source với 3 migration.
make_source() {
  local dir="$1"; shift
  rm -rf "$dir"
  mkdir -p "$dir"
  # migration_lock.toml là file, không phải migration — phải bị bỏ qua.
  printf 'provider = "sqlite"\n' > "$dir/migration_lock.toml"
  local name
  for name in "$@"; do
    mkdir -p "$dir/$name"
    printf -- '-- %s\n' "$name" > "$dir/$name/migration.sql"
  done
}

# Tạo DB với bảng _prisma_migrations; mỗi arg dạng name[:state]
# state: applied (mặc định) | rolledback | unfinished
make_db() {
  local db="$1"; shift
  rm -f "$db"
  python3 - "$db" "$@" <<'PY'
import sqlite3, sys
db = sys.argv[1]
rows = sys.argv[2:]
conn = sqlite3.connect(db)
conn.execute(
    "CREATE TABLE _prisma_migrations ("
    "id TEXT PRIMARY KEY, checksum TEXT, finished_at DATETIME, "
    "migration_name TEXT NOT NULL, logs TEXT, rolled_back_at DATETIME, "
    "started_at DATETIME NOT NULL DEFAULT current_timestamp, "
    "applied_steps_count INTEGER NOT NULL DEFAULT 0)"
)
for i, spec in enumerate(rows):
    name, _, state = spec.partition(":")
    finished = "2026-07-20 00:00:00"
    rolled = None
    if state == "rolledback":
        rolled = "2026-07-20 00:01:00"
    elif state == "unfinished":
        finished = None
    conn.execute(
        "INSERT INTO _prisma_migrations "
        "(id, checksum, finished_at, migration_name, rolled_back_at, applied_steps_count) "
        "VALUES (?,?,?,?,?,1)",
        (str(i), "sum", finished, name, rolled),
    )
conn.commit()
conn.close()
PY
}

run() {
  set +e
  out=$(python3 "$script" "$1" "$2" 2>"$tmp/err")
  code=$?
  set -e
}

src="$tmp/migrations"
db="$tmp/prod.db"

# Case 1: đồng bộ → exit 0
make_source "$src" m1 m2 m3
make_db "$db" m1 m2 m3
run "$src" "$db"
[[ $code -eq 0 ]] || { echo "FAIL case1: expected 0 got $code"; exit 1; }

# Case 2: thiếu 1 migration → exit 10, in tên pending
make_source "$src" m1 m2 m3
make_db "$db" m1 m2
run "$src" "$db"
[[ $code -eq 10 ]] || { echo "FAIL case2: expected 10 got $code"; exit 1; }
grep -Fqx 'm3' <<< "$out" || { echo "FAIL case2: pending m3 not printed"; exit 1; }

# Case 3: migration rolled back → fail closed (exit 3)
make_source "$src" m1 m2 m3
make_db "$db" m1 m2 "m3:rolledback"
run "$src" "$db"
[[ $code -eq 3 ]] || { echo "FAIL case3: expected 3 got $code"; exit 1; }

# Case 3b: migration unfinished → fail closed (exit 3)
make_db "$db" m1 m2 "m3:unfinished"
run "$src" "$db"
[[ $code -eq 3 ]] || { echo "FAIL case3b: expected 3 got $code"; exit 1; }

# Case 4: DB có migration lạ không còn trong source → exit 4
make_source "$src" m1 m2
make_db "$db" m1 m2 m3
run "$src" "$db"
[[ $code -eq 4 ]] || { echo "FAIL case4: expected 4 got $code"; exit 1; }

# Case 5: source rỗng → exit 5
make_source "$src"
make_db "$db" m1
run "$src" "$db"
[[ $code -eq 5 ]] || { echo "FAIL case5: expected 5 got $code"; exit 1; }

# Case 6: source có thư mục thiếu migration.sql → exit 5
make_source "$src" m1
mkdir -p "$src/broken"
make_db "$db" m1
run "$src" "$db"
[[ $code -eq 5 ]] || { echo "FAIL case6: expected 5 got $code"; exit 1; }

# Case 7: DB không tồn tại → exit 2
make_source "$src" m1
run "$src" "$tmp/does-not-exist.db"
[[ $code -eq 2 ]] || { echo "FAIL case7: expected 2 got $code"; exit 1; }

# Case 8: DB thiếu bảng _prisma_migrations → exit 2
make_source "$src" m1
rm -f "$db"; python3 -c "import sqlite3;sqlite3.connect('$db').close()"
run "$src" "$db"
[[ $code -eq 2 ]] || { echo "FAIL case8: expected 2 got $code"; exit 1; }

echo "OK migration-preflight"

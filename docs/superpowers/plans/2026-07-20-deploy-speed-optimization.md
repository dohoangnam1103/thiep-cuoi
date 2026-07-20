# Deploy Speed Optimization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Bỏ bước build migration image dư thừa và cleanup Docker đồng bộ khỏi đường deploy thường, giảm deploy từ ~192s xuống ~100–120s, giữ nguyên mọi safety gate.

**Architecture:** Thêm một utility Python read-only (`scripts/migration-preflight.py`) so migration source với `_prisma_migrations` trong `data/prod.db`, trả exit code phân biệt (0 = đồng bộ, 10 = có pending, khác = lỗi/fail-closed). `scripts/deploy-minipc.sh` chạy preflight qua SSH sau backup, chỉ build + chạy migration image khi có pending, và không còn gọi `docker-storage-maintenance.sh` đồng bộ (cron vẫn được cài idempotently).

**Tech Stack:** Bash, Python 3 (module `sqlite3` chuẩn), Docker buildx, Prisma 7 / SQLite, SSH tới Mini PC production.

## Global Constraints

- Phạm vi **an toàn tối đa (A)**: KHÔNG sửa `Dockerfile`, runtime image, cơ chế build native amd64, `.env`, schema DB, app hoặc payment flow.
- Preflight **fail closed**: nếu không chứng minh chắc chắn migration không cần chạy thì phải dừng deploy, không tự ý skip.
- Migration (khi có pending) vẫn chạy **trước** khi promote container web mới, dùng đúng source release hiện tại.
- Giữ nguyên backup DB/uploads, rollback trap, healthcheck, kiểm tra deployment ID + canonical + SQLite `quick_check`, public URL verify.
- Cron maintenance `17 4 * * 0` vẫn được cài idempotently mỗi deploy; chỉ bỏ lần chạy `docker-storage-maintenance.sh` đồng bộ.
- Working tree production hiện có nhiều thay đổi không liên quan — **không** stage/commit chúng; chỉ add đúng file thuộc task.
- Preflight và test chỉ dùng `python3` + module `sqlite3` chuẩn (không thêm dependency).
- Script preflight nằm ở `scripts/` nên được rsync xuống `releases/current/scripts/` (không nằm trong rsync excludes).

---

### Task 1: Migration preflight utility

**Files:**
- Create: `scripts/migration-preflight.py`
- Test: `tests/migration-preflight.test.sh`

**Interfaces:**
- Consumes: (none — utility độc lập)
- Produces: CLI `python3 scripts/migration-preflight.py <migrations_dir> <db_path>` với hợp đồng exit code:
  - `0` — mọi migration source đã áp dụng, không có pending.
  - `10` — có ≥1 migration source chưa áp dụng (in tên pending ra stdout, mỗi dòng một tên).
  - `2` — không mở được DB / thiếu bảng `_prisma_migrations` / lỗi query.
  - `3` — DB có migration `finished_at IS NULL` hoặc `rolled_back_at IS NOT NULL` (failed/incomplete).
  - `4` — DB có migration đã áp dụng nhưng không tồn tại trong source (drift).
  - `5` — thư mục migration source rỗng, không tồn tại, hoặc có entry không phải thư mục chứa file `migration.sql` hợp lệ.
  Mọi lỗi (2–5) in thông điệp ra stderr. Deploy script chỉ phân nhánh `0` / `10` / khác.

- [ ] **Step 1: Viết test thất bại**

Tạo `tests/migration-preflight.test.sh`:

```bash
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
```

- [ ] **Step 2: Chạy test để xác nhận thất bại**

Run: `bash tests/migration-preflight.test.sh`
Expected: FAIL — script chưa tồn tại, python3 báo `can't open file '.../scripts/migration-preflight.py'` và test thoát non-zero.

- [ ] **Step 3: Viết implementation tối thiểu**

Tạo `scripts/migration-preflight.py`:

```python
#!/usr/bin/env python3
"""Read-only migration preflight.

So sánh migration source với bảng _prisma_migrations trong DB production và
trả exit code cho deploy script quyết định có cần chạy migration hay không.

Usage:
    migration-preflight.py <migrations_dir> <db_path>

Exit codes:
    0  - đồng bộ, không có migration pending
    10 - có migration source chưa áp dụng (in tên pending ra stdout)
    2  - không mở được DB / thiếu bảng / lỗi query
    3  - DB có migration failed/incomplete (finished_at NULL hoặc rolled_back_at set)
    4  - DB có migration đã áp dụng nhưng không còn trong source (drift)
    5  - thư mục migration source rỗng hoặc không tồn tại
"""

import os
import sqlite3
import sys

EXIT_OK = 0
EXIT_PENDING = 10
EXIT_DB_ERROR = 2
EXIT_FAILED_MIGRATION = 3
EXIT_DRIFT = 4
EXIT_EMPTY_SOURCE = 5


def source_migrations(migrations_dir: str) -> list[str]:
    if not os.path.isdir(migrations_dir):
        return []
    names = []
    with os.scandir(migrations_dir) as it:
        for entry in it:
            if entry.is_dir():
                names.append(entry.name)
    return sorted(names)


def main(argv: list[str]) -> int:
    if len(argv) != 3:
        print("usage: migration-preflight.py <migrations_dir> <db_path>", file=sys.stderr)
        return EXIT_DB_ERROR

    migrations_dir, db_path = argv[1], argv[2]

    source = source_migrations(migrations_dir)
    if not source:
        print(f"source migrations rỗng hoặc không tồn tại: {migrations_dir}", file=sys.stderr)
        return EXIT_EMPTY_SOURCE

    if not os.path.isfile(db_path):
        print(f"DB không tồn tại: {db_path}", file=sys.stderr)
        return EXIT_DB_ERROR

    try:
        conn = sqlite3.connect(f"file:{db_path}?mode=ro", uri=True)
    except sqlite3.Error as exc:
        print(f"không mở được DB: {exc}", file=sys.stderr)
        return EXIT_DB_ERROR

    try:
        rows = conn.execute(
            "SELECT migration_name, finished_at, rolled_back_at FROM _prisma_migrations"
        ).fetchall()
    except sqlite3.Error as exc:
        print(f"không đọc được _prisma_migrations: {exc}", file=sys.stderr)
        return EXIT_DB_ERROR
    finally:
        conn.close()

    applied = set()
    for name, finished_at, rolled_back_at in rows:
        if rolled_back_at is not None or finished_at is None:
            print(f"migration failed/incomplete trong DB: {name}", file=sys.stderr)
            return EXIT_FAILED_MIGRATION
        applied.add(name)

    source_set = set(source)
    drift = applied - source_set
    if drift:
        print(f"DB có migration không còn trong source: {sorted(drift)}", file=sys.stderr)
        return EXIT_DRIFT

    pending = [name for name in source if name not in applied]
    if pending:
        for name in pending:
            print(name)
        return EXIT_PENDING

    return EXIT_OK


if __name__ == "__main__":
    sys.exit(main(sys.argv))
```

- [ ] **Step 4: Chạy test để xác nhận pass**

Run: `chmod +x scripts/migration-preflight.py && bash tests/migration-preflight.test.sh`
Expected: PASS — in `OK migration-preflight`, exit 0.

- [ ] **Step 5: Commit**

```bash
git add scripts/migration-preflight.py tests/migration-preflight.test.sh
git commit -m "feat(deploy): thêm migration preflight read-only fail-closed"
```

---

### Task 2: Tích hợp preflight vào deploy script + bỏ cleanup đồng bộ

**Files:**
- Modify: `scripts/deploy-minipc.sh` (thêm preflight sau backup; nhánh migration theo `NEEDS_MIGRATION`; bỏ lần chạy `docker-storage-maintenance.sh` đồng bộ, giữ cron)
- Test: `tests/deploy-minipc-preflight.test.sh`

**Interfaces:**
- Consumes: CLI `scripts/migration-preflight.py` từ Task 1 (exit 0/10/khác).
- Produces: biến shell `NEEDS_MIGRATION` (0/1) điều khiển việc build migration image trong khối `REMOTE_BUILD`.

- [ ] **Step 1: Viết test thất bại (static assertions trên deploy script)**

Tạo `tests/deploy-minipc-preflight.test.sh`:

```bash
#!/usr/bin/env bash
set -euo pipefail

repo_root=$(cd "$(dirname "$0")/.." && pwd)
deploy="$repo_root/scripts/deploy-minipc.sh"

# 1. Deploy script gọi preflight utility.
grep -Fq 'scripts/migration-preflight.py' "$deploy" \
  || { echo "FAIL: deploy không gọi migration-preflight.py"; exit 1; }

# 2. Có biến NEEDS_MIGRATION điều khiển nhánh migration.
grep -Fq 'NEEDS_MIGRATION' "$deploy" \
  || { echo "FAIL: thiếu NEEDS_MIGRATION"; exit 1; }

# 3. Preflight exit 10 được nhận diện là có pending.
grep -Eq 'preflight_status[[:space:]]*-eq[[:space:]]*10' "$deploy" \
  || { echo "FAIL: không xử lý exit 10 của preflight"; exit 1; }

# 4. KHÔNG còn chạy docker-storage-maintenance.sh đồng bộ (dòng execute trần).
if grep -Eq '^[[:space:]]*"\$app_dir/releases/current/scripts/docker-storage-maintenance\.sh"[[:space:]]*$' "$deploy"; then
  echo "FAIL: vẫn chạy docker-storage-maintenance.sh đồng bộ"; exit 1
fi

# 5. Cron maintenance vẫn được cài (marker + lịch).
grep -Fq '# thiepmungonline Docker storage maintenance' "$deploy" \
  || { echo "FAIL: mất cron marker"; exit 1; }
grep -Eq '^[[:space:]]*cron_job=.*17 4 \* \* 0' "$deploy" \
  || { echo "FAIL: mất lịch cron 17 4 * * 0"; exit 1; }

# 6. bash -n cú pháp hợp lệ.
bash -n "$deploy" || { echo "FAIL: bash -n lỗi cú pháp"; exit 1; }

echo "OK deploy-minipc-preflight"
```

- [ ] **Step 2: Chạy test để xác nhận thất bại**

Run: `bash tests/deploy-minipc-preflight.test.sh`
Expected: FAIL — `deploy không gọi migration-preflight.py` (chưa tích hợp), exit non-zero.

- [ ] **Step 3: Thêm bước preflight vào deploy script**

Trong `scripts/deploy-minipc.sh`, ngay **sau** khối backup (sau dòng `log_step "backup dữ liệu"`, hiện là dòng 114) và **trước** khối `echo "🏗️  Build native ..."`, chèn:

```bash
echo "🔎 Migration preflight (read-only)"
set +e
ssh "${REMOTE_HOST}" bash -s -- "${REMOTE_APP_DIR}" <<'REMOTE_PREFLIGHT'
set -euo pipefail
app_dir="$1"
cd "$app_dir"
python3 releases/current/scripts/migration-preflight.py \
  releases/current/prisma/migrations \
  data/prod.db
REMOTE_PREFLIGHT
preflight_status=$?
set -e

if [[ $preflight_status -eq 0 ]]; then
  NEEDS_MIGRATION=0
  echo "   Không có migration pending → bỏ qua migration image."
elif [[ $preflight_status -eq 10 ]]; then
  NEEDS_MIGRATION=1
  echo "   Có migration pending → sẽ build migration image và migrate."
else
  echo "❌ Migration preflight fail-closed (exit ${preflight_status}). Dừng deploy, giữ container cũ."
  exit 1
fi
log_step "migration preflight"
```

- [ ] **Step 4: Chuyển nhánh build migration image theo NEEDS_MIGRATION**

Trong khối `echo "🏗️  Build native ..."`, cập nhật lời gọi SSH để truyền thêm `NEEDS_MIGRATION`. Đổi dòng:

```bash
ssh "${REMOTE_HOST}" bash -s -- \
  "${REMOTE_APP_DIR}" "${VERSION_IMAGE}" "${MIGRATE_IMAGE}" "${WEB_PLATFORM}" "${DEPLOYMENT_ID}" "${PUBLIC_URL}" <<'REMOTE_BUILD'
```

thành:

```bash
ssh "${REMOTE_HOST}" bash -s -- \
  "${REMOTE_APP_DIR}" "${VERSION_IMAGE}" "${MIGRATE_IMAGE}" "${WEB_PLATFORM}" "${DEPLOYMENT_ID}" "${PUBLIC_URL}" "${NEEDS_MIGRATION}" <<'REMOTE_BUILD'
```

Trong thân `REMOTE_BUILD`, thêm biến `needs_migration` và bọc phần build + chạy migration image bằng điều kiện. Đổi phần đầu:

```bash
set -euo pipefail
app_dir="$1"
version_image="$2"
migrate_image="$3"
platform="$4"
deployment_id="$5"
public_url="$6"
cd "$app_dir"
```

thành:

```bash
set -euo pipefail
app_dir="$1"
version_image="$2"
migrate_image="$3"
platform="$4"
deployment_id="$5"
public_url="$6"
needs_migration="$7"
cd "$app_dir"
```

Sau lệnh `docker image inspect "$version_image" ...`, bọc toàn bộ khối build migration image + `docker run ... prisma migrate deploy` + `docker image rm "$migrate_image"` trong `if [ "$needs_migration" = 1 ]; then ... else ... fi`. Kết quả khối sau `docker image inspect` là:

```bash
if [ "$needs_migration" = 1 ]; then
  # Tag the already cached builder stage as a short-lived migration image. Migrations
  # run before the web container changes, against the same source revision as the
  # image that is about to be promoted.
  docker buildx build \
    --builder default \
    --platform "$platform" \
    --provenance=false \
    --target builder \
    --build-arg "NEXT_DEPLOYMENT_ID=$deployment_id" \
    --build-arg "NEXT_PUBLIC_SITE_URL=$public_url" \
    --load \
    -t "$migrate_image" \
    -f releases/current/Dockerfile \
    releases/current

  docker run --rm \
    --user "$(id -u):$(id -g)" \
    -v "$app_dir/data:/app/data" \
    -e DATABASE_URL=file:/app/data/prod.db \
    "$migrate_image" \
    npx prisma migrate deploy

  docker image rm "$migrate_image" >/dev/null 2>&1 || true
else
  echo "migration_skipped=1"
fi
```

- [ ] **Step 5: Bỏ lần chạy cleanup đồng bộ, giữ cron**

Trong khối `REMOTE_CLEANUP` (cuối script), xóa đúng dòng thực thi trần:

```bash
"$app_dir/releases/current/scripts/docker-storage-maintenance.sh"
```

Giữ nguyên phần còn lại của khối (marker + `cron_job=...` + cài crontab). Sau khi xóa, thân `REMOTE_CLEANUP` bắt đầu bằng:

```bash
set -euo pipefail
app_dir="$1"

marker='# thiepmungonline Docker storage maintenance'
cron_job="17 4 * * 0 $app_dir/releases/current/scripts/docker-storage-maintenance.sh >> $app_dir/docker-storage-maintenance.log 2>&1 $marker"
(
  crontab -l 2>/dev/null | grep -Fv "$marker" || true
  printf '%s\n' "$cron_job"
) | crontab -
```

Cập nhật dòng `echo` mô tả bước cleanup cho đúng ý nghĩa mới:

```bash
echo "🧹 Đảm bảo cron dọn Docker storage đã được cài (không prune đồng bộ)"
```

- [ ] **Step 6: Chạy cả hai test để xác nhận pass**

Run: `bash tests/deploy-minipc-preflight.test.sh && bash tests/docker-storage-maintenance.test.sh`
Expected: PASS — `OK deploy-minipc-preflight` và test maintenance cũ vẫn xanh (chuỗi `scripts/docker-storage-maintenance.sh` còn trong dòng cron nên assertion cũ vẫn đúng).

- [ ] **Step 7: Commit**

```bash
git add scripts/deploy-minipc.sh tests/deploy-minipc-preflight.test.sh
git commit -m "perf(deploy): skip migration image khi không pending, bỏ cleanup đồng bộ"
```

---

### Task 3: Kiểm chứng deploy thực tế và đo thời gian

**Files:**
- (không sửa file — chỉ chạy deploy và ghi số đo)

**Interfaces:**
- Consumes: `scripts/deploy-minipc.sh` đã sửa (Task 2).
- Produces: xác nhận acceptance criteria + số đo thời gian mới so với baseline 192s.

- [ ] **Step 1: Dry inspection preflight trên DB production (read-only, không đổi state)**

Run:
```bash
ssh minipc 'cd /home/namdo/apps/thiepmungonline && python3 releases/current/scripts/migration-preflight.py releases/current/prisma/migrations data/prod.db; echo "exit=$?"'
```
Expected: không in tên pending nào và `exit=0` (13 migration đã áp dụng). Nếu có `20260720180000_add_payos_provider` chưa apply thì in tên đó và `exit=10` — đúng hợp đồng, deploy sẽ chạy migration.

> Lưu ý: bước này chỉ chạy được sau khi source mới đã rsync xuống remote. Nếu chưa, chạy nó ở lần deploy thực tế (Step 2) thay vì tách riêng.

- [ ] **Step 2: Chạy deploy production và ghi log thời gian**

Run: `bash scripts/deploy-minipc.sh`
Expected: kết thúc `✅ Deploy <id> hoàn tất trong <N>s.` với `N` giảm rõ so với 192s (kỳ vọng ~100–120s khi không có migration). Ghi lại `log_step` từng pha, đặc biệt vắng mặt pha build migration image thứ hai.

- [ ] **Step 3: Xác minh acceptance criteria sau deploy**

Run:
```bash
curl -s -o /dev/null -w '%{http_code}\n' https://thiepmungonline.com/
curl -s -o /dev/null -w '%{http_code}\n' https://thiepmungonline.com/mau-thiep/long-phung-v3-do/demo
curl -s -o /dev/null -w '%{http_code}\n' https://thiepmungonline.com/api/payment/CDPFI572/status
curl -s -o /dev/null -w '%{http_code} %{content_type}\n' https://thiepmungonline.com/api/payment/CDPFI572/qr
curl -s -o /dev/null -w '%{http_code}\n' https://thiepmungonline.com/api/payment/DOES-NOT-EXIST/status
ssh minipc "docker inspect thiepmungonline-web --format '{{.State.Health.Status}}'"
ssh minipc "cd /home/namdo/apps/thiepmungonline && python3 -c \"import sqlite3;print(sqlite3.connect('file:data/prod.db?mode=ro',uri=True).execute('pragma quick_check').fetchone()[0])\""
```
Expected: homepage, demo, status và QR lần lượt trả `200`; QR có content type `image/svg+xml`; payment code không tồn tại trả `404`; container `healthy`; quick_check `ok`. Nếu bất kỳ mục nào fail, điều tra ngay; lưu ý rollback trap chỉ bao phủ khối remote restart, không tự rollback lỗi public verification xảy ra sau đó.

---

## Self-Review

**Spec coverage:**
- Mục tiêu 1 (không build migration image khi không pending) → Task 1 + Task 2 Step 4.
- Mục tiêu 2 (migration trước promote khi có pending) → Task 2 Step 4 giữ nhánh migrate trong `REMOTE_BUILD` (chạy trước khối promote/restart).
- Mục tiêu 3 (bỏ cleanup đồng bộ, giữ cron) → Task 2 Step 5.
- Mục tiêu 4 (giữ backup/rollback/healthcheck/public verify) → không đụng các khối đó; Task 3 xác minh.
- Migration preflight fail-closed (spec §Thiết kế) → Task 1 exit code 2–5 + Task 2 nhánh `else exit 1`.
- Kiểm thử §Kiểm thử: shell syntax (Task 2 Step 1 `bash -n`), preflight in-sync (Task 1 case1 + Task 3 Step 1), preflight thiếu migration (case2), failed/rollback + migration lạ (case3/3b/4), không cleanup đồng bộ trong critical path (Task 2 test #4), deploy thực tế + so baseline (Task 3).

**Placeholder scan:** không có TBD/TODO; mọi step có code hoặc lệnh cụ thể + expected output.

**Type consistency:** exit code 0/10/2/3/4/5 nhất quán giữa Task 1 (interface + python) và Task 2 (test #3 kiểm `-eq 10`, nhánh `-eq 0`/`else`). Biến `NEEDS_MIGRATION` (deploy scope) → truyền thành arg `$7` → `needs_migration` (remote scope) nhất quán trong Task 2 Step 3/4.

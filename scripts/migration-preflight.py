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


class BrokenSource(Exception):
    """Một thư mục migration source thiếu file migration.sql hợp lệ."""


def source_migrations(migrations_dir: str) -> list[str]:
    if not os.path.isdir(migrations_dir):
        return []
    names = []
    with os.scandir(migrations_dir) as it:
        for entry in it:
            if not entry.is_dir():
                continue
            migration_sql = os.path.join(entry.path, "migration.sql")
            if not os.path.isfile(migration_sql):
                raise BrokenSource(entry.name)
            names.append(entry.name)
    return sorted(names)


def main(argv: list[str]) -> int:
    if len(argv) != 3:
        print("usage: migration-preflight.py <migrations_dir> <db_path>", file=sys.stderr)
        return EXIT_DB_ERROR

    migrations_dir, db_path = argv[1], argv[2]

    try:
        source = source_migrations(migrations_dir)
    except BrokenSource as exc:
        print(f"thư mục migration thiếu migration.sql: {exc}", file=sys.stderr)
        return EXIT_EMPTY_SOURCE
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

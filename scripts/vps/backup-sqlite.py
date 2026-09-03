#!/usr/bin/env python3
"""Consistent SQLite online backup to an explicitly new destination."""
import os
import pathlib
import sqlite3
import sys

source, target = map(pathlib.Path, sys.argv[1:3])
assert source.is_file(), source
assert not target.exists(), target
os.umask(0o077)
src = sqlite3.connect(f"file:{source}?mode=ro", uri=True, timeout=30)
dst = sqlite3.connect(target)
src.backup(dst, pages=256, sleep=0.1)
assert dst.execute("PRAGMA quick_check").fetchone()[0] == "ok"
dst.close()
src.close()
print("SQLite backup verified:", target)

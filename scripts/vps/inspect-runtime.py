#!/usr/bin/env python3
"""Read-only migration inventory; never prints credentials or user records."""
import json
import pathlib
import sqlite3
import subprocess
import sys

root = pathlib.Path(sys.argv[1])
db = sqlite3.connect(f"file:{root / 'data/prod.db'}?mode=ro", uri=True)
assert db.execute("PRAGMA quick_check").fetchone()[0] == "ok"
tables = sorted(row[0] for row in db.execute("SELECT name FROM sqlite_master WHERE type='table'"))
counts = {name: db.execute('SELECT count(*) FROM "' + name.replace('"', '""') + '"').fetchone()[0] for name in tables}
print(json.dumps({"quick_check": "ok", "tables": counts}, sort_keys=True))
db.close()
if len(sys.argv) > 2:
    info = json.loads(subprocess.check_output(["docker", "inspect", sys.argv[2]]))[0]
    print(json.dumps({"image": info["Image"], "user": info["Config"]["User"], "mounts": info["Mounts"]}))

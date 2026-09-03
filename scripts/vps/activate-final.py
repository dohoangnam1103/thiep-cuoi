#!/usr/bin/env python3
"""Verify the final source checkpoint before allowing any VPS production writes."""
import hashlib
import json
import os
import pathlib
import shutil
import sqlite3
import subprocess

root = pathlib.Path("/srv/thiepmungonline")
ops = root / "ops"
assert not (root / "LIVE").exists()
for name in ["thiepmungonline-web", "thiepmungonline-tunnel"]:
    info = json.loads(subprocess.check_output(["docker", "inspect", name]))[0]
    assert not info["State"]["Running"], name
dbpath = ops / "final.db"
db = sqlite3.connect(f"file:{dbpath}?mode=ro", uri=True)
assert db.execute("PRAGMA quick_check").fetchone()[0] == "ok"
expected = json.loads((ops / "final-inventory.json").read_text())["tables"]
actual = {name: db.execute('SELECT count(*) FROM "' + name.replace('"', '""') + '"').fetchone()[0] for name in expected}
assert actual == expected
db.close()
assert not (root / "data/prod.db-wal").exists()
assert not (root / "data/prod.db-journal").exists()
shutil.copy2(root / "data/prod.db", ops / "pre-final.db")
shutil.copy2(dbpath, root / "data/prod.db.incoming")
os.chown(root / "data/prod.db.incoming", 1000, 1000)
os.chmod(root / "data/prod.db.incoming", 0o600)
os.replace(root / "data/prod.db.incoming", root / "data/prod.db")
assert hashlib.sha256(dbpath.read_bytes()).digest() == hashlib.sha256((root / "data/prod.db").read_bytes()).digest()
for p in (root / "data").rglob("*"):
    os.chown(p, 1000, 1000)
os.chown(root / "data", 1000, 1000)
print("FINAL_DB_VERIFIED", json.dumps(actual, sort_keys=True))

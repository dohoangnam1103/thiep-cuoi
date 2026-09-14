#!/usr/bin/env python3
"""Verified SQLite + media backup for site-2 (Signature MVP).

Reads APP_DIR (default /srv/chungdoi-site2), online-backs-up data/prod.db,
runs quick_check, writes a sha256 media manifest, and rotates old snapshots.
Never touches /srv/thiepmungonline. Stdlib only.
"""
import hashlib
import json
import os
import sqlite3
import sys
from datetime import datetime, timezone
from pathlib import Path

APP_DIR = Path(os.environ.get("APP_DIR", "/srv/chungdoi-site2"))
MASTER_DIR = Path("/srv/thiepmungonline")
RETENTION = int(os.environ.get("BACKUP_RETENTION", "14"))


def fail(message: str) -> None:
    print(f"backup-site2: {message}", file=sys.stderr)
    raise SystemExit(1)


def main() -> None:
    if APP_DIR.resolve() == MASTER_DIR.resolve() or MASTER_DIR in APP_DIR.resolve().parents:
        fail("refusing to back up inside the master directory")
    db_path = APP_DIR / "data" / "prod.db"
    media_root = APP_DIR / "data" / "media"
    if not db_path.is_file():
        fail(f"database not found: {db_path}")
    stamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
    snapshot = APP_DIR / "backups" / stamp
    snapshot.mkdir(parents=True, exist_ok=False)
    backup_db = snapshot / "prod.db"

    src = sqlite3.connect(f"file:{db_path}?mode=ro", uri=True)
    try:
        dst = sqlite3.connect(str(backup_db))
        try:
            src.backup(dst)
        finally:
            dst.close()
    finally:
        src.close()

    check = sqlite3.connect(f"file:{backup_db}?mode=ro", uri=True)
    try:
        integrity = check.execute("pragma quick_check(1)").fetchone()[0]
    finally:
        check.close()
    if integrity != "ok":
        fail(f"quick_check failed on {backup_db}: {integrity}")

    manifest = []
    if media_root.is_dir():
        for path in sorted(media_root.rglob("*")):
            if not path.is_file():
                continue
            digest = hashlib.sha256()
            with open(path, "rb") as handle:
                for chunk in iter(lambda: handle.read(1024 * 1024), b""):
                    digest.update(chunk)
            manifest.append(
                {
                    "path": str(path.relative_to(media_root)),
                    "bytes": path.stat().st_size,
                    "sha256": digest.hexdigest(),
                }
            )
    (snapshot / "media-manifest.json").write_text(
        json.dumps({"snapshot": stamp, "files": manifest}, indent=2) + "\n"
    )

    db = sqlite3.connect(f"file:{db_path}?mode=ro", uri=True)
    try:
        tables = {row[0] for row in db.execute("SELECT name FROM sqlite_schema WHERE type='table'")}
    finally:
        db.close()
    (snapshot / "manifest.json").write_text(
        json.dumps(
            {
                "snapshot": stamp,
                "app": "site-2",
                "database": str(backup_db.name),
                "integrity": integrity,
                "tables": sorted(tables),
                "mediaFiles": len(manifest),
            },
            indent=2,
        )
        + "\n"
    )

    snapshots = sorted(p for p in (APP_DIR / "backups").iterdir() if p.is_dir())
    for old in snapshots[:-RETENTION]:
        for child in sorted(old.rglob("*"), reverse=True):
            if child.is_file() or child.is_symlink():
                child.unlink()
            elif child.is_dir():
                child.rmdir()
        old.rmdir()
    print(f"backup-site2: snapshot {stamp} verified ({len(manifest)} media files)")


if __name__ == "__main__":
    main()

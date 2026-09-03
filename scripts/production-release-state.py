#!/usr/bin/env python3
"""Checkpoint and atomically exchange a staged Mini PC release (no migrations)."""
import ctypes
import hashlib
import json
import os
from pathlib import Path
import re
import shutil
import sqlite3
import subprocess
import sys

ROOT = Path("/home/namdo/apps/thiepmungonline")
phase, release_id = sys.argv[1:]
if not re.fullmatch(r"(?:cpu-opt|detail-preload)-[0-9]{8}(?:-[0-9]{6})?", release_id):
    raise SystemExit("Unexpected release id")
stage = ROOT / "releases" / release_id
current = ROOT / "releases/current"
ops = ROOT / "deployments" / release_id
checkpoint = ops / "checkpoint.json"


def fingerprints():
    values = {
        name: hashlib.sha256((ROOT / name).read_bytes()).hexdigest()
        for name in [".env", "docker-compose.yml"]
    }
    cron = subprocess.run(["crontab", "-l"], capture_output=True, check=False)
    if cron.returncode not in (0, 1):
        raise RuntimeError("Cannot read crontab")
    values["crontab"] = hashlib.sha256(cron.stdout).hexdigest()
    return values


def inspect_container():
    return json.loads(subprocess.check_output([
        "docker", "inspect", "thiepmungonline-web",
        "--format", '{"Image":{{json .Image}},"Id":{{json .Id}}}',
    ]))


def check_db(path):
    db = sqlite3.connect(f"file:{path}?mode=ro", uri=True, timeout=15)
    try:
        if db.execute("PRAGMA quick_check").fetchone()[0] != "ok":
            raise RuntimeError("Database quick_check failed")
    finally:
        db.close()


if phase == "prepare":
    ops.mkdir(mode=0o700, parents=True, exist_ok=False)
    container = inspect_container()
    source = sqlite3.connect(f"file:{ROOT / 'data/prod.db'}?mode=ro", uri=True, timeout=15)
    backup = sqlite3.connect(ops / "predeploy.db")
    try:
        source.backup(backup)
    finally:
        source.close()
        backup.close()
    os.chmod(ops / "predeploy.db", 0o600)
    check_db(ops / "predeploy.db")
    # Candidate may write visit counters, but only in this second, disposable copy.
    shutil.copy2(ops / "predeploy.db", ops / "candidate.db")
    for name in ["editor-uploads", "guest-media"]:
        directory = ROOT / "data" / name
        if directory.is_dir():
            # These uploads are immutable UUID-named objects, as in deploy-fast.
            shutil.copytree(directory, ops / name, copy_function=os.link, symlinks=True)
    checkpoint.write_text(json.dumps({
        "release": release_id,
        "oldImage": container["Image"],
        "oldContainer": container["Id"],
        "fingerprints": fingerprints(),
    }, indent=2) + "\n")
    os.chmod(checkpoint, 0o600)
    print("checkpoint=ready database_backup=ok upload_snapshots=ready")
elif phase in ["unchanged", "prepromote"]:
    state = json.loads(checkpoint.read_text())
    if state["fingerprints"] != fingerprints():
        raise SystemExit("Environment, compose or crontab changed; stop for inspection")
    if phase == "prepromote" and inspect_container()["Id"] != state["oldContainer"]:
        raise SystemExit("Production container changed since checkpoint")
    check_db(ROOT / "data/prod.db")
    print("environment=unchanged compose=unchanged crontab=unchanged database=ok")
elif phase == "old-image":
    print(json.loads(checkpoint.read_text())["oldImage"])
elif phase == "candidate-ok":
    (ops / "candidate-ok").write_text(release_id + "\n")
    print("candidate=verified")
elif phase == "exchange":
    if not checkpoint.is_file() or not stage.is_dir() or not current.is_dir():
        raise SystemExit("Missing checkpoint/source directories")
    if stage.is_symlink() or current.is_symlink():
        raise SystemExit("Expected physical release directories")
    # Linux RENAME_EXCHANGE swaps two existing directories atomically. Existing
    # bind mounts retain the old directory until the web container is recreated.
    libc = ctypes.CDLL("libc.so.6", use_errno=True)
    rename = libc.renameat2
    rename.argtypes = [ctypes.c_int, ctypes.c_char_p, ctypes.c_int, ctypes.c_char_p, ctypes.c_uint]
    rename.restype = ctypes.c_int
    if rename(-100, os.fsencode(stage), -100, os.fsencode(current), 2) != 0:
        errno = ctypes.get_errno()
        raise OSError(errno, os.strerror(errno))
    print("source_directories=atomically_exchanged")
else:
    raise SystemExit("Unknown checkpoint phase")

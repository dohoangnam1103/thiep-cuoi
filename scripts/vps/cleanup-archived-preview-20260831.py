#!/usr/bin/env python3
"""Dated, approved cleanup. Requires the exact verified off-host archive hash.

Archive/download/hash comparison must happen before invoking this program.
Never removes production state, Docker images/volumes, or historical backups.
"""
import hashlib
import json
import pathlib
import shutil
import subprocess
import sys

archive = pathlib.Path("/srv/thiepmungonline/ops/cleanup-20260831.tar.gz")
targets = [
    pathlib.Path("/srv/thiepmungonline-preview"),
    pathlib.Path("/srv/thiepmungonline/releases/current/.worktrees"),
    pathlib.Path("/srv/thiepmungonline/candidate-data"),
]
units = [
    "thiepmungonline-preview.service",
    "thiepmungonline-preview-gateway.service",
    "thiepmungonline-preview-tunnel.service",
]
assert len(sys.argv) == 3 and sys.argv[1] == "--verified-offhost-sha256"
expected = sys.argv[2]
assert len(expected) == 64 and all(c in "0123456789abcdef" for c in expected)
assert "163.223.9.198" in subprocess.check_output(["hostname", "-I"], text=True).split()
digest = hashlib.sha256()
with archive.open("rb") as handle:
    for chunk in iter(lambda: handle.read(1024 * 1024), b""):
        digest.update(chunk)
assert digest.hexdigest() == expected, "Archive must match the verified Mac copy"
for unit in units + ["thiepmungpreview.slice"]:
    state = subprocess.check_output(["systemctl", "show", unit, "-p", "ActiveState", "--value"], text=True).strip()
    assert state == "inactive", (unit, state)
for path in targets:
    assert path.is_dir() and not path.is_symlink() and path.resolve() == path
mounts = subprocess.check_output(["findmnt", "-rn", "-o", "TARGET"], text=True).splitlines()
for mount in mounts:
    for path in targets:
        assert mount != str(path) and not mount.startswith(str(path) + "/"), mount
ids = subprocess.check_output(["docker", "ps", "-aq"], text=True).split()
containers = json.loads(subprocess.check_output(["docker", "inspect", *ids]))
for container in containers:
    if container["Name"] == "/thiepmungonline-migration-candidate":
        assert not container["State"]["Running"]
        continue
    for mount in container["Mounts"]:
        source = pathlib.Path(mount["Source"])
        for path in targets:
            assert source != path and path not in source.parents, (container["Name"], source)
# Compare archive to the still-present originals, not just archive transport.
subprocess.run(["nice", "-n", "10", "tar", "-C", "/", "-dzf", str(archive)], check=True)
subprocess.run(["docker", "rm", "thiepmungonline-migration-candidate"], check=True)
subprocess.run(["systemctl", "disable", *units], check=True)
for path in targets:
    shutil.rmtree(path)
    print("Removed archived directory:", path, flush=True)
for unit in units + ["thiepmungpreview.slice"]:
    pathlib.Path("/etc/systemd/system", unit).unlink()
subprocess.run(["systemctl", "daemon-reload"], check=True)
archive.unlink()
print("Removed redundant VPS archive; verified archive remains on Mac.")

#!/usr/bin/env python3
"""One-shot, fail-closed cutover checkpoint on the old production host.

Never rerun after the VPS has accepted writes. Rollback after that requires
copying the latest VPS database/uploads back, not restarting the old database.
"""
import json
import pathlib
import subprocess
import time

root = pathlib.Path("/home/namdo/apps/thiepmungonline")
ops = root / "migration-20260831"
expected_image = "sha256:84ff88f82d347fe2c0c134c85d36d0ec62cafe6f1412c899428862a34f20c1f7"

def run(*args, **kwargs):
    return subprocess.run(args, check=True, text=True, **kwargs)

assert "192.168.0.57" in subprocess.check_output(["hostname", "-I"], text=True).split()
assert not (ops / "frozen.json").exists(), "Already frozen; do not repeat"
assert not (ops / "crontab.before").exists(), "Existing checkpoint needs inspection"
info = json.loads(subprocess.check_output(["docker", "inspect", "thiepmungonline-web"]))[0]
assert info["Image"] == expected_image and info["State"]["Running"]
cron = subprocess.check_output(["crontab", "-l"], text=True)
(ops / "crontab.before").write_text(cron)
filtered = "\n".join(line for line in cron.splitlines() if "/home/namdo/apps/thiepmungonline/" not in line) + "\n"
run("crontab", "-", input=filtered)
# Prevent any old app restart after a host reboot; do not alter other containers.
run("docker", "update", "--restart=no", "thiepmungonline-web", "thiepmungonline-tunnel")
# Let any scheduled request finish before closing the public ingress.
deadline = time.monotonic() + 920
while True:
    commands = subprocess.check_output(["ps", "-eo", "args="], text=True).splitlines()
    active = [cmd for cmd in commands if str(root) in cmd and ("cron-hit-endpoint.sh" in cmd or "docker-storage-maintenance.sh" in cmd)]
    if not active:
        break
    assert time.monotonic() < deadline, "An old cron is still running; inspect before stopping web"
    time.sleep(2)
started = time.time()
print("CUTOVER_START", started, flush=True)
run("docker", "stop", "--time", "10", "thiepmungonline-tunnel")
run("docker", "stop", "--time", "60", "thiepmungonline-web")
run("python3", str(ops / "backup-sqlite.py"), str(root / "data/prod.db"), str(ops / "final.db"))
inventory = subprocess.check_output(["python3", str(ops / "inspect-runtime.py"), str(root)], text=True)
(ops / "final-inventory.json").write_text(inventory)
(ops / "frozen.json").write_text(json.dumps({"started": started, "frozen": time.time(), "image": expected_image}))
print("SOURCE_FROZEN_AND_BACKED_UP", flush=True)

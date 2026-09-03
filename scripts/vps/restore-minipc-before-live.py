#!/usr/bin/env python3
"""Recovery ONLY before VPS has been started with the final live database."""
import pathlib
import subprocess
import sys

assert sys.argv[1:] == ["--vps-has-not-accepted-writes"], "Explicit pre-live recovery assertion required"
root = pathlib.Path("/home/namdo/apps/thiepmungonline")
checkpoint = root / "migration-20260831/crontab.before"
assert checkpoint.is_file()
for args in [
    ["docker", "update", "--restart=unless-stopped", "thiepmungonline-web", "thiepmungonline-tunnel"],
    ["docker", "start", "thiepmungonline-web"],
    ["docker", "start", "thiepmungonline-tunnel"],
    ["crontab", str(checkpoint)],
]:
    subprocess.run(args, check=True)
print("Old production restored; never use this procedure after VPS writes.")

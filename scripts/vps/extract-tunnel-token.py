#!/usr/bin/env python3
"""Extract only the verified production tunnel token to stdout for an SSH pipe."""
import base64
import json
import subprocess
import sys

info = json.loads(subprocess.check_output(["docker", "inspect", "thiepmungonline-tunnel"]))[0]
args = info["Config"]["Cmd"]
token = args[args.index("--token") + 1]
claims = json.loads(base64.b64decode(token))
assert claims["t"] == "82b89851-396e-4501-af77-89e2bcf15a01"
assert claims["a"] == "aac47b13496acc81581f936f0d10ee3d"
sys.stdout.write(token)

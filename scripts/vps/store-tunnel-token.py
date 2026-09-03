#!/usr/bin/env python3
"""Receive a token over stdin, never log it, and write a private Docker env file."""
import base64
import json
import os
import pathlib
import sys

token = sys.stdin.read().strip()
claims = json.loads(base64.b64decode(token))
assert claims["t"] == "82b89851-396e-4501-af77-89e2bcf15a01"
assert claims["a"] == "aac47b13496acc81581f936f0d10ee3d"
target = pathlib.Path("/srv/thiepmungonline/tunnel.env")
assert not target.exists()
os.umask(0o077)
target.write_text("TUNNEL_TOKEN=" + token + "\n")
print("Verified production tunnel credential stored privately.")

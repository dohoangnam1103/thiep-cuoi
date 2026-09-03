#!/usr/bin/env python3
"""Preserve actual container environment byte-for-byte (no dotenv interpolation)."""
import json
import os
import pathlib
import sys

lines = json.load(sys.stdin)
assert isinstance(lines, list) and all(isinstance(x, str) and "=" in x and "\n" not in x for x in lines)
env = dict(x.split("=", 1) for x in lines)
assert env["NEXT_PUBLIC_SITE_URL"] == "https://thiepmungonline.com"
assert env["DATABASE_URL"] == "file:/app/data/prod.db"
for key in ["SESSION_SECRET", "AUTH_SECRET", "GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET", "PAYOS_CLIENT_ID", "PAYOS_API_KEY", "PAYOS_CHECKSUM_KEY", "CRON_SECRET", "RESEND_API_KEY", "EMAIL_LINK_SECRET"]:
    assert env.get(key), f"Missing required production key: {key}"
root = pathlib.Path("/srv/thiepmungonline")
assert not (root / ".env.source-file").exists()
os.umask(0o077)
(root / ".env").rename(root / ".env.source-file")
(root / ".env").write_text("\n".join(lines) + "\n")
print("Actual production runtime environment preserved; all required integrations present.")

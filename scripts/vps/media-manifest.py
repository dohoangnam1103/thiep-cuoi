#!/usr/bin/env python3
"""Content-only inventory for migration integrity checks (no media contents)."""
import hashlib
import json
import pathlib
import sys

root = pathlib.Path(sys.argv[1])
result = {}
names = ["."] if "--all" in sys.argv[2:] else ["editor-uploads", "guest-media", "blog-media"]
for name in names:
    for path in sorted((root / name).rglob("*")):
        if path.is_file():
            digest = hashlib.sha256()
            with path.open("rb") as file:
                for chunk in iter(lambda: file.read(1024 * 1024), b""):
                    digest.update(chunk)
            result[str(path.relative_to(root))] = digest.hexdigest()
serialized = json.dumps(result, sort_keys=True)
if "--digest" in sys.argv[2:]:
    print(json.dumps({"files": len(result), "sha256": hashlib.sha256(serialized.encode()).hexdigest()}))
else:
    print(serialized)

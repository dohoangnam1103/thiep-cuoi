#!/usr/bin/env python3
"""Reuse a VPS runner only when its complete assembly inputs still match.

The caller supplies the immutable base image ID and effective target platform.
This helper never pulls, builds, retags, runs or deletes Docker images. Its
receipts belong to the trusted deployment host, not an artifact signing service.
"""

import contextlib
import fcntl
import hashlib
import json
import math
import os
from pathlib import Path
import re
import stat
import subprocess
import sys
import tempfile
import time


VERSION = 1
MAX_AGE = 7 * 24 * 3600
MAX_RECEIPTS = 4
LABEL = "io.thiepmungonline.assembly-key"
KEY_PATTERN = re.compile(r"[0-9a-f]{64}\Z")
IMAGE_PATTERN = re.compile(r"sha256:[0-9a-f]{64}\Z")
PLATFORM_PATTERN = re.compile(r"[a-z0-9_]+/[a-z0-9_]+(?:/[a-z0-9_]+)?\Z")


def encoded(value):
    return json.dumps(value, sort_keys=True, separators=(",", ":")).encode()


def validate_key(key):
    if not KEY_PATTERN.fullmatch(key):
        raise ValueError("invalid cache key")


def validate_image_id(image_id):
    if not IMAGE_PATTERN.fullmatch(image_id):
        raise ValueError("an immutable image ID is required")


def validate_platform(platform):
    if not PLATFORM_PATTERN.fullmatch(platform):
        raise ValueError("invalid target platform")


def file_record(path, name):
    before = path.lstat()
    if not stat.S_ISREG(before.st_mode):
        raise ValueError("assembly input must be a regular file")
    digest = hashlib.sha256()
    with path.open("rb") as stream:
        opened = os.fstat(stream.fileno())
        for block in iter(lambda: stream.read(1024 * 1024), b""):
            digest.update(block)
        finished = os.fstat(stream.fileno())
    after = path.lstat()
    # Include inode/ctime in the stability check but not the content key: rsync
    # may safely replace an identical file or preserve its modification time.
    def identity(info):
        return (info.st_dev, info.st_ino, info.st_mode, info.st_size,
                info.st_mtime_ns, info.st_ctime_ns)
    if not identity(before) == identity(opened) == identity(finished) == identity(after):
        raise ValueError("assembly input changed while reading")
    return [name, "file", stat.S_IMODE(after.st_mode), after.st_size, digest.hexdigest()]


def artifact_records(root):
    if root.is_symlink() or not root.is_dir():
        raise ValueError("artifact must be a real directory")
    resolved_root = root.resolve(strict=True)
    for name in ("server.js", "package.deps.json"):
        if (root / name).is_symlink() or not (root / name).is_file():
            raise ValueError("required artifact input is missing")
    for name in (".next", "static"):
        if (root / name).is_symlink() or not (root / name).is_dir():
            raise ValueError("required artifact directory is missing")
    records = []
    for parent, directories, files in os.walk(root, followlinks=False):
        for name in sorted(directories + files):
            path = Path(parent) / name
            relative = path.relative_to(root).as_posix()
            info = path.lstat()
            if path.is_symlink():
                target = os.readlink(path)
                resolved = (path.parent / target).resolve()
                runtime_dependency = resolved.is_relative_to(resolved_root / "node_modules")
                if (os.path.isabs(target) or not resolved.is_relative_to(resolved_root)
                        or (not resolved.exists() and not runtime_dependency)):
                    raise ValueError("artifact symlink is broken or external")
                records.append([relative, "link", target])
            elif stat.S_ISDIR(info.st_mode):
                records.append([relative, "directory", stat.S_IMODE(info.st_mode)])
            else:
                records.append(file_record(path, relative))
    return sorted(records)


def source_records(root):
    if not root.is_dir():
        raise ValueError("source root is missing")
    paths = [root / "Dockerfile.prebuilt", root / "pnpm-lock.yaml", root / "pnpm-workspace.yaml"]
    # Dockerfile-specific ignore files take precedence over the root ignore.
    specific = root / "Dockerfile.prebuilt.dockerignore"
    selected_ignore = specific if specific.exists() or specific.is_symlink() else root / ".dockerignore"
    records = []
    if selected_ignore.exists() or selected_ignore.is_symlink():
        paths.append(selected_ignore)
    else:
        records.append([".dockerignore", "absent"])
    paths.extend(sorted(root.glob(".npmrc*")))
    records.extend(file_record(path, path.name) for path in paths)
    return sorted(records)


def make_key(artifact, source, base_image_id, platform):
    validate_image_id(base_image_id)
    validate_platform(platform)
    before = {"artifact": artifact_records(artifact), "source": source_records(source)}
    after = {"artifact": artifact_records(artifact), "source": source_records(source)}
    if before != after:
        raise ValueError("assembly inputs changed while computing their key")
    payload = {"version": VERSION, "target": "runner", "base_image_id": base_image_id,
               "platform": platform, "inputs": before}
    return hashlib.sha256(encoded(payload)).hexdigest()


def image_matches(image_id, key, platform):
    validate_image_id(image_id)
    validate_key(key)
    validate_platform(platform)
    try:
        result = subprocess.run(["docker", "image", "inspect", image_id],
                                capture_output=True, text=True, timeout=15)
        if result.returncode != 0:
            return False
        inspected = json.loads(result.stdout)
        if not isinstance(inspected, list) or len(inspected) != 1:
            return False
        image = inspected[0]
        actual_platform = "/".join([image["Os"], image["Architecture"]])
        if image.get("Variant"):
            actual_platform += "/" + image["Variant"]
        labels = image.get("Config", {}).get("Labels") or {}
        return (image.get("Id") == image_id and actual_platform == platform
                and labels.get(LABEL) == key)
    except (OSError, ValueError, KeyError, TypeError, AttributeError, subprocess.TimeoutExpired):
        return False


@contextlib.contextmanager
def cache_lock(cache):
    cache.mkdir(mode=0o700, parents=True, exist_ok=True)
    lock_path = cache / ".lock"
    if lock_path.is_symlink():
        raise ValueError("cache lock cannot be a symlink")
    with lock_path.open("a") as stream:
        fcntl.flock(stream, fcntl.LOCK_EX)
        yield


def receipt_path(cache, key):
    validate_key(key)
    return cache / (key + ".json")


def hit(cache, key):
    try:
        filename = receipt_path(cache, key)
        if filename.is_symlink():
            return None
        receipt = json.loads(filename.read_text())
        created = receipt["created"]
        if isinstance(created, bool) or not isinstance(created, (int, float)) or not math.isfinite(created):
            return None
        age = time.time() - created
        if (receipt.get("version") != VERSION or receipt.get("key") != key
                or age < -60 or age > MAX_AGE):
            return None
        image_id, platform = receipt["image_id"], receipt["platform"]
        return image_id if image_matches(image_id, key, platform) else None
    except (OSError, ValueError, KeyError, TypeError, AttributeError):
        return None


def save(cache, key, image_id, platform):
    filename = receipt_path(cache, key)
    if not image_matches(image_id, key, platform):
        raise ValueError("assembled image could not be verified")
    receipt = {"version": VERSION, "key": key, "image_id": image_id,
               "platform": platform, "created": time.time()}
    temporary = None
    try:
        with tempfile.NamedTemporaryFile(dir=cache, prefix=".pending-", delete=False) as stream:
            temporary = Path(stream.name)
            stream.write(encoded(receipt))
            stream.flush()
            os.fsync(stream.fileno())
        os.replace(str(temporary), str(filename))
        directory = os.open(str(cache), os.O_RDONLY)
        try:
            os.fsync(directory)
        finally:
            os.close(directory)
    finally:
        if temporary is not None and temporary.exists():
            temporary.unlink()
    # Receipts are tiny and private. Pruning them never removes Docker images,
    # production releases, or rollback tags owned by the deployment pipeline.
    receipts = [path for path in cache.glob("*.json")
                if KEY_PATTERN.fullmatch(path.stem) and path.is_file() and not path.is_symlink()]
    receipts.sort(key=lambda path: (path == filename, path.stat().st_mtime_ns), reverse=True)
    for obsolete in receipts[MAX_RECEIPTS:]:
        obsolete.unlink()


def main(args):
    if len(args) == 5 and args[0] == "key":
        print(make_key(Path(args[1]), Path(args[2]), args[3], args[4]))
        return 0
    if len(args) not in (3, 5) or args[0] not in ("hit", "save"):
        raise ValueError("invalid command")
    command, raw_cache, key = args[:3]
    validate_key(key)
    cache = Path(raw_cache)
    with cache_lock(cache):
        if command == "hit" and len(args) == 3:
            image_id = hit(cache, key)
            if image_id is None:
                return 1
            print(image_id)
            return 0
        if command == "save" and len(args) == 5:
            save(cache, key, args[3], args[4])
            return 0
    raise ValueError("invalid command")


if __name__ == "__main__":
    try:
        sys.exit(main(sys.argv[1:]))
    except (OSError, ValueError, KeyError, TypeError, RuntimeError, subprocess.SubprocessError):
        print("Assembled image cache could not validate its inputs; refusing reuse.", file=sys.stderr)
        sys.exit(2)

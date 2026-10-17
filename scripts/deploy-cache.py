#!/usr/bin/env python3
"""Content-addressed local deploy receipts. Never accepts the E2E .next tree.

Call gate-save only after both mandatory gates pass. Call build-save only after
the production artifact has been staged and validated. Keys contain digests,
never environment values or customer database rows. This cache is local to the
trusted build machine; it is not a signature or remote artifact trust service.
"""

import contextlib
import fcntl
import hashlib
import json
import os
from pathlib import Path
import re
import shutil
import stat
import subprocess
import sys
import tempfile
import time


VERSION = 1
MAX_AGE = {"gate": 24 * 3600, "build": 7 * 24 * 3600}
MAX_ENTRIES = {"gate": 16, "build": 2}
KEY_PATTERN = re.compile(r"[0-9a-f]{64}\Z")
IGNORED_PARTS = {
    "node_modules", ".next", ".git", ".data", ".report", ".artifacts",
    "test-results", "playwright-report", "__pycache__", ".deploy-cache",
}
DEPLOY_SCRIPTS = {
    "canonical-path-from-html.py", "check-deploy-i18n.sh", "migration-preflight.py",
    "prepare-prebuilt-manifest.mjs", "prepare-deploy.sh", "production-release-state.py",
    "pull-prod-db.sh", "run-in-local-build-context.sh", "setup-fast-deploy.sh",
    "validate-standalone-artifact.sh", "verify-production-release.mjs",
    "docker-storage-maintenance.sh",
}
PACKAGE_FIELDS = (
    "name", "version", "private", "type", "engines", "overrides", "dependencies",
    "devDependencies", "optionalDependencies", "peerDependencies", "peerDependenciesMeta",
    "bundleDependencies", "packageManager", "workspaces",
)
ENV_PATTERN = re.compile(
    r"process\.env\.([A-Za-z_][A-Za-z_0-9]*)|"
    r"process\.env\[['\"]([A-Za-z_][A-Za-z_0-9]*)['\"]\]|"
    r"\benv\(['\"]([A-Za-z_][A-Za-z_0-9]*)['\"]\)"
)


def encoded(value):
    return json.dumps(value, sort_keys=True, separators=(",", ":")).encode()


def file_hash(path):
    digest = hashlib.sha256()
    with path.open("rb") as stream:
        for chunk in iter(lambda: stream.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def include_file(relative, mode):
    parts = relative.parts
    if any(part in IGNORED_PARTS for part in parts):
        return False
    # Deployment regression tests are not part of the i18n browser/catalog gate.
    # Fixing transport/rollback must not invalidate a successful application gate.
    if parts[0] == "tests" and (relative.name.startswith("deploy-") or relative.name == "pull-prod-db.test.sh"):
        return False
    if relative.as_posix() == "src/lib/deploy-i18n-gate.test.ts":
        return False
    if parts[:2] == ("src", "generated"):
        return False
    if relative.name.endswith((".db", ".db-wal", ".db-shm", ".tsbuildinfo", ".pyc")):
        return False
    if mode == "build" and ("tests" in parts or re.search(r"\.(test|spec)\.[cm]?[jt]sx?$", relative.name)):
        return False
    if parts[0] == "scripts":
        if relative.name.startswith("deploy-") or relative.name in DEPLOY_SCRIPTS:
            return False
        if len(parts) > 1 and parts[1] in {"vps", "preview"}:
            return False
        if relative.as_posix() == "scripts/lib/ssh-transport.sh":
            return False
    return True


def source_files(root, mode):
    required_files = ["package.json", "pnpm-lock.yaml", "pnpm-workspace.yaml",
                      "node_modules/.modules.yaml",
                      "next.config.ts", "tsconfig.json", "messages/vi.json", "prisma/schema.prisma"]
    required_dirs = ["src/app", "public"]
    if mode == "gate":
        required_files += ["playwright.config.ts", "playwright.i18n.config.ts", "tests/e2e/prepare-db.ts"]
    for name in required_files:
        if not (root / name).is_file():
            raise ValueError("required cache input is missing: " + name)
    for name in required_dirs:
        if not (root / name).is_dir() or not any((root / name).iterdir()):
            raise ValueError("required cache input directory is missing or empty: " + name)

    files = {root / name for name in required_files if name != "package.json"}
    for directory in ("src", "messages", "public", "prisma", "scripts", "tests" if mode == "gate" else "src"):
        for path, directories, names in os.walk(root / directory, followlinks=False):
            # Prune generated/disposable trees before opening them.
            directories[:] = [name for name in directories
                              if include_file((Path(path) / name).relative_to(root), mode)]
            for name in directories:
                if (Path(path) / name).is_symlink():
                    raise ValueError("source directory symlinks require an independent build context")
            for name in names:
                candidate = Path(path) / name
                if include_file(candidate.relative_to(root), mode):
                    files.add(candidate)
    # Include current and future top-level tool configuration, without hashing
    # deploy wiring or generated tsbuildinfo files.
    for pattern in ("*.config.*", "tsconfig*.json", ".env*", ".npmrc", ".nvmrc", ".node-version", "components.json"):
        for candidate in root.glob(pattern):
            if candidate.is_file() and not (mode == "build" and candidate.name.startswith("playwright")):
                files.add(candidate)
    if mode == "gate" and (root / "scripts/check-deploy-i18n.sh").is_file():
        files.add(root / "scripts/check-deploy-i18n.sh")
    return sorted(files, key=lambda path: path.relative_to(root).as_posix())


def make_key(mode, root):
    if mode not in MAX_AGE:
        raise ValueError("unknown cache kind")
    root = root.resolve()
    files = source_files(root, mode)
    package = json.loads((root / "package.json").read_text())
    manifest = {key: package[key] for key in PACKAGE_FIELDS if key in package}
    scripts = package.get("scripts", {})
    relevant_scripts = {"prebuild", "build", "postbuild", "postinstall", "prisma:generate"}
    if mode == "gate":
        relevant_scripts |= {"check:i18n", "test:i18n:e2e", "precheck:i18n", "postcheck:i18n",
                             "pretest:i18n:e2e", "posttest:i18n:e2e"}
    # Follow npm script dependencies, so a new build hook cannot be invisible.
    pending = list(relevant_scripts)
    while pending:
        name = pending.pop()
        for child in re.findall(r"npm\s+run\s+([\w:.-]+)", scripts.get(name, "")):
            if child not in relevant_scripts:
                relevant_scripts.add(child)
                pending.append(child)
    manifest["scripts"] = {name: scripts[name] for name in sorted(relevant_scripts) if name in scripts}
    runtime = subprocess.run(
        ["node", "-p", "JSON.stringify({version:process.version,platform:process.platform,arch:process.arch,versions:process.versions})"],
        cwd=root, capture_output=True, check=True, text=True,
    ).stdout.strip()
    env_names = {"NODE_ENV", "NODE_OPTIONS", "NEXT_PUBLIC_SITE_URL", "ALLOW_INSECURE_SITE_URL",
                 "DATABASE_URL", "TZ", "LANG", "CI"}
    records = []
    for path in files:
        relative = path.relative_to(root).as_posix()
        if path.is_symlink():
            # An external input's contents matter just as much as its link text.
            records.append([relative, "link", os.readlink(path), file_hash(path)])
        elif path.is_file():
            records.append([relative, "file", stat.S_IMODE(path.stat().st_mode), file_hash(path)])
        else:
            raise ValueError("unsupported cache input: " + relative)
        if path.suffix in {".ts", ".tsx", ".js", ".mjs", ".cjs", ".json", ".sh"} or path.name.startswith(".env"):
            contents = path.read_text(errors="replace")
            env_names.update(name for match in ENV_PATTERN.findall(contents) for name in match if name)
            if path.name.startswith(".env"):
                env_names.update(re.findall(r"^\s*(?:export\s+)?([A-Za-z_][A-Za-z_0-9]*)\s*=", contents, re.MULTILINE))
                env_names.update(re.findall(r"\$\{?([A-Za-z_][A-Za-z_0-9]*)", contents))
    env_names.update(name for name in os.environ if name.startswith("NEXT_PUBLIC_"))
    env_names.discard("NEXT_DEPLOYMENT_ID")  # The cached artifact retains its original ID.
    database_hash = None
    if mode == "build":
        database_hash = os.environ.get("DEPLOY_BUILD_DB_HASH", "")
        if not KEY_PATTERN.fullmatch(database_hash):
            raise ValueError("DEPLOY_BUILD_DB_HASH must be the SHA-256 of a validated SQLite snapshot")
    environment = {name: os.environ.get(name) for name in sorted(env_names)}
    if mode == "build":
        environment["NODE_ENV"] = "production"  # next build and the caller enforce this.
    payload = {"version": VERSION, "kind": mode, "files": records, "package": manifest,
               "runtime": runtime, "env": environment,
               "database": database_hash}
    return hashlib.sha256(encoded(payload)).hexdigest()


@contextlib.contextmanager
def cache_lock(cache):
    cache.mkdir(mode=0o700, parents=True, exist_ok=True)
    with (cache / ".lock").open("a") as stream:
        fcntl.flock(stream, fcntl.LOCK_EX)
        yield


def entry_path(cache, kind, key):
    if not KEY_PATTERN.fullmatch(key):
        raise ValueError("cache key must be a SHA-256 digest")
    return cache / kind / key


def read_receipt(path, kind, key):
    receipt = json.loads((path / "receipt.json").read_text())
    if receipt.get("version") != VERSION or receipt.get("kind") != kind or receipt.get("key") != key:
        raise ValueError("cache receipt mismatch")
    age = time.time() - receipt["created"]
    if age < -60 or age > MAX_AGE[kind]:
        raise ValueError("cache receipt expired")
    if kind == "build":
        deployment_id = receipt.get("deployment_id", "")
        if not isinstance(deployment_id, str) or not re.fullmatch(r"[A-Za-z0-9_-]{1,100}", deployment_id):
            raise ValueError("invalid cached deployment ID")
        manifest = (path / "manifest.json").read_bytes()
        if hashlib.sha256(manifest).hexdigest() != receipt["manifest_sha256"]:
            raise ValueError("artifact manifest mismatch")
    return receipt


def artifact_manifest(root):
    entries = []
    if not root.is_dir() or root.is_symlink():
        raise ValueError("artifact must be a real directory")
    for parent, directories, files in os.walk(root, followlinks=False):
        for name in sorted(directories + files):
            path = Path(parent) / name
            relative = path.relative_to(root).as_posix()
            info = path.lstat()
            mode = stat.S_IMODE(info.st_mode)
            if path.is_symlink():
                target = os.readlink(path)
                resolved = (path.parent / target).resolve()
                runtime_dependency = resolved.is_relative_to(root.resolve() / "node_modules")
                if (os.path.isabs(target) or not resolved.is_relative_to(root.resolve())
                        or (not resolved.exists() and not runtime_dependency)):
                    raise ValueError("artifact contains a broken or external symlink: " + relative)
                entries.append([relative, "link", target])
            elif path.is_dir():
                entries.append([relative, "directory", mode])
            elif path.is_file():
                entries.append([relative, "file", mode, info.st_size, file_hash(path)])
            else:
                raise ValueError("artifact contains unsupported file type: " + relative)
    if not any(entry[1] == "file" for entry in entries):
        raise ValueError("cannot cache an empty artifact")
    return encoded(sorted(entries))


def hit(cache, kind, key):
    try:
        path = entry_path(cache, kind, key)
        read_receipt(path, kind, key)
        if kind == "build" and artifact_manifest(path / "artifact") != (path / "manifest.json").read_bytes():
            return False
        return True
    except (OSError, ValueError, KeyError, TypeError):
        return False


def prune(cache, kind, keep):
    candidates = []
    for path in (cache / kind).iterdir():
        if path.is_dir() and KEY_PATTERN.fullmatch(path.name):
            candidates.append(path)
    candidates.sort(key=lambda path: (path.name == keep, path.stat().st_mtime), reverse=True)
    for path in candidates[MAX_ENTRIES[kind]:]:
        shutil.rmtree(path)


def save(cache, kind, key, artifact=None, deployment_id=None):
    destination = entry_path(cache, kind, key)
    destination.parent.mkdir(parents=True, exist_ok=True)
    staging = Path(tempfile.mkdtemp(prefix=".pending-", dir=destination.parent))
    try:
        receipt = {"version": VERSION, "kind": kind, "key": key, "created": time.time()}
        if kind == "build":
            if not deployment_id or not re.fullmatch(r"[A-Za-z0-9_-]{1,100}", deployment_id):
                raise ValueError("invalid deployment ID")
            before = artifact_manifest(artifact)
            shutil.copytree(artifact, staging / "artifact", symlinks=True)
            after = artifact_manifest(staging / "artifact")
            if before != after or before != artifact_manifest(artifact):
                raise ValueError("artifact changed while copying; refusing cache save")
            (staging / "manifest.json").write_bytes(after)
            receipt.update(deployment_id=deployment_id, manifest_sha256=hashlib.sha256(after).hexdigest())
        (staging / "receipt.json").write_bytes(encoded(receipt))
        # All commands take the same lock, so no consumer sees a half entry.
        if destination.exists():
            shutil.rmtree(destination)
        staging.rename(destination)
        prune(cache, kind, key)
    finally:
        if staging.exists():
            shutil.rmtree(staging)


def main(args):
    if len(args) == 3 and args[0] == "key":
        print(make_key(args[1], Path(args[2])))
        return 0
    if len(args) < 3:
        raise ValueError("usage: deploy-cache.py key gate|build ROOT | KIND-hit|KIND-save CACHE KEY [ARTIFACT ID] | build-path|build-id CACHE KEY")
    command, cache_text, key = args[:3]
    cache = Path(cache_text).resolve()
    kind, operation = command.split("-", 1)
    if kind not in MAX_AGE:
        raise ValueError("unknown cache kind")
    with cache_lock(cache):
        if operation == "hit" and len(args) == 3:
            return 0 if hit(cache, kind, key) else 1
        if operation == "save" and len(args) == (5 if kind == "build" else 3):
            save(cache, kind, key, Path(args[3]).resolve() if kind == "build" else None,
                 args[4] if kind == "build" else None)
            return 0
        if kind == "build" and operation in {"path", "id"} and len(args) == 3:
            path = entry_path(cache, kind, key)
            receipt = read_receipt(path, kind, key)
            print(path / "artifact" if operation == "path" else receipt["deployment_id"])
            return 0
    raise ValueError("unsupported cache command or arguments")


if __name__ == "__main__":
    try:
        sys.exit(main(sys.argv[1:]))
    except (OSError, ValueError, KeyError, TypeError, subprocess.SubprocessError):
        # Do not echo command/env contents: these may contain build secrets.
        print("Deploy cache could not validate its inputs or receipt; refusing reuse.", file=sys.stderr)
        sys.exit(2)

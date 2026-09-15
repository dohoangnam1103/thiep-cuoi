#!/usr/bin/env bash
set -euo pipefail
repo_root=$(cd "$(dirname "$0")/.." && pwd)

# Exercise the real script and SQLite backup code. Only the SSH/SCP boundary
# and lsof responses are stubbed; this never contacts production.
python3 - "$repo_root" <<'PY'
import os
from pathlib import Path
import shutil
import sqlite3
import subprocess
import sys
import tempfile

repo = Path(sys.argv[1])
with tempfile.TemporaryDirectory(prefix="pull-prod-db-test-") as temporary:
    fixture = Path(temporary)
    binary = fixture / "bin"
    binary.mkdir()
    preamble = "#!" + sys.executable + "\n"
    stubs = {
        "ssh": '''import os, shlex, subprocess, sys
from pathlib import Path
args = sys.argv[1:]
while args and args[0] == "-o":
    args = args[2:]
assert args[0] == "root@163.61.110.34", args[0]
command = args[1].replace("/srv/thiepmungonline", os.environ["FIXTURE_REMOTE"])
with open(os.environ["FIXTURE_SSH_LOG"], "a") as log:
    log.write(command + "\\n")
raise SystemExit(subprocess.call(shlex.split(command)))
''',
        "scp": '''import os, shutil, sys
from pathlib import Path
source = Path(sys.argv[-2].split(":", 1)[1])
assert source.stat().st_mode & 0o777 == 0o600
if os.environ.get("FIXTURE_TRANSFER_FAIL"):
    raise SystemExit(1)
shutil.copyfile(source, sys.argv[-1])
if os.environ.get("FIXTURE_CORRUPT"):
    with open(sys.argv[-1], "ab") as stream:
        stream.write(b"corrupted transfer")
if os.environ.get("FIXTURE_OPEN_AFTER_DOWNLOAD"):
    Path(os.environ["FIXTURE_OPEN_MARKER"]).touch()
''',
        "lsof": '''import os
from pathlib import Path
if Path(os.environ["FIXTURE_OPEN_MARKER"]).exists():
    print("12345")
    raise SystemExit(0)
raise SystemExit(1)
''',
    }
    for name, source in stubs.items():
        target = binary / name
        target.write_text(preamble + source)
        target.chmod(0o755)

    def database(path, value, wal=False):
        path.parent.mkdir(parents=True, exist_ok=True)
        # Uncheckpointed committed WAL simulates a previously stopped process.
        code = '''import os, sqlite3, sys
connection = sqlite3.connect(sys.argv[1])
if sys.argv[3] == "wal":
    connection.execute("PRAGMA journal_mode=WAL")
connection.execute("CREATE TABLE sample (value TEXT)")
connection.execute("INSERT INTO sample VALUES (?)", (sys.argv[2],))
connection.commit()
os._exit(0)
'''
        subprocess.run([sys.executable, "-c", code, str(path), value, "wal" if wal else "plain"], check=True)

    def value(path):
        with sqlite3.connect(path) as connection:
            return connection.execute("SELECT value FROM sample").fetchone()[0]

    def setup(name, wal=False):
        case = fixture / name
        (case / "scripts").mkdir(parents=True)
        shutil.copyfile(repo / "scripts/pull-prod-db.sh", case / "scripts/pull-prod-db.sh")
        remote = case / "remote"
        database(remote / "data/prod.db", "latest-production", wal=wal)
        (remote / "LIVE").touch()
        database(case / "dev.db", "previous-local", wal=wal)
        env = dict(os.environ, PATH=str(binary) + os.pathsep + os.environ["PATH"],
                   FIXTURE_REMOTE=str(remote), FIXTURE_SSH_LOG=str(case / "ssh.log"),
                   FIXTURE_OPEN_MARKER=str(case / "open"))
        env.pop("PROD_SSH_HOST", None)
        return case, env

    def run(case, env, success=False, args=("--db-only",)):
        result = subprocess.run(["bash", str(case / "scripts/pull-prod-db.sh"), *args],
                                env=env, text=True, capture_output=True)
        assert (result.returncode == 0) == success, result.stdout + result.stderr
        if not success:
            assert value(case / "dev.db") == "previous-local"
        # Every snapshot downloaded (or attempted) was removed remotely.
        log = case / "ssh.log"
        if log.exists():
            for line in log.read_text().splitlines():
                if line.startswith("rm -f -- "):
                    import shlex
                    for path in shlex.split(line)[3:]:
                        assert not Path(path).exists(), path
        return result.stdout + result.stderr

    case, env = setup("success-wal", wal=True)
    assert (case / "dev.db-wal").stat().st_size > 0
    remote_before = (case / "remote/data/prod.db").read_bytes()
    run(case, env, success=True)
    assert value(case / "dev.db") == "latest-production"
    backups = list((case / "backups/prod-db").glob("dev.db.before-prod-pull-*"))
    snapshots = list((case / "backups/prod-db").glob("prod-*.db"))
    assert len(backups) == len(snapshots) == 1
    assert value(backups[0]) == "previous-local"
    assert (case / "remote/data/prod.db").read_bytes() == remote_before
    for path in [case / "dev.db", *backups, *snapshots]:
        assert path.stat().st_mode & 0o777 == 0o600

    case, env = setup("retired-host")
    env["PROD_SSH_HOST"] = "minipc"
    assert "Refusing retired" in run(case, env)
    assert not (case / "ssh.log").exists()

    for guard in ("missing-live", "retired-marker"):
        case, env = setup(guard)
        if guard == "missing-live":
            (case / "remote/LIVE").unlink()
        else:
            (case / "remote/RETIRED").touch()
        assert "Production guard failed" in run(case, env)

    case, env = setup("open-before")
    (case / "open").touch()
    assert "Stop the local dev server" in run(case, env)
    assert not (case / "ssh.log").exists()

    case, env = setup("open-during")
    env["FIXTURE_OPEN_AFTER_DOWNLOAD"] = "1"
    assert "Stop the local dev server" in run(case, env)

    case, env = setup("corrupt")
    env["FIXTURE_CORRUPT"] = "1"
    assert "SHA-256 mismatch" in run(case, env)
    assert not list((case / "backups/prod-db").glob("prod-*.db"))
    assert not list((case / "backups/prod-db").glob(".download.*"))

    case, env = setup("failed-transfer")
    env["FIXTURE_TRANSFER_FAIL"] = "1"
    run(case, env)

    case, env = setup("invalid-option")
    assert "Usage:" in run(case, env, args=("--unknown",))
    assert not (case / "ssh.log").exists()

print("OK pull-prod-db: 9 cases; active VPS guards, WAL backups, checksum, open DB refusal, cleanup")
PY

#!/usr/bin/env bash
set -euo pipefail

repo_root=$(cd "$(dirname "$0")/.." && pwd)
helper="$repo_root/scripts/deploy-sync-source.sh"
fixture_root=$(mktemp -d "${TMPDIR:-/tmp}/deploy-sync-source.XXXXXX")
trap 'rm -rf "$fixture_root"' EXIT
export REAL_RSYNC
REAL_RSYNC=$(command -v rsync)
export SYNC_FIXTURE_ROOT="$fixture_root"
export SYNC_ARGS_LOG="$fixture_root/rsync-args.log"
mkdir -p "$fixture_root/bin" "$fixture_root/source" "$fixture_root/releases/current"

# Translate only this fixture's SSH target to a local receiver, retaining every
# real rsync option/filter. An accidental real host or --inplace fails the test.
cat > "$fixture_root/bin/rsync" <<'MOCK'
#!/usr/bin/env bash
set -euo pipefail
args=("$@")
printf '%s\n' "$@" > "$SYNC_ARGS_LOG"
for arg in "$@"; do
  [[ "$arg" != --inplace ]] || exit 95
done
index=$((${#args[@]} - 1))
[[ "${args[$index]}" == "fixture:$SYNC_FIXTURE_ROOT/releases/candidate-test/" ]] || exit 96
args[$index]="${args[$index]#fixture:}"
exec "$REAL_RSYNC" "${args[@]}"
MOCK
chmod +x "$fixture_root/bin/rsync"

python3 - "$fixture_root" <<'PY'
import hashlib
import json
import os
from pathlib import Path
import shutil
import stat
import sys

root = Path(sys.argv[1])
source = root / 'source'
current = root / 'releases/current'

def write(base, relative, value):
    path = base / relative
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(value)

hidden = ['docs', '.superpowers', 'test-results', 'semantic-review',
          '.vscode', '.github', '.openai', '.codex']
for directory in hidden:
    for name in ['note.md', 'nested/old.pyc', 'nested/__pycache__/cache.pyc']:
        write(source, directory + '/' + name, 'local-only new content')
        write(current, directory + '/' + name, 'old release-only content')
write(source, 'docs/superpowers/old-plan.md', 'local plan')
write(current, 'docs/superpowers/old-plan.md', 'old plan')

private = [
    '.env', '.env.local', '.env.production', '.env.production.local',
    '.git/config', 'node_modules/lib/index.js', '.next/BUILD_ID',
    '.DS_Store', 'debug.png', 'debug.jpg', 'debug.jpeg',
    'dev.db', 'dev.db-journal', 'dev.db-shm', 'dev.db-wal',
    'copy.sqlite', 'copy.sqlite-journal', 'copy.sqlite-shm', 'copy.sqlite-wal',
    'data/prod.db', 'backups/prod-db/snapshot.db', '.deploy-cache/build/key.json',
    'prisma/local.db', 'prisma/local.db-journal', 'prisma/local.db-shm',
    'prisma/local.db-wal', 'prisma/local.sqlite', 'prisma/local.sqlite-journal',
    'prisma/local.sqlite-shm', 'prisma/local.sqlite-wal',
    'public/uploads/customer.jpg', 'temp/note.txt', 'tmp/note.txt',
    '.claude/settings.json', '.deploy-worktree/private.txt',
    '.worktrees/private.txt', '.playwright-mcp/capture.png', '.capture/file.txt',
    '.production-archives/archive.tar', '.claude-flow/logs/private.txt',
    '.codegraph/index.json', '.kiro/note.md', 'scripts/__pycache__/helper.pyc',
    'scripts/unused.pyc', 'tsconfig.tsbuildinfo', 'src/code.test.ts',
    'src/code.test.tsx', 'tests/example.spec.ts', '.next-prebuilt/should-not-sync',
]
for relative in private:
    write(source, relative, 'private source data must not be transferred')

required = [
    'public/chungdoi/images/invitation.png', 'public/chungdoi/fonts/font.woff2',
    'scripts/canonical-path-from-html.py', 'scripts/migration-preflight.py',
    'scripts/seed-tracks-if-empty.py', 'scripts/cron-hit-endpoint.sh',
    'prisma/schema.prisma', 'prisma/migrations/001/migration.sql',
    'prisma/tracks.json', 'package.json', 'package-lock.json',
    'prisma.config.ts', 'Dockerfile.prebuilt', 'Dockerfile.prebuilt.dockerignore',
    'src/app/page.tsx', 'messages/vi.json',
]
for relative in required:
    write(current, relative, 'old production content')
    write(source, relative, 'new deployment content with different size')
write(current, 'obsolete.txt', 'remove only candidate copy')
write(current, '.next-prebuilt/.next/server.js', 'preserved artifact delta basis')
(root / 'releases/candidate-test').mkdir()

write(current, 'scripts/mode-only.sh', 'same executable content')
shutil.copy2(current / 'scripts/mode-only.sh', source / 'scripts/mode-only.sh')
(current / 'scripts/mode-only.sh').chmod(0o644)
(source / 'scripts/mode-only.sh').chmod(0o755)
write(current, 'public/same-size.txt', 'old bytes')
shutil.copy2(current / 'public/same-size.txt', source / 'public/same-size.txt')
preserved = (current / 'public/same-size.txt').stat()
write(source, 'public/same-size.txt', 'new bytes')
os.utime(source / 'public/same-size.txt', ns=(preserved.st_atime_ns, preserved.st_mtime_ns))
write(current, 'public/unchanged.txt', 'same content and attributes')
shutil.copy2(current / 'public/unchanged.txt', source / 'public/unchanged.txt')
shutil.copytree(current / '.next-prebuilt', root / 'artifact')

def manifest(base):
    return {str(p.relative_to(base)): [p.stat().st_ino, stat.S_IMODE(p.stat().st_mode),
            p.stat().st_uid, p.stat().st_gid,
            hashlib.sha256(p.read_bytes()).hexdigest()]
            for p in base.rglob('*') if p.is_file()}

(root / 'before.json').write_text(json.dumps(manifest(current)))
(root / 'expectations.json').write_text(json.dumps({
    'hidden': hidden, 'private': private, 'required': required}))
PY

PATH="$fixture_root/bin:$PATH" bash "$helper" "$fixture_root/source" fixture \
  "$fixture_root/releases/candidate-test" 'ssh-must-not-run' \
  "$fixture_root/releases/current" > "$fixture_root/sync.log"
grep -q 'Number of files' "$fixture_root/sync.log"
grep -Fxq -- '--stats' "$SYNC_ARGS_LOG"
grep -Fxq -- '--checksum' "$SYNC_ARGS_LOG"
grep -Fxq -- "--link-dest=$fixture_root/releases/current" "$SYNC_ARGS_LOG"

python3 - "$fixture_root" <<'PY'
import hashlib
import json
from pathlib import Path
import stat
import sys

root = Path(sys.argv[1])
current = root / 'releases/current'
candidate = root / 'releases/candidate-test'
expectations = json.loads((root / 'expectations.json').read_text())
before = json.loads((root / 'before.json').read_text())
after = {str(p.relative_to(current)): [p.stat().st_ino, stat.S_IMODE(p.stat().st_mode),
         p.stat().st_uid, p.stat().st_gid,
         hashlib.sha256(p.read_bytes()).hexdigest()]
         for p in current.rglob('*') if p.is_file()}
assert before == after, 'Source sync changed active production bytes, inodes, permissions or ownership'
for directory in expectations['hidden']:
    assert not (candidate / directory).exists(), 'Stale directory remains: ' + directory
for relative in expectations['private']:
    assert not (candidate / relative).exists(), 'Private file transferred: ' + relative
for relative in expectations['required']:
    assert (candidate / relative).read_bytes() == (root / 'source' / relative).read_bytes(), relative
    assert (candidate / relative).stat().st_ino != (current / relative).stat().st_ino, relative
assert not (candidate / 'obsolete.txt').exists()
assert not (candidate / '.next-prebuilt').exists(), 'Source sync copied artifact files'
assert stat.S_IMODE((candidate / 'scripts/mode-only.sh').stat().st_mode) == 0o755
assert stat.S_IMODE((current / 'scripts/mode-only.sh').stat().st_mode) == 0o644
assert (candidate / 'scripts/mode-only.sh').stat().st_ino != (current / 'scripts/mode-only.sh').stat().st_ino
assert (candidate / 'public/same-size.txt').read_text() == 'new bytes'
assert (candidate / 'public/same-size.txt').stat().st_ino != (current / 'public/same-size.txt').stat().st_ino
assert (current / 'public/same-size.txt').read_text() == 'old bytes'
assert (candidate / 'public/unchanged.txt').stat().st_ino == (current / 'public/unchanged.txt').stat().st_ino
PY

# Artifact upload uses its own empty destination and verified baseline path.
"$REAL_RSYNC" -a --checksum --delete \
  --link-dest="$fixture_root/releases/current/.next-prebuilt" \
  "$fixture_root/artifact/" "$fixture_root/releases/candidate-test/.next-prebuilt/"
python3 - "$fixture_root" <<'PY'
from pathlib import Path
import sys
root = Path(sys.argv[1])
artifact = '.next-prebuilt/.next/server.js'
current = root / 'releases/current' / artifact
candidate = root / 'releases/candidate-test' / artifact
assert candidate.read_text() == 'preserved artifact delta basis'
assert candidate.stat().st_ino == current.stat().st_ino
PY

# Passing current instead of a candidate must fail before rsync is called.
rm "$SYNC_ARGS_LOG"
if PATH="$fixture_root/bin:$PATH" bash "$helper" "$fixture_root/source" fixture \
    "$fixture_root/releases/current" 'ssh-must-not-run' \
    "$fixture_root/releases/current" > "$fixture_root/rejected.log" 2>&1; then
  echo 'FAIL: active release accepted as a destructive rsync destination' >&2
  exit 1
fi
[[ ! -e "$SYNC_ARGS_LOG" ]]

echo 'OK deploy-sync-source: real rsync checksums, metadata isolation, private files and artifact delta'

#!/usr/bin/env bash
set -euo pipefail

repo_root=$(cd "$(dirname "$0")/.." && pwd)
context_runner="$repo_root/scripts/run-in-local-build-context.sh"
artifact_validator="$repo_root/scripts/validate-standalone-artifact.sh"
canonical_reader="$repo_root/scripts/canonical-path-from-html.py"
grep -Fq 'from __future__ import annotations' "$canonical_reader"
fixture_root=$(mktemp -d "${TMPDIR:-/tmp}/deploy-fast-safety.XXXXXX")
trap 'rm -rf "$fixture_root"' EXIT

mkdir -p "$fixture_root/repo"
git -C "$fixture_root/repo" init -q
git -C "$fixture_root/repo" config user.email test@example.com
git -C "$fixture_root/repo" config user.name "Deploy Test"
printf 'committed\n' > "$fixture_root/repo/value.txt"
git -C "$fixture_root/repo" add value.txt
git -C "$fixture_root/repo" commit -qm initial
git -C "$fixture_root/repo" worktree add -qb deploy-test "$fixture_root/worktree"
printf 'working-copy\n' > "$fixture_root/worktree/value.txt"
printf 'untracked\n' > "$fixture_root/worktree/untracked.txt"
mkdir -p "$fixture_root/worktree/node_modules/example"
printf 'dependency\n' > "$fixture_root/worktree/node_modules/example/value.txt"
mkdir -p "$fixture_root/worktree/node_modules/.bin"
ln -s ../example/value.txt "$fixture_root/worktree/node_modules/.bin/example"

# Both ordinary checkouts and linked worktrees must get isolated source/deps.
cp -R "$fixture_root/worktree/node_modules" "$fixture_root/repo/node_modules"
printf 'untracked\n' > "$fixture_root/repo/untracked.txt"
for checkout in repo worktree; do
  printf 'working-copy\n' > "$fixture_root/$checkout/value.txt"
  mkdir -p "$fixture_root/$checkout/docs" "$fixture_root/$checkout/data" \
    "$fixture_root/$checkout/public/uploads" "$fixture_root/$checkout/.deploy-cache"
  printf 'do not copy\n' > "$fixture_root/$checkout/docs/research.txt"
  printf 'do not copy\n' > "$fixture_root/$checkout/data/unrelated.txt"
  printf 'do not copy\n' > "$fixture_root/$checkout/public/uploads/user.jpg"
  printf 'do not copy\n' > "$fixture_root/$checkout/.deploy-cache/cache.txt"
  context_output=$(
    cd "$fixture_root/$checkout"
    SOURCE_FIXTURE="$PWD" "$context_runner" bash -c '
      printf "cwd=%s\n" "$PWD"
      test "$DEPLOY_LOCAL_BUILD_CONTEXT" = 1
      test "$DEPLOY_CACHE_DIR" = "$SOURCE_FIXTURE/.deploy-cache"
      test ! -e docs && test ! -e data && test ! -e public/uploads
      test ! -e .deploy-cache && test ! -e .git
      printf "edited-after-freeze\n" > "$SOURCE_FIXTURE/value.txt"
      printf "changed-dependency\n" > "$SOURCE_FIXTURE/node_modules/example/value.txt"
      cat value.txt
      cat untracked.txt
      cat node_modules/example/value.txt
      test -L node_modules/.bin/example
    '
  )
  context_path=${context_output%%$'\n'*}
  context_path=${context_path#cwd=}
  [[ "$context_path" != "$fixture_root/$checkout" ]]
  [[ "$context_output" == *$'working-copy\nuntracked\ndependency' ]]
  [[ ! -e "$context_path" ]]
done

# Failure keeps the child's status and removes the private context too.
set +e
failure_output=$(cd "$fixture_root/repo" && "$context_runner" bash -c 'pwd; exit 37')
failure_status=$?
set -e
[[ "$failure_status" == 37 && ! -e "$failure_output" ]]

# Use the real dotenv loader but an isolated SQLite fixture with an open WAL.
# Changes in the snapshot must not reach the user's open database.
python3 - "$fixture_root" "$context_runner" "$repo_root" <<'PY'
import json, os, pathlib, sqlite3, subprocess, sys
fixture, runner, repository = map(pathlib.Path, sys.argv[1:])
root = fixture / 'database-repo'
root.mkdir()
(root / 'node_modules/@next').mkdir(parents=True)
(root / 'node_modules/@next/env').symlink_to(repository / 'node_modules/@next/env', target_is_directory=True)
(root / 'package.json').write_text('{}')
(root / '.env.production').write_text('DATABASE_URL=file:./data/live.db\n')
(root / 'data').mkdir()
database = sqlite3.connect(str(root / 'data/live.db'))
database.execute('PRAGMA journal_mode=WAL')
database.execute('PRAGMA wal_autocheckpoint=0')
database.execute('CREATE TABLE sample (value TEXT)')
database.commit()
database.execute('PRAGMA wal_checkpoint(TRUNCATE)')
database.execute("INSERT INTO sample VALUES ('committed-in-wal')")
database.commit()
assert (root / 'data/live.db-wal').stat().st_size > 0
# Copying only the main file loses this row, proving the fixture exercises WAL.
raw = fixture / 'raw.db'
raw.write_bytes((root / 'data/live.db').read_bytes())
with sqlite3.connect(str(raw)) as connection:
    assert connection.execute('SELECT count(*) FROM sample').fetchone() == (0,)
probe = r"""
import hashlib, json, os, pathlib, sqlite3
root = pathlib.Path.cwd()
assert root.stat().st_mode & 0o777 == 0o700
assert (root / '.env.production').stat().st_mode & 0o777 == 0o600
assert not (root / '.deploy-db-snapshot.json').exists()
url = os.environ.get('DATABASE_URL', 'file:./data/live.db')
assert not url.startswith('file:/')
filename = root / url.removeprefix('file:')
assert filename.stat().st_mode & 0o777 == 0o600
snapshot_hash = hashlib.sha256(filename.read_bytes()).hexdigest()
with sqlite3.connect(str(filename)) as db:
    assert db.execute('SELECT value FROM sample').fetchall() == [('committed-in-wal',)]
    db.execute("INSERT INTO sample VALUES ('snapshot-only')")
print(json.dumps({'cwd': str(root), 'url': url, 'snapshot_hash': snapshot_hash}))
"""
environment = dict(os.environ)
environment.pop('DATABASE_URL', None)
environment.pop('DEPLOY_LOCAL_BUILD_CONTEXT', None)
snapshot_hashes = set()
external_database = fixture / 'external.db'
# The external variant contains the same current data through SQLite backup.
with sqlite3.connect(str(external_database)) as destination:
    database.backup(destination)
for location in ('relative', 'absolute', 'external'):
    if location == 'absolute':
        # Absolute configuration receives a stable relative URL in each copy.
        (root / '.env.production').write_text('DATABASE_URL=file:' + str(root / 'data/live.db') + '\n')
    elif location == 'external':
        (root / '.env.production').write_text('DATABASE_URL=file:' + str(external_database) + '\n')
    result = subprocess.run([str(runner), 'python3', '-c', probe], cwd=root,
                            env=environment, text=True, capture_output=True)
    assert result.returncode == 0, result.stderr
    output = json.loads(result.stdout)
    expected_url = 'file:./.deploy-build.db' if location == 'external' else 'file:./data/live.db'
    assert output['url'] == expected_url, output
    if location != 'external':
        snapshot_hashes.add(output['snapshot_hash'])
    assert not pathlib.Path(output['cwd']).exists()
    assert database.execute('SELECT value FROM sample').fetchall() == [('committed-in-wal',)]
assert len(snapshot_hashes) == 1, 'Unchanged database snapshots must produce stable cache inputs'
database.close()
PY

mkdir -p "$fixture_root/artifact/.next/node_modules" "$fixture_root/artifact/node_modules/example"
ln -s ../../node_modules/example "$fixture_root/artifact/.next/node_modules/example-good"
ln -s ../../node_modules/runtime-only "$fixture_root/artifact/.next/node_modules/runtime-only"
"$artifact_validator" "$fixture_root/artifact"
ln -s ../../../../worktrees/missing/node_modules/example \
  "$fixture_root/artifact/.next/node_modules/example-broken"
if "$artifact_validator" "$fixture_root/artifact" >"$fixture_root/validator.log" 2>&1; then
  echo "FAIL: broken standalone symlink was accepted" >&2
  exit 1
fi
grep -Fq 'example-broken' "$fixture_root/validator.log"

canonical_html='<html><head><link rel="canonical" href="https://thiepmungonline.com/mau-thiep/en-do/demo"></head></html>'
canonical_path=$(printf '%s' "$canonical_html" | \
  python3 "$canonical_reader" https://thiepmungonline.com)
[[ "$canonical_path" == '/mau-thiep/en-do/demo' ]]

external_html='<html><head><link rel="canonical" href="https://example.com/mau-thiep/en-do/demo"></head></html>'
if printf '%s' "$external_html" | \
  python3 "$canonical_reader" https://thiepmungonline.com >/dev/null 2>&1; then
  echo "FAIL: external canonical origin was accepted" >&2
  exit 1
fi

echo "OK deploy-fast-safety"

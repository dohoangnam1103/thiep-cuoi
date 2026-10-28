#!/usr/bin/env bash
# Sync source into an isolated candidate; never modify the active release.
set -euo pipefail

if [[ "$#" != 5 ]]; then
  echo "Usage: $0 SRC_ROOT SSH_TARGET CANDIDATE_DIR RSYNC_RSH BASELINE_DIR" >&2
  exit 2
fi
source_root="$1"
ssh_target="$2"
candidate_dir="${3%/}"
rsync_rsh="$4"
baseline_dir="${5%/}"

# The receiver is allowed to delete candidate files, so fail closed if a caller
# accidentally passes releases/current or a path containing shell metacharacters.
if [[ ! "$candidate_dir" =~ ^/[a-zA-Z0-9_./-]+/releases/candidate-[a-zA-Z0-9_-]+$ ||
      "/$candidate_dir/" == *"/../"* || "/$candidate_dir/" == *"/./"* ]]; then
  echo "Source sync requires an absolute releases/candidate-ID destination." >&2
  exit 2
fi
if [[ -z "$ssh_target" || "$ssh_target" == -* || -z "$rsync_rsh" ]]; then
  echo "Source sync requires an SSH target and transport command." >&2
  exit 2
fi
if [[ ! "$baseline_dir" =~ ^/[a-zA-Z0-9_./-]+/releases/[a-zA-Z0-9_-]+$ ||
      "/$baseline_dir/" == *"/../"* || "/$baseline_dir/" == *"/./"* ||
      "$baseline_dir" == "$candidate_dir" ||
      "${baseline_dir%/*}" != "${candidate_dir%/*}" ]]; then
  echo "Source sync requires a separate baseline in the same releases directory." >&2
  exit 2
fi
cd "$source_root"

# Hide development-only directories on the sender and allow their old candidate
# copies to be deleted. The receiver rules precede legacy excludes so nested
# files (for example docs/superpowers or *.pyc) cannot leave stale directories.
# Source staging starts empty. --link-dest shares only files whose content AND
# preserved attributes match, keeping chmod-only edits off the current inode.
# --checksum also detects changed bytes when size and timestamp are unchanged.
# Artifact files are handled separately by the later artifact sync.
# Never add --inplace or prepopulate this candidate with hardlinks.
rsync -a --checksum --delete --stats --link-dest="$baseline_dir" \
    --rsh "$rsync_rsh" \
    --filter 'H /docs/' \
    --filter 'R /docs/***' \
    --filter 'H /.superpowers/' \
    --filter 'R /.superpowers/***' \
    --filter 'H /test-results/' \
    --filter 'R /test-results/***' \
    --filter 'H /semantic-review/' \
    --filter 'R /semantic-review/***' \
    --filter 'H /.vscode/' \
    --filter 'R /.vscode/***' \
    --filter 'H /.github/' \
    --filter 'R /.github/***' \
    --filter 'H /.openai/' \
    --filter 'R /.openai/***' \
    --filter 'H /.codex/' \
    --filter 'R /.codex/***' \
    --exclude '/.next-prebuilt/' \
    --exclude '.git' \
    --exclude 'node_modules' \
    --exclude '.next' \
    --exclude '.next-editor2-*' \
    --exclude '.env*' \
    --exclude '.DS_Store' \
    --exclude '/*.png' \
    --exclude '/*.jpg' \
    --exclude '/*.jpeg' \
    --exclude '/*.db' \
    --exclude '/*.db-journal' \
    --exclude '/*.db-shm' \
    --exclude '/*.db-wal' \
    --exclude '/*.sqlite' \
    --exclude '/*.sqlite-journal' \
    --exclude '/*.sqlite-shm' \
    --exclude '/*.sqlite-wal' \
    --exclude '/data/' \
    --exclude '/backups/' \
    --exclude '/.deploy-cache/' \
    --exclude '/prisma/*.db' \
    --exclude '/prisma/*.db-journal' \
    --exclude '/prisma/*.db-shm' \
    --exclude '/prisma/*.db-wal' \
    --exclude '/prisma/*.sqlite' \
    --exclude '/prisma/*.sqlite-journal' \
    --exclude '/prisma/*.sqlite-shm' \
    --exclude '/prisma/*.sqlite-wal' \
    --exclude '/public/uploads/' \
    --exclude '/temp/' \
    --exclude '/tmp/' \
    --exclude '/.claude/' \
    --exclude '/.deploy-worktree/' \
    --exclude '/.worktrees/' \
    --exclude '.playwright-mcp' \
    --exclude '.capture' \
    --exclude '/.production-archives/' \
    --exclude '/docs/research/.*-qa-*.png' \
    --exclude '/.claude-flow' \
    --exclude '/.codegraph' \
    --exclude '/.kiro' \
    --exclude '__pycache__' \
    --exclude '*.pyc' \
    --exclude '*.tsbuildinfo' \
    --exclude '*.test.ts' \
    --exclude '*.test.tsx' \
    --exclude '/tests' \
    --exclude '/docs/superpowers' \
    ./ "${ssh_target}:${candidate_dir}/"

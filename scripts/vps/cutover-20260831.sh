#!/usr/bin/env bash
# Dated, one-shot cutover; prerequisite: verified candidate and pre-created VPS containers.
set -Eeuo pipefail
old=namdo@192.168.0.57
new=root@163.223.9.198
stage=/Users/namdo/Documents/thiepmung-migration-20260831.HJad8n
oldroot=/home/namdo/apps/thiepmungonline
newroot=/srv/thiepmungonline
source_frozen=0
traffic_may_be_live=0
recover() {
  rc=$?
  trap - ERR
  if [[ "$source_frozen" == 1 && "$traffic_may_be_live" == 0 ]]; then
    ssh "$new" 'docker stop -t 15 thiepmungonline-tunnel thiepmungonline-web' || true
    ssh "$old" "python3 $oldroot/migration-20260831/restore-minipc-before-live.py --vps-has-not-accepted-writes"
    echo 'Cutover failed before live traffic; old production restored.' >&2
  else
    echo 'Inspect cutover state. Never restore an old DB after new production accepts writes.' >&2
  fi
  exit "$rc"
}
trap recover ERR
test -d "$stage/data"
ssh "$new" "set -eu; test ! -f $newroot/LIVE; test -f $newroot/ops/activate-final.py; test \"\$(docker inspect thiepmungonline-web --format '{{.State.Running}}')\" = false; test \"\$(docker inspect thiepmungonline-tunnel --format '{{.State.Running}}')\" = false"
mkdir -p "$stage/final-checkpoint"
source_frozen=1
ssh "$old" "python3 $oldroot/migration-20260831/freeze-minipc.py"
scp "$old:$oldroot/migration-20260831/final.db" "$old:$oldroot/migration-20260831/final-inventory.json" "$old:$oldroot/migration-20260831/frozen.json" "$old:$oldroot/migration-20260831/crontab.before" "$stage/final-checkpoint/"
rsync -a --delete --exclude='backups' --exclude='*.db*' "$old:$oldroot/data/" "$stage/data/"
rsync -a --delete --exclude='backups' --exclude='*.db*' "$stage/data/" "$new:$newroot/data/"
scp "$stage/final-checkpoint/final.db" "$stage/final-checkpoint/final-inventory.json" "$stage/final-checkpoint/frozen.json" "$new:$newroot/ops/"
ssh "$new" "set -eu; python3 $newroot/ops/activate-final.py; docker start thiepmungonline-web"
ssh "$new" 'set -eu; ready=0; for i in $(seq 1 20); do if curl -fsS --max-time 3 http://127.0.0.1:3211/ -o /dev/null; then ready=1; break; fi; sleep 1; done; test "$ready" = 1'
# Beyond this point an ambiguous SSH result may mean users reached the new DB.
traffic_may_be_live=1
ssh "$new" "set -eu; touch $newroot/LIVE; docker start thiepmungonline-tunnel"
ssh "$new" 'set -eu; ready=0; for i in $(seq 1 20); do if curl -fsS --max-time 3 http://127.0.0.1:20246/ready -o /dev/null; then ready=1; break; fi; sleep 1; done; test "$ready" = 1; date -u +VPS_TUNNEL_READY=%Y-%m-%dT%H:%M:%SZ'
curl --fail --silent --show-error --max-time 20 https://thiepmungonline.com/api/auth/session -o /dev/null
date -u +CUTOVER_PUBLIC_OK=%Y-%m-%dT%H:%M:%SZ
trap - ERR

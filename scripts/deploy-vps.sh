#!/usr/bin/env bash
# Production entrypoint after the 2026-08-31 migration. Never falls back to minipc.
set -euo pipefail
cd "$(dirname "$0")/.."

export REMOTE_LAN_IP=163.223.9.198
export REMOTE_LAN_USER=root
export REMOTE_TUNNEL_ALIAS=root@163.223.9.198
export REMOTE_APP_DIR=/srv/thiepmungonline
export WEB_IMAGE=thiepmungonline-web:production
export PUBLIC_URL=https://thiepmungonline.com
export MANAGED_SCHEDULERS=systemd

case "${1:-}" in
  ''|--check|--setup) ;;
  *) echo 'Usage: deploy-vps.sh [--check|--setup]' >&2; exit 2 ;;
esac

ssh -o BatchMode=yes -o ConnectTimeout=10 root@163.223.9.198 'set -eu
test -f /srv/thiepmungonline/LIVE
test ! -f /srv/thiepmungonline/RETIRED
hostname -I | tr " " "\n" | grep -Fx 163.223.9.198 >/dev/null
docker compose -f /srv/thiepmungonline/compose.yaml config -q
systemctl is-active --quiet docker
systemctl is-active --quiet thiepmungonline-payos-reconcile.timer thiepmungonline-trial-reminders.timer thiepmungonline-backup.timer
echo "Production target: 163.223.9.198:/srv/thiepmungonline"
df -h /srv/thiepmungonline'

if [[ "${1:-}" == --check || "${1:-}" == --setup ]]; then
  echo 'VPS provisioning and production timers verified; no changes made.'
  exit 0
fi

# Cold native dependency/image builds need more space than serving the live app.
free_kb=$(ssh root@163.223.9.198 "df -Pk /srv/thiepmungonline | awk 'NR==2 {print \$4}'")
if [[ "$free_kb" -lt 6291456 ]]; then
  echo 'Deploy stopped before build/rsync: at least 6 GiB free is required on VPS.' >&2
  echo 'Expand storage or review old artifacts first; do not delete live data/backups blindly.' >&2
  exit 1
fi
exec bash scripts/deploy-fast.sh

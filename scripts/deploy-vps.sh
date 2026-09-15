#!/usr/bin/env bash
# Production entrypoint after the 2026-08-31 migration. Never falls back to minipc.
set -euo pipefail
cd "$(dirname "$0")/.."

export REMOTE_LAN_IP=163.61.110.34
export REMOTE_LAN_USER=root
export REMOTE_TUNNEL_ALIAS=root@163.61.110.34
export REMOTE_APP_DIR=/srv/thiepmungonline
export WEB_IMAGE=thiepmungonline-web:production
export PUBLIC_URL=https://thiepmungonline.com
export MANAGED_SCHEDULERS=systemd

case "${1:-}" in
  ''|--check|--setup) ;;
  *) echo 'Usage: deploy-vps.sh [--check|--setup]' >&2; exit 2 ;;
esac

ssh -o BatchMode=yes -o ConnectTimeout=10 root@163.61.110.34 'set -eu
test -f /srv/thiepmungonline/LIVE
test ! -f /srv/thiepmungonline/RETIRED
hostname -I | tr " " "\n" | grep -Fx 163.61.110.34 >/dev/null
docker compose -f /srv/thiepmungonline/compose.yaml config -q
systemctl is-active --quiet docker
# Schedulers: systemd timers on the old VPS, root cron on the new one (2026-09-15).
# Accept either, but backup coverage is mandatory in both forms.
if systemctl is-active --quiet thiepmungonline-payos-reconcile.timer thiepmungonline-trial-reminders.timer thiepmungonline-backup.timer 2>/dev/null; then
  : # systemd-managed host
else
  crontab -l 2>/dev/null | grep -q "cron-hit-endpoint.sh /api/cron/payos-reconcile" || { echo "Missing payos-reconcile scheduler (no timer, no cron)." >&2; exit 1; }
  crontab -l 2>/dev/null | grep -q "cron-hit-endpoint.sh /api/cron/trial-reminders" || { echo "Missing trial-reminders scheduler (no timer, no cron)." >&2; exit 1; }
  crontab -l 2>/dev/null | grep -qi backup || { echo "No database backup job found (no timer, no backup cron). Set one up before relying on this host." >&2; exit 1; }
fi
echo "Production target: 163.61.110.34:/srv/thiepmungonline"
df -h /srv/thiepmungonline'

if [[ "${1:-}" == --check || "${1:-}" == --setup ]]; then
  echo 'VPS provisioning and production timers verified; no changes made.'
  exit 0
fi

# Cold native dependency/image builds need more space than serving the live app.
free_kb=$(ssh -o BatchMode=yes -o ConnectTimeout=10 root@163.61.110.34 "df -Pk /srv/thiepmungonline | awk 'NR==2 {print \$4}'")
if [[ "$free_kb" -lt 6291456 ]]; then
  echo 'Deploy stopped before build/rsync: at least 6 GiB free is required on VPS.' >&2
  echo 'Expand storage or review old artifacts first; do not delete live data/backups blindly.' >&2
  exit 1
fi
exec bash scripts/deploy-fast.sh

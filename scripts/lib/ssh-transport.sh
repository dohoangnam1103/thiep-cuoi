#!/usr/bin/env bash
# Shared SSH transport for deploy scripts.
#
# Chọn đường truyền nhanh nhất tới production rồi tái dùng đúng một TCP
# connection cho mọi lệnh sau đó.
#
# Vì sao cần: alias `minipc` trong ~/.ssh/config đi qua
# `cloudflared access ssh`, tức mọi byte rsync/docker phải ra Internet rồi
# quay lại LAN. Đo thực tế: ~0.3 MB/s qua tunnel so với ~21 MB/s khi nối
# thẳng LAN. Khi Mac và Mini PC cùng mạng, luôn ưu tiên LAN; khi ở ngoài,
# tự động rơi về tunnel để script vẫn chạy được.
#
# Export sau khi gọi transport_init:
#   SSH_TARGET      target dùng cho ssh/rsync
#   SSH_OPTS_ARRAY  mảng option ssh (multiplexing + keepalive)
#   TRANSPORT_KIND  "lan" hoặc "tunnel"
# Hàm:
#   rsh ...         chạy lệnh remote qua connection đã ghép
#   rsh_stdin ...   chạy `bash -s -- args` với heredoc trên stdin
#   rsync_rsh       in ra string -e cho rsync

set -euo pipefail

# Socket domain Unix trên macOS giới hạn ~104 ký tự, và ssh còn nối thêm hậu tố
# khoá khi tạo master. TMPDIR trên macOS đã dài sẵn (/var/folders/...), nên dùng
# thẳng /tmp với tên ngắn.
TRANSPORT_CONTROL_DIR="/tmp/.tmo-ssh"
TRANSPORT_KIND=""
SSH_TARGET=""
SSH_OPTS_ARRAY=()

# ControlPersist giữ connection sống giữa các lệnh. Deploy cũ mở hơn 10
# connection riêng, mỗi lần lại bắt tay cloudflared từ đầu.
transport_init() {
  local lan_host="$1"       # ví dụ 192.168.0.57
  local lan_user="$2"       # ví dụ namdo
  local tunnel_alias="$3"   # ví dụ minipc
  local probe_timeout="${4:-2}"

  mkdir -p "$TRANSPORT_CONTROL_DIR"
  chmod 700 "$TRANSPORT_CONTROL_DIR"

  if transport_probe_lan "$lan_host" "$probe_timeout"; then
    TRANSPORT_KIND="lan"
    SSH_TARGET="${lan_user}@${lan_host}"
  else
    TRANSPORT_KIND="tunnel"
    SSH_TARGET="$tunnel_alias"
  fi

  local control_path
  control_path="${TRANSPORT_CONTROL_DIR}/$(printf '%s' "$SSH_TARGET" | shasum | cut -c1-8).sock"

  SSH_OPTS_ARRAY=(
    -o ControlMaster=auto
    -o "ControlPath=${control_path}"
    -o ControlPersist=300
    -o ServerAliveInterval=15
    -o ServerAliveCountMax=4
    -o StrictHostKeyChecking=accept-new
  )

  # Trên LAN, AES-GCM rẻ hơn và bỏ nén giúp CPU Mini PC rảnh cho việc build.
  if [[ "$TRANSPORT_KIND" == "lan" ]]; then
    SSH_OPTS_ARRAY+=(-o Compression=no)
  fi

  export TRANSPORT_KIND SSH_TARGET
}

transport_probe_lan() {
  local host="$1"
  local timeout="$2"

  # nc -z chỉ kiểm tra cổng mở, chưa chứng minh xác thực được. Thử luôn một
  # lệnh thật với BatchMode để không treo chờ nhập mật khẩu.
  nc -z -G "$timeout" "$host" 22 >/dev/null 2>&1 || return 1
  ssh -o BatchMode=yes \
      -o ConnectTimeout="$timeout" \
      -o StrictHostKeyChecking=accept-new \
      "${DEPLOY_LAN_USER:-namdo}@${host}" true >/dev/null 2>&1
}

rsh() {
  ssh "${SSH_OPTS_ARRAY[@]}" "$SSH_TARGET" "$@"
}

# Dùng cho heredoc: rsh_stdin arg1 arg2 <<'EOF'
rsh_stdin() {
  ssh "${SSH_OPTS_ARRAY[@]}" "$SSH_TARGET" bash -s -- "$@"
}

rsync_rsh() {
  local joined=""
  local opt
  for opt in "${SSH_OPTS_ARRAY[@]}"; do
    joined+=" ${opt}"
  done
  printf 'ssh%s' "$joined"
}

transport_close() {
  [[ ${#SSH_OPTS_ARRAY[@]} -gt 0 ]] || return 0
  ssh "${SSH_OPTS_ARRAY[@]}" -O exit "$SSH_TARGET" >/dev/null 2>&1 || true
}

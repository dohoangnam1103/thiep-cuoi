# Deploy thiepmungonline lên Mini PC

Quy trình deploy web app lên Mini PC (chạy sau Cloudflare Tunnel). Xem thêm
[cloudflare-deploy.md](./cloudflare-deploy.md) cho phần DNS/tunnel.

## TL;DR

```bash
./scripts/deploy-minipc.sh
```

Script tự làm: rsync source → build image `linux/amd64` trên Mac → stream image
sang Mini PC → restart container web + tunnel → healthcheck LAN + public.

## Vì sao build trên Mac?

- Mac (Apple Silicon, arm64) build nhanh hơn Mini PC nhiều.
- Nhưng Mini PC là **x86_64**, nên bắt buộc build với `--platform linux/amd64`
  (buildx / QEMU) rồi mới stream sang, tránh lỗi kiến trúc.
- Mini PC **không build lại** (`--no-build`), chỉ nạp image đã có → deploy nhanh,
  không ngốn tài nguyên Mini PC.

## Yêu cầu

- Docker Desktop trên Mac (script tự mở nếu chưa chạy).
- SSH tới Mini PC qua alias `minipc` (đã cấu hình trong `~/.ssh/config` →
  `ssh.hoangnam.cloud`).
- `zstd` ở cả 2 máy (có sẵn; script tự fallback sang `gzip` nếu thiếu).

## Các bước script thực hiện

1. **Rsync source** lên `~/apps/thiepmungonline/releases/current/` trên Mini PC.
   Loại trừ `node_modules`, `.next`, `.git`, `.env*`, DB, uploads. **Không đụng**
   `.env` và `data/` trên Mini PC.
2. **Build** `thiepmungonline-web:latest` cho `linux/amd64` trên Mac.
3. **Stream** image qua SSH: `docker save | zstd | ssh 'zstd -d | docker load'`.
4. **Restart** trên Mini PC: `docker compose up -d --no-build --no-deps web`, chờ
   `127.0.0.1:3211` trả 200, rồi `up -d tunnel`.
5. **Verify** `https://thiepmungonline.com` trả 200.

## Biến môi trường ghi đè

| Biến | Mặc định | Ý nghĩa |
|------|----------|---------|
| `REMOTE_HOST` | `minipc` | SSH host/alias |
| `REMOTE_APP_DIR` | `/home/namdo/apps/thiepmungonline` | Thư mục app trên Mini PC |
| `WEB_IMAGE` | `thiepmungonline-web:latest` | Tên image |
| `WEB_PLATFORM` | `linux/amd64` | Kiến trúc build |
| `PUBLIC_URL` | `https://thiepmungonline.com` | URL healthcheck cuối |
| `WEB_PORT` | `3211` | Cổng LAN app trên Mini PC |

Ví dụ deploy sang host khác:

```bash
REMOTE_HOST=192.168.0.77 PUBLIC_URL=https://staging.example.com ./scripts/deploy-minipc.sh
```

## Bố cục trên Mini PC

```
~/apps/thiepmungonline/
├── docker-compose.yml          # web (build từ releases/current) + tunnel
├── .env                        # secrets runtime (KHÔNG bị rsync ghi đè)
├── data/                       # SQLite prod.db (KHÔNG bị rsync ghi đè)
└── releases/current/           # source đã rsync từ Mac
```

- `web`: Next.js standalone, publish `127.0.0.1:3211 -> 3000`.
- `tunnel`: `cloudflared` chạy bằng token (tunnel `82b89851`, cùng account zone).

## Rollback nhanh

Image cũ vẫn nằm trong Docker Mini PC cho tới khi bị dọn. Xem tag:

```bash
ssh minipc 'docker images thiepmungonline-web'
```

Nếu cần, retag image cũ thành `:latest` rồi `docker compose up -d --no-build web`.
Cách chắc ăn hơn: `git checkout` commit tốt trước đó trên Mac rồi chạy lại
`./scripts/deploy-minipc.sh`.

## Sự cố thường gặp

- **Public trả 530**: tunnel không tới được origin hoặc DNS trỏ nhầm tunnel khác
  account. Xem mục ⚠️ trong [cloudflare-deploy.md](./cloudflare-deploy.md#5-cấu-hình-dns-hiện-tại-đã-xác-minh).
- **Web LAN không lên 200**: xem log `ssh minipc 'docker logs --tail 200 thiepmungonline-web'`.
- **Build lỗi kiến trúc**: đảm bảo `docker buildx` dùng `--platform linux/amd64`.

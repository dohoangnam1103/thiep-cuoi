# Deploy thiepmungonline lên Mini PC

Quy trình deploy web app lên Mini PC (chạy sau Cloudflare Tunnel). Xem thêm
[cloudflare-deploy.md](./cloudflare-deploy.md) cho phần DNS/tunnel.

## TL;DR

```bash
./scripts/deploy-minipc.sh
```

Script tự làm: xác minh đúng Mini PC → rsync source → backup DB/uploads → build
image native trên Mini PC → chạy các Prisma migration còn thiếu → gắn
version/rollback tag → restart riêng web → kiểm tra LAN, canonical, database và
URL public.

## Vì sao build native trên Mini PC?

- Mini PC là **x86_64**, nên build native tránh QEMU và lỗi native module khác
  kiến trúc từ Mac Apple Silicon.
- BuildKit và Turbopack cache được giữ trên Mini PC, nên các lần deploy sau chỉ
  biên dịch phần thay đổi.
- Mỗi image có tag theo `DEPLOYMENT_ID`; image đang chạy được giữ thêm một tag
  rollback trước khi promote bản mới.

## Yêu cầu

- SSH tới Mini PC qua alias `minipc` (đã cấu hình trong `~/.ssh/config` →
  `ssh.hoangnam.cloud`).
- Docker Buildx trên Mini PC.
- Python 3 trên Mini PC để tạo SQLite online backup và chạy `quick_check`.

## Các bước script thực hiện

1. **Rsync source** lên `~/apps/thiepmungonline/releases/current/` trên Mini PC.
   Loại trừ `node_modules`, `.next`, `.git`, `.env*`, DB, uploads. **Không đụng**
   `.env` và `data/` trên Mini PC.
2. **Backup** SQLite bằng online-backup API, chuyển ảnh editor legacy khỏi writable
   layer vào `data/editor-uploads`, rồi archive ảnh editor và thư viện ảnh/video
   do khách đóng góp trước deploy.
3. **Build native** image versioned trên Mini PC với `NEXT_DEPLOYMENT_ID` và
   `NEXT_PUBLIC_SITE_URL` được đóng vào build.
4. **Migrate database** bằng chính builder image của revision vừa build. Migration
   chạy sau backup và trước khi thay container; lỗi migration sẽ dừng deploy.
5. **Seed danh sách nhạc** từ `prisma/tracks.json` nếu bảng `Track` đang trống.
   Bước này tự bỏ qua khi production đã có nhạc nên không ghi đè dữ liệu đang dùng.
6. **Promote + restart** riêng service web; tự rollback nếu container không
   healthy, chạy sai image, canonical sai domain hoặc database `quick_check` lỗi.
7. **Verify** trang chủ và một demo trên URL public đều trả 200.

## Biến môi trường ghi đè

| Biến | Mặc định | Ý nghĩa |
|------|----------|---------|
| `REMOTE_HOST` | `minipc` | SSH host/alias |
| `EXPECTED_REMOTE_IP` | `192.168.0.57` | Chặn deploy nhầm host |
| `REMOTE_APP_DIR` | `/home/namdo/apps/thiepmungonline` | Thư mục app trên Mini PC |
| `WEB_IMAGE` | `thiepmungonline-web:latest` | Tên image |
| `WEB_PLATFORM` | `linux/amd64` | Kiến trúc build |
| `PUBLIC_URL` | `https://thiepmungonline.com` | URL healthcheck cuối |
| `WEB_PORT` | `3211` | Cổng LAN app trên Mini PC |
| `DEPLOYMENT_ID` | UTC timestamp | Tag image và cache-bust Next.js |

Ví dụ deploy sang host khác:

```bash
REMOTE_HOST=192.168.0.77 PUBLIC_URL=https://staging.example.com ./scripts/deploy-minipc.sh
```

## Secrets runtime trên Mini PC

`.env` trên Mini PC không bị rsync ghi đè. Google SSO cần thêm:

- `AUTH_SECRET` — Auth.js secret dùng cho OAuth session state.
- `GOOGLE_CLIENT_ID` — OAuth client ID từ Google Cloud Console.
- `GOOGLE_CLIENT_SECRET` — OAuth client secret từ Google Cloud Console.

Google OAuth callback URLs phải gồm:

- Local: `http://localhost:3000/api/auth/callback/google`
- Production: `https://thiepmungonline.com/api/auth/callback/google`

## Bố cục trên Mini PC

```
~/apps/thiepmungonline/
├── docker-compose.yml          # web (build từ releases/current) + tunnel
├── .env                        # secrets runtime (KHÔNG bị rsync ghi đè)
├── data/                       # SQLite prod.db (KHÔNG bị rsync ghi đè)
│   ├── guest-media/            # Ảnh/video khách đóng góp, dùng chung volume /app/data
│   └── editor-uploads/          # Ảnh do chủ thiệp tải trong editor
└── releases/current/           # source đã rsync từ Mac
```

- `web`: Next.js standalone, publish `127.0.0.1:3211 -> 3000`.
- `tunnel`: `cloudflared` chạy bằng token (tunnel `82b89851`, cùng account zone).

## Rollback nhanh

Ngay trước khi promote, script gắn image cũ thành
`thiepmungonline-web:rollback-<DEPLOYMENT_ID>`. Xem tag:

```bash
ssh minipc 'docker images thiepmungonline-web'
```

Nếu cần, retag image rollback thành `:latest` rồi chạy
`docker compose up -d --no-build --no-deps --force-recreate web`.

## Sự cố thường gặp

- **Public trả 530**: tunnel không tới được origin hoặc DNS trỏ nhầm tunnel khác
  account. Xem mục ⚠️ trong [cloudflare-deploy.md](./cloudflare-deploy.md#5-cấu-hình-dns-hiện-tại-đã-xác-minh).
- **Web LAN không lên 200**: xem log `ssh minipc 'docker logs --tail 200 thiepmungonline-web'`.
- **Build lỗi kiến trúc**: đảm bảo `docker buildx` dùng `--platform linux/amd64`.

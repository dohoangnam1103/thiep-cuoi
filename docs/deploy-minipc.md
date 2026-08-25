# Deploy thiepmungonline lên Mini PC

Quy trình deploy web app lên Mini PC (chạy sau Cloudflare Tunnel). Xem thêm
[cloudflare-deploy.md](./cloudflare-deploy.md) cho phần DNS/tunnel.

## TL;DR

```bash
# Lần đầu (idempotent): thêm bind-mount public/ vào compose trên Mini PC.
npm run deploy:setup

# Deploy nhanh (khuyến nghị): build trên Mac, lắp image trên Mini PC. ~60-90s.
npm run deploy

# Thử pipeline mà không đụng production: dựng image mới rồi chạy container tạm
# ở cổng 3299, verify xong tự xoá.
npm run deploy:smoke

# Đường cũ, giữ làm fallback.
npm run deploy:legacy
```

## Deploy nhanh (`scripts/deploy-fast.sh`)

Đây là đường mặc định nên dùng. Số đo trên chính setup này:

| Bước | Thời gian |
|------|-----------|
| Xác minh host | 1s |
| Build Next (Mac) ‖ rsync source ‖ backup (song song) | ~29s |
| Rsync artifact (105MB, delta) | ~9s |
| Migration preflight | <1s |
| Lắp image trên Mini PC (cache ấm) | ~16s |
| Promote + healthcheck + verify | ~20-30s |
| **Tổng (cache ấm)** | **~60-90s** |

Lần deploy đầu tiên mất thêm ~5 phút vì `npm ci` + `npm prune` chạy lần đầu
trên Mini PC. Sau đó hai stage này nằm trong layer cache và chỉ chạy lại khi
`package-lock.json` đổi.

### Bốn thay đổi tạo ra khác biệt

1. **Đi thẳng LAN, không qua Cloudflare tunnel.** Alias `minipc` trong
   `~/.ssh/config` dùng `cloudflared access ssh`, nên mọi byte rsync/docker phải
   ra Internet rồi quay lại LAN. Đo được **<0.33 MB/s qua tunnel so với ~21 MB/s
   khi nối thẳng `192.168.0.57`** — chênh khoảng 65 lần. Script tự dò LAN trước,
   không thấy thì rơi về tunnel để vẫn deploy được khi ở ngoài mạng.
2. **Compile trên Mac, không compile trên Mini PC.** Mini PC là i5-9500T, RAM
   7GB nhưng chỉ còn ~2.6GB trống và đã swap 3GB vì đang chạy 19 container.
   Build Next ở đó phải thrash swap. Trên M1 Max với Turbopack cache ấm: 35s.
3. **Chỉ chuyển 105MB artifact, không chuyển image.** `BUILD_ON=local` cũ dùng
   `docker save | ssh docker load`, tức 1.84GB mỗi lần deploy dù thực tế chỉ
   ~83MB đổi. Đường mới rsync `.next` + `static` + `server.js` sang
   `releases/current/.next-prebuilt/` rồi để Mini PC chạy COPY. `node_modules`
   amd64 nằm sẵn trong layer cache của Mini PC nên không bao giờ đi qua mạng.
4. **`public/` (539MB) ra khỏi image.** Nó được bind-mount read-only từ
   `releases/current/public`, thư mục mà rsync đã cập nhật sẵn. Image giảm từ
   ~2.5GB xuống ~2.0GB, và thêm asset mới chỉ tốn một delta rsync. Đổi lại phải
   chạy `npm run deploy:setup` một lần để thêm mount vào compose; deploy sẽ
   dừng ngay nếu thiếu mount.

### Rào an toàn

Giữ nguyên toàn bộ của script cũ: xác minh đúng IP production, backup DB +
uploads trước khi đổi gì, migration preflight fail-closed, rollback tag và tự
rollback khi lỗi, healthcheck, kiểm tra container chạy đúng image, kiểm tra
deployment ID + canonical, SQLite `quick_check`, verify URL public.

Thêm mới:

- **Kiểm tra asset public.** Vì `public/` giờ là bind-mount, script fetch thật
  một asset (`/chungdoi/icon-v2.png`) và rollback nếu không trả 200. Đây là lưới
  an toàn cho trường hợp mount thiếu hoặc sai đường dẫn.
- **`--provenance=false` khi build.** Mặc định BuildKit bọc image trong một
  manifest list kèm attestation; khi đó `docker image inspect --format '{{.Id}}'`
  trả digest của manifest list và không bao giờ khớp `{{.Image}}` của container,
  làm bước "chạy đúng image" fail và rollback oan.
- **Backup uploads bằng hardlink snapshot** (`cp -al`) thay cho `tar -czf` 78MB
  mỗi deploy. Ảnh editor đặt tên theo uuid và không bị ghi đè nên hardlink an
  toàn, chỉ tốn chỗ cho file mới. Kèm retention 10 bản
  (`data/backups` từng phình lên 3.6GB trên đĩa đã dùng 93%).

### Biến môi trường

| Biến | Mặc định | Ý nghĩa |
|------|----------|---------|
| `REMOTE_LAN_IP` | `192.168.0.57` | IP LAN Mini PC, thử trước |
| `REMOTE_LAN_USER` | `namdo` | User SSH trên LAN |
| `REMOTE_TUNNEL_ALIAS` | `minipc` | Alias fallback khi không cùng mạng |
| `SMOKE_ONLY` | `0` | `1` để test image mà không promote |
| `SMOKE_PORT` | `3299` | Cổng container smoke test |
| `SKIP_BUILD` | `0` | `1` để dùng lại `.next` có sẵn |
| `BACKUP_RETENTION` | `10` | Số bản backup giữ lại |
| `VERIFY_ASSET` | `/chungdoi/icon-v2.png` | Asset dùng để kiểm tra mount public |

## Đường cũ (`scripts/deploy-minipc.sh`)

Vẫn dùng được, giữ làm fallback khi Mini PC không nhận artifact prebuilt.

```bash
# Mặc định: build native trên Mini PC.
./scripts/deploy-minipc.sh

# Build image linux/amd64 trên MacBook rồi stream image qua SSH sang Mini PC.
BUILD_ON=local ./scripts/deploy-minipc.sh
```

Script tự làm: xác minh đúng Mini PC → rsync source → backup DB/uploads → build
image (native trên Mini PC hoặc cross-build trên MacBook) → chạy các Prisma migration còn thiếu → gắn
version/rollback tag → restart riêng web → kiểm tra LAN, canonical, database và
URL public.

## Chọn nơi build

- Mặc định `BUILD_ON=remote`: Mini PC là **x86_64**, nên build native tránh QEMU
  và tái dùng BuildKit/Turbopack cache trên VPS.
- Với `BUILD_ON=local`, Next.js được build native trên MacBook trước. Docker
  Desktop chỉ đóng gói artifact với runtime dependencies `linux/amd64`, nhờ đó
  tránh chạy Next/Node 24 dưới QEMU. Image được kiểm tra kiến trúc rồi stream
  qua SSH bằng `docker save | ssh minipc docker load`. Không tạo file tar trên
  VPS.
- Khi có Prisma migration pending, local mode build và chuyển thêm builder image
  tạm thời để migration vẫn chạy trực tiếp cạnh database production trước khi
  web được restart.
- Mỗi image có tag theo `DEPLOYMENT_ID`; image đang chạy được giữ thêm một tag
  rollback trước khi promote bản mới.
- Nếu bước đóng gói `linux/amd64` cục bộ gặp lỗi QEMU, chạy lại không có
  `BUILD_ON=local` để build native hoàn toàn trên Mini PC; vẫn giữ nguyên backup,
  migration preflight và rollback của script.

## Yêu cầu

- SSH tới Mini PC qua alias `minipc` (đã cấu hình trong `~/.ssh/config` →
  `ssh.hoangnam.cloud`).
- Docker Buildx trên Mini PC khi dùng `BUILD_ON=remote`; Docker Desktop/Buildx
  có builder `desktop-linux` trên MacBook khi dùng `BUILD_ON=local`.
- Python 3 trên Mini PC để tạo SQLite online backup và chạy `quick_check`.

## Các bước script thực hiện

1. **Rsync source** lên `~/apps/thiepmungonline/releases/current/` trên Mini PC.
   Loại trừ `node_modules`, `.next`, `.git`, `.env*`, DB, uploads. **Không đụng**
   `.env` và `data/` trên Mini PC.
2. **Backup** SQLite bằng online-backup API, chuyển ảnh editor legacy khỏi writable
   layer vào `data/editor-uploads`, rồi archive ảnh editor và thư viện ảnh/video
   do khách đóng góp trước deploy.
3. **Build image versioned** trên Mini PC (mặc định) hoặc build Next native trên
   MacBook, sau đó đóng gói dependencies `linux/amd64` và stream qua SSH, với
   `NEXT_DEPLOYMENT_ID` và `NEXT_PUBLIC_SITE_URL` được đóng vào build.
   Local mode chạy thêm smoke test `better-sqlite3` và `sharp` ngay trên Mini PC
   trước khi image có thể được promote.
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
| `BUILD_ON` | `remote` | `remote` để build tại VPS, `local` để build tại MacBook |
| `LOCAL_BUILDER` | `desktop-linux` | Tên Docker Buildx builder khi `BUILD_ON=local` |
| `PUBLIC_URL` | `https://thiepmungonline.com` | URL healthcheck cuối |
| `WEB_PORT` | `3211` | Cổng LAN app trên Mini PC |
| `DEPLOYMENT_ID` | UTC timestamp | Tag image và cache-bust Next.js |

Ví dụ deploy sang host khác:

```bash
REMOTE_HOST=192.168.0.77 PUBLIC_URL=https://staging.example.com ./scripts/deploy-minipc.sh
```

Nếu cần build local cho staging:

```bash
BUILD_ON=local REMOTE_HOST=192.168.0.77 PUBLIC_URL=https://staging.example.com \
  ./scripts/deploy-minipc.sh
```

## Secrets runtime trên Mini PC

`.env` trên Mini PC không bị rsync ghi đè. Google SSO cần thêm:

- `AUTH_SECRET` — Auth.js secret dùng cho OAuth session state.
- `GOOGLE_CLIENT_ID` — OAuth client ID từ Google Cloud Console.
- `GOOGLE_CLIENT_SECRET` — OAuth client secret từ Google Cloud Console.

Google OAuth callback URLs phải gồm:

- Local: `http://localhost:3000/api/auth/callback/google`
- Production: `https://thiepmungonline.com/api/auth/callback/google`

AI Template Studio trong `/admin/template-studio` dùng API OpenAI-compatible. Không có key,
trang vẫn chạy với bộ preset local; để bật AI, thêm vào `.env`:

```dotenv
OPENAI_API_KEY=sk-xxx
AI_MODEL=gpt-4o-mini
# Tùy chọn cho provider OpenAI-compatible khác:
# AI_BASE_URL=https://provider.example/v1
```

Có thể dùng `AI_API_KEY` thay cho `OPENAI_API_KEY`. Admin cũng có thể cấu hình
Base URL, model và API key ở mục **Kết nối AI** cuối `/admin/template-studio`;
cấu hình trong DB được ưu tiên hơn `.env`. API key trong DB được mã hóa AES-256-GCM
bằng khóa dẫn xuất từ `SESSION_SECRET`, vì vậy không đổi `SESSION_SECRET` khi vẫn cần
dùng key đã lưu. Không đưa key vào source hoặc biến `NEXT_PUBLIC_*`.

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

## Email nhắc thanh toán (Resend)

Gửi email nhắc user khi thiệp còn 24h cuối dùng thử (free trial 3 ngày).

1. Lấy API key tại [resend.com](https://resend.com) và thêm vào `.env` của
   container (KHÔNG commit key vào git):

   ```
   RESEND_API_KEY=re_xxx
   ```

   Domain `thiepmungonline.com` phải đã verify trên Resend (email gửi từ
   `noreply@thiepmungonline.com`).

2. `scripts/deploy-fast.sh` tự cài cron này, không cần làm tay. Cron mỗi 9h sáng
   gọi HTTP route của app:

   ```bash
   0 9 * * *  /home/namdo/apps/thiepmungonline/releases/current/scripts/cron-hit-endpoint.sh /api/cron/trial-reminders >> /home/namdo/apps/thiepmungonline/trial-reminders.log 2>&1
   ```

   Chạy thử ngay một lần:

   ```bash
   ssh minipc '/home/namdo/apps/thiepmungonline/releases/current/scripts/cron-hit-endpoint.sh /api/cron/trial-reminders'
   ```

   > ⚠️ Bản cũ của tài liệu này ghi
   > `docker exec thiepmungonline-web npm run reminders:trial`. Lệnh đó **chưa bao
   > giờ chạy được**: image production là Next standalone build, trong container
   > không có `package.json` nên npm thoát ngay với `ENOENT`. Hệ quả là tới
   > 26/8/2026 chưa khách nào nhận được email nhắc. Đừng quay lại dạng
   > `docker exec ... npm run ...` cho bất kỳ việc định kỳ nào.

   Script tự quét thiệp `paid=false`, đã publish, chưa gửi nhắc, hết hạn trong
   24h tới; gửi xong đánh dấu `reminderSentAt` để không gửi trùng. Gửi lỗi thì
   giữ nguyên mốc để lần sau retry.

## Sự cố thường gặp

- **Public trả 530**: tunnel không tới được origin hoặc DNS trỏ nhầm tunnel khác
  account. Xem mục ⚠️ trong [cloudflare-deploy.md](./cloudflare-deploy.md#5-cấu-hình-dns-hiện-tại-đã-xác-minh).
- **Web LAN không lên 200**: xem log `ssh minipc 'docker logs --tail 200 thiepmungonline-web'`.
- **Email nhắc không gửi**: kiểm tra `RESEND_API_KEY` trong container
  (`docker exec thiepmungonline-web printenv RESEND_API_KEY`) và log
  `/var/log/trial-reminders.log`.
- **Khách báo đã chuyển tiền mà thiệp vẫn ẩn**: mở `/admin/payments`, ca không tự
  kích hoạt được sẽ có nhãn **Cần đối soát** kèm lý do. Nếu không thấy nhãn nào
  thì khả năng cao là webhook payOS bị mất — chạy đối soát tay
  `ssh minipc '/home/namdo/apps/thiepmungonline/releases/current/scripts/cron-hit-endpoint.sh /api/cron/payos-reconcile'`
  và xem log `payos-reconcile.log`. Chi tiết trong
  [deploy-payment.md](./deploy-payment.md).
- **Build lỗi kiến trúc**: đảm bảo `docker buildx` dùng `--platform linux/amd64`.

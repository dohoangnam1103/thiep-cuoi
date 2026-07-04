# Deploy cổng thanh toán (VietQR + Casso Webhook V2)

Checklist bật cổng thanh toán trên production (minipc). Code app đã sẵn sàng;
các bước dưới là cấu hình host + bên thứ ba, phải làm tay.

## Tổng quan luồng

1. Khách vào `/dashboard/[id]/thanh-toan` → thấy QR VietQR (MB Bank) + mã đơn `CDxxxxxx`.
2. Khách chuyển khoản đúng số tiền, nội dung CK chứa mã đơn.
3. Casso đọc biến động số dư MB → POST **Webhook V2** tới `/api/casso/webhook`.
4. App verify chữ ký HMAC-SHA512 → match mã đơn → set `Invitation.paid = true`.
5. Thiệp published miễn phí 7 ngày; quá hạn chưa trả → chặn, hiện trang gia hạn.

Cấu hình ngân hàng nằm trong `src/lib/payment.ts`: MB Bank, BIN `970422`,
STK `0357596289`, tên `DO HOANG NAM`, giá `BASE_PRICE = 150000`, `FREE_TRIAL_DAYS = 7`.

## 1. Env production trên minipc

`.env` trên minipc KHÔNG bị rsync ghi đè (xem [deploy-minipc.md](./deploy-minipc.md)).
SSH vào minipc, sửa `/home/namdo/apps/thiepmungonline/.env`, thêm:

```
CASSO_WEBHOOK_TOKEN="<Key bảo mật copy từ Casso Webhook V2>"
NEXT_PUBLIC_SITE_URL="https://thiepmungonline.com"
```

- `CASSO_WEBHOOK_TOKEN` = "Key bảo mật" (checksum key) trong màn cấu hình Webhook V2
  của Casso — KHÔNG phải Webhook URL. App dùng key này để verify chữ ký; sai key →
  mọi webhook bị từ chối 401 (tiền vào nhưng thiệp không tự kích hoạt).
- Restart container web sau khi sửa env: `docker compose up -d --no-deps web`.

## 2. Migrate DB production

Migration `20260704031005_add_payment_voucher` thêm bảng `Payment`, `Voucher` và
cột `Invitation.paid` / `publishedAt`. Runner image KHÔNG có prisma CLI, nên chạy
qua image `builder` (xem [prod-db-ops](../CLAUDE.md) / memory):

```bash
# trên minipc, sau khi deploy image mới
cd /home/namdo/apps/thiepmungonline
cp data/prod.db data/prod.db.bak            # backup trước khi migrate

docker build --target builder -t thiepmungonline-migrate .
docker run --rm -v "$PWD/data:/app/data" \
  -e DATABASE_URL=file:/app/data/prod.db \
  thiepmungonline-migrate npx prisma migrate deploy
```

Dùng `migrate deploy` (chỉ apply pending, an toàn production) — KHÔNG `migrate dev`.

Sau migrate, kiểm owner file db là uid 1000 (`namdo`), nếu là `root:root` thì
server action ghi DB sẽ 500 (`SQLITE_READONLY`). Fix không cần sudo:

```bash
cp data/prod.db data/prod.db.tmp && rm data/prod.db && mv data/prod.db.tmp data/prod.db
```

Lưu ý: trang đọc (SSG) vẫn 200 dù schema lệch — lỗi chỉ lộ khi bấm nút ghi, nên
đừng chỉ dựa vào healthcheck load trang.

## 3. Hoàn tất cấu hình Casso Webhook V2

Trong màn Webhook V2 của Casso (flow.casso.vn):
- **Webhook URL**: `https://thiepmungonline.com/api/casso/webhook`
- **Key bảo mật**: dùng đúng giá trị đã đặt vào `CASSO_WEBHOOK_TOKEN` ở bước 1.
- Bấm **Tiếp tục** / lưu để kích hoạt.

## 4. Test 1 giao dịch thật

1. Vào `/dashboard/[id]/thanh-toan` của 1 thiệp chưa trả → quét QR, chuyển đúng số tiền.
2. Chờ vài giây, trang tự poll `/api/payment/[code]/status` → chuyển "Thanh toán thành công" rồi redirect.
3. Kiểm `Invitation.paid = 1` trong DB, và mở `/thiep/[slug]` thấy thiệp hiển thị bình thường.

Nếu webhook không bắn: xem log `docker logs --tail 200 thiepmungonline-web`, kiểm
Casso có gọi tới không, và `CASSO_WEBHOOK_TOKEN` có khớp Key bảo mật không.

## Ghi chú kỹ thuật (đã verify local)

- Mã đơn theo regex `CD[A-Z2-7]{6}` (đúng 6 ký tự base32 sau `CD`). `genOrderCode()`
  sinh đúng dạng; webhook bỏ qua giao dịch không chứa mã hợp lệ (vẫn trả 200 để
  Casso không retry).
- Chữ ký V2: header `X-Casso-Signature` = `t=<timestamp>,v1=<hmac>`; HMAC-SHA512 của
  `timestamp + "." + JSON.stringify(<body sort key đệ quy>)` với checksum key.
  Implement tại `verifyCassoSignature()` trong `src/lib/payment.ts`.
- Webhook V2 gửi `data` là **object đơn** (không phải array như V1); field dùng:
  `description`, `amount`, `id`.
- Voucher: giảm số tiền cố định (`amountOff`), tăng `usedCount` khi thanh toán thành công.

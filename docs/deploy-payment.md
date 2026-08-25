# Deploy cổng thanh toán payOS

Luồng thanh toán production dùng payOS để tạo VietQR động, nhận webhook và đối
soát trạng thái đơn. Các Payment cũ của Casso vẫn được giữ nguyên trong database.

## Tổng quan luồng

1. Khách vào `/dashboard/[id]/thanh-toan`.
2. App tạo `Payment` nội bộ và gọi API payOS tạo Payment Link.
3. payOS trả tài khoản nhận tiền, QR động, `paymentLinkId` và `orderCode`.
4. Khách quét QR, tiền về trực tiếp tài khoản MB đã liên kết trên payOS.
5. payOS POST webhook tới `/api/payos/webhook`.
6. App verify chữ ký HMAC-SHA256, đánh dấu `Payment.status = paid` và
   `Invitation.paid = true`.
7. Trang thanh toán poll mỗi 4 giây. Nếu webhook bị trễ, status API gọi payOS để
   đối soát trực tiếp và tự sửa trạng thái.
8. Cron `reconcile:payos` chạy mỗi 2 tiếng, hỏi lại payOS trạng thái các đơn chưa
   chốt. Đây là lưới an toàn cho bước 5 và 7: webhook có thể mất, còn poll ở bước
   7 chỉ chạy khi khách còn mở tab.

## Ba tuyến bảo vệ luồng tiền

Ba tuyến này bù cho nhau, đừng bỏ tuyến nào khi sửa code sau này.

| Tuyến | Chạy khi nào | Bịt được gì |
| --- | --- | --- |
| Webhook `/api/payos/webhook` | payOS gọi ngay khi tiền về | Đường chính, nhanh nhất |
| Poll `/api/payment/[code]/status` | Khách còn mở trang thanh toán | Webhook trễ |
| Cron `reconcile:payos` | Mỗi 2 tiếng | Webhook **mất** và khách đã đóng tab |

Không có tuyến thứ ba thì mất webhook là mất luôn: tiền vào tài khoản MB,
`Payment.status` vẫn `pending`, thiệp vẫn ẩn, và không ai biết vì trang quản trị
chỉ đọc database.

Mọi tuyến đều đi qua `settlePayment` trong `src/lib/payment-service.ts`, nên luật
ghi nhận thanh toán chỉ tồn tại ở một chỗ.

## Ca cần đối soát tay

Có những ca tiền đã về mà hệ thống không được phép tự kích hoạt thiệp: khách trả
thiếu, admin đổi giá đúng lúc khách chuyển tiền, hoặc thiệp đã được một đơn khác
kích hoạt (khoản này cần hoàn).

Các ca đó ghi vào bảng `PaymentReconciliation` và hiện lên `/admin/payments`:
banner đỏ đếm số ca ở đầu trang, nhãn **Cần đối soát** kèm lý do trong cột Trạng
thái. Trước đây chúng chỉ đi ra `console.warn` trong log container, tức là không
ai biết — mà đây đúng là những ca khách đã trả tiền và đang chờ.

Bảng là append-only và không có `resolvedAt`: đơn nào xử lý xong sẽ tự mang
`status = "paid"`, và nhãn đọc theo đó nên tự hết báo động.

Webhook payOS gửi lại cho một đơn đã ghi nhận **không** sinh ca đối soát —
`classifySettlementFailure` phân biệt ca lành tính với sự cố, vì một trang quản
trị đầy báo động giả thì không ai còn nhìn nó nữa.

## 1. Tạo kênh thanh toán payOS

Trong `my.payos.vn`:

1. Xác thực tài khoản/tổ chức.
2. Liên kết tài khoản ngân hàng nhận tiền.
3. Tạo kênh Website tên `Thiệp Mừng Online`.
4. Lưu ba khóa `Client ID`, `API Key`, `Checksum Key`.

Không commit hoặc gửi ba khóa này vào source control.

## 2. Env production trên Mini PC

Thêm vào `/home/namdo/apps/thiepmungonline/.env`:

```dotenv
PAYMENT_PROVIDER=payos
PAYOS_CLIENT_ID="<Client ID>"
PAYOS_API_KEY="<API Key>"
PAYOS_CHECKSUM_KEY="<Checksum Key>"
NEXT_PUBLIC_SITE_URL="https://thiepmungonline.com"
```

`PAYMENT_PROVIDER` mặc định là `casso` để các môi trường cũ/test không tự gọi
payOS. Production bắt buộc đặt thành `payos`.

## 3. Webhook

Cấu hình URL:

```text
https://thiepmungonline.com/api/payos/webhook
```

payOS sẽ gửi một webhook mẫu để xác nhận URL. Route phải trả HTTP 2xx cho mẫu có
chữ ký hợp lệ kể cả khi `orderCode` mẫu không tồn tại trong database.

## 3b. Cron đối soát

`scripts/deploy-fast.sh` tự cài crontab trên host, không cần làm tay:

```bash
23 */2 * * * /home/namdo/apps/thiepmungonline/releases/current/scripts/cron-hit-endpoint.sh /api/cron/payos-reconcile >> /home/namdo/apps/thiepmungonline/payos-reconcile.log 2>&1
```

> **Không dùng `docker exec ... npm run ...` cho bất kỳ việc định kỳ nào.** Image
> production là Next standalone build: trong container chỉ có `server.js`,
> `node_modules`, `public` và `data`. Không có `package.json`, `src/`, `scripts/`
> hay `tsx`, nên mọi lệnh `npm run` trong container đều chết với
> `ENOENT: /app/package.json`. Việc định kỳ phải đi qua HTTP route của app đang
> chạy, và `scripts/cron-hit-endpoint.sh` lo phần đọc `CRON_SECRET` từ `.env` cùng
> việc tra cổng container.

Chạy thử ngay một lượt:

```bash
ssh minipc '/home/namdo/apps/thiepmungonline/releases/current/scripts/cron-hit-endpoint.sh /api/cron/payos-reconcile'
```

Trên máy dev có source thì chạy trực tiếp được bằng `npm run reconcile:payos`.

Job quét các đơn `provider = payos` còn ghi nhận được (`pending` hoặc
`cancelled`), có `providerOrderCode`, tạo trong 7 ngày gần nhất — tối đa 200 đơn
mỗi lượt, chạy tuần tự. Cửa sổ 7 ngày là vì link payOS hết hạn sau 24h nên tiền
chỉ về được trong 24h đầu; 7 ngày là biên an toàn cho một đợt mất webhook kéo dài
qua cuối tuần. Hằng số ở `src/lib/payos-reconcile.ts`.

Exit code 1 khi có đơn hỏi không được, để log cron nhìn thấy: hỏi payOS thất bại
trên diện rộng nghĩa là lưới an toàn đang không hoạt động.

## 4. Database migration

Migration `20260720180000_add_payos_provider` thêm thông tin provider và Payment
Link nhưng không sửa/xóa Payment Casso cũ.

Migration `20260826120000_add_payment_reconciliation` thêm bảng
`PaymentReconciliation`. Bảng mới hoàn toàn, không đụng tới `Payment`.

Production phải chạy:

```bash
npx prisma migrate deploy
```

Script deploy Mini PC chạy migration sau khi backup SQLite và trước khi restart
container.

## 5. Kiểm thử production

1. Mở một thiệp chưa trả và áp voucher test để số tiền còn 2.000đ.
2. Xác nhận QR hiển thị đúng MB Bank, số tiền và mã `CDxxxxxx`.
3. Chuyển đúng 2.000đ.
4. Trang phải tự chuyển về dashboard trong vài giây.
5. Kiểm tra database: Payment mới có `provider = payos`, `status = paid`, và
   Invitation tương ứng có `paid = 1`.
6. Kiểm tra log webhook không có lỗi chữ ký hoặc lỗi đối soát payOS.

## Ghi chú kỹ thuật

- `orderCode` của payOS là số nguyên an toàn; mã `CDxxxxxx` vẫn dùng làm mô tả
  chuyển khoản và mã hiển thị cho khách.
- Chữ ký tạo link và webhook dùng HMAC-SHA256 với `PAYOS_CHECKSUM_KEY`.
- Khi áp voucher sau khi QR đã được tạo, app tạo Payment Link mới rồi hủy link
  cũ để số tiền trên payOS luôn khớp database.
- Voucher chỉ tăng `usedCount` sau khi giao dịch được xác nhận trả tiền.

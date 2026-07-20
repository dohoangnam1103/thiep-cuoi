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

## 4. Database migration

Migration `20260720180000_add_payos_provider` thêm thông tin provider và Payment
Link nhưng không sửa/xóa Payment Casso cũ.

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

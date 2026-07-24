# Email nhắc thanh toán ngày cuối dùng thử — Design

**Ngày:** 2026-07-24
**Mục tiêu:** Gửi email nhắc user thanh toán khi thiệp còn 1 ngày cuối trong thời gian dùng thử miễn phí (free trial 3 ngày), dùng Resend gói free.

## Bối cảnh

- Trial hiện tại: `trialExpiresAt(publishedAt) = publishedAt + 3 ngày` (`src/lib/trial.ts`).
- Thiệp hết hạn khi `Date.now() >= trialExpiresAt` và `paid = false` (`src/app/thiep/[slug]/page.tsx`).
- `User.email` nullable, `Invitation` có `publishedAt` + `paid`.
- Hiện chưa có logic gửi email nào.

## Luồng tổng quát

Cron trên minipc chạy 9h sáng mỗi ngày → gọi script → quét DB tìm thiệp sắp hết hạn trong 24h → gửi email qua Resend → đánh dấu đã gửi (`reminderSentAt`).

## 1. Data model (migration)

Thêm 1 cột vào `Invitation`:

```prisma
reminderSentAt  DateTime?
```

## 2. Điều kiện chọn thiệp (`src/lib/trial-reminder.ts`)

Gửi mail khi thỏa TẤT CẢ:

- `paid = false`
- `publishedAt != null`
- `reminderSentAt = null`
- `user.email != null`
- Thời điểm hết hạn (`publishedAt + FREE_TRIAL_MS`) nằm trong khoảng `now → now + 24h`.

Tách hàm thuần (pure) chọn/lọc để test được không cần DB.

## 3. Gửi email (`src/lib/email.ts`)

- Client Resend, đọc `RESEND_API_KEY` từ env.
- From: `noreply@thiepmungonline.com` (domain đã verify trên Resend).
- Nội dung tiếng Việt (chỉ tiếng Việt, không đa ngôn ngữ):
  - Chào tên user.
  - Báo hôm nay là ngày cuối dùng thử thiệp "[tên thiệp]".
  - Nút CTA dẫn tới trang thanh toán `/dashboard/[id]/thanh-toan` (absolute URL).
- Template HTML **đẹp**: layout email chuẩn (table-based cho tương thích mail client), màu thương hiệu (hồng/pink), font an toàn, có nút CTA rõ ràng, responsive cơ bản.

## 4. Script cron (`scripts/send-trial-reminders.ts`)

- Quét thiệp thỏa điều kiện → gửi từng cái.
- Set `reminderSentAt = now` sau khi gửi **thành công**.
- Gửi lỗi cái nào → log, KHÔNG set mốc (để lần sau retry), không làm hỏng batch.
- In summary cuối: gửi bao nhiêu, lỗi bao nhiêu, bỏ qua bao nhiêu.
- Chạy bằng `npx tsx`.

## 5. Crontab trên minipc

```
0 9 * * *  cd /path/to/app && npx tsx scripts/send-trial-reminders.ts
```

## 6. Env

Thêm `RESEND_API_KEY` vào `.env` trên server. KHÔNG commit key vào git.

## Xử lý lỗi & edge case

- User không có email → bỏ qua, không tính lỗi.
- Resend fail → log, giữ `reminderSentAt = null` để retry hôm sau.
- Thiệp đã thanh toán giữa chừng → điều kiện `paid = false` tự loại.
- Cron chạy lại trong ngày → `reminderSentAt != null` tự loại, không gửi trùng.

## Ngoài phạm vi (YAGNI)

- Đa ngôn ngữ email (chỉ tiếng Việt).
- Bảng `EmailLog` riêng.
- Nhiều loại mail (chào mừng, biên nhận...).
- Retry tự động trong ngày.

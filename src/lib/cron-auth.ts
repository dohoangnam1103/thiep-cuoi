import { timingSafeEqual } from "node:crypto";

/**
 * Xác thực một request cron bằng `Authorization: Bearer $CRON_SECRET`.
 *
 * Các route cron chạy được việc nặng và ghi vào database, nên chúng phải đóng với
 * người ngoài. So sánh bằng `timingSafeEqual` thay vì `===` để không rò rỉ độ dài
 * hay tiền tố của secret qua thời gian phản hồi.
 *
 * Thiếu `CRON_SECRET` thì từ chối tất cả: một biến môi trường quên set không được
 * biến endpoint thành công khai.
 */
export function isAuthorizedCronRequest(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;

  const header = request.headers.get("authorization") ?? "";
  const expected = `Bearer ${secret}`;
  const received = Buffer.from(header);
  const wanted = Buffer.from(expected);
  // `timingSafeEqual` ném lỗi khi hai buffer khác độ dài, nên phải chặn trước.
  // Việc này có tiết lộ độ dài header, nhưng độ dài không phải phần bí mật.
  if (received.length !== wanted.length) return false;
  return timingSafeEqual(received, wanted);
}

/** Phản hồi chuẩn cho request cron không hợp lệ. */
export function cronUnauthorized(): Response {
  return new Response("Unauthorized", { status: 401 });
}

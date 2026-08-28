import { createHmac, timingSafeEqual } from "node:crypto";

import { absoluteUrl } from "@/lib/site-url";

/**
 * Token cho link đo click trong email nhắc thanh toán.
 *
 * Vì sao phải có một endpoint riêng thay vì chỉ gắn `?utm_source=email` vào link
 * thanh toán: trang `/dashboard/<id>/thanh-toan` bị auth-gate, và `checkoutPath()`
 * trong `src/app/dashboard/[id]/thanh-toan/actions.ts` dựng lại đường dẫn **không
 * kèm query string** khi đẩy khách sang `/login`. Khách chưa đăng nhập bấm từ mail
 * sẽ mất sạch tham số, tức là mất đúng nhóm cần đo nhất. Một endpoint công khai
 * đứng trước cửa auth ghi được click trước khi chuyện đó xảy ra.
 *
 * Token **bắt buộc phải tất định** từ `dedupeKey`, không được random hay theo thời
 * gian. `EmailDelivery.html` là bất biến và mọi lần retry đều phát lại đúng payload
 * đó dưới cùng một idempotency key của Resend (xem `src/lib/email-delivery.ts`);
 * một token đổi theo mỗi lần dựng mail sẽ khiến bản retry mang token của lần đầu,
 * và tệ hơn là làm Resend trả 409 vì payload khác.
 *
 * Chữ ký HMAC ở đây không để giữ bí mật — `invitationId` vốn đã nằm trong URL đích.
 * Nó để không ai giả được click cho thiệp bất kỳ: nếu token là plaintext thì chỉ cần
 * một vòng lặp là bơm được số liệu chuyển đổi thành vô nghĩa.
 */

const CLICK_PATH = "/api/email/click";

/** Tham số mang token. Ngắn vì nó nằm trong URL hiển thị trong email. */
export const CLICK_TOKEN_PARAM = "t";

/**
 * Số ký tự base64url của chữ ký, tương đương 96 bit đầu của HMAC-SHA256.
 *
 * Không cần trọn 256 bit: kẻ tấn công không có oracle nào ngoài việc thử từng URL
 * qua mạng, nên 96 bit đã vượt xa ngưỡng đoán được, trong khi token ngắn hơn thì
 * ít bị mail client cắt dòng làm hỏng.
 */
const SIGNATURE_LENGTH = 16;

function base64url(value: Buffer | string): string {
  return Buffer.from(value).toString("base64url");
}

function sign(dedupeKey: string, secret: string): string {
  return createHmac("sha256", secret).update(dedupeKey).digest("base64url").slice(
    0,
    SIGNATURE_LENGTH,
  );
}

/**
 * Secret dùng để ký, hoặc `null` khi chưa cấu hình.
 *
 * Cố ý là biến môi trường **không bắt buộc**: thiếu nó thì mất số liệu click, còn
 * ném lỗi ở đây sẽ làm sập cả lượt cron và khách không nhận được email nhắc nào.
 * Mất analytics nhẹ hơn mất doanh thu, nên đường suy giảm là bỏ tracking chứ không
 * phải bỏ email.
 */
export function emailClickSecret(): string | null {
  const secret = process.env.EMAIL_LINK_SECRET?.trim();
  return secret ? secret : null;
}

export function signEmailClickToken(dedupeKey: string, secret: string): string {
  return `${base64url(dedupeKey)}.${sign(dedupeKey, secret)}`;
}

/**
 * Trả lại `dedupeKey` nếu token hợp lệ, `null` nếu không.
 *
 * Endpoint không được tin `dedupeKey` giải ra từ token cho tới khi chữ ký khớp —
 * đó là toàn bộ lý do hàm này tồn tại.
 */
export function parseEmailClickToken(token: string, secret: string): string | null {
  const separator = token.lastIndexOf(".");
  if (separator <= 0 || separator === token.length - 1) return null;

  const encodedKey = token.slice(0, separator);
  const signature = token.slice(separator + 1);
  if (signature.length !== SIGNATURE_LENGTH) return null;

  let dedupeKey: string;
  try {
    dedupeKey = Buffer.from(encodedKey, "base64url").toString("utf8");
  } catch {
    return null;
  }
  if (!dedupeKey) return null;
  // base64url không phải song ánh: nhiều chuỗi vào cho cùng một chuỗi ra. Ký lại
  // từ bản đã giải mã và so bằng chuỗi vừa tính giúp token chỉ hợp lệ ở đúng một
  // dạng biểu diễn, nên không có hai URL khác nhau cùng ghi vào một delivery.
  if (base64url(dedupeKey) !== encodedKey) return null;

  const expected = Buffer.from(sign(dedupeKey, secret));
  const received = Buffer.from(signature);
  if (expected.length !== received.length) return null;
  if (!timingSafeEqual(expected, received)) return null;

  return dedupeKey;
}

/**
 * URL đặt vào nút CTA của email.
 *
 * `fallbackUrl` được trả về nguyên vẹn khi chưa cấu hình secret, nên email vẫn gửi
 * và vẫn dẫn khách tới trang thanh toán — chỉ là không đo được click.
 */
export function emailClickUrl(dedupeKey: string, fallbackUrl: string): string {
  const secret = emailClickSecret();
  if (!secret) return fallbackUrl;

  const token = signEmailClickToken(dedupeKey, secret);
  return absoluteUrl(`${CLICK_PATH}?${CLICK_TOKEN_PARAM}=${encodeURIComponent(token)}`);
}

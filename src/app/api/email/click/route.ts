import {
  CLICK_TOKEN_PARAM,
  emailClickSecret,
  parseEmailClickToken,
} from "@/lib/email-click";
import { recordEmailClick } from "@/lib/email-delivery";
import { prisma } from "@/lib/prisma";
import { absoluteUrl } from "@/lib/site-url";
import { isAutomatedUserAgent } from "@/lib/user-agent";

/**
 * Endpoint đo click nút thanh toán trong email nhắc.
 *
 * Công khai, không auth — và phải như vậy: trang `/dashboard/<id>/thanh-toan` đứng
 * sau cửa đăng nhập, còn `checkoutPath()` thì dựng lại đường dẫn không kèm query
 * string khi đẩy khách sang `/login`. Nếu chỉ gắn `utm_*` vào link trong email thì
 * đúng nhóm đáng đo nhất — người đã đăng xuất — sẽ mất dấu. Ghi click ở đây, trước
 * cửa auth, nên không phụ thuộc vào việc khách còn phiên hay không.
 *
 * Không có gì bí mật bị phơi ra: token chỉ giải ra `dedupeKey`, mà `invitationId`
 * trong đó vốn đã nằm trong URL đích của email. Chữ ký HMAC là để không ai bơm được
 * số liệu click cho thiệp bất kỳ.
 *
 * Quy tắc bao trùm cả file: **mọi nhánh đều phải redirect**. Đây là đường khách
 * đang đi để trả tiền, nên một token hỏng hay một câu ghi lỗi phải dẫn tới một
 * trang dùng được, không phải một trang lỗi.
 */

export const dynamic = "force-dynamic";

/**
 * Đích khi không xác định được thiệp: danh sách thiệp của khách.
 *
 * Hữu ích hơn 404 hay trang chủ — người bấm vào đây đang muốn thanh toán, và từ
 * dashboard họ tự tìm được thiệp của mình. Các nguyên nhân thật gồm mail client
 * ngắt dòng làm URL bị cắt, và thiệp đã bị xoá (`invitationId` là `onDelete: SetNull`).
 */
const FALLBACK_PATH = "/dashboard";

function redirectTo(path: string): Response {
  return new Response(null, {
    status: 302,
    headers: {
      Location: absoluteUrl(path),
      // Redirect này ghi số liệu nên không được nằm trong cache của bất kỳ ai;
      // 302 mà bị cache lại sẽ khiến các lần bấm sau không tới được endpoint.
      "Cache-Control": "no-store, no-cache, must-revalidate",
      // Không để URL kèm token rò sang trang đích qua header `Referer`.
      "Referrer-Policy": "no-referrer",
    },
  });
}

/**
 * Trang thanh toán, kèm `utm_*` cho GA4.
 *
 * Tham số này sống sót khi khách còn phiên đăng nhập — trường hợp phổ biến, vì họ
 * vừa tự xuất bản thiệp. Khi không còn phiên thì cửa auth sẽ xoá chúng, nhưng click
 * đã được ghi vào database trước đó rồi, nên số liệu không phụ thuộc vào GA4.
 */
function checkoutPath(invitationId: string, emailType: string): string {
  const params = new URLSearchParams({
    utm_source: "email",
    utm_medium: "reminder",
    utm_campaign: emailType,
  });
  return `/dashboard/${encodeURIComponent(invitationId)}/thanh-toan?${params.toString()}`;
}

export async function GET(request: Request): Promise<Response> {
  const secret = emailClickSecret();
  const token = new URL(request.url).searchParams.get(CLICK_TOKEN_PARAM);
  // Secret bị rút sau khi email đã gửi là tình huống thật: thư cũ vẫn mang token
  // không còn xác thực được, và khách bấm vào vẫn phải tới được nơi trả tiền.
  const dedupeKey = secret && token ? parseEmailClickToken(token, secret) : null;
  if (!dedupeKey) return redirectTo(FALLBACK_PATH);

  let delivery: { id: string; type: string; invitationId: string | null } | null = null;
  try {
    delivery = await prisma.emailDelivery.findUnique({
      where: { dedupeKey },
      select: { id: true, type: true, invitationId: true },
    });
  } catch (error) {
    console.error(
      "EMAIL_CLICK_LOOKUP_FAILED",
      JSON.stringify({ reason: error instanceof Error ? error.message : "unknown" }),
    );
    return redirectTo(FALLBACK_PATH);
  }
  if (!delivery?.invitationId) return redirectTo(FALLBACK_PATH);

  // Lọc bot TRƯỚC khi ghi, không phải sau. Gmail, Outlook và các bộ quét thư doanh
  // nghiệp đều tự mở link trong email; đếm chúng vào sẽ làm tỉ lệ click phồng lên
  // và bảng phễu mất hết giá trị. Bot vẫn được redirect như thường.
  if (!isAutomatedUserAgent(request.headers.get("user-agent") ?? "")) {
    await recordEmailClick(delivery.id);
  }

  return redirectTo(checkoutPath(delivery.invitationId, delivery.type));
}

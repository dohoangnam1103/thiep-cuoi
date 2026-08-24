import { cookies, headers } from "next/headers";

import { ADMIN_SESSION_COOKIE } from "@/lib/admin-session";
import { prisma } from "@/lib/prisma";

/**
 * Đếm số lần một thiệp đã xuất bản được mở, phục vụ cột "Lượt xem" của trang
 * `/admin/invitations`.
 *
 * Vì sao là một cột `Int` chứ không phải bảng log từng lượt xem:
 * - Trang quản trị đã `select` từ `Invitation` rồi, nên con số đi kèm miễn phí —
 *   không cần `COUNT()`, không cần join.
 * - Kích thước database không phình theo lưu lượng. SQLite ở đây là một file
 *   duy nhất trên minipc, nên một bảng mỗi-lượt-một-dòng sẽ phải dọn định kỳ.
 * - Đánh đổi: không có khách unique và không có chuỗi thời gian. Nếu sau này cần
 *   thì phải chuyển sang bảng log, cột này không mở rộng được.
 *
 * Ai được đếm:
 * - Khách và **cả chủ thiệp**. Con số trả lời "thiệp này có được mở không", chứ
 *   không phải "bao nhiêu khách đã xem".
 * - Admin thì không. Admin mở thiệp từ chính trang đang hiển thị con số này
 *   (`admin/invitations/page.tsx`, `admin/users/[id]/page.tsx`), nên đếm admin
 *   sẽ để người đọc làm nhiễu đúng thứ họ đang đọc.
 * - Bot cũng không. Thiệp cưới được share qua Zalo/Facebook liên tục và mỗi lần
 *   sinh link preview là một request server thật.
 */

/** Trong khoảng này, cùng một người tải lại trang chỉ tính một lượt. */
const DEDUPE_WINDOW_MS = 30 * 60 * 1000;

/** Chặn trên của map dedupe để một endpoint công khai không làm phình bộ nhớ. */
const MAX_TRACKED_VISITS = 5000;

/**
 * Bộ nhớ trong tiến trình: reset khi deploy và không chia sẻ giữa các container.
 * Chấp nhận được — việc của nó chỉ là gộp các lần tải lại liên tiếp, không phải
 * làm sổ ghi lượt xem có thẩm quyền. Sai số nghiêng về phía đếm thừa vài lượt
 * sau khi deploy, chứ không bao giờ mất một lượt thật.
 */
const recentVisits = new Map<string, number>();

/**
 * Các tác nhân tự động không được tính là "vào xem".
 *
 * Ba nhóm: bot chung (`bot`/`crawl`/`spider`/`slurp`), bộ sinh link preview của
 * mạng xã hội (nhóm quan trọng nhất với sản phẩm này — thiệp được gửi qua Zalo),
 * và các HTTP client dùng trong script/giám sát, bao gồm cả trình duyệt headless
 * để script chụp ảnh và Lighthouse không đẩy số lên.
 */
const AUTOMATED_USER_AGENT =
  /bot|crawl|spider|slurp|facebookexternalhit|facebot|zalo|twitterbot|slackbot|telegrambot|whatsapp|discord|skypeuripreview|embedly|linkedinbot|pinterest|vkshare|preview|lighthouse|headless|phantomjs|curl|wget|python-requests|go-http-client|node-fetch|axios|okhttp|apache-httpclient|pingdom|uptimerobot/i;

export type InvitationVisitSignals = {
  userAgent: string;
  clientIp: string;
  isAdmin: boolean;
};

/**
 * Đọc dữ liệu request cần cho việc đếm.
 *
 * Phải gọi trong thân component, **không** gọi trong callback của `after`:
 * Server Component không được dùng `cookies`/`headers` bên trong `after` vì
 * `after` chạy sau vòng đời render của React. Nên đọc trước rồi truyền giá trị
 * đã lấy được vào `recordInvitationVisit`.
 */
export async function readInvitationVisitSignals(): Promise<InvitationVisitSignals> {
  const [headerStore, cookieStore] = await Promise.all([headers(), cookies()]);

  return {
    userAgent: headerStore.get("user-agent") ?? "",
    // Cloudflare đứng trước ứng dụng nên `cf-connecting-ip` là nguồn đáng tin;
    // `x-forwarded-for` là đường lùi và phần tử đầu là client gốc.
    clientIp:
      headerStore.get("cf-connecting-ip")
      ?? headerStore.get("x-forwarded-for")?.split(",")[0]?.trim()
      ?? "",
    // Chỉ kiểm tra sự tồn tại của cookie, không verify JWT: một lượt xem công
    // khai không đáng để trả thêm một phép HMAC. Cookie giả mạo chỉ khiến lượt
    // xem đó không được đếm, tức là sai về phía an toàn.
    isAdmin: cookieStore.has(ADMIN_SESSION_COOKIE),
  };
}

/** Gộp các lần tải lại của cùng một người trong `DEDUPE_WINDOW_MS`. */
function isDuplicateVisit(slug: string, signals: InvitationVisitSignals): boolean {
  const now = Date.now();
  // Gộp cả user-agent vào khoá để những khách không có IP (proxy lạ, request nội
  // bộ) không dồn hết vào một ô rồi triệt tiêu lượt xem của nhau.
  const key = `${slug}\n${signals.clientIp}\n${signals.userAgent.slice(0, 80)}`;

  const seenAt = recentVisits.get(key);
  if (seenAt !== undefined && now - seenAt < DEDUPE_WINDOW_MS) return true;

  if (recentVisits.size >= MAX_TRACKED_VISITS) {
    for (const [candidate, timestamp] of recentVisits) {
      if (now - timestamp >= DEDUPE_WINDOW_MS) recentVisits.delete(candidate);
    }
    // Vẫn đầy nghĩa là đang có đợt truy cập thật lớn hơn cả chặn trên. Bỏ hết đi
    // còn hơn để map lớn không giới hạn; hậu quả tệ nhất là vài lượt bị đếm đôi.
    if (recentVisits.size >= MAX_TRACKED_VISITS) recentVisits.clear();
  }

  recentVisits.set(key, now);
  return false;
}

/**
 * Tăng `viewCount` của thiệp lên một, nếu lượt truy cập đáng được tính.
 *
 * Gọi qua `after()` để câu ghi chạy sau khi response đã gửi — khách không phải
 * chờ. Không bao giờ throw: SQLite bị khoá không được phép làm sập thiệp cưới
 * mà khách đang mở.
 */
export async function recordInvitationVisit(
  slug: string,
  signals: InvitationVisitSignals,
): Promise<void> {
  if (signals.isAdmin) return;
  if (signals.userAgent === "" || AUTOMATED_USER_AGENT.test(signals.userAgent)) return;
  if (isDuplicateVisit(slug, signals)) return;

  try {
    // SQL thô thay vì `prisma.invitation.update()` vì `Invitation.updatedAt` là
    // `@updatedAt`. Một lượt xem không phải một lần sửa, và trang quản trị hiển
    // thị `updatedAt` ở cột "Cập nhật" — đi qua ORM sẽ làm mọi thiệp trông như
    // vừa được chỉnh sửa bởi người vừa mở nó.
    await prisma.$executeRaw`
      UPDATE "Invitation"
      SET "viewCount" = "viewCount" + 1
      WHERE "slug" = ${slug} AND "status" = 'published'
    `;
  } catch (error) {
    console.error(
      "INVITATION_VIEW_COUNT_FAILED",
      JSON.stringify({ slug, reason: error instanceof Error ? error.message : "unknown" }),
    );
  }
}

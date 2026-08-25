import { isInvitationActivated } from "@/lib/invitation-entitlement";
import { FREE_TRIAL_MS } from "@/lib/trial";

export const REMINDER_WINDOW_MS = 24 * 60 * 60 * 1000;

/**
 * Chỉ nhắc bù cho thiệp hết hạn trong khoảng này.
 *
 * Có hai lý do cần một biên, không phải một:
 *
 * 1. Thời sự. Email nhắc bù nói "thiệp của bạn vừa bị ẩn". Gửi câu đó cho người
 *    bỏ thiệp từ một tháng trước là thư rác, không phải nhắc.
 * 2. Chặn bắn hàng loạt ở lượt chạy đầu. Cột `expiredReminderSentAt` khởi đầu
 *    NULL cho MỌI thiệp, nên nếu không có biên thì lượt cron đầu tiên sau khi
 *    deploy sẽ gửi cho toàn bộ thiệp từng hết hạn trong lịch sử database.
 *
 * 3 ngày là mức đo trên dữ liệu production: phủ 7 trong 16 thiệp đã hết hạn, còn
 * 7 ngày sẽ là 11. Chọn hẹp vì đây là email gửi cho khách thật.
 */
export const EXPIRED_REMINDER_GRACE_MS = 3 * 24 * 60 * 60 * 1000;

export type ReminderCandidate = {
  paid: boolean;
  complimentary: boolean;
  publishedAt: Date | null;
  reminderSentAt: Date | null;
  expiredReminderSentAt: Date | null;
  email: string | null;
};

/** Điều kiện chung của cả hai mốc nhắc. */
function isRemindable(c: ReminderCandidate): c is ReminderCandidate & { publishedAt: Date } {
  if (isInvitationActivated(c)) return false;
  if (!c.publishedAt) return false;
  if (!c.email) return false;
  return true;
}

/** Mốc 1: thiệp còn hiệu lực nhưng hết hạn trong 24h tới. */
export function shouldSendReminder(c: ReminderCandidate, now: Date): boolean {
  if (!isRemindable(c)) return false;
  if (c.reminderSentAt) return false;

  const expiresAt = c.publishedAt.getTime() + FREE_TRIAL_MS;
  const nowMs = now.getTime();
  return expiresAt > nowMs && expiresAt <= nowMs + REMINDER_WINDOW_MS;
}

/**
 * Mốc 2: thiệp đã hết hạn và đang bị tạm ẩn, trong cửa sổ grace.
 *
 * Cố ý KHÔNG xét `reminderSentAt`. Thiệp lọt mốc 1 vẫn phải nhận mốc 2 — đó chính
 * là nhóm cần nhắc nhất, vì họ chưa từng được cảnh báo gì mà thiệp đã ẩn.
 */
export function shouldSendExpiredReminder(c: ReminderCandidate, now: Date): boolean {
  if (!isRemindable(c)) return false;
  if (c.expiredReminderSentAt) return false;

  const expiresAt = c.publishedAt.getTime() + FREE_TRIAL_MS;
  const nowMs = now.getTime();
  return expiresAt <= nowMs && expiresAt > nowMs - EXPIRED_REMINDER_GRACE_MS;
}

export function buildCardName(
  content: { brideShortName: string; groomShortName: string } | null,
): string {
  const parts = [content?.brideShortName, content?.groomShortName]
    .map((p) => (p ?? "").trim())
    .filter(Boolean);
  return parts.length > 0 ? parts.join(" & ") : "Thiệp cưới của bạn";
}

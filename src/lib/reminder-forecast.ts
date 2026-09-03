import { vietnamStartOfDayOf } from "@/lib/datetime";
// Chỉ lấy kiểu, không kéo runtime của `email.ts` (Resend + SITE_URL) vào đây.
import type { ReminderKind } from "@/lib/email";
import {
  shouldSendExpiredReminder,
  shouldSendReminder,
  type ReminderCandidate,
} from "@/lib/trial-reminder";
import { FREE_TRIAL_MS } from "@/lib/trial";

const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;

/** Giờ Việt Nam, khớp timer VPS và cron tương thích trong deploy-fast.sh.
 * Chỉ phục vụ dự báo admin; timer trên host điều khiển việc gửi thật.
 */
export const REMINDER_CRON_HOURS = [9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21] as const;

/** Phủ một vòng ngày gồm cả khoảng nghỉ đêm 21:00–09:00. */
export const FORECAST_RUN_COUNT = REMINDER_CRON_HOURS.length;

export type ForecastCandidate = ReminderCandidate & { invitationId: string };

export type ReminderForecast = {
  invitationId: string;
  kind: ReminderKind;
  /** Lượt cron sẽ gửi email này. */
  scheduledAt: Date;
  /** Mốc hết hạn dùng thử của thiệp. */
  expiresAt: Date;
};

/**
 * Các mốc cron kế tiếp sau `now`, tính theo giờ Việt Nam.
 *
 * Neo vào `vietnamStartOfDayOf` chứ không cộng offset bằng tay: giờ hiển thị và
 * giờ tính toán phải cùng một múi, nếu không dự báo lệch 7 tiếng trên container
 * không set TZ — xem chú thích đầu `src/lib/datetime.ts`.
 */
export function upcomingCronRuns(now: Date, limit: number = FORECAST_RUN_COUNT): Date[] {
  const startOfToday = vietnamStartOfDayOf(now).getTime();
  const nowMs = now.getTime();
  const runs: Date[] = [];

  // Việt Nam không có DST từ 1975 nên cộng ngày bằng ms là chính xác.
  for (let day = 0; day <= limit + 1 && runs.length < limit; day += 1) {
    for (const hour of REMINDER_CRON_HOURS) {
      if (runs.length >= limit) break;
      const at = startOfToday + day * DAY_MS + hour * HOUR_MS;
      if (at > nowMs) runs.push(new Date(at));
    }
  }

  return runs;
}

/**
 * Dự báo email nhắc sẽ gửi ở từng lượt cron.
 *
 * Cố ý gọi lại `shouldSendReminder` / `shouldSendExpiredReminder` thay vì viết
 * lại điều kiện: trang quản trị phải nói đúng thứ cron sẽ làm, và khi điều kiện
 * thật đổi thì dự báo đổi theo, không phải sửa hai nơi.
 *
 * Mô phỏng tuần tự rồi tự đánh dấu marker sau mỗi lượt, nên một thiệp có thể
 * xuất hiện hai lần với hai `kind` khác nhau. Đó là đúng: cron nhắc "còn 24h"
 * trước, rồi nhắc "đã hết hạn" sau khi thiệp bị ẩn.
 *
 * Dự báo luôn là dự báo: thiệp được thanh toán trước lượt gửi sẽ rơi khỏi danh
 * sách ở lần tải trang sau, vì `isRemindable` đọc `paid` tại thời điểm truy vấn.
 */
export function forecastReminders(
  candidates: readonly ForecastCandidate[],
  runs: readonly Date[],
): ReminderForecast[] {
  const pending = candidates.map((candidate) => ({ ...candidate }));
  const forecast: ReminderForecast[] = [];

  for (const run of runs) {
    for (const candidate of pending) {
      const publishedAt = candidate.publishedAt;
      if (!publishedAt) continue;

      const kind: ReminderKind | null = shouldSendReminder(candidate, run)
        ? "trial-ending"
        : shouldSendExpiredReminder(candidate, run)
          ? "expired"
          : null;
      if (kind === null) continue;

      forecast.push({
        invitationId: candidate.invitationId,
        kind,
        scheduledAt: run,
        expiresAt: new Date(publishedAt.getTime() + FREE_TRIAL_MS),
      });

      if (kind === "trial-ending") candidate.reminderSentAt = run;
      else candidate.expiredReminderSentAt = run;
    }
  }

  return forecast;
}

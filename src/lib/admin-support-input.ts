import { completedTemplateSlugs } from "@/data/chungdoi";
import { vietnamDayKey, vietnamStartOfDay } from "@/lib/datetime";

export const SYSTEM_EMAIL = "system@demo.local";

export function parseUserSearch(value: string | undefined): string {
  return value?.trim().toLowerCase().slice(0, 120) ?? "";
}

/**
 * Reads a `<input type="date">` value as the instant that day starts in Vietnam.
 * Admin tables render timestamps in `Asia/Ho_Chi_Minh`, so the range has to be
 * anchored to Vietnam midnight for the filter to select exactly the rows whose
 * displayed date falls inside it. Anchoring at UTC midnight instead — which this
 * did before — shifted every boundary seven hours and silently pulled in rows
 * from the neighbouring day.
 */
export function parseDateInput(value: string | undefined): Date | null {
  return vietnamStartOfDay(value);
}

/** Upper bound for a range whose end date the user means inclusively. */
export function endOfDayExclusive(date: Date): Date {
  return new Date(date.getTime() + 24 * 60 * 60 * 1000);
}

/**
 * Ngày điền sẵn cho cặp ô lọc ngày khi URL chưa nói gì về ngày — dùng cho trang
 * lịch sử email, nơi admin gần như chỉ cần lượt gửi vừa chạy chứ không cần cả
 * lịch sử dài thêm mỗi ngày.
 *
 * Trả về `null` nghĩa là "tôn trọng URL". Điểm cốt lõi là phân biệt `undefined`
 * với chuỗi rỗng: form GET luôn gửi `from=` kể cả khi ô ngày trống, nên chuỗi
 * rỗng là tín hiệu admin chủ động xoá ngày để xem tất cả thời gian. Nếu mặc
 * định bắt cả trường hợp đó thì không còn đường nào ra khỏi hôm nay.
 */
export function defaultDayFilter(
  from: string | undefined,
  to: string | undefined,
  now: Date = new Date(),
): string | null {
  if (from !== undefined || to !== undefined) return null;
  return vietnamDayKey(now);
}

export function isAllowedCustomerEmail(email: string | null): boolean {
  return email !== SYSTEM_EMAIL;
}

export function parseAdminTemplateId(value: FormDataEntryValue | null): string | null {
  if (typeof value !== "string" || !completedTemplateSlugs.has(value)) return null;
  return value;
}

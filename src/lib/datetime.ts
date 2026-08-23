/**
 * Timestamp formatting for a Vietnam-only product.
 *
 * `Intl.DateTimeFormat` falls back to the runtime timezone when `timeZone` is
 * omitted. The production container has no `TZ` set, so it resolves to UTC and
 * every server-rendered timestamp came out seven hours behind Vietnam while
 * still being labelled `vi-VN`. Always format instants through this module so
 * the timezone is pinned regardless of where the code runs — server, container,
 * or a visitor's browser in another country.
 *
 * Only use these helpers for real instants (`createdAt`, `paidAt`, `updatedAt`).
 * Date-only fields such as a wedding date are calendar dates rather than
 * instants; those are rendered with `timeZone: "UTC"` at their call sites so the
 * stored day never shifts, and must not be routed through here.
 */

export const VIETNAM_TIME_ZONE = "Asia/Ho_Chi_Minh";

/**
 * Vietnam has kept a single fixed offset with no daylight saving since 1975, so
 * a literal offset is safe for anchoring a calendar day to an instant.
 */
export const VIETNAM_UTC_OFFSET = "+07:00";

export function createVietnamDateFormatter(
  options: Intl.DateTimeFormatOptions,
  locale: string = "vi-VN",
): Intl.DateTimeFormat {
  return new Intl.DateTimeFormat(locale, { ...options, timeZone: VIETNAM_TIME_ZONE });
}

const dateTimeShortFormatter = createVietnamDateFormatter({
  dateStyle: "short",
  timeStyle: "short",
});

const dateTimeMediumFormatter = createVietnamDateFormatter({
  dateStyle: "medium",
  timeStyle: "short",
});

const dateMediumFormatter = createVietnamDateFormatter({ dateStyle: "medium" });

/** `23/08/26 18:57` — dense tables where rows carry both date and time. */
export function formatVietnamDateTimeShort(date: Date): string {
  return dateTimeShortFormatter.format(date);
}

/** `23 thg 8, 2026 18:57` — detail views with room to breathe. */
export function formatVietnamDateTime(date: Date): string {
  return dateTimeMediumFormatter.format(date);
}

/** `23 thg 8, 2026` — where the time of day carries no meaning. */
export function formatVietnamDate(date: Date): string {
  return dateMediumFormatter.format(date);
}

const DATE_INPUT_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Turns a `YYYY-MM-DD` value into the instant that calendar day begins in
 * Vietnam. Returns null for anything unparseable rather than an Invalid Date,
 * which Prisma would reject at query time.
 */
export function vietnamStartOfDay(value: string | undefined): Date | null {
  if (!value || !DATE_INPUT_PATTERN.test(value)) return null;
  const parsed = new Date(`${value}T00:00:00.000${VIETNAM_UTC_OFFSET}`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

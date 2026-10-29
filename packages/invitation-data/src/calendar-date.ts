/** Calendar dates have no timezone. Their persisted representation stays ISO. */
export function isCalendarDate(value: string): boolean {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return false;
  const [, yearText, monthText, dayText] = match;
  const year = Number(yearText);
  const month = Number(monthText);
  const day = Number(dayText);
  if (year < 1 || month < 1 || month > 12 || day < 1) return false;
  const leap = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
  const days = [31, leap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  return day <= days[month - 1];
}

export function formatCalendarDate(value: string): string {
  if (!isCalendarDate(value)) return "";
  const [year, month, day] = value.split("-");
  return `${day}/${month}/${year}`;
}

/** Never guess month/day order or accept JavaScript's overflowing dates. */
export function parseCalendarDateInput(value: string): string | null {
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(value);
  if (!match) return null;
  const [, day, month, year] = match;
  const iso = `${year}-${month}-${day}`;
  return isCalendarDate(iso) ? iso : null;
}

/** Read legacy date captions without changing their calendar day. */
export function parseCalendarDateLabel(value: string): string | null {
  const text = value.trim();
  if (isCalendarDate(text)) return text;
  const match = /^(\d{1,2})\s*[/.·-]\s*(\d{1,2})\s*[/.·-]\s*(\d{4})$/.exec(text);
  if (!match) return null;
  return parseCalendarDateInput(`${match[1].padStart(2, "0")}/${match[2].padStart(2, "0")}/${match[3]}`);
}

export function normalizeCalendarDateLabel(value: string): string {
  const iso = parseCalendarDateLabel(value);
  return iso ? formatCalendarDate(iso) : value.trim();
}

export function formatCalendarDateWithWeekday(value: string, locale = "vi-VN"): string {
  const formatted = formatCalendarDate(value);
  if (!formatted) return "";
  const weekday = new Intl.DateTimeFormat(locale, { weekday: "long", timeZone: "UTC" })
    .format(new Date(`${value}T00:00:00Z`));
  return `${weekday}, ${formatted}`;
}

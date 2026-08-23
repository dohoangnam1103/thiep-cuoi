import { completedTemplateSlugs } from "@/data/chungdoi";

export const SYSTEM_EMAIL = "system@demo.local";

export function parseUserSearch(value: string | undefined): string {
  return value?.trim().toLowerCase().slice(0, 120) ?? "";
}

const DATE_INPUT_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Reads a `<input type="date">` value as a UTC instant. Admin tables format
 * timestamps with the server's timezone, which is UTC in the container, so
 * anchoring the range at UTC midnight keeps the filter aligned with the dates
 * actually shown in the rows. Returns null for anything unparseable rather than
 * an Invalid Date, which Prisma would reject at query time.
 */
export function parseDateInput(value: string | undefined): Date | null {
  if (!value || !DATE_INPUT_PATTERN.test(value)) return null;
  const parsed = new Date(`${value}T00:00:00.000Z`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

/** Upper bound for a range whose end date the user means inclusively. */
export function endOfDayExclusive(date: Date): Date {
  return new Date(date.getTime() + 24 * 60 * 60 * 1000);
}

export function isAllowedCustomerEmail(email: string | null): boolean {
  return email !== SYSTEM_EMAIL;
}

export function parseAdminTemplateId(value: FormDataEntryValue | null): string | null {
  if (typeof value !== "string" || !completedTemplateSlugs.has(value)) return null;
  return value;
}

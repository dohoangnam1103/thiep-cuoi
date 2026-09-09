import { invitationMatchesSearch, normalizeSearch, type InvitationSearchable } from "@/lib/admin-invitation-filters";
import { vietnamDayKey } from "@/lib/datetime";

/** The values accepted by the upcoming-wedding payment filter. */
export const WEDDING_PAYMENT_FILTERS = ["all", "paid", "unpaid", "complimentary"] as const;
export type WeddingPaymentFilter = (typeof WEDDING_PAYMENT_FILTERS)[number];

/** A bounded range includes today and contains this many calendar days. */
export const WEDDING_RANGE_FILTERS = ["all", 7, 30, 90] as const;
export type WeddingRange = (typeof WEDDING_RANGE_FILTERS)[number];

/**
 * The subset selected by the admin page. Keeping this close to the Prisma
 * shape means a page can pass rows through without an intermediate DTO.
 */
export type UpcomingWeddingRow = InvitationSearchable & {
  id: string;
  paid: boolean;
  complimentary: boolean;
  content: (InvitationSearchable["content"] & {
    date: string | null;
    time?: string | null;
    banquetTime?: string | null;
    address?: string | null;
  }) | null;
};

const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;
const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Parse a date-only value without allowing JavaScript's Date rollover. The
 * resulting Date is UTC midnight so rendering it cannot move the calendar day
 * when the server's timezone differs from Vietnam.
 */
export function parseWeddingDate(value: string | null | undefined): Date | null {
  if (typeof value !== "string") return null;
  const match = ISO_DATE.exec(value.trim());
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const parsed = new Date(Date.UTC(year, month - 1, day));
  if (
    parsed.getUTCFullYear() !== year
    || parsed.getUTCMonth() !== month - 1
    || parsed.getUTCDate() !== day
  ) {
    return null;
  }
  return parsed;
}

function asCalendarDate(value: Date | string): Date | null {
  if (typeof value === "string") return parseWeddingDate(value);
  if (!(value instanceof Date) || Number.isNaN(value.getTime())) return null;
  return parseWeddingDate(vietnamDayKey(value));
}

/** Number of whole calendar days from `today` to the wedding date. */
export function daysUntilWedding(date: Date | string, today: Date | string): number {
  const weddingDate = typeof date === "string" ? parseWeddingDate(date) : date;
  if (!(weddingDate instanceof Date) || Number.isNaN(weddingDate.getTime())) return Number.NaN;
  const todayDate = asCalendarDate(today);
  if (!todayDate) return Number.NaN;
  const normalizedWeddingDate = parseWeddingDate(
    `${weddingDate.getUTCFullYear().toString().padStart(4, "0")}-${(weddingDate.getUTCMonth() + 1).toString().padStart(2, "0")}-${weddingDate.getUTCDate().toString().padStart(2, "0")}`,
  );
  if (!normalizedWeddingDate) return Number.NaN;
  return Math.round((normalizedWeddingDate.getTime() - todayDate.getTime()) / DAY_MS);
}

export function parseWeddingPaymentFilter(value: string | undefined): WeddingPaymentFilter {
  return WEDDING_PAYMENT_FILTERS.includes(value as WeddingPaymentFilter)
    ? (value as WeddingPaymentFilter)
    : "all";
}

export function parseWeddingRange(value: string | undefined): WeddingRange {
  if (value === "all") return "all";
  const parsed = Number(value);
  return parsed === 7 || parsed === 30 || parsed === 90 ? parsed : "all";
}

export type WeddingFilterOptions = {
  today: Date | string;
  range: WeddingRange;
  payment: WeddingPaymentFilter;
  search?: string;
};

/** Whether a row belongs in the upcoming-wedding list for the selected filters. */
export function weddingMatchesFilters(
  row: UpcomingWeddingRow,
  filters: WeddingFilterOptions,
): boolean {
  const weddingDate = parseWeddingDate(row.content?.date);
  if (!weddingDate) return false;

  const days = daysUntilWedding(weddingDate, filters.today);
  if (!Number.isFinite(days) || days < 0) return false;
  if (filters.range !== "all" && days >= filters.range) return false;

  switch (filters.payment) {
    case "paid":
      if (!row.paid) return false;
      break;
    case "complimentary":
      if (row.paid || !row.complimentary) return false;
      break;
    case "unpaid":
      // Complimentary invitations are already activated and are not leads.
      if (row.paid || row.complimentary) return false;
      break;
  }

  const search = normalizeSearch(filters.search);
  return invitationMatchesSearch(row, search);
}

/** Sort rows by wedding day, then by id for deterministic pagination. */
export function sortUpcomingWeddings<T extends UpcomingWeddingRow>(rows: readonly T[]): T[] {
  return rows
    .map((row, index) => ({ row, index, date: parseWeddingDate(row.content?.date) }))
    .sort((a, b) => {
      if (a.date && b.date) {
        const byDate = a.date.getTime() - b.date.getTime();
        if (byDate !== 0) return byDate;
      } else if (a.date) {
        return -1;
      } else if (b.date) {
        return 1;
      }
      const byId = a.row.id.localeCompare(b.row.id);
      return byId !== 0 ? byId : a.index - b.index;
    })
    .map(({ row }) => row);
}

import { vietnamDayKey, vietnamStartOfDayOf } from "@/lib/datetime";

/**
 * Daily series for the admin "Tổng quan" charts.
 *
 * Bucketing runs in JS rather than SQL on purpose: Prisma's `groupBy` cannot
 * truncate a `DateTime` to a day, and the raw-SQL alternative
 * (`strftime('%Y-%m-%d', ...)`) would bucket in UTC unless every query repeats a
 * `+7 hours` shift. Pulling one column for the window and folding it here keeps
 * the timezone rule in one place — see `src/lib/datetime.ts`.
 */

const DAY_MS = 24 * 60 * 60 * 1000;

/** Windows offered by the range switcher, in days. */
export const DAILY_RANGE_OPTIONS = [7, 30, 90] as const;

export type DailyRange = (typeof DAILY_RANGE_OPTIONS)[number];

export const DEFAULT_DAILY_RANGE: DailyRange = 30;

/**
 * The range arrives from the URL, so anything outside the known set has to
 * collapse to the default rather than reach a Prisma query as `NaN` days.
 */
export function parseDailyRange(value: string | undefined): DailyRange {
  const parsed = Number(value);
  return DAILY_RANGE_OPTIONS.find((option) => option === parsed) ?? DEFAULT_DAILY_RANGE;
}

/**
 * One row to fold into the series. `at` is nullable because `Payment.paidAt` is:
 * a pending order has no instant to file it under and must not become "today".
 * `amount` absent means "count this row"; present means "add this much".
 */
export type DailyEvent = {
  at: Date | null;
  amount?: number;
};

export type DailyPoint = {
  /** `2026-08-24` — Vietnamese calendar day, stable key for the x axis. */
  day: string;
  /** `24/08` — what the axis prints. */
  label: string;
  /** `24/08/2026` — the tooltip heading, where the year matters. */
  fullLabel: string;
  value: number;
};

/**
 * First instant of the window: Vietnam midnight `range - 1` days back, so the
 * window covers `range` whole Vietnamese days ending with today.
 *
 * Adding whole days to a Vietnam midnight stays on a Vietnam midnight because
 * the zone has held a fixed +07:00 with no daylight saving since 1975.
 */
export function dailyWindowStart(range: number, now: Date): Date {
  return new Date(vietnamStartOfDayOf(now).getTime() - (range - 1) * DAY_MS);
}

/**
 * Folds events into one point per day, zero-filling days with no rows so the
 * chart shows a real gap instead of interpolating across it. Events outside the
 * window are ignored, which keeps the series honest if a caller passes a wider
 * query than the range it asked for.
 */
export function buildDailySeries(
  events: readonly DailyEvent[],
  range: number,
  now: Date,
): DailyPoint[] {
  const start = dailyWindowStart(range, now);

  // Insertion order is the chart's x order, so seed every day up front.
  const totals = new Map<string, number>();
  for (let offset = 0; offset < range; offset += 1) {
    totals.set(vietnamDayKey(new Date(start.getTime() + offset * DAY_MS)), 0);
  }

  for (const event of events) {
    if (!event.at) continue;
    const key = vietnamDayKey(event.at);
    const current = totals.get(key);
    if (current === undefined) continue;
    totals.set(key, current + (event.amount ?? 1));
  }

  return Array.from(totals, ([day, value]) => ({
    day,
    label: `${day.slice(8, 10)}/${day.slice(5, 7)}`,
    fullLabel: `${day.slice(8, 10)}/${day.slice(5, 7)}/${day.slice(0, 4)}`,
    value,
  }));
}

export function sumDailyValues(points: readonly DailyPoint[]): number {
  return points.reduce((total, point) => total + point.value, 0);
}

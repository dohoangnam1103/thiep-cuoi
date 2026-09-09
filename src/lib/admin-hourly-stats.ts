import { vietnamDayKey, vietnamStartOfDayOf } from "@/lib/datetime";

const DAY_MS = 24 * 60 * 60 * 1000;

export type HourlyEvent = { at: Date };

export type HourlyGrowthPoint = {
  hour: number;
  label: string;
  users: number | null;
  invitations: number | null;
  averageUsers: number;
  averageInvitations: number;
};

export type HourlyGrowthSummary = {
  todayUsers: number;
  todayInvitations: number;
  averageUsers: number;
  averageInvitations: number;
  userDeltaPct: number | null;
  invitationDeltaPct: number | null;
  baselineDays: number;
};

export type HourlyGrowth = {
  points: HourlyGrowthPoint[];
  summary: HourlyGrowthSummary;
};

const timePartsFormatter = new Intl.DateTimeFormat("en-US", {
  hour: "numeric",
  minute: "numeric",
  second: "numeric",
  hour12: false,
  timeZone: "Asia/Ho_Chi_Minh",
});

function timePartsOf(date: Date): { hour: number; minuteOfDay: number } {
  const parts = timePartsFormatter.formatToParts(date);
  const value = parts.find((part) => part.type === "hour")?.value ?? "0";
  const minute = Number(parts.find((part) => part.type === "minute")?.value ?? "0");
  const second = Number(parts.find((part) => part.type === "second")?.value ?? "0");
  const hour = Number(value) % 24;
  return { hour, minuteOfDay: hour * 60 + minute + second / 60 };
}

function percentDelta(today: number, average: number): number | null {
  if (average === 0) return null;
  return ((today - average) / average) * 100;
}

/**
 * Builds today's hourly bars and compares the elapsed portion of today with
 * the same elapsed portion of previous days. The baseline includes quiet days
 * so zero-activity days are not silently removed from the average.
 */
export function buildHourlyGrowth(
  users: readonly HourlyEvent[],
  invitations: readonly HourlyEvent[],
  baselineDays: number,
  now: Date,
): HourlyGrowth {
  const todayStart = vietnamStartOfDayOf(now);
  const baselineStart = new Date(todayStart.getTime() - baselineDays * DAY_MS);
  const userToday = Array.from({ length: 24 }, () => 0);
  const invitationToday = Array.from({ length: 24 }, () => 0);
  const userBaselineByHour = Array.from({ length: 24 }, () => 0);
  const invitationBaselineByHour = Array.from({ length: 24 }, () => 0);
  const userBaselineByDay = new Map<string, number>();
  const invitationBaselineByDay = new Map<string, number>();

  for (let offset = 0; offset < baselineDays; offset += 1) {
    const day = new Date(baselineStart.getTime() + offset * DAY_MS);
    const key = vietnamDayKey(day);
    userBaselineByDay.set(key, 0);
    invitationBaselineByDay.set(key, 0);
  }

  const currentTime = timePartsOf(now);

  const add = (
    events: readonly HourlyEvent[],
    today: number[],
    baseline: Map<string, number>,
    baselineByHour: number[],
  ) => {
    for (const event of events) {
      if (event.at >= todayStart && event.at <= now) {
        today[timePartsOf(event.at).hour] += 1;
        continue;
      }
      if (event.at < baselineStart || event.at >= todayStart) continue;
      const eventTime = timePartsOf(event.at);
      baselineByHour[eventTime.hour] += 1;
      // Compare a partial day with the same elapsed portion of prior days.
      // A full-day baseline would make every morning look artificially low.
      if (eventTime.minuteOfDay > currentTime.minuteOfDay) continue;
      const day = vietnamDayKey(event.at);
      const current = baseline.get(day);
      if (current !== undefined) baseline.set(day, current + 1);
    }
  };

  add(users, userToday, userBaselineByDay, userBaselineByHour);
  add(invitations, invitationToday, invitationBaselineByDay, invitationBaselineByHour);

  const todayUsers = userToday.reduce((sum, value) => sum + value, 0);
  const todayInvitations = invitationToday.reduce((sum, value) => sum + value, 0);
  const averageUsers = Array.from(userBaselineByDay.values()).reduce((sum, value) => sum + value, 0) / baselineDays;
  const averageInvitations = Array.from(invitationBaselineByDay.values()).reduce((sum, value) => sum + value, 0) / baselineDays;
  return {
    points: Array.from({ length: 24 }, (_, hour) => ({
      hour,
      label: `${String(hour).padStart(2, "0")}h`,
      // Future hours remain null so the chart does not imply that zero users
      // have already arrived there today.
      users: hour <= currentTime.hour ? userToday[hour]! : null,
      invitations: hour <= currentTime.hour ? invitationToday[hour]! : null,
      averageUsers: userBaselineByHour[hour]! / baselineDays,
      averageInvitations: invitationBaselineByHour[hour]! / baselineDays,
    })),
    summary: {
      todayUsers,
      todayInvitations,
      averageUsers,
      averageInvitations,
      userDeltaPct: percentDelta(todayUsers, averageUsers),
      invitationDeltaPct: percentDelta(todayInvitations, averageInvitations),
      baselineDays,
    },
  };
}

export const FREE_TRIAL_DAYS = 3;

const MINUTE_MS = 60 * 1000;
const HOUR_MINUTES = 60;
const DAY_MINUTES = 24 * HOUR_MINUTES;

export const FREE_TRIAL_MS = FREE_TRIAL_DAYS * 24 * HOUR_MINUTES * MINUTE_MS;

export type TrialRemaining = {
  expired: boolean;
  days: number;
  hours: number;
  minutes: number;
};

export function trialExpiresAt(publishedAt: Date): Date {
  return new Date(publishedAt.getTime() + FREE_TRIAL_MS);
}

export function getTrialRemaining(expiresAt: number, now: number): TrialRemaining {
  if (now >= expiresAt) {
    return { expired: true, days: 0, hours: 0, minutes: 0 };
  }

  const totalMinutes = Math.ceil((expiresAt - now) / MINUTE_MS);
  const days = Math.floor(totalMinutes / DAY_MINUTES);
  const hours = Math.floor((totalMinutes % DAY_MINUTES) / HOUR_MINUTES);
  const minutes = totalMinutes % HOUR_MINUTES;

  return { expired: false, days, hours, minutes };
}

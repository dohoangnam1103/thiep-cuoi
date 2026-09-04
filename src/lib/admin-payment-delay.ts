const DAY_MS = 24 * 60 * 60 * 1000;

export const PAYMENT_DELAY_BUCKETS = ["day-0", "day-1", "day-2", "day-3-plus"] as const;

export type PaymentDelayBucket = (typeof PAYMENT_DELAY_BUCKETS)[number];

export type PaidInvitationEvent = {
  userId: string;
  invitationCreatedAt: Date;
  paidAt: Date | null;
};

export type PaymentDelayPoint = {
  bucket: PaymentDelayBucket;
  value: number;
  percentage: number;
};

function bucketForDelay(delayMs: number): PaymentDelayBucket {
  const elapsedDays = Math.max(0, delayMs) / DAY_MS;
  if (elapsedDays < 1) return "day-0";
  if (elapsedDays < 2) return "day-1";
  if (elapsedDays < 3) return "day-2";
  return "day-3-plus";
}

/**
 * Counts people, not payment rows. A returning customer can create several
 * orders or invitations, but their first successful payment is the conversion
 * event that answers how long a new customer waited before paying.
 */
export function buildPaymentDelayDistribution(
  events: readonly PaidInvitationEvent[],
): PaymentDelayPoint[] {
  const firstPaymentByUser = new Map<string, PaidInvitationEvent>();

  for (const event of events) {
    if (!event.paidAt) continue;
    const current = firstPaymentByUser.get(event.userId);
    if (!current?.paidAt || event.paidAt < current.paidAt) {
      firstPaymentByUser.set(event.userId, event);
    }
  }

  const counts = new Map<PaymentDelayBucket, number>(
    PAYMENT_DELAY_BUCKETS.map((bucket) => [bucket, 0]),
  );

  for (const event of firstPaymentByUser.values()) {
    if (!event.paidAt) continue;
    const bucket = bucketForDelay(event.paidAt.getTime() - event.invitationCreatedAt.getTime());
    counts.set(bucket, (counts.get(bucket) ?? 0) + 1);
  }

  const total = firstPaymentByUser.size;
  return PAYMENT_DELAY_BUCKETS.map((bucket) => {
    const value = counts.get(bucket) ?? 0;
    return {
      bucket,
      value,
      percentage: total === 0 ? 0 : (value / total) * 100,
    };
  });
}

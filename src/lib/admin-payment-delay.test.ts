import assert from "node:assert/strict";
import test from "node:test";

import { buildPaymentDelayDistribution } from "./admin-payment-delay";

const CREATED_AT = new Date("2026-08-01T00:00:00.000Z");
const HOUR_MS = 60 * 60 * 1000;

function event(userId: string, hours: number) {
  return {
    userId,
    invitationCreatedAt: CREATED_AT,
    paidAt: new Date(CREATED_AT.getTime() + hours * HOUR_MS),
  };
}

test("groups first-time paying users into rolling 24-hour buckets", () => {
  const result = buildPaymentDelayDistribution([
    event("immediate", 0),
    event("before-24", 23.99),
    event("day-one", 24),
    event("day-two", 48),
    event("late", 72),
  ]);

  assert.deepEqual(
    result.map(({ bucket, value }) => ({ bucket, value })),
    [
      { bucket: "day-0", value: 2 },
      { bucket: "day-1", value: 1 },
      { bucket: "day-2", value: 1 },
      { bucket: "day-3-plus", value: 1 },
    ],
  );
  assert.equal(result[0]?.percentage, 40);
});

test("counts one user once using their first successful payment", () => {
  const result = buildPaymentDelayDistribution([
    event("returning", 80),
    event("returning", 10),
    { userId: "pending", invitationCreatedAt: CREATED_AT, paidAt: null },
  ]);

  assert.deepEqual(result.map((point) => point.value), [1, 0, 0, 0]);
  assert.deepEqual(result.map((point) => point.percentage), [100, 0, 0, 0]);
});

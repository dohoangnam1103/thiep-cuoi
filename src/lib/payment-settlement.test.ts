import assert from "node:assert/strict";
import test from "node:test";

import {
  cassoReconciliationMetadata,
  decideCassoSettlement,
  isPaymentSettleable,
} from "./payment-settlement";

test("only pending and legacy voucher-cancelled payments may settle", () => {
  assert.equal(isPaymentSettleable("pending"), true);
  assert.equal(isPaymentSettleable("cancelled"), true);
  assert.equal(isPaymentSettleable("superseded"), false);
  assert.equal(isPaymentSettleable("failed"), false);
  assert.equal(isPaymentSettleable("paid"), false);
});

const candidate = {
  id: "payment-1",
  code: "CDABC123",
  provider: "casso",
  status: "pending",
  amount: 150_000,
  createdAt: new Date("2026-08-13T10:00:00.000Z"),
};
const now = new Date("2026-08-13T10:05:00.000Z");

test("Casso decision distinguishes settle, ignore and manual reconciliation", () => {
  assert.deepEqual(
    decideCassoSettlement({
      payment: candidate,
      receivedAmount: 150_000,
      now,
    }),
    { kind: "settle" },
  );
  assert.deepEqual(
    decideCassoSettlement({
      payment: null,
      receivedAmount: 150_000,
      now,
    }),
    { kind: "ignore", reason: "unknown-code" },
  );
  assert.deepEqual(
    decideCassoSettlement({
      payment: { ...candidate, provider: "payos" },
      receivedAmount: 150_000,
      now,
    }),
    { kind: "ignore", reason: "unknown-code" },
  );
  assert.deepEqual(
    decideCassoSettlement({
      payment: { ...candidate, status: "paid" },
      receivedAmount: 150_000,
      now,
    }),
    { kind: "ignore", reason: "duplicate-paid" },
  );
  assert.deepEqual(
    decideCassoSettlement({
      payment: { ...candidate, status: "superseded" },
      receivedAmount: 150_000,
      now,
    }),
    { kind: "reconcile", reason: "superseded" },
  );
  assert.deepEqual(
    decideCassoSettlement({
      payment: { ...candidate, status: "failed" },
      receivedAmount: 150_000,
      now,
    }),
    { kind: "reconcile", reason: "non-settleable" },
  );
  assert.deepEqual(
    decideCassoSettlement({
      payment: {
        ...candidate,
        createdAt: new Date(now.getTime() - 24 * 60 * 60 * 1000),
      },
      receivedAmount: 150_000,
      now,
    }),
    { kind: "reconcile", reason: "expired" },
  );
  assert.deepEqual(
    decideCassoSettlement({
      payment: candidate,
      receivedAmount: 149_999,
      now,
    }),
    { kind: "reconcile", reason: "underpaid" },
  );
  assert.deepEqual(
    decideCassoSettlement({
      payment: { ...candidate, status: "cancelled" },
      receivedAmount: 150_000,
      now,
    }),
    { kind: "settle" },
  );
});

test("manual reconciliation metadata contains identifiers and money only", () => {
  const metadata = cassoReconciliationMetadata({
    transactionId: 42,
    payment: candidate,
    receivedAmount: 149_999,
    reason: "underpaid",
  });
  assert.deepEqual(metadata, {
    transactionId: 42,
    paymentId: "payment-1",
    paymentCode: "CDABC123",
    localStatus: "pending",
    expectedAmount: 150_000,
    receivedAmount: 149_999,
    reason: "underpaid",
  });
  assert.doesNotMatch(JSON.stringify(metadata), /description|account|bank/i);
});

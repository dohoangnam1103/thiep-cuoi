import { PAYMENT_PENDING_EXPIRES_MS } from "@/lib/payment";

export const SETTLEABLE_PAYMENT_STATUSES = ["pending", "cancelled"] as const;

export function isPaymentSettleable(status: string): boolean {
  return (SETTLEABLE_PAYMENT_STATUSES as readonly string[]).includes(status);
}

export type CassoCandidate = {
  id: string;
  code: string;
  provider: string;
  status: string;
  amount: number;
  createdAt: Date;
};

export type CassoDecision =
  | { kind: "settle" }
  | { kind: "ignore"; reason: "duplicate-paid" | "unknown-code" }
  | {
      kind: "reconcile";
      reason: "superseded" | "expired" | "underpaid" | "non-settleable";
    };

export function decideCassoSettlement(input: {
  payment: CassoCandidate | null;
  receivedAmount: number;
  now: Date;
}): CassoDecision {
  const payment = input.payment;
  if (!payment || payment.provider !== "casso") {
    return { kind: "ignore", reason: "unknown-code" };
  }
  if (payment.status === "paid") {
    return { kind: "ignore", reason: "duplicate-paid" };
  }
  if (payment.status === "superseded") {
    return { kind: "reconcile", reason: "superseded" };
  }
  if (!isPaymentSettleable(payment.status)) {
    return { kind: "reconcile", reason: "non-settleable" };
  }
  if (
    input.now.getTime() >=
    payment.createdAt.getTime() + PAYMENT_PENDING_EXPIRES_MS
  ) {
    return { kind: "reconcile", reason: "expired" };
  }
  if (input.receivedAmount < payment.amount) {
    return { kind: "reconcile", reason: "underpaid" };
  }
  return { kind: "settle" };
}

type ReconciliationReason = Extract<
  CassoDecision,
  { kind: "reconcile" }
>["reason"];

export function cassoReconciliationMetadata(input: {
  transactionId: number | string | null;
  payment: CassoCandidate;
  receivedAmount: number;
  reason: ReconciliationReason;
}) {
  return {
    transactionId: input.transactionId,
    paymentId: input.payment.id,
    paymentCode: input.payment.code,
    localStatus: input.payment.status,
    expectedAmount: input.payment.amount,
    receivedAmount: input.receivedAmount,
    reason: input.reason,
  };
}

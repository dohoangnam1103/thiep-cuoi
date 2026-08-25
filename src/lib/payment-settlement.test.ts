import assert from "node:assert/strict";
import test from "node:test";

import {
  cassoReconciliationMetadata,
  classifySettlementFailure,
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

test("một lần claim thất bại lành tính không bị coi là sự cố", () => {
  // payOS gửi lại webhook cho giao dịch đã ghi nhận. Nếu coi đây là ca cần đối
  // soát thì trang quản trị sẽ đầy báo động giả và mất luôn tác dụng cảnh báo.
  assert.deepEqual(
    classifySettlementFailure({
      payment: { status: "paid", amount: 150_000 },
      receivedAmount: 150_000,
    }),
    { kind: "benign" },
  );
  // Đơn biến mất vì thiệp bị xoá (FK cascade) — không còn gì để xử lý.
  assert.deepEqual(
    classifySettlementFailure({ payment: null, receivedAmount: 150_000 }),
    { kind: "benign" },
  );
});

test("claim thất bại vì tiền hoặc trạng thái thì phải bị đánh dấu", () => {
  assert.deepEqual(
    classifySettlementFailure({
      payment: { status: "pending", amount: 150_000 },
      receivedAmount: 100_000,
    }),
    { kind: "flagged", reason: "underpaid" },
  );
  assert.deepEqual(
    classifySettlementFailure({
      payment: { status: "superseded", amount: 150_000 },
      receivedAmount: 150_000,
    }),
    { kind: "flagged", reason: "superseded" },
  );
  assert.deepEqual(
    classifySettlementFailure({
      payment: { status: "failed", amount: 150_000 },
      receivedAmount: 150_000,
    }),
    { kind: "flagged", reason: "non-settleable" },
  );
});

test("trạng thái superseded được xét trước khi xét tiền", () => {
  // Thứ tự này quan trọng: admin đổi giá là việc của mình, còn trả thiếu là việc
  // của khách. Báo sai lý do sẽ đẩy người xử lý đi sai hướng.
  assert.deepEqual(
    classifySettlementFailure({
      payment: { status: "superseded", amount: 150_000 },
      receivedAmount: 1_000,
    }),
    { kind: "flagged", reason: "superseded" },
  );
});

test("điều kiện thoả mà vẫn không claim được thì là tranh chấp, không im lặng", () => {
  // Đơn settle được, tiền đủ, nhưng UPDATE không ăn dòng nào: có ai đó vừa đổi
  // đơn giữa hai câu lệnh. Không phân loại được thêm nhưng vẫn phải hiện ra.
  assert.deepEqual(
    classifySettlementFailure({
      payment: { status: "pending", amount: 150_000 },
      receivedAmount: 150_000,
    }),
    { kind: "flagged", reason: "stale-claim" },
  );
  assert.deepEqual(
    classifySettlementFailure({
      payment: { status: "cancelled", amount: 150_000 },
      receivedAmount: 150_000,
    }),
    { kind: "flagged", reason: "stale-claim" },
  );
});

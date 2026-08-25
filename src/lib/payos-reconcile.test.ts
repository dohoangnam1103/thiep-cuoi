import assert from "node:assert/strict";
import test from "node:test";

import { isRetryablePayosError, PayosApiError } from "./payos";
import {
  isReconcileCandidate,
  PAYOS_RECONCILE_LOOKBACK_DAYS,
} from "./payos-reconcile";

const DAY_MS = 24 * 60 * 60 * 1000;
const now = new Date("2026-08-26T12:00:00.000Z");

function payment(overrides: Partial<Parameters<typeof isReconcileCandidate>[0]> = {}) {
  return {
    provider: "payos",
    status: "pending",
    providerOrderCode: "1787000000123",
    createdAt: new Date(now.getTime() - DAY_MS),
    ...overrides,
  };
}

test("đơn payOS chưa chốt trong cửa sổ thì phải được hỏi lại", () => {
  assert.equal(isReconcileCandidate(payment(), now), true);
  // Đơn bị hủy khi đổi voucher vẫn nằm trong SETTLEABLE_PAYMENT_STATUSES, nên
  // tiền vẫn có thể về nó và nó vẫn phải được đối soát.
  assert.equal(isReconcileCandidate(payment({ status: "cancelled" }), now), true);
});

test("đơn đã chốt hoặc bị vô hiệu thì không hỏi lại payOS", () => {
  assert.equal(isReconcileCandidate(payment({ status: "paid" }), now), false);
  assert.equal(isReconcileCandidate(payment({ status: "superseded" }), now), false);
  assert.equal(isReconcileCandidate(payment({ status: "failed" }), now), false);
});

test("chỉ đối soát đơn payOS, và chỉ khi có mã đơn bên payOS", () => {
  assert.equal(isReconcileCandidate(payment({ provider: "casso" }), now), false);
  assert.equal(isReconcileCandidate(payment({ providerOrderCode: null }), now), false);
});

test("cửa sổ đối soát có biên rõ ràng, không nới theo tuổi database", () => {
  const insideEdge = new Date(
    now.getTime() - PAYOS_RECONCILE_LOOKBACK_DAYS * DAY_MS + 1_000,
  );
  const outsideEdge = new Date(
    now.getTime() - PAYOS_RECONCILE_LOOKBACK_DAYS * DAY_MS - 1_000,
  );
  assert.equal(isReconcileCandidate(payment({ createdAt: insideEdge }), now), true);
  assert.equal(isReconcileCandidate(payment({ createdAt: outsideEdge }), now), false);
});

test("cửa sổ phải phủ được hạn 24h của link payOS", () => {
  // Tiền chỉ có thể về trong 24h kể từ lúc tạo đơn vì link payOS hết hạn sau đó.
  // Cửa sổ đối soát hẹp hơn 1 ngày sẽ bỏ sót ngay cả webhook mất trong ngày.
  assert.ok(
    PAYOS_RECONCILE_LOOKBACK_DAYS >= 1,
    `cửa sổ ${PAYOS_RECONCILE_LOOKBACK_DAYS} ngày quá hẹp`,
  );
});

test("429 và 5xx của payOS là lỗi tạm thời, 4xx khác thì không", () => {
  // payOS chặn rate limit bằng 429 kèm body text/html. Đo trên production: bắn
  // liên tiếp thì bị chặn, giãn 700ms thì đi qua hết. Nên 429 phải được coi là
  // đáng thử lại, nếu không cron sẽ báo lỗi giả mỗi 2 tiếng.
  assert.equal(isRetryablePayosError(new PayosApiError("chặn", 429)), true);
  assert.equal(isRetryablePayosError(new PayosApiError("sập", 500)), true);
  assert.equal(isRetryablePayosError(new PayosApiError("gateway", 502)), true);

  // Chữ ký sai hoặc đơn không tồn tại thì thử lại chỉ tốn quota.
  assert.equal(isRetryablePayosError(new PayosApiError("không thấy", 404)), false);
  assert.equal(isRetryablePayosError(new PayosApiError("sai khoá", 401)), false);
});

test("timeout của AbortSignal cũng là lỗi tạm thời", () => {
  // `AbortSignal.timeout` ném DOMException tên TimeoutError, không phải
  // PayosApiError, nên phải nhận diện riêng.
  const timeout = new Error("The operation was aborted due to timeout");
  timeout.name = "TimeoutError";
  assert.equal(isRetryablePayosError(timeout), true);

  assert.equal(isRetryablePayosError(new Error("lỗi thường")), false);
  assert.equal(isRetryablePayosError(null), false);
});

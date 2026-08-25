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

/**
 * Lý do một khoản tiền đã về mà hệ thống không tự kích hoạt thiệp được.
 *
 * Mỗi giá trị ở đây tương ứng một dòng `PaymentReconciliation`, tức là một ca
 * cần người xử lý. Không dùng cho các ca lành tính như webhook gửi trùng.
 */
export type ReconciliationReason =
  /** Tiền về ít hơn số tiền của đơn. */
  | "underpaid"
  /** Thiệp đã được kích hoạt bởi một đơn khác — khoản này cần hoàn. */
  | "invitation-already-paid"
  /** Admin đổi giá làm đơn bị vô hiệu trong lúc khách đang chuyển tiền. */
  | "superseded"
  /** Đơn ở trạng thái không cho settle (`failed`...). */
  | "non-settleable"
  /** Mã chuyển khoản đã quá cửa sổ 24h (chỉ gặp ở luồng Casso/VietQR tĩnh). */
  | "expired"
  /**
   * Điều kiện settle thoả nhưng câu UPDATE không claim được dòng nào. Nghĩa là
   * có ai đó vừa đổi đơn giữa hai câu lệnh và ta không phân loại được thêm.
   */
  | "stale-claim";

/** Đường vào đã phát hiện ra ca cần đối soát. */
export type SettlementSource =
  | "payos-webhook"
  | "payos-cron"
  | "payos-status-poll"
  | "casso-webhook";

export type CassoDecision =
  | { kind: "settle" }
  | { kind: "ignore"; reason: "duplicate-paid" | "unknown-code" }
  | {
      kind: "reconcile";
      reason: Extract<
        ReconciliationReason,
        "superseded" | "expired" | "underpaid" | "non-settleable"
      >;
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

/** Ảnh chụp đơn tại thời điểm claim thất bại, đủ để phân loại nguyên nhân. */
export type FailedClaimSnapshot = {
  amount: number;
  status: string;
};

export type SettlementFailure =
  /** Lành tính, không cần ai làm gì: webhook gửi trùng, hoặc đơn đã bị xoá. */
  | { kind: "benign" }
  | { kind: "flagged"; reason: ReconciliationReason };

/**
 * Phân loại vì sao câu UPDATE claim đơn không ăn dòng nào.
 *
 * Hàm thuần và chạy SAU khi claim thất bại, không phải trước. Đó là chủ ý: việc
 * claim vẫn phải là câu lệnh ghi đầu tiên trong transaction (xem chú thích về
 * `SQLITE_BUSY_SNAPSHOT` trong `settlePayment`), nên không thể đọc trước để
 * quyết định. Đọc để phân loại thì chỉ xảy ra ở nhánh thất bại, ngoài lock.
 *
 * Phân biệt `benign` với `flagged` là phần quan trọng nhất ở đây: payOS gửi lại
 * webhook cho cùng một giao dịch, và nếu coi mọi lần claim thất bại là sự cố thì
 * trang quản trị sẽ đầy báo động giả rồi không ai còn nhìn nó nữa.
 */
export function classifySettlementFailure(input: {
  payment: FailedClaimSnapshot | null;
  receivedAmount: number;
}): SettlementFailure {
  const payment = input.payment;
  // Đơn biến mất giữa hai câu lệnh: chỉ xảy ra khi thiệp bị xoá (FK cascade).
  if (!payment) return { kind: "benign" };
  // Đã settle rồi. Gần như luôn là webhook gửi trùng hoặc cron chạy song song
  // với webhook — cả hai đều đúng như thiết kế.
  if (payment.status === "paid") return { kind: "benign" };
  if (payment.status === "superseded") {
    return { kind: "flagged", reason: "superseded" };
  }
  if (!isPaymentSettleable(payment.status)) {
    return { kind: "flagged", reason: "non-settleable" };
  }
  if (input.receivedAmount < payment.amount) {
    return { kind: "flagged", reason: "underpaid" };
  }
  return { kind: "flagged", reason: "stale-claim" };
}

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

import type { Payment } from "@/generated/prisma/client";
import { sendTrackedEmail } from "@/lib/email-delivery";
import { buildPaymentSuccessEmail, paymentSuccessDedupeKey } from "@/lib/email";
import { BANK, PAYMENT_PENDING_EXPIRES_MS } from "@/lib/payment";
import {
  cancelPayosPaymentRequest,
  createPayosPaymentRequest,
  getPayosPaymentRequest,
  type PayosPaymentRequest,
} from "@/lib/payos";
import {
  classifySettlementFailure,
  isPaymentSettleable,
  SETTLEABLE_PAYMENT_STATUSES,
  type ReconciliationReason,
  type SettlementSource,
} from "@/lib/payment-settlement";
import { prisma } from "@/lib/prisma";
import { absoluteUrl } from "@/lib/site-url";
import { buildCardName } from "@/lib/trial-reminder";

function payosFields(data: PayosPaymentRequest) {
  return {
    providerPaymentLinkId: data.paymentLinkId ?? data.id ?? null,
    providerCheckoutUrl:
      data.checkoutUrl ??
      (data.paymentLinkId || data.id
        ? `https://pay.payos.vn/web/${data.paymentLinkId ?? data.id}`
        : null),
    providerQrCode: data.qrCode ?? null,
    providerBankBin: data.bin ?? BANK.bin,
    providerBankAccount: data.accountNumber ?? BANK.account,
    providerBankAccountName: data.accountName ?? BANK.name,
  };
}

export const PAYOS_CANCELLATION_REASONS = [
  "voucher_changed",
  "provider_create_failed",
  "admin_price_changed",
] as const;

export type PayosCancellationReason =
  (typeof PAYOS_CANCELLATION_REASONS)[number];

export async function ensurePayosPaymentRequest(payment: Payment): Promise<Payment> {
  const current = await prisma.payment.findUniqueOrThrow({
    where: { id: payment.id },
  });
  if (current.provider !== "payos") return current;
  if (!current.providerOrderCode) {
    throw new Error("Đơn payOS chưa có mã nhà cung cấp");
  }
  if (current.status !== "pending") return current;
  if (current.providerPaymentLinkId && current.providerCheckoutUrl) {
    return current;
  }

  const expiresAt = new Date(
    current.createdAt.getTime() + PAYMENT_PENDING_EXPIRES_MS,
  );
  let data: PayosPaymentRequest;
  try {
    data = await createPayosPaymentRequest({
      invitationId: current.invitationId,
      orderCode: current.providerOrderCode,
      description: current.code,
      amount: current.amount,
      expiresAt,
    });
  } catch (createError) {
    try {
      data = await getPayosPaymentRequest(current.providerOrderCode);
    } catch {
      throw createError;
    }
  }

  const claimed = await prisma.payment.updateMany({
    where: { id: current.id, status: "pending" },
    data: payosFields(data),
  });
  if (claimed.count === 1) {
    return prisma.payment.findUniqueOrThrow({ where: { id: current.id } });
  }

  const latest = await prisma.payment.findUniqueOrThrow({
    where: { id: current.id },
  });
  if (latest.status === "superseded") {
    await cancelPayosPaymentRequest(
      current.providerOrderCode,
      "admin_price_changed",
    ).catch((error: unknown) => {
      console.error("Không thể hủy link payOS vừa bị supersede", {
        paymentId: current.id,
        error: error instanceof Error ? error.message : "unknown",
      });
    });
  }
  return latest;
}

export async function cancelPayosPayment(
  payment: Payment,
  reason: PayosCancellationReason = "voucher_changed",
): Promise<void> {
  if (payment.provider !== "payos" || !payment.providerOrderCode) return;
  try {
    await cancelPayosPaymentRequest(payment.providerOrderCode, reason);
  } catch (error) {
    console.error("Không thể hủy link payOS cũ", {
      paymentId: payment.id,
      error: error instanceof Error ? error.message : "unknown",
    });
  }
}

export type SettlementOutcome =
  | { kind: "settled"; invitationId: string; slug: string | null }
  /** Không settle nhưng không phải sự cố — điển hình là webhook gửi trùng. */
  | { kind: "benign" }
  /** Tiền đã về mà thiệp không mở được. Đã ghi một dòng `PaymentReconciliation`. */
  | { kind: "flagged"; reason: ReconciliationReason };

/**
 * Ném ra để rollback việc claim đơn khi thiệp đã được kích hoạt bởi đơn khác.
 *
 * Dùng exception thay vì trả về giá trị vì đây là cách duy nhất bảo toàn tính
 * nguyên tử: câu UPDATE đánh dấu đơn `paid` đã chạy rồi, và nếu chỉ `return`
 * thì Prisma vẫn commit transaction, để lại một đơn `paid` mồ côi cộng vào
 * doanh thu.
 */
class DuplicateActivationError extends Error {}

/**
 * Ghi lại một ca cần người đối soát.
 *
 * Không bao giờ để lỗi ghi log làm đổ luồng gọi: webhook mà trả non-2xx thì
 * payOS sẽ gửi lại, và mất một dòng ghi chú còn nhẹ hơn xử lý sai một khoản
 * tiền. Vì vậy vẫn `console.error` kèm theo để không mất dấu hoàn toàn.
 */
async function recordReconciliation(input: {
  paymentId: string;
  reason: ReconciliationReason;
  source: SettlementSource;
  expectedAmount: number;
  receivedAmount: number;
  localStatus: string;
  providerRef: string | null;
}): Promise<void> {
  console.warn("payment_manual_reconciliation_required", input);
  try {
    await prisma.paymentReconciliation.create({ data: input });
  } catch (error) {
    console.error("Không ghi được ca cần đối soát", {
      paymentId: input.paymentId,
      reason: input.reason,
      error: error instanceof Error ? error.message : "unknown",
    });
  }
}

/**
 * Ghi nhận một khoản tiền đã về cho `paymentId`.
 *
 * Đây là cửa duy nhất để một đơn trở thành `paid` và một thiệp trở thành
 * `paid` — webhook payOS, webhook Casso, cron đối soát và poll từ trang thanh
 * toán đều đi qua đây, nên mọi luật settle chỉ cần đúng ở một chỗ.
 *
 * Hàm tự chịu trách nhiệm ghi lại ca cần đối soát khi không settle được. Người
 * gọi chỉ cần xử lý nhánh `settled` (revalidate trang thiệp).
 */
export async function settlePayment(input: {
  paymentId: string;
  receivedAmount: number;
  source: SettlementSource;
  providerRef?: string | null;
}): Promise<SettlementOutcome> {
  const { paymentId, receivedAmount, source } = input;
  const providerRef = input.providerRef ?? null;

  let claim: { kind: "claimed"; invitationId: string; slug: string | null } | { kind: "not-claimed" };
  try {
    claim = await prisma.$transaction(async (db) => {
      // The write MUST be the first statement: a read inside this transaction
      // takes a WAL snapshot, and the read→write upgrade then fails instantly
      // with SQLITE_BUSY_SNAPSHOT whenever another writer committed in between.
      // Under parallel webhooks that surfaced as intermittent P1008 500s in E2E.
      // Settleability and the amount check therefore live in the WHERE clause;
      // reads only happen after the write lock is held.
      const claimed = await db.payment.updateMany({
        where: {
          id: paymentId,
          status: { in: [...SETTLEABLE_PAYMENT_STATUSES] },
          amount: { lte: receivedAmount },
        },
        data: { status: "paid", paidAt: new Date() },
      });
      if (claimed.count !== 1) return { kind: "not-claimed" as const };

      const payment = await db.payment.findUnique({
        where: { id: paymentId },
        include: { invitation: { select: { slug: true } } },
      });
      if (!payment) return { kind: "not-claimed" as const };

      // Chốt chặn trả hai lần. Một thiệp thường có nhiều đơn cùng settle được
      // (đơn `pending` quá hạn không bao giờ bị đổi trạng thái, và đơn
      // `cancelled` do đổi voucher vẫn nằm trong SETTLEABLE_PAYMENT_STATUSES),
      // nên nếu hai đơn cùng nhận được tiền thì cả hai sẽ thành `paid` và
      // doanh thu cộng đôi trong khi khách mất tiền hai lần.
      //
      // Điều kiện `paid: false` biến câu này thành người phân xử: chỉ đơn nào
      // lật được thiệp từ chưa trả sang đã trả mới là đơn thật, đơn còn lại bị
      // rollback và đi vào diện đối soát để admin biết có tiền cần hoàn.
      const activated = await db.invitation.updateMany({
        where: { id: payment.invitationId, paid: false },
        data: { paid: true },
      });
      if (activated.count !== 1) throw new DuplicateActivationError();

      if (payment.voucherCode) {
        await db.voucher.updateMany({
          where: { code: payment.voucherCode },
          data: { usedCount: { increment: 1 } },
        });
      }

      return {
        kind: "claimed" as const,
        invitationId: payment.invitationId,
        slug: payment.invitation.slug,
      };
    });
  } catch (error) {
    if (!(error instanceof DuplicateActivationError)) throw error;

    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      select: { amount: true, status: true },
    });
    await recordReconciliation({
      paymentId,
      reason: "invitation-already-paid",
      source,
      expectedAmount: payment?.amount ?? 0,
      receivedAmount,
      localStatus: payment?.status ?? "missing",
      providerRef,
    });
    return { kind: "flagged", reason: "invitation-already-paid" };
  }

  if (claim.kind === "claimed") {
    try {
      const recipient = await prisma.invitation.findUnique({
        where: { id: claim.invitationId },
        select: {
          userId: true,
          user: { select: { email: true } },
          content: true,
        },
      });
      const email = recipient?.user.email?.trim();
      if (recipient && email) {
        const cardName = buildCardName(recipient.content);
        const recipientName = cardName === "Thiệp cưới của bạn" ? "" : cardName;
        const { subject, html } = buildPaymentSuccessEmail({
          recipientName,
          cardName,
          accountEmail: email,
          manageUrl: absoluteUrl("/dashboard"),
        });
        const delivery = await sendTrackedEmail({
          dedupeKey: paymentSuccessDedupeKey(paymentId),
          type: "payment-success",
          recipientEmail: email,
          recipientName,
          subject,
          html,
          userId: recipient.userId,
          invitationId: claim.invitationId,
        });
        if (delivery.status === "failed" || delivery.status === "manual-review") {
          console.error("Không gửi được email cảm ơn thanh toán", {
            paymentId,
            invitationId: claim.invitationId,
            deliveryId: delivery.deliveryId,
            status: delivery.status,
          });
        }
      }
    } catch (error) {
      // Email là tác vụ phụ: không được biến webhook thành lỗi sau khi tiền và
      // trạng thái kích hoạt đã được commit thành công.
      console.error("Không xử lý được email cảm ơn thanh toán", {
        paymentId,
        invitationId: claim.invitationId,
        error: error instanceof Error ? error.message : "unknown",
      });
    }
    return {
      kind: "settled",
      invitationId: claim.invitationId,
      slug: claim.slug,
    };
  }

  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
    select: { amount: true, status: true },
  });
  const failure = classifySettlementFailure({ payment, receivedAmount });
  if (failure.kind === "benign") return { kind: "benign" };

  await recordReconciliation({
    paymentId,
    reason: failure.reason,
    source,
    expectedAmount: payment?.amount ?? 0,
    receivedAmount,
    localStatus: payment?.status ?? "missing",
    providerRef,
  });
  return { kind: "flagged", reason: failure.reason };
}

/**
 * Ghi một ca cần đối soát mà không kèm việc claim đơn.
 *
 * Dùng cho luồng Casso, nơi quyết định settle được chốt trước khi gọi
 * `settlePayment` (`decideCassoSettlement` còn xét cả cửa sổ 24h), nên các ca bị
 * chặn ở đó cần một đường riêng để hiện lên trang quản trị.
 */
export async function flagForReconciliation(input: {
  paymentId: string;
  reason: ReconciliationReason;
  source: SettlementSource;
  expectedAmount: number;
  receivedAmount: number;
  localStatus: string;
  providerRef?: string | null;
}): Promise<void> {
  await recordReconciliation({ ...input, providerRef: input.providerRef ?? null });
}

/**
 * Hỏi payOS trạng thái thật của đơn rồi sửa trạng thái local cho khớp.
 *
 * Đây là lưới an toàn cho việc webhook bị mất. `source` cần được truyền đúng để
 * dòng `PaymentReconciliation` cho biết ca đó do cron phát hiện hay do khách còn
 * đang mở trang thanh toán — hai tình huống có mức độ cấp bách khác nhau.
 */
export async function reconcilePayosPayment(
  payment: Payment,
  source: Extract<SettlementSource, "payos-cron" | "payos-status-poll">,
): Promise<string> {
  if (payment.provider !== "payos" || !payment.providerOrderCode) {
    return payment.status;
  }
  if (!isPaymentSettleable(payment.status)) return payment.status;

  const remote = await getPayosPaymentRequest(payment.providerOrderCode);
  const status = remote.status.toUpperCase();
  if (status === "PAID") {
    const outcome = await settlePayment({
      paymentId: payment.id,
      receivedAmount: Math.max(remote.amountPaid ?? 0, remote.amount ?? 0),
      source,
      providerRef: remote.paymentLinkId ?? remote.id ?? null,
    });
    if (outcome.kind === "settled") return "paid";
    return (
      await prisma.payment.findUniqueOrThrow({ where: { id: payment.id } })
    ).status;
  }
  if (status === "CANCELLED") return "cancelled";
  return payment.status;
}

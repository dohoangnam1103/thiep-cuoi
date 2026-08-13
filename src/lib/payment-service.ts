import type { Payment } from "@/generated/prisma/client";
import { BANK, PAYMENT_PENDING_EXPIRES_MS } from "@/lib/payment";
import {
  cancelPayosPaymentRequest,
  createPayosPaymentRequest,
  getPayosPaymentRequest,
  type PayosPaymentRequest,
} from "@/lib/payos";
import {
  isPaymentSettleable,
  SETTLEABLE_PAYMENT_STATUSES,
} from "@/lib/payment-settlement";
import { prisma } from "@/lib/prisma";

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

export async function markPaymentPaid(
  paymentId: string,
  receivedAmount: number,
): Promise<{ updated: boolean; invitationId?: string; slug?: string | null }> {
  return prisma.$transaction(async (db) => {
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
    if (claimed.count !== 1) return { updated: false };

    const payment = await db.payment.findUnique({
      where: { id: paymentId },
      include: { invitation: { select: { slug: true } } },
    });
    if (!payment) return { updated: false };

    await db.invitation.update({
      where: { id: payment.invitationId },
      data: { paid: true },
    });
    if (payment.voucherCode) {
      await db.voucher.updateMany({
        where: { code: payment.voucherCode },
        data: { usedCount: { increment: 1 } },
      });
    }

    return {
      updated: true,
      invitationId: payment.invitationId,
      slug: payment.invitation.slug,
    };
  });
}

export async function reconcilePayosPayment(
  payment: Payment,
): Promise<string> {
  if (payment.provider !== "payos" || !payment.providerOrderCode) {
    return payment.status;
  }
  if (!isPaymentSettleable(payment.status)) return payment.status;

  const remote = await getPayosPaymentRequest(payment.providerOrderCode);
  const status = remote.status.toUpperCase();
  if (status === "PAID") {
    const result = await markPaymentPaid(
      payment.id,
      Math.max(remote.amountPaid ?? 0, remote.amount ?? 0),
    );
    if (result.updated) return "paid";
    return (
      await prisma.payment.findUniqueOrThrow({ where: { id: payment.id } })
    ).status;
  }
  if (status === "CANCELLED") return "cancelled";
  return payment.status;
}

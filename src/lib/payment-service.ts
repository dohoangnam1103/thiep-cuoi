import type { Payment } from "@/generated/prisma/client";
import { BANK, PAYMENT_PENDING_EXPIRES_MS } from "@/lib/payment";
import {
  cancelPayosPaymentRequest,
  createPayosPaymentRequest,
  getPayosPaymentRequest,
  type PayosPaymentRequest,
} from "@/lib/payos";
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

export async function ensurePayosPaymentRequest(payment: Payment): Promise<Payment> {
  if (payment.provider !== "payos") return payment;
  if (!payment.providerOrderCode) {
    throw new Error("Đơn payOS chưa có mã nhà cung cấp");
  }
  if (payment.providerPaymentLinkId && payment.providerCheckoutUrl) {
    return payment;
  }

  const expiresAt = new Date(
    payment.createdAt.getTime() + PAYMENT_PENDING_EXPIRES_MS,
  );
  let data: PayosPaymentRequest;
  try {
    data = await createPayosPaymentRequest({
      invitationId: payment.invitationId,
      orderCode: payment.providerOrderCode,
      description: payment.code,
      amount: payment.amount,
      expiresAt,
    });
  } catch (createError) {
    try {
      data = await getPayosPaymentRequest(payment.providerOrderCode);
    } catch {
      throw createError;
    }
  }

  return prisma.payment.update({
    where: { id: payment.id },
    data: payosFields(data),
  });
}

export async function cancelPayosPayment(payment: Payment): Promise<void> {
  if (payment.provider !== "payos" || !payment.providerOrderCode) return;
  try {
    await cancelPayosPaymentRequest(
      payment.providerOrderCode,
      "Thay đổi mã giảm giá",
    );
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
    const payment = await db.payment.findUnique({
      where: { id: paymentId },
      include: { invitation: { select: { slug: true } } },
    });
    if (
      !payment ||
      payment.status === "paid" ||
      !["pending", "cancelled"].includes(payment.status) ||
      receivedAmount < payment.amount
    ) {
      return { updated: false };
    }

    const claimed = await db.payment.updateMany({
      where: { id: payment.id, status: { not: "paid" } },
      data: { status: "paid", paidAt: new Date() },
    });
    if (claimed.count !== 1) return { updated: false };

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
): Promise<"paid" | "pending" | "cancelled"> {
  if (payment.provider !== "payos" || !payment.providerOrderCode) {
    return payment.status === "paid" ? "paid" : "pending";
  }

  const remote = await getPayosPaymentRequest(payment.providerOrderCode);
  const status = remote.status.toUpperCase();
  if (status === "PAID") {
    await markPaymentPaid(
      payment.id,
      Math.max(remote.amountPaid ?? 0, remote.amount ?? 0),
    );
    return "paid";
  }
  if (status === "CANCELLED") return "cancelled";
  return "pending";
}

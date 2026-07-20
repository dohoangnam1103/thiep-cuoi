"use server";

import type { Payment } from "@/generated/prisma/client";
import { verifySession, ownInvitation } from "@/lib/dal";
import { BANK } from "@/lib/payment";
import {
  cancelPayosPayment,
  ensurePayosPaymentRequest,
  markPaymentPaid,
} from "@/lib/payment-service";
import { prisma } from "@/lib/prisma";
import { getPriceForUser } from "@/lib/payment-config";
import { applyVoucher, genOrderCode, isPendingPaymentExpired, PAYMENT_PENDING_EXPIRES_MS } from "@/lib/payment";
import { genPayosOrderCode, getPaymentProvider } from "@/lib/payos";

export type PaymentInfo = {
  paymentId: string;
  code: string;
  amount: number;
  voucherCode: string | null;
  status: string;
  expiresAt: string;
  provider: "casso" | "payos";
  checkoutUrl: string | null;
  bankBin: string;
  bankAccount: string;
  bankAccountName: string;
};

function paymentExpiresAt(createdAt: Date): string {
  return new Date(createdAt.getTime() + PAYMENT_PENDING_EXPIRES_MS).toISOString();
}

function paymentInfo(payment: Payment): PaymentInfo {
  return {
    paymentId: payment.id,
    code: payment.code,
    amount: payment.amount,
    voucherCode: payment.voucherCode,
    status: payment.status,
    expiresAt: paymentExpiresAt(payment.createdAt),
    provider: payment.provider === "payos" ? "payos" : "casso",
    checkoutUrl: payment.providerCheckoutUrl,
    bankBin: payment.providerBankBin ?? BANK.bin,
    bankAccount: payment.providerBankAccount ?? BANK.account,
    bankAccountName: payment.providerBankAccountName ?? BANK.name,
  };
}

async function preparePayment(payment: Payment): Promise<Payment> {
  return payment.provider === "payos"
    ? ensurePayosPaymentRequest(payment)
    : payment;
}

export async function createOrGetPayment(invitationId: string): Promise<PaymentInfo> {
  const { userId } = await verifySession();
  const invitation = await ownInvitation(invitationId, userId);
  if (!invitation) throw new Error("Không tìm thấy thiệp");

  const provider = getPaymentProvider();
  const existing = await prisma.payment.findFirst({
    where: { invitationId, status: "pending", provider },
    orderBy: { createdAt: "desc" },
  });
  if (existing && !isPendingPaymentExpired(existing.createdAt)) {
    return paymentInfo(await preparePayment(existing));
  }

  const price = await getPriceForUser(userId, invitationId);
  const payment = await prisma.payment.create({
    data: {
      invitationId,
      code: genOrderCode(),
      amount: price,
      provider,
      providerOrderCode: provider === "payos" ? genPayosOrderCode() : null,
    },
  });
  return paymentInfo(await preparePayment(payment));
}

export type VoucherResult =
  | { ok: true; payment: PaymentInfo }
  | { ok: false; error: string };

export async function applyVoucherToPayment(
  paymentId: string,
  rawCode: string,
): Promise<VoucherResult> {
  const { userId } = await verifySession();
  const code = rawCode.trim().toUpperCase();
  if (!code) return { ok: false, error: "Nhập mã giảm giá" };

  const payment = await prisma.payment.findUnique({ where: { id: paymentId } });
  if (!payment) return { ok: false, error: "Không tìm thấy đơn" };

  const invitation = await ownInvitation(payment.invitationId, userId);
  if (!invitation) return { ok: false, error: "Không có quyền" };
  if (payment.status !== "pending") return { ok: false, error: "Đơn đã xử lý" };
  if (payment.voucherCode) return { ok: false, error: "Đơn đã áp mã giảm giá" };
  if (isPendingPaymentExpired(payment.createdAt)) return { ok: false, error: "Đơn đã hết hạn, tải lại trang để lấy mã mới" };

  const voucher = await prisma.voucher.findUnique({ where: { code } });
  if (!voucher || !voucher.active) return { ok: false, error: "Mã không hợp lệ" };
  if (voucher.expiresAt && voucher.expiresAt < new Date()) {
    return { ok: false, error: "Mã đã hết hạn" };
  }
  if (voucher.maxUses != null && voucher.usedCount >= voucher.maxUses) {
    return { ok: false, error: "Mã đã hết lượt dùng" };
  }

  const amount = applyVoucher(payment.amount, voucher.amountOff);
  if (payment.provider !== "payos") {
    const updated = await prisma.payment.update({
      where: { id: paymentId },
      data: { amount, voucherCode: code },
    });
    if (amount === 0) {
      await markPaymentPaid(updated.id, 0);
      const paid = await prisma.payment.findUniqueOrThrow({ where: { id: updated.id } });
      return { ok: true, payment: paymentInfo(paid) };
    }
    return { ok: true, payment: paymentInfo(updated) };
  }

  let replacement = await prisma.payment.create({
    data: {
      invitationId: payment.invitationId,
      code: genOrderCode(),
      amount,
      voucherCode: code,
      provider: "payos",
      providerOrderCode: genPayosOrderCode(),
    },
  });

  try {
    if (amount === 0) {
      await markPaymentPaid(replacement.id, 0);
      replacement = await prisma.payment.findUniqueOrThrow({
        where: { id: replacement.id },
      });
    } else {
      replacement = await ensurePayosPaymentRequest(replacement);
    }
  } catch (error) {
    await prisma.payment.update({
      where: { id: replacement.id },
      data: { status: "failed" },
    });
    await cancelPayosPayment(replacement);
    console.error("Không thể tạo link payOS sau khi áp voucher", {
      paymentId: replacement.id,
      error: error instanceof Error ? error.message : "unknown",
    });
    return { ok: false, error: "Không thể tạo mã thanh toán mới, vui lòng thử lại" };
  }

  await prisma.payment.update({
    where: { id: payment.id },
    data: { status: "cancelled" },
  });
  await cancelPayosPayment(payment);

  return { ok: true, payment: paymentInfo(replacement) };
}

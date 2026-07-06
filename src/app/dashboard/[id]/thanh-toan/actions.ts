"use server";

import { verifySession, ownInvitation } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { getPriceForUser } from "@/lib/payment-config";
import { applyVoucher, genOrderCode, isPendingPaymentExpired, PAYMENT_PENDING_EXPIRES_MS } from "@/lib/payment";

export type PaymentInfo = {
  paymentId: string;
  code: string;
  amount: number;
  voucherCode: string | null;
  status: string;
  expiresAt: string;
};

function paymentExpiresAt(createdAt: Date): string {
  return new Date(createdAt.getTime() + PAYMENT_PENDING_EXPIRES_MS).toISOString();
}

export async function createOrGetPayment(invitationId: string): Promise<PaymentInfo> {
  const { userId } = await verifySession();
  const invitation = await ownInvitation(invitationId, userId);
  if (!invitation) throw new Error("Không tìm thấy thiệp");

  const existing = await prisma.payment.findFirst({
    where: { invitationId, status: "pending" },
    orderBy: { createdAt: "desc" },
  });
  if (existing && !isPendingPaymentExpired(existing.createdAt)) {
    return {
      paymentId: existing.id,
      code: existing.code,
      amount: existing.amount,
      voucherCode: existing.voucherCode,
      status: existing.status,
      expiresAt: paymentExpiresAt(existing.createdAt),
    };
  }

  const price = await getPriceForUser(userId, invitationId);
  const payment = await prisma.payment.create({
    data: {
      invitationId,
      code: genOrderCode(),
      amount: price,
    },
  });
  return {
    paymentId: payment.id,
    code: payment.code,
    amount: payment.amount,
    voucherCode: payment.voucherCode,
    status: payment.status,
    expiresAt: paymentExpiresAt(payment.createdAt),
  };
}

export type VoucherResult =
  | { ok: true; amount: number; voucherCode: string }
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
  await prisma.payment.update({
    where: { id: paymentId },
    data: { amount, voucherCode: code },
  });

  return { ok: true, amount, voucherCode: code };
}

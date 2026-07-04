"use server";

import { verifySession, ownInvitation } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { BASE_PRICE, applyVoucher, genOrderCode } from "@/lib/payment";

export type PaymentInfo = {
  paymentId: string;
  code: string;
  amount: number;
  voucherCode: string | null;
  status: string;
};

export async function createOrGetPayment(invitationId: string): Promise<PaymentInfo> {
  const { userId } = await verifySession();
  const invitation = await ownInvitation(invitationId, userId);
  if (!invitation) throw new Error("Không tìm thấy thiệp");

  const existing = await prisma.payment.findFirst({
    where: { invitationId, status: "pending" },
    orderBy: { createdAt: "desc" },
  });
  if (existing) {
    return {
      paymentId: existing.id,
      code: existing.code,
      amount: existing.amount,
      voucherCode: existing.voucherCode,
      status: existing.status,
    };
  }

  const payment = await prisma.payment.create({
    data: {
      invitationId,
      code: genOrderCode(),
      amount: BASE_PRICE,
    },
  });
  return {
    paymentId: payment.id,
    code: payment.code,
    amount: payment.amount,
    voucherCode: payment.voucherCode,
    status: payment.status,
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

  const voucher = await prisma.voucher.findUnique({ where: { code } });
  if (!voucher || !voucher.active) return { ok: false, error: "Mã không hợp lệ" };
  if (voucher.expiresAt && voucher.expiresAt < new Date()) {
    return { ok: false, error: "Mã đã hết hạn" };
  }
  if (voucher.maxUses != null && voucher.usedCount >= voucher.maxUses) {
    return { ok: false, error: "Mã đã hết lượt dùng" };
  }

  const amount = applyVoucher(BASE_PRICE, voucher.amountOff);
  await prisma.payment.update({
    where: { id: paymentId },
    data: { amount, voucherCode: code },
  });

  return { ok: true, amount, voucherCode: code };
}

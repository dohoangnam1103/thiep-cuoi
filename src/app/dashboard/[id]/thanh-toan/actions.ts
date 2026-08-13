"use server";

import type { Payment } from "@/generated/prisma/client";
import { verifySession } from "@/lib/dal";
import { getInvitationActivation } from "@/lib/invitation-entitlement";
import { BANK } from "@/lib/payment";
import {
  cancelPayosPayment,
  ensurePayosPaymentRequest,
} from "@/lib/payment-service";
import { prisma } from "@/lib/prisma";
import { getPriceForInvitation } from "@/lib/payment-config";
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
  voucherAllowed: boolean;
};

type CheckoutTxResult =
  | { kind: "not-found" }
  | { kind: "activated"; activation: "paid" | "complimentary" }
  | { kind: "payment"; payment: Payment; voucherAllowed: boolean };

export type CheckoutPreparation =
  | { kind: "not-found" }
  | { kind: "activated"; activation: "paid" | "complimentary" }
  | { kind: "price-changed" }
  | { kind: "payment"; payment: PaymentInfo };

function paymentExpiresAt(createdAt: Date): string {
  return new Date(createdAt.getTime() + PAYMENT_PENDING_EXPIRES_MS).toISOString();
}

function paymentInfo(payment: Payment, voucherAllowed: boolean): PaymentInfo {
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
    voucherAllowed,
  };
}

async function preparePayment(payment: Payment): Promise<Payment> {
  return payment.provider === "payos"
    ? ensurePayosPaymentRequest(payment)
    : payment;
}

export async function createOrGetPayment(
  invitationId: string,
): Promise<CheckoutPreparation> {
  const { userId } = await verifySession();
  const provider = getPaymentProvider();
  const result = await prisma.$transaction(async (db): Promise<CheckoutTxResult> => {
    const invitation = await db.invitation.findFirst({
      where: { id: invitationId, userId },
      select: {
        paid: true,
        complimentary: true,
        adminPriceOverride: true,
      },
    });
    if (!invitation) return { kind: "not-found" };

    const activation = getInvitationActivation(invitation);
    if (activation !== "trial") {
      return { kind: "activated", activation };
    }

    const voucherAllowed = invitation.adminPriceOverride === null;
    const existing = await db.payment.findFirst({
      where: { invitationId, status: "pending", provider },
      orderBy: { createdAt: "desc" },
    });
    if (existing && !isPendingPaymentExpired(existing.createdAt)) {
      return { kind: "payment", payment: existing, voucherAllowed };
    }

    const amount = await getPriceForInvitation(db, userId, invitationId);
    if (amount <= 0) throw new Error("INVALID_COMPLIMENTARY_STATE");
    const payment = await db.payment.create({
      data: {
        invitationId,
        code: genOrderCode(),
        amount,
        provider,
        providerOrderCode: provider === "payos" ? genPayosOrderCode() : null,
      },
    });
    return { kind: "payment", payment, voucherAllowed };
  });

  if (result.kind === "not-found" || result.kind === "activated") {
    return result;
  }
  const prepared = await preparePayment(result.payment);
  if (prepared.status !== "pending") {
    return { kind: "price-changed" };
  }
  return {
    kind: "payment",
    payment: paymentInfo(prepared, result.voucherAllowed),
  };
}

export type VoucherErrorCode =
  | "voucherRequired"
  | "paymentNotFound"
  | "forbidden"
  | "paymentProcessed"
  | "voucherAlreadyApplied"
  | "paymentExpired"
  | "voucherInvalid"
  | "voucherExpired"
  | "voucherExhausted"
  | "paymentProviderFailed"
  | "customPriceVoucherBlocked";

export type VoucherResult =
  | { ok: true; payment: PaymentInfo }
  | { ok: false; errorCode: VoucherErrorCode };

type VoucherTxResult = {
  payment: Payment;
  voucherAllowed: true;
  oldPayosToCancel: Payment | null;
  needsPayosRequest: boolean;
};

class VoucherMutationError extends Error {
  constructor(
    readonly code: Exclude<
      VoucherErrorCode,
      "voucherRequired" | "paymentProviderFailed"
    >,
  ) {
    super(code);
  }
}

function voucherFailure(error: unknown): VoucherResult {
  if (error instanceof VoucherMutationError) {
    return { ok: false, errorCode: error.code };
  }
  throw error;
}

export async function applyVoucherToPayment(
  paymentId: string,
  rawCode: string,
): Promise<VoucherResult> {
  const { userId } = await verifySession();
  const code = rawCode.trim().toUpperCase();
  if (!code) return { ok: false, errorCode: "voucherRequired" };

  let result: VoucherTxResult;
  try {
    result = await prisma.$transaction(async (db): Promise<VoucherTxResult> => {
      const payment = await db.payment.findUnique({
        where: { id: paymentId },
        include: {
          invitation: {
            select: { userId: true, adminPriceOverride: true },
          },
        },
      });
      if (!payment) throw new VoucherMutationError("paymentNotFound");
      if (payment.invitation.userId !== userId) {
        throw new VoucherMutationError("forbidden");
      }
      if (payment.status !== "pending") {
        throw new VoucherMutationError("paymentProcessed");
      }
      if (payment.voucherCode) {
        throw new VoucherMutationError("voucherAlreadyApplied");
      }
      if (isPendingPaymentExpired(payment.createdAt)) {
        throw new VoucherMutationError("paymentExpired");
      }
      if (payment.invitation.adminPriceOverride !== null) {
        throw new VoucherMutationError("customPriceVoucherBlocked");
      }

      const voucher = await db.voucher.findUnique({ where: { code } });
      if (!voucher || !voucher.active) {
        throw new VoucherMutationError("voucherInvalid");
      }
      const now = new Date();
      if (voucher.expiresAt && voucher.expiresAt < now) {
        throw new VoucherMutationError("voucherExpired");
      }
      if (voucher.maxUses != null && voucher.usedCount >= voucher.maxUses) {
        throw new VoucherMutationError("voucherExhausted");
      }

      const amount = applyVoucher(payment.amount, voucher.amountOff);
      if (payment.provider !== "payos") {
        const claimed = await db.payment.updateMany({
          where: {
            id: payment.id,
            status: "pending",
            voucherCode: null,
          },
          data:
            amount === 0
              ? {
                  amount,
                  voucherCode: code,
                  status: "paid",
                  paidAt: now,
                }
              : { amount, voucherCode: code },
        });
        if (claimed.count !== 1) {
          throw new VoucherMutationError("paymentProcessed");
        }

        if (amount === 0) {
          await db.invitation.update({
            where: { id: payment.invitationId },
            data: { paid: true },
          });
          await db.voucher.update({
            where: { id: voucher.id },
            data: { usedCount: { increment: 1 } },
          });
        }

        const updated = await db.payment.findUniqueOrThrow({
          where: { id: payment.id },
        });
        return {
          payment: updated,
          voucherAllowed: true,
          oldPayosToCancel: null,
          needsPayosRequest: false,
        };
      }

      const cancelled = await db.payment.updateMany({
        where: {
          id: payment.id,
          status: "pending",
          voucherCode: null,
        },
        data: { status: "cancelled" },
      });
      if (cancelled.count !== 1) {
        throw new VoucherMutationError("paymentProcessed");
      }

      const replacement = await db.payment.create({
        data: {
          invitationId: payment.invitationId,
          code: genOrderCode(),
          amount,
          voucherCode: code,
          status: amount === 0 ? "paid" : "pending",
          paidAt: amount === 0 ? now : null,
          provider: "payos",
          providerOrderCode: genPayosOrderCode(),
        },
      });

      if (amount === 0) {
        await db.invitation.update({
          where: { id: payment.invitationId },
          data: { paid: true },
        });
        await db.voucher.update({
          where: { id: voucher.id },
          data: { usedCount: { increment: 1 } },
        });
      }

      return {
        payment: replacement,
        voucherAllowed: true,
        oldPayosToCancel: payment,
        needsPayosRequest: amount > 0,
      };
    });
  } catch (error) {
    return voucherFailure(error);
  }

  if (result.oldPayosToCancel) {
    await cancelPayosPayment(result.oldPayosToCancel, "voucher_changed");
  }

  let payment = result.payment;
  if (result.needsPayosRequest) {
    try {
      payment = await ensurePayosPaymentRequest(payment);
    } catch (error) {
      await prisma.payment.updateMany({
        where: { id: payment.id, status: "pending" },
        data: { status: "failed" },
      });
      await cancelPayosPayment(payment, "provider_create_failed");
      console.error("Không thể tạo link payOS sau khi áp voucher", {
        paymentId: payment.id,
        error: error instanceof Error ? error.message : "unknown",
      });
      return { ok: false, errorCode: "paymentProviderFailed" };
    }
  }

  return {
    ok: true,
    payment: paymentInfo(payment, result.voucherAllowed),
  };
}

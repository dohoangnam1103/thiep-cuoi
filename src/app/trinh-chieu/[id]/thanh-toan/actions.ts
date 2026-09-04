"use server";

import type { SlideshowPayment } from "@/generated/prisma/client";
import { verifyAccountSession } from "@/lib/dal";
import { BANK, PAYMENT_PENDING_EXPIRES_MS } from "@/lib/payment";
import { getPaymentProvider } from "@/lib/payos";
import { prisma } from "@/lib/prisma";
import { getSlideshowEntitlement, SLIDESHOW_PRICE_VND } from "@/lib/slideshow/project";
import {
  genSlideshowOrderCode,
  genSlideshowPayosOrderCode,
  slideshowPaymentActiveKey,
} from "@/lib/slideshow/payment";
import { ensureSlideshowPayosRequest } from "@/lib/slideshow/payment-service";

export type SlideshowPaymentInfo = {
  paymentId: string;
  code: string;
  amount: number;
  status: string;
  expiresAt: string;
  provider: "casso" | "payos";
  checkoutUrl: string | null;
  bankBin: string;
  bankAccount: string;
  bankAccountName: string;
};

export type SlideshowCheckoutPreparation =
  | { kind: "not-found" }
  | { kind: "activated" }
  | { kind: "provider-error" }
  | { kind: "payment"; payment: SlideshowPaymentInfo };

function paymentInfo(payment: SlideshowPayment): SlideshowPaymentInfo {
  return {
    paymentId: payment.id,
    code: payment.code,
    amount: payment.amount,
    status: payment.status,
    expiresAt: new Date(payment.createdAt.getTime() + PAYMENT_PENDING_EXPIRES_MS).toISOString(),
    provider: payment.provider === "payos" ? "payos" : "casso",
    checkoutUrl: payment.providerCheckoutUrl,
    bankBin: payment.providerBankBin ?? BANK.bin,
    bankAccount: payment.providerBankAccount ?? BANK.account,
    bankAccountName: payment.providerBankAccountName ?? BANK.name,
  };
}

export async function createOrGetSlideshowPayment(
  projectId: string,
): Promise<SlideshowCheckoutPreparation> {
  const checkoutPath = `/trinh-chieu/${encodeURIComponent(projectId)}/thanh-toan`;
  const { userId } = await verifyAccountSession(checkoutPath, "slideshow");
  const project = await prisma.slideshowProject.findFirst({
    where: { id: projectId, userId },
  });
  if (!project) return { kind: "not-found" };
  if (getSlideshowEntitlement(project) === "paid" || project.complimentary) {
    return { kind: "activated" };
  }

  const provider = getPaymentProvider();
  const activeKey = slideshowPaymentActiveKey(projectId, provider);
  const expiredBefore = new Date(Date.now() - PAYMENT_PENDING_EXPIRES_MS);
  let payment: SlideshowPayment | null;
  try {
    payment = await prisma.$transaction(async (db) => {
      // Re-read entitlement inside the same transaction that creates/reuses the
      // pending order, so a concurrent activation cannot leave a fresh stale QR.
      const currentProject = await db.slideshowProject.findFirst({
        where: { id: projectId, userId },
        select: { paid: true, complimentary: true },
      });
      if (!currentProject || currentProject.paid || currentProject.complimentary) {
        return null;
      }
      await db.slideshowPayment.updateMany({
        where: { activeKey, status: "pending", createdAt: { lte: expiredBefore } },
        data: { status: "expired", activeKey: null },
      });
      const existing = await db.slideshowPayment.findUnique({
        where: { activeKey },
      });
      if (existing) return existing;
      return db.slideshowPayment.create({
        data: {
          projectId,
          activeKey,
          code: genSlideshowOrderCode(),
          amount: SLIDESHOW_PRICE_VND,
          provider,
          providerOrderCode: provider === "payos" ? genSlideshowPayosOrderCode() : null,
        },
      });
    });
  } catch (error) {
    const concurrent = await prisma.slideshowPayment.findUnique({
      where: { activeKey },
    });
    if (!concurrent) {
      const latestProject = await prisma.slideshowProject.findFirst({
        where: { id: projectId, userId },
        select: { paid: true, complimentary: true },
      });
      if (latestProject?.paid || latestProject?.complimentary) {
        return { kind: "activated" };
      }
      throw error;
    }
    payment = concurrent;
  }
  if (!payment) {
    const latestProject = await prisma.slideshowProject.findFirst({
      where: { id: projectId, userId },
      select: { paid: true, complimentary: true },
    });
    return latestProject ? { kind: "activated" } : { kind: "not-found" };
  }

  if (payment.provider === "payos") {
    try {
      payment = await ensureSlideshowPayosRequest(payment);
    } catch (error) {
      await prisma.slideshowPayment.updateMany({
        where: { id: payment.id, status: "pending" },
        data: { status: "failed", activeKey: null },
      });
      console.error("Không thể tạo checkout payOS cho slideshow", {
        paymentId: payment.id,
        error: error instanceof Error ? error.message : "unknown",
      });
      return { kind: "provider-error" };
    }
  }

  return { kind: "payment", payment: paymentInfo(payment) };
}

export type SlideshowCheckoutActionState =
  | { kind: "idle" }
  | SlideshowCheckoutPreparation;

export async function startSlideshowCheckout(
  projectId: string,
  previousState: SlideshowCheckoutActionState,
  formData: FormData,
): Promise<SlideshowCheckoutActionState> {
  // Hai tham số do useActionState truyền vào; không tin dữ liệu form để chọn
  // project. ID đã bind vẫn được kiểm tra session + ownership ở hàm bên dưới.
  void previousState;
  void formData;
  return createOrGetSlideshowPayment(projectId);
}

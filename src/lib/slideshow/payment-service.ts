import type { SlideshowPayment } from "@/generated/prisma/client";
import { BANK } from "@/lib/payment";
import {
  cancelPayosPaymentRequest,
  createPayosPaymentRequestForPaths,
  getPayosPaymentRequest,
  type PayosPaymentRequest,
} from "@/lib/payos";
import { prisma } from "@/lib/prisma";
import {
  isSlideshowPaymentExpired,
  slideshowPaymentExpiresAt,
} from "@/lib/slideshow/payment";

function payosFields(data: PayosPaymentRequest) {
  return {
    providerPaymentLinkId: data.paymentLinkId ?? data.id ?? null,
    providerCheckoutUrl:
      data.checkoutUrl
      ?? (data.paymentLinkId || data.id
        ? `https://pay.payos.vn/web/${data.paymentLinkId ?? data.id}`
        : null),
    providerQrCode: data.qrCode ?? null,
    providerBankBin: data.bin ?? BANK.bin,
    providerBankAccount: data.accountNumber ?? BANK.account,
    providerBankAccountName: data.accountName ?? BANK.name,
  };
}

function assertMatchingPayosRequest(
  payment: SlideshowPayment,
  data: PayosPaymentRequest,
): void {
  if (
    String(data.orderCode) !== payment.providerOrderCode
    || data.amount !== payment.amount
    || (data.description !== undefined && data.description !== payment.code)
  ) {
    throw new Error("Đơn payOS không khớp slideshow");
  }
}

export async function ensureSlideshowPayosRequest(
  payment: SlideshowPayment,
): Promise<SlideshowPayment> {
  const current = await prisma.slideshowPayment.findUniqueOrThrow({
    where: { id: payment.id },
  });
  if (current.provider !== "payos" || current.status !== "pending") return current;
  if (!current.providerOrderCode) throw new Error("Đơn payOS chưa có mã nhà cung cấp");
  if (current.providerPaymentLinkId && current.providerCheckoutUrl) return current;

  const paymentPath = `/trinh-chieu/${encodeURIComponent(current.projectId)}/thanh-toan`;
  let data: PayosPaymentRequest;
  try {
    data = await createPayosPaymentRequestForPaths({
      orderCode: current.providerOrderCode,
      description: current.code,
      amount: current.amount,
      expiresAt: slideshowPaymentExpiresAt(current.createdAt),
      returnPath: `${paymentPath}?payos=success`,
      cancelPath: `${paymentPath}?payos=cancel`,
    });
  } catch (createError) {
    try {
      data = await getPayosPaymentRequest(current.providerOrderCode);
    } catch {
      throw createError;
    }
  }
  assertMatchingPayosRequest(current, data);

  await prisma.slideshowPayment.updateMany({
    where: { id: current.id, status: "pending" },
    data: payosFields(data),
  });
  return prisma.slideshowPayment.findUniqueOrThrow({ where: { id: current.id } });
}

class SlideshowAlreadyActivatedError extends Error {}

const AUTO_SETTLE_STATUSES = [
  "pending",
  "expired",
  "cancelled",
  "superseded",
  "failed",
  "review",
] as const;
const PAYOS_RECONCILABLE_STATUSES = ["pending", "expired", "superseded"] as const;
const payosReconciliableStatusSet = new Set<string>(PAYOS_RECONCILABLE_STATUSES);

type ReviewReason = "underpaid" | "expired" | "already-active";
type SettlementSource =
  | "casso-webhook"
  | "payos-webhook"
  | "payos-status-poll"
  | "payos-cron";

export type SlideshowSettlementOutcome =
  | { kind: "settled"; projectId: string; shareToken: string }
  | { kind: "benign" }
  | { kind: "review"; reason: ReviewReason };

async function recordReview(input: {
  paymentId: string;
  reason: ReviewReason;
  receivedAmount: number;
  providerRef: string | null;
  source: SettlementSource;
}): Promise<void> {
  await prisma.slideshowPayment.updateMany({
    where: { id: input.paymentId, status: { not: "paid" } },
    data: {
      status: "review",
      activeKey: null,
      reviewReason: input.reason,
      receivedAmount: input.receivedAmount,
      providerRef: input.providerRef,
      reviewDetectedAt: new Date(),
    },
  });
  console.warn("slideshow_payment_manual_review", input);
}

export async function settleSlideshowPayment(input: {
  paymentId: string;
  receivedAmount: number;
  source: SettlementSource;
  providerRef?: string | null;
}): Promise<SlideshowSettlementOutcome> {
  const providerRef = input.providerRef ?? null;
  const existing = await prisma.slideshowPayment.findUnique({
    where: { id: input.paymentId },
  });
  if (!existing || existing.status === "paid") return { kind: "benign" };
  if (input.receivedAmount < existing.amount) {
    await recordReview({
      paymentId: existing.id,
      reason: "underpaid",
      receivedAmount: input.receivedAmount,
      providerRef,
      source: input.source,
    });
    return { kind: "review", reason: "underpaid" };
  }
  if (input.source === "casso-webhook" && isSlideshowPaymentExpired(existing.createdAt)) {
    await recordReview({
      paymentId: existing.id,
      reason: "expired",
      receivedAmount: input.receivedAmount,
      providerRef,
      source: input.source,
    });
    return { kind: "review", reason: "expired" };
  }

  try {
    const claimed = await prisma.$transaction(async (db) => {
      // Một webhook có tiền đã xác thực vẫn phải được xử lý nếu local status đã
      // chuyển expired/superseded/cancelled. Chỉ paid là terminal idempotent.
      const updated = await db.slideshowPayment.updateMany({
        where: {
          id: existing.id,
          status: { in: [...AUTO_SETTLE_STATUSES] },
          amount: { lte: input.receivedAmount },
        },
        data: {
          status: "paid",
          paidAt: new Date(),
          activeKey: null,
          reviewReason: null,
          receivedAmount: input.receivedAmount,
          providerRef,
          reviewDetectedAt: null,
        },
      });
      if (updated.count !== 1) return null;

      const payment = await db.slideshowPayment.findUnique({
        where: { id: existing.id },
        include: { project: { select: { shareToken: true } } },
      });
      if (!payment) return null;
      const activated = await db.slideshowProject.updateMany({
        where: {
          id: payment.projectId,
          paid: false,
          complimentary: false,
        },
        data: { paid: true },
      });
      if (activated.count !== 1) throw new SlideshowAlreadyActivatedError();

      const siblings = await db.slideshowPayment.findMany({
        where: { projectId: payment.projectId, id: { not: payment.id }, status: "pending" },
        select: { provider: true, providerOrderCode: true },
      });
      await db.slideshowPayment.updateMany({
        where: { projectId: payment.projectId, id: { not: payment.id }, status: "pending" },
        data: { status: "superseded", activeKey: null },
      });
      return {
        projectId: payment.projectId,
        shareToken: payment.project.shareToken,
        siblingPayosCodes: siblings
          .filter((sibling) => sibling.provider === "payos" && sibling.providerOrderCode)
          .map((sibling) => sibling.providerOrderCode!),
      };
    });
    if (!claimed) return { kind: "benign" };
    await Promise.all(claimed.siblingPayosCodes.map((orderCode) =>
      cancelPayosPaymentRequest(orderCode, "slideshow_already_paid").catch((error: unknown) => {
        console.error("Không thể hủy link payOS slideshow dư", {
          orderCode,
          error: error instanceof Error ? error.message : "unknown",
        });
      }),
    ));
    return {
      kind: "settled",
      projectId: claimed.projectId,
      shareToken: claimed.shareToken,
    };
  } catch (error) {
    if (!(error instanceof SlideshowAlreadyActivatedError)) throw error;
    await recordReview({
      paymentId: existing.id,
      reason: "already-active",
      receivedAmount: input.receivedAmount,
      providerRef,
      source: input.source,
    });
    return { kind: "review", reason: "already-active" };
  }
}

export async function reconcileSlideshowPayosPayment(
  payment: SlideshowPayment,
  source: "payos-status-poll" | "payos-cron" = "payos-status-poll",
): Promise<string> {
  if (
    payment.provider !== "payos"
    || !payment.providerOrderCode
    || !payosReconciliableStatusSet.has(payment.status)
  ) {
    return payment.status;
  }
  const remote = await getPayosPaymentRequest(payment.providerOrderCode);
  assertMatchingPayosRequest(payment, remote);
  const remoteStatus = remote.status.toUpperCase();
  if (remoteStatus === "PAID") {
    await settleSlideshowPayment({
      paymentId: payment.id,
      receivedAmount: Math.max(remote.amountPaid ?? 0, remote.amount ?? 0),
      source,
      providerRef: remote.paymentLinkId ?? remote.id ?? null,
    });
    return (await prisma.slideshowPayment.findUniqueOrThrow({ where: { id: payment.id } })).status;
  }
  if (remoteStatus === "CANCELLED" && payment.status === "pending") {
    await prisma.slideshowPayment.updateMany({
      where: { id: payment.id, status: "pending" },
      data: { status: "cancelled", activeKey: null },
    });
    return (await prisma.slideshowPayment.findUniqueOrThrow({ where: { id: payment.id } })).status;
  }
  return payment.status;
}

export type SlideshowPayosReconcileSummary = {
  scanned: number;
  settled: number;
  unchanged: number;
  failed: number;
};

export async function reconcileOutstandingSlideshowPayosPayments(
  limit = 100,
): Promise<SlideshowPayosReconcileSummary> {
  const cutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1_000);
  const payments = await prisma.slideshowPayment.findMany({
    where: {
      provider: "payos",
      status: { in: [...PAYOS_RECONCILABLE_STATUSES] },
      providerOrderCode: { not: null },
      createdAt: { gte: cutoff },
    },
    orderBy: { createdAt: "asc" },
    take: limit,
  });
  const summary = { scanned: payments.length, settled: 0, unchanged: 0, failed: 0 };
  for (const [index, payment] of payments.entries()) {
    if (index > 0) await new Promise((resolve) => setTimeout(resolve, 700));
    try {
      const status = await reconcileSlideshowPayosPayment(payment, "payos-cron");
      if (status === "paid") summary.settled += 1;
      else summary.unchanged += 1;
    } catch (error) {
      summary.failed += 1;
      console.error("Không thể đối soát payOS slideshow", {
        paymentId: payment.id,
        error: error instanceof Error ? error.message : "unknown",
      });
    }
  }
  return summary;
}

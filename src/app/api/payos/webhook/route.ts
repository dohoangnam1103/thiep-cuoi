import { revalidatePath } from "next/cache";

import { markPaymentPaid } from "@/lib/payment-service";
import {
  verifyPayosWebhook,
  type PayosWebhookBody,
} from "@/lib/payos";
import { prisma } from "@/lib/prisma";

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function isPayosWebhookBody(value: unknown): value is PayosWebhookBody {
  if (!isRecord(value) || !isRecord(value.data)) return false;
  return (
    typeof value.code === "string" &&
    typeof value.desc === "string" &&
    typeof value.success === "boolean" &&
    typeof value.signature === "string" &&
    typeof value.data.orderCode === "number" &&
    Number.isSafeInteger(value.data.orderCode) &&
    typeof value.data.amount === "number" &&
    typeof value.data.description === "string" &&
    typeof value.data.accountNumber === "string" &&
    typeof value.data.reference === "string" &&
    typeof value.data.transactionDateTime === "string" &&
    typeof value.data.currency === "string" &&
    typeof value.data.paymentLinkId === "string" &&
    typeof value.data.code === "string" &&
    typeof value.data.desc === "string"
  );
}

export async function POST(req: Request) {
  const raw: unknown = await req.json().catch(() => null);
  if (!isPayosWebhookBody(raw)) {
    return Response.json({ error: "invalid payload" }, { status: 400 });
  }
  if (!verifyPayosWebhook(raw)) {
    return Response.json({ error: "invalid signature" }, { status: 401 });
  }

  const orderCode = String(raw.data.orderCode);
  const payment = await prisma.payment.findUnique({
    where: { providerOrderCode: orderCode },
    select: { id: true, provider: true },
  });

  if (
    payment?.provider === "payos" &&
    raw.success &&
    raw.code === "00" &&
    raw.data.code === "00" &&
    raw.data.currency === "VND"
  ) {
    const result = await markPaymentPaid(payment.id, raw.data.amount);
    if (result.updated) {
      console.info("Đã xác nhận thanh toán payOS", {
        paymentId: payment.id,
        orderCode,
        reference: raw.data.reference,
      });
      if (result.slug) revalidatePath(`/thiep/${result.slug}`);
    } else {
      const latest = await prisma.payment.findUnique({
        where: { id: payment.id },
        select: { status: true },
      });
      console.warn("payment_settlement_not_claimed", {
        paymentId: payment.id,
        provider: "payos",
        localStatus: latest?.status ?? "missing",
      });
    }
  }

  return Response.json({ success: true });
}

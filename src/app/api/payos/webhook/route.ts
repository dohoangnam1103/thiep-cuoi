import { revalidatePath } from "next/cache";

import { settlePayment } from "@/lib/payment-service";
import {
  verifyPayosWebhook,
  type PayosWebhookBody,
} from "@/lib/payos";
import { prisma } from "@/lib/prisma";
import { settleSlideshowPayment } from "@/lib/slideshow/payment-service";

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
  const [payment, slideshowPayment] = await Promise.all([
    prisma.payment.findUnique({
      where: { providerOrderCode: orderCode },
      select: { id: true, provider: true },
    }),
    prisma.slideshowPayment.findUnique({
      where: { providerOrderCode: orderCode },
      select: { id: true, provider: true },
    }),
  ]);
  if (payment && slideshowPayment) {
    console.error("Mã payOS trùng giữa invitation và slideshow", { orderCode });
    return Response.json({ success: true });
  }
  const isSuccessfulVndPayment =
    raw.success
    && raw.code === "00"
    && raw.data.code === "00"
    && raw.data.currency === "VND";

  if (payment?.provider === "payos" && isSuccessfulVndPayment) {
    const outcome = await settlePayment({
      paymentId: payment.id,
      receivedAmount: raw.data.amount,
      source: "payos-webhook",
      providerRef: raw.data.reference,
    });
    if (outcome.kind === "settled") {
      console.info("Đã xác nhận thanh toán payOS", {
        paymentId: payment.id,
        orderCode,
        reference: raw.data.reference,
      });
      if (outcome.slug) revalidatePath(`/thiep/${outcome.slug}`);
    }
  } else if (slideshowPayment?.provider === "payos" && isSuccessfulVndPayment) {
    const outcome = await settleSlideshowPayment({
      paymentId: slideshowPayment.id,
      receivedAmount: raw.data.amount,
      source: "payos-webhook",
      providerRef: raw.data.reference,
    });
    if (outcome.kind === "settled") {
      revalidatePath(`/trinh-chieu/${outcome.projectId}`);
      revalidatePath(`/trinh-chieu/xem/${outcome.shareToken}`);
      revalidatePath("/trinh-chieu/du-an");
    }
  }

  return Response.json({ success: true });
}

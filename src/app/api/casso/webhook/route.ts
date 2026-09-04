import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import { ORDER_CODE_REGEX, verifyCassoSignature } from "@/lib/payment";
import { flagForReconciliation, settlePayment } from "@/lib/payment-service";
import {
  cassoReconciliationMetadata,
  decideCassoSettlement,
  type CassoCandidate,
  type CassoDecision,
} from "@/lib/payment-settlement";
import { SLIDESHOW_ORDER_CODE_REGEX } from "@/lib/slideshow/payment";
import { settleSlideshowPayment } from "@/lib/slideshow/payment-service";

type CassoV2Data = {
  id?: number;
  description?: string;
  amount?: number;
};

type CassoV2Body = {
  error?: number;
  data?: CassoV2Data;
};

async function reportReconciliation(input: {
  transactionId: number | string | null;
  payment: CassoCandidate;
  receivedAmount: number;
  reason: Extract<CassoDecision, { kind: "reconcile" }>["reason"];
}): Promise<void> {
  console.warn(
    "payment_manual_reconciliation_required",
    cassoReconciliationMetadata(input),
  );
  await flagForReconciliation({
    paymentId: input.payment.id,
    reason: input.reason,
    source: "casso-webhook",
    expectedAmount: input.payment.amount,
    receivedAmount: input.receivedAmount,
    localStatus: input.payment.status,
    providerRef:
      input.transactionId === null ? null : String(input.transactionId),
  });
}

export async function POST(req: Request) {
  const checksumKey = process.env.CASSO_WEBHOOK_TOKEN;
  if (!checksumKey) {
    return Response.json({ error: "not configured" }, { status: 500 });
  }

  let body: CassoV2Body;
  try {
    body = (await req.json()) as CassoV2Body;
  } catch {
    return Response.json({ error: "invalid json" }, { status: 400 });
  }

  const signature = req.headers.get("x-casso-signature");
  if (!verifyCassoSignature(signature, body as never, checksumKey)) {
    return Response.json({ error: "invalid signature" }, { status: 401 });
  }

  const tx = body.data;
  const description = tx?.description ?? "";
  const received = typeof tx?.amount === "number" ? tx.amount : 0;
  if (received <= 0) return Response.json({ success: true });

  const normalizedDescription = description.toUpperCase();
  const invitationMatch = normalizedDescription.match(ORDER_CODE_REGEX);
  const slideshowMatch = normalizedDescription.match(SLIDESHOW_ORDER_CODE_REGEX);
  if (invitationMatch && slideshowMatch) {
    console.warn("casso_ambiguous_payment_codes", {
      transactionId: tx?.id ?? null,
      invitationCode: invitationMatch[0],
      slideshowCode: slideshowMatch[0],
    });
    return Response.json({ error: "ambiguous payment codes" }, { status: 422 });
  }

  if (invitationMatch) {
    const payment = await prisma.payment.findUnique({
      where: { code: invitationMatch[0] },
    });
    const decision = decideCassoSettlement({
      payment,
      receivedAmount: received,
      now: new Date(),
    });

    if (decision.kind === "reconcile" && payment) {
      await reportReconciliation({
        transactionId: tx?.id ?? null,
        payment,
        receivedAmount: received,
        reason: decision.reason,
      });
    }
    if (decision.kind === "settle" && payment) {
      const outcome = await settlePayment({
        paymentId: payment.id,
        receivedAmount: received,
        source: "casso-webhook",
        providerRef: tx?.id === undefined ? null : String(tx.id),
      });
      if (outcome.kind === "settled" && outcome.slug) {
        revalidatePath(`/thiep/${outcome.slug}`);
      }
    }
    return Response.json({ success: true });
  }

  if (slideshowMatch) {
    const payment = await prisma.slideshowPayment.findFirst({
      where: { code: slideshowMatch[0], provider: "casso" },
    });
    if (payment) {
      const outcome = await settleSlideshowPayment({
        paymentId: payment.id,
        receivedAmount: received,
        source: "casso-webhook",
        providerRef: tx?.id === undefined ? null : String(tx.id),
      });
      if (outcome.kind === "settled") {
        revalidatePath(`/trinh-chieu/${outcome.projectId}`);
        revalidatePath(`/trinh-chieu/xem/${outcome.shareToken}`);
        revalidatePath("/trinh-chieu/du-an");
      }
    }
  }

  return Response.json({ success: true });
}

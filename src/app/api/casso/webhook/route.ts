import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import { ORDER_CODE_REGEX, verifyCassoSignature } from "@/lib/payment";
import { markPaymentPaid } from "@/lib/payment-service";
import {
  cassoReconciliationMetadata,
  decideCassoSettlement,
  type CassoCandidate,
  type CassoDecision,
} from "@/lib/payment-settlement";

type CassoV2Data = {
  id?: number;
  description?: string;
  amount?: number;
};

type CassoV2Body = {
  error?: number;
  data?: CassoV2Data;
};

function logReconciliation(input: {
  transactionId: number | string | null;
  payment: CassoCandidate;
  receivedAmount: number;
  reason: Extract<CassoDecision, { kind: "reconcile" }>["reason"];
}): void {
  console.warn(
    "payment_manual_reconciliation_required",
    cassoReconciliationMetadata(input),
  );
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

  if (received <= 0) {
    return Response.json({ success: true });
  }

  const match = description.toUpperCase().match(ORDER_CODE_REGEX);
  if (!match) {
    return Response.json({ success: true });
  }

  const payment = await prisma.payment.findUnique({
    where: { code: match[0] },
  });
  const decision = decideCassoSettlement({
    payment,
    receivedAmount: received,
    now: new Date(),
  });

  if (decision.kind === "reconcile" && payment) {
    logReconciliation({
      transactionId: tx?.id ?? null,
      payment,
      receivedAmount: received,
      reason: decision.reason,
    });
  }

  if (decision.kind === "settle" && payment) {
    const result = await markPaymentPaid(payment.id, received);
    if (result.updated) {
      if (result.slug) revalidatePath(`/thiep/${result.slug}`);
    } else {
      const latest = await prisma.payment.findUnique({
        where: { id: payment.id },
      });
      const latestDecision = decideCassoSettlement({
        payment: latest,
        receivedAmount: received,
        now: new Date(),
      });
      if (latest && latestDecision.kind === "reconcile") {
        logReconciliation({
          transactionId: tx?.id ?? null,
          payment: latest,
          receivedAmount: received,
          reason: latestDecision.reason,
        });
      }
    }
  }

  return Response.json({ success: true });
}

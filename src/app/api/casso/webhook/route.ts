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

type CassoV2Data = {
  id?: number;
  description?: string;
  amount?: number;
};

type CassoV2Body = {
  error?: number;
  data?: CassoV2Data;
};

/**
 * Luồng Casso chốt quyết định settle TRƯỚC khi gọi `settlePayment`, vì
 * `decideCassoSettlement` còn xét thêm cửa sổ 24h mà VietQR tĩnh không tự thực
 * thi được. Nên các ca bị chặn ở đó cần tự ghi vào bảng đối soát, không đi qua
 * đường ghi sẵn bên trong `settlePayment`.
 */
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
    await reportReconciliation({
      transactionId: tx?.id ?? null,
      payment,
      receivedAmount: received,
      reason: decision.reason,
    });
  }

  if (decision.kind === "settle" && payment) {
    // Nhánh claim thất bại không cần xử lý lại ở đây: `settlePayment` đã tự
    // phân loại và ghi lại, kể cả ca thiệp đã được đơn khác kích hoạt.
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

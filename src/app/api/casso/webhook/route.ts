import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import { ORDER_CODE_REGEX, isPendingPaymentExpired, verifyCassoSignature } from "@/lib/payment";

type CassoV2Data = {
  id?: number;
  description?: string;
  amount?: number;
};

type CassoV2Body = {
  error?: number;
  data?: CassoV2Data;
};

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

  if (received > 0) {
    const match = description.toUpperCase().match(ORDER_CODE_REGEX);
    if (match) {
      const code = match[0];
      const payment = await prisma.payment.findUnique({ where: { code } });
      if (
        payment &&
        payment.provider === "casso" &&
        payment.status === "pending" &&
        !isPendingPaymentExpired(payment.createdAt) &&
        received >= payment.amount
      ) {
        await prisma.$transaction(async (db) => {
          await db.payment.update({
            where: { id: payment.id },
            data: { status: "paid", paidAt: new Date() },
          });
          await db.invitation.update({
            where: { id: payment.invitationId },
            data: { paid: true },
          });
          if (payment.voucherCode) {
            await db.voucher.updateMany({
              where: { code: payment.voucherCode },
              data: { usedCount: { increment: 1 } },
            });
          }
        });

        const invitation = await prisma.invitation.findUnique({
          where: { id: payment.invitationId },
          select: { slug: true },
        });
        if (invitation?.slug) {
          revalidatePath(`/thiep/${invitation.slug}`);
        }
      }
    }
  }

  return Response.json({ success: true });
}

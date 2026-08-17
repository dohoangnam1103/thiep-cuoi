import { verifySession } from "@/lib/dal";
import { isPendingPaymentExpired } from "@/lib/payment";
import { reconcilePayosPayment } from "@/lib/payment-service";
import { isPaymentSettleable } from "@/lib/payment-settlement";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ code: string }> },
) {
  const { userId } = await verifySession();
  const { code } = await params;
  const payment = await prisma.payment.findFirst({
    where: {
      code,
      invitation: { userId },
    },
  });
  if (!payment) {
    return Response.json({ error: "not found" }, { status: 404 });
  }

  let status = payment.status;
  if (payment.provider === "payos" && isPaymentSettleable(payment.status)) {
    try {
      status = await reconcilePayosPayment(payment);
    } catch (error) {
      console.error("Không thể đối soát trạng thái payOS", {
        paymentId: payment.id,
        error: error instanceof Error ? error.message : "unknown",
      });
    }
  }

  const visibleStatus =
    status === "pending" && isPendingPaymentExpired(payment.createdAt)
      ? "expired"
      : status;
  return Response.json({ status: visibleStatus });
}

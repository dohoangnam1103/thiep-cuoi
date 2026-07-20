import { isPendingPaymentExpired } from "@/lib/payment";
import { reconcilePayosPayment } from "@/lib/payment-service";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ code: string }> },
) {
  const { code } = await params;
  const payment = await prisma.payment.findUnique({
    where: { code },
  });
  if (!payment) {
    return Response.json({ error: "not found" }, { status: 404 });
  }
  if (payment.status === "pending" && payment.provider === "payos") {
    try {
      const remoteStatus = await reconcilePayosPayment(payment);
      if (remoteStatus === "paid") {
        return Response.json({ status: "paid" });
      }
    } catch (error) {
      console.error("Không thể đối soát trạng thái payOS", {
        paymentId: payment.id,
        error: error instanceof Error ? error.message : "unknown",
      });
    }
  }
  const status = payment.status === "pending" && isPendingPaymentExpired(payment.createdAt)
    ? "expired"
    : payment.status;
  return Response.json({ status });
}

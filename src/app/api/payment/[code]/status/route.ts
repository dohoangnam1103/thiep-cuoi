import { isPendingPaymentExpired } from "@/lib/payment";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ code: string }> },
) {
  const { code } = await params;
  const payment = await prisma.payment.findUnique({
    where: { code },
    select: { status: true, createdAt: true },
  });
  if (!payment) {
    return Response.json({ error: "not found" }, { status: 404 });
  }
  const status = payment.status === "pending" && isPendingPaymentExpired(payment.createdAt)
    ? "expired"
    : payment.status;
  return Response.json({ status });
}

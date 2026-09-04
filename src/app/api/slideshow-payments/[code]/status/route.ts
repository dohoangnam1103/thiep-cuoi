import { revalidatePath } from "next/cache";

import { getAccountSessionUserId } from "@/lib/auth/anonymous-account";
import { prisma } from "@/lib/prisma";
import { isSlideshowPaymentExpired } from "@/lib/slideshow/payment";
import { reconcileSlideshowPayosPayment } from "@/lib/slideshow/payment-service";

const headers = { "Cache-Control": "private, no-store" };

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ code: string }> },
) {
  const userId = await getAccountSessionUserId();
  if (!userId) return Response.json({ error: "not found" }, { status: 404, headers });
  const { code } = await params;
  const payment = await prisma.slideshowPayment.findFirst({
    where: { code, project: { userId } },
    include: { project: { select: { shareToken: true } } },
  });
  if (!payment) return Response.json({ error: "not found" }, { status: 404, headers });

  let status = payment.status;
  if (payment.provider === "payos" && status === "pending") {
    try {
      status = await reconcileSlideshowPayosPayment(payment);
    } catch (error) {
      console.error("Không thể đối soát payOS slideshow", {
        paymentId: payment.id,
        error: error instanceof Error ? error.message : "unknown",
      });
    }
  }
  if (status === "pending" && isSlideshowPaymentExpired(payment.createdAt)) {
    const expired = await prisma.slideshowPayment.updateMany({
      where: { id: payment.id, status: "pending" },
      data: { status: "expired", activeKey: null },
    });
    status = expired.count === 1
      ? "expired"
      : (await prisma.slideshowPayment.findUnique({
          where: { id: payment.id },
          select: { status: true },
        }))?.status ?? "expired";
  }
  if (status === "paid") {
    revalidatePath(`/trinh-chieu/${payment.projectId}`);
    revalidatePath(`/trinh-chieu/xem/${payment.project.shareToken}`);
    revalidatePath("/trinh-chieu/du-an");
  }
  return Response.json({ status }, { headers });
}

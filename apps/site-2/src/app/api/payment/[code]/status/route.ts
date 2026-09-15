import { getSite2Session } from "../../../../../lib/session";
import { prisma } from "../../../../../lib/prisma";

/* Owner-scoped order status. No amounts beyond the order total, no secrets,
 * and paid state always comes from the reconciled row, never the client. */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ code: string }> },
) {
  const session = await getSite2Session();
  if (!session) {
    return Response.json({ error: "unauthenticated" }, { status: 401 });
  }
  const { code } = await params;
  const payment = await prisma.payment.findUnique({
    where: { code },
    select: {
      amount: true,
      status: true,
      invitation: { select: { userId: true } },
    },
  });
  if (!payment || payment.invitation.userId !== session.userId) {
    return Response.json({ error: "not found" }, { status: 404 });
  }
  return Response.json({ state: payment.status, amount: payment.amount });
}

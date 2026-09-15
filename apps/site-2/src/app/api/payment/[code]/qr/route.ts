import QRCode from "qrcode";

import { getSite2Session } from "../../../../../lib/session";
import { prisma } from "../../../../../lib/prisma";

/* Owner-scoped QR PNG for one order. The browser sends the session cookie,
 * which next/image optimization could not forward, so this route renders the
 * bitmap directly instead of going through the image optimizer. */
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
      providerQrCode: true,
      invitation: { select: { userId: true } },
    },
  });
  if (
    !payment ||
    payment.invitation.userId !== session.userId ||
    !payment.providerQrCode
  ) {
    return Response.json({ error: "not found" }, { status: 404 });
  }
  const png = await QRCode.toBuffer(payment.providerQrCode, {
    type: "png",
    width: 480,
    margin: 2,
    errorCorrectionLevel: "M",
  });
  return new Response(new Uint8Array(png), {
    headers: {
      "content-type": "image/png",
      "cache-control": "private, max-age=60",
      "x-content-type-options": "nosniff",
    },
  });
}

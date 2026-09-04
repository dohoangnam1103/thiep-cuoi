import QRCode from "qrcode";

import { getAccountSessionUserId } from "@/lib/auth/anonymous-account";
import { BANK } from "@/lib/payment";
import { prisma } from "@/lib/prisma";
import { isSlideshowPaymentExpired } from "@/lib/slideshow/payment";
import { buildVietQrPayload } from "@/lib/vietqr";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ code: string }> },
) {
  const notFound = () => Response.json({ error: "not found" }, { status: 404 });
  const userId = await getAccountSessionUserId();
  if (!userId) return notFound();
  const { code } = await params;
  const payment = await prisma.slideshowPayment.findFirst({
    where: {
      code,
      status: "pending",
      project: { userId, paid: false, complimentary: false },
    },
  });
  if (
    !payment
    || payment.provider !== "payos"
    || isSlideshowPaymentExpired(payment.createdAt)
  ) {
    return notFound();
  }

  const payload = payment.providerQrCode ?? buildVietQrPayload({
    bankId: payment.providerBankBin ?? BANK.bin,
    accountNumber: payment.providerBankAccount ?? BANK.account,
    amount: payment.amount,
    addInfo: payment.code,
  });
  const svg = await QRCode.toString(payload, {
    type: "svg",
    width: 480,
    margin: 2,
    errorCorrectionLevel: "M",
  });
  return new Response(svg, {
    headers: {
      "Cache-Control": "private, no-store",
      "Content-Type": "image/svg+xml; charset=utf-8",
      "X-Content-Type-Options": "nosniff",
      "X-Robots-Tag": "noindex",
    },
  });
}

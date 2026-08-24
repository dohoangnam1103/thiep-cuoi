import QRCode from "qrcode";

import { BANK } from "@/lib/payment";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { buildVietQrPayload } from "@/lib/vietqr";

/**
 * The QR renders `providerQrCode` — a VietQR payload carrying the amount and the
 * receiving bank account — so it is scoped to the payment's owner the same way
 * the sibling `status` route is. Two deliberate choices here:
 *
 * - `getSession()` instead of `verifySession()`: the latter redirects to
 *   `/login`, and this route answers an `<img src>`. Serving HTML to an image
 *   element fails silently; a status code does not.
 * - Every failure collapses into one 404, never 403. Order codes are short and
 *   guessable, so a distinct "forbidden" would confirm which codes exist.
 *
 * The only caller is `dashboard/[id]/thanh-toan/PaymentPanel`, reached through
 * `createOrGetPayment` → `verifyAccountSession`, so the session cookie is always
 * present on that same-origin image request.
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ code: string }> },
) {
  const notFound = () => Response.json({ error: "not found" }, { status: 404 });
  const session = await getSession();
  if (!session) return notFound();

  const { code } = await params;
  const payment = await prisma.payment.findFirst({
    where: {
      code,
      invitation: { userId: session.userId },
    },
    select: {
      provider: true,
      providerQrCode: true,
      providerBankBin: true,
      providerBankAccount: true,
      amount: true,
      code: true,
    },
  });
  if (!payment || payment.provider !== "payos") {
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
    color: { dark: "#000000", light: "#ffffff" },
  });

  return new Response(svg, {
    headers: {
      "cache-control": "private, no-store",
      "content-disposition": 'inline; filename="payos-vietqr.svg"',
      "content-type": "image/svg+xml; charset=utf-8",
      "x-content-type-options": "nosniff",
    },
  });
}

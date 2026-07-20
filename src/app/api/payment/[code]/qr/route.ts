import QRCode from "qrcode";

import { BANK } from "@/lib/payment";
import { prisma } from "@/lib/prisma";
import { buildVietQrPayload } from "@/lib/vietqr";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ code: string }> },
) {
  const { code } = await params;
  const payment = await prisma.payment.findUnique({
    where: { code },
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
    return Response.json({ error: "not found" }, { status: 404 });
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

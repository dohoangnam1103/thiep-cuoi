import type { NextRequest } from "next/server";
import QRCode from "qrcode";

import {
  buildVietQrPayload,
  normalizeVietQrAccountNumber,
  resolveVietQrBankId,
  VIETQR_BANKS,
} from "@/lib/vietqr";

export async function GET(request: NextRequest) {
  const bank = request.nextUrl.searchParams.get("bank")?.trim() ?? "";
  const accountNumber = normalizeVietQrAccountNumber(request.nextUrl.searchParams.get("account") ?? "");
  const amountParam = request.nextUrl.searchParams.get("amount")?.trim() ?? "";
  const addInfo = request.nextUrl.searchParams.get("addInfo")?.trim() || "Mung cuoi";

  if (!bank || accountNumber.length < 6) {
    return Response.json({ error: "Thiếu ngân hàng hoặc số tài khoản hợp lệ." }, { status: 400 });
  }
  if (amountParam && !/^[1-9]\d{0,12}$/.test(amountParam)) {
    return Response.json({ error: "Số tiền VietQR không hợp lệ." }, { status: 400 });
  }

  const bankId = resolveVietQrBankId(bank, VIETQR_BANKS);
  if (!bankId) {
    return Response.json({ error: `Ngân hàng “${bank}” chưa được hỗ trợ.` }, { status: 422 });
  }

  const payload = buildVietQrPayload({
    bankId,
    accountNumber,
    amount: amountParam ? Number(amountParam) : undefined,
    addInfo,
  });
  const wantsDownload = request.nextUrl.searchParams.get("download") === "1";

  if (wantsDownload) {
    const png = await QRCode.toBuffer(payload, {
      type: "png",
      width: 720,
      margin: 2,
      errorCorrectionLevel: "M",
      color: { dark: "#000000", light: "#ffffff" },
    });
    return new Response(new Uint8Array(png), {
      headers: {
        "cache-control": "public, max-age=86400, s-maxage=86400",
        "content-disposition": 'attachment; filename="vietqr-mung-cuoi.png"',
        "content-type": "image/png",
        "x-content-type-options": "nosniff",
      },
    });
  }

  const svg = await QRCode.toString(payload, {
    type: "svg",
    width: 480,
    margin: 2,
    errorCorrectionLevel: "M",
    color: { dark: "#000000", light: "#ffffff" },
  });

  return new Response(svg, {
    headers: {
      "cache-control": "public, max-age=86400, s-maxage=86400",
      "content-disposition": 'inline; filename="vietqr.svg"',
      "content-type": "image/svg+xml; charset=utf-8",
      "x-content-type-options": "nosniff",
    },
  });
}

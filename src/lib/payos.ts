import { createHmac, randomInt, timingSafeEqual } from "node:crypto";

import { absoluteUrl } from "@/lib/site-url";

const PAYOS_API_URL = process.env.PAYOS_API_URL ?? "https://api-merchant.payos.vn";

type SignatureValue = string | number | boolean | null | undefined | object;

type PayosCredentials = {
  clientId: string;
  apiKey: string;
  checksumKey: string;
};

type PayosApiResponse<T> = {
  code: string;
  desc: string;
  data: T;
  signature?: string;
};

export type PayosPaymentRequest = {
  id?: string;
  bin?: string;
  accountNumber?: string;
  accountName?: string;
  amount: number;
  amountPaid?: number;
  amountRemaining?: number;
  description?: string;
  orderCode: number;
  currency?: string;
  paymentLinkId?: string;
  status: string;
  checkoutUrl?: string;
  qrCode?: string;
};

export type PayosWebhookData = {
  orderCode: number;
  amount: number;
  description: string;
  accountNumber: string;
  reference: string;
  transactionDateTime: string;
  currency: string;
  paymentLinkId: string;
  code: string;
  desc: string;
  counterAccountBankId?: string | null;
  counterAccountBankName?: string | null;
  counterAccountName?: string | null;
  counterAccountNumber?: string | null;
  virtualAccountName?: string | null;
  virtualAccountNumber?: string | null;
};

export type PayosWebhookBody = {
  code: string;
  desc: string;
  success: boolean;
  data: PayosWebhookData;
  signature: string;
};

export class PayosApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code?: string,
  ) {
    super(message);
    this.name = "PayosApiError";
  }
}

function getPayosCredentials(): PayosCredentials {
  const clientId = process.env.PAYOS_CLIENT_ID;
  const apiKey = process.env.PAYOS_API_KEY;
  const checksumKey = process.env.PAYOS_CHECKSUM_KEY;
  if (!clientId || !apiKey || !checksumKey) {
    throw new Error("payOS chưa được cấu hình đầy đủ");
  }
  return { clientId, apiKey, checksumKey };
}

function signatureValue(value: SignatureValue): string {
  if (value == null) return "";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

export function buildPayosSignatureData(data: Record<string, SignatureValue>): string {
  return Object.keys(data)
    .sort()
    .map((key) => `${key}=${signatureValue(data[key])}`)
    .join("&");
}

export function signPayosData(data: Record<string, SignatureValue>, checksumKey: string): string {
  return createHmac("sha256", checksumKey).update(buildPayosSignatureData(data)).digest("hex");
}

export function verifyPayosDataSignature(
  data: Record<string, SignatureValue>,
  signature: string,
  checksumKey: string,
): boolean {
  if (!signature || !checksumKey) return false;
  const expected = signPayosData(data, checksumKey);
  if (expected.length !== signature.length) return false;
  return timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
}

export function verifyPayosWebhook(body: PayosWebhookBody): boolean {
  const { checksumKey } = getPayosCredentials();
  return verifyPayosDataSignature(
    body.data as Record<string, SignatureValue>,
    body.signature,
    checksumKey,
  );
}

export function getPaymentProvider(): "casso" | "payos" {
  const provider = process.env.PAYMENT_PROVIDER ?? "casso";
  if (provider !== "casso" && provider !== "payos") {
    throw new Error(`PAYMENT_PROVIDER không hợp lệ: ${provider}`);
  }
  return provider;
}

export function genPayosOrderCode(): string {
  const orderCode = Date.now() * 1000 + randomInt(0, 1000);
  if (!Number.isSafeInteger(orderCode)) {
    throw new Error("Không thể sinh mã đơn payOS an toàn");
  }
  return String(orderCode);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

async function payosRequest<T>(path: string, init?: RequestInit): Promise<PayosApiResponse<T>> {
  const { clientId, apiKey } = getPayosCredentials();
  const response = await fetch(`${PAYOS_API_URL}${path}`, {
    ...init,
    cache: "no-store",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "x-client-id": clientId,
      ...init?.headers,
    },
    signal: AbortSignal.timeout(10_000),
  });

  const raw: unknown = await response.json().catch(() => null);
  if (!isRecord(raw)) {
    throw new PayosApiError("payOS trả về dữ liệu không hợp lệ", response.status);
  }

  const code = typeof raw.code === "string" ? raw.code : undefined;
  const desc = typeof raw.desc === "string" ? raw.desc : "payOS từ chối yêu cầu";
  if (!response.ok || code !== "00") {
    throw new PayosApiError(desc, response.status, code);
  }

  return raw as PayosApiResponse<T>;
}

function verifyApiResponse(data: PayosPaymentRequest, signature: string | undefined): void {
  const { checksumKey } = getPayosCredentials();
  if (
    !signature ||
    !verifyPayosDataSignature(
      data as Record<string, SignatureValue>,
      signature,
      checksumKey,
    )
  ) {
    throw new PayosApiError("Chữ ký phản hồi payOS không hợp lệ", 502);
  }
}

export async function createPayosPaymentRequest(input: {
  invitationId: string;
  orderCode: string;
  description: string;
  amount: number;
  expiresAt: Date;
}): Promise<PayosPaymentRequest> {
  const { checksumKey } = getPayosCredentials();
  const orderCode = Number(input.orderCode);
  if (!Number.isSafeInteger(orderCode) || orderCode <= 0) {
    throw new Error("Mã đơn payOS không hợp lệ");
  }

  const returnUrl = absoluteUrl(
    `/dashboard/${input.invitationId}/thanh-toan?payos=success`,
  );
  const cancelUrl = absoluteUrl(
    `/dashboard/${input.invitationId}/thanh-toan?payos=cancel`,
  );
  const signatureFields = {
    amount: input.amount,
    cancelUrl,
    description: input.description,
    orderCode,
    returnUrl,
  };
  const body = {
    ...signatureFields,
    expiredAt: Math.floor(input.expiresAt.getTime() / 1000),
    signature: signPayosData(signatureFields, checksumKey),
  };

  const response = await payosRequest<PayosPaymentRequest>("/v2/payment-requests", {
    method: "POST",
    body: JSON.stringify(body),
  });
  verifyApiResponse(response.data, response.signature);
  return response.data;
}

export async function getPayosPaymentRequest(
  orderCode: string,
): Promise<PayosPaymentRequest> {
  const response = await payosRequest<PayosPaymentRequest>(
    `/v2/payment-requests/${encodeURIComponent(orderCode)}`,
  );
  verifyApiResponse(response.data, response.signature);
  return response.data;
}

export async function cancelPayosPaymentRequest(
  orderCode: string,
  reason: string,
): Promise<void> {
  const response = await payosRequest<PayosPaymentRequest>(
    `/v2/payment-requests/${encodeURIComponent(orderCode)}/cancel`,
    {
      method: "POST",
      body: JSON.stringify({ cancellationReason: reason }),
    },
  );
  verifyApiResponse(response.data, response.signature);
}

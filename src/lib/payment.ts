import { createHmac, timingSafeEqual } from "node:crypto";

export const BASE_PRICE = 150000;

export const FREE_TRIAL_DAYS = 7;

export const BANK = {
  bin: "970422",
  account: "0357596289",
  name: "DO HOANG NAM",
} as const;

const ORDER_CODE_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
const ORDER_CODE_LENGTH = 6;

export const ORDER_CODE_REGEX = /CD[A-Z2-7]{6}/;

export function genOrderCode(): string {
  let suffix = "";
  for (let i = 0; i < ORDER_CODE_LENGTH; i += 1) {
    suffix += ORDER_CODE_ALPHABET[Math.floor(Math.random() * ORDER_CODE_ALPHABET.length)];
  }
  return `CD${suffix}`;
}

export function buildVietQrUrl({ amount, code }: { amount: number; code: string }): string {
  const params = new URLSearchParams({
    amount: String(amount),
    addInfo: code,
    accountName: BANK.name,
  });
  return `https://img.vietqr.io/image/${BANK.bin}-${BANK.account}-compact2.png?${params.toString()}`;
}

export function applyVoucher(base: number, amountOff: number): number {
  return Math.max(0, base - amountOff);
}

type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue };

/** Sắp xếp key đệ quy (A→Z) đúng như code mẫu Casso trước khi ký/verify. */
function sortObjDataByKey(value: JsonValue): JsonValue {
  if (Array.isArray(value)) {
    return value.map(sortObjDataByKey);
  }
  if (value !== null && typeof value === "object") {
    const sorted: { [key: string]: JsonValue } = {};
    for (const key of Object.keys(value).sort()) {
      sorted[key] = sortObjDataByKey(value[key]);
    }
    return sorted;
  }
  return value;
}

/**
 * Xác thực chữ ký webhook Casso V2.
 * Header `X-Casso-Signature` dạng `t=<timestamp>,v1=<hmac>`; HMAC-SHA512 của
 * `timestamp + "." + JSON.stringify(body-sort-key)` với checksumKey.
 */
export function verifyCassoSignature(
  signatureHeader: string | null,
  body: JsonValue,
  checksumKey: string,
): boolean {
  if (!signatureHeader || !checksumKey) return false;
  const match = signatureHeader.match(/t=(\d+),v1=([a-f0-9]+)/);
  if (!match) return false;
  const [, timestamp, signature] = match;

  const message = `${timestamp}.${JSON.stringify(sortObjDataByKey(body))}`;
  const expected = createHmac("sha512", checksumKey).update(message).digest("hex");

  if (expected.length !== signature.length) return false;
  return timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
}

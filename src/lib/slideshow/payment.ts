import { randomInt } from "node:crypto";

import { PAYMENT_PENDING_EXPIRES_MS } from "@/lib/payment";
import { SLIDESHOW_PRICE_VND } from "@/lib/slideshow/project";

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
const PAYOS_NAMESPACE_BASE = 8_000_000_000_000_000;
const PAYOS_NAMESPACE_WINDOW_MS = 900_000_000_000;

export const SLIDESHOW_ORDER_CODE_REGEX = /SS[A-Z2-7]{6}/;

export function genSlideshowOrderCode(): string {
  let suffix = "";
  for (let index = 0; index < 6; index += 1) {
    suffix += ALPHABET[randomInt(0, ALPHABET.length)];
  }
  return `SS${suffix}`;
}

/**
 * payOS chỉ nhận số nguyên. Namespace 8e15 tách hẳn mã slideshow khỏi mã
 * Invitation hiện dùng Date.now()*1000 (~1e15), nhưng vẫn dưới MAX_SAFE_INTEGER.
 */
export function genSlideshowPayosOrderCode(now = Date.now()): string {
  const orderCode = PAYOS_NAMESPACE_BASE
    + (now % PAYOS_NAMESPACE_WINDOW_MS) * 1_000
    + randomInt(0, 1_000);
  if (!Number.isSafeInteger(orderCode)) throw new Error("Không thể tạo mã payOS slideshow");
  return String(orderCode);
}

export function slideshowPaymentActiveKey(projectId: string, provider: string): string {
  return `${projectId}:${provider}`;
}

export function slideshowPaymentExpiresAt(createdAt: Date): Date {
  return new Date(createdAt.getTime() + PAYMENT_PENDING_EXPIRES_MS);
}

export function isSlideshowPaymentExpired(createdAt: Date, now = new Date()): boolean {
  return now >= slideshowPaymentExpiresAt(createdAt);
}

export function slideshowPrice(): number {
  return SLIDESHOW_PRICE_VND;
}

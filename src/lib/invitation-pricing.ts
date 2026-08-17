import { z } from "zod";

export const MAX_ADMIN_FINAL_PRICE = 100_000_000;

export const adminFinalPriceSchema = z
  .string()
  .trim()
  .regex(/^\d+$/)
  .transform(Number)
  .pipe(z.number().int().min(0).max(MAX_ADMIN_FINAL_PRICE));

export function resolveSystemInvitationPrice(
  productPrice: number,
  repeatCustomerPrice: number,
  previousPaidCount: number,
): number {
  return previousPaidCount > 0 ? repeatCustomerPrice : productPrice;
}

export function resolveEffectiveInvitationPrice(
  adminPriceOverride: number | null,
  systemPrice: number,
): number {
  return adminPriceOverride ?? systemPrice;
}

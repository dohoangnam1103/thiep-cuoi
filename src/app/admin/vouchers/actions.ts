"use server";

import { revalidatePath, updateTag } from "next/cache";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { verifyAdmin } from "@/lib/admin-dal";

import {
  PUBLIC_PAYMENT_PRICES_CACHE_TAG,
  updatePaymentPrices,
} from "@/lib/payment-config";

export type VoucherState = { error?: string; ok?: boolean } | undefined;
export type ProductPriceState = { error?: string; ok?: boolean } | undefined;

const CODE_RE = /^[A-Z0-9](?:[A-Z0-9-]*[A-Z0-9])?$/;

const voucherSchema = z.object({
  code: z
    .string()
    .trim()
    .min(2, "Mã tối thiểu 2 ký tự")
    .max(40, "Mã tối đa 40 ký tự")
    .transform((v) => v.toUpperCase())
    .refine((v) => CODE_RE.test(v), "Chỉ dùng chữ, số và dấu gạch ngang"),
  amountOff: z.coerce.number().int().positive("Số tiền giảm phải lớn hơn 0"),
  maxUses: z.coerce.number().int().positive().optional(),
  expiresAt: z.string().trim().optional(),
});

const productPriceSchema = z.object({
  productPrice: z.coerce.number().int().positive("Giá sản phẩm đầu tiên phải lớn hơn 0"),
  repeatCustomerPrice: z.coerce.number().int().positive("Giá từ sản phẩm thứ 2 phải lớn hơn 0"),
});

export async function updateProductPriceAction(
  _prev: ProductPriceState,
  formData: FormData,
): Promise<ProductPriceState> {
  await verifyAdmin();

  const parsed = productPriceSchema.safeParse({
    productPrice: formData.get("productPrice"),
    repeatCustomerPrice: formData.get("repeatCustomerPrice"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dữ liệu không hợp lệ" };
  }

  await updatePaymentPrices(parsed.data);
  updateTag(PUBLIC_PAYMENT_PRICES_CACHE_TAG);
  revalidatePath("/admin/vouchers");
  revalidatePath("/bang-gia");
  revalidatePath("/vi/pricing");
  return { ok: true };
}

export async function createVoucher(_prev: VoucherState, formData: FormData): Promise<VoucherState> {
  await verifyAdmin();

  const parsed = voucherSchema.safeParse({
    code: formData.get("code"),
    amountOff: formData.get("amountOff"),
    maxUses: formData.get("maxUses") || undefined,
    expiresAt: formData.get("expiresAt") || undefined,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dữ liệu không hợp lệ" };
  }
  const { code, amountOff, maxUses, expiresAt } = parsed.data;

  const existing = await prisma.voucher.findUnique({ where: { code } });
  if (existing) return { error: "Mã voucher đã tồn tại" };

  let expires: Date | null = null;
  if (expiresAt) {
    const d = new Date(expiresAt);
    if (Number.isNaN(d.getTime())) return { error: "Ngày hết hạn không hợp lệ" };
    expires = d;
  }

  await prisma.voucher.create({
    data: { code, amountOff, maxUses: maxUses ?? null, expiresAt: expires },
  });

  revalidatePath("/admin/vouchers");
  return { ok: true };
}

export async function toggleVoucher(id: string): Promise<void> {
  await verifyAdmin();
  const voucher = await prisma.voucher.findUnique({ where: { id } });
  if (!voucher) return;
  await prisma.voucher.update({ where: { id }, data: { active: !voucher.active } });
  revalidatePath("/admin/vouchers");
}

export async function deleteVoucher(id: string): Promise<void> {
  await verifyAdmin();
  await prisma.voucher.delete({ where: { id } }).catch(() => null);
  revalidatePath("/admin/vouchers");
}

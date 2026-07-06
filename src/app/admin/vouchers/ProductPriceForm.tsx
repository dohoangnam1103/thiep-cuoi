"use client";

import { useActionState } from "react";

import type { PaymentPrices } from "@/lib/payment-config";
import { updateProductPriceAction, type ProductPriceState } from "./actions";

function formatVnd(amount: number): string {
  return new Intl.NumberFormat("vi-VN").format(amount) + "₫";
}

export function ProductPriceForm({ prices }: { prices: PaymentPrices }) {
  const [state, formAction, pending] = useActionState<ProductPriceState, FormData>(
    updateProductPriceAction,
    undefined,
  );

  return (
    <form action={formAction} className="rounded-2xl border border-border bg-card p-5">
      <div className="grid gap-4 md:grid-cols-[1fr_1fr_auto] md:items-end">
        <div>
          <label htmlFor="productPrice" className="mb-1 block text-sm font-medium text-foreground">
            Giá sản phẩm đầu tiên
          </label>
          <input
            id="productPrice"
            name="productPrice"
            type="number"
            min={1}
            required
            defaultValue={prices.productPrice}
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-foreground outline-none transition focus:ring-2 focus:ring-ring"
          />
        </div>
        <div>
          <label htmlFor="repeatCustomerPrice" className="mb-1 block text-sm font-medium text-foreground">
            Giá từ sản phẩm thứ 2
          </label>
          <input
            id="repeatCustomerPrice"
            name="repeatCustomerPrice"
            type="number"
            min={1}
            required
            defaultValue={prices.repeatCustomerPrice}
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-foreground outline-none transition focus:ring-2 focus:ring-ring"
          />
        </div>
        <button
          type="submit"
          disabled={pending}
          className="rounded-full bg-primary px-6 py-2.5 font-bold text-primary-foreground shadow-lg transition hover:bg-primary/90 disabled:opacity-60"
        >
          {pending ? "Đang lưu..." : "Lưu giá"}
        </button>
      </div>
      <p className="mt-2 text-sm text-muted-foreground">
        Hiện tại: sản phẩm đầu tiên <span className="font-semibold text-foreground">{formatVnd(prices.productPrice)}</span>, từ sản phẩm thứ 2 <span className="font-semibold text-foreground">{formatVnd(prices.repeatCustomerPrice)}</span>. Đơn thanh toán đã tạo vẫn giữ nguyên số tiền cũ.
      </p>
      {state?.error ? <p className="mt-3 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{state.error}</p> : null}
      {state?.ok ? <p className="mt-3 rounded-lg bg-emerald-500/10 px-3 py-2 text-sm text-emerald-700">Đã cập nhật giá sản phẩm.</p> : null}
    </form>
  );
}

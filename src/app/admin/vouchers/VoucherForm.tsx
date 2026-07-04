"use client";

import { useActionState, useEffect, useRef } from "react";

import { createVoucher, type VoucherState } from "./actions";

const inputClass =
  "w-full rounded-lg border border-input bg-background px-3 py-2 text-foreground outline-none transition focus:ring-2 focus:ring-ring";
const labelClass = "mb-1 block text-sm font-medium text-foreground";

export function VoucherForm() {
  const [state, formAction, pending] = useActionState<VoucherState, FormData>(createVoucher, undefined);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.ok) formRef.current?.reset();
  }, [state]);

  return (
    <form
      ref={formRef}
      action={formAction}
      className="grid gap-4 rounded-2xl border border-border bg-card p-5 sm:grid-cols-2 lg:grid-cols-4"
    >
      <div>
        <label htmlFor="code" className={labelClass}>
          Mã voucher
        </label>
        <input id="code" name="code" required placeholder="GIAM50" className={inputClass} />
      </div>
      <div>
        <label htmlFor="amountOff" className={labelClass}>
          Số tiền giảm (₫)
        </label>
        <input id="amountOff" name="amountOff" type="number" min={1} required placeholder="50000" className={inputClass} />
      </div>
      <div>
        <label htmlFor="maxUses" className={labelClass}>
          Số lần dùng tối đa
        </label>
        <input id="maxUses" name="maxUses" type="number" min={1} placeholder="Không giới hạn" className={inputClass} />
      </div>
      <div>
        <label htmlFor="expiresAt" className={labelClass}>
          Ngày hết hạn
        </label>
        <input id="expiresAt" name="expiresAt" type="date" className={inputClass} />
      </div>

      {state?.error ? (
        <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive sm:col-span-2 lg:col-span-4">
          {state.error}
        </p>
      ) : null}
      {state?.ok ? (
        <p className="rounded-lg bg-emerald-500/10 px-3 py-2 text-sm text-emerald-700 sm:col-span-2 lg:col-span-4">
          Đã tạo voucher.
        </p>
      ) : null}

      <div className="sm:col-span-2 lg:col-span-4">
        <button
          type="submit"
          disabled={pending}
          className="rounded-full bg-primary px-6 py-2.5 font-bold text-primary-foreground shadow-lg transition hover:bg-primary/90 disabled:opacity-60"
        >
          {pending ? "Đang tạo..." : "Tạo voucher"}
        </button>
      </div>
    </form>
  );
}

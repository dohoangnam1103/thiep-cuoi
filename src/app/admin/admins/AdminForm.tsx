"use client";

import { useActionState, useEffect, useRef } from "react";

import { createAdmin, type AdminFormState } from "./actions";

const inputClass =
  "w-full rounded-lg border border-input bg-background px-3 py-2 text-foreground outline-none transition focus:ring-2 focus:ring-ring";
const labelClass = "mb-1 block text-sm font-medium text-foreground";

export function AdminForm() {
  const [state, formAction, pending] = useActionState<AdminFormState, FormData>(createAdmin, undefined);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.ok) formRef.current?.reset();
  }, [state]);

  return (
    <form
      ref={formRef}
      action={formAction}
      className="grid gap-4 rounded-2xl border border-border bg-card p-5 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_auto]"
    >
      <div>
        <label htmlFor="email" className={labelClass}>
          Email admin
        </label>
        <input id="email" name="email" type="email" required placeholder="admin@example.com" className={inputClass} />
      </div>
      <div>
        <label htmlFor="password" className={labelClass}>
          Mật khẩu
        </label>
        <input id="password" name="password" type="password" minLength={6} required className={inputClass} />
      </div>
      <label className="flex items-center gap-2 self-end rounded-lg border border-border px-3 py-2 text-sm text-foreground">
        <input name="isSuperAdmin" type="checkbox" value="true" className="size-4 accent-primary" />
        Super admin
      </label>

      {state?.error ? (
        <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive sm:col-span-2 lg:col-span-3">
          {state.error}
        </p>
      ) : null}
      {state?.ok ? (
        <p className="rounded-lg bg-emerald-500/10 px-3 py-2 text-sm text-emerald-700 sm:col-span-2 lg:col-span-3">
          Đã tạo admin.
        </p>
      ) : null}

      <div className="sm:col-span-2 lg:col-span-3">
        <button
          type="submit"
          disabled={pending}
          className="rounded-full bg-primary px-6 py-2.5 font-bold text-primary-foreground shadow-lg transition hover:bg-primary/90 disabled:opacity-60"
        >
          {pending ? "Đang tạo..." : "Tạo admin"}
        </button>
      </div>
    </form>
  );
}

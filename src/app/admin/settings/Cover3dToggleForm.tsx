"use client";

import { useActionState } from "react";

import { updateCover3dAction, type Cover3dState } from "./actions";

/**
 * Công tắc là submit button của form, không phải state cục bộ: trạng thái hiển
 * thị luôn là trạng thái đã lưu trong DB, nên không có cửa sổ UI nói "bật" mà DB
 * vẫn "tắt" nếu action lỗi. Input ẩn mang giá trị SẼ chuyển sang.
 */
export function Cover3dToggleForm({ enabled }: { enabled: boolean }) {
  const [state, formAction, pending] = useActionState<Cover3dState, FormData>(
    updateCover3dAction,
    undefined,
  );

  return (
    <form action={formAction} className="rounded-2xl border border-border bg-card p-5">
      <div className="flex items-start justify-between gap-6">
        <div className="min-w-0">
          <h2 className="text-base font-semibold text-foreground">Bìa thiệp 3D</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Bật thì bìa thiệp là thẻ 3D xoay và zoom được. Tắt thì bìa là thẻ 2D phẳng,
            hiện gần như tức thì.
          </p>
        </div>

        <input type="hidden" name="enabled" value={enabled ? "off" : "on"} />
        <button
          type="submit"
          role="switch"
          aria-checked={enabled}
          aria-label="Bìa thiệp 3D"
          disabled={pending}
          className={`relative mt-1 inline-flex h-7 w-12 shrink-0 items-center rounded-full transition disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
            enabled ? "bg-primary" : "bg-muted-foreground/35"
          }`}
        >
          <span
            aria-hidden
            className={`inline-block size-5 rounded-full bg-white shadow transition-transform ${
              enabled ? "translate-x-6" : "translate-x-1"
            }`}
          />
        </button>
      </div>

      <p className="mt-4 text-sm">
        Trạng thái hiện tại:{" "}
        <span className={`font-semibold ${enabled ? "text-emerald-700" : "text-foreground"}`}>
          {enabled ? "Đang bật bìa 3D" : "Đang tắt — dùng bìa 2D"}
        </span>
        {pending ? <span className="ml-2 text-muted-foreground">Đang lưu...</span> : null}
      </p>

      {state?.error ? (
        <p className="mt-3 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {state.error}
        </p>
      ) : null}
      {state?.ok ? (
        <p className="mt-3 rounded-lg bg-emerald-500/10 px-3 py-2 text-sm text-emerald-700">
          {state.enabled ? "Đã bật bìa thiệp 3D." : "Đã tắt bìa thiệp 3D, mọi thiệp dùng bìa 2D."}
        </p>
      ) : null}
    </form>
  );
}

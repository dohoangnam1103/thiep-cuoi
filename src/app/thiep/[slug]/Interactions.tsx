"use client";

import { useActionState } from "react";

import type { PublicState } from "./actions";

type ActionFn = (prev: PublicState, formData: FormData) => Promise<PublicState>;

type GuestPrefill = { token: string; name: string; side: string | null; role: string | null } | null;

export function RsvpForm({ action, guest }: { action: ActionFn; guest?: GuestPrefill }) {
  const [state, formAction, pending] = useActionState<PublicState, FormData>(action, undefined);

  const greeting = guest
    ? `Thân mời ${[guest.role, guest.name].filter(Boolean).join(" ")}`
    : null;

  return (
    <form action={formAction} className="space-y-3">
      {greeting ? (
        <p className="text-center text-sm font-medium text-neutral-700">{greeting}</p>
      ) : null}
      {guest ? <input type="hidden" name="guestId" value={guest.token} /> : null}
      <input
        name="name"
        required
        maxLength={120}
        placeholder="Họ và tên*"
        defaultValue={guest?.name ?? ""}
        className="w-full rounded-lg border border-black/15 bg-white/80 px-4 py-2.5 text-sm text-neutral-800 outline-none focus:border-neutral-500"
      />
      <div className="flex gap-4 text-sm text-neutral-700">
        <label className="flex items-center gap-2">
          <input type="radio" name="attending" value="yes" defaultChecked /> Sẽ tham dự
        </label>
        <label className="flex items-center gap-2">
          <input type="radio" name="attending" value="no" /> Không thể đến
        </label>
      </div>
      <div className="flex gap-3">
        <input
          name="guests"
          type="number"
          min={0}
          max={50}
          defaultValue={1}
          className="w-24 rounded-lg border border-black/15 bg-white/80 px-4 py-2.5 text-sm text-neutral-800 outline-none focus:border-neutral-500"
          aria-label="Số khách"
        />
        <select
          name="side"
          className="flex-1 rounded-lg border border-black/15 bg-white/80 px-4 py-2.5 text-sm text-neutral-800 outline-none focus:border-neutral-500"
          aria-label="Nhà"
          defaultValue={guest?.side ?? ""}
        >
          <option value="">Chọn nhà</option>
          <option value="Nhà trai">Nhà trai</option>
          <option value="Nhà gái">Nhà gái</option>
        </select>
      </div>
      <label className="flex items-center gap-2 text-sm text-neutral-700">
        <input type="checkbox" name="shuttle" value="yes" /> Cần xe đưa đón
      </label>
      <input
        name="dietary"
        maxLength={200}
        placeholder="Ăn kiêng / dị ứng (không bắt buộc)"
        className="w-full rounded-lg border border-black/15 bg-white/80 px-4 py-2.5 text-sm text-neutral-800 outline-none focus:border-neutral-500"
      />
      <input
        name="songRequest"
        maxLength={200}
        placeholder="Bài hát yêu cầu (không bắt buộc)"
        className="w-full rounded-lg border border-black/15 bg-white/80 px-4 py-2.5 text-sm text-neutral-800 outline-none focus:border-neutral-500"
      />
      <textarea
        name="message"
        rows={2}
        maxLength={1000}
        placeholder="Lời nhắn (không bắt buộc)"
        className="w-full rounded-lg border border-black/15 bg-white/80 px-4 py-2.5 text-sm text-neutral-800 outline-none focus:border-neutral-500"
      />
      {state?.error ? <p className="text-sm text-red-600">{state.error}</p> : null}
      {state?.ok ? <p className="text-sm text-green-700">Cảm ơn bạn đã xác nhận!</p> : null}
      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-full bg-neutral-900 px-4 py-2.5 text-sm font-semibold uppercase tracking-wider text-white transition hover:bg-neutral-700 disabled:opacity-60"
      >
        {pending ? "Đang gửi..." : "Xác nhận tham dự"}
      </button>
    </form>
  );
}

export function WishForm({ action }: { action: ActionFn }) {
  const [state, formAction, pending] = useActionState<PublicState, FormData>(action, undefined);

  return (
    <form action={formAction} className="space-y-3">
      <input
        name="name"
        required
        maxLength={120}
        placeholder="Tên của bạn*"
        className="w-full rounded-lg border border-black/15 bg-white/80 px-4 py-2.5 text-sm text-neutral-800 outline-none focus:border-neutral-500"
      />
      <textarea
        name="text"
        rows={3}
        required
        maxLength={1000}
        placeholder="Nhập lời chúc của bạn*"
        className="w-full rounded-lg border border-black/15 bg-white/80 px-4 py-2.5 text-sm text-neutral-800 outline-none focus:border-neutral-500"
      />
      {state?.error ? <p className="text-sm text-red-600">{state.error}</p> : null}
      {state?.ok ? <p className="text-sm text-green-700">Cảm ơn lời chúc của bạn!</p> : null}
      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-full bg-neutral-900 px-4 py-2.5 text-sm font-semibold uppercase tracking-wider text-white transition hover:bg-neutral-700 disabled:opacity-60"
      >
        {pending ? "Đang gửi..." : "Gửi lời chúc"}
      </button>
    </form>
  );
}

"use client";

import { useActionState, useEffect, useState } from "react";
import QRCode from "qrcode";

import { addGuest, deleteGuest, type GuestState } from "./actions";

export type GuestRow = {
  id: string;
  token: string;
  name: string;
  side: string | null;
  role: string | null;
  note: string | null;
  responded: boolean;
};

type Props = {
  invitationId: string;
  slug: string | null;
  guests: GuestRow[];
};

function guestLink(slug: string, token: string) {
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  return `${origin}/thiep/${slug}?g=${token}`;
}

export function GuestManager({ invitationId, slug, guests }: Props) {
  const addAction = addGuest.bind(null, invitationId);
  const [state, formAction, pending] = useActionState<GuestState, FormData>(addAction, undefined);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [qrGuest, setQrGuest] = useState<GuestRow | null>(null);

  async function copyLink(g: GuestRow) {
    if (!slug) return;
    await navigator.clipboard.writeText(guestLink(slug, g.token));
    setCopiedId(g.id);
    setTimeout(() => setCopiedId((cur) => (cur === g.id ? null : cur)), 1500);
  }

  if (!slug) {
    return (
      <p className="mt-6 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-700">
        Thiệp chưa được xuất bản. Hãy xuất bản thiệp trước để tạo link riêng cho khách mời.
      </p>
    );
  }

  return (
    <div className="mt-6 space-y-8">
      <form
        action={formAction}
        className="grid gap-3 rounded-2xl border border-border bg-card p-5 sm:grid-cols-2"
      >
        <input
          name="name"
          required
          maxLength={120}
          placeholder="Tên khách*"
          className="rounded-lg border border-border bg-background px-4 py-2.5 text-sm text-foreground outline-none focus:border-primary"
        />
        <input
          name="role"
          maxLength={60}
          placeholder="Vai (anh, chị, bạn...)"
          className="rounded-lg border border-border bg-background px-4 py-2.5 text-sm text-foreground outline-none focus:border-primary"
        />
        <select
          name="side"
          defaultValue=""
          aria-label="Nhà"
          className="rounded-lg border border-border bg-background px-4 py-2.5 text-sm text-foreground outline-none focus:border-primary"
        >
          <option value="">Chọn nhà</option>
          <option value="Nhà trai">Nhà trai</option>
          <option value="Nhà gái">Nhà gái</option>
        </select>
        <input
          name="note"
          maxLength={300}
          placeholder="Ghi chú (không bắt buộc)"
          className="rounded-lg border border-border bg-background px-4 py-2.5 text-sm text-foreground outline-none focus:border-primary"
        />
        {state?.error ? (
          <p className="text-sm text-red-600 sm:col-span-2">{state.error}</p>
        ) : null}
        <button
          type="submit"
          disabled={pending}
          className="rounded-full bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground transition hover:bg-primary/90 disabled:opacity-60 sm:col-span-2"
        >
          {pending ? "Đang thêm..." : "+ Thêm khách"}
        </button>
      </form>

      {guests.length === 0 ? (
        <p className="text-muted-foreground">Chưa có khách mời nào.</p>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border">
          <table className="w-full text-left text-sm">
            <thead className="bg-secondary text-secondary-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">Tên</th>
                <th className="px-4 py-3 font-medium">Vai</th>
                <th className="px-4 py-3 font-medium">Nhà</th>
                <th className="px-4 py-3 font-medium">Phản hồi</th>
                <th className="px-4 py-3 font-medium">Link riêng</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border text-foreground">
              {guests.map((g) => (
                <tr key={g.id} className="transition hover:bg-muted">
                  <td className="px-4 py-3">{g.name}</td>
                  <td className="px-4 py-3">{g.role ?? "—"}</td>
                  <td className="px-4 py-3">{g.side ?? "—"}</td>
                  <td className="px-4 py-3">
                    {g.responded ? (
                      <span className="text-green-700">Đã phản hồi</span>
                    ) : (
                      <span className="text-muted-foreground">Chưa</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => copyLink(g)}
                        className="rounded-full bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground transition hover:bg-muted"
                      >
                        {copiedId === g.id ? "Đã copy!" : "Copy link"}
                      </button>
                      <button
                        type="button"
                        onClick={() => setQrGuest(g)}
                        className="rounded-full bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground transition hover:bg-muted"
                      >
                        QR
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteGuest(invitationId, g.id)}
                        className="rounded-full bg-red-500/15 px-3 py-1 text-xs font-medium text-red-300 transition hover:bg-red-500/25"
                      >
                        Xóa
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {qrGuest ? (
        <QrDialog
          url={guestLink(slug, qrGuest.token)}
          name={qrGuest.name}
          onClose={() => setQrGuest(null)}
        />
      ) : null}
    </div>
  );
}

function QrDialog({ url, name, onClose }: { url: string; name: string; onClose: () => void }) {
  const [dataUrl, setDataUrl] = useState<string>("");

  useEffect(() => {
    QRCode.toDataURL(url, { width: 320, margin: 2 }).then(setDataUrl).catch(() => setDataUrl(""));
  }, [url]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xs rounded-2xl bg-white p-6 text-center"
        onClick={(e) => e.stopPropagation()}
      >
        <p className="mb-3 text-sm font-semibold text-neutral-800">{name}</p>
        {dataUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={dataUrl} alt={`QR ${name}`} className="mx-auto h-64 w-64" />
        ) : (
          <p className="py-20 text-sm text-neutral-500">Đang tạo QR...</p>
        )}
        <div className="mt-4 flex justify-center gap-2">
          {dataUrl ? (
            <a
              href={dataUrl}
              download={`qr-${name}.png`}
              className="rounded-full bg-neutral-900 px-4 py-2 text-xs font-semibold text-white transition hover:bg-neutral-700"
            >
              Tải PNG
            </a>
          ) : null}
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-neutral-300 px-4 py-2 text-xs font-semibold text-neutral-700 transition hover:bg-neutral-100"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}

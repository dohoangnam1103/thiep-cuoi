"use client";

import { Dialog } from "@base-ui/react/dialog";
import { Download, Film, Loader2, MessageSquareText, Trash2, X } from "lucide-react";
import Image from "next/image";
import { useState, useTransition } from "react";

import { deleteGuestMedia, deleteWish } from "./actions";

type Wish = { id: string; name: string; text: string; createdAt: string };
type Media = {
  id: string;
  contributorName: string;
  originalName: string;
  kind: string;
  size: number;
  url: string;
};
type Target = { kind: "wish" | "media"; id: string; label: string } | null;

type Labels = {
  sectionTitle: string;
  sectionDescription: string;
  wishesTitle: string;
  mediaTitle: string;
  noWishes: string;
  noMedia: string;
  delete: string;
  download: string;
  deleteWishTitle: string;
  deleteMediaTitle: string;
  deleteDescription: string;
  cancel: string;
  deleting: string;
  error: string;
};

function formatSize(bytes: number): string {
  if (bytes >= 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

export function ModerationPanel({
  invitationId,
  initialWishes,
  initialMedia,
  labels,
}: {
  invitationId: string;
  initialWishes: Wish[];
  initialMedia: Media[];
  labels: Labels;
}) {
  const [wishes, setWishes] = useState(initialWishes);
  const [media, setMedia] = useState(initialMedia);
  const [target, setTarget] = useState<Target>(null);
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  function confirmDelete() {
    if (!target) return;
    const current = target;
    setError("");
    startTransition(async () => {
      const result = current.kind === "wish"
        ? await deleteWish(invitationId, current.id)
        : await deleteGuestMedia(invitationId, current.id);
      if (!result.ok) {
        setError(labels.error);
        return;
      }
      if (current.kind === "wish") setWishes((items) => items.filter((item) => item.id !== current.id));
      else setMedia((items) => items.filter((item) => item.id !== current.id));
      setTarget(null);
    });
  }

  return (
    <section className="mt-12 border-t border-border pt-10">
      <div className="max-w-2xl">
        <h2 className="font-heading text-xl font-semibold text-foreground">{labels.sectionTitle}</h2>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">{labels.sectionDescription}</p>
      </div>

      <div className="mt-7 grid gap-8 lg:grid-cols-2">
        <div>
          <div className="flex items-center gap-2">
            <MessageSquareText className="size-5 text-muted-foreground" aria-hidden />
            <h3 className="font-heading text-lg font-semibold text-foreground">{labels.wishesTitle} ({wishes.length})</h3>
          </div>
          {wishes.length === 0 ? (
            <p className="mt-4 rounded-2xl border border-dashed border-border p-6 text-sm text-muted-foreground">{labels.noWishes}</p>
          ) : (
            <ul className="mt-4 space-y-3">
              {wishes.map((wish) => (
                <li key={wish.id} className="rounded-2xl border border-border bg-card p-4 shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-semibold text-foreground">{wish.name}</p>
                      <p className="mt-1 text-sm leading-6 text-muted-foreground">{wish.text}</p>
                    </div>
                    <button type="button" onClick={() => setTarget({ kind: "wish", id: wish.id, label: wish.name })} aria-label={`${labels.delete}: ${wish.name}`} className="grid size-10 shrink-0 place-items-center rounded-full text-muted-foreground transition hover:bg-red-50 hover:text-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                      <Trash2 className="size-4" aria-hidden />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div>
          <div className="flex items-center gap-2">
            <Film className="size-5 text-muted-foreground" aria-hidden />
            <h3 className="font-heading text-lg font-semibold text-foreground">{labels.mediaTitle} ({media.length})</h3>
          </div>
          {media.length === 0 ? (
            <p className="mt-4 rounded-2xl border border-dashed border-border p-6 text-sm text-muted-foreground">{labels.noMedia}</p>
          ) : (
            <ul className="mt-4 grid grid-cols-2 gap-3">
              {media.map((item) => (
                <li key={item.id} className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
                  <div className="relative aspect-square bg-muted">
                    {item.kind === "video" ? (
                      <video src={item.url} controls preload="metadata" playsInline className="size-full object-cover" />
                    ) : (
                      <Image src={item.url} alt={item.originalName} fill unoptimized sizes="220px" className="object-cover" />
                    )}
                  </div>
                  <div className="p-3">
                    <p className="truncate text-sm font-semibold text-foreground">{item.contributorName}</p>
                    <p className="mt-0.5 truncate text-xs text-muted-foreground">{item.originalName} · {formatSize(item.size)}</p>
                    <div className="mt-3 flex gap-2">
                      <a href={`${item.url}?download=1`} download className="inline-flex min-h-9 flex-1 items-center justify-center gap-1.5 rounded-full bg-secondary px-3 text-xs font-semibold text-secondary-foreground transition hover:bg-muted">
                        <Download className="size-3.5" aria-hidden /> {labels.download}
                      </a>
                      <button type="button" onClick={() => setTarget({ kind: "media", id: item.id, label: item.originalName })} aria-label={`${labels.delete}: ${item.originalName}`} className="grid size-9 shrink-0 place-items-center rounded-full bg-red-50 text-red-700 transition hover:bg-red-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                        <Trash2 className="size-3.5" aria-hidden />
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <Dialog.Root open={Boolean(target)} onOpenChange={(isOpen) => { if (!isOpen && !pending) { setTarget(null); setError(""); } }}>
        <Dialog.Portal>
          <Dialog.Backdrop className="fixed inset-0 z-50 bg-black/55 backdrop-blur-[2px] transition-opacity data-[ending-style]:opacity-0 data-[starting-style]:opacity-0" />
          <Dialog.Viewport className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-4">
            <Dialog.Popup className="w-full max-w-md rounded-t-3xl bg-card p-5 text-card-foreground shadow-2xl outline-none transition data-[ending-style]:translate-y-4 data-[ending-style]:opacity-0 data-[starting-style]:translate-y-4 data-[starting-style]:opacity-0 sm:rounded-3xl sm:p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <Dialog.Title className="font-heading text-xl font-semibold">
                    {target?.kind === "media" ? labels.deleteMediaTitle : labels.deleteWishTitle}
                  </Dialog.Title>
                  <Dialog.Description className="mt-2 text-sm leading-6 text-muted-foreground">
                    {labels.deleteDescription}
                  </Dialog.Description>
                </div>
                <Dialog.Close disabled={pending} aria-label={labels.cancel} className="grid size-10 shrink-0 place-items-center rounded-full text-muted-foreground transition hover:bg-muted hover:text-foreground disabled:opacity-50">
                  <X className="size-5" aria-hidden />
                </Dialog.Close>
              </div>
              {target ? <p className="mt-4 truncate rounded-xl bg-muted px-3 py-2 text-sm font-medium">{target.label}</p> : null}
              {error ? <p role="alert" className="mt-4 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}
              <div className="mt-6 flex justify-end gap-3">
                <Dialog.Close disabled={pending} className="min-h-11 rounded-full border border-border px-5 text-sm font-semibold transition hover:bg-muted disabled:opacity-50">{labels.cancel}</Dialog.Close>
                <button type="button" onClick={confirmDelete} disabled={pending} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-red-600 px-5 text-sm font-semibold text-white transition hover:bg-red-700 disabled:opacity-60">
                  {pending ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <Trash2 className="size-4" aria-hidden />}
                  {pending ? labels.deleting : labels.delete}
                </button>
              </div>
            </Dialog.Popup>
          </Dialog.Viewport>
        </Dialog.Portal>
      </Dialog.Root>
    </section>
  );
}

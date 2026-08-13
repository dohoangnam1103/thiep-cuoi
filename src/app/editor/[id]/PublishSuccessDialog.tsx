"use client";

import { Dialog } from "@base-ui/react/dialog";
import {
  ArrowRight,
  Check,
  CircleCheck,
  CreditCard,
  Download,
  Eye,
  Loader2,
  QrCode,
  Share2,
  Users,
  X,
} from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import QRCode from "qrcode";
import { useEffect, useState } from "react";

import { trackEvent } from "@/lib/analytics";

type PublishSuccessDialogProps = {
  invitationId: string;
  activated: boolean;
  slug: string;
  onClose: () => void;
};

export function PublishSuccessDialog({
  invitationId,
  activated,
  slug,
  onClose,
}: PublishSuccessDialogProps) {
  const t = useTranslations("editor.publishSuccess");
  const invitationPath = `/thiep/${slug}`;
  const publicUrl =
    typeof window === "undefined"
      ? invitationPath
      : new URL(invitationPath, window.location.origin).toString();
  const [shared, setShared] = useState(false);
  const [showQr, setShowQr] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState("");

  useEffect(() => {
    if (!showQr || qrDataUrl) return;

    let active = true;
    QRCode.toDataURL(publicUrl, { width: 640, margin: 2 })
      .then((dataUrl) => {
        if (active) setQrDataUrl(dataUrl);
      })
      .catch(() => {
        if (active) setQrDataUrl("");
      });

    return () => {
      active = false;
    };
  }, [publicUrl, qrDataUrl, showQr]);

  async function copyLink() {
    await navigator.clipboard.writeText(publicUrl);
    setShared(true);
    trackEvent("share_invitation", { method: "copy_link", source: "publish_success" });
  }

  async function shareLink() {
    if (!navigator.share) {
      await copyLink();
      return;
    }

    try {
      await navigator.share({
        title: t("shareTitle"),
        text: t("shareText"),
        url: publicUrl,
      });
      setShared(true);
      trackEvent("share_invitation", { method: "native_share", source: "publish_success" });
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      await copyLink();
    }
  }

  return (
    <Dialog.Root open onOpenChange={(open) => !open && onClose()}>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-[150] bg-black/60 backdrop-blur-[2px] transition-opacity data-[ending-style]:opacity-0 data-[starting-style]:opacity-0" />
        <Dialog.Viewport className="fixed inset-0 z-[150] flex items-end justify-center overflow-y-auto px-4 sm:items-center sm:p-4">
          <Dialog.Popup className="relative max-h-[96dvh] w-full max-w-xl overflow-y-auto rounded-t-[2rem] border border-border bg-card text-foreground shadow-2xl outline-none transition data-[ending-style]:translate-y-4 data-[ending-style]:opacity-0 data-[starting-style]:translate-y-4 data-[starting-style]:opacity-0 sm:rounded-[2rem]">
            <Dialog.Close
              aria-label={t("close")}
              className="absolute right-4 top-4 z-10 grid size-11 place-items-center rounded-full bg-muted text-muted-foreground transition hover:bg-muted/80 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-muted-foreground/40 sm:right-5 sm:top-5"
            >
              <X className="size-6" aria-hidden />
            </Dialog.Close>

            <div className="px-5 pb-7 pt-10 text-center sm:px-10 sm:pt-12">
              <div className="mx-auto grid size-20 place-items-center rounded-3xl bg-emerald-500/10 text-emerald-600">
                <Check className="size-11 stroke-[2.5]" aria-hidden />
              </div>
              <Dialog.Title className="mt-5 text-2xl font-bold text-emerald-600 sm:text-3xl">
                {t("title")}
              </Dialog.Title>
              <div className="mx-auto mt-4 inline-flex max-w-full items-center gap-2 rounded-full bg-emerald-500/10 px-4 py-2 text-sm font-semibold text-emerald-700 sm:text-base">
                <CircleCheck className="size-4 shrink-0 fill-emerald-600 text-white" aria-hidden />
                <span>{t("bonus")}</span>
              </div>
              <p className="mt-6 text-sm text-muted-foreground sm:text-base">{t("description")}</p>
              <a
                href={invitationPath}
                className="mt-1 block truncate text-sm text-muted-foreground underline decoration-muted-foreground/50 underline-offset-4 transition hover:text-foreground sm:text-base"
              >
                {publicUrl}
              </a>
            </div>

            <div className="border-y border-border bg-muted/25 px-5 py-5 sm:px-8">
              <p className="text-center text-sm text-muted-foreground">{t("commonLink")}</p>
              <div className="mt-4 grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={shareLink}
                  className="inline-flex min-h-14 items-center justify-center gap-2 rounded-2xl bg-muted px-3 text-sm font-semibold text-foreground transition hover:bg-muted/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary sm:text-base"
                >
                  {shared ? <Check className="size-5" aria-hidden /> : <Share2 className="size-5" aria-hidden />}
                  {shared ? t("copied") : t("share")}
                </button>
                <button
                  type="button"
                  aria-expanded={showQr}
                  onClick={() => setShowQr((visible) => !visible)}
                  className="inline-flex min-h-14 items-center justify-center gap-2 rounded-2xl bg-muted px-3 text-sm font-semibold text-foreground transition hover:bg-muted/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary sm:text-base"
                >
                  <QrCode className="size-5" aria-hidden />
                  {t("qr")}
                </button>
              </div>

              {showQr ? (
                <div className="mt-4 rounded-2xl border border-border bg-card p-4 text-center">
                  {qrDataUrl ? (
                    <>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={qrDataUrl}
                        alt={t("qrAlt")}
                        className="mx-auto size-52 rounded-xl bg-white p-2 sm:size-60"
                      />
                      <a
                        href={qrDataUrl}
                        download={`ma-qr-${slug}.png`}
                        className="mt-3 inline-flex min-h-10 items-center justify-center gap-2 rounded-full border border-border px-4 text-sm font-semibold transition hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                      >
                        <Download className="size-4" aria-hidden />
                        {t("downloadQr")}
                      </a>
                    </>
                  ) : (
                    <div className="mx-auto grid size-52 place-items-center rounded-xl bg-muted text-muted-foreground sm:size-60">
                      <Loader2 className="size-7 animate-spin" aria-hidden />
                    </div>
                  )}
                </div>
              ) : null}
            </div>

            <nav aria-label={t("nextSteps")} className="divide-y divide-border">
              <Link
                href={invitationPath}
                className="group flex min-h-20 items-center gap-4 px-6 py-4 transition hover:bg-muted/50 sm:px-8"
              >
                <span className="grid size-11 shrink-0 place-items-center rounded-full bg-muted text-muted-foreground">
                  <Eye className="size-5" aria-hidden />
                </span>
                <span className="flex-1 font-semibold">{t("view")}</span>
                <ArrowRight className="size-5 text-muted-foreground transition group-hover:translate-x-1" aria-hidden />
              </Link>

              {!activated ? (
                <Link
                  href={`/dashboard/${invitationId}/thanh-toan`}
                  className="group flex min-h-20 items-center gap-4 px-6 py-4 transition hover:bg-muted/50 sm:px-8"
                >
                  <span className="grid size-11 shrink-0 place-items-center rounded-full bg-muted text-muted-foreground">
                    <CreditCard className="size-5" aria-hidden />
                  </span>
                  <span className="flex-1 font-semibold">{t("payment")}</span>
                  <ArrowRight className="size-5 text-muted-foreground transition group-hover:translate-x-1" aria-hidden />
                </Link>
              ) : null}

              <Link
                href={`/dashboard/${invitationId}/guests`}
                className="group flex min-h-24 items-center gap-4 px-6 py-4 transition hover:bg-pink-500/5 sm:px-8"
              >
                <span className="grid size-12 shrink-0 place-items-center rounded-full bg-pink-500 text-white shadow-lg shadow-pink-500/25">
                  <Users className="size-5" aria-hidden />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-semibold text-pink-600">{t("inviteGuests")}</span>
                  <span className="mt-0.5 block text-sm text-muted-foreground">{t("inviteGuestsDescription")}</span>
                </span>
                <ArrowRight className="size-5 shrink-0 text-pink-500 transition group-hover:translate-x-1" aria-hidden />
              </Link>
            </nav>
          </Dialog.Popup>
        </Dialog.Viewport>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

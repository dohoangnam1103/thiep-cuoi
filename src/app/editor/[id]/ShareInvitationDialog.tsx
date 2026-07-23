"use client";

import { Dialog } from "@base-ui/react/dialog";
import { Check, Copy, Download, Loader2, QrCode, Share2, X } from "lucide-react";
import { useTranslations } from "next-intl";
import QRCode from "qrcode";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { trackEvent } from "@/lib/analytics";

type ShareInvitationDialogProps = {
  slug: string;
  templateId: string;
  onClose: () => void;
};

export function ShareInvitationDialog({
  slug,
  templateId,
  onClose,
}: ShareInvitationDialogProps) {
  const t = useTranslations("editor.shareDialog");
  const invitationPath = `/thiep/${slug}`;
  const publicUrl =
    typeof window === "undefined"
      ? invitationPath
      : new URL(invitationPath, window.location.origin).toString();
  const [copied, setCopied] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState("");
  const [qrError, setQrError] = useState(false);

  useEffect(() => {
    let active = true;

    QRCode.toDataURL(publicUrl, {
      width: 640,
      margin: 2,
      errorCorrectionLevel: "H",
    })
      .then((dataUrl) => {
        if (active) setQrDataUrl(dataUrl);
      })
      .catch(() => {
        if (active) setQrError(true);
      });

    return () => {
      active = false;
    };
  }, [publicUrl]);

  async function copyUrl() {
    try {
      await navigator.clipboard.writeText(publicUrl);
      setCopied(true);
      trackEvent("share_invitation", {
        method: "copy_link",
        source: "editor_share_dialog",
        template_id: templateId,
      });
    } catch {
      toast.error(t("copyError"));
    }
  }

  return (
    <Dialog.Root open onOpenChange={(open) => !open && onClose()}>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-[150] bg-black/60 backdrop-blur-[2px] transition-opacity data-[ending-style]:opacity-0 data-[starting-style]:opacity-0" />
        <Dialog.Viewport className="fixed inset-0 z-[150] flex items-end justify-center overflow-y-auto sm:items-center sm:p-4">
          <Dialog.Popup className="relative max-h-[96dvh] w-full max-w-lg overflow-y-auto rounded-t-[2rem] border border-border bg-card text-foreground shadow-2xl outline-none transition data-[ending-style]:translate-y-4 data-[ending-style]:opacity-0 data-[starting-style]:translate-y-4 data-[starting-style]:opacity-0 sm:rounded-[2rem]">
            <Dialog.Close
              aria-label={t("close")}
              className="absolute right-4 top-4 z-10 grid size-11 place-items-center rounded-full bg-muted text-muted-foreground transition hover:bg-muted/80 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary sm:right-5 sm:top-5"
            >
              <X className="size-5" aria-hidden />
            </Dialog.Close>

            <header className="px-5 pb-5 pt-8 text-center sm:px-8 sm:pt-10">
              <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-primary/10 text-primary">
                <Share2 className="size-7" aria-hidden />
              </span>
              <Dialog.Title className="mt-4 text-2xl font-bold">{t("title")}</Dialog.Title>
              <Dialog.Description className="mt-2 text-sm text-muted-foreground sm:text-base">
                {t("description")}
              </Dialog.Description>
            </header>

            <div className="space-y-5 px-5 pb-7 sm:px-8 sm:pb-8">
              <section aria-labelledby="share-url-label">
                <h2 id="share-url-label" className="text-sm font-semibold">
                  {t("urlLabel")}
                </h2>
                <div className="mt-2 flex min-w-0 flex-col gap-2 rounded-2xl border border-border bg-muted/35 p-2 sm:flex-row sm:items-center">
                  <input
                    readOnly
                    value={publicUrl}
                    aria-label={t("urlLabel")}
                    className="min-h-11 min-w-0 flex-1 truncate rounded-xl bg-card px-3 text-sm text-foreground outline-none ring-1 ring-border focus:ring-2 focus:ring-primary"
                  />
                  <button
                    type="button"
                    onClick={copyUrl}
                    className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-bold text-primary-foreground transition hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                  >
                    {copied ? <Check className="size-4" aria-hidden /> : <Copy className="size-4" aria-hidden />}
                    {copied ? t("copied") : t("copyUrl")}
                  </button>
                </div>
              </section>

              <section
                aria-labelledby="share-qr-label"
                className="rounded-3xl border border-border bg-muted/25 p-4 text-center sm:p-5"
              >
                <h2 id="share-qr-label" className="font-semibold">
                  {t("qrLabel")}
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">{t("qrDescription")}</p>

                {qrDataUrl ? (
                  <>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={qrDataUrl}
                      alt={t("qrAlt")}
                      className="mx-auto mt-4 size-52 rounded-2xl bg-white p-2 ring-1 ring-black/5 sm:size-60"
                    />
                    <a
                      href={qrDataUrl}
                      download={`ma-qr-${slug}.png`}
                      className="mt-4 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-border bg-card px-5 text-sm font-bold text-foreground shadow-sm transition hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                    >
                      <Download className="size-4" aria-hidden />
                      {t("downloadQr")}
                    </a>
                  </>
                ) : qrError ? (
                  <div className="mx-auto mt-4 flex min-h-52 max-w-60 flex-col items-center justify-center rounded-2xl bg-card px-6 text-sm text-muted-foreground ring-1 ring-border">
                    <QrCode className="mb-3 size-8" aria-hidden />
                    {t("qrError")}
                  </div>
                ) : (
                  <div
                    className="mx-auto mt-4 grid size-52 place-items-center rounded-2xl bg-card text-muted-foreground ring-1 ring-border sm:size-60"
                    aria-label={t("loadingQr")}
                  >
                    <Loader2 className="size-7 animate-spin" aria-hidden />
                  </div>
                )}
              </section>
            </div>
          </Dialog.Popup>
        </Dialog.Viewport>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

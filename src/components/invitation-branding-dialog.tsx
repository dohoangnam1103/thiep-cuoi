"use client";

import { Dialog } from "@base-ui/react/dialog";
import { Heart, X } from "lucide-react";
import { useTranslations } from "next-intl";

/** Explains the footer watermark and that paying removes it from every template. */
export function InvitationBrandingDialog({ open, onOpenChange }: {
  open: boolean; onOpenChange: (open: boolean) => void;
}) {
  const t = useTranslations("invitationBranding");
  return <Dialog.Root open={open} onOpenChange={onOpenChange}>
    <Dialog.Portal>
      <Dialog.Backdrop className="fixed inset-0 z-[140] bg-black/55 backdrop-blur-[2px] transition-opacity data-[ending-style]:opacity-0 data-[starting-style]:opacity-0" />
      <Dialog.Viewport className="fixed inset-0 z-[140] flex items-center justify-center p-4">
        <Dialog.Popup className="w-full max-w-md rounded-2xl bg-white p-6 text-neutral-900 shadow-2xl outline-none transition data-[ending-style]:scale-95 data-[ending-style]:opacity-0 data-[starting-style]:scale-95 data-[starting-style]:opacity-0">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 grid size-10 shrink-0 place-items-center rounded-full bg-rose-50 text-rose-600">
              <Heart className="size-5" aria-hidden />
            </span>
            <div className="min-w-0 flex-1">
              <Dialog.Title className="text-lg font-semibold">{t("title")}</Dialog.Title>
              <Dialog.Description className="mt-2 text-sm leading-6 text-neutral-600">
                {t("description")}
              </Dialog.Description>
            </div>
            <Dialog.Close aria-label={t("close")} className="grid size-9 shrink-0 place-items-center rounded-full text-neutral-500 transition hover:bg-neutral-100 hover:text-neutral-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900">
              <X className="size-4" aria-hidden />
            </Dialog.Close>
          </div>
          <div className="mt-6 flex justify-end">
            <Dialog.Close className="min-h-10 rounded-full bg-neutral-900 px-5 text-sm font-semibold text-white transition hover:bg-neutral-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900 focus-visible:ring-offset-2">
              {t("close")}
            </Dialog.Close>
          </div>
        </Dialog.Popup>
      </Dialog.Viewport>
    </Dialog.Portal>
  </Dialog.Root>;
}

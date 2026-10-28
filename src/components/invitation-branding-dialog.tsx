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
      <Dialog.Backdrop className="fixed inset-0 z-[140] bg-[#1f1511]/60 backdrop-blur-[3px] transition-opacity duration-200 data-[ending-style]:opacity-0 data-[starting-style]:opacity-0" />
      <Dialog.Viewport className="fixed inset-0 z-[140] flex items-center justify-center p-4">
        <Dialog.Popup className="relative w-full max-w-[420px] overflow-hidden rounded-[28px] border border-[#eadfd4] bg-[#fffdf9] text-[#3a2a24] shadow-[0_36px_100px_-24px_rgba(45,24,15,.55)] outline-none transition duration-200 data-[ending-style]:translate-y-2 data-[ending-style]:scale-[.98] data-[ending-style]:opacity-0 data-[starting-style]:translate-y-2 data-[starting-style]:scale-[.98] data-[starting-style]:opacity-0">
          <span aria-hidden className="absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-transparent via-[#b45a5a] to-transparent" />
          <div className="p-6 sm:p-7">
            <div className="flex items-start justify-between gap-4">
              <span className="grid size-11 place-items-center rounded-2xl bg-gradient-to-br from-[#fbf0ec] to-[#f4e1da] text-[#a34a4a] ring-1 ring-[#a34a4a]/10">
                <Heart className="size-5" strokeWidth={1.7} aria-hidden />
              </span>
              <Dialog.Close aria-label={t("close")} className="grid size-9 shrink-0 place-items-center rounded-full text-[#a08c7e] transition hover:bg-[#f4ece5] hover:text-[#3a2a24] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8f3a3f] focus-visible:ring-offset-2 focus-visible:ring-offset-[#fffdf9]">
                <X className="size-4" aria-hidden />
              </Dialog.Close>
            </div>

            <p className="mt-5 text-[10px] font-semibold uppercase tracking-[0.22em] text-[#a34a4a]">{t("eyebrow")}</p>
            <Dialog.Title className="mt-2 text-balance font-body-serif text-[26px] leading-[1.14] tracking-[-0.015em] text-[#35241f] sm:text-[28px]">
              {t("title")}
            </Dialog.Title>
            <Dialog.Description className="mt-3.5 text-[13.5px] leading-[1.7] text-[#7a675b]">
              {t("description")}
            </Dialog.Description>

            <div className="mt-5 flex items-center gap-3 rounded-2xl border border-[#eadfd4] bg-[#fbf6f0] px-4 py-3 text-[12.5px] leading-5 text-[#7a675b]">
              <Heart className="size-4 shrink-0 text-[#b45a5a]" aria-hidden />
              <span>{t("note")}</span>
            </div>

            <Dialog.Close className="mt-6 inline-flex min-h-12 w-full items-center justify-center rounded-full bg-[#8f3a3f] px-6 text-sm font-semibold text-[#fff9f2] transition hover:bg-[#7a2f34] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8f3a3f] focus-visible:ring-offset-2 focus-visible:ring-offset-[#fffdf9]">
              {t("close")}
            </Dialog.Close>
          </div>
        </Dialog.Popup>
      </Dialog.Viewport>
    </Dialog.Portal>
  </Dialog.Root>;
}

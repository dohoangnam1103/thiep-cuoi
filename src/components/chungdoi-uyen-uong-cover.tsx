"use client";

import { useTranslations } from "next-intl";
import type { ChungDoiDemoContent } from "@/data/chungdoi-demo-content";
import { useLiveForms } from "@/components/chungdoi-live-forms";
import { formatDate } from "@/components/chungdoi-tpl-shared";
import { orderedCouple } from "@/lib/invitation-display";

/** Text participates in layout: long recipient names never overlap the pond. */
export function UyenUongCover({ content, onOpen }: {
  content: ChungDoiDemoContent;
  onOpen: () => void;
}) {
  const t = useTranslations("invitationTemplate");
  const live = useLiveForms();
  const people = orderedCouple(content);
  const date = formatDate(content.couple.date);
  const recipient = live?.guest?.name.trim() || live?.recipientLabel || t("uyenUong.recipient");
  const salutation = live?.guest?.role?.trim() || live?.personalizationLabels.salutationDefault || t("respectfulInvitation");
  const message = live?.guest?.greeting?.trim() || live?.personalizationLabels.messageDefault || t("uyenUong.guestMessage");
  return (
    <div data-uyen-cover className="relative overflow-hidden rounded-sm border border-[#922b32]/30 bg-[#fdf6e9] px-5 pb-6 pt-7 text-center text-[#922b32] shadow-[0_20px_60px_-30px_#612b30] [overflow-wrap:anywhere] sm:px-7">
      <p className="text-[10px] uppercase tracking-[0.2em]">{t("uyenUong.announcement")}</p>
      <div className="font-art-qellia mt-4 text-3xl leading-snug sm:text-4xl">
        <p>{people[0].shortName}</p><p className="my-0.5 font-body-serif text-sm italic">{t("and")}</p><p>{people[1].shortName}</p>
      </div>
      {date ? <p className="mt-4 text-sm tabular-nums tracking-[0.15em]">{date.dayNumber}.{date.monthNumber}.{date.yearNumber}</p> : null}
      <img src="/chungdoi/images/themes/uyen-uong/pond-engraving.webp" alt="" aria-hidden="true" width={1536} height={1024} fetchPriority="high" className="-mx-5 -mt-2 w-[calc(100%+40px)] max-w-none sm:-mx-7 sm:w-[calc(100%+56px)]" />
      <p className="mt-2 text-xs">{salutation}</p>
      <p className="mt-2 text-base font-semibold leading-relaxed">{recipient}</p>
      <p className="mx-auto mt-2 max-w-[280px] text-xs leading-5 text-[#705653]">{message}</p>
      <button type="button" data-open-btn onClick={onOpen} className="mt-5 min-h-11 rounded-sm bg-[#922b32] px-8 py-2.5 text-sm font-semibold text-[#fdf6e9] transition-colors hover:bg-[#742129] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#922b32]">{t("uyenUong.open")}</button>
    </div>
  );
}

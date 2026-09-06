"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import type { ReactNode } from "react";

import {
  AlbumGallery,
  buildCalendar,
  DressCode,
  formatDate,
  formatWishTime,
  GiftQrGrid,
  googleCalendarUrl,
  InvitationMap,
  MapDirectionsButton,
  SharedCountdown,
  SharedWishForm,
  WEEKDAY_LABELS,
} from "@/components/chungdoi-tpl-shared";
import type { ChungDoiDemoContent } from "@/data/chungdoi-demo-content";
import {
  invitationCeremonies,
  invitationGiftAccounts,
  invitationHeroImage,
  invitationOpeningMessage,
  orderByBrideFirst,
  orderedCouple,
} from "@/lib/invitation-display";

const ARTWORK = "/chungdoi/images/themes/_decor/rap-hy-sai-gon/artwork.webp";
const RED = "#d7192d";
const typography = {
  displayFontClass: "font-art-marvin",
} as const;

function PopHeading({ number, children, invert = false }: { number: string; children: ReactNode; invert?: boolean }) {
  return (
    <div className={invert ? "text-[#fff1cf]" : "text-[#17110d]"}>
      <span className="tabular-nums inline-flex -rotate-3 bg-[#12b9c7] px-3 py-1 text-xs font-black tracking-[0.2em] text-[#17110d] shadow-[4px_4px_0_#17110d]">
        {number}
      </span>
      <h2 className={`${typography.displayFontClass} mt-5 text-balance text-[clamp(2.7rem,11vw,5.6rem)] font-normal uppercase leading-[0.82] tracking-[-0.035em]`}>
        {children}
      </h2>
    </div>
  );
}

function OffsetPanel({ children, cyan = false, className = "" }: { children: ReactNode; cyan?: boolean; className?: string }) {
  return (
    <div className={`${cyan ? "bg-[#12b9c7] shadow-[10px_10px_0_#d7192d]" : "bg-[#fff1cf] shadow-[10px_10px_0_#12b9c7]"} border-[3px] border-[#17110d] ${className}`}>
      {children}
    </div>
  );
}

export function RapHySaiGonInvitation({ content }: { content: ChungDoiDemoContent }) {
  const t = useTranslations("invitationTemplate");
  const { couple, families, venue, schedule, gallery, wishes } = content;
  const people = orderedCouple(content);
  const heroImage = invitationHeroImage(content);
  const ceremonies = invitationCeremonies(content);
  const receptionDate = formatDate(couple.date);
  const calendar = buildCalendar(couple.date);
  const mapQuery = venue.mapAddress || venue.address.replace(/\n+/g, ", ").trim();
  const dateLine = receptionDate ? `${receptionDate.day}.${receptionDate.month}.${receptionDate.yearNumber}` : "";
  const familiesInOrder = orderByBrideFirst(
    { side: t("brideFamily"), title: families.brideParentTitle || t("parents"), father: families.brideFather, mother: families.brideMother, address: families.brideAddress },
    { side: t("groomFamily"), title: families.groomParentTitle || t("parents"), father: families.groomFather, mother: families.groomMother, address: families.groomAddress },
    couple.brideFirst,
  );
  const banks = invitationGiftAccounts(content).map((account) => ({
    label: account.name,
    bank: account.bank,
    num: account.num,
    name: account.name,
  }));
  const dressColors = (content.dressCodeColors ?? "")
    .split(",")
    .map((color) => color.trim())
    .filter((color) => /^#[0-9a-fA-F]{6}$/.test(color))
    .map((color) => ({ color }));

  return (
    <main className="relative z-40 min-h-[100dvh] overflow-hidden bg-[#d4b65f] bg-[radial-gradient(ellipse_at_50%_12%,#ead99d_0%,#d4b65f_42%,#b4874d_74%,#855938_100%)] text-[#17110d]">
      <div className="pointer-events-none fixed inset-y-0 left-1/2 z-0 w-full max-w-[1100px] -translate-x-1/2 overflow-hidden opacity-[0.04] mix-blend-multiply" aria-hidden="true">
        <Image src={ARTWORK} alt="" fill sizes="1100px" className="object-cover" />
      </div>

      <div data-invitation-column="true" className="relative z-10 mx-auto w-full max-w-[900px] saturate-[0.8] overflow-hidden bg-[#fff1cf] [container-type:inline-size] md:my-8 md:border-[5px] md:border-[#17110d] md:shadow-[18px_18px_0_#12b9c7]">
        <section className="relative min-h-[980px] overflow-hidden bg-[#d7192d] px-5 pb-20 pt-8 text-center text-[#fff1cf] sm:min-h-[1080px] sm:px-10">
          <Image src={ARTWORK} alt="" fill priority sizes="(max-width: 900px) 100vw, 900px" className="scale-[1.03] object-cover object-top opacity-65" />
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(89,20,31,0.08)_0%,rgba(89,20,31,0.38)_42%,rgba(89,20,31,0.62)_100%)]" aria-hidden="true" />
          <div className="relative z-10 mx-auto flex min-h-[920px] max-w-[760px] flex-col items-center">
            <div className="flex w-full items-center justify-between gap-4 border-y-2 border-[#fff1cf]/70 py-3 text-[10px] font-black uppercase tracking-[0.28em] sm:text-xs">
              <span>{t("invitation")}</span>
              <span className="text-[#f5d83d]">{dateLine}</span>
            </div>

            <div className="relative mt-24 w-[94%] max-w-[680px] border-[4px] border-[#17110d] bg-[#fff1cf] px-4 py-12 text-[#17110d] shadow-[12px_12px_0_#12b9c7] sm:px-9 sm:py-14">
              <span className="absolute -left-3 -top-3 size-6 border-[3px] border-[#17110d] bg-[#f5d83d]" aria-hidden="true" />
              <span className="absolute -bottom-3 -right-3 size-6 border-[3px] border-[#17110d] bg-[#d7192d]" aria-hidden="true" />
              <h1 data-invitation-short-name className="font-art-marvin max-w-full whitespace-nowrap text-[clamp(2.7rem,15cqw,8.2rem)] font-normal uppercase leading-[0.82] tracking-[0.015em] [text-shadow:3px_3px_0_#d8b55f]">
                {people[0].shortName}
              </h1>
              <div className="my-7 flex items-center justify-center gap-4">
                <span className="h-[3px] flex-1 bg-[#d7192d]" />
                <span className="grid size-14 rotate-6 place-items-center rounded-full border-[3px] border-[#17110d] bg-[#12b9c7] font-art-marvin text-2xl text-[#17110d] shadow-[4px_4px_0_#17110d]">{t("and")}</span>
                <span className="h-[3px] flex-1 bg-[#d7192d]" />
              </div>
              <h1 data-invitation-short-name className="font-art-marvin max-w-full whitespace-nowrap text-[clamp(2.7rem,15cqw,8.2rem)] font-normal uppercase leading-[0.82] tracking-[0.015em] text-[#ad3f4a] [text-shadow:3px_3px_0_#d8b55f]">
                {people[1].shortName}
              </h1>
            </div>

            {heroImage ? (
              <figure className="relative mt-16 aspect-[4/5] w-[78%] max-w-[430px] rotate-2 overflow-hidden border-[7px] border-[#fff1cf] bg-[#12b9c7] shadow-[14px_14px_0_#17110d]">
                <Image
                  src={heroImage}
                  alt={t("weddingPhotoAlt", { couple: `${people[0].shortName} ${t("and")} ${people[1].shortName}` })}
                  fill
                  unoptimized
                  sizes="(max-width: 640px) 78vw, 430px"
                  className="object-cover saturate-[0.92]"
                />
              </figure>
            ) : null}
          </div>
        </section>

        <div className="relative bg-[#f5d83d] px-5 py-20 sm:px-10">
          <div className="mx-auto max-w-[760px]">
            <PopHeading number="01">{t("respectfulInvitation")}</PopHeading>
            <p className="mt-8 max-w-[42rem] text-lg font-semibold leading-8">{invitationOpeningMessage(content)}</p>
            <div className="mt-10 grid gap-7 sm:grid-cols-2">
              {familiesInOrder.map((family, index) => (
                <OffsetPanel key={family.side} cyan={index === 1} className={index === 1 ? "p-7 sm:translate-y-7" : "p-7"}>
                  <p className="text-xs font-black uppercase tracking-[0.18em]">{family.side}</p>
                  <p className="mt-6 text-lg font-black">{family.title} {family.father}</p>
                  <p className="text-lg font-black">{family.title} {family.mother}</p>
                  <p className="mt-4 whitespace-pre-line text-sm font-medium leading-6 opacity-75">{family.address}</p>
                </OffsetPanel>
              ))}
            </div>
          </div>
        </div>

        <section className="bg-[#17110d] px-5 py-20 text-[#fff1cf] sm:px-10">
          <div className="mx-auto max-w-[760px]">
            <PopHeading number="02" invert>{t("ceremony")}</PopHeading>
            <div data-template-ceremonies className="mt-12 grid gap-8 sm:grid-cols-2">
              {ceremonies.map((ceremony, index) => {
                const ceremonyDate = formatDate(ceremony.date);
                return (
                  <article
                    key={`${ceremony.title}-${ceremony.date}-${ceremony.time}-${index}`}
                    data-template-ceremony-item
                    className="relative overflow-hidden border-[3px] border-[#fff1cf] bg-[#d7192d] p-7 shadow-[9px_9px_0_#12b9c7]"
                  >
                    <span className="absolute -right-5 -top-8 font-art-marvin text-[8rem] text-[#f5d83d]/20">{String(index + 1).padStart(2, "0")}</span>
                    <h3 className="font-art-marvin relative text-4xl uppercase text-[#f5d83d]">{t("ceremony")}</h3>
                    <p className="relative mt-8 whitespace-pre-line font-semibold leading-7">{ceremony.title}</p>
                    {ceremonyDate ? <p className="relative mt-8 font-art-marvin text-6xl leading-none">{ceremonyDate.day}.{ceremonyDate.month}</p> : null}
                    <p className="tabular-nums relative mt-2 text-sm font-bold">{ceremony.time}</p>
                  </article>
                );
              })}
              <article className="relative overflow-hidden border-[3px] border-[#17110d] bg-[#f5d83d] p-7 text-[#17110d] shadow-[9px_9px_0_#d7192d] sm:translate-y-10">
                <span className="absolute -right-5 -top-8 font-art-marvin text-[8rem] text-[#12b9c7]/35">{String(ceremonies.length + 1).padStart(2, "0")}</span>
                <h3 className="font-art-marvin relative text-4xl uppercase text-[#d7192d]">{t("reception")}</h3>
                <p className="relative mt-8 whitespace-pre-line font-semibold leading-7">{venue.address}</p>
                {receptionDate ? <p className="relative mt-8 font-art-marvin text-6xl leading-none">{receptionDate.day}.{receptionDate.month}</p> : null}
                <p className="tabular-nums relative mt-2 text-sm font-bold">{venue.banquetTime || couple.time}</p>
              </article>
            </div>
          </div>
        </section>

        <section className="bg-[#12b9c7] px-5 py-20 sm:px-10">
          <div className="mx-auto max-w-[760px]">
            <PopHeading number="03">{t("remaining")}</PopHeading>
            <SharedCountdown target={`${couple.date}T${couple.time}`} className="mt-9 border-[3px] border-[#17110d] bg-[#fff1cf] px-4 py-7 text-center font-art-marvin text-[clamp(1.8rem,7vw,3.7rem)] uppercase tabular-nums shadow-[10px_10px_0_#d7192d]" />
            <a href={googleCalendarUrl(content)} target="_blank" rel="noreferrer" className="mt-8 inline-flex -rotate-2 border-[3px] border-[#17110d] bg-[#f5d83d] px-7 py-4 font-black uppercase tracking-[0.08em] shadow-[6px_6px_0_#17110d] transition hover:rotate-0 hover:translate-x-1 hover:translate-y-1 hover:shadow-none">
              {t("addToCalendar")}
            </a>
            {calendar ? (
              <div className="mt-14 border-[3px] border-[#17110d] bg-[#fff1cf] p-6 shadow-[10px_10px_0_#f5d83d] sm:p-8">
                <h3 className="font-art-marvin text-4xl uppercase text-[#d7192d]">{t("calendar", { month: calendar.month })}</h3>
                <div className="mt-6 grid grid-cols-7 gap-1 text-center">
                  {WEEKDAY_LABELS.map((label) => <span key={label} className="py-2 text-[10px] font-black">{label}</span>)}
                  {calendar.cells.map((day, index) => (
                    <span key={`${day ?? "empty"}-${index}`} className={day === calendar.highlight ? "grid aspect-square place-items-center rotate-6 rounded-full bg-[#d7192d] text-xs font-black text-[#fff1cf]" : "grid aspect-square place-items-center text-xs font-bold"}>{day}</span>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        </section>

        <section className="bg-[#fff1cf] px-5 py-20 sm:px-10">
          <div className="mx-auto max-w-[760px]">
            <PopHeading number="04">{t("album")}</PopHeading>
            <div className="mt-10 border-[3px] border-[#17110d] bg-[#d7192d] p-3 shadow-[12px_12px_0_#12b9c7] sm:p-5">
              <AlbumGallery photos={gallery} layout={content.albumLayout ?? "mosaic"} accent={RED} radiusClass="rounded-none" />
            </div>
          </div>
        </section>

        {schedule.length ? (
          <section className="bg-[#d7192d] px-5 py-20 text-[#fff1cf] sm:px-10">
            <div className="mx-auto max-w-[760px]">
              <PopHeading number="05" invert>{t("timeline")}</PopHeading>
              <div className="mt-12 border-y-[3px] border-[#fff1cf]">
                {schedule.map((item, index) => (
                  <div key={`${item.time}-${item.label}`} className="grid grid-cols-[72px_1fr] items-center gap-5 border-b-2 border-[#fff1cf]/45 py-6 last:border-0 sm:grid-cols-[110px_1fr]">
                    <span className="font-art-marvin text-3xl tabular-nums text-[#f5d83d] sm:text-4xl">{item.time}</span>
                    <span className="flex items-center gap-4 text-lg font-black uppercase"><i className={index % 2 ? "size-3 rotate-45 bg-[#12b9c7]" : "size-3 rotate-45 bg-[#f5d83d]"} />{item.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </section>
        ) : null}

        <section className="bg-[#f5d83d] px-5 py-20 sm:px-10">
          <div className="mx-auto max-w-[760px]">
            <PopHeading number="06">{t("map")}</PopHeading>
            <p className="mt-7 whitespace-pre-line text-base font-bold leading-7">{venue.address}</p>
            <MapDirectionsButton query={mapQuery} className="mt-5 border-[3px] border-[#17110d] bg-[#fff1cf] font-black shadow-[5px_5px_0_#12b9c7]" />
            <div className="mt-9 rotate-1 border-[4px] border-[#17110d] bg-[#fff1cf] p-2 shadow-[12px_12px_0_#d7192d]">
              <InvitationMap query={mapQuery} className="h-[390px] w-full grayscale-[0.2] contrast-[1.08]" />
            </div>
          </div>
        </section>

        {dressColors.length ? (
          <section className="bg-[#12b9c7] px-5 py-20 sm:px-10">
            <div className="mx-auto max-w-[760px] border-[3px] border-[#17110d] bg-[#fff1cf] p-8 shadow-[12px_12px_0_#d7192d]">
              <DressCode colors={dressColors} heading={<PopHeading number="07">{t("dressCode")}</PopHeading>} headingColor="#17110d" subColor="#17110d" />
            </div>
          </section>
        ) : null}

        <section className="bg-[#fff1cf] px-5 py-20 sm:px-10">
          <div className="mx-auto max-w-[760px]">
            <PopHeading number="08">{t("guestbook")}</PopHeading>
            <SharedWishForm accent={RED} centered />
            <div className="mt-10 grid gap-5 sm:grid-cols-2">
              {wishes.slice(0, 4).map((wish, index) => (
                <blockquote key={`${wish.name}-${wish.time}`} className={index % 2 ? "border-[3px] border-[#17110d] bg-[#12b9c7] p-6 shadow-[7px_7px_0_#d7192d]" : "border-[3px] border-[#17110d] bg-[#f5d83d] p-6 shadow-[7px_7px_0_#12b9c7]"}>
                  <p className="font-semibold leading-7">{wish.text}</p>
                  <footer className="mt-5 text-[10px] font-black uppercase">{wish.name} / {formatWishTime(wish.time)}</footer>
                </blockquote>
              ))}
            </div>
          </div>
        </section>

        {banks.length ? (
          <section className="bg-[#17110d] px-5 py-20 text-[#fff1cf] sm:px-10">
            <div className="mx-auto max-w-[760px]">
              <GiftQrGrid banks={banks} heading={t("gift")} accent={RED} radiusClass="rounded-none" headingClassName="font-art-marvin uppercase" />
            </div>
          </section>
        ) : null}

        <footer className="relative overflow-hidden bg-[#d7192d] px-6 py-24 text-center text-[#fff1cf]">
          <Image src={ARTWORK} alt="" fill sizes="900px" className="object-cover opacity-20" />
          <p className="relative mx-auto max-w-xl text-sm font-bold leading-7">{t("presenceHonor")}</p>
          <div className="font-art-marvin relative mt-8 text-[clamp(2.4rem,11vw,6rem)] uppercase leading-[0.8] text-[#f5d83d] [text-shadow:5px_5px_0_#17110d]">
            <span className="block max-w-full whitespace-nowrap">{people[0].shortName}</span>
            <span className="my-4 block text-[0.45em] leading-none text-[#fff1cf]">&amp;</span>
            <span className="block max-w-full whitespace-nowrap">{people[1].shortName}</span>
          </div>
        </footer>
      </div>
    </main>
  );
}

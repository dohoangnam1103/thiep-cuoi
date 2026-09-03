"use client";

import { useTranslations } from "next-intl";
import type { ReactNode } from "react";
import {
  AlbumGallery, buildCalendar, DressCode, FamilyColumn, formatDate,
  formatWishTime, GiftEnvelope, googleCalendarUrl, InvitationMap,
  MapDirectionsButton, SharedCountdown, SharedWishForm, WEEKDAY_LABELS,
} from "@/components/chungdoi-tpl-shared";
import type { ChungDoiDemoContent } from "@/data/chungdoi-demo-content";
import { invitationGiftAccounts, orderedCouple } from "@/lib/invitation-display";
import styles from "./mahal-gold.module.css";

const ROOT = "/chungdoi/images/themes/mahal-gold";
const WINE = "#640e1b";
const GOLD = "#ab7a45";
const PAPER = "#f7e3cd";

function Art({ name, className = "" }: { name: string; className?: string }) {
  return <img src={`${ROOT}/${name}.webp`} alt="" aria-hidden draggable={false} className={`pointer-events-none h-auto max-w-none select-none object-contain ${className}`} />;
}

function Heading({ children }: { children: ReactNode }) {
  return <h2 className="font-mg-times text-center text-xl font-bold uppercase tracking-[0.04em] text-[#640e1b] md:text-[26px]">{children}</h2>;
}

function PalaceSection({ children, className = "", ornaments = true, reception = false }: { children: ReactNode; className?: string; ornaments?: boolean; reception?: boolean }) {
  return (
    <section className={`relative isolate z-10 px-[8.5%] pb-[8%] md:px-[12%] ${ornaments ? reception ? "pt-[13%] md:pt-[9%]" : "pt-[5.2%]" : "pt-[8%]"} ${className}`}>
      <Art name="castle2" className={`absolute -left-[30%] top-[8%] -z-10 w-[180%] opacity-[0.08] ${styles.parallax}`} />
      {ornaments && <>
        <Art name="pattern" className={`absolute left-[6.1%] top-0 w-[87.5%] ${reception ? "-mt-[5.9%]" : "-mt-[9.5%]"}`} />
        <Art name="sandstone-flower" className={`absolute -left-[40%] top-[24%] -z-10 w-[57%] md:-left-[23%] md:w-[42%] ${styles.parallax}`} />
        <Art name="flower3-decoration" className={`absolute -right-[24%] top-[55%] -z-10 w-[44%] md:-right-[16%] md:w-[34%] ${styles.parallax}`} />
      </>}
      <div className="relative z-10 flex flex-col items-center gap-6 md:gap-8">{children}</div>
    </section>
  );
}

function DateBlock({ date }: { date: NonNullable<ReturnType<typeof formatDate>> }) {
  const t = useTranslations("invitationTemplate");
  return <div className="font-mg-times flex flex-col items-center gap-2 text-center">
    <div className="flex items-center justify-center gap-3 md:gap-7">
      <span className="text-xs uppercase md:text-base">{date.weekday}</span>
      <span className="text-[#ab7a45]/50" aria-hidden>|</span>
      <span className="text-[36px] leading-none md:text-[48px]">{date.day}</span>
      <span className="text-[#ab7a45]/50" aria-hidden>|</span>
      <span className="text-xs uppercase md:text-base">{t("month", { month: date.month })}</span>
    </div>
    <p className="text-xl md:text-2xl">{date.yearNumber}</p>
    <p className="text-xs md:text-sm">{date.lunar}</p>
  </div>;
}

export function MahalGoldInvitation({ content }: { content: ChungDoiDemoContent }) {
  const t = useTranslations("invitationTemplate");
  const { couple, families, venue, schedule, gallery, wishes } = content;
  const people = orderedCouple(content);
  const ceremony = formatDate(couple.ceremonyDate);
  const reception = formatDate(couple.date);
  const calendar = buildCalendar(couple.date);
  const banquetTime = venue.banquetTime || couple.time;
  const mapQuery = venue.mapAddress || venue.address.replace(/\n+/g, ", ").trim();
  const banks = invitationGiftAccounts(content).map(a => ({ label: `${a.birthOrder} - ${a.name}`, bank: a.bank, num: a.num, name: a.name }));
  const dressColors = (content.dressCodeColors ?? "").split(",").map(c => c.trim()).filter(c => /^#[0-9a-fA-F]{6}$/.test(c)).map(color => ({ color }));
  const groomFamily = <FamilyColumn sideBySideOnMobile title={families.groomParentTitle || t("parents")} a={families.groomFather} b={families.groomMother} addr={families.groomAddress} />;
  const brideFamily = <FamilyColumn sideBySideOnMobile title={families.brideParentTitle || t("parents")} a={families.brideFather} b={families.brideMother} addr={families.brideAddress} />;


  return (
    <div className="flex w-full justify-center overflow-x-clip bg-white">
      <main data-template-visual="mahal-gold" className={`font-mg-garamond relative isolate mx-auto w-full max-w-[480px] overflow-hidden bg-[#f7e3cd] text-[#640e1b] md:max-w-[900px] md:border md:border-[#ab7a45]/20 ${styles.paper}`}>
        <header className="relative isolate w-full overflow-hidden pb-[16.6%] pt-[13.2%]">
          <div className="relative mx-auto w-full max-w-[480px] md:max-w-[680px]">
            <Art name="bells" className="absolute left-[1.4%] top-0 z-[2] -mt-[17.9%] w-[32.7%]" />
            <Art name="flower1" className="absolute left-[40.6%] top-0 z-[3] -mt-[17.5%] w-[77.1%] md:-top-[5%] md:w-[90%]" />
            <div className="relative mx-auto aspect-[424/529] w-[96.1%]">
              <Art name="arch-frame" className="absolute inset-0 -z-10 h-full w-full opacity-[0.54]" />
              <Art name="ganesha" className="absolute left-1/2 top-[20%] w-[13.7%] -translate-x-1/2" />
              <h1 className="absolute left-1/2 top-[43.9%] z-20 flex w-[68%] -translate-x-1/2 flex-col items-center gap-[1.2%] text-center leading-[1.15]">
                <span data-invitation-short-name className="font-art-nautigal text-[clamp(30px,12.5vw,85px)]">{people[0].shortName}</span>
                <span className="font-art-alex text-[clamp(18px,6.8vw,47px)]">&amp;</span>
                <span data-invitation-short-name className="font-art-nautigal text-[clamp(30px,12.5vw,85px)]">{people[1].shortName}</span>
              </h1>
            </div>
            <div data-testid="mahal-palace-scene" className="relative z-0 -mt-[59.6%] aspect-[441/546] w-full">
              <Art name="sandstone" className="absolute left-[74.8%] top-0 z-[2] w-[55.8%]" />
              <Art name="castle" className="absolute -left-[25.9%] top-[13.4%] z-[1] w-[176.6%]" />
              <Art name="flower2" className="absolute left-[54.6%] top-[60.6%] z-[4] w-[47.6%] md:left-[70%]" />
              <Art name="flower2" className="absolute right-[54.6%] top-[60.6%] z-[4] w-[47.6%] -scale-x-100 md:right-[70%]" />
              <Art name="fence" className="absolute left-1/2 top-[75.5%] z-[3] w-[58.5%] -translate-x-1/2" />
            </div>
          </div>
        </header>

        <PalaceSection>
          <Heading>{t("weddingInformation")}</Heading>
          <div className="font-mg-baskerville grid w-full grid-cols-[1fr_auto_1fr] grid-rows-[repeat(4,auto)] items-start gap-x-3 gap-y-1 text-center md:gap-x-7">
            {couple.brideFirst ? brideFamily : groomFamily}
            <span aria-hidden className="row-span-4 h-20 w-px self-center bg-[#ab7a45]/35" />
            {couple.brideFirst ? groomFamily : brideFamily}
          </div>
          <p className="font-mg-times whitespace-pre-line text-center text-sm uppercase leading-relaxed md:text-lg">{couple.openingMessage}</p>
          <div className="flex w-full flex-col items-center gap-3 text-center">
            <h3 className="font-art-nautigal text-[clamp(38px,10vw,72px)] leading-tight">{people[0].fullName}</h3>
            <p className="text-sm lowercase text-[#ab7a45] md:text-lg">{people[0].birthOrder}</p>
            <span className="font-art-alex text-3xl md:text-5xl">&amp;</span>
            <h3 className="font-art-nautigal text-[clamp(38px,10vw,72px)] leading-tight">{people[1].fullName}</h3>
            <p className="text-sm lowercase text-[#ab7a45] md:text-lg">{people[1].birthOrder}</p>
          </div>
          {ceremony && <>
            <p className="font-mg-times whitespace-pre-line text-center text-sm uppercase md:text-lg">{couple.ceremonyHeader}</p>
            <p className="text-sm uppercase md:text-lg">{t("atTime", { time: couple.ceremonyTime })}</p>
            <DateBlock date={ceremony} />
          </>}
        </PalaceSection>

        {gallery.length > 0 && <section className="relative z-10 px-[9%] py-[8%] md:px-[12%]">
          <Heading>{t("photoAlbum")}</Heading>
          <div className="mx-auto mt-7 w-full max-w-[640px]">
            <AlbumGallery photos={gallery} layout={content.albumLayout ?? "coverflow"} accent={WINE} radiusClass="rounded-xl" />
          </div>
        </section>}

        <PalaceSection reception>
          <Heading>{t("receptionAnnouncement")}</Heading>
          <div className="space-y-3 text-center">
            <h3 className="text-base md:text-xl">{t("receptionStartsAtAnnouncement")}</h3>
            <p className="text-3xl md:text-4xl">{banquetTime}</p>
          </div>
          {reception && <DateBlock date={reception} />}
          <div className="grid grid-cols-2 gap-10 text-center md:gap-20">
            <div><p>{t("guestArrival")}</p><p className="mt-1 text-xl">{venue.welcomeTime || schedule[0]?.time || couple.time}</p></div>
            <div><p>{t("banquetOpening")}</p><p className="mt-1 text-xl">{banquetTime}</p></div>
          </div>
          <h3 className="font-art-nautigal text-4xl md:text-5xl">{t("countdown")}</h3>
          <SharedCountdown target={`${couple.date}T${banquetTime}`} className="text-center text-base md:text-xl" labels={{ days: t("days"), hours: t("hours"), minutes: t("minutes"), seconds: t("seconds") }} />
          {calendar && <div className="relative mx-auto grid aspect-[359/339] w-full max-w-[330px] md:max-w-[470px]">
            <img src={`${ROOT}/calendar-frame.webp`} alt="" aria-hidden draggable={false} className="pointer-events-none absolute inset-0 h-full w-full select-none object-fill" />
            <div className="relative flex min-w-0 flex-col justify-center px-[11%] py-[9%]">
              <p className="text-center text-sm md:text-base">{t("monthYear", { month: calendar.month, year: calendar.year })}</p>
              <div className="mt-3 grid grid-cols-7 border-b border-[#ab7a45]/40 pb-1 text-center text-[10px] md:text-xs">{WEEKDAY_LABELS.map(day => <span key={day}>{day}</span>)}</div>
              <div className="mt-2 grid grid-cols-7 text-xs md:text-sm">{calendar.cells.map((day,index) => <span key={index} className="flex h-[30px] items-center justify-center md:h-[34px]"><span className={`flex size-7 items-center justify-center rounded-full md:size-[30px] ${day===calendar.highlight ? "bg-[#640e1b] font-bold text-[#f7e3cd]" : ""}`}>{day ?? ""}</span></span>)}</div>
            </div>
          </div>}
          <a href={googleCalendarUrl(content)} target="_blank" rel="noreferrer" className="text-sm underline underline-offset-4">{t("addToCalendar")}</a>
        </PalaceSection>

        {mapQuery && <section className="relative z-10 px-[10%] pb-[8%] text-center md:px-[14%]">
          <Heading>{t("receptionVenueAnnouncement")}</Heading>
          <p className="my-5 whitespace-pre-line text-base leading-relaxed md:text-xl">{venue.address}</p>
          <div className="overflow-hidden rounded-xl border border-[#ab7a45]/30"><InvitationMap query={mapQuery} title={mapQuery} className="h-[300px] w-full md:h-[430px]" loading="lazy" referrerPolicy="no-referrer-when-downgrade" /></div>
          <MapDirectionsButton query={mapQuery} className="mt-5 inline-flex rounded-full border border-[#ab7a45]/50 px-5 py-2 text-sm" />
        </section>}

        {dressColors.length > 0 && <PalaceSection ornaments={false}><DressCode colors={dressColors} heading={<Heading>{t("dressCodeHeading")}</Heading>} subLabel={t("partyAttire")} subColor={GOLD} /></PalaceSection>}

        {schedule.length > 0 && <PalaceSection ornaments={false}>
          <Heading>{t("receptionSchedule")}</Heading>
          <ol className="w-full max-w-[500px] space-y-5">{schedule.map((item,index) => <li key={`${item.time}-${item.label}`} className="grid grid-cols-[52px_1fr] items-center gap-5 md:grid-cols-[72px_1fr] md:gap-7">
            <Art name={["medallion-coming","medallion-gift","medallion-cake"][index%3]} className="w-full" />
            <div className="border-b border-[#ab7a45]/25 pb-3"><p className="text-lg font-semibold md:text-2xl">{item.time}</p><p className="mt-1 text-base text-[#ab7a45] md:text-xl">{item.label}</p></div>
          </li>)}</ol>
        </PalaceSection>}

        <section data-mahal-guestbook className={`font-mg-baskerville relative z-10 px-[9%] pb-[5%] pt-[6%] text-[#ab7a45] md:px-[14%] ${styles.guestbook}`}>
          <Heading>{t("guestbook")}</Heading>
          <SharedWishForm accent={WINE} fieldBorderColor={GOLD} />
          {wishes.length > 0 && <div className="chungdoi-scroll mx-auto mt-8 max-h-[500px] w-full space-y-3 overflow-y-auto pr-2 md:max-w-[600px]">{wishes.map(wish => <article key={`${wish.name}-${wish.time}`} className="rounded-md border border-[#ab7a45]/35 bg-white/55 p-4 text-sm">
            <div className="flex flex-wrap items-start justify-between gap-2"><strong className="font-semibold text-[#640e1b]">{wish.name}</strong><time className="text-xs opacity-70">{formatWishTime(wish.time)}</time></div><p className="mt-2 leading-relaxed">{wish.text}</p>
          </article>)}</div>}
        </section>

        <div className="relative isolate z-10">
          <Art name="castle2" className="absolute -left-[35.7%] top-0 -z-10 -mt-[30.6%] w-[244%] opacity-10 md:w-[170%]" />
          {banks.length > 0 && <div className="relative z-10 px-[9%] pb-[6%] pt-8 md:px-[14%]"><GiftEnvelope artworkVariant="source" sparkleColor={GOLD} templateSlug={content.slug} banks={banks} accent={WINE} dark={WINE} cardBg={PAPER} heading={t("giftBox")} openLabel={t("giftOpenHint")} labelColor={WINE} /></div>}
          <div className="relative isolate z-10">
            <footer data-template-footer className="relative z-20 flex flex-col items-center px-[9%] pb-[62%] text-center md:px-[14%] md:pb-[44%]">
              <p className="mx-auto text-sm font-medium md:max-w-[560px] md:text-base">{t("presenceHonor")}</p>
              <a href="https://thiepmungonline.com" className="mt-6 text-xs text-[#ab7a45] md:mt-8">♡ thiepmungonline.com</a>
            </footer>
            <Art name="castle" className="absolute -bottom-[15%] -left-[40.6%] z-0 w-[176.6%] md:-left-[18%] md:w-[136%]" />
          </div>
        </div>
      </main>
    </div>
  );
}

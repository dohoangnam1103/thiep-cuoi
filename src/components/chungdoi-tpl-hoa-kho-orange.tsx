"use client";

import type { ReactNode } from "react";
import { useTranslations } from "next-intl";
import { AlbumGallery, buildCalendar, FamilyColumn, FitText, formatDate, formatWishTime, GiftEnvelope, googleCalendarUrl, InvitationMap, MapDirectionsButton, SharedCountdown, SharedWishForm, WEEKDAY_LABELS } from "@/components/chungdoi-tpl-shared";
import { PublicRsvpDialog } from "@/components/public-rsvp-dialog";
import type { ChungDoiDemoContent } from "@/data/chungdoi-demo-content";
import { invitationGiftAccounts, orderedCouple } from "@/lib/invitation-display";
import styles from "./hoa-kho-orange.module.css";

const ROOT = "/chungdoi/images/themes/hoa-kho-orange";
const GREEN = "#4c611b";
const ORANGE = "#f26100";
const decorationFiles = ["flower3", "flower3", "flower2", "flower4", "flower3", "flower3", "flower3", "flower3", "flower3", "flower3", "flower3", "flower2", "flower3", "flower3", "flower2", "flower2"];
function Flowers({ indices }: { indices: number[] }) {
  return indices.map(index => <span key={index} aria-hidden className={`${styles.decoration} ${styles[`decor${index}`]}`}><img src={`${ROOT}/${decorationFiles[index]}.webp`} alt="" draggable={false} /></span>);
}
function Heading({ children }: { children: ReactNode }) {
  return <h2 className="relative z-10 text-center text-xl font-bold uppercase text-[#f26100] md:text-2xl">{children}</h2>;
}
function Panel({ children, flowers, className = "" }: { children: ReactNode; flowers: number[]; className?: string }) {
  return <section className="relative isolate z-10 flex flex-col items-center overflow-x-clip py-6"><Flowers indices={flowers} /><div className={`${styles.panel} ${className}`}>{children}</div></section>;
}
function EventDate({ date, time, ceremony = false }: { date: string; time: string; ceremony?: boolean }) {
  const t = useTranslations("invitationTemplate");
  const value = formatDate(date);
  if (!value) return null;
  return <div className="flex w-full flex-col items-center gap-2 text-center text-xs uppercase md:text-sm">
    <div className="flex w-full max-w-[230px] items-center justify-between gap-4"><span>{ceremony ? t("atTime", { time }) : value.weekday}</span><span>{ceremony ? value.weekday : time}</span></div>
    <div className="flex items-center gap-2 text-[#f26100]"><span className="text-[56px] leading-none">{value.day}</span><span className="border-l border-[#f26100] pl-2 text-left leading-7">{t("month", { month: value.month })}<br />{value.yearNumber}</span></div>
    <p className="tracking-[0.08em]">{value.lunar}</p>
  </div>;
}
export function HoaKhoOrangeInvitation({ content }: { content: ChungDoiDemoContent }) {
  const t = useTranslations("invitationTemplate");
  const { couple, families, venue, gallery, wishes, schedule } = content;
  const people = orderedCouple(content);
  const calendar = buildCalendar(couple.date);
  const time = venue.banquetTime || couple.time;
  const [banquetHour, banquetMinute] = time.split(":").map(Number);
  const welcomeTime = venue.welcomeTime || `${String((banquetHour + 23) % 24).padStart(2, "0")}:${String(banquetMinute).padStart(2, "0")}`;
  const mapQuery = venue.mapAddress || venue.address;
  const banks = invitationGiftAccounts(content).map(account => ({ label: `${account.birthOrder} - ${account.name}`, bank: account.bank, num: account.num, name: account.name }));
  const groom = <FamilyColumn sideBySideOnMobile title={families.groomParentTitle || t("parents")} a={families.groomFather} b={families.groomMother} addr={families.groomAddress} />;
  const bride = <FamilyColumn sideBySideOnMobile title={families.brideParentTitle || t("parents")} a={families.brideFather} b={families.brideMother} addr={families.brideAddress} />;
  const colors = (content.dressCodeColors || "").split(",").map(color => color.trim()).filter(color => /^#[\da-f]{6}$/i.test(color));
  return <div className="flex w-full justify-center bg-white"><div data-template-visual="hoa-kho-orange" className={styles.invitation}>
    <header className="relative isolate z-10 flex flex-col items-center overflow-x-clip">
      <div className="relative w-full max-w-[440px] pb-[20.68%] pt-[21.82%] md:max-w-[620px]">
        <Flowers indices={[0, 1]} />
        <div className={styles.arch}>
          <p className={styles.saveDate}>{t("hoaKhoSaveTheDate")}</p>
          <h1 className="contents"><span data-invitation-short-name className={`${styles.shortName} ${styles.firstName}`}>{people[0].shortName}</span><span className={styles.ampersand}>&amp;</span><span data-invitation-short-name className={`${styles.shortName} ${styles.secondName}`}>{people[1].shortName}</span></h1>
        </div>
        <Flowers indices={[2, 3]} />
      </div>
    </header>
    <Panel flowers={[4, 5, 6, 7]} className="gap-5">
      <Heading>{t("weddingInformation")}</Heading>
      <div className={`${styles.families} relative z-10 grid w-full grid-cols-[1fr_auto_1fr] grid-rows-[repeat(4,auto)] gap-x-[14px] gap-y-[3px] text-center`}>
        {couple.brideFirst ? bride : groom}<span aria-hidden className="row-span-4 h-[50px] w-px self-center bg-[#4c611b]" />{couple.brideFirst ? groom : bride}
      </div>
      <p className="relative z-10 whitespace-pre-line text-center text-xs uppercase leading-relaxed text-[#f26100] md:text-sm">{couple.openingMessage}</p>
      <div className="relative z-10 flex w-full flex-col items-center gap-3 text-center">
        <FitText maxFontSize={44} className={`${styles.coupleName} flex min-h-20 w-[80%] items-center justify-center leading-[48px] md:leading-[56px]`}>{people[0].fullName}</FitText>
        <p className="text-[10px] uppercase tracking-[0.14em]">{people[0].birthOrder}</p>
        <span className={`${styles.coupleName} text-3xl`}>&amp;</span>
        <FitText maxFontSize={44} className={`${styles.coupleName} flex min-h-20 w-[80%] items-center justify-center leading-[48px] md:leading-[56px]`}>{people[1].fullName}</FitText>
        <p className="text-[10px] uppercase tracking-[0.14em]">{people[1].birthOrder}</p>
      </div>
      <div className="relative z-10 flex w-full flex-col items-center gap-2"><p className="whitespace-pre-line text-center text-xs uppercase leading-relaxed text-[#f26100] md:text-sm">{couple.ceremonyHeader}</p><EventDate date={couple.ceremonyDate} time={couple.ceremonyTime} ceremony /></div>
    </Panel>
    {gallery.length > 0 && <section className="relative z-10 flex w-full flex-col items-center px-7 pb-8 pt-4"><Heading>{t("photoAlbum")}</Heading><div className="mt-6 w-full max-w-[432px] md:max-w-[600px]"><AlbumGallery photos={gallery} layout={content.albumLayout ?? "coverflow"} accent={GREEN} radiusClass="rounded-2xl" /></div></section>}
    <Panel flowers={[8, 9, 10, 11]} className="gap-6">
      <Heading>{t("receptionInformation")}</Heading>
      <h3 className="text-center text-base font-bold uppercase text-[#f26100] md:text-lg">{t("receptionStartsAt")}</h3>
      <EventDate date={couple.date} time={time} />
      <div className="flex justify-center gap-8 text-center"><div><p className="text-[11px] uppercase">{t("guestArrival")}</p><p className="mt-1 text-lg font-bold text-[#f26100]">{welcomeTime}</p></div><div><p className="text-[11px] uppercase">{t("banquetOpening")}</p><p className="mt-1 text-lg font-bold text-[#f26100]">{time}</p></div></div>
      <div className="flex flex-col items-center gap-2"><h3 className="text-lg uppercase">{t("countdown")}</h3><SharedCountdown target={`${couple.date}T${time}`} className="text-center text-sm font-bold md:text-lg" labels={{ days: t("days"), hours: t("hours"), minutes: t("minutes"), seconds: t("seconds") }} /></div>
      {calendar && <div data-dried-calendar dir="ltr" className="w-full max-w-[280px] rounded-lg bg-[#4c611b] p-4 text-[#fffdf5] md:max-w-[360px]">
        <p className={`${styles.coupleName} border-b border-white/20 py-2.5 text-center text-sm text-[#fffdf5]!`}>{t("monthYear", { month: calendar.month, year: calendar.year })}</p>
        <div className="grid grid-cols-7 border-b-2 border-[#fffdf5] py-1.5 text-center text-[10px] opacity-80">{WEEKDAY_LABELS.map(day => <span key={day}>{day}</span>)}</div>
        <div className="grid grid-cols-7 gap-y-0.5 py-2 text-xs md:text-[13px]">{calendar.cells.map((day, index) => <span key={index} className="flex h-[30px] items-center justify-center md:h-[34px]"><span className="relative flex h-6 w-[26px] items-center justify-center md:h-7 md:w-[30px]">{day===calendar.highlight && <img src={`${ROOT}/calendar-heart.svg`} alt="" className="absolute inset-0 size-full object-contain" />}<span className={`relative ${day===calendar.highlight ? "font-bold text-[#4c611b]" : ""}`}>{day ?? ""}</span></span></span>)}</div>
      </div>}
      <a href={googleCalendarUrl(content)} target="_blank" rel="noreferrer" className="text-sm underline underline-offset-4">{t("addToCalendar")}</a>
    </Panel>
    <div className="relative z-20 flex justify-center py-3"><PublicRsvpDialog triggerClassName="static! min-h-0! bg-[#4c611b]! px-8! py-2! text-xs! font-normal! uppercase shadow-none!" /></div>
    {mapQuery && <section className="relative z-10 flex w-full flex-col items-center px-7 pb-6 pt-4"><Heading>{t("receptionVenueHeading")}</Heading><p className="mx-auto mb-4 mt-2 max-w-[400px] whitespace-pre-line text-center text-xs text-[#f26100] md:text-sm">{venue.address}</p><div className="w-full max-w-[700px] overflow-hidden rounded-lg border border-[#4c611b]/25"><InvitationMap query={mapQuery} title={mapQuery} className="h-[260px] w-full md:h-[380px]" /></div><MapDirectionsButton query={mapQuery} /></section>}
    {colors.length > 0 && <section className="relative z-10 flex flex-col items-center gap-5 px-6 py-10 md:py-12"><h2 className="text-center text-xl font-normal uppercase md:text-[26px]">{t("dressCodeHeading")}</h2><p className="-mt-4 text-sm text-[#f26100] md:text-base">{t("partyAttire")}</p><div className="flex gap-4 md:gap-6">{colors.map(color => <svg key={color} viewBox="0 0 48 48" className="size-10 drop-shadow-md md:size-12" aria-hidden><circle cx="24" cy="24" r="23" fill={color} stroke="#4c611b30" /></svg>)}</div></section>}
    <Panel flowers={[12, 13, 14, 15]} className="gap-2">
      {schedule.length > 0 && <div className="relative z-10 flex w-full flex-col gap-[13px] pb-4 pt-2"><Heading>{t("weddingSchedule")}</Heading><ol className="mx-auto grid w-full max-w-[460px] grid-cols-[minmax(0,1fr)_16px_minmax(0,1fr)] items-center gap-x-6 gap-y-8 md:gap-x-8 md:gap-y-10">{schedule.map((event,index) => <li key={`${event.time}-${event.label}`} className="contents"><span className="text-right text-base md:text-[17px]"><span className="relative inline-block">{index > 0 && index < 4 && <img src={`${ROOT}/${["water", "cake", "ring"][index-1]}.webp`} alt="" className="absolute right-full top-1/2 size-[42px] -translate-y-1/2 object-contain md:size-[47px]" />}{event.time}</span></span><span aria-hidden className="relative flex h-full items-center justify-center">{index < schedule.length-1 && <span className="absolute -bottom-[calc(2rem+50%)] left-1/2 top-1/2 w-px -translate-x-1/2 bg-[#f26100] md:-bottom-[calc(2.5rem+50%)]" />}<span className="relative size-2.5 rounded-full bg-[#4c611b] ring-2 ring-[#4c611b]/15" /></span><span className="text-[13px] md:text-base">{event.label}</span></li>)}</ol></div>}
      <section data-dried-guestbook className={`relative z-10 w-full pb-2 pt-4 ${styles.guestbook}`}><Heading>{t("guestbook")}</Heading><SharedWishForm accent={GREEN} fieldBorderColor={GREEN} submitTextColor="#ded9d7" labels={{ namePlaceholder: t("sourceWishName"), textPlaceholder: t("sourceWishText") }} /><div className="chungdoi-scroll mx-auto mt-8 max-h-[500px] w-full space-y-3 overflow-y-auto pr-2">{wishes.map(wish => <article key={`${wish.name}-${wish.time}`} className="rounded-md border border-[#4c611b]/25 bg-white/50 p-4 text-sm"><div className="flex flex-wrap items-start justify-between gap-2"><strong className="text-[#f26100]">{wish.name}</strong><time className="text-xs opacity-70">{formatWishTime(wish.time)}</time></div><p className="mt-2 leading-relaxed">{wish.text}</p></article>)}</div></section>
    </Panel>
    {banks.length > 0 && <div className="relative z-10 px-7 py-8"><GiftEnvelope templateSlug={content.slug} artworkVariant="source" sparkleColor={GREEN} banks={banks} accent={GREEN} dark={ORANGE} cardBg="#fdf7ed" heading={t("giftBox")} openLabel={t("giftOpenHint")} labelColor={GREEN} headingClassName="text-center text-xl font-bold uppercase text-[#4c611b]! md:text-2xl" /></div>}
    <footer data-template-footer className="relative z-10 px-7 pb-4 text-center text-xs md:text-sm"><p>{t("presenceHonor")}</p><a href="https://thiepmungonline.com" className="mt-6 inline-block text-xs opacity-50">♡ thiepmungonline.com</a></footer>
  </div></div>;
}

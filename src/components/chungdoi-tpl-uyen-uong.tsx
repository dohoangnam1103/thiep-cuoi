"use client";

import { Dialog } from "@base-ui/react/dialog";
import { X } from "lucide-react";
import { useTranslations } from "next-intl";
import type { ReactNode } from "react";
import { Link } from "@/i18n/navigation";

import type { ChungDoiDemoContent } from "@/data/chungdoi-demo-content";
import {
  AlbumGallery, buildCalendar, buildVietQrImageUrl, CopyValueButton,
  DressCode, FamilyColumn, formatDate, formatWishTime, googleCalendarUrl,
  InvitationMap, MapDirectionsButton, SharedCountdown, SharedRsvpForm,
  SharedWishForm, SharedWishList, WEEKDAY_LABELS,
} from "@/components/chungdoi-tpl-shared";
import {
  invitationCeremonies, invitationGiftAccounts, invitationHeroImage,
  invitationOpeningMessage, orderByBrideFirst, orderedCouple,
} from "@/lib/invitation-display";

const INK = "#922b32";
const PAPER = "#fdf6e9";
const ART = "/chungdoi/images/themes/uyen-uong/pond-engraving.webp";
const sectionClass = "relative px-6 py-12 sm:px-10 md:px-16 md:py-16";
const headingClass = "font-art-qellia text-balance text-center text-3xl leading-snug md:text-4xl";
const buttonClass = "inline-flex min-h-11 items-center justify-center rounded-sm border border-[#922b32]/40 px-5 py-2.5 text-sm transition-colors hover:bg-[#922b32] hover:text-[#fdf6e9] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#922b32]";

function Heading({ children }: { children: ReactNode }) {
  return <h2 className={`${headingClass} mb-8`}>{children}</h2>;
}

function DateLine({ date, time }: { date: string; time?: string }) {
  const t = useTranslations("invitationTemplate");
  const parsed = formatDate(date);
  return (
    <div className="mt-5 text-center">
      {time ? <p className="text-sm">{t("atTime", { time })}</p> : null}
      {parsed ? (
        <>
          <div className="mx-auto mt-3 grid max-w-[310px] grid-cols-[1fr_auto_1fr] items-center gap-4">
            <span className="text-sm">{parsed.weekday}</span>
            <span className="border-x border-[#922b32]/25 px-5 text-5xl tabular-nums md:text-6xl">{parsed.dayNumber}</span>
            <span className="text-sm">{parsed.monthNumber} / {parsed.yearNumber}</span>
          </div>
          <p className="mt-4 text-xs leading-relaxed text-[#705653]">{parsed.lunar}</p>
        </>
      ) : null}
    </div>
  );
}

type GiftAccount = ReturnType<typeof invitationGiftAccounts>[number];

/** This template owns its stationery artwork; dialog/focus and copying use shared behavior. */
function UyenUongEnvelope({ account }: { account: GiftAccount }) {
  const t = useTranslations("invitationTemplate");
  const qr = buildVietQrImageUrl({ bank: account.bank, accountNumber: account.num, accountName: account.name });
  if (!qr) return null;
  return (
    <Dialog.Root>
      <div className="w-full max-w-[270px] text-center">
        <Dialog.Trigger
          data-testid="gift-envelope"
          aria-label={t("giftOpenEnvelope", { label: account.name })}
          className="group relative flex aspect-[4/3] w-full cursor-pointer flex-col items-center justify-end overflow-hidden rounded-sm border border-[#922b32]/40 bg-[#fdf6e9] pb-5 shadow-[0_12px_24px_-20px_#922b32] transition-transform hover:-translate-y-1 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#922b32] motion-reduce:transform-none"
        >
          <img src={ART} alt="" aria-hidden="true" loading="lazy" width={1536} height={1024} className="absolute inset-x-0 top-0 h-3/4 w-full object-cover" />
          <span className="relative mx-3 bg-[#fdf6e9] px-3 py-1 text-xs font-semibold uppercase leading-relaxed">{account.name}</span>
          <span className="absolute inset-x-0 bottom-0 h-1.5 bg-[#922b32]" />
        </Dialog.Trigger>
        <p className="mt-3 text-xs text-[#705653]">{t("giftEnvelopeHint")}</p>
      </div>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-[130] bg-black/55" />
        <Dialog.Viewport className="fixed inset-0 z-[130] flex items-center justify-center overflow-y-auto p-4">
          <Dialog.Popup className="relative max-h-[92dvh] w-full max-w-md overflow-y-auto rounded-sm border border-[#922b32]/30 bg-[#fdf6e9] px-6 py-8 text-center text-[#922b32] shadow-xl outline-none">
            <Dialog.Close aria-label={t("giftClose")} className="absolute right-2 top-2 grid size-11 place-items-center rounded-sm hover:bg-[#922b32]/10 focus-visible:outline-2">
              <X aria-hidden="true" className="size-5" />
            </Dialog.Close>
            <Dialog.Title className="font-art-qellia px-5 text-2xl leading-snug">{t("giftQrDialogTitle", { name: account.name })}</Dialog.Title>
            <Dialog.Description className="mt-3 text-sm">{t("giftQrDialogDescription", { bank: account.bank })}</Dialog.Description>
            <img src={qr} alt={t("giftQrAlt", { label: account.name })} className="mx-auto mt-6 aspect-square w-full max-w-[260px] bg-white p-3" />
            <p className="mt-5 break-words font-semibold">{account.name}</p>
            <p className="mt-1 tabular-nums">{account.num}</p>
            <div className="mt-5 flex flex-wrap justify-center gap-3">
              <CopyValueButton testId="gift-copy-account" value={account.num} accent={INK} label={t("copyAccount")} copiedLabel={t("accountCopied")} className="min-h-11" />
              <a href={`${qr}&download=1`} download className={buttonClass}>{t("saveQr")}</a>
            </div>
          </Dialog.Popup>
        </Dialog.Viewport>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

export function UyenUongInvitation({ content }: { content: ChungDoiDemoContent }) {
  const t = useTranslations("invitationTemplate");
  const u = useTranslations("invitationTemplate.uyenUong");
  const people = orderedCouple(content);
  const { couple, families, venue, gallery, schedule, wishes } = content;
  const wedding = formatDate(couple.date);
  const calendar = buildCalendar(couple.date);
  const hero = invitationHeroImage(content);
  const ceremonies = invitationCeremonies(content);
  const accounts = invitationGiftAccounts(content);
  const mapQuery = venue.mapAddress || venue.address.replace(/\n+/g, ", ").trim();
  const columns = orderByBrideFirst(
    { title: families.brideParentTitle || t("parents"), a: families.brideFather, b: families.brideMother, addr: families.brideAddress },
    { title: families.groomParentTitle || t("parents"), a: families.groomFather, b: families.groomMother, addr: families.groomAddress },
    couple.brideFirst,
  );
  const colors = (content.dressCodeColors ?? "").split(",").map((color) => color.trim()).filter(Boolean).map((color) => ({ color, border: "#922b3240" }));

  return (
    <article data-template="uyen-uong" className="font-body-serif relative isolate mx-auto w-full max-w-[900px] overflow-clip bg-[#fdf6e9] text-[#922b32] [overflow-wrap:anywhere]">
      <header data-uyen-section="hero" className="relative px-5 pb-8 pt-14 text-center md:px-12 md:pt-16">
        <p className="text-xs uppercase tracking-[0.22em]">{u("announcement")}</p>
        <h1 className="font-art-qellia relative z-10 mx-auto mt-7 max-w-[620px] text-balance text-[38px] leading-[1.3] sm:text-5xl md:text-[64px]">
          <span className="block">{people[0].shortName}</span>
          <span className="my-1 block font-body-serif text-lg italic md:text-xl">{t("and")}</span>
          <span className="block">{people[1].shortName}</span>
        </h1>
        {wedding ? <p className="relative z-10 mt-6 text-lg tabular-nums tracking-[0.2em]">{wedding.dayNumber}.{wedding.monthNumber}.{wedding.yearNumber}</p> : null}
        <img src={ART} alt={u("artAlt")} width={1536} height={1024} fetchPriority="high" className="mx-auto -mt-2 w-full max-w-[740px] md:-mt-14" />
        <p className="mx-auto mt-3 max-w-[400px] text-balance text-sm italic leading-relaxed md:text-base">{u("verse")}</p>
      </header>

      <section data-uyen-section="family" className={`${sectionClass} border-t border-[#922b32]/20`}>
        <Heading>{u("familiesHeading")}</Heading>
        <div className="grid grid-cols-1 gap-8 text-[#614744] sm:grid-cols-2 sm:gap-10">
          {columns.map((column, index) => <FamilyColumn key={index} {...column} />)}
        </div>
        <p className="mx-auto mt-10 max-w-[540px] whitespace-pre-line text-balance text-center text-base leading-8">{invitationOpeningMessage(content)}</p>
        <div className="mt-8 grid grid-cols-1 gap-6 text-center sm:grid-cols-2">
          {people.map((person) => (
            <div key={person.side}>
              <p className="text-xs text-[#705653]">{person.birthOrder}</p>
              <p className="font-art-qellia mt-2 text-2xl leading-relaxed md:text-3xl">{person.fullName}</p>
            </div>
          ))}
        </div>
      </section>

      {hero ? (
        <section data-uyen-section="portrait" className="px-6 pb-12 sm:px-10 md:px-16 md:pb-16">
          <div className="relative mx-auto max-w-[600px] border border-[#922b32]/30 p-2 md:p-3">
            <img src={hero} alt={t("weddingPhotoAlt", { couple: people.map((person) => person.fullName).join(` ${t("and")} `) })} loading="lazy" className="aspect-[4/5] w-full object-cover md:aspect-[5/4]" />
          </div>
        </section>
      ) : null}

      {ceremonies.length ? (
        <section data-uyen-section="ceremony" className={`${sectionClass} border-y border-[#922b32]/20`}>
          <Heading>{t("ceremony")}</Heading>
          <div data-template-ceremonies className="grid gap-10">
            {ceremonies.map((ceremony, index) => (
              <div data-template-ceremony-item key={index} className="text-center">
                <h3 className="whitespace-pre-line text-base leading-8">{ceremony.title}</h3>
                <DateLine date={ceremony.date} time={ceremony.time} />
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <section data-uyen-section="reception" className={sectionClass}>
        <Heading>{u("receptionHeading")}</Heading>
        <DateLine date={couple.date} time={venue.banquetTime || couple.time} />
        <div className="mx-auto mt-10 grid max-w-[660px] grid-cols-1 items-center gap-10 md:grid-cols-2">
          {calendar ? (
            <div data-testid="uyen-calendar" className="border border-[#922b32]/30 p-4">
              <h3 className="mb-5 text-center text-base">{t("month", { month: calendar.month })} / {calendar.year}</h3>
              <div className="grid grid-cols-7 text-center text-xs">
                {WEEKDAY_LABELS.map((day) => <span key={day} className="py-2 text-[#705653]">{day}</span>)}
                {calendar.cells.map((day, index) => (
                  <span key={index} className="flex h-9 items-center justify-center">
                    <span className={day === calendar.highlight ? "grid size-8 place-items-center rounded-full bg-[#922b32] text-[#fdf6e9]" : ""}>{day || ""}</span>
                  </span>
                ))}
              </div>
            </div>
          ) : null}
          <div className="text-center">
            <p className="text-sm">{u("countdownHeading")}</p>
            <SharedCountdown target={`${couple.date}T${venue.banquetTime || couple.time || "18:00"}`} className="mt-4 text-lg tabular-nums leading-8" />
            <a href={googleCalendarUrl(content)} target="_blank" rel="noopener noreferrer" className={`${buttonClass} mt-6`}>{t("addToCalendar")}</a>
          </div>
        </div>
      </section>

      {gallery.length ? <section data-uyen-section="album" className={sectionClass}><Heading>{u("albumHeading")}</Heading><AlbumGallery photos={gallery} layout={content.albumLayout ?? "grid"} accent={INK} radiusClass="rounded-sm" gridVariant="feature" modalLightbox /></section> : null}

      {schedule.length ? (
        <section data-uyen-section="schedule" className={`${sectionClass} border-y border-[#922b32]/20`}>
          <Heading>{t("timeline")}</Heading>
          <ol className="mx-auto max-w-[480px] space-y-6">
            {schedule.map((item, index) => <li key={index} className="grid grid-cols-[70px_1fr] gap-5"><span className="text-lg tabular-nums">{item.time}</span><span className="border-l border-[#922b32]/25 pl-5 text-base leading-7 text-[#614744]">{item.label}</span></li>)}
          </ol>
        </section>
      ) : null}

      {mapQuery ? (
        <section data-uyen-section="location" className={sectionClass}>
          <Heading>{u("locationHeading")}</Heading>
          <p className="mx-auto max-w-[500px] whitespace-pre-line text-center text-base leading-8 text-[#614744]">{venue.address}</p>
          <InvitationMap query={mapQuery} title={t("map")} loading="lazy" allowFullScreen referrerPolicy="no-referrer-when-downgrade" className="mt-8 h-[310px] w-full border border-[#922b32]/20 md:h-[400px]" />
          <div className="mt-5 flex justify-center"><MapDirectionsButton query={mapQuery} label={t("directions")} className={buttonClass} /></div>
        </section>
      ) : null}

      {colors.length ? <section data-uyen-section="dress" className={sectionClass}><DressCode colors={colors} heading={<Heading>{t("dressCode")}</Heading>} subLabel={u("dressNote")} headingColor={INK} subColor="#705653" /></section> : null}

      <section data-uyen-section="guestbook" className={`${sectionClass} border-y border-[#922b32]/20 [&_input]:min-h-11 [&_textarea]:min-h-28 [&_button]:min-h-11`}>
        <Heading>{u("wishesHeading")}</Heading>
        <div className="mx-auto max-w-[580px]">
          <SharedWishForm accent={INK} fieldBorderColor="#cbaaa4" submitTextColor={PAPER} previewNotice={t("formPreviewNotice")} />
          <SharedWishList wishes={wishes} accent={INK} className="mt-8" showAllLabel={t("showAllWishes")} collapseLabel={t("collapseWishes")} renderWish={(wish) => (
            <div className="border-l-2 border-[#922b32]/30 py-2 pl-5 text-sm leading-7 text-[#614744]">
              <p className="font-semibold text-[#922b32]">{wish.name}</p><p className="whitespace-pre-line">{wish.text}</p><p className="mt-1 text-xs text-[#705653]">{formatWishTime(wish.time)}</p>
            </div>
          )} />
          <SharedRsvpForm accent={INK} className="mt-12" heading={<Heading>{t("rsvpHeading")}</Heading>} previewFallback={<div className="mt-10 text-center"><h3 className="text-xl">{t("rsvpHeading")}</h3><p className="mt-3 text-sm leading-7 text-[#705653]">{t("rsvpPreviewNotice")}</p></div>} />
        </div>
      </section>

      {accounts.length ? <section data-uyen-section="gifts" className={sectionClass}><Heading>{t("gift")}</Heading><p className="mx-auto mb-8 max-w-[440px] text-center text-sm leading-7 text-[#705653]">{u("giftNote")}</p><div className="flex flex-wrap justify-center gap-8">{accounts.map((account) => <UyenUongEnvelope key={`${account.bank}-${account.num}-${account.name}`} account={account} />)}</div></section> : null}

      <footer data-uyen-section="footer" className="relative px-6 pb-12 pt-8 text-center md:px-16">
        <p className="font-art-qellia text-4xl md:text-5xl">{u("thanks")}</p>
        <p data-template-footer className="mx-auto mt-6 max-w-[440px] text-balance text-sm leading-7 text-[#614744]">{t("presenceHonor")}</p>
        <img src={ART} alt="" aria-hidden="true" width={1536} height={1024} loading="lazy" className="mx-auto mt-4 w-full max-w-[560px]" />
        <p className="font-art-qellia mt-4 text-2xl leading-relaxed">{people[0].shortName} {t("and")} {people[1].shortName}</p>
        <Link href="/" className="mt-6 inline-block text-xs text-[#705653]">{t("brandDomain")}</Link>
      </footer>
    </article>
  );
}

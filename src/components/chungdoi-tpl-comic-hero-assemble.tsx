"use client";

import { useTranslations } from "next-intl";
import type { ReactNode } from "react";

import {
  AlbumGallery,
  DressCode,
  GiftQrGrid,
  InvitationMap,
  MapDirectionsButton,
  SharedCountdown,
  SharedWishForm,
  SharedWishList,
  WEEKDAY_LABELS,
  buildCalendar,
  formatDate,
  formatWishTime,
  googleCalendarUrl,
  type GiftBank,
} from "@/components/chungdoi-tpl-shared";
import type { ChungDoiDemoContent } from "@/data/chungdoi-demo-content";
import { comicHeroAssemblePalette } from "@/data/comic-hero-assemble-pilot";
import {
  invitationCouple,
  invitationGiftAccounts,
  invitationHeroImage,
  orderByBrideFirst,
  type InvitationPerson,
} from "@/lib/invitation-display";

const RED = comicHeroAssemblePalette.red;
const BLUE = comicHeroAssemblePalette.blue;

/**
 * A comic page panel: hard black inking plus a hard-offset shadow, with the
 * scroll-driven pop-in from globals.css.
 */
function ComicPanel({
  children,
  className,
  tilt,
}: {
  children: ReactNode;
  className?: string;
  tilt?: "left" | "right";
}) {
  const tiltClass = tilt === "left" ? "-rotate-1" : tilt === "right" ? "rotate-1" : "";
  return (
    <div
      className={`comic-panel-pop relative border-[3px] border-[#12141f] bg-[#fffaf0] shadow-[6px_6px_0_#12141f] ${tiltClass} ${className ?? ""}`}
    >
      {children}
    </div>
  );
}

/** Yellow narration box that opens a comic panel. */
function CaptionBox({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={`comic-caption-shape border-[3px] border-[#12141f] bg-[#f9c22e] px-3 py-1.5 text-[11px] font-bold uppercase leading-tight tracking-[0.14em] text-[#12141f] md:text-[12px] ${className ?? ""}`}
    >
      {children}
    </div>
  );
}

/** Ragged sound-effect burst used for the section markers and the splash. */
function BurstBadge({
  children,
  className,
  color = RED,
}: {
  children: ReactNode;
  className?: string;
  color?: string;
}) {
  const bgClass = color === BLUE ? "bg-[#1b4dc1]" : "bg-[#d7263d]";
  return (
    <span
      className={`comic-burst-shape comic-burst-throb inline-flex items-center justify-center text-center text-[#fffaf0] ${bgClass} ${className ?? ""}`}
    >
      {children}
    </span>
  );
}

/** Section heading: an inked slab with a halftone shoulder. */
function SectionMarker({ children }: { children: ReactNode }) {
  return (
    <div className="comic-panel-pop relative flex w-full items-center gap-3">
      <span className="h-[3px] flex-1 bg-[#12141f]" />
      <h2 className="border-[3px] border-[#12141f] bg-[#12141f] px-4 py-1.5 text-center text-[15px] font-bold uppercase leading-none tracking-[0.12em] text-[#f9c22e] shadow-[4px_4px_0_#d7263d] md:text-[19px]">
        {children}
      </h2>
      <span className="h-[3px] flex-1 bg-[#12141f]" />
    </div>
  );
}

/** Origin-story card. Codename reads large, the legal name as secret identity. */
function HeroCard({
  person,
  familyLabel,
  parentTitle,
  father,
  mother,
  base,
  accent,
  labels,
}: {
  person: InvitationPerson;
  familyLabel: string;
  parentTitle: string;
  father: string;
  mother: string;
  base: string;
  accent: string;
  labels: { secretIdentity: string; affiliation: string; homeBase: string };
}) {
  const stripeClass = accent === BLUE ? "bg-[#1b4dc1]" : "bg-[#d7263d]";
  return (
    <ComicPanel className="flex min-w-0 flex-1 flex-col overflow-hidden">
      <div className={`flex items-center justify-between px-3 py-1.5 ${stripeClass}`}>
        <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#fffaf0] md:text-[11px]">
          {familyLabel}
        </span>
        <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#f9c22e] md:text-[11px]">
          {person.birthOrder}
        </span>
      </div>

      <div className="relative overflow-hidden border-b-[3px] border-[#12141f] px-3 py-5 text-center">
        <span
          className="comic-halftone pointer-events-none absolute inset-0 text-[#12141f] opacity-[0.12]"
          aria-hidden
        />
        <p className="relative min-w-0 text-balance break-words text-[clamp(1.15rem,5.5vw,1.625rem)] font-bold uppercase leading-[1.05] tracking-[0.02em] text-[#12141f] md:text-[clamp(1.5rem,3vw,2rem)]">
          {person.shortName}
        </p>
      </div>

      <dl className="flex flex-1 flex-col gap-2.5 px-3 py-3 text-left">
        <div>
          <dt className="text-[9px] font-bold uppercase tracking-[0.16em] text-[#12141f] opacity-55 md:text-[10px]">
            {labels.secretIdentity}
          </dt>
          <dd className="text-[14px] font-semibold leading-snug text-[#12141f] md:text-[16px]">
            {person.fullName}
          </dd>
        </div>
        <div>
          <dt className="text-[9px] font-bold uppercase tracking-[0.16em] text-[#12141f] opacity-55 md:text-[10px]">
            {labels.affiliation}
          </dt>
          <dd className="text-[13px] leading-snug text-[#12141f] md:text-[14px]">
            {parentTitle} {father}
            <br />
            {parentTitle} {mother}
          </dd>
        </div>
        {base ? (
          <div>
            <dt className="text-[9px] font-bold uppercase tracking-[0.16em] text-[#12141f] opacity-55 md:text-[10px]">
              {labels.homeBase}
            </dt>
            <dd className="text-[13px] leading-snug text-[#12141f] md:text-[14px]">{base}</dd>
          </div>
        ) : null}
      </dl>
    </ComicPanel>
  );
}

/** A guestbook entry drawn as a comic speech balloon. */
function SpeechBubble({ name, time, text }: { name: string; time: string; text: string }) {
  return (
    <div className="relative pb-4">
      <div className="rounded-[18px] border-[3px] border-[#12141f] bg-[#fffaf0] px-4 py-3 shadow-[4px_4px_0_#12141f]">
        <div className="flex items-baseline justify-between gap-3">
          <span className="text-[13px] font-bold uppercase tracking-[0.08em] text-[#d7263d] md:text-[14px]">
            {name}
          </span>
          <span className="shrink-0 text-[10px] tabular-nums text-[#12141f] opacity-55 md:text-[11px]">
            {formatWishTime(time)}
          </span>
        </div>
        <p className="mt-1.5 text-[14px] leading-relaxed text-[#12141f] md:text-[15px]">{text}</p>
      </div>
      <span
        className="comic-bubble-tail absolute bottom-0 left-7 h-4 w-6 bg-[#12141f]"
        aria-hidden
      />
    </div>
  );
}

export function ComicHeroAssembleInvitation({ content }: { content: ChungDoiDemoContent }) {
  const t = useTranslations("invitationTemplate");
  const c = useTranslations("comicHero");
  const { couple, families, venue, schedule, gallery, wishes } = content;

  const { bride, groom } = invitationCouple(content);
  const [firstHero, secondHero] = orderByBrideFirst(bride, groom, couple.brideFirst);
  const heroImage = invitationHeroImage(content);
  const ceremony = formatDate(couple.ceremonyDate);
  const reception = formatDate(couple.date);
  const calendar = buildCalendar(couple.date);
  const mapQuery = venue.mapAddress || venue.address.replace(/\n+/g, ", ").trim();
  const countdownTarget = `${couple.date}T${couple.time}`;
  const cardLabels = {
    secretIdentity: c("secretIdentity"),
    affiliation: c("affiliation"),
    homeBase: c("homeBase"),
  };

  const brideCard = (
    <HeroCard
      person={bride}
      familyLabel={t("brideFamily")}
      parentTitle={families.brideParentTitle}
      father={families.brideFather}
      mother={families.brideMother}
      base={families.brideAddress}
      accent={RED}
      labels={cardLabels}
    />
  );
  const groomCard = (
    <HeroCard
      person={groom}
      familyLabel={t("groomFamily")}
      parentTitle={families.groomParentTitle}
      father={families.groomFather}
      mother={families.groomMother}
      base={families.groomAddress}
      accent={BLUE}
      labels={cardLabels}
    />
  );

  const banks: GiftBank[] = invitationGiftAccounts(content).map((account) => ({
    label: `${account.birthOrder} — ${account.name}`,
    bank: account.bank,
    num: account.num,
    name: account.name,
  }));

  const dressColors = (content.dressCodeColors ?? "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean)
    .map((color) => ({ color, border: "#12141f" }));

  return (
    <div className="flex w-full justify-center overflow-x-clip bg-[#e6dcc4]">
      <div className="relative w-full max-w-[480px] overflow-hidden bg-[#f6efdd] text-[#12141f] md:mx-auto md:max-w-[900px] md:border-[3px] md:border-[#12141f]">
        {/* Newsprint tint over the whole issue. */}
        <span
          className="comic-newsprint pointer-events-none absolute inset-0 z-0 text-[#12141f] opacity-[0.07]"
          aria-hidden
        />

        {/* ── COVER ─────────────────────────────────────────────────── */}
        <header className="relative z-10 overflow-hidden border-b-[4px] border-[#12141f]">
          {/* Issue banner */}
          <div className="relative flex items-stretch border-b-[3px] border-[#12141f] bg-[#12141f]">
            <span className="px-3 py-2 text-[11px] font-bold uppercase tracking-[0.18em] text-[#f9c22e] md:text-[13px]">
              {c("issueBanner")}
            </span>
            <span className="flex-1" />
            <span className="border-l-[3px] border-[#12141f] bg-[#f9c22e] px-3 py-2 text-[11px] font-bold uppercase tracking-[0.18em] text-[#12141f] md:text-[13px]">
              {c("issueNo")}
            </span>
          </div>

          <div className="relative px-5 pb-10 pt-8 md:px-10 md:pb-14 md:pt-10">
            {/* Rotating speed lines behind the cover art. */}
            <span
              className="comic-speedlines comic-speedline-spin pointer-events-none absolute left-1/2 top-[18%] -z-0 aspect-square w-[190%] -translate-x-1/2 text-[#d7263d] opacity-[0.16]"
              aria-hidden
            />

            <div className="relative flex flex-col items-center gap-6">
              {heroImage ? (
                <div className="comic-panel-pop -rotate-2 border-[4px] border-[#12141f] bg-[#fffaf0] p-2 shadow-[8px_8px_0_#12141f]">
                  <div className="h-[58vw] w-[72vw] overflow-hidden border-[2px] border-[#12141f] md:h-[300px] md:w-[380px]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={heroImage}
                      alt={t("weddingPhotoAlt", {
                        couple: `${firstHero.shortName} & ${secondHero.shortName}`,
                      })}
                      className="h-full w-full object-cover"
                    />
                  </div>
                </div>
              ) : null}

              {/* Codename lockup */}
              <div className="relative flex w-full min-w-0 flex-col items-center px-1">
                <span
                  data-comic-cover-name
                  className="block w-full px-1 text-balance break-words text-center text-[clamp(1.65rem,8.5vw,2.625rem)] font-bold uppercase leading-[1.05] tracking-[0.01em] text-[#fffaf0] comic-ink-stroke-lg [text-shadow:5px_5px_0_#d7263d] md:text-[clamp(2.5rem,6vw,4rem)]"
                >
                  {firstHero.shortName}
                </span>
                <span className="my-1 text-[20px] font-bold uppercase text-[#1b4dc1] md:text-[26px]">
                  {t("and")}
                </span>
                <span
                  data-comic-cover-name
                  className="block w-full px-1 text-balance break-words text-center text-[clamp(1.65rem,8.5vw,2.625rem)] font-bold uppercase leading-[1.05] tracking-[0.01em] text-[#fffaf0] comic-ink-stroke-lg [text-shadow:5px_5px_0_#1b4dc1] md:text-[clamp(2.5rem,6vw,4rem)]"
                >
                  {secondHero.shortName}
                </span>
              </div>

              <BurstBadge className="size-[104px] text-[15px] font-bold uppercase leading-tight md:size-[132px] md:text-[19px]">
                {c("assemble")}
              </BurstBadge>

              <p className="max-w-[300px] text-center text-[12px] font-bold uppercase tracking-[0.14em] text-[#12141f] md:max-w-[420px] md:text-[14px]">
                {c("coverTagline")}
              </p>
            </div>
          </div>
        </header>

        <div className="relative z-10 flex flex-col gap-14 px-4 py-12 md:gap-20 md:px-10 md:py-16">
          {/* ── ORIGIN STORY ────────────────────────────────────────── */}
          <section className="flex flex-col items-center gap-6">
            <SectionMarker>{c("originStory")}</SectionMarker>
            <div className="flex w-full flex-col items-stretch gap-3 md:flex-row md:gap-6">
              {couple.brideFirst ? (
                <>
                  {brideCard}
                  {groomCard}
                </>
              ) : (
                <>
                  {groomCard}
                  {brideCard}
                </>
              )}
            </div>
          </section>

          {/* ── TEAM-UP SPLASH ──────────────────────────────────────── */}
          <section className="flex flex-col items-center gap-6">
            <SectionMarker>{c("teamUp")}</SectionMarker>
            <ComicPanel className="w-full overflow-hidden" tilt="right">
              <CaptionBox className="absolute left-0 top-0 max-w-[78%]">
                {t("respectfulInvitation")}
              </CaptionBox>
              <div className="relative px-5 pb-8 pt-14 text-center md:px-10 md:pb-10 md:pt-16">
                <span
                  className="comic-halftone-lg pointer-events-none absolute inset-0 text-[#1b4dc1] opacity-[0.13]"
                  aria-hidden
                />
                <p className="relative mx-auto max-w-[420px] whitespace-pre-line text-[15px] leading-relaxed text-[#12141f] md:max-w-[560px] md:text-[17px]">
                  {couple.openingMessage}
                </p>
                <div className="relative mt-7 flex flex-col items-center gap-1">
                  <p className="w-full text-balance break-words text-[clamp(1.25rem,5.5vw,1.5rem)] font-bold uppercase leading-tight text-[#12141f] md:text-[clamp(1.5rem,3vw,2rem)]">
                    {firstHero.fullName}
                  </p>
                  <span className="text-[13px] font-bold uppercase tracking-[0.2em] text-[#d7263d] md:text-[15px]">
                    {t("and")}
                  </span>
                  <p className="w-full text-balance break-words text-[clamp(1.25rem,5.5vw,1.5rem)] font-bold uppercase leading-tight text-[#12141f] md:text-[clamp(1.5rem,3vw,2rem)]">
                    {secondHero.fullName}
                  </p>
                </div>
              </div>
            </ComicPanel>
          </section>

          {/* ── MISSION BRIEFING ────────────────────────────────────── */}
          <section className="flex flex-col items-center gap-6">
            <SectionMarker>{c("missionBriefing")}</SectionMarker>

            <div className="flex w-full flex-col gap-4 md:flex-row md:gap-6">
              {ceremony ? (
                <ComicPanel className="flex-1 overflow-hidden">
                  <CaptionBox>{c("ceremonyPanel")}</CaptionBox>
                  <div className="px-4 py-5 text-center">
                    {couple.ceremonyHeader ? (
                      <p className="whitespace-pre-line text-[12px] font-bold uppercase leading-relaxed tracking-[0.1em] text-[#12141f] opacity-70 md:text-[13px]">
                        {couple.ceremonyHeader}
                      </p>
                    ) : null}
                    <p className="mt-3 text-[30px] font-bold leading-none text-[#d7263d] md:text-[38px]">
                      {couple.ceremonyTime}
                    </p>
                    <p className="mt-2 text-[14px] font-bold uppercase tracking-[0.1em] text-[#12141f] md:text-[16px]">
                      {ceremony.weekday} · {ceremony.day}/{ceremony.month}/{ceremony.yearNumber}
                    </p>
                    <p className="mt-1 text-[11px] text-[#12141f] opacity-60 md:text-[12px]">
                      {t("lunarDate")}: {ceremony.lunar}
                    </p>
                  </div>
                </ComicPanel>
              ) : null}

              {reception ? (
                <ComicPanel className="flex-1 overflow-hidden">
                  <CaptionBox>{c("receptionPanel")}</CaptionBox>
                  <div className="px-4 py-5 text-center">
                    <p className="text-[12px] font-bold uppercase leading-relaxed tracking-[0.1em] text-[#12141f] opacity-70 md:text-[13px]">
                      {t("startsAt")}
                    </p>
                    <p className="mt-3 text-[30px] font-bold leading-none text-[#1b4dc1] md:text-[38px]">
                      {venue.banquetTime || couple.time}
                    </p>
                    <p className="mt-2 text-[14px] font-bold uppercase tracking-[0.1em] text-[#12141f] md:text-[16px]">
                      {reception.weekday} · {reception.day}/{reception.month}/{reception.yearNumber}
                    </p>
                    <p className="mt-1 text-[11px] text-[#12141f] opacity-60 md:text-[12px]">
                      {t("lunarDate")}: {reception.lunar}
                    </p>
                  </div>
                </ComicPanel>
              ) : null}
            </div>

            {/* Countdown strip */}
            <div className="comic-panel-pop flex w-full items-center gap-3 border-[3px] border-[#12141f] bg-[#12141f] px-4 py-3 shadow-[6px_6px_0_#d7263d]">
              <span className="shrink-0 text-[11px] font-bold uppercase leading-tight tracking-[0.16em] text-[#f9c22e] md:text-[13px]">
                {c("countdown")}
              </span>
              <SharedCountdown
                target={countdownTarget}
                className="flex-1 text-right text-[15px] font-bold tabular-nums text-[#fffaf0] md:text-[18px]"
                labels={{
                  days: t("days"),
                  hours: t("hours"),
                  minutes: t("minutes"),
                  seconds: t("seconds"),
                }}
              />
            </div>

            {calendar ? (
              <ComicPanel className="w-full max-w-[380px] overflow-hidden md:max-w-[440px]">
                <CaptionBox>{t("month", { month: calendar.month })}</CaptionBox>
                <div className="px-4 py-4">
                  <div className="grid grid-cols-7 border-b-[2px] border-[#12141f] pb-1 text-[10px] font-bold uppercase text-[#12141f] opacity-70 md:text-[11px]">
                    {WEEKDAY_LABELS.map((day) => (
                      <span key={day} className="text-center">
                        {day}
                      </span>
                    ))}
                  </div>
                  <div className="mt-1 grid grid-cols-7 gap-y-1 text-[12px] font-semibold md:text-[13px]">
                    {calendar.cells.map((day, index) => {
                      const isTarget = day !== null && day === calendar.highlight;
                      return (
                        <span
                          key={day ?? `blank-${index}`}
                          className="flex aspect-square items-center justify-center"
                        >
                          {isTarget ? (
                            <BurstBadge className="size-full text-[12px] font-bold md:text-[13px]">
                              {day}
                            </BurstBadge>
                          ) : (
                            <span className="text-[#12141f]">{day ?? ""}</span>
                          )}
                        </span>
                      );
                    })}
                  </div>
                </div>
              </ComicPanel>
            ) : null}

            <a
              href={googleCalendarUrl(content)}
              target="_blank"
              rel="noreferrer"
              className="comic-panel-pop inline-flex items-center justify-center border-[3px] border-[#12141f] bg-[#f9c22e] px-6 py-2.5 text-[13px] font-bold uppercase tracking-[0.12em] text-[#12141f] shadow-[5px_5px_0_#12141f] transition-transform hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[3px_3px_0_#12141f] md:text-[15px]"
            >
              {t("addToCalendar")}
            </a>
          </section>

          {/* ── HEADQUARTERS ────────────────────────────────────────── */}
          {mapQuery ? (
            <section className="flex flex-col items-center gap-6">
              <SectionMarker>{c("headquarters")}</SectionMarker>
              <ComicPanel className="w-full overflow-hidden">
                <CaptionBox>{t("location")}</CaptionBox>
                <div className="px-4 py-4 text-center">
                  <p className="mx-auto max-w-[420px] whitespace-pre-line text-[14px] font-semibold leading-6 text-[#12141f] md:max-w-[560px] md:text-[16px]">
                    {venue.address}
                  </p>
                  <div className="mt-4 border-[3px] border-[#12141f]">
                    <InvitationMap
                      query={mapQuery}
                      title={mapQuery}
                      className="h-64 w-full"
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                    />
                  </div>
                  <MapDirectionsButton
                    query={mapQuery}
                    label={c("plotCourse")}
                    className="mt-4 inline-flex items-center justify-center border-[3px] border-[#12141f] bg-[#1b4dc1] px-5 py-2 text-[12px] font-bold uppercase tracking-[0.12em] text-[#fffaf0] shadow-[4px_4px_0_#12141f] md:text-[14px]"
                  />
                </div>
              </ComicPanel>
            </section>
          ) : null}

          {/* ── MISSION LOG ─────────────────────────────────────────── */}
          {schedule.length > 0 ? (
            <section className="flex flex-col items-center gap-6">
              <SectionMarker>{c("missionLog")}</SectionMarker>
              <ol className="flex w-full flex-col gap-4">
                {schedule.map((step, index) => (
                  <li key={`${step.time}-${step.label}`}>
                    <ComicPanel
                      className="flex items-stretch overflow-hidden"
                      tilt={index % 2 === 0 ? "left" : "right"}
                    >
                      <div className="flex w-[74px] shrink-0 flex-col items-center justify-center border-r-[3px] border-[#12141f] bg-[#12141f] px-2 py-3 md:w-[92px]">
                        <span className="text-[9px] font-bold uppercase tracking-[0.14em] text-[#f9c22e] md:text-[10px]">
                          {c("panel", { index: index + 1 })}
                        </span>
                        <span className="mt-1 text-[17px] font-bold tabular-nums leading-none text-[#fffaf0] md:text-[20px]">
                          {step.time}
                        </span>
                      </div>
                      <div className="relative flex flex-1 items-center px-4 py-4">
                        <span
                          className="comic-motionlines pointer-events-none absolute inset-y-0 left-0 w-16 text-[#d7263d] opacity-[0.18]"
                          aria-hidden
                        />
                        <p className="relative text-[15px] font-semibold leading-snug text-[#12141f] md:text-[17px]">
                          {step.label}
                        </p>
                      </div>
                    </ComicPanel>
                  </li>
                ))}
              </ol>
            </section>
          ) : null}

          {/* ── ARCHIVE ─────────────────────────────────────────────── */}
          {gallery.length > 0 ? (
            <section className="flex flex-col items-center gap-6">
              <SectionMarker>{c("archive")}</SectionMarker>
              <ComicPanel className="w-full overflow-hidden">
                <CaptionBox>{t("album")}</CaptionBox>
                <div className="px-3 py-4 md:px-5">
                  <AlbumGallery
                    photos={gallery}
                    layout={content.albumLayout ?? "grid"}
                    accent={RED}
                    gridAspect="aspect-square"
                    radiusClass="rounded-none"
                  />
                </div>
              </ComicPanel>
            </section>
          ) : null}

          {/* ── SQUAD COLOURS ───────────────────────────────────────── */}
          {dressColors.length > 0 ? (
            <section className="flex flex-col items-center gap-6">
              <SectionMarker>{c("squadColors")}</SectionMarker>
              <ComicPanel className="w-full px-4 py-6">
                <DressCode
                  colors={dressColors}
                  heading={t("dressCode")}
                  headingColor="#12141f"
                  subLabel={c("squadColorsHint")}
                  subColor="rgba(18,20,31,0.6)"
                />
              </ComicPanel>
            </section>
          ) : null}

          {/* ── TRANSMISSIONS ───────────────────────────────────────── */}
          <section className="flex flex-col items-center gap-6">
            <SectionMarker>{c("transmissions")}</SectionMarker>
            <ComicPanel className="w-full px-4 py-6 md:px-8">
              <SharedWishForm
                accent={RED}
                centered
                labels={{
                  nameLabel: t("wishName"),
                  textLabel: t("wishText"),
                  success: t("wishSuccess"),
                  submit: t("wishSubmit"),
                  pending: t("wishPending"),
                }}
              />
            </ComicPanel>
            {wishes.length > 0 ? (
              <SharedWishList
                wishes={wishes}
                accent={RED}
                showAllLabel={t("showAllWishes")}
                collapseLabel={t("collapseWishes")}
                className="w-full"
                listClassName="flex w-full flex-col gap-3"
                renderWish={(wish) => (
                  <SpeechBubble name={wish.name} time={wish.time} text={wish.text} />
                )}
              />
            ) : null}
          </section>

          {/* ── SUPPLY DROP ─────────────────────────────────────────── */}
          {banks.length > 0 ? (
            <section className="flex flex-col items-center gap-6">
              <SectionMarker>{c("supplyDrop")}</SectionMarker>
              <ComicPanel className="w-full px-4 py-6 md:px-8">
                <GiftQrGrid
                  banks={banks}
                  heading={t("gift")}
                  accent={RED}
                  radiusClass="rounded-none"
                  saveQrLabel={t("saveQr")}
                  copyNumberLabel={t("copyAccount")}
                  numberCopiedLabel={t("accountCopied")}
                  headingClassName="text-center text-[15px] font-bold uppercase tracking-[0.12em] text-[#12141f] md:text-[18px]"
                />
              </ComicPanel>
            </section>
          ) : null}
        </div>

        {/* ── FINALE ────────────────────────────────────────────────── */}
        <footer
          data-template-footer
          className="relative z-10 overflow-hidden border-t-[4px] border-[#12141f] bg-[#12141f] px-5 py-10 text-center"
        >
          <span
            className="comic-halftone pointer-events-none absolute inset-0 text-[#f9c22e] opacity-[0.14]"
            aria-hidden
          />
          <p className="relative mx-auto max-w-[420px] text-[13px] leading-relaxed text-[#fffaf0] md:max-w-[560px] md:text-[15px]">
            {t("presenceHonor")}
          </p>
          <p className="relative mt-5 text-[22px] font-bold uppercase tracking-[0.12em] text-[#f9c22e] md:text-[30px]">
            {c("toBeContinued")}
          </p>
        </footer>

        <div className="relative z-10 flex items-center justify-center border-t-[3px] border-[#12141f] bg-[#f6efdd] py-3">
          <a
            href="https://thiepmungonline.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#12141f] opacity-50 transition-opacity hover:opacity-80"
          >
            thiepmungonline.com
          </a>
        </div>
      </div>
    </div>
  );
}

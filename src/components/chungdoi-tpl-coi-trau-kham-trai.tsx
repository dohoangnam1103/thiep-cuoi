"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import type { ReactNode } from "react";

import {
  CoiTrauHeroCard,
  coiTrauTypography,
} from "@/components/coi-trau/coi-trau-hero-card";
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
  invitationOpeningMessage,
  orderByBrideFirst,
  orderedCouple,
} from "@/lib/invitation-display";
import { cn } from "@/lib/utils";

const BETEL_VINE = "/chungdoi/templates/coi-trau-kham-trai/ornaments/betel-vine.svg";
const ARECA_SPRAY = "/chungdoi/templates/coi-trau-kham-trai/ornaments/areca-spray.svg";
const SHELL_DIVIDER = "/chungdoi/templates/coi-trau-kham-trai/ornaments/shell-divider.svg";
const BETEL = "#315A42";
const IVORY = "#F1E8D8";

function InlayDivider({ className }: { className?: string }) {
  return (
    <Image
      aria-hidden="true"
      alt=""
      className={cn("mx-auto h-auto w-64 opacity-75", className)}
      height={180}
      src={SHELL_DIVIDER}
      unoptimized
      width={1200}
    />
  );
}

function SectionHeading({
  number,
  children,
  light = false,
}: {
  number: string;
  children: ReactNode;
  light?: boolean;
}) {
  return (
    <header className={cn("text-center", light ? "text-[#F1E8D8]" : "text-[#32151F]")}>
      <span className={cn(
        "inline-grid size-9 place-items-center rounded-full border text-[10px] font-semibold tracking-[0.12em]",
        light
          ? "border-[#D8E3DF]/55 text-[#D8E3DF]"
          : "border-[#315A42]/45 text-[#315A42]",
      )}>
        {number}
      </span>
      <h2 className={`${coiTrauTypography.displayFontClass} mt-4 text-balance text-[clamp(2.5rem,8vw,5.5rem)] font-medium leading-[0.92] tracking-[-0.035em]`}>
        {children}
      </h2>
      <InlayDivider className={light ? "brightness-150" : undefined} />
    </header>
  );
}

function PaperPanel({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn(
      "relative overflow-hidden border border-[#929B98]/45 bg-[#F1E8D8] p-6 text-[#32151F] shadow-[0_1.5rem_4rem_rgba(50,21,31,0.12)] [clip-path:polygon(4%_0,96%_0,100%_4%,100%_96%,96%_100%,4%_100%,0_96%,0_4%)] sm:p-9",
      className,
    )}>
      <span className="pointer-events-none absolute inset-[8px] border border-[#929B98]/35 [clip-path:polygon(4%_0,96%_0,100%_4%,100%_96%,96%_100%,4%_100%,0_96%,0_4%)]" />
      <div className="relative">{children}</div>
    </div>
  );
}

function formattedEventDate(date: string) {
  const formatted = formatDate(date);
  if (!formatted) return date;
  return `${formatted.weekday}, ${formatted.day}.${formatted.month}.${formatted.yearNumber}`;
}

export function CoiTrauKhamTraiInvitation({
  content,
}: {
  content: ChungDoiDemoContent;
}) {
  const t = useTranslations("invitationTemplate");
  const { couple, families, venue, schedule, gallery, wishes } = content;
  const people = orderedCouple(content);
  const ceremonies = invitationCeremonies(content);
  const calendar = buildCalendar(couple.date);
  const receptionDate = formatDate(couple.date);
  const mapQuery = venue.mapAddress || venue.address.replace(/\n+/g, ", ").trim();
  const familiesInOrder = orderByBrideFirst(
    {
      address: families.brideAddress,
      father: families.brideFather,
      mother: families.brideMother,
      side: t("brideFamily"),
      title: families.brideParentTitle || t("parents"),
    },
    {
      address: families.groomAddress,
      father: families.groomFather,
      mother: families.groomMother,
      side: t("groomFamily"),
      title: families.groomParentTitle || t("parents"),
    },
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
    .map((color) => ({
      border: color.toLowerCase() === "#f1e8d8" ? "#929B98" : undefined,
      color,
    }));

  return (
    <main
      data-template-slug="coi-trau-kham-trai"
      className="relative min-h-[100dvh] w-full overflow-x-clip bg-[#E7DECF] font-body-sans text-[#32151F]"
    >
      <CoiTrauHeroCard content={content} />

      <section className="relative overflow-hidden px-4 py-20 sm:px-7 sm:py-32">
        <Image
          aria-hidden="true"
          alt=""
          className="pointer-events-none absolute -left-32 top-4 h-[34rem] w-auto -rotate-12 opacity-[0.08]"
          height={1200}
          src={BETEL_VINE}
          unoptimized
          width={900}
        />
        <div className="relative mx-auto max-w-6xl">
          <SectionHeading number="01">{t("respectfulInvitation")}</SectionHeading>
          <p className="mx-auto mt-8 max-w-2xl whitespace-pre-line text-center text-base leading-8 text-[#32151F]/72 sm:text-lg">
            {invitationOpeningMessage(content)}
          </p>

          <div className="mt-14 grid gap-5 md:grid-cols-2 md:gap-7">
            {familiesInOrder.map((family, index) => (
              <PaperPanel
                key={family.side}
                className={index === 1 ? "md:translate-y-10" : undefined}
              >
                <div className="flex items-center justify-between gap-4 border-b border-[#929B98]/40 pb-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#315A42]">
                    {family.side}
                  </p>
                  <span className="text-xs text-[#B85B52]">0{index + 1}</span>
                </div>
                <p className={`${coiTrauTypography.displayFontClass} mt-7 text-3xl font-medium`}>
                  {family.title}
                </p>
                <p className="mt-5 text-base font-semibold leading-7">{family.father}</p>
                <p className="text-base font-semibold leading-7">{family.mother}</p>
                <p className="mt-5 whitespace-pre-line text-sm leading-6 text-[#32151F]/65">
                  {family.address}
                </p>
              </PaperPanel>
            ))}
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden bg-[#315A42] px-4 py-20 text-[#F1E8D8] sm:px-7 sm:py-32">
        <Image
          aria-hidden="true"
          alt=""
          className="pointer-events-none absolute -bottom-32 -right-28 h-[32rem] w-auto rotate-12 opacity-[0.11] mix-blend-screen"
          height={900}
          src={ARECA_SPRAY}
          unoptimized
          width={900}
        />
        <div className="relative mx-auto max-w-6xl">
          <SectionHeading light number="02">{t("ceremony")}</SectionHeading>
          <div className="mt-14 grid gap-5 lg:grid-cols-12">
            {ceremonies.map((ceremony, index) => (
              <article
                key={`${ceremony.title}-${ceremony.date}-${ceremony.time}`}
                className={cn(
                  "relative overflow-hidden border border-[#D8E3DF]/32 bg-[#244632] p-7 shadow-[0_1.5rem_4rem_rgba(12,28,20,0.32)] sm:p-9",
                  index === 0 ? "lg:col-span-7" : "lg:col-span-5",
                )}
              >
                <span className={`${coiTrauTypography.displayFontClass} absolute -right-2 -top-8 text-[9rem] leading-none text-[#D8E3DF]/6`}>
                  {String(index + 1).padStart(2, "0")}
                </span>
                <p className="relative text-[10px] font-semibold uppercase tracking-[0.25em] text-[#D8E3DF]">
                  {t("ceremony")}
                </p>
                <h3 className={`${coiTrauTypography.displayFontClass} relative mt-5 text-3xl font-medium leading-tight sm:text-4xl`}>
                  {ceremony.title}
                </h3>
                <p className="relative mt-8 text-sm font-semibold uppercase tracking-[0.1em] text-[#D8E3DF]">
                  {formattedEventDate(ceremony.date)}
                </p>
                <p className={`${coiTrauTypography.displayFontClass} relative mt-2 text-5xl tabular-nums text-[#F1E8D8]`}>
                  {ceremony.time}
                </p>
              </article>
            ))}

            <article className="relative overflow-hidden border border-[#929B98]/45 bg-[#F1E8D8] p-7 text-[#32151F] shadow-[0_1.5rem_4rem_rgba(12,28,20,0.28)] sm:p-9 lg:col-span-12 lg:grid lg:grid-cols-[0.72fr_1.28fr] lg:items-center lg:gap-12">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-[#315A42]">
                  {t("reception")}
                </p>
                {receptionDate ? (
                  <p className={`${coiTrauTypography.displayFontClass} mt-4 text-6xl leading-none text-[#B85B52] sm:text-7xl`}>
                    {receptionDate.day}.{receptionDate.month}
                  </p>
                ) : null}
                <p className="mt-3 text-sm font-semibold uppercase tracking-[0.12em] text-[#315A42]">
                  {venue.banquetTime || couple.time}
                </p>
              </div>
              <div className="mt-7 border-t border-[#929B98]/45 pt-7 lg:mt-0 lg:border-l lg:border-t-0 lg:pl-12 lg:pt-0">
                <p className="whitespace-pre-line text-base font-semibold leading-8">
                  {venue.address}
                </p>
              </div>
            </article>
          </div>
        </div>
      </section>

      <section className="relative px-4 py-20 sm:px-7 sm:py-32">
        <div className="mx-auto max-w-5xl">
          <SectionHeading number="03">{t("remaining")}</SectionHeading>
          <div className="mt-12 grid gap-7 lg:grid-cols-[0.86fr_1.14fr]">
            <PaperPanel className="flex min-h-[22rem] flex-col items-center justify-center text-center">
              <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-[#315A42]">
                {t("saveTheDate")}
              </p>
              <SharedCountdown
                className={`${coiTrauTypography.displayFontClass} mt-7 text-[clamp(2rem,7vw,4.3rem)] leading-tight text-[#32151F] tabular-nums`}
                labels={{
                  days: t("days"),
                  hours: t("hours"),
                  minutes: t("minutes"),
                  seconds: t("seconds"),
                }}
                target={`${couple.date}T${couple.time}`}
              />
              <a
                className="mt-9 inline-flex min-h-11 items-center rounded-full bg-[#315A42] px-6 text-sm font-semibold text-[#F1E8D8] transition hover:-translate-y-0.5 hover:bg-[#244632] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#315A42] focus-visible:ring-offset-2"
                href={googleCalendarUrl(content)}
                rel="noreferrer"
                target="_blank"
              >
                {t("addToCalendar")}
              </a>
            </PaperPanel>

            {calendar ? (
              <PaperPanel>
                <h3 className={`${coiTrauTypography.displayFontClass} text-center text-4xl font-medium`}>
                  {t("calendar", { month: calendar.month })}
                </h3>
                <p className="mt-1 text-center text-xs font-semibold tracking-[0.18em] text-[#315A42]">
                  {calendar.year}
                </p>
                <div className="mt-7 grid grid-cols-7 gap-1 text-center">
                  {WEEKDAY_LABELS.map((label) => (
                    <span key={label} className="py-2 text-[10px] font-semibold text-[#315A42]">
                      {label}
                    </span>
                  ))}
                  {calendar.cells.map((day, index) => (
                    <span
                      key={`${day ?? "empty"}-${index}`}
                      className={cn(
                        "grid aspect-square place-items-center rounded-full text-xs tabular-nums",
                        day === calendar.highlight
                          ? "bg-[#32151F] font-semibold text-[#F1E8D8] shadow-[0_0_0_4px_rgba(184,91,82,0.16)]"
                          : "text-[#32151F]/72",
                      )}
                    >
                      {day}
                    </span>
                  ))}
                </div>
              </PaperPanel>
            ) : null}
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden bg-[#32151F] px-4 py-20 text-[#F1E8D8] sm:px-7 sm:py-32">
        <div className="mx-auto max-w-6xl">
          <SectionHeading light number="04">{t("album")}</SectionHeading>
          <div className="mt-14 border border-[#D8E3DF]/25 bg-[#210D15] p-3 shadow-[0_2rem_6rem_rgba(0,0,0,0.3)] sm:p-7">
            <AlbumGallery
              accent="#D8E3DF"
              layout={content.albumLayout ?? "mosaic"}
              photos={gallery}
              radiusClass="rounded-[1.25rem]"
            />
          </div>
        </div>
      </section>

      {schedule.length ? (
        <section className="relative px-4 py-20 sm:px-7 sm:py-32">
          <div className="mx-auto max-w-5xl">
            <SectionHeading number="05">{t("timeline")}</SectionHeading>
            <div className="relative mt-14">
              <div className="absolute bottom-5 left-[2.3rem] top-5 w-px bg-[#929B98]/45 sm:left-1/2" />
              <div className="space-y-5 sm:space-y-0">
                {schedule.map((item, index) => (
                  <article
                    key={`${item.time}-${item.label}`}
                    className={cn(
                      "relative grid min-h-28 grid-cols-[4.75rem_1fr] items-center gap-4 sm:w-1/2 sm:grid-cols-1 sm:gap-0",
                      index % 2 === 0
                        ? "sm:pr-12 sm:text-right"
                        : "sm:ml-auto sm:pl-12 sm:text-left",
                    )}
                  >
                    <span className={cn(
                      "z-10 grid size-12 place-items-center rounded-full border border-[#929B98]/60 bg-[#E7DECF] text-xs font-semibold tabular-nums text-[#315A42] sm:absolute sm:top-1/2 sm:-translate-y-1/2",
                      index % 2 === 0 ? "sm:-right-6" : "sm:-left-6",
                    )}>
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <div className="border-b border-[#929B98]/40 pb-5 sm:border-0 sm:pb-0">
                      <p className={`${coiTrauTypography.displayFontClass} text-4xl leading-none text-[#B85B52] tabular-nums`}>
                        {item.time}
                      </p>
                      <p className="mt-2 text-sm font-semibold uppercase tracking-[0.1em] text-[#32151F]/72">
                        {item.label}
                      </p>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </section>
      ) : null}

      <section className="relative overflow-hidden bg-[#D7D0C3] px-4 py-20 sm:px-7 sm:py-32">
        <Image
          aria-hidden="true"
          alt=""
          className="pointer-events-none absolute -right-36 top-10 h-[28rem] w-auto rotate-12 opacity-[0.09]"
          height={1200}
          src={BETEL_VINE}
          unoptimized
          width={900}
        />
        <div className="relative mx-auto max-w-6xl">
          <SectionHeading number="06">{t("map")}</SectionHeading>
          <div className="mt-12 grid overflow-hidden border border-[#929B98]/45 bg-[#F1E8D8] shadow-[0_2rem_5rem_rgba(50,21,31,0.14)] lg:grid-cols-[0.72fr_1.28fr]">
            <div className="flex flex-col justify-center p-7 sm:p-10">
              <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-[#315A42]">
                {t("location")}
              </p>
              <p className={`${coiTrauTypography.displayFontClass} mt-5 text-3xl font-medium leading-tight`}>
                {t("reception")}
              </p>
              <p className="mt-5 whitespace-pre-line text-sm leading-7 text-[#32151F]/68">
                {venue.address}
              </p>
              <MapDirectionsButton
                className="mt-7 w-fit rounded-full border border-[#315A42] bg-[#315A42] px-5 py-2 text-sm font-semibold text-[#F1E8D8]"
                label={t("directions")}
                query={mapQuery}
              />
            </div>
            <InvitationMap
              className="h-[420px] w-full border-t border-[#929B98]/45 grayscale-[0.18] contrast-[1.04] lg:border-l lg:border-t-0"
              query={mapQuery}
              title={t("map")}
            />
          </div>
        </div>
      </section>

      {dressColors.length ? (
        <section className="bg-[#315A42] px-4 py-20 text-[#F1E8D8] sm:px-7 sm:py-28">
          <div className="mx-auto max-w-4xl border border-[#D8E3DF]/32 bg-[#244632] px-6 py-12 shadow-[0_2rem_5rem_rgba(12,28,20,0.3)] sm:px-10">
            <DressCode
              colors={dressColors}
              heading={<SectionHeading light number="07">{t("dressCode")}</SectionHeading>}
              headingColor={IVORY}
              subColor="#D8E3DF"
              subLabel={t("partyAttire")}
            />
          </div>
        </section>
      ) : null}

      <section className="relative px-4 py-20 sm:px-7 sm:py-32">
        <div className="mx-auto max-w-5xl">
          <SectionHeading number="08">{t("guestbook")}</SectionHeading>
          <PaperPanel className="mt-12">
            <SharedWishForm
              accent={BETEL}
              centered
              fieldBorderColor="#929B98"
              submitTextColor={IVORY}
            />
          </PaperPanel>
          {wishes.length ? (
            <div className="mt-7 grid gap-4 sm:grid-cols-2">
              {wishes.slice(0, 4).map((wish, index) => (
                <blockquote
                  key={`${wish.name}-${wish.time}`}
                  className={cn(
                    "border p-6",
                    index % 2 === 0
                      ? "border-[#929B98]/45 bg-[#F1E8D8]"
                      : "border-[#315A42]/35 bg-[#D8E3DF]/42",
                  )}
                >
                  <p className="leading-7 text-[#32151F]/78">{wish.text}</p>
                  <footer className="mt-5 text-xs font-semibold uppercase tracking-[0.12em] text-[#315A42]">
                    {wish.name} · {formatWishTime(wish.time)}
                  </footer>
                </blockquote>
              ))}
            </div>
          ) : null}
        </div>
      </section>

      {banks.length ? (
        <section className="relative overflow-hidden bg-[#32151F] px-4 py-20 text-[#F1E8D8] sm:px-7 sm:py-32">
          <Image
            aria-hidden="true"
            alt=""
            className="pointer-events-none absolute -bottom-36 -left-32 h-[30rem] w-auto -rotate-12 opacity-[0.1] mix-blend-screen"
            height={900}
            src={ARECA_SPRAY}
            unoptimized
            width={900}
          />
          <div className="relative mx-auto max-w-5xl">
            <SectionHeading light number="09">{t("gift")}</SectionHeading>
            <div className="mt-12 border border-[#D8E3DF]/25 bg-[#210D15] px-5 py-10 sm:px-9">
              <GiftQrGrid
                accent={IVORY}
                banks={banks}
                copyNumberLabel={t("copyAccount")}
                heading={t("gift")}
                headingClassName={`${coiTrauTypography.displayFontClass} font-medium normal-case tracking-normal`}
                numberCopiedLabel={t("accountCopied")}
                radiusClass="rounded-[1.25rem]"
                saveQrLabel={t("saveQr")}
              />
            </div>
          </div>
        </section>
      ) : null}

      <footer className="relative isolate overflow-hidden bg-[#F1E8D8] px-5 py-20 text-center text-[#32151F] sm:py-32">
        <Image
          aria-hidden="true"
          alt=""
          className="pointer-events-none absolute left-1/2 top-1/2 -z-10 h-[120%] w-auto -translate-x-1/2 -translate-y-1/2 opacity-[0.06]"
          height={1200}
          src={BETEL_VINE}
          unoptimized
          width={900}
        />
        <p className="mx-auto max-w-xl text-sm leading-7 text-[#32151F]/68">
          {t("presenceHonor")}
        </p>
        <InlayDivider className="mt-6" />
        <p className={`${coiTrauTypography.displayFontClass} mx-auto mt-5 max-w-4xl text-balance text-[clamp(3rem,11vw,7rem)] font-medium leading-[0.82] tracking-[-0.045em]`}>
          <span className="block">{people[0].shortName}</span>
          <span className="my-3 block text-[0.38em] italic text-[#B85B52]">{t("and")}</span>
          <span className="block">{people[1].shortName}</span>
        </p>
        <p className="mt-9 text-[10px] font-semibold uppercase tracking-[0.3em] text-[#315A42]">
          {t("brandDomain")}
        </p>
      </footer>
    </main>
  );
}

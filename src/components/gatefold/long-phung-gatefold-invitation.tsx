"use client";

import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { Check, ChevronDown, Copy } from "lucide-react";
import {
  forwardRef,
  useState,
  type ComponentPropsWithoutRef,
  type ReactNode,
} from "react";

import {
  AlbumGallery,
  buildCalendar,
  DressCode,
  formatWishTime,
  GiftQrGrid,
  googleCalendarUrl,
  InvitationMap,
  MapDirectionsButton,
  SharedCountdown,
  SharedWishForm,
} from "@/components/chungdoi-tpl-shared";
import type { ChungDoiDemoContent } from "@/data/chungdoi-demo-content";
import {
  invitationCeremonies,
  invitationGiftAccounts,
  invitationOpeningMessage,
  orderByBrideFirst,
  orderedCouple,
  orderedHeroPhotos,
} from "@/lib/invitation-display";
import { cn } from "@/lib/utils";

const LACQUER_CRIMSON = "#5A0B12";
const DEEP_CINNABAR = "#7C1B1B";

type HandoffHeroProps = Omit<
  ComponentPropsWithoutRef<"article">,
  "children" | "content" | "style"
> & {
  content: ChungDoiDemoContent;
};

type InvitationProps = {
  content: ChungDoiDemoContent;
  className?: string;
};

type FamilyChapter = {
  address: string;
  father: string;
  mother: string;
  side: string;
  title: string;
};

type EventInsertProps = {
  date: string;
  label: string;
  message: string;
  messageStyle?: "display" | "body";
  time: string;
  tone: "ivory" | "lacquer";
};

type PaperHeadingProps = {
  children: ReactNode;
  className?: string;
  id?: string;
};

function dateFromIso(iso: string): Date | null {
  const parts = iso.split("-").map(Number);
  if (
    parts.length !== 3
    || parts.some((part) => !Number.isInteger(part))
  ) {
    return null;
  }

  const [year, month, day] = parts;
  const date = new Date(Date.UTC(year, month - 1, day));
  return Number.isNaN(date.getTime()) ? null : date;
}

export function formatGatefoldLocalizedDate(
  iso: string,
  locale: string,
): string {
  const date = dateFromIso(iso);
  if (!date) return iso;

  return new Intl.DateTimeFormat(locale, {
    day: "2-digit",
    month: "long",
    timeZone: "UTC",
    weekday: "long",
    year: "numeric",
  }).format(date);
}

function localizedWeekdays(locale: string): string[] {
  const formatter = new Intl.DateTimeFormat(locale, {
    timeZone: "UTC",
    weekday: "narrow",
  });
  const monday = Date.UTC(2024, 0, 1);

  return Array.from({ length: 7 }, (_, index) => (
    formatter.format(new Date(monday + index * 86_400_000))
  ));
}

function PaperHeading({ children, className, id }: PaperHeadingProps) {
  return (
    <h2
      id={id}
      className={cn(
        "scroll-mt-24 text-balance font-art-uni text-4xl font-normal leading-[1.12] text-[#5A0B12] sm:text-5xl",
        className,
      )}
    >
      {children}
    </h2>
  );
}

function FamilyPanel({
  chapter,
  addressCopiedLabel,
  copyAddressLabel,
  detailsLabel,
  className,
}: {
  chapter: FamilyChapter;
  addressCopiedLabel: string;
  copyAddressLabel: string;
  detailsLabel: string;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);

  const copyAddress = async () => {
    if (!chapter.address || !navigator.clipboard) return;

    try {
      await navigator.clipboard.writeText(chapter.address);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  };

  return (
    <article
      className={cn(
        "flex min-w-0 flex-col justify-center px-6 py-10 text-center sm:px-8 md:min-h-[34rem] md:py-14",
        className,
      )}
    >
      <details open className="group w-full">
        <summary className="flex cursor-pointer list-none flex-col items-center outline-none [&::-webkit-details-marker]:hidden focus-visible:ring-2 focus-visible:ring-[#B58A3A] focus-visible:ring-offset-4 focus-visible:ring-offset-[#5A0B12]">
          <span className="font-art-uni text-3xl leading-tight text-[#B58A3A] sm:text-4xl">
            {chapter.side}
          </span>
          <span className="mt-8 text-sm font-semibold text-[#EAD9B8]/72">
            {chapter.title}
          </span>
          <span className="mt-4 inline-flex items-center gap-2 border border-[#B58A3A]/45 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#EAD9B8]/72">
            {detailsLabel}
            <ChevronDown
              aria-hidden="true"
              className="size-3.5 transition-transform group-open:rotate-180"
              strokeWidth={1.5}
            />
          </span>
        </summary>
        <div className="mt-6 border-t border-[#B58A3A]/35 pt-5">
          <p className="break-words text-lg font-semibold leading-7 text-[#EAD9B8]">
            {chapter.father}
          </p>
          <p className="break-words text-lg font-semibold leading-7 text-[#EAD9B8]">
            {chapter.mother}
          </p>
          {chapter.address ? (
            <>
              <p className="mx-auto mt-6 max-w-[28ch] whitespace-pre-line text-sm leading-6 text-[#EAD9B8]/72">
                {chapter.address}
              </p>
              <button
                type="button"
                data-copy-address
                onClick={copyAddress}
                className="mx-auto mt-5 inline-flex min-h-10 items-center gap-2 border border-[#B58A3A]/45 px-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#EAD9B8]/82 transition-colors hover:bg-[#EAD9B8]/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B58A3A] active:translate-y-px"
              >
                {copied ? (
                  <Check aria-hidden size={13} strokeWidth={1.7} />
                ) : (
                  <Copy aria-hidden size={13} strokeWidth={1.7} />
                )}
                <span aria-live="polite">
                  {copied ? addressCopiedLabel : copyAddressLabel}
                </span>
              </button>
            </>
          ) : null}
        </div>
      </details>
    </article>
  );
}

function CoupleNames({
  first,
  second,
  conjunction,
  className,
}: {
  first: string;
  second: string;
  conjunction: string;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "flex flex-col items-center gap-0.5 leading-tight sm:flex-row sm:gap-0",
        className,
      )}
    >
      <span className="max-w-full text-balance">{first}</span>
      <span className="font-art-lora text-base italic text-[#B58A3A] sm:mx-2">
        {conjunction}
      </span>
      <span className="max-w-full text-balance">{second}</span>
    </span>
  );
}

function EventInsert({
  date,
  label,
  message,
  messageStyle = "display",
  time,
  tone,
}: EventInsertProps) {
  const isIvory = tone === "ivory";
  const messageClassName = messageStyle === "body"
    ? "font-art-lora text-lg font-medium leading-[1.45] sm:text-xl"
    : "font-art-uni text-3xl font-normal leading-tight sm:text-4xl";

  return (
    <article
      data-gatefold-paper-insert="true"
      className={cn(
        "relative min-w-0 border p-7 transition-transform duration-300 hover:-translate-y-1 sm:p-9",
        isIvory
          ? "border-[#B58A3A]/55 bg-[#EAD9B8] text-[#17110F] shadow-[0_1.5rem_3.5rem_rgba(23,17,15,0.22)]"
          : "border-[#B58A3A]/45 bg-[#7C1B1B] text-[#EAD9B8] shadow-[0_1.5rem_3.5rem_rgba(23,17,15,0.3)]",
      )}
    >
      <p
        className={cn(
          "text-[11px] font-semibold uppercase tracking-[0.24em]",
          isIvory ? "text-[#7C1B1B]" : "text-[#B58A3A]",
        )}
      >
        {label}
      </p>
      <h3
        className={cn(
          "mt-6 whitespace-pre-line",
          messageClassName,
          isIvory ? "text-[#5A0B12]" : "text-[#EAD9B8]",
        )}
      >
        {message}
      </h3>
      {date ? (
        <p className="mt-8 max-w-[30ch] text-sm font-semibold leading-6">
          {date}
        </p>
      ) : null}
      {time ? (
        <p
          className={cn(
            "mt-2 text-sm",
            isIvory ? "text-[#17110F]/68" : "text-[#EAD9B8]/72",
          )}
        >
          {time}
        </p>
      ) : null}
    </article>
  );
}

/**
 * The exact DOM sheet used at the WebGL handoff. Its 67:101 geometry mirrors
 * the center sheet in the physical scene.
 */
export const LongPhungGatefoldHandoffHero = forwardRef<
  HTMLElement,
  HandoffHeroProps
>(function LongPhungGatefoldHandoffHero(
  { className, content, tabIndex, ...articleProps },
  ref,
) {
  const locale = useLocale();
  const t = useTranslations("invitationTemplate");
  const people = orderedCouple(content);
  const date = formatGatefoldLocalizedDate(content.couple.date, locale);
  const dateAndTime = [date, content.couple.time].filter(Boolean).join(" / ");

  return (
    <article
      {...articleProps}
      ref={ref}
      data-gatefold-inner-sheet="true"
      data-testid="long-phung-gatefold-dom-hero"
      tabIndex={tabIndex ?? -1}
      className={cn(
        "relative flex aspect-[67/101] w-[min(89.333vw,29.5rem)] shrink-0 flex-col items-center justify-center overflow-hidden border border-[#B58A3A]/55 bg-[#EAD9B8] px-[clamp(1.5rem,8cqw,3rem)] py-10 text-center text-[#17110F] shadow-[0_1.5rem_4rem_rgba(23,17,15,0.32)] outline-none [container-type:inline-size] focus-visible:ring-2 focus-visible:ring-[#B58A3A] focus-visible:ring-offset-4 focus-visible:ring-offset-[#17110F]",
        className,
      )}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-3 border border-[#B58A3A]/35"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-8 top-[18%] h-px bg-[#B58A3A]/45"
      />
      <p className="relative text-[clamp(0.62rem,2.7cqw,0.75rem)] font-semibold uppercase tracking-[0.24em] text-[#7C1B1B]">
        {t("invitation")}
      </p>
      <h2 className="relative mt-[clamp(1rem,5cqw,1.75rem)] flex max-w-full flex-col items-center font-art-uni text-[clamp(2.3rem,12cqw,4.1rem)] font-normal leading-[1.02] text-[#5A0B12]">
        <span className="max-w-full text-balance">{people[0].shortName}</span>
        <span className="my-[clamp(0.2rem,1.2cqw,0.45rem)] font-art-lora text-[clamp(0.8rem,3.5cqw,1.1rem)] italic leading-[1.2] text-[#B58A3A]">
          {t("and")}
        </span>
        <span className="max-w-full text-balance">{people[1].shortName}</span>
      </h2>
      <p className="relative mt-[clamp(1rem,5cqw,1.75rem)] text-[clamp(0.68rem,2.8cqw,0.82rem)] font-semibold leading-5 text-[#7C1B1B]">
        {dateAndTime}
      </p>
      <div
        aria-hidden="true"
        className="relative mx-auto mt-[clamp(0.8rem,4cqw,1.5rem)] h-px w-16 bg-[#B58A3A]"
      />
      <p className="relative mx-auto mt-[clamp(0.8rem,4cqw,1.5rem)] max-w-[31ch] whitespace-pre-line font-art-lora text-[clamp(0.72rem,3.2cqw,0.95rem)] leading-[1.65] text-[#3B2117]">
        {invitationOpeningMessage(content)}
      </p>
    </article>
  );
});

/**
 * Post-open document. Desktop sections retain a foldout grammar while mobile
 * collapses every paper object into a single, overflow-safe reading column.
 */
export function LongPhungGatefoldInvitationBody({
  content,
  className,
}: InvitationProps) {
  const locale = useLocale();
  const t = useTranslations("invitationTemplate");
  const { couple, families, gallery, schedule, venue, wishes } = content;
  const people = orderedCouple(content);
  const portraitPrints = orderedHeroPhotos(content, {
    albumFallback: true,
  })
    .map((src, index) => ({ person: people[index], src }))
    .filter((print) => print.src.trim());
  const familyChapters = orderByBrideFirst<FamilyChapter>(
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
  const ceremonies = invitationCeremonies(content);
  const [primaryCeremony, ...additionalCeremonies] = ceremonies;
  const calendar = buildCalendar(couple.date);
  const weekdays = localizedWeekdays(locale);
  const mapQuery = venue.mapAddress
    || venue.address.replace(/\n+/g, ", ").trim();
  const dressColors = (content.dressCodeColors ?? "")
    .split(",")
    .map((color) => color.trim())
    .filter((color) => /^#[0-9a-fA-F]{6}$/.test(color));
  const effectiveDressColors = (
    dressColors.length ? dressColors : ["#5A0B12", "#B58A3A", "#EAD9B8"]
  ).map((color) => ({
    border: color.toLowerCase() === "#ead9b8" ? "#B58A3A" : undefined,
    color,
  }));
  const banks = invitationGiftAccounts(content).map((account) => ({
    label: account.name,
    bank: account.bank,
    num: account.num,
    name: account.name,
  }));
  return (
    <div
      data-gatefold-invitation-body="true"
      className={cn(
        "relative w-full overflow-x-clip bg-[#17110F] font-art-lora text-[#EAD9B8]",
        className,
      )}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_12%_8%,rgba(124,27,27,0.36),transparent_30%),radial-gradient(circle_at_88%_34%,rgba(181,138,58,0.09),transparent_26%)]"
      />
      {portraitPrints.length ? (
        <section
          aria-labelledby="gatefold-portraits-heading"
          className="relative mx-auto w-full max-w-6xl px-4 pb-24 pt-20 sm:px-7 sm:pb-32 sm:pt-28"
        >
          <h2 id="gatefold-portraits-heading" className="sr-only">
            {t("weddingPhotoAlt", {
              couple: `${people[0].shortName} ${t("and")} ${people[1].shortName}`,
            })}
          </h2>
          <div className="grid min-w-0 grid-cols-1 gap-8 md:grid-cols-12 md:gap-0">
            {portraitPrints.map((print, index) => (
              <figure
                key={`${print.person.side}-${print.src}`}
                className={cn(
                  "relative min-w-0 bg-[#EAD9B8] p-3 pb-6 shadow-[0_2rem_5rem_rgba(23,17,15,0.42)] sm:p-4 sm:pb-7",
                  index === 0
                    ? "md:col-span-7 md:col-start-1 md:row-start-1 md:-rotate-[1.5deg]"
                    : "md:col-span-6 md:col-start-7 md:row-start-1 md:mt-24 md:rotate-[1.25deg]",
                )}
              >
                <div className="relative aspect-[4/5] overflow-hidden bg-[#5A0B12]/12">
                  <Image
                    alt={t("weddingPhotoAlt", {
                      couple: print.person.shortName,
                    })}
                    className="h-full w-full object-cover"
                    fill
                    sizes="(max-width: 767px) calc(100vw - 3.5rem), 46vw"
                    src={print.src}
                  />
                </div>
                <figcaption className="mt-5 px-2 text-center font-art-uni text-2xl leading-tight text-[#5A0B12] text-balance sm:mt-6">
                  {print.person.shortName}
                </figcaption>
              </figure>
            ))}
          </div>
        </section>
      ) : null}

      <section
        aria-labelledby="gatefold-families-heading"
        className="relative mx-auto w-full max-w-7xl px-4 py-20 sm:px-7 sm:py-28"
      >
        <div className="overflow-hidden border border-[#B58A3A]/55 shadow-[0_2rem_6rem_rgba(23,17,15,0.48)]">
          <div className="grid min-w-0 grid-cols-1 md:grid-cols-[1fr_0.86fr_1fr]">
            <FamilyPanel
              chapter={familyChapters[0]}
              addressCopiedLabel={t("addressCopied")}
              copyAddressLabel={t("copyAddress")}
              detailsLabel={t("details")}
              className="order-2 border-t border-[#B58A3A]/35 bg-[#5A0B12] md:order-1 md:border-r md:border-t-0"
            />
            <article className="order-1 flex min-w-0 flex-col items-center justify-center bg-[#EAD9B8] px-6 py-12 text-center text-[#17110F] shadow-[0_0_2.4rem_rgba(23,17,15,0.25)] sm:px-9 md:order-2 md:min-h-[38rem] md:py-16">
              <PaperHeading
                id="gatefold-families-heading"
                className="text-4xl sm:text-5xl"
              >
                {t("respectfulInvitation")}
              </PaperHeading>
              <p className="mx-auto mt-8 max-w-[29ch] whitespace-pre-line text-sm leading-7 text-[#3B2117]">
                {invitationOpeningMessage(content)}
              </p>
              <CoupleNames
                className="mt-9 font-art-uni text-3xl text-[#7C1B1B]"
                conjunction={t("and")}
                first={people[0].shortName}
                second={people[1].shortName}
              />
              <p className="mt-6 text-sm font-semibold leading-6 text-[#5A0B12]">
                {formatGatefoldLocalizedDate(couple.date, locale)}
              </p>
            </article>
            <FamilyPanel
              chapter={familyChapters[1]}
              addressCopiedLabel={t("addressCopied")}
              copyAddressLabel={t("copyAddress")}
              detailsLabel={t("details")}
              className="order-3 border-t border-[#B58A3A]/35 bg-[#7C1B1B] md:border-l md:border-t-0"
            />
          </div>
        </div>
      </section>

      <section
        aria-labelledby="gatefold-events-heading"
        className="relative mx-auto w-full max-w-6xl px-4 py-20 sm:px-7 sm:py-28"
      >
        <PaperHeading
          id="gatefold-events-heading"
          className="text-[#EAD9B8]"
        >
          {t("ceremony")}
        </PaperHeading>
        <div className="mt-10 grid min-w-0 gap-5 md:grid-cols-12">
          {primaryCeremony ? (
            <div className="min-w-0 md:col-span-7">
              <EventInsert
                date={formatGatefoldLocalizedDate(primaryCeremony.date, locale)}
                label={t("ceremony")}
                message={primaryCeremony.title}
                time={primaryCeremony.time}
                tone="ivory"
              />
            </div>
          ) : null}
          <div
            className={cn(
              "min-w-0",
              primaryCeremony ? "md:col-span-5 md:pt-16" : "md:col-span-12",
            )}
          >
            <EventInsert
              date={formatGatefoldLocalizedDate(couple.date, locale)}
              label={t("reception")}
              message={venue.address}
              messageStyle="body"
              time={venue.banquetTime || couple.time}
              tone="lacquer"
            />
          </div>
          {additionalCeremonies.length ? (
            <div className="grid min-w-0 gap-4 md:col-span-12 md:ml-[14%] md:grid-cols-2">
              {additionalCeremonies.map((ceremony) => (
                <EventInsert
                  key={`${ceremony.title}-${ceremony.date}-${ceremony.time}`}
                  date={formatGatefoldLocalizedDate(ceremony.date, locale)}
                  label={t("ceremony")}
                  message={ceremony.title}
                  time={ceremony.time}
                  tone="ivory"
                />
              ))}
            </div>
          ) : null}
        </div>
      </section>

      <section
        aria-labelledby="gatefold-countdown-heading"
        className="relative mx-auto grid w-full max-w-6xl min-w-0 grid-cols-1 px-4 py-20 sm:px-7 sm:py-28 md:grid-cols-[0.78fr_1.22fr]"
      >
        <div className="flex min-w-0 flex-col justify-center border border-[#B58A3A]/55 bg-[#7C1B1B] px-6 py-12 text-center sm:px-9 md:py-16">
          <div className="mx-auto grid aspect-square w-full max-w-[17rem] place-items-center rounded-full border border-[#B58A3A]/70 bg-[#5A0B12] p-8 shadow-[inset_0_0_2.5rem_rgba(23,17,15,0.42)]">
            <div>
              <h2
                id="gatefold-countdown-heading"
                className="scroll-mt-24 font-art-uni text-4xl font-normal text-[#EAD9B8]"
              >
                {t("remaining")}
              </h2>
              <SharedCountdown
                className="mx-auto mt-5 max-w-[18ch] text-base font-semibold leading-7 text-[#EAD9B8]"
                labels={{
                  days: t("days"),
                  hours: t("hours"),
                  minutes: t("minutes"),
                  seconds: t("seconds"),
                }}
                target={`${couple.date}T${couple.time}`}
              />
            </div>
          </div>
          <a
            className="mx-auto mt-8 inline-flex min-h-11 max-w-full items-center justify-center whitespace-nowrap border border-[#B58A3A] bg-[#B58A3A] px-5 py-3 text-sm font-semibold text-[#17110F] transition-transform active:translate-y-px"
            href={googleCalendarUrl(content)}
            rel="noreferrer"
            target="_blank"
          >
            {t("addToCalendar")}
          </a>
        </div>
        {calendar ? (
          <article className="min-w-0 border border-[#B58A3A]/55 bg-[#EAD9B8] p-6 text-[#17110F] shadow-[0_1.5rem_4rem_rgba(23,17,15,0.28)] sm:p-9 md:-my-8 md:p-12">
            <PaperHeading className="text-3xl sm:text-4xl">
              {t("calendar", { month: calendar.month })}
            </PaperHeading>
            <div className="mt-8 grid grid-cols-7 gap-1 text-center sm:gap-2">
              {weekdays.map((label, index) => (
                <span
                  key={`${label}-${index}`}
                  className="py-2 text-[10px] font-semibold text-[#5A0B12]/65 sm:text-xs"
                >
                  {label}
                </span>
              ))}
              {calendar.cells.map((day, index) => (
                <span
                  key={`${day ?? "empty"}-${index}`}
                  aria-current={day === calendar.highlight ? "date" : undefined}
                  className={cn(
                    "flex aspect-square min-w-0 items-center justify-center text-xs tabular-nums sm:text-sm",
                    day === calendar.highlight
                      ? "rounded-full bg-[#7C1B1B] font-semibold text-[#EAD9B8]"
                      : "text-[#17110F]",
                  )}
                >
                  {day}
                </span>
              ))}
            </div>
          </article>
        ) : null}
      </section>

      {gallery.length ? (
        <section
          aria-labelledby="gatefold-album-heading"
          className="relative mx-auto w-full max-w-6xl px-4 py-20 sm:px-7 sm:py-28"
        >
          <div className="relative overflow-hidden border border-[#B58A3A]/55 bg-[#EAD9B8] px-5 pb-10 pt-20 text-[#17110F] shadow-[0_2rem_6rem_rgba(23,17,15,0.42)] sm:px-10 sm:pb-14 sm:pt-24">
            <div
              aria-hidden="true"
              className="absolute inset-x-0 top-0 h-10 border-b border-[#B58A3A]/35 bg-[#7C1B1B]"
            />
            <PaperHeading id="gatefold-album-heading" className="text-center">
              {t("album")}
            </PaperHeading>
            <div className="mt-10 flex justify-center">
              <AlbumGallery
                accent={DEEP_CINNABAR}
                layout={content.albumLayout ?? "mosaic"}
                photos={gallery}
                radiusClass="rounded-none"
              />
            </div>
          </div>
        </section>
      ) : null}

      {schedule.length ? (
        <section
          aria-labelledby="gatefold-timeline-heading"
          className="relative mx-auto w-full max-w-4xl px-4 py-20 sm:px-7 sm:py-28"
        >
          <PaperHeading
            id="gatefold-timeline-heading"
            className="text-[#EAD9B8]"
          >
            {t("timeline")}
          </PaperHeading>
          <div className="relative mt-12">
            <div
              aria-hidden="true"
              className="absolute bottom-3 left-[3.15rem] top-3 w-px bg-[#B58A3A]/55 sm:left-[6.15rem]"
            />
            <ol className="grid gap-8">
              {schedule.map((item) => (
                <li
                  key={`${item.time}-${item.label}`}
                  className="relative grid min-w-0 grid-cols-[5rem_minmax(0,1fr)] items-start gap-5 sm:grid-cols-[11rem_minmax(0,1fr)] sm:gap-8"
                >
                  <time className="pt-1 text-sm font-semibold tabular-nums text-[#B58A3A] sm:text-right sm:text-base">
                    {item.time}
                  </time>
                  <div
                    aria-hidden="true"
                    className="absolute left-[2.85rem] top-2 size-2.5 rotate-45 border border-[#B58A3A] bg-[#5A0B12] sm:left-[5.85rem]"
                  />
                  <p className="min-w-0 border border-[#B58A3A]/30 bg-[#5A0B12]/68 px-5 py-4 leading-7 text-[#EAD9B8]">
                    {item.label}
                  </p>
                </li>
              ))}
            </ol>
          </div>
        </section>
      ) : null}

      <section
        aria-labelledby="gatefold-map-heading"
        className="relative mx-auto w-full max-w-7xl px-4 py-20 sm:px-7 sm:py-28"
      >
        <div className="relative grid min-w-0 overflow-hidden border border-[#B58A3A]/55 bg-[#EAD9B8] text-[#17110F] shadow-[0_2rem_6rem_rgba(23,17,15,0.45)] md:grid-cols-[0.8fr_1.2fr]">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-y-0 left-1/2 hidden w-px bg-[#B58A3A]/28 md:block"
          />
          <div className="flex min-w-0 flex-col justify-center px-6 py-10 sm:px-10 sm:py-14">
            <PaperHeading id="gatefold-map-heading">
              {t("map")}
            </PaperHeading>
            <p className="mt-7 max-w-[34ch] whitespace-pre-line text-sm leading-7 text-[#3B2117]">
              {venue.address}
            </p>
            <MapDirectionsButton
              className="self-start rounded-none border-[#5A0B12] bg-[#5A0B12] px-6 py-3 text-[#EAD9B8] hover:opacity-90 active:translate-y-px"
              label={t("location")}
              query={mapQuery}
            />
          </div>
          <InvitationMap
            allowFullScreen
            className="h-[24rem] w-full min-w-0 border-0 grayscale-[0.12] md:h-[32rem]"
            loading="lazy"
            query={mapQuery}
            referrerPolicy="no-referrer-when-downgrade"
            title={`${t("map")}: ${venue.address}`}
          />
        </div>
      </section>

      <section
        aria-labelledby="gatefold-dress-code-heading"
        className="relative mx-auto w-full max-w-5xl px-4 py-20 sm:px-7 sm:py-28"
      >
        <div className="border border-[#B58A3A]/55 bg-[#5A0B12] bg-[repeating-linear-gradient(135deg,rgba(234,217,184,0.08)_0_1px,transparent_1px_5px)] px-6 py-12 shadow-[0_2rem_5rem_rgba(23,17,15,0.35)] sm:px-10 sm:py-16">
          <DressCode
            colors={effectiveDressColors}
            heading={(
              <PaperHeading
                id="gatefold-dress-code-heading"
                className="text-center text-[#EAD9B8]"
              >
                {t("dressCode")}
              </PaperHeading>
            )}
            headingColor="#EAD9B8"
            subColor="#EAD9B8"
            subLabel={t("details")}
          />
        </div>
      </section>

      <section
        aria-labelledby="gatefold-guestbook-heading"
        className="relative mx-auto w-full max-w-6xl px-4 py-20 sm:px-7 sm:py-28"
      >
        <div className="border border-[#B58A3A]/55 bg-[#EAD9B8] p-6 text-[#17110F] shadow-[0_2rem_6rem_rgba(23,17,15,0.42)] sm:p-10">
          <div className="border-l-4 border-[#7C1B1B] pl-5 sm:pl-8">
            <PaperHeading id="gatefold-guestbook-heading">
              {t("guestbook")}
            </PaperHeading>
            <SharedWishForm
              accent={DEEP_CINNABAR}
              labels={{
                namePlaceholder: t("wishName"),
                textPlaceholder: t("wishText"),
                success: t("wishSuccess"),
                submit: t("wishSubmit"),
                pending: t("wishPending"),
              }}
            />
          </div>
          {wishes.length ? (
            <div
              aria-label={t("guestbook")}
              className="mt-10 flex snap-x snap-mandatory gap-4 overflow-x-auto pb-4"
              role="list"
            >
              {wishes.map((wish) => (
                <blockquote
                  key={`${wish.name}-${wish.time}`}
                  className="min-w-[min(78vw,21rem)] shrink-0 snap-start border border-[#B58A3A]/45 bg-[#F1E4C9] p-6"
                  role="listitem"
                >
                  <p className="line-clamp-3 leading-7 text-[#3B2117]">
                    {wish.text}
                  </p>
                  <footer className="mt-5 text-xs leading-5 text-[#5A0B12]/70">
                    <span className="font-semibold text-[#5A0B12]">
                      {wish.name}
                    </span>
                    <br />
                    {formatWishTime(wish.time)}
                  </footer>
                </blockquote>
              ))}
            </div>
          ) : null}
        </div>
      </section>

      {banks.length ? (
        <section
          id="gatefold-gift"
          aria-labelledby="gatefold-gift-heading"
          className="relative mx-auto w-full max-w-5xl scroll-mt-24 px-4 py-20 sm:px-7 sm:py-28"
        >
          <div className="relative overflow-hidden border border-[#B58A3A]/55 bg-[#EAD9B8] px-5 pb-12 pt-24 text-[#17110F] shadow-[0_2rem_6rem_rgba(23,17,15,0.45)] sm:px-10 sm:pb-16">
            <div
              aria-hidden="true"
              className="absolute left-1/2 top-0 h-36 w-36 -translate-x-1/2 -translate-y-[72%] rotate-45 border border-[#B58A3A]/55 bg-[#7C1B1B] sm:h-44 sm:w-44"
            />
            <h2 id="gatefold-gift-heading" className="sr-only">
              {t("gift")}
            </h2>
            <GiftQrGrid
              accent={LACQUER_CRIMSON}
              banks={banks}
              heading={t("gift")}
              headingClassName="font-art-uni text-4xl font-normal normal-case tracking-normal sm:text-5xl"
              radiusClass="rounded-none"
              saveQrLabel={t("saveQr")}
            />
          </div>
        </section>
      ) : null}

      <footer
        data-template-footer="true"
        className="relative mx-auto w-full max-w-6xl border-t border-[#B58A3A]/45 px-4 pb-24 pt-16 text-center sm:px-7 sm:pb-32 sm:pt-20"
      >
        <p className="mx-auto max-w-[46ch] text-sm leading-7 text-[#EAD9B8]/72">
          {t("presenceHonor")}
        </p>
        <CoupleNames
          className="mt-7 font-art-uni text-4xl text-[#B58A3A] sm:text-5xl"
          conjunction={t("and")}
          first={people[0].shortName}
          second={people[1].shortName}
        />
      </footer>
    </div>
  );
}

/**
 * Standalone document renderer for previews and the published experience.
 * The opening shell can render the hero and body separately to preserve the
 * zero-frame WebGL handoff.
 */
export function LongPhungGatefoldInvitation({
  content,
  className,
}: InvitationProps) {
  return (
    <main
      data-template-slug="long-phung-gatefold"
      className={cn(
        "min-h-[100dvh] w-full overflow-x-clip bg-[#17110F]",
        className,
      )}
    >
      <section className="relative grid min-h-[100dvh] place-items-center overflow-hidden bg-[radial-gradient(circle_at_50%_16%,#7C1B1B_0%,#5A0B12_40%,#17110F_100%)] px-4 py-14 sm:px-7">
        <LongPhungGatefoldHandoffHero content={content} />
      </section>
      <LongPhungGatefoldInvitationBody content={content} />
    </main>
  );
}

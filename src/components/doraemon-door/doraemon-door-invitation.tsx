"use client";

import { CalendarPlus, Check, Copy } from "lucide-react";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
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
import { doraemonDoorPilot } from "@/data/doraemon-door-pilot";
import {
  invitationCeremonies,
  invitationGiftAccounts,
  invitationOpeningMessage,
  orderByBrideFirst,
  orderedCouple,
} from "@/lib/invitation-display";
import { cn } from "@/lib/utils";

const DOOR_PINK = "#E96F9A";
const PORTAL_BLUE = "#39BCEB";
const INK = "#17334A";
const WARM_WHITE = "#FFF9EE";

type HandoffHeroProps = Omit<
  ComponentPropsWithoutRef<"section">,
  "children" | "content"
> & {
  content: ChungDoiDemoContent;
};

type InvitationProps = {
  className?: string;
  content: ChungDoiDemoContent;
};

type FamilyPanelData = {
  address: string;
  father: string;
  mother: string;
  side: string;
  title: string;
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

export function formatDoraemonDoorLocalizedDate(
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

function SectionTitle({
  children,
  className,
  id,
}: {
  children: ReactNode;
  className?: string;
  id?: string;
}) {
  return (
    <h2
      id={id}
      className={cn(
        "mx-auto scroll-mt-20 text-center text-balance font-art-marvin text-4xl font-normal leading-[0.92] tracking-[-0.02em] text-[#17334A] sm:text-5xl md:text-6xl",
        className,
      )}
    >
      {children}
    </h2>
  );
}

function HeroCharacter({
  className,
  preload = false,
  sizes,
  src,
}: {
  className: string;
  preload?: boolean;
  sizes: string;
  src: string;
}) {
  return (
    <div className={cn("absolute", className)}>
      <Image
        alt=""
        aria-hidden="true"
        className="object-contain object-bottom"
        fill
        preload={preload}
        sizes={sizes}
        src={src}
      />
    </div>
  );
}

function FamilyPanel({
  addressCopiedLabel,
  copyAddressLabel,
  panel,
}: {
  addressCopiedLabel: string;
  copyAddressLabel: string;
  panel: FamilyPanelData;
}) {
  const [copied, setCopied] = useState(false);

  const copyAddress = async () => {
    if (!panel.address || !navigator.clipboard) return;

    try {
      await navigator.clipboard.writeText(panel.address);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  };

  return (
    <article className="relative overflow-hidden rounded-[2rem] border border-[#17334A]/12 bg-[#FFF9EE]/90 px-7 py-10 text-center shadow-[0_1.8rem_5rem_rgba(57,188,235,0.12)] sm:px-10 sm:py-12">
      <div
        aria-hidden="true"
        className="absolute -right-16 -top-20 size-52 rounded-full bg-[#39BCEB]/12"
      />
      <h3 className="relative font-art-marvin text-3xl text-[#E96F9A] sm:text-4xl">
        {panel.side}
      </h3>
      <p className="relative mt-5 text-sm font-semibold text-[#17334A]/58">
        {panel.title}
      </p>
      <p className="relative mt-4 text-lg font-semibold leading-8 text-[#17334A]">
        {panel.father}
      </p>
      <p className="relative text-lg font-semibold leading-8 text-[#17334A]">
        {panel.mother}
      </p>
      {panel.address ? (
        <>
          <p className="relative mx-auto mt-6 max-w-[34ch] whitespace-pre-line text-sm leading-7 text-[#17334A]/68">
            {panel.address}
          </p>
          <button
            type="button"
            data-copy-address
            onClick={copyAddress}
            className="relative mt-6 inline-flex min-h-11 items-center gap-2 rounded-full border border-[#E96F9A] bg-[#FFF9EE] px-4 text-xs font-semibold text-[#17334A] transition-transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E96F9A] active:translate-y-px"
          >
            {copied ? (
              <Check aria-hidden size={15} strokeWidth={1.7} />
            ) : (
              <Copy aria-hidden size={15} strokeWidth={1.7} />
            )}
            <span aria-live="polite">
              {copied ? addressCopiedLabel : copyAddressLabel}
            </span>
          </button>
        </>
      ) : null}
    </article>
  );
}

export const DoraemonDoorHandoffHero = forwardRef<
  HTMLElement,
  HandoffHeroProps
>(function DoraemonDoorHandoffHero(
  { className, content, tabIndex, ...sectionProps },
  ref,
) {
  const locale = useLocale();
  const invitationT = useTranslations("invitationTemplate");
  const doorT = useTranslations("doraemonDoor");
  const people = orderedCouple(content);
  const assets = doraemonDoorPilot.assets;
  const date = formatDoraemonDoorLocalizedDate(content.couple.date, locale);

  return (
    <section
      {...sectionProps}
      ref={ref}
      data-physical-handoff-target
      data-testid="doraemon-door-dom-hero"
      tabIndex={tabIndex ?? -1}
      className={cn(
        "relative isolate min-h-[100dvh] w-full overflow-hidden bg-[#DDF6FF] font-art-helvetica text-[#17334A] outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#E96F9A]",
        className,
      )}
    >
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-[radial-gradient(circle_at_50%_34%,rgba(255,249,238,0.98)_0%,rgba(164,233,252,0.76)_23%,transparent_58%),linear-gradient(to_bottom,#DDF6FF_0%,#F5FCFF_72%,#FFF5E4_100%)]"
      />
      <div
        aria-hidden="true"
        className="absolute -left-20 top-[17%] h-24 w-72 rounded-full bg-white/68 blur-[1px] after:absolute after:-right-16 after:-top-10 after:size-36 after:rounded-full after:bg-white/70"
      />
      <div
        aria-hidden="true"
        className="absolute -right-20 top-[21%] h-20 w-64 rounded-full bg-white/60 after:absolute after:-left-14 after:-top-8 after:size-28 after:rounded-full after:bg-white/68"
      />

      <div className="absolute left-1/2 top-[17%] h-[76%] w-[min(64vw,31rem)] -translate-x-1/2 rounded-t-[15rem] border-[clamp(.65rem,1.4vw,1.1rem)] border-[#E96F9A] bg-[linear-gradient(to_bottom,rgba(57,188,235,0.2),rgba(255,249,238,0.76))] shadow-[0_2rem_6rem_rgba(57,188,235,0.18)] sm:top-[14%] sm:h-[82%]">
        <div className="absolute inset-3 rounded-t-[14rem] border border-white/85" />
      </div>

      <div className="absolute inset-x-4 top-[5.5%] z-30 mx-auto flex max-w-4xl flex-col items-center text-center sm:top-[4.5%]">
        <p className="font-art-helvetica text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-[#B94170] sm:text-xs">
          {doorT("heroKicker")}
        </p>
        <h2
          data-testid="doraemon-door-hero-couple-names"
          className="mt-3 w-full font-art-marvin text-[clamp(2.15rem,10vw,3rem)] leading-[0.84] tracking-[-0.035em] text-[#17334A] sm:w-auto sm:text-[clamp(2.8rem,8vw,7rem)]"
        >
          <span className="block whitespace-nowrap sm:inline">
            {people[0].shortName}
          </span>
          <span className="my-1 block text-[0.42em] text-[#E96F9A] sm:mx-[0.18em] sm:my-0 sm:inline">
            {invitationT("and")}
          </span>
          <span className="block whitespace-nowrap sm:inline">
            {people[1].shortName}
          </span>
        </h2>
        <p className="relative z-40 mt-3 rounded-full border border-white/70 bg-[#FFF9EE]/82 px-4 py-2 text-[clamp(0.75rem,1.5vw,1rem)] font-semibold text-[#17334A]/76 backdrop-blur-sm sm:mt-4">
          {date} / {content.couple.time}
        </p>
      </div>

      <HeroCharacter
        className="bottom-[1%] left-[1%] h-[57%] w-[26%] sm:h-[64%] sm:w-[24%] lg:left-[3%] lg:h-[68%] lg:w-[23%]"
        sizes="(max-width: 767px) 26vw, 23vw"
        src={assets.jaian}
      />
      <HeroCharacter
        className="bottom-[1%] right-[1%] h-[54%] w-[23%] sm:h-[61%] sm:w-[21%] lg:right-[3%] lg:h-[65%] lg:w-[20%]"
        sizes="(max-width: 767px) 23vw, 20vw"
        src={assets.suneo}
      />
      <HeroCharacter
        className="bottom-[1%] left-[22%] z-10 h-[64%] w-[25%] sm:left-[27%] sm:h-[72%] sm:w-[21%] lg:left-[29%]"
        sizes="(max-width: 767px) 25vw, 21vw"
        src={assets.nobita}
      />
      <HeroCharacter
        className="bottom-[1%] right-[20%] z-[9] h-[70%] w-[29%] sm:right-[25%] sm:h-[78%] sm:w-[25%] lg:right-[27%]"
        preload
        sizes="(max-width: 767px) 29vw, 25vw"
        src={assets.shizuka}
      />
      <HeroCharacter
        className="bottom-0 left-1/2 z-20 h-[34%] w-[31%] -translate-x-1/2 sm:h-[39%] sm:w-[26%] lg:w-[22%]"
        sizes="(max-width: 767px) 31vw, 22vw"
        src={assets.doraemon}
      />
    </section>
  );
});

export function DoraemonDoorInvitationBody({
  className,
  content,
}: InvitationProps) {
  const locale = useLocale();
  const t = useTranslations("invitationTemplate");
  const doorT = useTranslations("doraemonDoor");
  const { couple, families, gallery, schedule, venue, wishes } = content;
  const people = orderedCouple(content);
  const familyPanels = orderByBrideFirst<FamilyPanelData>(
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
  const calendar = buildCalendar(couple.date);
  const weekdays = localizedWeekdays(locale);
  const mapQuery = venue.mapAddress
    || venue.address.replace(/\n+/g, ", ").trim();
  const dressColors = (content.dressCodeColors ?? "")
    .split(",")
    .map((color) => color.trim())
    .filter((color) => /^#[0-9a-fA-F]{6}$/.test(color));
  const effectiveDressColors = (
    dressColors.length
      ? dressColors
      : [PORTAL_BLUE, DOOR_PINK, WARM_WHITE, "#F4C84A"]
  ).map((color) => ({
    border: color.toLowerCase() === "#fff9ee" ? INK : undefined,
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
      data-door-invitation-body="true"
      className={cn(
        "relative w-full overflow-x-clip bg-[#F5FCFF] font-art-helvetica text-[#17334A]",
        className,
      )}
    >
      <section
        aria-labelledby="door-invitation-heading"
        className="relative mx-auto grid w-full max-w-7xl grid-cols-1 gap-12 px-4 py-24 sm:px-7 sm:py-32 lg:grid-cols-12 lg:items-center"
      >
        <div
          data-testid="doraemon-door-invitation-copy"
          className="text-center lg:col-span-7"
        >
          <SectionTitle id="door-invitation-heading">
            {doorT("invitationTitle")}
          </SectionTitle>
          <p className="mx-auto mt-8 max-w-[52ch] whitespace-pre-line text-base leading-8 text-[#17334A]/72">
            {invitationOpeningMessage(content)}
          </p>
          <p
            data-testid="doraemon-door-invitation-couple-names"
            className="mt-8 font-art-marvin text-3xl leading-[0.95] text-[#E96F9A] sm:text-4xl"
          >
            <span className="block whitespace-nowrap sm:inline">
              {people[0].shortName}
            </span>
            <span className="my-2 block font-art-helvetica text-sm font-semibold text-[#17334A]/58 sm:mx-2 sm:my-0 sm:inline">
              {t("and")}
            </span>
            <span className="block whitespace-nowrap sm:inline">
              {people[1].shortName}
            </span>
          </p>
        </div>
        <div className="relative lg:col-span-4 lg:col-start-9">
          <div className="aspect-square rounded-full border-[0.65rem] border-[#E96F9A] bg-[#FFF9EE] p-7 text-center shadow-[0_2rem_5rem_rgba(57,188,235,0.18)] sm:p-10">
            <p className="font-art-helvetica text-xs font-semibold uppercase tracking-[0.18em] text-[#B94170]">
              {t("saveTheDate")}
            </p>
            <p className="mt-5 font-art-marvin text-[clamp(3rem,8vw,5.8rem)] leading-none text-[#17334A]">
              {couple.date.split("-")[2]}
            </p>
            <p className="mt-2 text-sm font-semibold text-[#17334A]/68">
              {formatDoraemonDoorLocalizedDate(couple.date, locale)}
            </p>
            <p className="mt-2 font-art-marvin text-2xl text-[#E96F9A]">
              {couple.time}
            </p>
          </div>
        </div>
      </section>

      <section
        aria-labelledby="door-family-heading"
        className="relative mx-auto w-full max-w-7xl px-4 py-24 sm:px-7 sm:py-32"
      >
        <SectionTitle id="door-family-heading">
          {doorT("familyTitle")}
        </SectionTitle>
        <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-12">
          {familyPanels.map((panel, index) => (
            <div
              key={panel.side}
              className={cn(
                "min-w-0",
                index === 0
                  ? "md:col-span-7"
                  : "md:col-span-6 md:col-start-7 md:-mt-10",
              )}
            >
              <FamilyPanel
                addressCopiedLabel={t("addressCopied")}
                copyAddressLabel={t("copyAddress")}
                panel={panel}
              />
            </div>
          ))}
        </div>
      </section>

      <section
        aria-labelledby="door-destination-heading"
        className="relative mx-auto w-full max-w-7xl px-4 py-24 sm:px-7 sm:py-32"
      >
        <div className="relative overflow-hidden rounded-[2.5rem] border border-[#17334A]/12 bg-[#DDF6FF] p-6 shadow-[0_2rem_6rem_rgba(57,188,235,0.13)] sm:p-10 md:p-14">
          <div className="absolute -right-24 -top-24 size-80 rounded-full border-[2rem] border-[#E96F9A]/16" />
          <SectionTitle
            id="door-destination-heading"
            className="relative max-w-[13ch]"
          >
            {doorT("destinationTitle")}
          </SectionTitle>
          <div className="relative mt-12 grid grid-cols-1 gap-5 md:grid-cols-12">
            {ceremonies.map((ceremony, index) => (
              <article
                key={`${ceremony.title}-${ceremony.date}-${ceremony.time}`}
                className={cn(
                  "rounded-[1.5rem] border border-[#17334A]/12 bg-[#FFF9EE] p-7 text-center",
                  index % 2 === 0
                    ? "md:col-span-7"
                    : "md:col-span-5",
                )}
              >
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#B94170]">
                  {t("ceremony")}
                </p>
                <h3 className="mt-5 whitespace-pre-line font-art-marvin text-3xl leading-[0.98] text-[#17334A]">
                  {ceremony.title}
                </h3>
                <p className="mt-7 text-sm font-semibold text-[#17334A]/72">
                  {formatDoraemonDoorLocalizedDate(ceremony.date, locale)}
                </p>
                <p className="mt-2 font-art-marvin text-2xl text-[#E96F9A]">
                  {ceremony.time}
                </p>
              </article>
            ))}
            <article className="rounded-[1.5rem] border border-[#17334A]/12 bg-[#FFF9EE] p-7 text-center md:col-span-12 md:grid md:grid-cols-[0.65fr_1.35fr] md:items-center md:gap-10">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#B94170]">
                  {t("reception")}
                </p>
                <p className="mt-4 font-art-marvin text-4xl text-[#E96F9A]">
                  {venue.banquetTime || couple.time}
                </p>
              </div>
              <p className="mt-5 whitespace-pre-line text-lg font-semibold leading-8 text-[#17334A] md:mt-0">
                {venue.address}
              </p>
            </article>
          </div>
        </div>
      </section>

      <section
        aria-labelledby="door-countdown-heading"
        className="relative mx-auto grid w-full max-w-6xl grid-cols-1 gap-8 px-4 py-24 sm:px-7 sm:py-32 md:grid-cols-[0.8fr_1.2fr] md:items-center"
      >
        <div className="text-center">
          <SectionTitle id="door-countdown-heading">
            {t("remaining")}
          </SectionTitle>
          <SharedCountdown
            className="mt-7 text-lg font-semibold leading-9 text-[#B94170]"
            labels={{
              days: t("days"),
              hours: t("hours"),
              minutes: t("minutes"),
              seconds: t("seconds"),
            }}
            target={`${couple.date}T${couple.time}`}
          />
          <a
            className="mt-8 inline-flex min-h-12 items-center justify-center gap-2 whitespace-nowrap rounded-full bg-[#E96F9A] px-6 py-3 text-sm font-semibold text-[#FFF9EE] shadow-[0_1rem_2.5rem_rgba(185,65,112,0.2)] transition-transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#17334A] active:translate-y-px"
            href={googleCalendarUrl(content)}
            rel="noreferrer"
            target="_blank"
          >
            <CalendarPlus aria-hidden size={17} strokeWidth={1.7} />
            {t("addToCalendar")}
          </a>
        </div>
        {calendar ? (
          <article className="rounded-[2rem] border border-[#17334A]/12 bg-[#FFF9EE] p-6 shadow-[0_2rem_6rem_rgba(57,188,235,0.13)] sm:p-10">
            <h3 className="text-center font-art-marvin text-3xl text-[#17334A] sm:text-4xl">
              {t("calendar", { month: calendar.month })}
            </h3>
            <div className="mt-7 grid grid-cols-7 gap-1 text-center sm:gap-2">
              {weekdays.map((label, index) => (
                <span
                  key={`${label}-${index}`}
                  className="py-2 text-[10px] font-semibold text-[#17334A]/48 sm:text-xs"
                >
                  {label}
                </span>
              ))}
              {calendar.cells.map((day, index) => (
                <span
                  key={`${day ?? "empty"}-${index}`}
                  aria-current={day === calendar.highlight ? "date" : undefined}
                  className={cn(
                    "flex aspect-square items-center justify-center rounded-full text-xs tabular-nums sm:text-sm",
                    day === calendar.highlight
                      ? "bg-[#E96F9A] font-semibold text-[#FFF9EE]"
                      : "text-[#17334A]",
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
          aria-labelledby="door-album-heading"
          className="relative mx-auto w-full max-w-7xl px-4 py-24 sm:px-7 sm:py-32"
        >
          <div className="rounded-[2.5rem] border border-[#17334A]/12 bg-[#FFF9EE] px-5 py-12 shadow-[0_2rem_6rem_rgba(57,188,235,0.12)] sm:px-10 sm:py-16">
            <SectionTitle id="door-album-heading" className="text-center">
              {t("album")}
            </SectionTitle>
            <div className="mt-12 flex justify-center">
              <AlbumGallery
                accent={DOOR_PINK}
                layout={content.albumLayout ?? "mosaic"}
                photos={gallery}
                radiusClass="rounded-[1.25rem]"
              />
            </div>
          </div>
        </section>
      ) : null}

      {schedule.length ? (
        <section
          aria-labelledby="door-timeline-heading"
          className="relative mx-auto w-full max-w-7xl px-4 py-24 sm:px-7 sm:py-32"
        >
          <SectionTitle id="door-timeline-heading">
            {doorT("journeyTitle")}
          </SectionTitle>
          <ol
            data-testid="doraemon-door-schedule-list"
            className="mx-auto mt-12 grid w-full max-w-3xl grid-cols-1 gap-4"
          >
            {schedule.map((item) => (
              <li
                key={`${item.time}-${item.label}`}
                className="w-full min-w-0 overflow-hidden rounded-[1.5rem] border border-[#17334A]/12 bg-[#DDF6FF] px-7 py-8 text-center"
              >
                <time className="font-art-marvin text-4xl text-[#E96F9A]">
                  {item.time}
                </time>
                <p className="mt-5 leading-7 text-[#17334A]/72">
                  {item.label}
                </p>
              </li>
            ))}
          </ol>
        </section>
      ) : null}

      <section
        aria-labelledby="door-map-heading"
        className="relative mx-auto w-full max-w-7xl px-4 py-24 sm:px-7 sm:py-32"
      >
        <div className="grid overflow-hidden rounded-[2.5rem] border border-[#17334A]/12 bg-[#FFF9EE] shadow-[0_2rem_6rem_rgba(57,188,235,0.14)] md:grid-cols-[0.72fr_1.28fr]">
          <div className="flex flex-col items-center justify-center px-7 py-12 text-center sm:px-11 sm:py-16">
            <SectionTitle id="door-map-heading">
              {doorT("mapTitle")}
            </SectionTitle>
            <p className="mx-auto mt-7 max-w-[48ch] whitespace-pre-line text-sm leading-7 text-[#17334A]/68">
              {venue.address}
            </p>
            <MapDirectionsButton
              className="self-center rounded-full border-[#E96F9A] bg-[#E96F9A] px-6 py-3 text-[#FFF9EE] hover:opacity-90 active:translate-y-px"
              label={t("location")}
              query={mapQuery}
            />
          </div>
          <InvitationMap
            allowFullScreen
            className="h-[25rem] w-full border-0 md:h-[34rem]"
            loading="lazy"
            query={mapQuery}
            referrerPolicy="no-referrer-when-downgrade"
            title={`${t("map")}: ${venue.address}`}
          />
        </div>
      </section>

      <section
        aria-labelledby="door-dress-code-heading"
        className="relative mx-auto w-full max-w-5xl px-4 py-24 sm:px-7 sm:py-32"
      >
        <div className="rounded-[2.5rem] border border-[#17334A]/12 bg-[#DDF6FF] px-6 py-12 sm:px-10 sm:py-16">
          <DressCode
            colors={effectiveDressColors}
            heading={(
              <SectionTitle
                id="door-dress-code-heading"
                className="text-center"
              >
                {t("dressCode")}
              </SectionTitle>
            )}
            headingColor={INK}
            subColor={INK}
            subLabel={doorT("dressCodeHint")}
          />
        </div>
      </section>

      <section
        aria-labelledby="door-guestbook-heading"
        className="relative mx-auto w-full max-w-6xl px-4 py-24 sm:px-7 sm:py-32"
      >
        <div className="rounded-[2.5rem] border border-[#17334A]/12 bg-[#FFF9EE] p-6 text-center shadow-[0_2rem_6rem_rgba(57,188,235,0.12)] sm:p-10">
          <SectionTitle id="door-guestbook-heading">
            {t("guestbook")}
          </SectionTitle>
          <p className="mx-auto mt-5 max-w-[48ch] text-sm leading-7 text-[#17334A]/66">
            {doorT("guestbookHint")}
          </p>
          <SharedWishForm
            accent={DOOR_PINK}
            centered
            labels={{
              namePlaceholder: t("wishName"),
              pending: t("wishPending"),
              submit: t("wishSubmit"),
              success: t("wishSuccess"),
              textPlaceholder: t("wishText"),
            }}
          />
          {wishes.length ? (
            <div
              aria-label={t("guestbook")}
              data-testid="doraemon-door-wish-list"
              className="mx-auto mt-11 grid w-full max-w-3xl grid-cols-1 gap-4"
              role="list"
            >
              {wishes.map((wish) => (
                <blockquote
                  key={`${wish.name}-${wish.time}`}
                  className="w-full min-w-0 overflow-hidden rounded-[1.5rem] border border-[#17334A]/12 bg-[#DDF6FF] p-6 text-center"
                  role="listitem"
                >
                  <p className="mx-auto max-w-[58ch] whitespace-pre-wrap break-words [overflow-wrap:anywhere] leading-7 text-[#17334A]/74">
                    {wish.text}
                  </p>
                  <footer className="mt-6 text-xs leading-5 text-[#17334A]/52">
                    <span className="font-semibold text-[#B94170]">
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
          aria-labelledby="door-gift-heading"
          className="relative mx-auto w-full max-w-5xl px-4 py-24 sm:px-7 sm:py-32"
        >
          <div className="rounded-[2.5rem] border border-[#17334A]/12 bg-[#DDF6FF] px-5 py-12 sm:px-10 sm:py-16">
            <h2 id="door-gift-heading" className="sr-only">
              {t("gift")}
            </h2>
            <GiftQrGrid
              accent={INK}
              banks={banks}
              heading={t("gift")}
              headingClassName="font-art-marvin text-4xl font-normal normal-case tracking-[-0.02em] text-[#17334A] sm:text-5xl"
              radiusClass="rounded-[1.25rem]"
              saveQrLabel={t("saveQr")}
            />
          </div>
        </section>
      ) : null}

      <footer
        data-template-footer="true"
        className="relative overflow-hidden px-4 pb-24 pt-20 text-center sm:px-7 sm:pb-32 sm:pt-24"
      >
        <div className="mx-auto max-w-5xl rounded-t-[10rem] border-[0.8rem] border-b-0 border-[#E96F9A] bg-[#FFF9EE] px-6 pb-16 pt-20 sm:px-10">
          <p className="mx-auto max-w-[48ch] text-sm leading-7 text-[#17334A]/66">
            {t("presenceHonor")}
          </p>
          <p
            data-testid="doraemon-door-footer-couple-names"
            className="mt-8 font-art-marvin text-[clamp(2.15rem,10vw,3rem)] leading-[0.9] text-[#17334A] sm:text-[clamp(3rem,8vw,6rem)]"
          >
            <span className="block whitespace-nowrap sm:inline">
              {people[0].shortName}
            </span>
            <span className="my-1 block text-[0.4em] text-[#E96F9A] sm:mx-2 sm:my-0 sm:inline">
              {t("and")}
            </span>
            <span className="block whitespace-nowrap sm:inline">
              {people[1].shortName}
            </span>
          </p>
          <p className="mt-7 text-sm font-semibold text-[#B94170]">
            {doorT("finale")}
          </p>
        </div>
      </footer>
    </div>
  );
}

export function DoraemonDoorInvitation({
  className,
  content,
}: InvitationProps) {
  return (
    <main
      data-template-slug="doraemon-door"
      className={cn(
        "min-h-[100dvh] w-full overflow-x-clip bg-[#DDF6FF]",
        className,
      )}
    >
      <DoraemonDoorHandoffHero content={content} />
      <DoraemonDoorInvitationBody content={content} />
    </main>
  );
}

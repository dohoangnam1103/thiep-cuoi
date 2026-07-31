"use client";

import { Check, Copy } from "lucide-react";
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
import { nguyetAnhSleevePilot } from "@/data/nguyet-anh-sleeve-pilot";
import {
  invitationCeremonies,
  invitationOpeningMessage,
  orderByBrideFirst,
  orderedCouple,
  orderedHeroPhotos,
} from "@/lib/invitation-display";
import { cn } from "@/lib/utils";

const MOON_CYAN = "#78C7D7";
const SILVER = "#D7E4EA";

type HandoffHeroProps = Omit<
  ComponentPropsWithoutRef<"article">,
  "children" | "content" | "style"
> & {
  content: ChungDoiDemoContent;
};

type InvitationProps = {
  className?: string;
  content: ChungDoiDemoContent;
};

type FamilyProof = {
  address: string;
  father: string;
  mother: string;
  side: string;
  title: string;
};

type SectionTitleProps = {
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

export function formatSleeveLocalizedDate(
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

function SectionTitle({ children, className, id }: SectionTitleProps) {
  return (
    <h2
      id={id}
      className={cn(
        "scroll-mt-20 text-balance font-art-helvetica text-4xl font-light leading-[0.98] tracking-[-0.045em] text-[#D7E4EA] sm:text-5xl md:text-6xl",
        className,
      )}
    >
      {children}
    </h2>
  );
}

function FilmEdge({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "pointer-events-none absolute inset-y-0 left-0 w-3 bg-[repeating-linear-gradient(to_bottom,#071015_0_8px,transparent_8px_15px)] opacity-80 after:absolute after:inset-y-0 after:left-[calc(100%-1px)] after:w-px after:bg-[#78C7D7]/30",
        className,
      )}
    />
  );
}

function FamilyProofCard({
  addressCopiedLabel,
  copyAddressLabel,
  proof,
}: {
  addressCopiedLabel: string;
  copyAddressLabel: string;
  proof: FamilyProof;
}) {
  const [copied, setCopied] = useState(false);

  const copyAddress = async () => {
    if (!proof.address || !navigator.clipboard) return;

    try {
      await navigator.clipboard.writeText(proof.address);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  };

  return (
    <article className="relative min-w-0 border border-[#D7E4EA]/18 bg-[#14232D]/74 px-7 py-9 text-center shadow-[0_1.5rem_4rem_rgba(0,0,0,0.2)] sm:px-10 sm:py-12">
      <FilmEdge />
      <h3 className="font-art-helvetica text-3xl font-light tracking-[-0.035em] text-[#78C7D7]">
        {proof.side}
      </h3>
      <p className="mt-7 text-sm font-semibold text-[#D7E4EA]/62">
        {proof.title}
      </p>
      <p className="mt-4 break-words text-lg font-semibold leading-8 text-[#D7E4EA]">
        {proof.father}
      </p>
      <p className="break-words text-lg font-semibold leading-8 text-[#D7E4EA]">
        {proof.mother}
      </p>
      {proof.address ? (
        <>
          <p className="mx-auto mt-7 max-w-[32ch] whitespace-pre-line text-sm leading-7 text-[#D7E4EA]/68">
            {proof.address}
          </p>
          <button
            type="button"
            data-copy-address
            onClick={copyAddress}
            className="mx-auto mt-6 inline-flex min-h-11 items-center gap-2 border border-[#78C7D7]/52 bg-transparent px-4 text-xs font-semibold text-[#D7E4EA] transition-colors hover:bg-[#78C7D7]/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#78C7D7] active:translate-y-px"
          >
            {copied ? (
              <Check aria-hidden size={14} strokeWidth={1.6} />
            ) : (
              <Copy aria-hidden size={14} strokeWidth={1.6} />
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

function EventFrame({
  date,
  label,
  message,
  time,
}: {
  date: string;
  label: string;
  message: string;
  time: string;
}) {
  return (
    <article className="relative min-w-0 border border-[#D7E4EA]/18 bg-[#0F1A21] px-7 py-10 sm:px-9 sm:py-12">
      <FilmEdge />
      <p className="text-xs font-semibold text-[#78C7D7]">{label}</p>
      <h3 className="mt-7 whitespace-pre-line font-art-helvetica text-3xl font-light leading-tight tracking-[-0.035em] text-[#D7E4EA] sm:text-4xl">
        {message}
      </h3>
      <p className="mt-8 text-sm font-semibold leading-6 text-[#D7E4EA]/82">
        {date}
      </p>
      <p className="mt-2 text-sm text-[#D7E4EA]/58">{time}</p>
    </article>
  );
}

export const NguyetAnhSleeveHandoffHero = forwardRef<
  HTMLElement,
  HandoffHeroProps
>(function NguyetAnhSleeveHandoffHero(
  { className, content, tabIndex, ...articleProps },
  ref,
) {
  const locale = useLocale();
  const t = useTranslations("invitationTemplate");
  const people = orderedCouple(content);
  const date = formatSleeveLocalizedDate(content.couple.date, locale);
  const dateAndTime = [date, content.couple.time].filter(Boolean).join(" / ");

  return (
    <article
      {...articleProps}
      ref={ref}
      data-sleeve-film-card="true"
      data-testid="nguyet-anh-sleeve-dom-hero"
      tabIndex={tabIndex ?? -1}
      className={cn(
        "relative flex aspect-[13/19] w-[min(88vw,28rem)] shrink-0 flex-col items-center justify-center overflow-hidden border border-[#D7E4EA]/48 bg-[#071015] px-[clamp(1.4rem,7cqw,2.8rem)] py-10 text-center text-[#D7E4EA] shadow-[0_2rem_5.5rem_rgba(0,0,0,0.36)] outline-none [container-type:inline-size] focus-visible:ring-2 focus-visible:ring-[#78C7D7] focus-visible:ring-offset-4 focus-visible:ring-offset-[#0B1116]",
        className,
      )}
    >
      <Image
        alt=""
        aria-hidden="true"
        className="object-cover"
        fill
        priority
        sizes="(max-width: 767px) 88vw, 28rem"
        src={nguyetAnhSleevePilot.assets.photogram}
      />
      <div
        aria-hidden="true"
        className="absolute inset-[2.5%] border border-[#78C7D7]/48"
      />
      <div
        aria-hidden="true"
        className="absolute inset-x-[9%] bottom-[18%] top-[29%] bg-[linear-gradient(to_bottom,rgba(7,16,21,0.12),rgba(7,16,21,0.88)_28%,rgba(7,16,21,0.84)_75%,rgba(7,16,21,0.12))]"
      />
      <p className="relative text-[clamp(0.62rem,2.4cqw,0.75rem)] font-semibold uppercase tracking-[0.2em] text-[#78C7D7]">
        {t("invitation")}
      </p>
      <h2 className="relative mt-[clamp(1rem,5cqw,1.65rem)] flex max-w-full flex-col items-center font-art-helvetica text-[clamp(2.1rem,11cqw,3.7rem)] font-light leading-[0.92] tracking-[-0.05em] text-[#D7E4EA]">
        <span className="max-w-full text-balance">{people[0].shortName}</span>
        <span className="my-[clamp(0.3rem,1.5cqw,0.55rem)] text-[clamp(0.75rem,3.2cqw,1rem)] font-normal italic leading-[1.2] tracking-normal text-[#78C7D7]">
          {t("and")}
        </span>
        <span className="max-w-full text-balance">{people[1].shortName}</span>
      </h2>
      <p className="relative mt-[clamp(1rem,5cqw,1.7rem)] text-[clamp(0.68rem,2.6cqw,0.82rem)] font-semibold leading-5 text-[#D7E4EA]">
        {dateAndTime}
      </p>
      <p className="relative mx-auto mt-[clamp(0.9rem,4cqw,1.4rem)] max-w-[31ch] whitespace-pre-line text-[clamp(0.72rem,3cqw,0.92rem)] leading-[1.65] text-[#D7E4EA]/78">
        {invitationOpeningMessage(content)}
      </p>
    </article>
  );
});

export function NguyetAnhSleeveInvitationBody({
  className,
  content,
}: InvitationProps) {
  const locale = useLocale();
  const t = useTranslations("invitationTemplate");
  const {
    bank,
    couple,
    families,
    gallery,
    schedule,
    venue,
    wishes,
  } = content;
  const people = orderedCouple(content);
  const portraits = orderedHeroPhotos(content, { albumFallback: true })
    .map((src, index) => ({ person: people[index], src }))
    .filter((portrait) => portrait.src.trim());
  const familyProofs = orderByBrideFirst<FamilyProof>(
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
      : [MOON_CYAN, SILVER, "#14232D"]
  ).map((color) => ({
    border: color.toLowerCase() === "#d7e4ea" ? MOON_CYAN : undefined,
    color,
  }));
  const banks = orderByBrideFirst(
    {
      bank: bank.brideBankName,
      label: bank.brideAccountName,
      name: bank.brideAccountName,
      num: bank.brideAccountNumber,
    },
    {
      bank: bank.groomBankName,
      label: bank.groomAccountName,
      name: bank.groomAccountName,
      num: bank.groomAccountNumber,
    },
    couple.brideFirst,
  ).filter((entry) => entry.bank && entry.num);

  return (
    <div
      data-sleeve-invitation-body="true"
      className={cn(
        "relative w-full overflow-x-clip bg-[#0B1116] font-sans text-[#D7E4EA]",
        className,
      )}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_8%,rgba(120,199,215,0.12),transparent_28%),radial-gradient(circle_at_84%_42%,rgba(215,228,234,0.06),transparent_24%)]"
      />

      {portraits.length ? (
        <section
          aria-labelledby="sleeve-portraits-heading"
          className="relative mx-auto w-full max-w-7xl px-4 pb-24 pt-20 sm:px-7 sm:pb-32 sm:pt-28"
        >
          <h2 id="sleeve-portraits-heading" className="sr-only">
            {t("weddingPhotoAlt", {
              couple: `${people[0].shortName} ${t("and")} ${people[1].shortName}`,
            })}
          </h2>
          <div className="grid min-w-0 grid-cols-1 gap-7 md:grid-cols-12 md:gap-5">
            {portraits.map((portrait, index) => (
              <figure
                key={`${portrait.person.side}-${portrait.src}`}
                className={cn(
                  "relative min-w-0 border border-[#D7E4EA]/20 bg-[#0F1A21] p-3 pb-7 shadow-[0_2rem_5rem_rgba(0,0,0,0.32)]",
                  index === 0
                    ? "md:col-span-8 md:col-start-1"
                    : "md:col-span-5 md:col-start-8 md:mt-32",
                )}
              >
                <FilmEdge className="left-1 top-3 bottom-7 h-auto" />
                <div className="relative ml-3 aspect-[4/5] overflow-hidden bg-[#14232D]">
                  <Image
                    alt={t("weddingPhotoAlt", {
                      couple: portrait.person.shortName,
                    })}
                    className="object-cover saturate-[0.88]"
                    fill
                    sizes="(max-width: 767px) calc(100vw - 3.5rem), 58vw"
                    src={portrait.src}
                  />
                </div>
                <figcaption className="mt-5 px-3 text-center font-art-helvetica text-2xl font-light tracking-[-0.03em] text-[#D7E4EA] sm:text-3xl">
                  {portrait.person.shortName}
                </figcaption>
              </figure>
            ))}
          </div>
        </section>
      ) : null}

      <section
        aria-labelledby="sleeve-invitation-heading"
        className="relative mx-auto w-full max-w-5xl px-4 py-20 sm:px-7 sm:py-28"
      >
        <div className="mx-auto max-w-3xl text-center">
          <SectionTitle id="sleeve-invitation-heading">
            {t("respectfulInvitation")}
          </SectionTitle>
          <p className="mx-auto mt-8 max-w-[46ch] whitespace-pre-line text-base leading-8 text-[#D7E4EA]/72">
            {invitationOpeningMessage(content)}
          </p>
          <p className="mt-8 font-art-helvetica text-3xl font-light tracking-[-0.04em] text-[#78C7D7] sm:text-4xl">
            {people[0].shortName}
            <span className="mx-2 text-base italic text-[#D7E4EA]/62">
              {t("and")}
            </span>
            {people[1].shortName}
          </p>
          <p className="mt-5 text-sm font-semibold text-[#D7E4EA]/82">
            {formatSleeveLocalizedDate(couple.date, locale)}
          </p>
        </div>
        <div className="mt-14 grid min-w-0 grid-cols-1 gap-5 md:grid-cols-2">
          {familyProofs.map((proof) => (
            <FamilyProofCard
              key={proof.side}
              addressCopiedLabel={t("addressCopied")}
              copyAddressLabel={t("copyAddress")}
              proof={proof}
            />
          ))}
        </div>
      </section>

      <section
        aria-labelledby="sleeve-events-heading"
        className="relative mx-auto w-full max-w-7xl px-4 py-20 sm:px-7 sm:py-28"
      >
        <SectionTitle id="sleeve-events-heading">{t("ceremony")}</SectionTitle>
        <div className="mt-11 grid min-w-0 grid-cols-1 gap-4 md:grid-cols-12">
          {ceremonies.map((ceremony, index) => (
            <div
              key={`${ceremony.title}-${ceremony.date}-${ceremony.time}`}
              className={cn(
                "min-w-0",
                index % 3 === 0
                  ? "md:col-span-7"
                  : index % 3 === 1
                    ? "md:col-span-5"
                    : "md:col-span-6",
              )}
            >
              <EventFrame
                date={formatSleeveLocalizedDate(ceremony.date, locale)}
                label={t("ceremony")}
                message={ceremony.title}
                time={ceremony.time}
              />
            </div>
          ))}
          <div
            className={cn(
              "min-w-0",
              ceremonies.length % 3 === 0
                ? "md:col-span-7"
                : "md:col-span-6",
            )}
          >
            <EventFrame
              date={formatSleeveLocalizedDate(couple.date, locale)}
              label={t("reception")}
              message={venue.address}
              time={venue.banquetTime || couple.time}
            />
          </div>
        </div>
      </section>

      <section
        aria-labelledby="sleeve-countdown-heading"
        className="relative mx-auto grid w-full max-w-6xl min-w-0 grid-cols-1 gap-0 px-4 py-20 sm:px-7 sm:py-28 md:grid-cols-[0.82fr_1.18fr]"
      >
        <div className="flex min-w-0 flex-col justify-center border border-[#D7E4EA]/18 bg-[#14232D] px-6 py-12 text-center sm:px-10 sm:py-16">
          <h2
            id="sleeve-countdown-heading"
            className="font-art-helvetica text-4xl font-light tracking-[-0.04em] text-[#D7E4EA]"
          >
            {t("remaining")}
          </h2>
          <SharedCountdown
            className="mx-auto mt-7 max-w-[22ch] text-base font-semibold leading-8 text-[#78C7D7]"
            labels={{
              days: t("days"),
              hours: t("hours"),
              minutes: t("minutes"),
              seconds: t("seconds"),
            }}
            target={`${couple.date}T${couple.time}`}
          />
          <a
            className="mx-auto mt-9 inline-flex min-h-11 items-center justify-center whitespace-nowrap border border-[#78C7D7] bg-[#78C7D7] px-5 py-3 text-sm font-semibold text-[#071015] transition-transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D7E4EA] active:translate-y-px"
            href={googleCalendarUrl(content)}
            rel="noreferrer"
            target="_blank"
          >
            {t("addToCalendar")}
          </a>
        </div>
        {calendar ? (
          <article className="min-w-0 border border-[#D7E4EA]/18 bg-[#0F1A21] p-6 shadow-[0_2rem_5rem_rgba(0,0,0,0.24)] sm:p-10 md:-my-7 md:p-12">
            <SectionTitle className="text-3xl sm:text-4xl">
              {t("calendar", { month: calendar.month })}
            </SectionTitle>
            <div className="mt-9 grid grid-cols-7 gap-1 text-center sm:gap-2">
              {weekdays.map((label, index) => (
                <span
                  key={`${label}-${index}`}
                  className="py-2 text-[10px] font-semibold text-[#D7E4EA]/52 sm:text-xs"
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
                      ? "bg-[#78C7D7] font-semibold text-[#071015]"
                      : "text-[#D7E4EA]",
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
          aria-labelledby="sleeve-album-heading"
          className="relative mx-auto w-full max-w-7xl px-4 py-20 sm:px-7 sm:py-28"
        >
          <div className="relative overflow-hidden border border-[#D7E4EA]/18 bg-[#0F1A21] px-5 pb-12 pt-16 shadow-[0_2rem_6rem_rgba(0,0,0,0.3)] sm:px-10 sm:pb-16 sm:pt-20">
            <FilmEdge />
            <SectionTitle id="sleeve-album-heading" className="text-center">
              {t("album")}
            </SectionTitle>
            <div className="mt-12 flex justify-center">
              <AlbumGallery
                accent={MOON_CYAN}
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
          aria-labelledby="sleeve-timeline-heading"
          className="relative mx-auto w-full max-w-6xl px-4 py-20 sm:px-7 sm:py-28"
        >
          <SectionTitle id="sleeve-timeline-heading">
            {t("timeline")}
          </SectionTitle>
          <ol className="mt-12 grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2">
            {schedule.map((item) => (
              <li
                key={`${item.time}-${item.label}`}
                className="relative min-w-0 border border-[#D7E4EA]/18 bg-[#14232D]/72 px-7 py-8"
              >
                <time className="font-art-helvetica text-4xl font-light tracking-[-0.04em] text-[#78C7D7]">
                  {item.time}
                </time>
                <p className="mt-5 leading-7 text-[#D7E4EA]/78">
                  {item.label}
                </p>
              </li>
            ))}
          </ol>
        </section>
      ) : null}

      <section
        aria-labelledby="sleeve-map-heading"
        className="relative mx-auto w-full max-w-7xl px-4 py-20 sm:px-7 sm:py-28"
      >
        <div className="relative grid min-w-0 overflow-hidden border border-[#D7E4EA]/18 bg-[#0F1A21] shadow-[0_2rem_6rem_rgba(0,0,0,0.32)] md:grid-cols-[0.72fr_1.28fr]">
          <div className="flex min-w-0 flex-col justify-center px-7 py-11 sm:px-11 sm:py-14">
            <SectionTitle id="sleeve-map-heading">{t("map")}</SectionTitle>
            <p className="mt-8 max-w-[34ch] whitespace-pre-line text-sm leading-7 text-[#D7E4EA]/68">
              {venue.address}
            </p>
            <MapDirectionsButton
              className="self-start rounded-none border-[#78C7D7] bg-[#78C7D7] px-6 py-3 text-[#071015] hover:opacity-90 active:translate-y-px"
              label={t("location")}
              query={mapQuery}
            />
          </div>
          <InvitationMap
            allowFullScreen
            className="h-[25rem] w-full min-w-0 border-0 grayscale-[0.28] contrast-[1.04] md:h-[34rem]"
            loading="lazy"
            query={mapQuery}
            referrerPolicy="no-referrer-when-downgrade"
            title={`${t("map")}: ${venue.address}`}
          />
        </div>
      </section>

      <section
        aria-labelledby="sleeve-dress-code-heading"
        className="relative mx-auto w-full max-w-5xl px-4 py-20 sm:px-7 sm:py-28"
      >
        <div className="border border-[#D7E4EA]/18 bg-[#14232D]/70 bg-[repeating-linear-gradient(90deg,rgba(215,228,234,0.05)_0_1px,transparent_1px_18px)] px-6 py-12 sm:px-10 sm:py-16">
          <DressCode
            colors={effectiveDressColors}
            heading={(
              <SectionTitle
                id="sleeve-dress-code-heading"
                className="text-center"
              >
                {t("dressCode")}
              </SectionTitle>
            )}
            headingColor={SILVER}
            subColor={SILVER}
            subLabel={t("details")}
          />
        </div>
      </section>

      <section
        aria-labelledby="sleeve-guestbook-heading"
        className="relative mx-auto w-full max-w-6xl px-4 py-20 sm:px-7 sm:py-28"
      >
        <div className="border border-[#D7E4EA]/18 bg-[#0F1A21] p-6 shadow-[0_2rem_6rem_rgba(0,0,0,0.28)] sm:p-10">
          <SectionTitle id="sleeve-guestbook-heading">
            {t("guestbook")}
          </SectionTitle>
          <SharedWishForm
            accent={MOON_CYAN}
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
              className="mt-11 flex snap-x snap-mandatory gap-4 overflow-x-auto pb-4"
              role="list"
            >
              {wishes.map((wish) => (
                <blockquote
                  key={`${wish.name}-${wish.time}`}
                  className="min-w-[min(82vw,22rem)] shrink-0 snap-start border border-[#D7E4EA]/18 bg-[#14232D] p-6"
                  role="listitem"
                >
                  <p className="line-clamp-3 leading-7 text-[#D7E4EA]/78">
                    {wish.text}
                  </p>
                  <footer className="mt-6 text-xs leading-5 text-[#D7E4EA]/52">
                    <span className="font-semibold text-[#78C7D7]">
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
          aria-labelledby="sleeve-gift-heading"
          className="relative mx-auto w-full max-w-5xl px-4 py-20 sm:px-7 sm:py-28"
        >
          <div className="relative overflow-hidden border border-[#D7E4EA]/18 bg-[#14232D] px-5 py-12 shadow-[0_2rem_6rem_rgba(0,0,0,0.32)] sm:px-10 sm:py-16">
            <FilmEdge />
            <h2 id="sleeve-gift-heading" className="sr-only">
              {t("gift")}
            </h2>
            <GiftQrGrid
              accent={SILVER}
              banks={banks}
              heading={t("gift")}
              headingClassName="font-art-helvetica text-4xl font-light normal-case tracking-[-0.04em] text-[#D7E4EA] sm:text-5xl"
              radiusClass="rounded-none"
              saveQrLabel={t("saveQr")}
            />
          </div>
        </section>
      ) : null}

      <footer
        data-template-footer="true"
        className="relative mx-auto w-full max-w-6xl border-t border-[#D7E4EA]/18 px-4 pb-24 pt-16 text-center sm:px-7 sm:pb-32 sm:pt-20"
      >
        <p className="mx-auto max-w-[48ch] text-sm leading-7 text-[#D7E4EA]/62">
          {t("presenceHonor")}
        </p>
        <p className="mt-8 flex flex-col items-center font-art-helvetica text-4xl font-light leading-[0.98] tracking-[-0.05em] text-[#78C7D7] sm:flex-row sm:justify-center sm:text-5xl">
          <span>{people[0].shortName}</span>
          <span className="my-1 text-base font-normal italic tracking-normal text-[#D7E4EA]/58 sm:mx-3">
            {t("and")}
          </span>
          <span>{people[1].shortName}</span>
        </p>
      </footer>
    </div>
  );
}

export function NguyetAnhSleeveInvitation({
  className,
  content,
}: InvitationProps) {
  return (
    <main
      data-template-slug="nguyet-anh-sleeve"
      className={cn(
        "min-h-[100dvh] w-full overflow-x-clip bg-[#0B1116]",
        className,
      )}
    >
      <section className="relative grid min-h-[100dvh] place-items-center overflow-hidden bg-[radial-gradient(circle_at_50%_14%,#223743_0%,#14232D_36%,#0B1116_76%)] px-4 py-14 sm:px-7">
        <NguyetAnhSleeveHandoffHero content={content} />
      </section>
      <NguyetAnhSleeveInvitationBody content={content} />
    </main>
  );
}

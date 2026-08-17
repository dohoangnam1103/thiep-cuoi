"use client";

import {
  ArrowLeft,
  ArrowRight,
  CalendarPlus,
  ExternalLink,
} from "lucide-react";
import Image, { getImageProps } from "next/image";
import { useLocale, useTranslations } from "next-intl";
import {
  useCallback,
  useEffect,
  memo,
  useMemo,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
  type TransitionEvent as ReactTransitionEvent,
} from "react";

import {
  buildCalendar,
  directionsUrl,
  GiftQrGrid,
  googleCalendarUrl,
  InvitationMap,
  SharedCountdown,
  SharedWishForm,
} from "@/components/chungdoi-tpl-shared";
import { ConanCasebookFittedName } from "@/components/detective-conan-casebook/conan-casebook-fitted-name";
import type { ChungDoiDemoContent } from "@/data/chungdoi-demo-content";
import {
  invitationCeremonies,
  invitationGiftAccounts,
  invitationOpeningMessage,
  orderByBrideFirst,
  orderedCouple,
} from "@/lib/invitation-display";
import { cn } from "@/lib/utils";

import styles from "./conan-casebook-reader.module.css";

const ASSET_ROOT =
  "/chungdoi/templates/detective-conan-casebook/characters";

type CharacterAsset = {
  desktopHeight: number;
  desktopSrc: string;
  desktopWidth: number;
  mobileHeight: number;
  mobileSrc: string;
  mobileWidth: number;
};

const characterAssets = {
  akaiFuruya: {
    desktopHeight: 1821,
    desktopSrc: `${ASSET_ROOT}/akai-furuya.webp`,
    desktopWidth: 864,
    mobileHeight: 1100,
    mobileSrc: `${ASSET_ROOT}/akai-furuya.mobile.webp`,
    mobileWidth: 522,
  },
  conanKogoro: {
    desktopHeight: 1821,
    desktopSrc: `${ASSET_ROOT}/conan-kogoro.webp`,
    desktopWidth: 864,
    mobileHeight: 1100,
    mobileSrc: `${ASSET_ROOT}/conan-kogoro.mobile.webp`,
    mobileWidth: 522,
  },
  detectiveBoys: {
    desktopHeight: 1024,
    desktopSrc: `${ASSET_ROOT}/detective-boys.webp`,
    desktopWidth: 1536,
    mobileHeight: 600,
    mobileSrc: `${ASSET_ROOT}/detective-boys.mobile.webp`,
    mobileWidth: 900,
  },
  heijiFriends: {
    desktopHeight: 1024,
    desktopSrc: `${ASSET_ROOT}/heiji-friends.webp`,
    desktopWidth: 1536,
    mobileHeight: 600,
    mobileSrc: `${ASSET_ROOT}/heiji-friends.mobile.webp`,
    mobileWidth: 900,
  },
  shinichiRan: {
    desktopHeight: 1821,
    desktopSrc: `${ASSET_ROOT}/shinichi-ran-wedding.webp`,
    desktopWidth: 864,
    mobileHeight: 1100,
    mobileSrc: `${ASSET_ROOT}/shinichi-ran-wedding.mobile.webp`,
    mobileWidth: 522,
  },
} as const satisfies Record<string, CharacterAsset>;

const CHAPTER_IDS = [
  "intro",
  "families",
  "ceremony",
  "schedule",
  "gallery",
  "map",
  "guestbook",
  "gift",
  "finale",
] as const;

type ChapterId = (typeof CHAPTER_IDS)[number];
type ChapterPosition = "previous" | "current" | "next";

type DetectiveConanCasebookReaderProps = {
  active?: boolean;
  className?: string;
  content: ChungDoiDemoContent;
  productionControls?: boolean;
};

type CharacterArtworkProps = {
  alt: string;
  asset: CharacterAsset;
  className?: string;
  preload?: boolean;
  sizes?: string;
};

type ChapterFrameProps = {
  chapterId: ChapterId;
  chapterIndex: number;
  children: ReactNode;
  rightPage: ReactNode;
};

type CalendarData = NonNullable<ReturnType<typeof buildCalendar>>;

type PointerStart = {
  pointerId: number;
  startedAt: number;
  x: number;
  y: number;
};

type PageTurnDirection = "backward" | "forward";
type PageTurnPhase = "preparing" | "running";

type PageTurn = {
  direction: PageTurnDirection;
  from: number;
  phase: PageTurnPhase;
  to: number;
};

function parseIsoDate(iso: string): Date | null {
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

function formatLocalizedDate(iso: string, locale: string): string {
  const date = parseIsoDate(iso);
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

function isInteractiveTarget(target: EventTarget | null): boolean {
  return target instanceof Element
    && Boolean(target.closest(
      "a,button,input,textarea,select,option,iframe,[contenteditable='true'],[role='button'],[data-reader-swipe-ignore]",
    ));
}

function chapterIndexFromUrl(): number {
  const id = new URL(window.location.href).searchParams.get("chapter");
  const index = CHAPTER_IDS.findIndex((chapterId) => chapterId === id);
  return index >= 0 ? index : 0;
}

function readerNameSizeClass(name: string): string {
  const length = [...name.trim()].length;
  if (length > 36) return "text-[clamp(0.7rem,2.1vw,1.45rem)]";
  if (length > 24) return "text-[clamp(1rem,3vw,2.1rem)]";
  if (length > 15) return "text-[clamp(1.35rem,4vw,3rem)]";
  return "text-[clamp(2rem,5vw,4.5rem)]";
}

function CharacterArtwork({
  alt,
  asset,
  className,
  preload = false,
  sizes = "(max-width: 767px) 78vw, 42vw",
}: CharacterArtworkProps) {
  const {
    props: { srcSet: desktopSrcSet },
  } = getImageProps({
    alt,
    height: asset.desktopHeight,
    quality: 82,
    sizes,
    src: asset.desktopSrc,
    width: asset.desktopWidth,
  });
  const {
    props: { srcSet: mobileSrcSet, ...imageProps },
  } = getImageProps({
    alt,
    fetchPriority: preload ? "high" : undefined,
    height: asset.mobileHeight,
    loading: "eager",
    quality: 78,
    sizes,
    src: asset.mobileSrc,
    width: asset.mobileWidth,
  });

  return (
    <div className={cn(styles.characterFrame, className)}>
      <div aria-hidden="true" className={styles.characterBackdrop} />
      <picture>
        <source media="(min-width: 768px)" srcSet={desktopSrcSet} />
        <source media="(max-width: 767px)" srcSet={mobileSrcSet} />
        {/* getImageProps is the documented Next.js art-direction path. */}
        <img {...imageProps} alt={alt} />
      </picture>
    </div>
  );
}

function ChapterHeader({
  eyebrow,
  id,
  title,
}: {
  eyebrow?: string;
  id: string;
  title: string;
}) {
  return (
    <>
      {eyebrow ? <p className={styles.eyebrow}>{eyebrow}</p> : null}
      <h2
        className={styles.heading}
        data-chapter-heading
        id={id}
        tabIndex={-1}
      >
        {title}
      </h2>
    </>
  );
}

function ChapterFrame({
  chapterId,
  chapterIndex,
  children,
  rightPage,
}: ChapterFrameProps) {
  const pageNumber = chapterIndex * 2 + 1;

  return (
    <article
      aria-labelledby={`detective-conan-${chapterId}-heading`}
      className={styles.spread}
      data-chapter-index={chapterIndex}
      data-testid={`detective-conan-casebook-chapter-${chapterId}`}
    >
      <section className={cn(styles.page, styles.leftPage)}>
        <div className={styles.pageContent}>{children}</div>
        <span aria-hidden="true" className={styles.pageNumber}>
          {String(pageNumber).padStart(2, "0")}
        </span>
      </section>
      <section className={cn(styles.page, styles.rightPage)}>
        <div className={styles.pageContent}>{rightPage}</div>
        <span aria-hidden="true" className={styles.pageNumber}>
          {String(pageNumber + 1).padStart(2, "0")}
        </span>
      </section>
    </article>
  );
}

function CaseCalendar({
  calendar,
  label,
  weekdays,
}: {
  calendar: CalendarData;
  label: string;
  weekdays: string[];
}) {
  return (
    <div
      className="mx-auto w-full max-w-md border border-[#102236]/15 bg-white/42 p-3 sm:p-4"
      data-testid="detective-conan-casebook-calendar"
    >
      <h3 className="text-center font-art-built text-xl text-[#102236] sm:text-2xl">
        {label}
      </h3>
      <div className="mt-2 grid grid-cols-7 gap-0.5 text-center sm:mt-4 sm:gap-1">
        {weekdays.map((weekday, index) => (
          <span
            className="py-0.5 text-[0.55rem] font-bold text-[#516170] sm:text-[0.65rem]"
            key={`${weekday}-${index}`}
          >
            {weekday}
          </span>
        ))}
        {calendar.cells.map((day, index) => (
          <span
            aria-current={day === calendar.highlight ? "date" : undefined}
            className={cn(
              "grid aspect-square place-items-center text-[0.58rem] tabular-nums sm:text-xs",
              day === calendar.highlight
                ? "rounded-full bg-[#A51F35] font-bold text-white"
                : "text-[#102236]",
            )}
            key={`${day ?? "empty"}-${index}`}
          >
            {day}
          </span>
        ))}
      </div>
    </div>
  );
}

function WishesList({
  content,
  emptyLabel,
}: {
  content: ChungDoiDemoContent;
  emptyLabel: string;
}) {
  if (!content.wishes.length) {
    return (
      <p className="mx-auto mt-4 max-w-[30ch] text-center text-xs leading-5 text-[#516170]">
        {emptyLabel}
      </p>
    );
  }

  return (
    <div
      className="mt-4 grid max-h-[42vh] w-full gap-2 overflow-y-auto overscroll-contain pr-1"
      data-reader-swipe-ignore
      data-testid="detective-conan-casebook-wishes"
      role="list"
    >
      {content.wishes.slice(0, 3).map((wish) => (
        <blockquote
          className="border-l-2 border-[#A51F35] bg-white/40 px-3 py-2 text-center"
          key={`${wish.name}-${wish.time}`}
          role="listitem"
        >
          <p className="break-words text-[0.68rem] leading-5 text-[#516170] sm:text-xs">
            {wish.text}
          </p>
          <footer className="mt-1 text-[0.62rem] font-bold text-[#A51F35]">
            {wish.name}
          </footer>
        </blockquote>
      ))}
    </div>
  );
}

function CasebookChapterComponent({
  chapterId,
  chapterIndex,
  content,
}: {
  chapterId: ChapterId;
  chapterIndex: number;
  content: ChungDoiDemoContent;
}) {
  const locale = useLocale();
  const t = useTranslations("detectiveConanCasebook");
  const people = orderedCouple(content);
  const ceremonies = invitationCeremonies(content);
  const calendar = buildCalendar(content.couple.date);
  const weekdays = localizedWeekdays(locale);
  const date = formatLocalizedDate(content.couple.date, locale);
  const mapQuery = content.venue.mapAddress
    || content.venue.address.replace(/\n+/g, ", ").trim();
  const dressColors = (content.dressCodeColors ?? "")
    .split(",")
    .map((color) => color.trim())
    .filter((color) => /^#[0-9a-fA-F]{6}$/.test(color))
    .slice(0, 5);
  const effectiveDressColors = dressColors.length
    ? dressColors
    : ["#102236", "#a51f35", "#d9dbe0", "#f3f2ec"];
  const families = orderByBrideFirst(
    {
      address: content.families.brideAddress,
      father: content.families.brideFather,
      mother: content.families.brideMother,
      side: t("brideFamily"),
      title: content.families.brideParentTitle || t("parents"),
    },
    {
      address: content.families.groomAddress,
      father: content.families.groomFather,
      mother: content.families.groomMother,
      side: t("groomFamily"),
      title: content.families.groomParentTitle || t("parents"),
    },
    content.couple.brideFirst,
  );
  const banks = invitationGiftAccounts(content).map((account) => ({
    label: account.name,
    bank: account.bank,
    num: account.num,
    name: account.name,
  }));

  if (chapterId === "intro") {
    return (
      <ChapterFrame
        chapterId={chapterId}
        chapterIndex={chapterIndex}
        rightPage={null}
      >
        <ChapterHeader
          eyebrow={t("introEyebrow")}
          id="detective-conan-intro-heading"
          title={t("introTitle")}
        />
        <div className={styles.rule} />
        <p className={cn(styles.copy, "whitespace-pre-line")}>
          {invitationOpeningMessage(content)}
        </p>
        <p
          className="mt-4 flex w-full flex-col items-center font-art-built leading-[0.84] tracking-[-0.035em] text-[#102236]"
          data-testid="detective-conan-casebook-couple-names"
        >
          <ConanCasebookFittedName
            className={readerNameSizeClass(people[0].shortName)}
            name={people[0].shortName}
          />
          <span className="my-1 block font-sans text-[0.24em] font-bold tracking-[0.14em] text-[#A51F35]">
            {t("and")}
          </span>
          <ConanCasebookFittedName
            className={readerNameSizeClass(people[1].shortName)}
            name={people[1].shortName}
          />
        </p>
        <p className="mt-4 text-xs font-bold text-[#516170] sm:text-sm">
          {t("dateTime", {
            date,
            time: content.couple.time,
          })}
        </p>
        <div
          className={cn(
            styles.mobileCharacter,
            "mt-2 min-h-0 w-full flex-1",
          )}
        >
          <CharacterArtwork
            alt={t("shinichiRanAlt")}
            asset={characterAssets.shinichiRan}
            preload
          />
          <p className="absolute bottom-3 z-10 bg-[#F3F2EC]/88 px-3 py-1 text-[0.62rem] font-bold text-[#A51F35]">
            {t("castShinichiRan")}
          </p>
        </div>
      </ChapterFrame>
    );
  }

  if (chapterId === "families") {
    return (
      <ChapterFrame
        chapterId={chapterId}
        chapterIndex={chapterIndex}
        rightPage={null}
      >
        <ChapterHeader
          id="detective-conan-families-heading"
          title={t("familiesTitle")}
        />
        <div className="mt-4 grid w-full grid-cols-2 gap-2 sm:mt-7 sm:gap-4">
          {families.map((family) => (
            <section
              className="min-w-0 border-t-2 border-[#A51F35] bg-white/40 px-2 py-3 text-center sm:px-4 sm:py-5"
              key={family.side}
            >
              <h3 className="font-art-built text-lg leading-none text-[#A51F35] sm:text-2xl">
                {family.side}
              </h3>
              <p className="mt-2 text-[0.58rem] font-bold text-[#516170] sm:text-xs">
                {family.title}
              </p>
              <p className="mt-2 truncate text-[0.68rem] font-bold text-[#102236] sm:text-sm">
                {family.father}
              </p>
              <p className="truncate text-[0.68rem] font-bold text-[#102236] sm:text-sm">
                {family.mother}
              </p>
              <p className="mt-2 line-clamp-3 whitespace-pre-line text-[0.56rem] leading-4 text-[#516170] sm:text-[0.68rem] sm:leading-5">
                {family.address}
              </p>
            </section>
          ))}
        </div>
        <div className={cn(styles.mobileCharacter, "mt-2 h-[22%] w-full")}>
          <CharacterArtwork
            alt={t("conanKogoroAlt")}
            asset={characterAssets.conanKogoro}
            sizes="42vw"
          />
          <p className="absolute bottom-3 z-10 bg-[#F3F2EC]/88 px-3 py-1 text-[0.62rem] font-bold text-[#A51F35]">
            {t("castConanKogoro")}
          </p>
        </div>
      </ChapterFrame>
    );
  }

  if (chapterId === "ceremony") {
    return (
      <ChapterFrame
        chapterId={chapterId}
        chapterIndex={chapterIndex}
        rightPage={null}
      >
        <ChapterHeader
          id="detective-conan-ceremony-heading"
          title={t("ceremonyTitle")}
        />
        <div
          className="mt-3 grid min-h-0 w-full min-w-0 flex-1 gap-2 overflow-y-auto overscroll-contain pr-1 sm:mt-6 sm:gap-3"
          data-reader-swipe-ignore
        >
          {ceremonies.map((ceremony) => (
            <section
              className="grid min-w-0 grid-cols-[4.5rem_1fr] items-center border border-[#102236]/15 bg-white/42 px-2 py-2 text-center sm:grid-cols-[6rem_1fr] sm:px-4 sm:py-3"
              key={`${ceremony.title}-${ceremony.date}-${ceremony.time}`}
            >
              <div className="border-r border-[#102236]/14 pr-2">
                <p className="font-art-built text-xl leading-none text-[#A51F35] sm:text-3xl">
                  {ceremony.time}
                </p>
                <p className="mt-1 text-[0.52rem] font-bold text-[#516170] sm:text-[0.65rem]">
                  {formatLocalizedDate(ceremony.date, locale)}
                </p>
              </div>
              <p className="break-words whitespace-pre-line px-2 text-[0.62rem] font-bold leading-4 text-[#102236] sm:px-4 sm:text-xs sm:leading-5">
                {ceremony.title}
              </p>
            </section>
          ))}
          <section className="border border-[#A51F35]/25 bg-[#A51F35]/8 px-3 py-2 text-center sm:px-5 sm:py-3">
            <p className="text-[0.56rem] font-bold uppercase tracking-[0.12em] text-[#A51F35] sm:text-[0.68rem]">
              {t("receptionLabel")}
            </p>
            <p className="mt-1 text-xs font-bold text-[#102236] sm:text-sm">
              {content.venue.banquetTime || content.couple.time}
            </p>
            <p className="mt-1 break-words whitespace-pre-line text-[0.58rem] leading-4 text-[#516170] sm:text-[0.7rem]">
              {content.venue.address}
            </p>
          </section>
        </div>
        <div className={cn(styles.mobileCharacter, "mt-2 h-[22%] w-full")}>
          <CharacterArtwork
            alt={t("detectiveBoysAlt")}
            asset={characterAssets.detectiveBoys}
            sizes="(max-width: 767px) 76vw, 46vw"
          />
          <p className="absolute bottom-3 z-10 bg-[#F3F2EC]/88 px-3 py-1 text-[0.62rem] font-bold text-[#A51F35]">
            {t("castDetectiveBoys")}
          </p>
        </div>
      </ChapterFrame>
    );
  }

  if (chapterId === "schedule") {
    return (
      <ChapterFrame
        chapterId={chapterId}
        chapterIndex={chapterIndex}
        rightPage={calendar ? (
          <>
            <div className="mt-5 w-full">
              <CaseCalendar
                calendar={calendar}
                label={t("calendarTitle", {
                  month: calendar.month,
                  year: calendar.year,
                })}
                weekdays={weekdays}
              />
            </div>
            <a
              className="mt-6 inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-[#A51F35] px-5 py-2 text-xs font-bold text-white transition-transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#102236] active:translate-y-px"
              href={googleCalendarUrl(content)}
              rel="noreferrer"
              target="_blank"
            >
              <CalendarPlus aria-hidden size={16} strokeWidth={1.8} />
              {t("addToCalendar")}
            </a>
          </>
        ) : (
          <p className={styles.copy}>{t("calendarUnavailable")}</p>
        )}
      >
        <ChapterHeader
          id="detective-conan-schedule-heading"
          title={t("scheduleTitle")}
        />
        <SharedCountdown
          className="mt-2 text-center text-[0.68rem] font-bold leading-5 text-[#A51F35] sm:mt-4 sm:text-sm"
          labels={{
            days: t("days"),
            hours: t("hours"),
            minutes: t("minutes"),
            seconds: t("seconds"),
          }}
          target={`${content.couple.date}T${content.couple.time}`}
        />
        <ol
          className="mt-2 grid min-h-0 w-full flex-1 gap-1.5 overflow-y-auto overscroll-contain pr-1 sm:mt-4 sm:gap-2"
          data-reader-swipe-ignore
          data-testid="detective-conan-casebook-schedule"
        >
          {content.schedule.map((item) => (
            <li
              className="grid min-w-0 grid-cols-[3.5rem_1fr] items-center border-l-2 border-[#A51F35] bg-white/38 px-2 py-1.5 text-center sm:grid-cols-[4.5rem_1fr] sm:px-3 sm:py-2"
              key={`${item.time}-${item.label}`}
            >
              <time className="font-art-built text-lg text-[#A51F35] sm:text-2xl">
                {item.time}
              </time>
              <p className="break-words text-[0.62rem] font-bold leading-4 text-[#102236] sm:text-xs sm:leading-5">
                {item.label}
              </p>
            </li>
          ))}
        </ol>
        {calendar ? (
          <div className="mt-2 w-full md:hidden">
            <CaseCalendar
              calendar={calendar}
              label={t("calendarTitle", {
                month: calendar.month,
                year: calendar.year,
              })}
              weekdays={weekdays}
            />
          </div>
        ) : null}
      </ChapterFrame>
    );
  }

  if (chapterId === "gallery") {
    const photos = content.gallery.filter((photo) => photo.trim());
    const shownPhotos = photos.slice(0, 4);

    return (
      <ChapterFrame
        chapterId={chapterId}
        chapterIndex={chapterIndex}
        rightPage={null}
      >
        <ChapterHeader
          id="detective-conan-gallery-heading"
          title={t("galleryTitle")}
        />
        {shownPhotos.length ? (
          <>
            <div
              className="mt-3 grid min-h-0 w-full flex-1 grid-cols-2 gap-1.5 sm:mt-6 sm:gap-2"
              data-reader-swipe-ignore
              data-testid="detective-conan-casebook-gallery"
            >
              {shownPhotos.map((photo, index) => (
                <figure
                  className="relative min-h-0 overflow-hidden border border-[#102236]/14 bg-[#E4E4DC]"
                  key={photo}
                >
                  <Image
                    alt={t("galleryAlt", { index: index + 1 })}
                    className="object-cover"
                    fill
                    loading="eager"
                    sizes="(max-width: 767px) 42vw, 21vw"
                    src={photo}
                  />
                </figure>
              ))}
            </div>
            {photos.length > shownPhotos.length ? (
              <p className="mt-2 text-[0.62rem] font-bold text-[#A51F35]">
                {t("morePhotos", {
                  count: photos.length - shownPhotos.length,
                })}
              </p>
            ) : null}
          </>
        ) : (
          <p className={styles.copy}>{t("galleryEmpty")}</p>
        )}
        <div className={cn(styles.mobileCharacter, "mt-1 h-[20%] w-full")}>
          <CharacterArtwork
            alt={t("heijiFriendsAlt")}
            asset={characterAssets.heijiFriends}
            sizes="(max-width: 767px) 74vw, 46vw"
          />
          <p className="absolute bottom-3 z-10 bg-[#F3F2EC]/88 px-3 py-1 text-[0.62rem] font-bold text-[#A51F35]">
            {t("castHeijiFriends")}
          </p>
        </div>
      </ChapterFrame>
    );
  }

  if (chapterId === "map") {
    return (
      <ChapterFrame
        chapterId={chapterId}
        chapterIndex={chapterIndex}
        rightPage={null}
      >
        <ChapterHeader
          eyebrow={t("mapEyebrow")}
          id="detective-conan-map-heading"
          title={t("mapTitle")}
        />
        <p className="mt-2 line-clamp-2 whitespace-pre-line text-[0.62rem] font-bold leading-4 text-[#516170] sm:mt-4 sm:text-xs sm:leading-5">
          {content.venue.address}
        </p>
        <div
          className="mt-2 h-[clamp(8rem,28vh,15rem)] w-full overflow-hidden border border-[#102236]/16 bg-[#E4E4DC] sm:mt-4"
          data-reader-swipe-ignore
        >
          <InvitationMap
            allowFullScreen
            className="h-full w-full border-0 grayscale-[0.45] contrast-[1.08]"
            loading="lazy"
            query={mapQuery}
            referrerPolicy="no-referrer-when-downgrade"
            title={t("mapFrameTitle")}
          />
        </div>
        <a
          className="mt-2 inline-flex min-h-10 items-center justify-center gap-2 rounded-full bg-[#A51F35] px-4 py-2 text-[0.66rem] font-bold text-white transition-transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#102236] active:translate-y-px sm:mt-4 sm:text-xs"
          href={directionsUrl(mapQuery)}
          rel="noreferrer"
          target="_blank"
        >
          <ExternalLink aria-hidden size={14} strokeWidth={1.8} />
          {t("directionsAction")}
        </a>
        <div className="mt-2 sm:mt-4">
          <p className="text-[0.6rem] font-bold uppercase tracking-[0.12em] text-[#516170]">
            {t("dressCodeTitle")}
          </p>
          <div className="mt-2 flex items-center justify-center gap-2">
            {effectiveDressColors.map((color) => (
              <span
                aria-label={t("dressColorAlt", { color })}
                className="size-6 rounded-full border border-[#102236]/20 shadow-sm sm:size-8"
                key={color}
                role="img"
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
        </div>
        <div
          className={cn(
            styles.mobileCharacter,
            "mt-1 min-h-0 w-full flex-1",
          )}
        >
          <CharacterArtwork
            alt={t("akaiFuruyaAlt")}
            asset={characterAssets.akaiFuruya}
            sizes="(max-width: 767px) 38vw, 42vw"
          />
          <p className="absolute bottom-3 z-10 bg-[#F3F2EC]/88 px-3 py-1 text-[0.62rem] font-bold text-[#A51F35]">
            {t("castAkaiFuruya")}
          </p>
        </div>
      </ChapterFrame>
    );
  }

  if (chapterId === "guestbook") {
    return (
      <ChapterFrame
        chapterId={chapterId}
        chapterIndex={chapterIndex}
        rightPage={(
          <>
            <h3 className="mt-2 font-art-built text-4xl leading-none text-[#102236]">
              {t("wishesTitle")}
            </h3>
            <WishesList
              content={content}
              emptyLabel={t("wishesEmpty")}
            />
            <div className="mt-4 min-h-0 w-full flex-1">
              <CharacterArtwork
                alt={t("conanKogoroAlt")}
                asset={characterAssets.conanKogoro}
                sizes="30vw"
              />
            </div>
          </>
        )}
      >
        <div
          className="flex h-full min-h-0 w-full flex-col items-center overflow-y-auto overscroll-contain py-2 sm:justify-center"
          data-reader-swipe-ignore
        >
          <ChapterHeader
            id="detective-conan-guestbook-heading"
            title={t("guestbookTitle")}
          />
          <p className={styles.copy}>{t("guestbookHint")}</p>
          <div
            className="w-full max-w-lg [&_button]:bg-[#A51F35] [&_button]:text-white [&_input]:border-[#A51F35]/25 [&_input]:text-[#102236] [&_textarea]:border-[#A51F35]/25 [&_textarea]:text-[#102236]"
            data-testid="detective-conan-casebook-wish-form"
          >
            <SharedWishForm
              accent="#A51F35"
              centered
              labels={{
                namePlaceholder: t("wishName"),
                pending: t("wishPending"),
                submit: t("wishSubmit"),
                success: t("wishSuccess"),
                textPlaceholder: t("wishText"),
              }}
            />
          </div>
          <div className="w-full md:hidden">
            <WishesList
              content={content}
              emptyLabel={t("wishesEmpty")}
            />
          </div>
        </div>
      </ChapterFrame>
    );
  }

  if (chapterId === "gift") {
    return (
      <ChapterFrame
        chapterId={chapterId}
        chapterIndex={chapterIndex}
        rightPage={(
          <>
            <CharacterArtwork
              alt={t("heijiFriendsAlt")}
              asset={characterAssets.heijiFriends}
              sizes="46vw"
            />
            <p className="absolute bottom-3 z-10 max-w-[34ch] bg-[#F3F2EC]/90 px-4 py-2 text-[0.66rem] font-bold leading-5 text-[#A51F35]">
              {t("giftNote")}
            </p>
          </>
        )}
      >
        <ChapterHeader
          id="detective-conan-gift-heading"
          title={t("giftTitle")}
        />
        <p className={styles.copy}>{t("giftHint")}</p>
        {banks.length ? (
          <div
            className="mt-3 w-full min-h-0 scale-[0.86] sm:mt-6 sm:scale-100 [&_h2]:text-base [&_h3]:text-[#102236] [&_p]:text-[#102236]"
            data-reader-swipe-ignore
            data-testid="detective-conan-casebook-gift-qr"
          >
            <GiftQrGrid
              accent="#A51F35"
              banks={banks}
              heading={t("bankDetails")}
              radiusClass="rounded-none"
              saveQrLabel={t("saveQr")}
            />
          </div>
        ) : (
          <p className={styles.copy}>{t("giftEmpty")}</p>
        )}
      </ChapterFrame>
    );
  }

  return (
    <ChapterFrame
      chapterId={chapterId}
      chapterIndex={chapterIndex}
      rightPage={null}
    >
      <ChapterHeader
        eyebrow={t("finaleEyebrow")}
        id="detective-conan-finale-heading"
        title={t("finaleTitle")}
      />
      <p className={styles.copy}>{t("finaleMessage")}</p>
      <p className="mt-3 flex w-full flex-col items-center font-art-built leading-[0.86] text-[#102236] sm:mt-6">
        <ConanCasebookFittedName
          className={readerNameSizeClass(people[0].shortName)}
          name={people[0].shortName}
        />
        <span className="my-1 font-sans text-[0.25em] font-bold uppercase tracking-[0.14em] text-[#A51F35]">
          {t("and")}
        </span>
        <ConanCasebookFittedName
          className={readerNameSizeClass(people[1].shortName)}
          name={people[1].shortName}
        />
      </p>
      <div className={styles.rule} />
      <p className="max-w-[38ch] text-[0.65rem] font-bold leading-5 text-[#516170] sm:text-xs">
        {t("presenceHonor")}
      </p>
      <div
        className="mt-3 grid h-[clamp(8rem,24vh,13rem)] w-full max-w-lg place-items-center overflow-y-auto overscroll-contain border border-[#102236]/14 bg-white/36 p-2 sm:mt-6"
        data-guest-moments-slot="true"
        data-reader-swipe-ignore
        data-testid="detective-conan-casebook-guest-moments-slot"
      >
        <p className="text-[0.62rem] font-bold uppercase tracking-[0.12em] text-[#516170]">
          {t("momentsTitle")}
        </p>
      </div>
      <div
        className={cn(
          styles.mobileCharacter,
          "mt-1 min-h-0 w-full flex-1",
        )}
      >
        <CharacterArtwork
          alt={t("shinichiRanAlt")}
          asset={characterAssets.shinichiRan}
          sizes="(max-width: 767px) 62vw, 42vw"
        />
        <p className="absolute bottom-3 z-10 bg-[#F3F2EC]/88 px-3 py-1 text-[0.62rem] font-bold text-[#A51F35]">
          {t("castShinichiRan")}
        </p>
      </div>
    </ChapterFrame>
  );
}

const CasebookChapter = memo(CasebookChapterComponent);

function chapterPosition(
  index: number,
  currentIndex: number,
): ChapterPosition {
  if (index < currentIndex) return "previous";
  if (index > currentIndex) return "next";
  return "current";
}

function neighboringChapterIndices(index: number): number[] {
  return [index - 1, index, index + 1].filter(
    (candidate) => candidate >= 0 && candidate < CHAPTER_IDS.length,
  );
}

function DetectiveConanCasebookReaderComponent({
  active = true,
  className,
  content,
  productionControls = false,
}: DetectiveConanCasebookReaderProps) {
  const t = useTranslations("detectiveConanCasebook");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [mountedIndices, setMountedIndices] = useState<number[]>([0, 1]);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [turn, setTurn] = useState<PageTurn | null>(null);
  const pointerStartRef = useRef<PointerStart | null>(null);
  const focusHeadingRef = useRef(false);
  const neighborTimerRef = useRef<number | null>(null);
  const prepareFrameRef = useRef<number | null>(null);
  const prepareSecondFrameRef = useRef<number | null>(null);
  const readerRef = useRef<HTMLElement>(null);
  const turnLockRef = useRef(false);
  const turnRef = useRef<PageTurn | null>(null);
  const turnTimerRef = useRef<number | null>(null);
  const turning = turn !== null;
  const visualIndex = turn?.phase === "running" ? turn.to : currentIndex;
  const displayedCurrentIndex = currentIndex;

  const chapterTitles = useMemo(() => [
    t("introTitle"),
    t("familiesTitle"),
    t("ceremonyTitle"),
    t("scheduleTitle"),
    t("galleryTitle"),
    t("mapTitle"),
    t("guestbookTitle"),
    t("giftTitle"),
    t("finaleTitle"),
  ], [t]);

  useEffect(() => {
    turnRef.current = turn;
  }, [turn]);

  const finishTurn = useCallback(() => {
    const activeTurn = turnRef.current;
    if (!activeTurn || activeTurn.phase !== "running") return;

    if (turnTimerRef.current !== null) {
      window.clearTimeout(turnTimerRef.current);
      turnTimerRef.current = null;
    }
    turnLockRef.current = false;
    focusHeadingRef.current = true;
    setCurrentIndex(activeTurn.to);
    setTurn(null);

    if (neighborTimerRef.current !== null) {
      window.clearTimeout(neighborTimerRef.current);
    }
    neighborTimerRef.current = window.setTimeout(() => {
      neighborTimerRef.current = null;
      setMountedIndices(neighboringChapterIndices(activeTurn.to));
    }, 120);
  }, []);

  const navigateTo = useCallback((nextIndex: number) => {
    if (!active || turnLockRef.current) return;

    const boundedIndex = Math.max(
      0,
      Math.min(CHAPTER_IDS.length - 1, nextIndex),
    );
    if (boundedIndex === currentIndex) return;

    turnLockRef.current = true;
    if (neighborTimerRef.current !== null) {
      window.clearTimeout(neighborTimerRef.current);
      neighborTimerRef.current = null;
    }
    setMountedIndices([currentIndex, boundedIndex].sort((a, b) => a - b));
    setTurn({
      direction: boundedIndex > currentIndex ? "forward" : "backward",
      from: currentIndex,
      phase: "preparing",
      to: boundedIndex,
    });

    const url = new URL(window.location.href);
    const nextChapterId = CHAPTER_IDS[boundedIndex];
    url.searchParams.set("chapter", nextChapterId);
    const previousState = (
      typeof window.history.state === "object"
      && window.history.state !== null
    )
      ? window.history.state
      : {};

    window.history.pushState(
      { ...previousState, detectiveConanChapter: nextChapterId },
      "",
      url,
    );
  }, [active, currentIndex]);

  const navigateRelative = useCallback((offset: number) => {
    navigateTo(currentIndex + offset);
  }, [currentIndex, navigateTo]);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const syncMotionPreference = () => setReducedMotion(media.matches);
    syncMotionPreference();
    media.addEventListener("change", syncMotionPreference);
    return () => media.removeEventListener("change", syncMotionPreference);
  }, []);

  useEffect(() => {
    if (turn?.phase !== "preparing") return;

    prepareFrameRef.current = window.requestAnimationFrame(() => {
      prepareSecondFrameRef.current = window.requestAnimationFrame(() => {
        prepareFrameRef.current = null;
        prepareSecondFrameRef.current = null;
        setTurn((current) => current?.phase === "preparing"
          ? { ...current, phase: "running" }
          : current);
      });
    });

    return () => {
      if (prepareFrameRef.current !== null) {
        window.cancelAnimationFrame(prepareFrameRef.current);
        prepareFrameRef.current = null;
      }
      if (prepareSecondFrameRef.current !== null) {
        window.cancelAnimationFrame(prepareSecondFrameRef.current);
        prepareSecondFrameRef.current = null;
      }
    };
  }, [turn?.phase]);

  useEffect(() => {
    if (turn?.phase !== "running") return;
    turnTimerRef.current = window.setTimeout(
      finishTurn,
      reducedMotion ? 230 : 720,
    );
    return () => {
      if (turnTimerRef.current !== null) {
        window.clearTimeout(turnTimerRef.current);
        turnTimerRef.current = null;
      }
    };
  }, [finishTurn, reducedMotion, turn?.phase]);

  useEffect(() => () => {
    if (turnTimerRef.current !== null) {
      window.clearTimeout(turnTimerRef.current);
    }
    if (neighborTimerRef.current !== null) {
      window.clearTimeout(neighborTimerRef.current);
    }
    if (prepareFrameRef.current !== null) {
      window.cancelAnimationFrame(prepareFrameRef.current);
    }
    if (prepareSecondFrameRef.current !== null) {
      window.cancelAnimationFrame(prepareSecondFrameRef.current);
    }
  }, []);

  useEffect(() => {
    const syncFromUrl = (shouldFocus: boolean) => {
      const nextIndex = chapterIndexFromUrl();
      if (shouldFocus) focusHeadingRef.current = true;
      turnLockRef.current = false;
      setTurn(null);
      setMountedIndices(neighboringChapterIndices(nextIndex));
      setCurrentIndex(nextIndex);
    };

    if (!active) {
      syncFromUrl(false);
      return;
    }

    const handlePopState = () => syncFromUrl(true);

    syncFromUrl(false);
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [active]);

  useEffect(() => {
    if (!active || !focusHeadingRef.current) return;

    focusHeadingRef.current = false;
    let secondFrame = 0;
    const firstFrame = window.requestAnimationFrame(() => {
      secondFrame = window.requestAnimationFrame(() => {
        const heading = readerRef.current?.querySelector<HTMLElement>(
          `[data-chapter-index="${currentIndex}"] [data-chapter-heading]`,
        );
        heading?.focus({ preventScroll: true });
      });
    });

    return () => {
      window.cancelAnimationFrame(firstFrame);
      window.cancelAnimationFrame(secondFrame);
    };
  }, [active, currentIndex]);

  useEffect(() => {
    if (!active) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (
        event.altKey
        || event.ctrlKey
        || event.metaKey
        || event.shiftKey
        || isInteractiveTarget(event.target)
      ) {
        return;
      }

      if (event.key === "ArrowLeft") {
        event.preventDefault();
        navigateRelative(-1);
      }
      if (event.key === "ArrowRight") {
        event.preventDefault();
        navigateRelative(1);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [active, navigateRelative]);

  const handlePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (
      !active
      || event.pointerType === "mouse"
      || isInteractiveTarget(event.target)
    ) {
      pointerStartRef.current = null;
      return;
    }

    pointerStartRef.current = {
      pointerId: event.pointerId,
      startedAt: performance.now(),
      x: event.clientX,
      y: event.clientY,
    };
  };

  const handlePointerUp = (event: ReactPointerEvent<HTMLDivElement>) => {
    const start = pointerStartRef.current;
    pointerStartRef.current = null;
    if (!active || !start || start.pointerId !== event.pointerId) return;

    const deltaX = event.clientX - start.x;
    const deltaY = event.clientY - start.y;
    const elapsed = Math.max(1, performance.now() - start.startedAt);
    const horizontalIntent = Math.abs(deltaX) > Math.abs(deltaY) * 1.25;
    const deliberateSwipe = Math.abs(deltaX) >= 52;
    const quickSwipe = Math.abs(deltaX) >= 34 && elapsed <= 280;

    if (!horizontalIntent || (!deliberateSwipe && !quickSwipe)) return;
    navigateRelative(deltaX < 0 ? 1 : -1);
  };

  const handleChapterTransitionEnd = useCallback((
    index: number,
    event: ReactTransitionEvent<HTMLDivElement>,
  ) => {
    const activeTurn = turnRef.current;
    if (
      event.currentTarget !== event.target
      || event.propertyName !== "transform"
      || activeTurn?.phase !== "running"
      || activeTurn.from !== index
    ) {
      return;
    }
    finishTurn();
  }, [finishTurn]);

  return (
    <section
      ref={readerRef}
      aria-hidden={!active}
      aria-label={t("readerLabel")}
      aria-busy={turning}
      className={cn(styles.reader, className)}
      data-active={active ? "true" : "false"}
      data-current-chapter={CHAPTER_IDS[displayedCurrentIndex]}
      data-physical-handoff-target
      data-production-controls={productionControls ? "true" : "false"}
      data-reader-ready="true"
      data-reduced-motion={reducedMotion ? "true" : "false"}
      data-turn-direction={turn?.direction ?? "none"}
      data-turn-state={turn?.phase ?? "idle"}
      data-turn-style={reducedMotion ? "fade" : "page"}
      data-testid="detective-conan-casebook-reader"
      onPointerCancel={() => {
        pointerStartRef.current = null;
      }}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      tabIndex={-1}
    >
      <div className={styles.readerViewport}>
        <div className={styles.bookStage}>
          {mountedIndices.map((index) => {
            const position = chapterPosition(index, visualIndex);
            const turnRole = turn && index === turn.from
              ? "outgoing"
              : turn && index === turn.to
                ? "incoming"
                : undefined;
            return (
              <div
                aria-hidden={index !== displayedCurrentIndex}
                className={styles.chapterLayer}
                data-position={position}
                data-turn-role={turnRole}
                inert={index !== displayedCurrentIndex ? true : undefined}
                key={CHAPTER_IDS[index]}
                onTransitionEnd={(event) => {
                  handleChapterTransitionEnd(index, event);
                }}
              >
                <CasebookChapter
                  chapterId={CHAPTER_IDS[index]}
                  chapterIndex={index}
                  content={content}
                />
              </div>
            );
          })}
          <div aria-hidden="true" className={styles.turnSheet} />
        </div>
      </div>

      <nav
        aria-label={t("chapterNavigation")}
        className={styles.controlBar}
        data-testid="detective-conan-casebook-navigation"
      >
        <button
          aria-label={t("previousPage")}
          className={cn(styles.navButton, styles.previousButton)}
          data-testid="detective-conan-casebook-previous"
          disabled={!active || turning || displayedCurrentIndex === 0}
          onClick={() => navigateRelative(-1)}
          type="button"
        >
          <ArrowLeft aria-hidden size={17} strokeWidth={1.8} />
          <span className={styles.navLabel}>{t("previousPage")}</span>
        </button>

        <div className={styles.chapterIndex}>
          <p
            aria-live="polite"
            className={styles.progressCopy}
            data-testid="detective-conan-casebook-progress"
          >
            {t("chapterProgress", {
              current: displayedCurrentIndex + 1,
              title: chapterTitles[displayedCurrentIndex],
              total: CHAPTER_IDS.length,
            })}
          </p>
          <div className={styles.chapterDots}>
            {CHAPTER_IDS.map((chapterId, index) => (
              <button
                aria-current={
                  index === displayedCurrentIndex ? "page" : undefined
                }
                aria-label={t("goToChapter", {
                  title: chapterTitles[index],
                })}
                className={styles.chapterDot}
                data-current={
                  index === displayedCurrentIndex ? "true" : "false"
                }
                disabled={!active || turning}
                key={chapterId}
                onClick={() => navigateTo(index)}
                type="button"
              >
                {chapterTitles[index]}
              </button>
            ))}
          </div>
        </div>

        <button
          aria-label={t("nextPage")}
          className={cn(styles.navButton, styles.nextButton)}
          data-testid="detective-conan-casebook-next"
          disabled={
            !active
            || turning
            || displayedCurrentIndex === CHAPTER_IDS.length - 1
          }
          onClick={() => navigateRelative(1)}
          type="button"
        >
          <span className={styles.navLabel}>{t("nextPage")}</span>
          <ArrowRight aria-hidden size={17} strokeWidth={1.8} />
        </button>
      </nav>
    </section>
  );
}

export const DetectiveConanCasebookReader = memo(
  DetectiveConanCasebookReaderComponent,
);

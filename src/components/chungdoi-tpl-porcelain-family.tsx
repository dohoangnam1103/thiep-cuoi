"use client";

import type { ReactNode } from "react";
import { useTranslations } from "next-intl";

import {
  AlbumGallery,
  buildCalendar,
  FamilyColumn,
  FitText,
  formatDate,
  formatWishTime,
  GiftEnvelope,
  googleCalendarUrl,
  InvitationMap,
  MapDirectionsButton,
  SharedCountdown,
  SharedWishForm,
  WEEKDAY_LABELS,
} from "@/components/chungdoi-tpl-shared";
import type { ChungDoiDemoContent } from "@/data/chungdoi-demo-content";
import { invitationCeremonies, invitationGiftAccounts, orderedCouple } from "@/lib/invitation-display";

import styles from "./chungdoi-tpl-porcelain-family.module.css";

export type PorcelainTemplateSlug =
  | "porcelain-blue"
  | "porcelain-red"
  | "porcelain-brown"
  | "porcelain-v2-red"
  | "porcelain-v2-green";

type PorcelainLayout = "classic" | "v2";
type PorcelainVariant = "blue" | "red" | "brown" | "v2Red" | "v2Green";

type PorcelainTemplateConfig = {
  slug: PorcelainTemplateSlug;
  layout: PorcelainLayout;
  variant: PorcelainVariant;
  root: string;
  primary: string;
  secondary: string;
  paper: string;
  heroAsset: string;
  scheduleIcons: readonly (string | null)[];
};

const classicScheduleIcons = [null, "cake", "home", "music", null] as const;

export const porcelainTemplateConfigs: Record<PorcelainTemplateSlug, PorcelainTemplateConfig> = {
  "porcelain-blue": {
    slug: "porcelain-blue",
    layout: "classic",
    variant: "blue",
    root: "/chungdoi/images/themes/porcelain-blue",
    primary: "#082f55",
    secondary: "#082f55",
    paper: "#f6f3e7",
    heroAsset: "frame-decoration.webp",
    scheduleIcons: classicScheduleIcons,
  },
  "porcelain-red": {
    slug: "porcelain-red",
    layout: "classic",
    variant: "red",
    root: "/chungdoi/images/themes/porcelain-red",
    primary: "#af3e42",
    secondary: "#af3e42",
    paper: "#f2eee2",
    heroAsset: "frame-decoration.webp",
    scheduleIcons: classicScheduleIcons,
  },
  "porcelain-brown": {
    slug: "porcelain-brown",
    layout: "classic",
    variant: "brown",
    root: "/chungdoi/images/themes/porcelain-brown",
    primary: "#8d6f32",
    secondary: "#8d6f32",
    paper: "#fcfbf8",
    heroAsset: "frame-background.webp",
    scheduleIcons: classicScheduleIcons,
  },
  "porcelain-v2-red": {
    slug: "porcelain-v2-red",
    layout: "v2",
    variant: "v2Red",
    root: "/chungdoi/images/themes/porcelain-v2-red",
    primary: "#8f262d",
    secondary: "#654e2f",
    paper: "#fefaf0",
    heroAsset: "hero-frame.webp",
    scheduleIcons: [null, "ring", "cake", "lamp", null],
  },
  "porcelain-v2-green": {
    slug: "porcelain-v2-green",
    layout: "v2",
    variant: "v2Green",
    root: "/chungdoi/images/themes/porcelain-v2-green",
    primary: "#464f1e",
    secondary: "#bc9b63",
    paper: "#fff7eb",
    heroAsset: "hero-frame.webp",
    scheduleIcons: [null, "ring", "alcohol", "heart", null],
  },
};

function usesWeddingCopy(config: PorcelainTemplateConfig) {
  return config.variant === "brown" || config.layout === "v2";
}

function Heading({ children }: { children: ReactNode }) {
  return <h2 className={styles.heading}>{children}</h2>;
}

function DateComposition({
  date,
  time,
  ceremony = false,
}: {
  date: string;
  time: string;
  ceremony?: boolean;
}) {
  const t = useTranslations("invitationTemplate");
  const value = formatDate(date);
  if (!value) return null;

  return (
    <div className={styles.ceremonyDate}>
      <div className={styles.dateMeta}>
        <span>{ceremony ? t("atTime", { time }) : value.weekday}</span>
        <span>{ceremony ? value.weekday : time}</span>
      </div>
      <div className={styles.dateNumber}>
        <span className={styles.day}>{value.day}</span>
        <span className={styles.monthYear}>
          <span>{t("month", { month: value.month })}</span>
          <span>{value.yearNumber}</span>
        </span>
      </div>
      <p className={styles.lunar}>{value.lunar}</p>
    </div>
  );
}

function V2Flowers({ root, placement }: { root: string; placement: "ceremony" | "reception" | "schedule" }) {
  return (
    <div aria-hidden className={styles.flowerLayer}>
      <img
        className={`${styles.flower} ${styles[`${placement}FlowerLeft`]}`}
        src={`${root}/flower.webp`}
        alt=""
        draggable={false}
      />
      {placement !== "schedule" ? (
        <img
          className={`${styles.flower} ${styles[`${placement}FlowerRight`]}`}
          src={`${root}/flower.webp`}
          alt=""
          draggable={false}
        />
      ) : null}
    </div>
  );
}

function RsvpProxy({ slug, outside = false }: { slug: PorcelainTemplateSlug; outside?: boolean }) {
  const t = useTranslations("invitationTemplate");
  return (
    <button
      type="button"
      data-testid={`${slug}-rsvp-proxy`}
      onClick={() => document.querySelector<HTMLButtonElement>('[data-testid="public-rsvp-trigger"]')?.click()}
      className={`${styles.rsvpButton} ${outside ? styles.rsvpButtonOutside : ""}`}
    >
      {t("rsvpHeading")}
    </button>
  );
}

function CalendarBlock({ content }: { content: ChungDoiDemoContent }) {
  const t = useTranslations("invitationTemplate");
  const calendar = buildCalendar(content.couple.date);
  if (!calendar) return null;

  return (
    <div className={styles.calendar} dir="ltr">
      <p className={styles.calendarTitle}>
        {t("monthYear", { month: calendar.month, year: calendar.year })}
      </p>
      <div className={styles.weekdays}>
        {WEEKDAY_LABELS.map((day) => <span key={day}>{day}</span>)}
      </div>
      <div className={styles.calendarGrid}>
        {calendar.cells.map((day, index) => (
          <span key={index} className={styles.calendarCell}>
            {day ? <span className={day === calendar.highlight ? styles.highlight : undefined}>{day}</span> : null}
          </span>
        ))}
      </div>
    </div>
  );
}

function ReceptionCard({
  content,
  config,
}: {
  content: ChungDoiDemoContent;
  config: PorcelainTemplateConfig;
}) {
  const t = useTranslations("invitationTemplate");
  const banquetTime = content.venue.banquetTime || content.couple.time;
  const welcomeTime = content.venue.welcomeTime || banquetTime;

  return (
    <>
      {config.layout === "v2" ? <V2Flowers root={config.root} placement="reception" /> : null}
      <Heading>
        {t(usesWeddingCopy(config) ? "receptionInformation" : "receptionAnnouncement")}
      </Heading>
      <h3 className={styles.subheading}>
        {t(usesWeddingCopy(config) ? "receptionStartsAt" : "receptionStartsAtAnnouncement")}
      </h3>
      <DateComposition date={content.couple.date} time={banquetTime} />
      <div className={styles.arrivalTimes}>
        <div>
          <p className={styles.arrivalLabel}>{t("guestArrival")}</p>
          <p className={styles.arrivalTime}>{welcomeTime}</p>
        </div>
        <div>
          <p className={styles.arrivalLabel}>{t("banquetOpening")}</p>
          <p className={styles.arrivalTime}>{banquetTime}</p>
        </div>
      </div>
      <div className={styles.countdownBlock}>
        <h3 className={styles.countdownTitle}>{t("countdown")}</h3>
        <SharedCountdown
          target={`${content.couple.date}T${banquetTime}`}
          className="text-center text-sm font-bold md:text-lg"
          labels={{
            days: t("days"),
            hours: t("hours"),
            minutes: t("minutes"),
            seconds: t("seconds"),
          }}
        />
      </div>
      <CalendarBlock content={content} />
      <a
        className={styles.calendarLink}
        href={googleCalendarUrl(content)}
        target="_blank"
        rel="noreferrer"
      >
        {t("addToCalendar")}
      </a>
      {config.layout === "classic" ? <RsvpProxy slug={config.slug} /> : null}
    </>
  );
}

function ScheduleTimeline({
  content,
  config,
}: {
  content: ChungDoiDemoContent;
  config: PorcelainTemplateConfig;
}) {
  const t = useTranslations("invitationTemplate");
  if (content.schedule.length === 0) return null;

  return (
    <div className={styles.schedule}>
      {config.layout === "v2" ? <V2Flowers root={config.root} placement="schedule" /> : null}
      <Heading>{t(usesWeddingCopy(config) ? "weddingSchedule" : "receptionSchedule")}</Heading>
      <ol className={styles.timeline}>
        {content.schedule.map((event, index) => {
          const icon = config.scheduleIcons[index] ?? null;
          const first = index === 0;
          const last = index === content.schedule.length - 1;
          return (
            <li key={`${event.time}-${event.label}-${index}`} className="contents">
              <span className={styles.timelineTime}>
                <span className={styles.timelineTimeInner}>
                  {icon ? (
                    <img
                      className={styles.timelineIcon}
                      src={`${config.root}/${icon}.webp`}
                      alt=""
                      aria-hidden
                      draggable={false}
                    />
                  ) : null}
                  {event.time}
                </span>
              </span>
              <span aria-hidden className={styles.timelineRail}>
                {!first || !last ? (
                  <span
                    className={`${styles.timelineLine} ${first ? styles.timelineLineFirst : ""} ${last ? styles.timelineLineLast : ""}`}
                  />
                ) : null}
                <span className={styles.timelineDot} />
              </span>
              <span className={styles.timelineLabel}>{event.label}</span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

function Guestbook({
  content,
  config,
}: {
  content: ChungDoiDemoContent;
  config: PorcelainTemplateConfig;
}) {
  const t = useTranslations("invitationTemplate");
  return (
    <section className={styles.guestbook}>
      <Heading>{t("guestbook")}</Heading>
      <SharedWishForm
        accent={config.primary}
        fieldBorderColor={config.secondary}
        submitTextColor={config.paper}
        labels={{
          namePlaceholder: `${t("sourceWishName")}*`,
          textPlaceholder: `${t("sourceWishText")}*`,
        }}
      />
      {content.wishes.length > 0 ? (
        <div className={`chungdoi-scroll touch-pan-y ${styles.wishList}`}>
          {content.wishes.map((wish, index) => (
            <article key={`${wish.name}-${wish.time}-${index}`} className={styles.wish}>
              <div className={styles.wishMeta}>
                <strong className={styles.wishName}>{wish.name}</strong>
                <time className={styles.wishTime}>{formatWishTime(wish.time)}</time>
              </div>
              <p className={styles.wishText}>{wish.text}</p>
            </article>
          ))}
        </div>
      ) : null}
    </section>
  );
}

export function PorcelainFamilyInvitation({
  content,
  templateSlug,
}: {
  content: ChungDoiDemoContent;
  templateSlug: PorcelainTemplateSlug;
}) {
  const t = useTranslations("invitationTemplate");
  const config = porcelainTemplateConfigs[templateSlug];
  const { couple, families, venue, gallery } = content;
  const ceremonies = invitationCeremonies(content);
  const people = orderedCouple(content);
  const mapQuery = venue.mapAddress || venue.address;
  const dressColors = (content.dressCodeColors ?? "")
    .split(",")
    .map((color) => color.trim())
    .filter((color) => /^#[\da-f]{6}$/i.test(color));
  const banks = invitationGiftAccounts(content).map((account) => ({
    label: `${account.birthOrder} - ${account.name}`,
    bank: account.bank,
    num: account.num,
    name: account.name,
  }));
  const groom = (
    <FamilyColumn
      sideBySideOnMobile
      title={families.groomParentTitle || t("parents")}
      a={families.groomFather}
      b={families.groomMother}
      addr={families.groomAddress}
    />
  );
  const bride = (
    <FamilyColumn
      sideBySideOnMobile
      title={families.brideParentTitle || t("parents")}
      a={families.brideFather}
      b={families.brideMother}
      addr={families.brideAddress}
    />
  );

  return (
    <div className={styles.page}>
      <div
        data-template-visual={config.slug}
        data-porcelain-layout={config.layout}
        data-porcelain-variant={config.variant}
        className={`${styles.invitation} ${styles[config.variant]}`}
      >
        <div className={styles.pattern}>
          <header data-porcelain-hero-stage className={styles.heroStage}>
            <div data-porcelain-hero-frame className={styles.heroFrame}>
              {config.layout === "classic" ? <div aria-hidden className={styles.heroPanel} /> : null}
              <img
                data-porcelain-hero-artwork
                className={styles.frameArtwork}
                src={`${config.root}/${config.heroAsset}`}
                alt=""
                aria-hidden
                draggable={false}
              />
              <div className={styles.heroCopy}>
                <p data-porcelain-save-date className={styles.saveDate}>{t("hoaKhoSaveTheDate")}</p>
                <h1 data-porcelain-short-names className={styles.shortNames}>
                  <span data-invitation-short-name className={styles.shortName}>{people[0].shortName}</span>
                  <span data-porcelain-ampersand className={styles.ampersand}>&amp;</span>
                  <span data-invitation-short-name className={styles.shortName}>{people[1].shortName}</span>
                </h1>
              </div>
            </div>
          </header>

          <div className={styles.patternBlock}>
            <section className={styles.panel}>
              {config.layout === "v2" ? <V2Flowers root={config.root} placement="ceremony" /> : null}
              <Heading>{t(usesWeddingCopy(config) ? "weddingInformation" : "ceremonyInformation")}</Heading>
              <div className={styles.families}>
                {couple.brideFirst ? bride : groom}
                <span aria-hidden className={styles.familyDivider} />
                {couple.brideFirst ? groom : bride}
              </div>
              <p className={styles.openingMessage}>{couple.openingMessage}</p>
              <div className={styles.fullNames}>
                <FitText maxFontSize={config.layout === "v2" ? 42 : 38} className={styles.fullName}>
                  {people[0].fullName}
                </FitText>
                <p className={styles.birthOrder}>{people[0].birthOrder}</p>
                <span className={styles.fullAmpersand}>&amp;</span>
                <FitText maxFontSize={config.layout === "v2" ? 42 : 38} className={styles.fullName}>
                  {people[1].fullName}
                </FitText>
                <p className={styles.birthOrder}>{people[1].birthOrder}</p>
              </div>
              <div data-template-ceremonies className={styles.ceremonyList}>
                {ceremonies.map((ceremony, index) => (
                  <div
                    key={`${ceremony.title}-${ceremony.date}-${ceremony.time}-${index}`}
                    data-template-ceremony-item
                  >
                    <p className={styles.ceremonyHeader}>{ceremony.title}</p>
                    <DateComposition date={ceremony.date} time={ceremony.time} ceremony />
                  </div>
                ))}
              </div>
            </section>
          </div>
        </div>

        {gallery.length > 0 ? (
          <section className={styles.plainSection}>
            <Heading>{t("photoAlbum")}</Heading>
            <div className={styles.album}>
              <AlbumGallery
                photos={gallery}
                layout={config.layout === "v2" ? "coverflow" : "grid"}
                accent={config.primary}
                gridAspect="aspect-square"
                radiusClass={config.layout === "v2" ? "rounded-2xl" : "rounded-none"}
              />
            </div>
          </section>
        ) : null}

        <div className={`${styles.pattern} ${styles.receptionPattern}`}>
          <div className={styles.patternBlock}>
            <section className={`${styles.panel} ${styles.receptionPanel}`}>
              <ReceptionCard content={content} config={config} />
            </section>
            {config.layout === "v2" ? <RsvpProxy slug={config.slug} outside /> : null}
          </div>
        </div>

        <section className={styles.venueSection}>
          {mapQuery ? (
            <>
              <h2 className={styles.venueHeading}>
                {t(usesWeddingCopy(config) ? "receptionVenueHeading" : "receptionVenueAnnouncement")}
              </h2>
              <p className={styles.address}>{venue.address}</p>
              <div className={styles.mapFrame}>
                <InvitationMap query={mapQuery} title={mapQuery} className="h-[260px] w-full md:h-[380px]" />
              </div>
              <MapDirectionsButton query={mapQuery} />
            </>
          ) : null}

          {dressColors.length > 0 ? (
            <div className={styles.dressCode}>
              <Heading>{t("dressCodeHeading")}</Heading>
              <p className={styles.dressSubtitle}>{t("partyAttire")}</p>
              <div className={styles.swatches}>
                {dressColors.map((color) => (
                  <svg key={color} viewBox="0 0 48 48" className={styles.swatch} aria-hidden>
                    <circle cx="24" cy="24" r="22.5" fill={color} stroke="currentColor" />
                  </svg>
                ))}
              </div>
            </div>
          ) : null}

          {config.layout === "classic" ? (
            <>
              <ScheduleTimeline content={content} config={config} />
              <Guestbook content={content} config={config} />
            </>
          ) : null}
        </section>

        {config.layout === "v2" ? (
          <>
            {content.schedule.length > 0 ? (
              <div className={`${styles.pattern} ${styles.schedulePattern}`}>
                <section className={styles.scheduleCard}>
                  <ScheduleTimeline content={content} config={config} />
                </section>
              </div>
            ) : null}
            <div className={styles.guestbookSection}>
              <Guestbook content={content} config={config} />
            </div>
          </>
        ) : null}

        {banks.length > 0 ? (
          <div className={`${config.layout === "classic" ? styles.pattern : ""} ${styles.giftSection}`}>
            <section className={styles.giftCard}>
              <GiftEnvelope
                templateSlug={content.slug}
                artworkVariant="source"
                sparkleColor={config.secondary}
                banks={banks}
                accent={config.primary}
                dark={config.primary}
                cardBg={config.paper}
                heading={t("giftBox")}
                openLabel={t("giftOpenHint")}
                labelColor={config.secondary}
                headingClassName={styles.giftHeading}
              />
              <footer data-template-footer className={styles.footer}>
                <p>{t("presenceHonor")}</p>
                <a className={styles.brand} href="https://thiepmungonline.com">{t("brandDomain")}</a>
              </footer>
            </section>
            {config.layout === "v2" ? <div aria-hidden className={`${styles.pattern} ${styles.v2FooterStrip}`} /> : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}

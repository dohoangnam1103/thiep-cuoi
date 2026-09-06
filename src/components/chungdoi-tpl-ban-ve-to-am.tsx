"use client";

import Image from "next/image";
import { usePathname } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import type { ReactNode } from "react";

import { BanVeToAmHeroCard } from "@/components/ban-ve-to-am/ban-ve-to-am-hero-card";
import styles from "@/components/ban-ve-to-am/ban-ve-to-am-template.module.css";
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

const BOTANICAL_DIVIDER =
  "/chungdoi/templates/ban-ve-to-am/ornaments/botanical-divider.svg";
const GARDEN_ENVELOPE =
  "/chungdoi/templates/ban-ve-to-am/gift/garden-envelope.svg";
const DEEP_GARDEN = "#315445";
const IVORY = "#FAF7F0";

type SectionHeadingProps = {
  align?: "center" | "left";
  children: ReactNode;
  eyebrow: string;
  inverse?: boolean;
};

function SectionHeading({
  align = "center",
  children,
  eyebrow,
  inverse = false,
}: SectionHeadingProps) {
  return (
    <header
      className={cn(
        styles.sectionHeading,
        align === "left" && styles.sectionHeadingLeft,
        inverse && styles.sectionHeadingInverse,
      )}
    >
      <p className={styles.sectionEyebrow}>{eyebrow}</p>
      <h2 className={styles.sectionTitle}>{children}</h2>
    </header>
  );
}

function BotanicalDivider({ inverse = false }: { inverse?: boolean }) {
  return (
    <Image
      aria-hidden
      alt=""
      className={cn(styles.divider, inverse && styles.dividerInverse)}
      height={144}
      src={BOTANICAL_DIVIDER}
      unoptimized
      width={1200}
    />
  );
}

function formatEventDate(value: string, locale: string) {
  const parsed = new Date(`${value}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return value;
  return new Intl.DateTimeFormat(locale, {
    weekday: "long",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(parsed);
}

export function BanVeToAmInvitation({
  content,
}: {
  content: ChungDoiDemoContent;
}) {
  const locale = useLocale();
  const t = useTranslations("banVeToAmTemplate");
  const invitationT = useTranslations("invitationTemplate");
  const captureMode = usePathname().endsWith("/capture");
  const { couple, families, gallery, schedule, venue, wishes } = content;
  const people = orderedCouple(content);
  const ceremonies = invitationCeremonies(content);
  const calendar = buildCalendar(couple.date);
  const receptionDate = formatDate(couple.date);
  const mapQuery = venue.mapAddress || venue.address.replace(/\n+/g, ", ").trim();
  const welcomeImage = gallery[1] || gallery[0] || content.heroImage;
  const ceremonyImage = gallery[2] || gallery[0] || content.heroImage;
  const footerImage = gallery.at(-1) || gallery[0] || content.heroImage;
  const familiesInOrder = orderByBrideFirst(
    {
      address: families.brideAddress,
      father: families.brideFather,
      mother: families.brideMother,
      side: invitationT("brideFamily"),
      title: families.brideParentTitle || invitationT("parents"),
    },
    {
      address: families.groomAddress,
      father: families.groomFather,
      mother: families.groomMother,
      side: invitationT("groomFamily"),
      title: families.groomParentTitle || invitationT("parents"),
    },
    couple.brideFirst,
  );
  const banks = invitationGiftAccounts(content).map((account) => ({
    bank: account.bank,
    label: account.name,
    name: account.name,
    num: account.num,
  }));
  const dressColors = (content.dressCodeColors ?? "")
    .split(",")
    .map((color) => color.trim())
    .filter((color) => /^#[0-9a-fA-F]{6}$/.test(color))
    .map((color) => ({
      border: color.toLowerCase() === "#faf7f0" ? "#8A9B8D" : undefined,
      color,
    }));

  return (
    <main
      className={cn(styles.root, "font-body-sans")}
      data-template-slug="ban-ve-to-am"
    >
      <BanVeToAmHeroCard content={content} />

      <section className={cn(styles.section, styles.welcomeSection)}>
        <div className={styles.sectionInner}>
          <SectionHeading eyebrow={t("welcomeEyebrow")}>
            {t("welcomeTitle")}
          </SectionHeading>
          <BotanicalDivider />

          <div className={styles.welcomeGrid}>
            <figure className={styles.welcomePortrait}>
              {welcomeImage ? (
                <Image
                  alt={invitationT("weddingPhotoAlt", {
                    couple: `${people[0].shortName} ${invitationT("and")} ${people[1].shortName}`,
                  })}
                  className={styles.coverImage}
                  fill
                  sizes="(max-width: 480px) 92vw, 320px"
                  src={welcomeImage}
                />
              ) : null}
              <figcaption>{t("welcomePhotoCaption")}</figcaption>
            </figure>

            <div className={styles.welcomeCopy}>
              <span aria-hidden className={styles.quoteMark}>“</span>
              <p>{invitationOpeningMessage(content)}</p>
              <div aria-hidden className={styles.signatureLeaf} />
              <p className={styles.coupleSignature}>
                {people[0].shortName} {invitationT("and")} {people[1].shortName}
              </p>
            </div>
          </div>

          <div className={styles.familyGrid}>
            {familiesInOrder.map((family) => (
              <article className={styles.familyCard} key={family.side}>
                <p className={styles.familySide}>{family.side}</p>
                <h3>{family.title}</h3>
                <p className={styles.familyNames}>{family.father}</p>
                <p className={styles.familyNames}>{family.mother}</p>
                <p className={styles.familyAddress}>{family.address}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className={cn(styles.section, styles.ceremonySection)}>
        {ceremonyImage ? (
          <Image
            aria-hidden
            alt=""
            className={styles.sceneImage}
            fill
            sizes="(max-width: 480px) 100vw, 480px"
            src={ceremonyImage}
          />
        ) : null}
        <div aria-hidden className={styles.sceneVeil} />
        <div className={styles.sectionInner}>
          <SectionHeading inverse eyebrow={t("ceremonyEyebrow")}>
            {t("ceremonyTitle")}
          </SectionHeading>
          <BotanicalDivider inverse />

          <div data-template-ceremonies className={styles.ceremonyGrid}>
            {ceremonies.map((ceremony, index) => (
              <article
                data-template-ceremony-item
                className={cn(
                  styles.ceremonyCard,
                  ceremonies.length === 1 && styles.ceremonyCardWide,
                )}
                key={`${ceremony.title}-${ceremony.date}-${ceremony.time}`}
              >
                <p className={styles.cardKicker}>
                  {t("ceremonyCardLabel", { number: index + 1 })}
                </p>
                <h3>{ceremony.title}</h3>
                <time dateTime={`${ceremony.date}T${ceremony.time}`}>
                  <span>{formatEventDate(ceremony.date, locale)}</span>
                  <strong>{ceremony.time}</strong>
                </time>
              </article>
            ))}

            <article className={styles.receptionCard}>
              <div>
                <p className={styles.cardKicker}>{t("receptionLabel")}</p>
                {receptionDate ? (
                  <p className={styles.receptionDate}>
                    {receptionDate.day}<span>/</span>{receptionDate.month}
                  </p>
                ) : null}
                <p className={styles.receptionTime}>
                  {venue.banquetTime || couple.time}
                </p>
              </div>
              <div className={styles.receptionAddress}>
                <h3>{invitationT("reception")}</h3>
                <p>{venue.address}</p>
              </div>
            </article>
          </div>
        </div>
      </section>

      <section className={cn(styles.section, styles.dateSection)}>
        <div className={styles.sectionInner}>
          <SectionHeading eyebrow={t("dateEyebrow")}>
            {t("dateTitle")}
          </SectionHeading>
          <BotanicalDivider />

          <div className={styles.dateGrid}>
            <div className={styles.countdownCard}>
              <p className={styles.cardKicker}>{invitationT("saveTheDate")}</p>
              <SharedCountdown
                className={styles.countdown}
                labels={{
                  days: invitationT("days"),
                  hours: invitationT("hours"),
                  minutes: invitationT("minutes"),
                  seconds: invitationT("seconds"),
                }}
                target={`${couple.date}T${couple.time}`}
              />
              <a
                className={styles.calendarButton}
                href={googleCalendarUrl(content)}
                rel="noreferrer"
                target="_blank"
              >
                {invitationT("addToCalendar")}
              </a>
            </div>

            {calendar ? (
              <div className={styles.calendarCard}>
                <p className={styles.calendarNote}>{t("calendarNote")}</p>
                <h3>{invitationT("calendar", { month: calendar.month })}</h3>
                <p className={styles.calendarYear}>{calendar.year}</p>
                <div className={styles.calendarGrid}>
                  {WEEKDAY_LABELS.map((label) => (
                    <span className={styles.weekday} key={label}>{label}</span>
                  ))}
                  {calendar.cells.map((day, index) => (
                    <span
                      className={cn(
                        styles.calendarDay,
                        day === calendar.highlight && styles.calendarDayActive,
                      )}
                      key={`${day ?? "empty"}-${index}`}
                    >
                      {day}
                    </span>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </section>

      <section className={cn(styles.section, styles.gallerySection)}>
        <div className={styles.sectionInner}>
          <SectionHeading eyebrow={t("galleryEyebrow")}>
            {t("galleryTitle")}
          </SectionHeading>
          <BotanicalDivider />
          <div className={styles.galleryFrame}>
            <AlbumGallery
              accent="#A88752"
              gridAspect="aspect-square"
              layout={content.albumLayout ?? "grid"}
              photos={gallery}
              radiusClass="rounded-[1.1rem]"
            />
          </div>
        </div>
      </section>

      {schedule.length ? (
        <section className={cn(styles.section, styles.scheduleSection)}>
          <div className={styles.sectionInner}>
            <SectionHeading eyebrow={t("scheduleEyebrow")}>
              {t("scheduleTitle")}
            </SectionHeading>
            <BotanicalDivider />
            <div className={styles.scheduleTrack}>
              {schedule.map((item, index) => (
                <article className={styles.scheduleItem} key={`${item.time}-${item.label}`}>
                  <span aria-hidden className={styles.scheduleNumber}>
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <div>
                    <p className={styles.scheduleTime}>{item.time}</p>
                    <p className={styles.scheduleLabel}>{item.label}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      <section className={cn(styles.section, styles.venueSection)}>
        <div className={styles.sectionInner}>
          <SectionHeading inverse eyebrow={t("venueEyebrow")}>
            {t("venueTitle")}
          </SectionHeading>
          <BotanicalDivider inverse />
          <div className={styles.mapFrame}>
            <div className={styles.mapMeta}>
              <p className={styles.cardKicker}>{invitationT("location")}</p>
              <h3>{invitationT("reception")}</h3>
              <p>{venue.address}</p>
              <MapDirectionsButton
                className={styles.directionButton}
                label={invitationT("directions")}
                query={mapQuery}
              />
            </div>
            {captureMode === true ? (
              <div aria-hidden className={styles.mapCaptureGarden}>
                <span className={styles.mapGardenArch} />
                <span className={styles.mapGardenPath} />
                <span className={styles.mapGardenPin} />
              </div>
            ) : captureMode === false ? (
              <InvitationMap
                className={styles.map}
                query={mapQuery}
                title={invitationT("map")}
              />
            ) : (
              <div aria-hidden className={styles.mapPlaceholder} />
            )}
          </div>
        </div>
      </section>

      {dressColors.length ? (
        <section className={cn(styles.section, styles.dressSection)}>
          <div className={cn(styles.sectionInner, styles.dressPanel)}>
            <DressCode
              colors={dressColors}
              heading={(
                <SectionHeading eyebrow={t("dressEyebrow")}>
                  {t("dressTitle")}
                </SectionHeading>
              )}
              headingColor={DEEP_GARDEN}
              subColor="#778B7C"
              subLabel={t("dressSubtitle")}
            />
          </div>
        </section>
      ) : null}

      <section className={cn(styles.section, styles.wishSection)}>
        <div className={styles.sectionInner}>
          <SectionHeading eyebrow={t("wishesEyebrow")}>
            {t("wishesTitle")}
          </SectionHeading>
          <BotanicalDivider />
          <div className={styles.wishForm}>
            <SharedWishForm
              accent={DEEP_GARDEN}
              centered
              fieldBorderColor="#A8B5AA"
              submitTextColor={IVORY}
            />
          </div>
          {wishes.length ? (
            <div className={styles.wishGrid}>
              {wishes.slice(0, 4).map((wish) => (
                <blockquote className={styles.wishCard} key={`${wish.name}-${wish.time}`}>
                  <p>{wish.text}</p>
                  <footer>{wish.name} · {formatWishTime(wish.time)}</footer>
                </blockquote>
              ))}
            </div>
          ) : null}
        </div>
      </section>

      {banks.length ? (
        <section className={cn(styles.section, styles.giftSection)}>
          <div className={styles.sectionInner}>
            <SectionHeading inverse eyebrow={t("giftEyebrow")}>
              {t("giftTitle")}
            </SectionHeading>
            <BotanicalDivider inverse />
            <p className={styles.giftIntro}>{t("giftIntro")}</p>
            <Image
              aria-hidden
              alt=""
              className={styles.giftArtwork}
              height={800}
              src={GARDEN_ENVELOPE}
              unoptimized
              width={1000}
            />
            <div className={styles.giftGrid}>
              <GiftQrGrid
                accent={IVORY}
                banks={banks}
                copyNumberLabel={invitationT("copyAccount")}
                heading={invitationT("gift")}
                headingClassName="font-art-cormorant font-medium normal-case tracking-normal"
                numberCopiedLabel={invitationT("accountCopied")}
                radiusClass="rounded-2xl"
                saveQrLabel={invitationT("saveQr")}
                stacked
              />
            </div>
          </div>
        </section>
      ) : null}

      <footer className={styles.footer}>
        {footerImage ? (
          <Image
            aria-hidden
            alt=""
            className={styles.footerImage}
            fill
            sizes="(max-width: 480px) 100vw, 480px"
            src={footerImage}
          />
        ) : null}
        <div aria-hidden className={styles.footerVeil} />
        <div className={styles.footerContent}>
          <p className={styles.footerMessage}>{t("footerMessage")}</p>
          <BotanicalDivider inverse />
          <p className={styles.footerNames}>
            <span>{people[0].shortName}</span>
            <small>{invitationT("and")}</small>
            <span>{people[1].shortName}</span>
          </p>
          <p className={styles.brand}>{invitationT("brandDomain")}</p>
        </div>
      </footer>
    </main>
  );
}

"use client";

import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import type { ReactNode } from "react";

import styles from "@/components/chungdoi-hoa-mai-thuy-mac.module.css";
import {
  buildCalendar,
  DressCode,
  formatWishTime,
  GiftEnvelope,
  googleCalendarUrl,
  InvitationMap,
  Lightbox,
  MapDirectionsButton,
  SharedCarousel,
  SharedRsvpForm,
  SharedWishForm,
  SharedWishList,
  useLightbox,
  WEEKDAY_LABELS,
} from "@/components/chungdoi-tpl-shared";
import type { ChungDoiDemoContent } from "@/data/chungdoi-demo-content";
import {
  invitationCeremonies,
  invitationGiftAccountLabel,
  invitationGiftAccounts,
  invitationHeroImage,
  invitationOpeningMessage,
  orderByBrideFirst,
  orderedCouple,
} from "@/lib/invitation-display";
import { cn } from "@/lib/utils";

const ARTWORK_ROOT = "/chungdoi/images/themes/hoa-mai-thuy-mac";

type SectionProps = {
  artwork?: ReactNode;
  children: ReactNode;
  className?: string;
  name: string;
};

function Section({ artwork, children, className, name }: SectionProps) {
  return (
    <section
      className={cn(styles.section, className)}
      data-hoa-mai-section={name}
    >
      {artwork}
      <div className={styles.contentRail}>{children}</div>
    </section>
  );
}

type SectionHeadingProps = {
  children: ReactNode;
  couple?: boolean;
  eyebrow?: ReactNode;
};

function SectionHeading({ children, couple = false, eyebrow }: SectionHeadingProps) {
  return (
    <header className={styles.sectionHeading}>
      {eyebrow ? <p className={styles.eyebrow}>{eyebrow}</p> : null}
      <h2 className={cn(styles.sectionTitle, couple && styles.coupleTitle)}>
        {children}
      </h2>
      <Image
        alt=""
        aria-hidden
        className={styles.headingDivider}
        height={220}
        src={`${ARTWORK_ROOT}/mai-divider.webp`}
        unoptimized
        width={1000}
      />
    </header>
  );
}

function formatEventDate(value: string, locale: string) {
  const parsed = new Date(`${value}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return value;
  return new Intl.DateTimeFormat(locale, {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(parsed);
}

type WatercolorArtworkProps = {
  className?: string;
  height: number;
  src: string;
  width: number;
};

function WatercolorArtwork({
  className,
  height,
  src,
  width,
}: WatercolorArtworkProps) {
  return (
    <Image
      alt=""
      aria-hidden
      className={cn(styles.artwork, className)}
      height={height}
      src={`${ARTWORK_ROOT}/${src}`}
      unoptimized
      width={width}
    />
  );
}

export function HoaMaiThuyMacInvitation({
  content,
}: {
  content: ChungDoiDemoContent;
}) {
  const locale = useLocale();
  const t = useTranslations("hoaMaiThuyMac");
  const invitationT = useTranslations("invitationTemplate");
  const { couple, families, venue } = content;
  const people = orderedCouple(content);
  const ceremonies = invitationCeremonies(content);
  const heroImage = invitationHeroImage(content);
  const storyImage = content.gallery.find((photo) => photo.trim()) || heroImage;
  const calendar = buildCalendar(content.couple.date);
  const { lightbox, setLightbox } = useLightbox(content.gallery.length);
  const mapQuery = venue.mapAddress || venue.address;
  const dressColors = (content.dressCodeColors ?? "")
    .split(",")
    .map((color) => color.trim())
    .filter((color) => /^#[0-9a-fA-F]{6}$/.test(color))
    .map((color) => ({
      border: color.toLowerCase() === "#f3e9d7" ? "#7A8972" : undefined,
      color,
    }));
  const banks = invitationGiftAccounts(content).map((account) => ({
    bank: account.bank,
    label: invitationGiftAccountLabel(account.birthOrder, account.shortName, " "),
    name: account.name,
    num: account.num,
  }));
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
  const photoAlt = invitationT("weddingPhotoAlt", {
    couple: `${people[0].shortName} ${invitationT("and")} ${people[1].shortName}`,
  });

  return (
    <main
      className={styles.template}
      data-hoa-mai-template
      data-template-slug={content.slug}
    >
      <Section
        artwork={
          <>
            <WatercolorArtwork
              className={styles.foundationCanopy}
              height={771}
              src="mai-branch-canopy.webp"
              width={2000}
            />
            <WatercolorArtwork
              className={styles.foundationMountains}
              height={724}
              src="wash-mountains-wide.webp"
              width={2172}
            />
            <WatercolorArtwork
              className={styles.floatingPetals}
              height={1000}
              src="petals.webp"
              width={1000}
            />
          </>
        }
        className={styles.hero}
        name="hero"
      >
        <p className={styles.heroEyebrow}>{t("heroEyebrow")}</p>
        {heroImage ? (
          <figure className={styles.heroFrame}>
            <Image
              alt={photoAlt}
              className={styles.photo}
              fill
              priority
              sizes="(max-width: 792px) calc(100vw - 32px), 760px"
              src={heroImage}
            />
          </figure>
        ) : null}
        <SectionHeading couple>
          <span>{people[0].shortName}</span>
          <span className={styles.ampersand}>&amp;</span>
          <span>{people[1].shortName}</span>
        </SectionHeading>
        <p className={styles.heroDate}>
          {formatEventDate(couple.date, locale)} · {couple.time}
        </p>
      </Section>

      <Section
        artwork={
          <>
            <WatercolorArtwork
              className={styles.familyBranchLeft}
              height={800}
              src="mai-branch-left.webp"
              width={1200}
            />
            <WatercolorArtwork
              className={styles.familyBranchRight}
              height={1230}
              src="mai-branch-right.webp"
              width={1200}
            />
          </>
        }
        className={styles.familySection}
        name="families"
      >
        <SectionHeading eyebrow={t("familyEyebrow")}>
          {t("familyTitle")}
        </SectionHeading>

        <div className={styles.familySequence}>
          <article className={styles.familyCard}>
            <p className={styles.cardKicker}>{familiesInOrder[0].side}</p>
            <h3>{familiesInOrder[0].title}</h3>
            <p>{familiesInOrder[0].father}</p>
            <p>{familiesInOrder[0].mother}</p>
            <address>{familiesInOrder[0].address}</address>
          </article>

          <div className={styles.coupleAnnouncement}>
            <p className={styles.openingMessage}>
              {invitationOpeningMessage(content)}
            </p>
            <p className={styles.personBirthOrder}>{people[0].birthOrder}</p>
            <h3>{people[0].fullName}</h3>
            <span className={styles.smallAmpersand}>&amp;</span>
            <p className={styles.personBirthOrder}>{people[1].birthOrder}</p>
            <h3>{people[1].fullName}</h3>
          </div>

          <div className={styles.ceremonyStack} data-template-ceremonies>
            {ceremonies.map((ceremony, index) => (
              <article
                className={styles.ceremonyCard}
                data-template-ceremony-item
                key={`${ceremony.title}-${ceremony.date}-${ceremony.time}-${index}`}
              >
                <p className={styles.cardKicker}>
                  {t("ceremonyItem", { number: index + 1 })}
                </p>
                <h3>{ceremony.title}</h3>
                <time dateTime={`${ceremony.date}T${ceremony.time}`}>
                  <span>{formatEventDate(ceremony.date, locale)}</span>
                  <strong>{ceremony.time}</strong>
                </time>
              </article>
            ))}
          </div>

          <article className={styles.familyCard}>
            <p className={styles.cardKicker}>{familiesInOrder[1].side}</p>
            <h3>{familiesInOrder[1].title}</h3>
            <p>{familiesInOrder[1].father}</p>
            <p>{familiesInOrder[1].mother}</p>
            <address>{familiesInOrder[1].address}</address>
          </article>
        </div>
      </Section>

      <Section
        artwork={
          <>
            <WatercolorArtwork
              className={styles.storyCluster}
              height={1000}
              src="mai-cluster-round.webp"
              width={1000}
            />
            <WatercolorArtwork
              className={styles.storyRiver}
              height={724}
              src="wash-river-wide.webp"
              width={2172}
            />
          </>
        }
        className={styles.storySection}
        name="story"
      >
        <SectionHeading eyebrow={t("storyEyebrow")}>
          {t("storyTitle")}
        </SectionHeading>
        {storyImage ? (
          <figure className={styles.storyFrame}>
            <Image
              alt={photoAlt}
              className={styles.photo}
              fill
              sizes="(max-width: 620px) calc(100vw - 64px), 520px"
              src={storyImage}
            />
          </figure>
        ) : null}
        <blockquote className={styles.storyQuote}>{t("storyLine")}</blockquote>
      </Section>

      <Section className={styles.gallerySection} name="gallery">
        <SectionHeading eyebrow={t("galleryEyebrow")}>
          {t("galleryTitle")}
        </SectionHeading>
        {content.gallery.length > 0 ? (
          <>
            <div
              className={styles.carouselFrame}
              onClickCapture={(event) => {
                const target = event.target;
                if (!(target instanceof HTMLImageElement)) return;
                const source = target.getAttribute("src");
                const index = source
                  ? content.gallery.findIndex((photo) => source.includes(photo))
                  : -1;
                setLightbox(index >= 0 ? index : 0);
              }}
            >
              <SharedCarousel
                arrowColor="#FFF8E8"
                className={styles.carousel}
                photos={content.gallery}
              />
            </div>
            <button
              className={styles.textButton}
              onClick={() => setLightbox(0)}
              type="button"
            >
              {invitationT("album")}
            </button>
            <Lightbox
              accent="#DFAE37"
              gallery={content.gallery}
              index={lightbox}
              modal
              setIndex={setLightbox}
            />
          </>
        ) : null}
      </Section>

      <Section
        artwork={
          <WatercolorArtwork
            className={styles.dateBranch}
            height={771}
            src="mai-branch-canopy.webp"
            width={2000}
          />
        }
        className={styles.dateSection}
        name="date"
      >
        <SectionHeading eyebrow={t("dateEyebrow")}>
          {t("dateTitle")}
        </SectionHeading>

        <div className={styles.informationFlow}>
          {calendar ? (
            <article className={styles.calendarCard}>
              <p className={styles.cardKicker}>{t("calendarNote")}</p>
              <h3>{invitationT("calendar", { month: calendar.month })}</h3>
              <p className={styles.calendarYear}>{calendar.year}</p>
              <div className={styles.calendarDays}>
                {WEEKDAY_LABELS.map((label) => (
                  <span className={styles.weekday} key={label}>
                    {label}
                  </span>
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
              <a
                className={styles.primaryButton}
                href={googleCalendarUrl(content)}
                rel="noreferrer"
                target="_blank"
              >
                {invitationT("addToCalendar")}
              </a>
            </article>
          ) : null}

          <article className={styles.scheduleCard}>
            <p className={styles.cardKicker}>{t("scheduleEyebrow")}</p>
            <h3>{t("scheduleTitle")}</h3>
            <ol className={styles.scheduleList}>
              {content.schedule.map((item, index) => (
                <li key={`${item.time}-${item.label}-${index}`}>
                  <time>{item.time}</time>
                  <span aria-hidden className={styles.scheduleDot} />
                  <p>{item.label}</p>
                </li>
              ))}
            </ol>
          </article>

          {dressColors.length > 0 ? (
            <article className={styles.dressCard}>
              <DressCode
                colors={dressColors}
                heading={<h3>{t("dressTitle")}</h3>}
                headingColor="#4A3529"
                subColor="#6F775F"
                subLabel={t("dressSubtitle")}
              />
            </article>
          ) : null}
        </div>
      </Section>

      {mapQuery ? (
        <Section
          artwork={
            <WatercolorArtwork
              className={styles.mapRiver}
              height={724}
              src="wash-river-wide.webp"
              width={2172}
            />
          }
          className={styles.mapSection}
          name="map"
        >
          <SectionHeading eyebrow={t("venueEyebrow")}>
            {t("venueTitle")}
          </SectionHeading>
          <p className={styles.venueAddress}>{venue.address}</p>
          <div className={styles.mapFrame}>
            <InvitationMap
              className={styles.map}
              loading="lazy"
              query={mapQuery}
              referrerPolicy="no-referrer-when-downgrade"
              title={invitationT("map")}
            />
          </div>
          <MapDirectionsButton
            className={styles.primaryButton}
            label={invitationT("directions")}
            query={mapQuery}
          />
        </Section>
      ) : null}

      <Section
        artwork={
          <WatercolorArtwork
            className={styles.rsvpPetals}
            height={1000}
            src="petals.webp"
            width={1000}
          />
        }
        className={styles.rsvpSection}
        name="rsvp"
      >
        <SectionHeading eyebrow={t("rsvpEyebrow")}>
          {t("rsvpTitle")}
        </SectionHeading>
        <p className={styles.sectionIntro}>{t("rsvpIntro")}</p>
        <div className={styles.formPaper}>
          <SharedRsvpForm
            accent="#A16F16"
            centered
            previewFallback={
              <p className={styles.previewNotice}>
                {invitationT("rsvpPreviewNotice")}
              </p>
            }
            submitTextColor="#FFF9E9"
          />
        </div>
      </Section>

      <Section className={styles.wishesSection} name="wishes">
        <SectionHeading eyebrow={t("wishesEyebrow")}>
          {t("wishesTitle")}
        </SectionHeading>
        <div className={styles.wishesFlow}>
          <SharedWishList
            accent="#A16F16"
            collapseLabel={invitationT("collapseWishes")}
            initialCount={3}
            listClassName={styles.wishList}
            renderWish={(wish) => (
              <blockquote className={styles.wishCard}>
                <p>{wish.text}</p>
                <footer>
                  <strong>{wish.name}</strong>
                  <time>{formatWishTime(wish.time)}</time>
                </footer>
              </blockquote>
            )}
            showAllLabel={invitationT("showAllWishes")}
            wishes={content.wishes}
          />
          <div className={styles.formPaper}>
            <SharedWishForm
              accent="#A16F16"
              centered
              fieldBorderColor="#B89C73"
              previewNotice={invitationT("formPreviewNotice")}
              submitTextColor="#FFF9E9"
            />
          </div>
        </div>
      </Section>

      {banks.length > 0 ? (
        <Section
          artwork={
            <WatercolorArtwork
              className={styles.giftCluster}
              height={1000}
              src="mai-cluster-round.webp"
              width={1000}
            />
          }
          className={styles.giftSection}
          name="gift"
        >
          <p className={styles.eyebrow}>{t("giftEyebrow")}</p>
          <p className={styles.giftIntro}>{t("giftIntro")}</p>
          <GiftEnvelope
            accent="#DFAE37"
            artworkVariant="source"
            banks={banks}
            cardBg="#F3E9D7"
            dark="#A95231"
            heading={t("giftTitle")}
            headingClassName={styles.giftHeading}
            labelColor="#6F775F"
            openLabel={invitationT("giftEnvelopeHint")}
            sparkleColor="#DFAE37"
            stacked
            templateSlug={content.slug}
          />
        </Section>
      ) : null}

      <Section
        artwork={
          <WatercolorArtwork
            className={styles.footerCanopy}
            height={771}
            src="mai-branch-canopy.webp"
            width={2000}
          />
        }
        className={styles.footerSection}
        name="footer"
      >
        <footer data-template-footer>
          <p className={styles.footerMessage}>{t("footerMessage")}</p>
          <p className={styles.footerNames}>
            {people[0].shortName}
            <span>&amp;</span>
            {people[1].shortName}
          </p>
          <p data-invitation-clearance="margin" className={styles.brand}>{invitationT("brandDomain")}</p>
        </footer>
      </Section>
    </main>
  );
}

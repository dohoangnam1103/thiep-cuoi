"use client";

import type { ReactNode } from "react";

import type { ChungDoiDemoContent } from "@/data/chungdoi-demo-content";
import {
  AlbumGallery,
  buildCalendar,
  DressCode,
  formatDate,
  formatWishTime,
  GiftQrGrid,
  GiftEnvelope,
  googleCalendarUrl,
  InvitationMap,
  MapDirectionsButton,
  SharedCountdown,
  SharedRsvpForm,
  SharedWishForm,
  SharedWishList,
  WEEKDAY_LABELS,
} from "@/components/chungdoi-tpl-shared";
import {
  invitationCeremonies,
  invitationGiftAccounts,
  invitationHeroImage,
  invitationOpeningMessage,
  orderByBrideFirst,
  orderedCouple,
  orderedHeroPhotos,
} from "@/lib/invitation-display";
import { resolveArtDisplayFontClass } from "@/lib/art-invitation-typography";
import { invitationBodyFontClass } from "@/lib/invitation-fonts";
import { cn } from "@/lib/utils";

export type ArtInvitationLayout =
  | "folk"
  | "split"
  | "dark-stage"
  | "poster"
  | "quiet"
  | "chrome";

export type InvitationTranslationKey =
  | "invitation"
  | "and"
  | "respectfulInvitation"
  | "brideFamily"
  | "groomFamily"
  | "parents"
  | "bride"
  | "groom"
  | "ceremony"
  | "reception"
  | "remaining"
  | "addToCalendar"
  | "calendar"
  | "album"
  | "timeline"
  | "map"
  | "dressCode"
  | "guestbook"
  | "gift"
  | "rsvpHeading"
  | "copyAccount"
  | "accountCopied"
  | "showAllWishes"
  | "collapseWishes"
  | "giftFlipFront"
  | "giftFlipHint"
  | "giftFlipBack"
  | "presenceHonor"
  | "weddingPhotoAlt";

export type InvitationTranslator = (
  key: InvitationTranslationKey,
  values?: Record<string, string | number>,
) => string;

export type ArtInvitationConfig = {
  layout: ArtInvitationLayout;
  artwork: string;
  pageClass: string;
  heroClass: string;
  surfaceClass: string;
  sectionClass: string;
  inkClass: string;
  mutedClass: string;
  accentTextClass: string;
  accentBgClass: string;
  borderClass: string;
  buttonClass: string;
  displayFontClass: string;
  coupleClass: string;
  headingClass: string;
  imageClass: string;
  radiusClass: string;
  accentHex: string;
  inkHex: string;
  /** `"flip"` renders the gift section as two-sided cards instead of the flat
   * QR grid. Defaults to `"grid"` so existing templates are untouched. */
  giftLayout?: "grid" | "flip";
  parallaxArtwork?: boolean;
  detailArtwork?: string;
  heroArtwork?: boolean;
  heroHeightClass?: string;
  portraitClass?: string;
  portraitFrameArtwork?: string;
  coupleRules?: boolean;
  portraitBorder?: boolean;
  giftFrontArtwork?: string;
  sectionArtwork?: string;
  sectionArtworkBouquet?: boolean;
  sectionArtworkVariants?: string[];
  formSubmitTextColor?: string;
  columnClass?: string;
};

function contentRadiusClass() {
  return "rounded-[1.5rem]";
}

function ParallaxArtwork({ config }: { config: ArtInvitationConfig }) {
  return (
    <div
      data-parallax="artwork"
      className="pointer-events-none fixed inset-y-0 left-1/2 z-20 w-full max-w-[900px] -translate-x-1/2 overflow-hidden"
      aria-hidden="true"
    >
      <div className="invitation-parallax-motif invitation-parallax-left absolute -left-[28%] top-[8%] h-[46vh] min-h-[360px] max-h-[560px] w-[62%] opacity-[0.1] sm:opacity-[0.13]">
        <img src={config.artwork} alt="" className={cn("h-full w-full object-cover", config.imageClass)} />
      </div>
      <div className="invitation-parallax-motif invitation-parallax-right absolute -right-[26%] top-[46%] h-[50vh] min-h-[400px] max-h-[620px] w-[64%] opacity-[0.08] sm:opacity-[0.11]">
        <img src={config.artwork} alt="" className={cn("h-full w-full object-cover", config.imageClass)} />
      </div>
      <div className="invitation-parallax-motif invitation-parallax-center absolute bottom-[-18%] left-[18%] h-[42vh] min-h-[340px] max-h-[520px] w-[64%] opacity-[0.05] sm:opacity-[0.07]">
        <img src={config.artwork} alt="" className={cn("h-full w-full object-cover", config.imageClass)} />
      </div>
    </div>
  );
}

function HeroNames({
  people,
  config,
  t,
}: {
  people: ReturnType<typeof orderedCouple>;
  config: ArtInvitationConfig;
  t: InvitationTranslator;
}) {
  return (
    <div className={cn("relative z-10", config.inkClass)}>
      <p className={cn("mb-7 text-[10px] font-semibold uppercase tracking-[0.34em]", config.accentTextClass)}>
        {t("invitation")}
      </p>
      <h2 data-invitation-short-name className={cn("text-balance", config.displayFontClass, config.coupleClass, "text-[clamp(2.75rem,15cqw,4.75rem)]")}>{people[0].shortName}</h2>
      <div className="my-3 flex items-center justify-center gap-4">
        {config.coupleRules !== false ? <span className={cn("h-px flex-1", config.accentBgClass)} /> : null}
        <span className={cn("text-lg", config.accentTextClass)}>{t("and")}</span>
        {config.coupleRules !== false ? <span className={cn("h-px flex-1", config.accentBgClass)} /> : null}
      </div>
      <h2 data-invitation-short-name className={cn("text-balance", config.displayFontClass, config.coupleClass, "text-[clamp(2.75rem,15cqw,4.75rem)]")}>{people[1].shortName}</h2>
    </div>
  );
}

function HeroPortraits({
  config,
  content,
  people,
  t,
}: {
  config: ArtInvitationConfig;
  content: ChungDoiDemoContent;
  people: ReturnType<typeof orderedCouple>;
  t: InvitationTranslator;
}) {
  const usesTwoPhotos = ["folk", "poster", "quiet"].includes(config.layout);
  const photos = usesTwoPhotos
    ? orderedHeroPhotos(content, { albumFallback: true })
    : [invitationHeroImage(content)];
  const visiblePhotos = photos.filter((photo) => photo.trim());

  if (!visiblePhotos.length) return null;

  return (
    <div data-hero-portraits className="space-y-5 px-4 pb-8">
      {visiblePhotos.map((photo, index) => {
        const person = usesTwoPhotos ? people[index] : null;
        const alt = t("weddingPhotoAlt", {
          couple: person?.shortName || `${people[0].shortName} ${t("and")} ${people[1].shortName}`,
        });

        const portrait = (
          <figure
            key={`${photo}-${index}`}
            data-hero-portrait
            className={cn(
              "invitation-photo-reveal relative overflow-hidden",
              config.portraitBorder !== false ? cn("border", config.borderClass) : "border-0",
              contentRadiusClass(),
              usesTwoPhotos && index === 0 ? "mr-auto w-[86%] max-w-[680px]" : "ml-auto w-[86%] max-w-[680px]",
              !usesTwoPhotos && "mx-auto w-full max-w-[720px]",
              config.portraitClass ?? "aspect-[4/5]",
            )}
          >
            <img
              src={photo}
              alt={alt}
              className="h-full w-full object-cover object-center"
            />
          </figure>
        );

        return config.portraitFrameArtwork ? (
          <div key={`${photo}-${index}`} data-portrait-frame>
            <img
              src={config.portraitFrameArtwork}
              alt=""
              aria-hidden="true"
              data-portrait-frame-artwork
              loading="lazy"
            />
            {portrait}
          </div>
        ) : portrait;
      })}
    </div>
  );
}

function ArtworkHero({
  config,
  content,
  t,
}: {
  config: ArtInvitationConfig;
  content: ChungDoiDemoContent;
  t: InvitationTranslator;
}) {
  const people = orderedCouple(content);
  const date = formatDate(content.couple.date);
  const names = <HeroNames people={people} config={config} t={t} />;
  const dateLine = date ? `${date.day}.${date.month}.${date.yearNumber}` : "";

  return (
    <section className="relative z-30 w-full overflow-hidden">
      <div
        data-artwork-hero="true"
        className={cn(
          "relative flex flex-col justify-end overflow-hidden",
          config.heroHeightClass ?? "min-h-[clamp(760px,100svh,1080px)]",
          config.heroClass,
        )}
      >
        {config.heroArtwork !== false ? (
          <img
            src={config.artwork}
            alt=""
            aria-hidden="true"
            className={cn(
              "invitation-hero-artwork invitation-hero-parallax absolute inset-0 h-full w-full object-cover object-center",
              config.imageClass,
            )}
          />
        ) : null}
        {config.detailArtwork ? (
          <>
            <img src={config.detailArtwork} alt="" aria-hidden="true" className="hero-bouquet hero-bouquet-a" />
            <img src={config.sectionArtworkVariants?.[0] ?? config.detailArtwork} alt="" aria-hidden="true" className="hero-bouquet hero-bouquet-b" />
            <img src={config.sectionArtworkVariants?.[1] ?? config.detailArtwork} alt="" aria-hidden="true" className="hero-bouquet hero-bouquet-c" />
            <img src={config.detailArtwork} alt="" aria-hidden="true" className="hero-bouquet hero-bouquet-d" />
            <img src={config.sectionArtworkVariants?.[0] ?? config.detailArtwork} alt="" aria-hidden="true" className="hero-bouquet hero-bouquet-e" />
            <img src={config.sectionArtworkVariants?.[1] ?? config.detailArtwork} alt="" aria-hidden="true" className="hero-bouquet hero-bouquet-f" />
            <img src={config.sectionArtwork ?? config.detailArtwork} alt="" aria-hidden="true" className="hero-bouquet hero-bouquet-g" />
            <img src={config.sectionArtworkVariants?.[0] ?? config.detailArtwork} alt="" aria-hidden="true" className="hero-bouquet hero-bouquet-h" />
            <img src={config.sectionArtwork ?? config.detailArtwork} alt="" aria-hidden="true" className="hero-bouquet hero-bouquet-i" />
          </>
        ) : null}
        <div data-artwork-hero-content className="relative z-10 px-6 pb-14 pt-36 text-center sm:px-9 sm:pb-20">
          <span className={cn("text-xs tabular-nums tracking-[0.2em]", config.mutedClass)}>
            {dateLine}
          </span>
          <div className="mt-10">
            {names}
          </div>
          <p className={cn("mx-auto mt-8 max-w-[34ch] text-sm leading-7", config.mutedClass)}>
            {invitationOpeningMessage(content)}
          </p>
        </div>
      </div>
      <HeroPortraits config={config} content={content} people={people} t={t} />
    </section>
  );
}

function SectionFlowers({ src, bouquet = false, variants = [] }: { src: string; bouquet?: boolean; variants?: string[] }) {
  if (bouquet) {
    return (
      <div data-section-bouquet aria-hidden="true" className="pointer-events-none relative">
        {[src, ...variants].map((artwork, index) => (
          <img key={artwork} src={artwork} alt="" loading="lazy" className={`bouquet-variant bouquet-variant-${index} absolute object-contain`} />
        ))}
      </div>
    );
  }
  return (
    <div data-section-flowers aria-hidden="true" className="pointer-events-none mx-auto mb-5 flex w-fit items-center justify-center gap-1 px-5 py-3">
      <img src={src} alt="" loading="lazy" className="h-14 w-12 -rotate-[24deg] object-contain sm:h-16 sm:w-14" />
      <img src={src} alt="" loading="lazy" className="h-20 w-[70px] object-contain sm:h-24 sm:w-20" />
      <img src={src} alt="" loading="lazy" className="h-14 w-12 rotate-[24deg] object-contain sm:h-16 sm:w-14" />
    </div>
  );
}

function SectionHeading({
  children,
  config,
}: {
  children: ReactNode;
  config: ArtInvitationConfig;
}) {
  return (
    <>
      {config.sectionArtwork ? <SectionFlowers src={config.sectionArtwork} variants={config.sectionArtworkVariants} bouquet={config.sectionArtworkBouquet} /> : null}
      <h2 className={cn("text-balance", config.displayFontClass, config.headingClass, config.inkClass, "text-[clamp(1.75rem,8cqw,2.5rem)]")}>
        {children}
      </h2>
    </>
  );
}

function EventCard({
  label,
  message,
  date,
  time,
  config,
}: {
  label: string;
  message: string;
  date: ReturnType<typeof formatDate>;
  time: string;
  config: ArtInvitationConfig;
}) {
  return (
    <article className={cn("border p-7 sm:p-8", config.surfaceClass, config.borderClass, contentRadiusClass())}>
      <h3 className={cn("text-xs font-semibold uppercase tracking-[0.22em]", config.displayFontClass, config.accentTextClass)}>{label}</h3>
      <p className={cn("mt-6 whitespace-pre-line text-base leading-7", config.inkClass)}>{message}</p>
      {date ? (
        <p className={cn("mt-8 text-3xl font-semibold tabular-nums", config.inkClass)}>
          {date.day}.{date.month}
        </p>
      ) : null}
      <p className={cn("mt-2 text-sm", config.mutedClass)}>{time}</p>
    </article>
  );
}

export function ArtInvitation({
  content,
  config,
  t,
}: {
  content: ChungDoiDemoContent;
  config: ArtInvitationConfig;
  t: InvitationTranslator;
}) {
  const { couple, families, venue, schedule, gallery, wishes } = content;
  const displayFontClass = resolveArtDisplayFontClass(
    content.theme.fontFamily,
    config.displayFontClass,
  );
  // Body font suy ra từ display để cặp font luôn hợp tông, kể cả khi người dùng
  // đổi font trong editor. Áp ở <main> rồi để mọi text con thừa hưởng — nhờ vậy
  // thiệp chỉ có đúng 2 family: display + body.
  const bodyFontClass = invitationBodyFontClass(displayFontClass);
  const effectiveConfig = { ...config, displayFontClass };
  const people = orderedCouple(content);
  const ceremonies = invitationCeremonies(content);
  const receptionDate = formatDate(couple.date);
  const calendar = buildCalendar(couple.date);
  const mapQuery = venue.mapAddress || venue.address.replace(/\n+/g, ", ").trim();
  const familyPair = orderByBrideFirst(
    {
      side: t("brideFamily"),
      father: families.brideFather,
      mother: families.brideMother,
      address: families.brideAddress,
      title: families.brideParentTitle || t("parents"),
    },
    {
      side: t("groomFamily"),
      father: families.groomFather,
      mother: families.groomMother,
      address: families.groomAddress,
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
    .map((color) => ({ color }));

  return (
    <main className={cn("relative z-40 min-h-[100dvh] w-full overflow-hidden", bodyFontClass, config.pageClass)}>
      <div
        data-invitation-column="true"
        className={cn("relative mx-auto w-full max-w-[900px] [container-type:inline-size]", config.columnClass)}
      >
        {config.parallaxArtwork !== false ? <ParallaxArtwork config={config} /> : null}
        <ArtworkHero config={effectiveConfig} content={content} t={t} />

        <div className="relative z-30 mx-auto w-full max-w-[760px] px-5 py-16 text-center sm:px-8 sm:py-20">
        <section className={cn("space-y-9", config.sectionClass)}>
          <SectionHeading config={effectiveConfig}>{t("respectfulInvitation")}</SectionHeading>
          <div>
            <p className={cn("text-lg leading-8", config.inkClass)}>
              {invitationOpeningMessage(content)}
            </p>
            <div className="mt-10 space-y-8">
              {familyPair.map((family) => (
                <div key={family.side}>
                  <h3 className={cn("text-xs font-semibold uppercase tracking-[0.2em]", effectiveConfig.displayFontClass, config.accentTextClass)}>{family.side}</h3>
                  <p className={cn("mt-4 font-semibold", config.inkClass)}>{family.title} {family.father}</p>
                  <p className={cn("font-semibold", config.inkClass)}>{family.title} {family.mother}</p>
                  <p className={cn("mt-2 text-sm leading-6", config.mutedClass)}>{family.address}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section data-template-ceremonies data-art-ceremonies className="mt-20 space-y-5">
          {ceremonies.map((ceremony, index) => (
            <div
              key={`${ceremony.title}-${ceremony.date}-${ceremony.time}-${index}`}
              data-template-ceremony-item
            >
              <EventCard
                label={t("ceremony")}
                message={ceremony.title}
                date={formatDate(ceremony.date)}
                time={ceremony.time}
                config={effectiveConfig}
              />
            </div>
          ))}
          <EventCard
            label={t("reception")}
            message={venue.address}
            date={receptionDate}
            time={venue.banquetTime || couple.time}
            config={effectiveConfig}
          />
        </section>

        <section className="mt-20 space-y-10">
          <div>
            <SectionHeading config={effectiveConfig}>{t("remaining")}</SectionHeading>
            <SharedCountdown
              target={`${couple.date}T${couple.time}`}
              className={cn("mt-6 text-center text-2xl font-semibold tabular-nums", config.inkClass)}
            />
            <a
              href={googleCalendarUrl(content)}
              target="_blank"
              rel="noreferrer"
              className={cn("mt-7 inline-flex whitespace-nowrap px-5 py-3 text-sm font-semibold transition motion-safe:hover:-translate-y-0.5", config.buttonClass, config.radiusClass)}
            >
              {t("addToCalendar")}
            </a>
          </div>
          {calendar ? (
            <div className={cn("border p-6 sm:p-8", config.surfaceClass, config.borderClass, contentRadiusClass())}>
              <h3 className={cn("text-lg font-semibold", effectiveConfig.displayFontClass, config.inkClass)}>{t("calendar", { month: calendar.month })}</h3>
              <div className="mt-6 grid grid-cols-7 gap-1 text-center">
                {WEEKDAY_LABELS.map((label) => (
                  <span key={label} className={cn("py-2 text-[10px] font-semibold", config.mutedClass)}>{label}</span>
                ))}
                {calendar.cells.map((day, index) => (
                  <span
                    key={`${day ?? "empty"}-${index}`}
                    className={cn(
                      "flex aspect-square items-center justify-center text-xs tabular-nums",
                      day === calendar.highlight ? cn(config.accentBgClass, config.buttonClass, config.radiusClass) : config.inkClass,
                    )}
                  >
                    {day}
                  </span>
                ))}
              </div>
            </div>
          ) : null}
        </section>

        <section className="mt-20">
          <SectionHeading config={effectiveConfig}>{t("album")}</SectionHeading>
          <div className="mt-8 flex justify-center">
            <AlbumGallery
              photos={gallery}
              layout={content.albumLayout ?? "mosaic"}
              accent={config.accentHex}
              radiusClass={contentRadiusClass()}
            />
          </div>
        </section>

        {schedule.length ? (
          <section className="mt-20">
            <SectionHeading config={effectiveConfig}>{t("timeline")}</SectionHeading>
            <div className={cn("mt-8 grid gap-px overflow-hidden border", config.borderClass, contentRadiusClass())}>
              {schedule.map((item) => (
                <div key={`${item.time}-${item.label}`} className={cn("flex flex-col items-center gap-2 p-5 text-center", config.surfaceClass)}>
                  <span className={cn("font-semibold tabular-nums", config.accentTextClass)}>{item.time}</span>
                  <span className={config.inkClass}>{item.label}</span>
                </div>
              ))}
            </div>
          </section>
        ) : null}

        <section className="mt-20 space-y-8">
          <div>
            <SectionHeading config={effectiveConfig}>{t("map")}</SectionHeading>
            <p className={cn("mt-5 whitespace-pre-line text-sm leading-7", config.mutedClass)}>{venue.address}</p>
            <MapDirectionsButton query={mapQuery} className={cn(config.inkClass, config.radiusClass)} />
          </div>
          <InvitationMap
            query={mapQuery}
            className={cn("h-[360px] w-full border grayscale-[0.15]", config.borderClass, contentRadiusClass())}
          />
        </section>

        {dressColors.length ? (
          <section className={cn("mt-20 border p-8", config.surfaceClass, config.borderClass, contentRadiusClass())}>
            <DressCode
              colors={dressColors}
              heading={<SectionHeading config={effectiveConfig}>{t("dressCode")}</SectionHeading>}
              headingColor={config.inkHex}
              subColor={config.inkHex}
            />
          </section>
        ) : null}

        <SharedRsvpForm
          accent={config.accentHex}
          submitTextColor={config.formSubmitTextColor}
          centered
          className="mt-20"
          heading={<SectionHeading config={effectiveConfig}>{t("rsvpHeading")}</SectionHeading>}
        />

        <section className="mt-20">
          <SectionHeading config={effectiveConfig}>{t("guestbook")}</SectionHeading>
          <SharedWishForm accent={config.accentHex} submitTextColor={config.formSubmitTextColor} centered />
          <SharedWishList
            wishes={wishes}
            accent={config.accentHex}
            className="mt-8"
            showAllLabel={t("showAllWishes")}
            collapseLabel={t("collapseWishes")}
            renderWish={(wish) => (
              <blockquote className={cn("border p-6", config.surfaceClass, config.borderClass, contentRadiusClass())}>
                <p className={cn("leading-7", config.inkClass)}>{wish.text}</p>
                <footer className={cn("mt-4 text-xs", config.mutedClass)}>{wish.name} / {formatWishTime(wish.time)}</footer>
              </blockquote>
            )}
          />
        </section>

        {banks.length ? (
          <section className="mt-20">
            {config.giftLayout === "flip" ? (
              <>
                <GiftEnvelope
                  templateSlug={content.slug}
                  banks={banks}
                  accent={config.accentHex}
                  dark="#6b101c"
                  cardBg="#fff7eb"
                  heading={t("gift")}
                  openLabel={t("giftFlipHint")}
                  labelColor="#6b101c"
                  headingClassName={cn("text-center text-xl font-normal md:text-2xl", effectiveConfig.displayFontClass)}
                />
              </>
            ) : (
              <GiftQrGrid
                banks={banks}
                heading={t("gift")}
                accent={config.accentHex}
                radiusClass={contentRadiusClass()}
                copyNumberLabel={t("copyAccount")}
                numberCopiedLabel={t("accountCopied")}
                headingClassName={effectiveConfig.displayFontClass}
              />
            )}
          </section>
        ) : null}

        <footer className={cn("mt-24 border-t pt-10 text-center", config.borderClass)}>
          {config.sectionArtwork ? <SectionFlowers src={config.sectionArtwork} variants={config.sectionArtworkVariants} bouquet={config.sectionArtworkBouquet} /> : null}
          <p className={cn("text-sm leading-7", config.mutedClass)}>{t("presenceHonor")}</p>
          {/* Mỗi tên một dòng riêng: màn hình hẹp không còn cắt tên ở vị trí bất kỳ. */}
          <p className={cn("mt-4 flex flex-col items-center text-lg font-semibold leading-snug", config.inkClass)}>
            <span className="block">{people[0].shortName}</span>
            <span className={cn("block text-base font-normal", config.mutedClass)}>{t("and")}</span>
            <span className="block">{people[1].shortName}</span>
          </p>
        </footer>
        </div>
      </div>
    </main>
  );
}

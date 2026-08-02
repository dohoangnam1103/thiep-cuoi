"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import {
  AlbumGallery,
  GiftEnvelope,
  InvitationMap,
  MapDirectionsButton,
  SharedWishForm,
  formatWishTime,
} from "@/components/chungdoi-tpl-shared";
import type { ChungDoiDemoContent } from "@/data/chungdoi-demo-content";
import {
  invitationCeremonies,
  invitationOpeningMessage,
  orderedCouple,
} from "@/lib/invitation-display";
import { cn } from "@/lib/utils";

import {
  buildDalatInvitationContract,
  type DalatInvitationLabels,
} from "./dalat-invitation-contract";
import {
  dalatJourneyDefinition,
  type DalatJourneyCopy,
} from "@/data/dalat-journey";
import styles from "./dalat-journey.module.css";
import {
  getInvitationContentState,
  INVITATION_SCENIC_PAUSE_MS,
  type InvitationContentState,
} from "./invitation-content-visibility";
import {
  DIEGETIC_ANCHORS,
  type DiegeticSurfaceKind,
} from "./diegetic-anchors";
import type { JourneyPhase } from "./journey-controller";

const SURFACE_CLASS_BY_KIND = {
  book: styles.diegeticBook,
  glass: styles.diegeticGlass,
  greenhouse: styles.diegeticGreenhouse,
  pavilion: styles.diegeticPavilion,
  stone: styles.diegeticStone,
} satisfies Record<DiegeticSurfaceKind, string>;

const CONTENT_ROLE_BY_ID = {
  mistGate: "intro",
  memoryPines: "album",
  timeGlasshouse: "schedule",
  lakePavilion: "map",
  wishValley: "wishes",
} as const;

const FEATURE_LABEL_BY_ID = {
  mistGate: "cover",
  memoryPines: "album",
  timeGlasshouse: "schedule",
  lakePavilion: "map",
  wishValley: "wishes",
} as const;

type DiegeticContentProps = {
  activeIndex: number;
  content: ChungDoiDemoContent;
  copy: DalatJourneyCopy;
  labels: DalatInvitationLabels;
  phase: JourneyPhase;
  reducedMotion: boolean;
};

function dateLabel(iso: string): string {
  const parts = iso.trim().split("-");
  if (parts.length !== 3 || parts.some((part) => !/^\d+$/.test(part))) {
    return iso;
  }
  return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

function namesForDisplay(content: ChungDoiDemoContent): [string, string] {
  const people = orderedCouple(content);
  return [people[0]?.fullName ?? content.couple.brideFullName, people[1]?.fullName ?? content.couple.groomFullName];
}

function FeatureHeading({ children }: { children: string }) {
  return <h3 className={styles.invitationFeatureHeading}>{children}</h3>;
}

function InvitationCalendar({
  calendar,
  label,
}: {
  calendar: ReturnType<typeof buildDalatInvitationContract>["calendar"];
  label: string;
}) {
  if (!calendar) return null;
  return (
    <div
      aria-label={label}
      className={styles.invitationCalendar}
      data-testid="dalat-invitation-calendar"
      role="img"
    >
      {calendar.cells.map((cell, index) => (
        <span
          className={cn(
            styles.invitationCalendarCell,
            cell === calendar.highlight && styles.invitationCalendarHighlight,
          )}
          key={`${cell ?? "empty"}-${index}`}
        >
          {cell ?? ""}
        </span>
      ))}
    </div>
  );
}

function CoverFeature({
  content,
  contract,
  labels,
}: {
  content: ChungDoiDemoContent;
  contract: ReturnType<typeof buildDalatInvitationContract>;
  labels: DalatInvitationLabels;
}) {
  const [first, second] = namesForDisplay(content);
  const receptionTime = content.venue.banquetTime || content.couple.time;
  const ceremony = invitationCeremonies(content)[0];

  return (
    <div className={styles.invitationFeature} data-invitation-feature="cover" data-testid="dalat-invitation-cover">
      <div className={styles.invitationCoupleNames}>
        <span>{first}</span>
        <span className={styles.invitationAmpersand}>&amp;</span>
        <span>{second}</span>
      </div>
      {contract.receptionDate ? (
        <p className={styles.invitationDateLine} data-testid="dalat-invitation-reception-date">
          {contract.receptionDate.weekday} · {dateLabel(content.couple.date)}
          {receptionTime ? ` · ${receptionTime}` : ""}
        </p>
      ) : null}
      <p className={styles.invitationFeatureText}>{invitationOpeningMessage(content)}</p>
      {ceremony?.title ? <p className={styles.invitationMutedText}>{ceremony.title}</p> : null}
      {content.venue.address ? (
        <p className={styles.invitationAddress}>{content.venue.address}</p>
      ) : null}
      <span className={styles.invitationFeatureRule} aria-hidden="true" />
      <p className={styles.invitationMicrocopy}>{labels.cover} · {content.invitationId}</p>
    </div>
  );
}

function AlbumFeature({
  content,
  labels,
}: {
  content: ChungDoiDemoContent;
  labels: DalatInvitationLabels;
}) {
  return (
    <div className={styles.invitationFeature} data-invitation-feature="album" data-testid="dalat-invitation-album">
      <FeatureHeading>{labels.album}</FeatureHeading>
      <p className={styles.invitationFeatureText}>
        {labels.albumIntro}
      </p>
      <AlbumGallery
        accent={content.theme.primaryColor || "#b8d2bd"}
        gridAspect="aspect-[4/3]"
        layout={content.albumLayout ?? "mosaic"}
        photos={content.gallery}
        radiusClass="rounded-lg"
      />
    </div>
  );
}

function ScheduleFeature({
  content,
  contract,
  labels,
}: {
  content: ChungDoiDemoContent;
  contract: ReturnType<typeof buildDalatInvitationContract>;
  labels: DalatInvitationLabels;
}) {
  const eventTime = content.venue.banquetTime || content.couple.time;
  return (
    <div className={styles.invitationFeature} data-invitation-feature="schedule" data-testid="dalat-invitation-schedule">
      <FeatureHeading>{labels.schedule}</FeatureHeading>
      {contract.receptionDate ? (
        <div className={styles.invitationDateBlock}>
          <strong>{dateLabel(content.couple.date)}</strong>
          <span>{contract.receptionDate.weekday}{eventTime ? ` · ${eventTime}` : ""}</span>
        </div>
      ) : null}
      <InvitationCalendar calendar={contract.calendar} label={labels.calendar} />
      {content.schedule.length > 0 ? (
        <ol className={styles.invitationScheduleList}>
          {content.schedule.map((item, index) => (
            <li key={`${item.time}-${item.label}-${index}`}>
              <time>{item.time}</time>
              <span>{item.label}</span>
            </li>
          ))}
        </ol>
      ) : null}
      {contract.calendarUrl ? (
        <a
          className={styles.invitationFeatureAction}
          data-invitation-action="calendar"
          href={contract.calendarUrl}
          rel="noreferrer"
          target="_blank"
        >
          {labels.addToCalendar}
        </a>
      ) : null}
    </div>
  );
}

function MapFeature({
  content,
  contract,
  labels,
}: {
  content: ChungDoiDemoContent;
  contract: ReturnType<typeof buildDalatInvitationContract>;
  labels: DalatInvitationLabels;
}) {
  if (!contract.mapQuery) {
    return (
      <div className={styles.invitationFeature} data-invitation-feature="map" data-testid="dalat-invitation-map">
        <FeatureHeading>{labels.map}</FeatureHeading>
        <p className={styles.invitationFeatureText}>{labels.mapUnavailable}</p>
      </div>
    );
  }

  return (
    <div className={styles.invitationFeature} data-invitation-feature="map" data-testid="dalat-invitation-map">
      <FeatureHeading>{labels.map}</FeatureHeading>
      <p className={styles.invitationAddress}>{contract.mapQuery}</p>
      <InvitationMap
        allowFullScreen
        className={styles.invitationMapFrame}
        loading="lazy"
        query={contract.mapQuery}
        title={`${labels.map} — ${content.venue.address}`}
      />
      <MapDirectionsButton
        className={styles.invitationFeatureAction}
        label={labels.directions}
        query={contract.mapQuery}
      />
    </div>
  );
}

function WishesGiftFeature({
  content,
  contract,
  labels,
}: {
  content: ChungDoiDemoContent;
  contract: ReturnType<typeof buildDalatInvitationContract>;
  labels: DalatInvitationLabels;
}) {
  const accent = content.theme.primaryColor || "#b8d2bd";
  const wishes = content.wishes.slice(0, 4);
  const giftBanks = contract.giftBanks.map((bank) => ({
    ...bank,
    label: `${bank.side === "bride" ? labels.bride : labels.groom} · ${bank.name}`,
  }));

  return (
    <div className={styles.invitationFeature} data-invitation-feature="wishes-gift" data-testid="dalat-invitation-wishes-gift">
      <section aria-labelledby="dalat-invitation-wishes-title" className={styles.invitationFeatureSection} data-testid="dalat-invitation-wishes">
        <h3 className={styles.invitationFeatureHeading} id="dalat-invitation-wishes-title">{labels.wishes}</h3>
        <p className={styles.invitationFeatureText}>{labels.wishesIntro}</p>
        {wishes.length > 0 ? (
          <ul className={styles.invitationWishList}>
            {wishes.map((wish) => (
              <li key={`${wish.name}-${wish.time}`}>
                <strong>{wish.name}</strong>
                <span>{wish.text}</span>
                <time dateTime={wish.time}>{formatWishTime(wish.time)}</time>
              </li>
            ))}
          </ul>
        ) : null}
        <div id="dalat-invitation-wish-form">
          <SharedWishForm
            accent={accent}
            labels={{
              namePlaceholder: labels.wishNamePlaceholder,
              success: labels.wishSuccess,
              submit: labels.wishSubmit,
              textPlaceholder: labels.wishPlaceholder,
            }}
          />
        </div>
      </section>
      <section aria-labelledby="dalat-invitation-gift-title" className={styles.invitationFeatureSection} data-testid="dalat-invitation-gift">
        <h3 className={styles.invitationFeatureHeading} id="dalat-invitation-gift-title">{labels.gift}</h3>
        <p className={styles.invitationFeatureText}>{labels.giftIntro}</p>
        {giftBanks.length > 0 ? (
          <GiftEnvelope
            accent={accent}
            cardBg="#f4f1e8"
            dark="#173427"
            heading={labels.gift}
            labelColor="#173427"
            openLabel={labels.openGift}
            templateSlug={content.slug}
            banks={giftBanks}
          />
        ) : (
          <p className={styles.invitationMutedText}>{labels.giftUnavailable}</p>
        )}
      </section>
    </div>
  );
}

function renderInvitationFeature(
  checkpointId: keyof typeof FEATURE_LABEL_BY_ID,
  content: ChungDoiDemoContent,
  contract: ReturnType<typeof buildDalatInvitationContract>,
  labels: DalatInvitationLabels,
) {
  switch (checkpointId) {
    case "mistGate":
      return <CoverFeature content={content} contract={contract} labels={labels} />;
    case "memoryPines":
      return <AlbumFeature content={content} labels={labels} />;
    case "timeGlasshouse":
      return <ScheduleFeature content={content} contract={contract} labels={labels} />;
    case "lakePavilion":
      return <MapFeature content={content} contract={contract} labels={labels} />;
    case "wishValley":
      return <WishesGiftFeature content={content} contract={contract} labels={labels} />;
    default:
      return null;
  }
}

export function DiegeticContent({
  activeIndex,
  content,
  copy,
  labels,
  phase,
  reducedMotion,
}: DiegeticContentProps) {
  const [revealedIndex, setRevealedIndex] = useState<number | null>(null);
  const layerRef = useRef<HTMLDivElement>(null);
  const contract = useMemo(() => buildDalatInvitationContract(content), [content]);
  const settled = phase === "settled" || phase === "fallback-settled";
  const contentState: InvitationContentState = getInvitationContentState({
    activeIndex,
    phase,
    revealedIndex,
  });

  useEffect(() => {
    if (!settled) {
      const activeElement = document.activeElement;
      if (
        activeElement instanceof HTMLElement
        && layerRef.current?.contains(activeElement)
      ) {
        activeElement.blur();
      }
      return;
    }

    if (revealedIndex === activeIndex) return;
    const timer = window.setTimeout(() => {
      setRevealedIndex(activeIndex);
    }, INVITATION_SCENIC_PAUSE_MS);

    return () => window.clearTimeout(timer);
  }, [activeIndex, revealedIndex, settled]);

  return (
    <div
      aria-label={labels.cover}
      className={styles.invitationContentLayer}
      data-content-state={contentState}
      data-invitation-template={content.slug}
      data-reduced-motion={reducedMotion ? "true" : "false"}
      data-testid="dalat-journey-invitation-content"
      ref={layerRef}
    >
      {dalatJourneyDefinition.checkpoints.map((checkpoint, index) => {
        const anchor = DIEGETIC_ANCHORS[checkpoint.id];
        const checkpointCopy = copy.checkpoints[checkpoint.id];
        const active = index === activeIndex;
        const interactive = active && contentState === "visible";
        const surfaceState: InvitationContentState = active
          ? contentState
          : "hidden";
        const featureLabel = labels[FEATURE_LABEL_BY_ID[checkpoint.id]];

        return (
          <article
            aria-hidden={!interactive}
            aria-label={featureLabel}
            className={cn(
              styles.diegeticSurface,
              SURFACE_CLASS_BY_KIND[anchor.surface],
              interactive
                ? styles.diegeticSurfaceActive
                : styles.diegeticSurfaceInactive,
            )}
            data-content-role={CONTENT_ROLE_BY_ID[checkpoint.id]}
            data-content-state={surfaceState}
            data-diegetic-surface="true"
            data-surface-kind={anchor.surface}
            data-testid={`dalat-diegetic-${checkpoint.id}`}
            key={checkpoint.id}
            tabIndex={interactive && checkpoint.id !== "wishValley" ? 0 : -1}
          >
            <p className={styles.diegeticKicker}>{checkpointCopy.kicker}</p>
            <p className={styles.diegeticPlace}>{checkpointCopy.name} · {featureLabel}</p>
            <h2 className={styles.diegeticTitle}>
              {checkpoint.id === "mistGate"
                ? `${content.couple.brideShortName || content.couple.brideFullName} & ${content.couple.groomShortName || content.couple.groomFullName}`
                : featureLabel}
            </h2>
            <p className={styles.diegeticBody}>
              {checkpoint.id === "mistGate"
                ? invitationOpeningMessage(content)
                : checkpointCopy.body}
            </p>
            {interactive ? renderInvitationFeature(checkpoint.id, content, contract, labels) : null}
          </article>
        );
      })}
    </div>
  );
}

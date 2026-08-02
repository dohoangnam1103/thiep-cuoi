"use client";

import {
  useEffect,
  useRef,
  type ReactNode,
} from "react";

import {
  buildForestCalendarEvents,
  orderForestFamilySides,
  type ForestCalendarEventLabels,
  type ForestJourneyContent,
  type ForestJourneyScene,
  type ForestJourneySceneType,
} from "@/data/forest-wedding-journey";

import styles from "./forest-wedding-journey.module.css";

export type ForestSceneRendererMode = "fallback" | "webgl";
export type ForestPhotoStatus = "error" | "loading" | "ready";
export type ForestJourneySceneNames = Readonly<Record<ForestJourneySceneType, string>>;

export type ForestSceneLabels = {
  readonly addToCalendar: string;
  readonly accountHolder: string;
  readonly accountNumber: string;
  readonly attendingNo: string;
  readonly attendingYes: string;
  readonly bankName: string;
  readonly brideFamily: string;
  readonly date: string;
  readonly closeGift: string;
  readonly directions: string;
  readonly formError: string;
  readonly groomFamily: string;
  readonly giftUnavailable: string;
  readonly invitation: string;
  readonly mapUnavailable: string;
  readonly openGift: string;
  readonly photoAlt: string;
  readonly photoUnavailable: string;
  readonly rsvpAttendance: string;
  readonly rsvpGuests: string;
  readonly rsvpName: string;
  readonly rsvpNameRequired: string;
  readonly rsvpNotes: string;
  readonly rsvpGuestsInvalid: string;
  readonly rsvpSubmit: string;
  readonly rsvpSuccess: string;
  readonly thankYou: string;
  readonly time: string;
  readonly wishName: string;
  readonly wishRequired: string;
  readonly wishSubmit: string;
  readonly wishSuccess: string;
  readonly wishText: string;
} & ForestCalendarEventLabels;

export type ForestSceneContentProps = {
  readonly active: boolean;
  readonly content: ForestJourneyContent;
  readonly galleryPhoto?: ReactNode;
  readonly interactiveContent?: ReactNode;
  readonly labels: ForestSceneLabels;
  readonly photoStatus?: ForestPhotoStatus;
  readonly rendererMode: ForestSceneRendererMode;
  readonly scene: ForestJourneyScene;
  readonly sceneName: string;
  readonly settled: boolean;
};

const DEFAULT_DRESS_COLORS = [
  "#1e3d2f",
  "#f1ede0",
  "#c9a24a",
  "#708465",
  "#d9d0bc",
] as const;

function sanitizeDressColor(value: string, fallback: string): string {
  const candidate = value.trim();
  return /^#[\da-f]{3}(?:[\da-f]{3})?$/i.test(candidate) ? candidate : fallback;
}

export function parseForestIsoDate(value: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year
    && date.getUTCMonth() === month - 1
    && date.getUTCDate() === day
    ? date
    : null;
}

function FamilyPaper({
  address,
  father,
  label,
  mother,
  parentTitle,
}: {
  readonly address: string;
  readonly father: string;
  readonly label: string;
  readonly mother: string;
  readonly parentTitle: string;
}) {
  return (
    <article className={styles.familyPaper}>
      <h3>{label}</h3>
      {parentTitle ? <p>{parentTitle}</p> : null}
      {father ? <p>{father}</p> : null}
      {mother ? <p>{mother}</p> : null}
      {address ? <address>{address}</address> : null}
    </article>
  );
}

function FamiliesContent({
  content,
  labels,
}: Pick<ForestSceneContentProps, "content" | "labels">) {
  const bride = (
    <FamilyPaper
      address={content.families.brideAddress}
      father={content.families.brideFather}
      key="bride"
      label={labels.brideFamily}
      mother={content.families.brideMother}
      parentTitle={content.families.brideParentTitle}
    />
  );
  const groom = (
    <FamilyPaper
      address={content.families.groomAddress}
      father={content.families.groomFather}
      key="groom"
      label={labels.groomFamily}
      mother={content.families.groomMother}
      parentTitle={content.families.groomParentTitle}
    />
  );

  return (
    <div className={styles.familyPapers} data-forest-prop="family-tables">
      {orderForestFamilySides(content.brideFirst).map((side) => (
        side === "bride" ? bride : groom
      ))}
    </div>
  );
}

function OpeningMessageContent({
  content,
  labels,
}: Pick<ForestSceneContentProps, "content" | "labels">) {
  return (
    <div className={styles.invitationPaper} data-forest-prop="opened-envelope">
      <p className={styles.paperLabel}>{labels.invitation}</p>
      <p>{content.openingMessage || content.ceremonyHeader}</p>
    </div>
  );
}

function CalendarContent({
  content,
  labels,
}: Pick<ForestSceneContentProps, "content" | "labels">) {
  const events = buildForestCalendarEvents(content, labels);

  return (
    <div className={styles.calendarPaper} data-forest-prop="paper-calendar">
      <dl>
        {events.map((event) => (
          <div key={event.label}>
            <dt>{event.label}</dt>
            <dd>
              {event.date ? (
                <time dateTime={event.date}>{event.formattedDate}</time>
              ) : null}
              {event.time ? (
                <time dateTime={event.time}>{event.time}</time>
              ) : null}
            </dd>
          </div>
        ))}
      </dl>
      <a href={content.calendarUrl} rel="noreferrer" target="_blank">
        {labels.addToCalendar}
      </a>
    </div>
  );
}

function ScheduleContent({ content }: Pick<ForestSceneContentProps, "content">) {
  return (
    <ol className={styles.scheduleCards} data-forest-prop="schedule-place-cards">
      {content.schedule.map((item, index) => (
        <li key={`${item.time}-${item.label}-${index}`}>
          <time dateTime={item.time}>{item.time}</time>
          <span>{item.label}</span>
        </li>
      ))}
    </ol>
  );
}

function GalleryContent({
  galleryPhoto,
  labels,
  photoStatus,
  rendererMode,
}: Pick<
  ForestSceneContentProps,
  "galleryPhoto" | "labels" | "photoStatus" | "rendererMode"
>) {
  return (
    <figure
      aria-label={labels.photoAlt}
      className={styles.gallerySemanticEasel}
      data-testid="forest-gallery-easel"
    >
      {rendererMode === "fallback" ? (
        <div
          aria-hidden="true"
          className={styles.fallbackGalleryScaffold}
          data-forest-gallery-scaffold="true"
        >
          <span
            className={styles.fallbackGalleryContact}
            data-forest-gallery-part="grass-contact"
          />
          <span className={styles.fallbackGalleryCrossbar} />
          <span
            className={styles.fallbackGalleryFrame}
            data-forest-gallery-part="light-oak-frame"
          >
            {galleryPhoto}
          </span>
          <span
            className={styles.fallbackGalleryWildflowers}
            data-forest-gallery-part="wildflower-cluster"
          />
        </div>
      ) : null}
      {photoStatus === "error" ? (
        <figcaption className={styles.photoUnavailable} role="status">
          {labels.photoUnavailable}
        </figcaption>
      ) : null}
    </figure>
  );
}

function DressCodeContent({ content }: Pick<ForestSceneContentProps, "content">) {
  return (
    <ul className={styles.dressFabricStrips} data-forest-prop="dress-fabric-strips">
      {content.dressCodeColors.slice(0, 5).map((color, index) => (
        <li key={`${color}-${index}`}>
          <span aria-hidden="true" />
          <code>{color}</code>
        </li>
      ))}
    </ul>
  );
}

function VenueContent({
  content,
  labels,
}: Pick<ForestSceneContentProps, "content" | "labels">) {
  return (
    <div className={styles.venueAddressPaper} data-forest-prop="venue-wood-sign">
      <address>{content.venueAddress}</address>
      {content.receptionTime ? (
        <p>
          <span>{labels.time}</span>
          <time dateTime={content.receptionTime}>{content.receptionTime}</time>
        </p>
      ) : null}
    </div>
  );
}

function FinaleContent({ labels }: Pick<ForestSceneContentProps, "labels">) {
  return (
    <p className={styles.thankYouPaper} data-forest-prop="finale-seats-voile">
      {labels.thankYou}
    </p>
  );
}

function PhysicalSurface({
  children,
  content,
  interactive,
  photoStatus,
  rendererMode,
  scene,
  sceneName,
  visible,
}: Pick<
  ForestSceneContentProps,
  "content" | "photoStatus" | "rendererMode" | "scene" | "sceneName"
> & {
  readonly children: ReactNode;
  readonly interactive: boolean;
  readonly visible: boolean;
}) {
  const headingRef = useRef<HTMLHeadingElement | null>(null);
  const surfaceRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const surface = surfaceRef.current;
    if (!surface || scene.type !== "dress-code") return;

    for (let index = 0; index < 5; index += 1) {
      const fallback = DEFAULT_DRESS_COLORS[index]!;
      const color = sanitizeDressColor(content.dressCodeColors[index] ?? "", fallback);
      surface.style.setProperty(`--forest-dress-color-${index + 1}`, color);
    }

    return () => {
      for (let index = 1; index <= 5; index += 1) {
        surface.style.removeProperty(`--forest-dress-color-${index}`);
      }
    };
  }, [content.dressCodeColors, scene.type]);

  return (
    <section
      aria-hidden={!interactive}
      className={styles.physicalSurface}
      data-forest-interactive={interactive ? "true" : undefined}
      data-forest-visible={visible ? "true" : "false"}
      data-forest-photo-src={scene.photo?.src}
      data-forest-photo-status={scene.type === "gallery-photo" ? photoStatus : undefined}
      data-forest-renderer={rendererMode}
      data-forest-scene-id={scene.id}
      data-forest-scene-type={scene.type}
      data-testid={`forest-scene-${scene.type}`}
      inert={interactive ? undefined : true}
      ref={surfaceRef}
    >
      <h2 ref={headingRef} tabIndex={interactive ? -1 : undefined}>{sceneName}</h2>
      {children}
    </section>
  );
}

export function ForestSceneContent({
  active,
  content,
  galleryPhoto,
  interactiveContent,
  labels,
  photoStatus = "loading",
  rendererMode,
  scene,
  sceneName,
  settled,
}: ForestSceneContentProps) {
  const interactive = active && settled;
  const visible = active;
  let children: ReactNode;

  switch (scene.type) {
    case "families":
      children = <FamiliesContent content={content} labels={labels} />;
      break;
    case "opening-message":
      children = <OpeningMessageContent content={content} labels={labels} />;
      break;
    case "calendar":
      children = <CalendarContent content={content} labels={labels} />;
      break;
    case "schedule":
      children = <ScheduleContent content={content} />;
      break;
    case "gallery-photo":
      children = (
        <GalleryContent
          galleryPhoto={galleryPhoto}
          labels={labels}
          photoStatus={photoStatus}
          rendererMode={rendererMode}
        />
      );
      break;
    case "dress-code":
      children = <DressCodeContent content={content} />;
      break;
    case "venue":
      children = <VenueContent content={content} labels={labels} />;
      break;
    case "finale":
      children = <FinaleContent labels={labels} />;
      break;
    case "map":
    case "rsvp":
    case "wishes":
    case "gift":
      children = interactiveContent;
      break;
    case "cover-gate":
      return null;
    default: {
      const unhandledSceneType: never = scene.type;
      return unhandledSceneType;
    }
  }

  return (
    <PhysicalSurface
      content={content}
      interactive={interactive}
      photoStatus={photoStatus}
      rendererMode={rendererMode}
      scene={scene}
      sceneName={sceneName}
      visible={visible}
    >
      {children}
    </PhysicalSurface>
  );
}

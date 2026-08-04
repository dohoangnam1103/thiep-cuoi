"use client";

/*
 * Twin file: src/components/forest-wedding-journey/forest-scene-content.tsx
 *
 * The scene copy, structure, headings and test IDs — identical to the forest
 * twin, because the spec carries the journey's content contract over unchanged.
 * Fixes to any of that must be applied to both.
 *
 * One block diverges: the gallery scene's fallback markup. The forest twin draws
 * a standing easel with a wildflower cluster; this lab hangs its frames from a
 * line between driftwood posts, matching what the 3D world actually builds, so
 * the parts are a sand contact shadow, a hanging line, a driftwood frame and two
 * cords. See the matching block in `beach-wedding-journey.module.css`.
 */

import {
  useEffect,
  useRef,
  type ReactNode,
} from "react";

import {
  buildBeachCalendarEvents,
  orderBeachFamilySides,
  type BeachCalendarEventLabels,
  type BeachJourneyContent,
  type BeachJourneyScene,
  type BeachJourneySceneType,
} from "@/data/beach-wedding-journey";

import styles from "./beach-wedding-journey.module.css";

export type BeachSceneRendererMode = "fallback" | "webgl";
export type BeachPhotoStatus = "error" | "loading" | "ready";
export type BeachJourneySceneNames = Readonly<Record<BeachJourneySceneType, string>>;

export type BeachSceneLabels = {
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
} & BeachCalendarEventLabels;

export type BeachSceneContentProps = {
  readonly active: boolean;
  readonly content: BeachJourneyContent;
  readonly galleryPhoto?: ReactNode;
  readonly interactiveContent?: ReactNode;
  readonly labels: BeachSceneLabels;
  readonly photoStatus?: BeachPhotoStatus;
  readonly rendererMode: BeachSceneRendererMode;
  readonly scene: BeachJourneyScene;
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

export function parseBeachIsoDate(value: string): Date | null {
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
}: Pick<BeachSceneContentProps, "content" | "labels">) {
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
    <div className={styles.familyPapers} data-beach-prop="family-tables">
      {orderBeachFamilySides(content.brideFirst).map((side) => (
        side === "bride" ? bride : groom
      ))}
    </div>
  );
}

function OpeningMessageContent({
  content,
  labels,
}: Pick<BeachSceneContentProps, "content" | "labels">) {
  return (
    <div className={styles.invitationPaper} data-beach-prop="opened-envelope">
      <p className={styles.paperLabel}>{labels.invitation}</p>
      <p>{content.openingMessage || content.ceremonyHeader}</p>
    </div>
  );
}

function CalendarContent({
  content,
  labels,
}: Pick<BeachSceneContentProps, "content" | "labels">) {
  const events = buildBeachCalendarEvents(content, labels);

  return (
    <div className={styles.calendarPaper} data-beach-prop="paper-calendar">
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

function ScheduleContent({ content }: Pick<BeachSceneContentProps, "content">) {
  return (
    <ol className={styles.scheduleCards} data-beach-prop="schedule-place-cards">
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
  BeachSceneContentProps,
  "galleryPhoto" | "labels" | "photoStatus" | "rendererMode"
>) {
  return (
    <figure
      aria-label={labels.photoAlt}
      className={styles.gallerySemanticEasel}
      data-testid="beach-gallery-easel"
    >
      {rendererMode === "fallback" ? (
        <div
          aria-hidden="true"
          className={styles.fallbackGalleryScaffold}
          data-beach-gallery-scaffold="true"
        >
          <span
            className={styles.fallbackGalleryContact}
            data-beach-gallery-part="sand-contact"
          />
          <span
            className={styles.fallbackGalleryCrossbar}
            data-beach-gallery-part="hanging-line"
          />
          <span
            className={styles.fallbackGalleryFrame}
            data-beach-gallery-part="driftwood-frame"
          >
            {galleryPhoto}
          </span>
          <span
            className={styles.fallbackGalleryCords}
            data-beach-gallery-part="hanging-cords"
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

function DressCodeContent({ content }: Pick<BeachSceneContentProps, "content">) {
  return (
    <ul className={styles.dressFabricStrips} data-beach-prop="dress-fabric-strips">
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
}: Pick<BeachSceneContentProps, "content" | "labels">) {
  return (
    <div className={styles.venueAddressPaper} data-beach-prop="venue-wood-sign">
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

function FinaleContent({ labels }: Pick<BeachSceneContentProps, "labels">) {
  return (
    <p className={styles.thankYouPaper} data-beach-prop="finale-seats-voile">
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
  BeachSceneContentProps,
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
      surface.style.setProperty(`--beach-dress-color-${index + 1}`, color);
    }

    return () => {
      for (let index = 1; index <= 5; index += 1) {
        surface.style.removeProperty(`--beach-dress-color-${index}`);
      }
    };
  }, [content.dressCodeColors, scene.type]);

  return (
    <section
      aria-hidden={!interactive}
      className={styles.physicalSurface}
      data-beach-interactive={interactive ? "true" : undefined}
      data-beach-visible={visible ? "true" : "false"}
      data-beach-photo-src={scene.photo?.src}
      data-beach-photo-status={scene.type === "gallery-photo" ? photoStatus : undefined}
      data-beach-renderer={rendererMode}
      data-beach-scene-id={scene.id}
      data-beach-scene-type={scene.type}
      data-testid={`beach-scene-${scene.type}`}
      inert={interactive ? undefined : true}
      ref={surfaceRef}
    >
      <h2 ref={headingRef} tabIndex={interactive ? -1 : undefined}>{sceneName}</h2>
      {children}
    </section>
  );
}

export function BeachSceneContent({
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
}: BeachSceneContentProps) {
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

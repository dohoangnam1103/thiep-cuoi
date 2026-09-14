import type { ChungDoiDemoContent } from "./chungdoi-demo-content";
import { createTemplateDemoContent } from "./templates/template-manifest";

export type DoraemonDoorExperienceState =
  | "closed"
  | "opening"
  | "handoff"
  | "opened";

export type DoraemonDoorMotionPhase =
  | "anticipation"
  | "latch"
  | "swing"
  | "portal"
  | "cast"
  | "settle"
  | "handoff";

export const doraemonDoorArtDirection = {
  layoutFamily: "portal-storybook",
  coverGeometry:
    "freestanding pink rounded door with an inset sky portal, tactile yellow handle and five layered character planes",
  openingMechanism:
    "the explicit open button turns the handle, swings the door toward camera-left, expands the portal and lets the wedding cast arrive on separate depth planes before a continuous DOM handoff",
  typography: {
    display: '"SVN-HC Marvin Visions", HelveticaNeue, sans-serif',
    body: "HelveticaNeue, Arial, sans-serif",
    hierarchy:
      "rounded display lettering for short names and dates; neutral sans for every address, control and long invitation message",
  },
  colorPalette:
    "sky #DDF6FF; portal blue #39BCEB; door pink #E96F9A; ink #17334A; warm white #FFF9EE; yellow #F4C84A",
  materialPreset:
    "satin-painted door frame, matte cel character planes, soft translucent portal and low-gloss yellow hardware",
  lightingPreset:
    "large cool key from upper-left, warm fill from the portal and a soft oval contact shadow",
  motionPreset:
    "spring-led handle response, weighted door swing, short camera dolly and staggered character arrival with no infinite character bobbing",
  soundPreset:
    "short handle click, soft door whoosh and a single portal chime; shared mute state",
  sectionCompositions: [
    "portal-cast handoff hero",
    "asymmetric invitation note",
    "paired family cloud panels",
    "destination board ceremony",
    "compact countdown orbit",
    "mosaic album",
    "route-map window",
    "dress-code color orbits",
    "guestbook message field",
    "gift drawer",
    "cast thank-you finale",
  ],
} as const;

export const doraemonDoorOpeningModel = {
  object: "door",
  openTrigger: "explicit-button",
  closedInteraction: {
    mode: "tilt",
    pointerDrag: true,
    touchDrag: true,
    gestureThresholdPx: 8,
    settleBehavior: "hold",
  },
  revealOrder: [
    "handle response",
    "door swing",
    "portal light",
    "Nobita and Shizuka",
    "Doraemon",
    "Jaian and Suneo",
    "couple names and wedding date",
    "DOM portal hero",
  ],
  cameraTransition:
    "snapshot the current orbit pose, widen slightly as the door clears the frame, then dolly through the portal while the cast settles",
  settleTarget:
    "the final cast composition matches the DOM hero positions, sky palette and portal silhouette",
  durationMs: 2450,
  mobileDurationMs: 2100,
  reducedMotionDurationMs: 220,
} as const;

const characterRoot = "/chungdoi/templates/doraemon-door/characters";

export const doraemonDoorPilot = {
  slug: "doraemon-door",
  rendererFamily: "portal-storybook",
  assets: {
    nobita: `${characterRoot}/nobita-groom.webp`,
    nobitaMobile: `${characterRoot}/nobita-groom.mobile.webp`,
    shizuka: `${characterRoot}/shizuka-bride.webp`,
    shizukaMobile: `${characterRoot}/shizuka-bride.mobile.webp`,
    doraemon: `${characterRoot}/doraemon-ring-bearer.webp`,
    doraemonMobile: `${characterRoot}/doraemon-ring-bearer.mobile.webp`,
    jaian: `${characterRoot}/jaian-best-man.webp`,
    jaianMobile: `${characterRoot}/jaian-best-man.mobile.webp`,
    suneo: `${characterRoot}/suneo-best-man.webp`,
    suneoMobile: `${characterRoot}/suneo-best-man.mobile.webp`,
  },
  palette: {
    sky: "#DDF6FF",
    portalBlue: "#39BCEB",
    doorPink: "#E96F9A",
    deepPink: "#B94170",
    ink: "#17334A",
    warmWhite: "#FFF9EE",
    yellow: "#F4C84A",
  },
  physicalOpening: {
    gestureThresholdPx: doraemonDoorOpeningModel.closedInteraction.gestureThresholdPx,
    desktopDurationMs: doraemonDoorOpeningModel.durationMs,
    mobileDurationMs: doraemonDoorOpeningModel.mobileDurationMs,
    reducedMotionDurationMs: doraemonDoorOpeningModel.reducedMotionDurationMs,
    labels: [
      "anticipation",
      "latch",
      "swing",
      "portal",
      "cast",
      "settle",
      "handoff",
    ] as const satisfies readonly DoraemonDoorMotionPhase[],
  },
} as const;

const pilotDemoContent = createTemplateDemoContent({
  slug: doraemonDoorPilot.slug,
  primaryColor: doraemonDoorPilot.palette.doorPink,
  fontFamily: "SVN-HC Marvin Visions",
  music: "/chungdoi/music/editorial-noir.mp3",
  gallerySlug: "chibi-red",
  galleryCount: 4,
  brideFullName: "Shizuka Minamoto",
  brideShortName: "Shizuka",
  groomFullName: "Nobita Nobi",
  groomShortName: "Nobita",
  date: "2026-12-24",
  time: "18:30",
});

export const doraemonDoorPilotContent = {
  ...pilotDemoContent,
  couple: {
    ...pilotDemoContent.couple,
    openingMessage:
      "Cánh cửa hôm nay mở đến một điểm đến duy nhất: ngày chúng mình chính thức về chung một nhà.",
  },
  ceremonies: [
    {
      title: "Lễ thành hôn tại tư gia nhà trai",
      date: "2026-12-24",
      time: "09:00",
    },
    {
      title: "Lễ vu quy tại tư gia nhà gái",
      date: "2026-12-24",
      time: "11:00",
    },
  ],
  dressCodeColors: "#39BCEB,#E96F9A,#FFF9EE,#F4C84A",
  albumLayout: "mosaic",
  showHeroImage: false,
} satisfies ChungDoiDemoContent;

export function doraemonDoorOpeningDuration({
  isMobile,
  reducedMotion,
}: {
  isMobile: boolean;
  reducedMotion: boolean;
}): number {
  if (reducedMotion) {
    return doraemonDoorPilot.physicalOpening.reducedMotionDurationMs;
  }

  return isMobile
    ? doraemonDoorPilot.physicalOpening.mobileDurationMs
    : doraemonDoorPilot.physicalOpening.desktopDurationMs;
}

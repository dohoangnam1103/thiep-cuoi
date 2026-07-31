import type { ChungDoiDemoContent } from "./chungdoi-demo-content";
import { createTemplateDemoContent } from "./templates/template-manifest";

export type SleeveExperienceState = "closed" | "opening" | "handoff" | "opened";

export type SleeveMotionPhase =
  | "anticipation"
  | "release"
  | "extract"
  | "rotate"
  | "settle"
  | "handoff";

export type SleeveTemplateArtDirection = {
  layoutFamily: string;
  coverGeometry: string;
  openingMechanism: string;
  typography: {
    display: string;
    body: string;
    hierarchy: string;
  };
  colorPalette: string;
  materialPreset: string;
  lightingPreset: string;
  motionPreset: string;
  soundPreset: string;
  sectionCompositions: string[];
};

export type SleevePhysicalOpeningModel = {
  object: "sleeve";
  openTrigger: "explicit-button";
  closedInteraction: {
    mode: "tilt-and-flip";
    showsBackFace: true;
    pointerDrag: true;
    touchDrag: true;
    gestureThresholdPx: number;
    settleBehavior: "hold";
  };
  affordance: string;
  hinges: Array<{
    part: string;
    transformOrigin: string;
  }>;
  revealOrder: string[];
  cameraTransition: string;
  settleTarget: string;
  durationMs: number;
  mobileDurationMs: number;
  reducedMotionDurationMs: number;
};

export type SleeveAssetBible = {
  templateSlug: string;
  culturalDirection: string;
  primaryMotifs: string[];
  illustrationStyle: string;
  lineWeight: string;
  palette: string[];
  materialLanguage: string[];
  lightingDirection: string;
  detailLevel: "low" | "medium" | "high";
  symmetryRule: string;
  animationLayers: string[];
  requiredMasks: string[];
  mobileReadabilityRule: string;
  avoid: string[];
};

export const nguyetAnhSleeveArtDirection = {
  layoutFamily: "contact-sheet-darkroom",
  coverGeometry:
    "smoked-glass vertical sleeve with a visible open slot, silver edge rails, a two-sided inner film card and a shallow aperture lock",
  openingMechanism:
    "the explicit open button releases the aperture, the film card slides upward with restrained friction, rotates toward the camera and aligns its first frame with the DOM hero",
  typography: {
    display: '"HelveticaNeue", "Be Vietnam Pro", sans-serif',
    body: '"Be Vietnam Pro", "HelveticaNeue", sans-serif',
    hierarchy:
      "light display sans for couple names, condensed titling only for short headings, body sans for dates, addresses, controls and forms",
  },
  colorPalette:
    "graphite #0B1116; smoke #14232D; silver #D7E4EA; moon cyan #78C7D7; ink #071015",
  materialPreset:
    "smoked acrylic outer sleeve, brushed aluminium rails, matte photographic paper and restrained pearl emulsion",
  lightingPreset:
    "cool key from upper-left, low silver rim from the right and soft grounded contact shadow",
  motionPreset:
    "friction-led pull, no bounce, continuous spherical camera settle, 3D object and DOM frame align without crossfade",
  soundPreset:
    "short aperture tick, low film drag and a soft frame-seat cue; shared mute state",
  sectionCompositions: [
    "first-frame handoff hero",
    "two portrait proof frames",
    "family exposure notes",
    "ceremony film strip",
    "countdown light table",
    "calendar proof sheet",
    "album contact sheet",
    "timeline exposure log",
    "map projection frame",
    "dress-code emulsion swatches",
    "guestbook annotation panel",
    "gift negative sleeve",
    "thank-you end frame",
  ],
} satisfies SleeveTemplateArtDirection;

export const nguyetAnhSleeveOpeningModel = {
  object: "sleeve",
  openTrigger: "explicit-button",
  closedInteraction: {
    mode: "tilt-and-flip",
    showsBackFace: true,
    pointerDrag: true,
    touchDrag: true,
    gestureThresholdPx: 8,
    settleBehavior: "hold",
  },
  affordance:
    "the explicit Mở thiệp button releases the aperture; the aperture, sleeve and film card never open on canvas click",
  hinges: [
    {
      part: "aperture-ring",
      transformOrigin: "center axis",
    },
    {
      part: "film-card",
      transformOrigin: "card center after leaving the sleeve slot",
    },
  ],
  revealOrder: [
    "aperture contraction",
    "slot light",
    "film perforations",
    "film card portrait frame",
    "couple names and wedding date",
    "DOM first frame",
  ],
  cameraTransition:
    "preserve current camera and object pose, travel on the shortest spherical path to an opening-safe angle, then dolly only after the film clears the sleeve",
  settleTarget:
    "the first film frame matches the DOM hero rectangle, aspect ratio, background and camera-facing angle",
  durationMs: 2050,
  mobileDurationMs: 1780,
  reducedMotionDurationMs: 200,
} satisfies SleevePhysicalOpeningModel;

export const nguyetAnhSleeveAssetBible = {
  templateSlug: "nguyet-anh-sleeve",
  culturalDirection:
    "contemporary Vietnamese botanical photogram using lotus as a quiet photographic subject, without claiming a historic photographic reconstruction",
  primaryMotifs: [
    "asymmetrical lotus photogram",
    "restrained moon-aperture ring",
    "film perforations",
    "silver emulsion edge",
  ],
  illustrationStyle:
    "cyanotype and silver-gelatin photogram with real photographic-paper grain and a large center safe zone",
  lineWeight:
    "botanical silhouettes survive a 320px projected cover; grain remains subordinate to text",
  palette: ["#0B1116", "#14232D", "#D7E4EA", "#78C7D7", "#071015"],
  materialLanguage: [
    "smoked acrylic",
    "brushed aluminium",
    "matte photographic paper",
    "pearl emulsion",
  ],
  lightingDirection:
    "cool key from upper-left; runtime material owns highlights and reflections",
  detailLevel: "medium",
  symmetryRule:
    "intentionally asymmetric botanical mass with a centered readable frame",
  animationLayers: [
    "outer-sleeve",
    "aperture-ring",
    "inner-film-card",
    "slot-light",
  ],
  requiredMasks: [
    "film-card-alpha",
    "aperture-mask",
    "paper-roughness",
  ],
  mobileReadabilityRule:
    "at 320px cover width the lotus silhouette, aperture circle and card slot remain distinct; text safe zone stays visually quiet",
  avoid: [
    "generated text, numbers, logo, signature or watermark",
    "warm beige, brass or red lacquer",
    "purple neon and outer glow",
    "generic floral wreath",
    "wedding rings or stock wedding iconography",
    "reflection baked into the color artwork",
    "grain dense enough to reduce name contrast",
  ],
} satisfies SleeveAssetBible;

export const nguyetAnhSleevePilot = {
  slug: "nguyet-anh-sleeve",
  rendererFamily: "contact-sheet",
  assets: {
    photogram:
      "/chungdoi/templates/nguyet-anh-sleeve/cover/lotus-photogram-v1.webp",
    photogramMobile:
      "/chungdoi/templates/nguyet-anh-sleeve/cover/lotus-photogram-v1.mobile.webp",
  },
  palette: {
    graphite: "#0B1116",
    smoke: "#14232D",
    silver: "#D7E4EA",
    moonCyan: "#78C7D7",
    ink: "#071015",
  },
  physicalOpening: {
    gestureThresholdPx: 8,
    desktopDurationMs: nguyetAnhSleeveOpeningModel.durationMs,
    mobileDurationMs: nguyetAnhSleeveOpeningModel.mobileDurationMs,
    reducedMotionDurationMs:
      nguyetAnhSleeveOpeningModel.reducedMotionDurationMs,
    labels: [
      "anticipation",
      "release",
      "extract",
      "rotate",
      "settle",
      "handoff",
    ] as const satisfies readonly SleeveMotionPhase[],
  },
} as const;

const pilotDemoContent = createTemplateDemoContent({
  slug: nguyetAnhSleevePilot.slug,
  primaryColor: nguyetAnhSleevePilot.palette.moonCyan,
  fontFamily: "HelveticaNeue",
  music: "/chungdoi/music/editorial-noir.mp3",
  gallerySlug: "editorial-noir",
  galleryCount: 8,
  brideFullName: "Lê Gia Hân",
  brideShortName: "Gia Hân",
  groomFullName: "Phạm Nhật Minh",
  groomShortName: "Nhật Minh",
  date: "2026-11-21",
  time: "18:30",
});

export const nguyetAnhSleevePilotContent = {
  ...pilotDemoContent,
  couple: {
    ...pilotDemoContent.couple,
    openingMessage:
      "Trân trọng kính mời quý khách cùng lưu lại một khung hình đẹp trong ngày thành hôn của chúng tôi.",
  },
  ceremonies: [
    {
      title: "Lễ thành hôn tại tư gia nhà trai",
      date: "2026-11-21",
      time: "09:00",
    },
    {
      title: "Lễ vu quy tại tư gia nhà gái",
      date: "2026-11-21",
      time: "11:00",
    },
  ],
  dressCodeColors: "#78C7D7,#D7E4EA,#14232D",
  albumLayout: "mosaic",
} satisfies ChungDoiDemoContent;

export function sleeveOpeningDuration({
  isMobile,
  reducedMotion,
}: {
  isMobile: boolean;
  reducedMotion: boolean;
}): number {
  if (reducedMotion) {
    return nguyetAnhSleevePilot.physicalOpening.reducedMotionDurationMs;
  }

  return isMobile
    ? nguyetAnhSleevePilot.physicalOpening.mobileDurationMs
    : nguyetAnhSleevePilot.physicalOpening.desktopDurationMs;
}

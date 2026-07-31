import type { ChungDoiDemoContent } from "./chungdoi-demo-content";
import { createTemplateDemoContent } from "./templates/template-manifest";

export type GatefoldExperienceState = "closed" | "opening" | "handoff" | "opened";

export type GatefoldMotionPhase =
  | "anticipation"
  | "release"
  | "unfold"
  | "reveal"
  | "settle"
  | "handoff";

export type TemplateArtDirection = {
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

export type PhysicalOpeningModel = {
  object: "gatefold";
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
  reducedMotionDurationMs: number;
};

export type AssetBible = {
  templateSlug: string;
  culturalDirection: string;
  historicalReference?: string;
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

export const longPhungGatefoldArtDirection = {
  layoutFamily: "gatefold-ceremonial",
  coverGeometry:
    "vertical three-panel gatefold; full-width center board; two half-width hinged wings; designed back board and visible paper edges",
  openingMechanism:
    "center clasp releases; left and right wings unfold with a short stagger; camera settles on the inner center sheet; WebGL-to-DOM geometric handoff",
  typography: {
    display: '"UNI Chu truyen thong", "Fz Qellia", serif',
    body: '"Lora", "Times New Roman", serif',
    hierarchy:
      "display font only for couple names and ceremonial headings; body font for invitation copy, dates, addresses, controls and forms; locale-aware fallback is mandatory",
  },
  colorPalette:
    "lacquer crimson #5A0B12; deep cinnabar #7C1B1B; antique gold #B58A3A; warm ivory #EAD9B8; lacquer black #17110F",
  materialPreset:
    "deep lacquer on outer wings; warm cotton paper inside; separate antique-gold foil pass; shallow emboss; restrained clearcoat",
  lightingPreset:
    "large warm key from upper-left; low neutral fill from front-right; soft environment reflection; grounded contact shadow",
  motionPreset:
    "weighty cardstock; immediate clasp feedback; 70ms wing stagger; controlled hinge motion; no game-like bounce; quiet camera settle",
  soundPreset:
    "soft clasp release; two short paper-hinge sounds panned by wing; subtle paper settle; shared mute state with background music",
  sectionCompositions: [
    "inner-center ceremonial hero",
    "paired family wing panels",
    "portrait prints tucked below the center sheet",
    "calendar insert",
    "album sleeve with loose-photo grid",
    "timeline ribbon",
    "map foldout",
    "dress-code fabric swatches",
    "guestbook postcard",
    "gift mini-envelope with QR",
    "thank-you colophon",
  ],
} satisfies TemplateArtDirection;

export const longPhungGatefoldOpeningModel = {
  object: "gatefold",
  closedInteraction: {
    mode: "tilt-and-flip",
    showsBackFace: true,
    pointerDrag: true,
    touchDrag: true,
    gestureThresholdPx: 8,
    settleBehavior: "hold",
  },
  affordance: "central clasp placed over the meeting seam of the two wings",
  hinges: [
    {
      part: "left-wing",
      transformOrigin: "inner-left edge of the center board",
    },
    {
      part: "right-wing",
      transformOrigin: "inner-right edge of the center board",
    },
  ],
  revealOrder: [
    "clasp response",
    "clasp release",
    "center seam",
    "inner wing shadows",
    "center invitation sheet",
    "couple names and wedding date",
    "DOM hero",
  ],
  cameraTransition:
    "preserve current camera/object pose at frame zero; interpolate to an opening-safe frontal pose while the clasp releases; dolly toward the center sheet only after both wings clear it",
  settleTarget:
    "inner center sheet matches the DOM hero rectangle, scale, background and camera-facing angle",
  durationMs: 1900,
  reducedMotionDurationMs: 200,
} satisfies PhysicalOpeningModel;

export const longPhungGatefoldAssetBible = {
  templateSlug: "long-phung-gatefold",
  culturalDirection:
    "contemporary Vietnamese lacquer-inspired ceremonial art; long-phung treated as an auspicious paired composition, not a dynastic costume reconstruction",
  historicalReference:
    "Vietnamese museum references for lacquer, crimson-and-gilded surfaces, and documented dragon-phoenix artifacts; no direct copying of a single artifact",
  primaryMotifs: [
    "serpentine dragon on the left wing",
    "phoenix with a readable crest and layered tail on the right wing",
    "restrained auspicious clouds",
    "small circular clasp without generated lettering",
  ],
  illustrationStyle:
    "engraved antique-gold linework and shallow relief over deep red lacquer; controlled negative space; no painterly background scene",
  lineWeight:
    "two-level system: strong outer contour that survives at 390px; finer inner engraving no thinner than one runtime pixel",
  palette: ["#5A0B12", "#7C1B1B", "#B58A3A", "#EAD9B8", "#17110F"],
  materialLanguage: [
    "deep lacquer",
    "antique-gold foil",
    "shallow emboss",
    "warm cotton paper",
  ],
  lightingDirection:
    "material reference light comes from upper-left; color assets contain no baked specular highlight",
  detailLevel: "medium",
  symmetryRule:
    "balanced pair, not mirrored clones; visual mass and gaze meet at the center clasp while anatomy and feather/scale rhythm remain species-specific",
  animationLayers: [
    "dragon-body-left",
    "dragon-whiskers-left",
    "dragon-cloud-front-left",
    "phoenix-body-right",
    "phoenix-wing-front-right",
    "phoenix-tail-front-right",
    "cloud-back",
    "cloud-front",
  ],
  requiredMasks: [
    "dragon-foil-mask",
    "dragon-emboss-mask",
    "phoenix-foil-mask",
    "phoenix-emboss-mask",
    "foil-roughness",
    "paper-normal",
  ],
  mobileReadabilityRule:
    "at a projected closed-cover width of 320px, both animal silhouettes, heads and center-facing gesture must remain identifiable; remove sub-pixel engraving rather than increasing contrast noise",
  avoid: [
    "AI-generated text, signature or watermark",
    "generic East Asian fantasy dragon",
    "Japanese or Chinese costume or crest elements added without a source",
    "mixing motifs from multiple Vietnamese dynasties and calling the result historical",
    "extra legs, claws, wings, horns or fused anatomy",
    "mechanically mirrored animals or mirrored lighting",
    "baked foil highlight or baked contact shadow in color art",
    "dense decoration through the center text safe zone",
    "flat composite containing both animals and the whole cover",
    "alpha halo, colored matte or clipped feathers and whiskers",
  ],
} satisfies AssetBible;

export const longPhungGatefoldPilot = {
  slug: "long-phung-gatefold",
  rendererFamily: "gatefold",
  semanticLayers: {
    dragonBody: null,
    dragonWhiskers: null,
    dragonCloudFront: null,
    phoenixBody: null,
    phoenixWingFront: null,
    phoenixTailFront: null,
    cloudBack: null,
  } as const,
  assets: {
    dragon: "/chungdoi/templates/long-phung-gatefold/cover/dragon-left-composite-v2.webp",
    phoenix: "/chungdoi/templates/long-phung-gatefold/cover/phoenix-right-composite-v1.webp",
    cloudFront: "/chungdoi/templates/long-phung-gatefold/opening/cloud-front-candidate-v1.webp",
  },
  palette: {
    lacquerCrimson: "#5A0B12",
    deepCinnabar: "#7C1B1B",
    antiqueGold: "#B58A3A",
    warmIvory: "#EAD9B8",
    lacquerBlack: "#17110F",
  },
  physicalOpening: {
    gestureThresholdPx: 8,
    desktopDurationMs: 1900,
    mobileDurationMs: 1650,
    reducedMotionDurationMs: 200,
    rightWingStaggerMs: 70,
    labels: [
      "anticipation",
      "release",
      "unfold",
      "reveal",
      "settle",
      "handoff",
    ] as const satisfies readonly GatefoldMotionPhase[],
  },
} as const;

const pilotDemoContent = createTemplateDemoContent({
  slug: longPhungGatefoldPilot.slug,
  primaryColor: longPhungGatefoldPilot.palette.lacquerCrimson,
  fontFamily: "Fz Aghita",
  music: "/chungdoi/music/editorial-noir.mp3",
  gallerySlug: "editorial-noir",
  galleryCount: 8,
  brideFullName: "Trần An Nhiên",
  brideShortName: "An Nhiên",
  groomFullName: "Nguyễn Minh Khôi",
  groomShortName: "Minh Khôi",
  date: "2026-12-12",
  time: "18:00",
});

export const longPhungGatefoldPilotContent = {
  ...pilotDemoContent,
  ceremonies: [
    {
      title: "Lễ thành hôn tại tư gia nhà trai",
      date: "2026-12-12",
      time: "09:00",
    },
    {
      title: "Lễ vu quy tại tư gia nhà gái",
      date: "2026-12-12",
      time: "11:00",
    },
  ],
  albumLayout: "mosaic",
} satisfies ChungDoiDemoContent;

export function gatefoldOpeningDuration({
  isMobile,
  reducedMotion,
}: {
  isMobile: boolean;
  reducedMotion: boolean;
}): number {
  if (reducedMotion) {
    return longPhungGatefoldPilot.physicalOpening.reducedMotionDurationMs;
  }

  return isMobile
    ? longPhungGatefoldPilot.physicalOpening.mobileDurationMs
    : longPhungGatefoldPilot.physicalOpening.desktopDurationMs;
}

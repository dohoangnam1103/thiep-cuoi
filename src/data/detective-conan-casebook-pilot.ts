import type { ChungDoiDemoContent } from "./chungdoi-demo-content";
import { createTemplateDemoContent } from "./templates/template-manifest";

export type DetectiveConanCasebookExperienceState =
  "closed" | "opening" | "handoff" | "opened";

export type DetectiveConanCasebookMotionPhase =
  | "anticipation"
  | "unlock"
  | "cover-turn"
  | "page-reveal"
  | "settle"
  | "handoff";

export const detectiveConanCasebookArtDirection = {
  layoutFamily: "casebook-page-turn",
  coverGeometry:
    "a deep-navy hardbound detective casebook with a raised spine, layered ivory paper block, restrained red evidence seal and Shinichi-Ran wedding portrait inset",
  openingMechanism:
    "the explicit open button releases the cover, the weighted front board turns around its spine, the first sheet lifts and settles into the same rectangle as the pre-mounted DOM reader",
  typography: {
    display: '"SVN-HC Built Titling", HelveticaNeue, sans-serif',
    body: '"HelveticaNeue", "Be Vietnam Pro", sans-serif',
    hierarchy:
      "compact case labels and large centered couple names for short display copy; neutral sans for dates, addresses, controls, forms and long messages",
  },
  colorPalette:
    "midnight navy #081A2E; case blue #123A63; paper #F6F1E7; ink #172437; signal red #C73B45; white #FFFCF5",
  materialPreset:
    "woven navy book cloth, matte ivory paper, painted paper edges, low-gloss inset portrait and a small embossed evidence seal",
  lightingPreset:
    "cool upper-left key, quiet warm bounce from the open paper and a soft contact shadow under the book",
  motionPreset:
    "weighted spine rotation, restrained paper follow-through, camera alignment and overlapping canvas-to-DOM handoff without a visible cut",
  soundPreset:
    "one cover-latch click, a short paper sweep and a soft page-seat cue; shared mute state",
  sectionCompositions: [
    "sealed Shinichi and Ran cover",
    "invitation dossier with Conan and Kogoro",
    "two-family statements",
    "ceremony coordinates and schedule",
    "Detective Boys timeline",
    "East-West detectives and allies",
    "witness wishes and gift drawer",
    "case-closed cast finale",
  ],
} as const;

export const detectiveConanCasebookOpeningModel = {
  object: "casebook",
  openTrigger: "explicit-button",
  closedInteraction: {
    mode: "tilt",
    pointerDrag: true,
    touchDrag: true,
    gestureThresholdPx: 8,
    settleBehavior: "hold",
  },
  affordance:
    "the native Mở hồ sơ button is the only opening trigger; dragging only changes the closed inspection angle",
  hinges: [
    {
      part: "front-cover",
      transformOrigin: "left spine",
    },
    {
      part: "first-sheet",
      transformOrigin: "left paper gutter",
    },
  ],
  revealOrder: [
    "cover latch response",
    "weighted front-cover turn",
    "first paper sheet",
    "Shinichi and Ran names",
    "wedding date",
    "DOM casebook reader",
  ],
  cameraTransition:
    "preserve the current inspection pose, ease toward a reading angle while the cover clears the page, then align the first paper rectangle with the pre-mounted DOM sheet",
  settleTarget:
    "the Three.js first sheet and DOM first page share the same aspect ratio, paper color, couple composition and viewport anchor",
  handoff:
    "keep the DOM reader mounted below the canvas, reveal it during the final settle, transfer focus after geometry is stable and leave the demand-rendered canvas asleep until replay or route teardown",
  durationMs: 1750,
  mobileDurationMs: 1500,
  reducedMotionDurationMs: 220,
} as const;

const characterRoot = "/chungdoi/templates/detective-conan-casebook/characters";

export const detectiveConanCasebookPilot = {
  slug: "detective-conan-casebook",
  rendererFamily: "casebook-page-turn",
  assets: {
    shinichiRan: `${characterRoot}/shinichi-ran-wedding.webp`,
    shinichiRanMobile: `${characterRoot}/shinichi-ran-wedding.mobile.webp`,
    conanKogoro: `${characterRoot}/conan-kogoro.webp`,
    conanKogoroMobile: `${characterRoot}/conan-kogoro.mobile.webp`,
    detectiveBoys: `${characterRoot}/detective-boys.webp`,
    detectiveBoysMobile: `${characterRoot}/detective-boys.mobile.webp`,
    heijiFriends: `${characterRoot}/heiji-friends.webp`,
    heijiFriendsMobile: `${characterRoot}/heiji-friends.mobile.webp`,
    akaiFuruya: `${characterRoot}/akai-furuya.webp`,
    akaiFuruyaMobile: `${characterRoot}/akai-furuya.mobile.webp`,
  },
  palette: {
    midnight: "#081A2E",
    caseBlue: "#123A63",
    paper: "#F6F1E7",
    ink: "#172437",
    signalRed: "#C73B45",
    white: "#FFFCF5",
  },
  physicalOpening: {
    gestureThresholdPx:
      detectiveConanCasebookOpeningModel.closedInteraction.gestureThresholdPx,
    desktopDurationMs: detectiveConanCasebookOpeningModel.durationMs,
    mobileDurationMs: detectiveConanCasebookOpeningModel.mobileDurationMs,
    reducedMotionDurationMs:
      detectiveConanCasebookOpeningModel.reducedMotionDurationMs,
    labels: [
      "anticipation",
      "unlock",
      "cover-turn",
      "page-reveal",
      "settle",
      "handoff",
    ] as const satisfies readonly DetectiveConanCasebookMotionPhase[],
  },
} as const;

const pilotDemoContent = createTemplateDemoContent({
  slug: detectiveConanCasebookPilot.slug,
  primaryColor: detectiveConanCasebookPilot.palette.caseBlue,
  fontFamily: "SVN-HC Built Titling",
  music: "/chungdoi/music/editorial-noir.mp3",
  gallerySlug: "editorial-noir",
  galleryCount: 6,
  brideFullName: "Ran Mouri",
  brideShortName: "Ran",
  groomFullName: "Shinichi Kudo",
  groomShortName: "Shinichi",
  date: "2026-12-12",
  time: "18:00",
});

export const detectiveConanCasebookPilotContent = {
  ...pilotDemoContent,
  couple: {
    ...pilotDemoContent.couple,
    openingMessage:
      "Mọi bí ẩn đều có lời giải. Riêng câu chuyện của chúng mình có một đáp án duy nhất: cùng nhau đi hết cuộc đời.",
    ceremonyHeader: "HỒ SƠ HÔN LỄ ĐƯỢC MỞ TẠI\nTƯ GIA HAI BÊN",
  },
  families: {
    brideFather: "Kogoro Mouri",
    brideMother: "Eri Kisaki",
    brideAddress: "Khu Beika, Tokyo",
    groomFather: "Yusaku Kudo",
    groomMother: "Yukiko Kudo",
    groomAddress: "Khu Beika, Tokyo",
    brideParentTitle: "Gia đình",
    groomParentTitle: "Gia đình",
  },
  venue: {
    address: "Đại sảnh Beika Grand\n2-21 Beika, Tokyo",
    mapAddress: "Beika Grand, Tokyo",
    banquetTime: "18:00",
  },
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
  schedule: [
    { time: "17:30", label: "Đón khách và nhận hồ sơ" },
    { time: "18:00", label: "Mở lời mời thành hôn" },
    { time: "18:20", label: "Nghi thức trao nhẫn" },
    { time: "18:40", label: "Khai tiệc" },
    { time: "20:30", label: "Lời cảm ơn và chụp ảnh" },
  ],
  wishes: [
    {
      name: "Đội thám tử nhí",
      time: "2026-11-18T09:15:00.000Z",
      text: "Chúc Shinichi và Ran luôn tin tưởng nhau, cùng giải mọi thử thách và hạnh phúc thật lâu.",
    },
    {
      name: "Sonoko Suzuki",
      time: "2026-11-20T12:30:00.000Z",
      text: "Hồ sơ chờ đợi lâu nhất cuối cùng đã khép lại bằng một đám cưới thật đẹp!",
    },
  ],
  dressCodeColors: "#123A63,#C73B45,#F6F1E7,#172437",
  albumLayout: "mosaic",
  showHeroImage: false,
} satisfies ChungDoiDemoContent;

export function detectiveConanCasebookOpeningDuration({
  isMobile,
  reducedMotion,
}: {
  isMobile: boolean;
  reducedMotion: boolean;
}): number {
  if (reducedMotion) {
    return detectiveConanCasebookPilot.physicalOpening.reducedMotionDurationMs;
  }

  return isMobile
    ? detectiveConanCasebookPilot.physicalOpening.mobileDurationMs
    : detectiveConanCasebookPilot.physicalOpening.desktopDurationMs;
}

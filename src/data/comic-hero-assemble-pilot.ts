import type { ChungDoiDemoContent } from "./chungdoi-demo-content";
import { createTemplateDemoContent } from "./templates/template-manifest";

/**
 * Comic Hero Assemble — a superhero-comic wedding invitation.
 *
 * The design language is the genre grammar of a printed hero comic: newsprint
 * halftone, hard black inking, hard-offset panel shadows, radial speed lines,
 * ragged sound-effect bursts and speech balloons. Every decorative surface is
 * generated from CSS gradients and clip-paths (see the "Comic Hero Assemble"
 * block in globals.css), so the template ships with zero bitmap decor.
 *
 * The narrative maps comic tropes onto real invitation data rather than onto
 * licensed characters: the couple's short names read as codenames, their full
 * names as secret identities, and each family becomes an origin-story panel.
 */
export const comicHeroAssembleArtDirection = {
  layoutFamily: "comic-issue",
  coverGeometry:
    "full-bleed comic cover: issue banner across the top, rotating speed-line burst behind a tilted photo panel, oversized inked codenames and a ragged corner badge",
  typography: {
    display: '"SVN-HC Marvin Visions", HelveticaNeue, sans-serif',
    body: "HelveticaNeue, Arial, sans-serif",
    hierarchy:
      "heavy inked display caps for codenames, sound effects and section markers; neutral sans for addresses, captions and every long passage",
  },
  colorPalette:
    "newsprint #f6efdd; ink #12141f; hero red #d7263d; hero blue #1b4dc1; signal yellow #f9c22e",
  materialPreset:
    "uncoated pulp paper, saturated flat spot colours, 2-3px black ink outlines and 6px hard-offset panel shadows",
  motionPreset:
    "scroll-driven panel pop-in with a slight rotation, a slow throbbing sound-effect burst and a very slow speed-line rotation behind the cover",
  sectionCompositions: [
    "issue-cover hero with codename lockup",
    "origin-story hero cards for both families",
    "team-up splash with sound-effect burst",
    "mission-briefing ceremony and reception panels",
    "countdown strip",
    "calendar panel with starburst highlight",
    "headquarters map panel",
    "numbered sequential schedule panels",
    "album panel grid",
    "squad dress-code chips",
    "guestbook speech balloons",
    "supply-drop gift panel",
    "to-be-continued finale",
  ],
} as const;

export const comicHeroAssemblePalette = {
  newsprint: "#f6efdd",
  paper: "#fffaf0",
  ink: "#12141f",
  red: "#d7263d",
  blue: "#1b4dc1",
  yellow: "#f9c22e",
} as const;

const pilotDemoContent = createTemplateDemoContent({
  slug: "comic-hero-assemble",
  primaryColor: comicHeroAssemblePalette.red,
  fontFamily: "SVN-HC Marvin Visions",
  music: "/chungdoi/music/editorial-noir.mp3",
  gallerySlug: "chibi-red",
  galleryCount: 4,
  brideFullName: "Lê Vân Khánh",
  brideShortName: "Vân Khánh",
  groomFullName: "Trần Hải Đăng",
  groomShortName: "Hải Đăng",
  date: "2026-05-02",
  time: "18:30",
});

export const comicHeroAssemblePilotContent = {
  ...pilotDemoContent,
  couple: {
    ...pilotDemoContent.couple,
    openingMessage:
      "Mọi vũ trụ đều có một khoảnh khắc mà hai đường số phận cắt nhau. Với chúng mình, khoảnh khắc đó là ngày hôm nay.",
  },
  schedule: [
    { time: "17:30", label: "Tập hợp tại tổng bộ, đón khách" },
    { time: "18:00", label: "Nghi thức hôn lễ" },
    { time: "18:30", label: "Khai tiệc, nâng ly chúc mừng" },
    { time: "20:00", label: "Chụp ảnh cùng cả biệt đội" },
  ],
  dressCodeColors: `${comicHeroAssemblePalette.red},${comicHeroAssemblePalette.blue},${comicHeroAssemblePalette.yellow},${comicHeroAssemblePalette.newsprint}`,
  wishes: [
    {
      name: "Biệt đội Hoá Sinh K18",
      time: "2026-04-20T02:15:00.000Z",
      text: "Từ hôm nay hai đứa chính thức chung một chiến tuyến. Chúc vợ chồng mình luôn là hậu phương của nhau!",
    },
    {
      name: "Gia đình Thu Trang",
      time: "2026-04-21T04:40:00.000Z",
      text: "Chúc hai bạn bình an, thấu hiểu và cùng nhau đi thật xa.",
    },
    {
      name: "Nhóm bạn cấp ba",
      time: "2026-04-22T11:05:00.000Z",
      text: "Chờ mãi cũng đến số cuối của bộ truyện này. Hạnh phúc nhé hai đứa!",
    },
  ],
  albumLayout: "mosaic",
  showHeroImage: true,
} satisfies ChungDoiDemoContent;

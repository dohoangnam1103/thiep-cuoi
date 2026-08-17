import {
  comicHeroAssemblePalette,
  comicHeroAssemblePilotContent,
} from "../comic-hero-assemble-pilot";
import { defineTemplateManifest } from "./template-manifest";

const slug = "comic-hero-assemble";

export const manifest = defineTemplateManifest({
  slug,
  viRouteSlug: "sieu-anh-hung-comic",
  rendererExport: "ComicHeroAssembleInvitation",
  heroImageCount: 1,
  catalog: {
    name: "Anh Hùng Hội Tụ",
    title: "Comic Hero Assemble Wedding Invitation | Thiệp Mừng Online",
    description:
      "Thiệp cưới dựng như một số truyện tranh siêu anh hùng: giấy báo halftone, khung truyện ép mực, hiệu ứng nổ và sổ lưu bút dạng bong bóng thoại.",
    category: "Playful",
    color: "Red",
    isNew: true,
    highlights: [
      "Bìa số 01 với speed lines quay chậm sau khung ảnh nghiêng",
      "Hai bên gia đình thành hai khung nguồn gốc anh hùng",
      "Lời chúc hiện ra dưới dạng bong bóng thoại truyện tranh",
    ],
  },
  theme: {
    theme: {
      background: comicHeroAssemblePalette.newsprint,
      cardBg: comicHeroAssemblePalette.paper,
      textPrimary: comicHeroAssemblePalette.ink,
      textSecondary: "rgba(18, 20, 31, 0.68)",
      accent: comicHeroAssemblePalette.red,
      dividerFrom: "transparent",
      dividerTo: "rgba(18, 20, 31, 0.45)",
      buttonBg: comicHeroAssemblePalette.red,
      buttonText: comicHeroAssemblePalette.paper,
      guestBoxBg: "rgba(255, 250, 240, 0.9)",
      guestBoxBorder: "rgba(18, 20, 31, 0.22)",
      particleColors: [
        comicHeroAssemblePalette.red,
        comicHeroAssemblePalette.blue,
        comicHeroAssemblePalette.yellow,
      ],
      particleType: "confetti",
    },
    fonts: {
      couple: '"SVN-HC Marvin Visions", HelveticaNeue, sans-serif',
      ampersand: null,
    },
    sealType: null,
    decorations: { cardImages: [] },
  },
  demoContent: comicHeroAssemblePilotContent,
  i18n: {
    vi: {
      name: "Anh Hùng Hội Tụ",
      description:
        "Một số truyện tranh siêu anh hùng: khung truyện ép mực, hiệu ứng nổ và lời chúc dạng bong bóng thoại.",
    },
    en: {
      name: "Comic Hero Assemble",
      description:
        "A superhero comic issue with inked panels, sound-effect bursts and guest wishes drawn as speech balloons.",
    },
    ja: {
      name: "ヒーロー・アッセンブル",
      description:
        "劇画調のコマ割りと効果音バースト、吹き出しで届くお祝いメッセージのヒーローコミック招待状です。",
    },
    ko: {
      name: "히어로 어셈블",
      description:
        "잉크 라인 패널과 효과음 버스트, 말풍선으로 전하는 축하 메시지가 담긴 히어로 코믹 청첩장입니다.",
    },
    zh: {
      name: "英雄集结",
      description:
        "以漫画分镜、爆炸音效框与对话气泡祝福语构成的超级英雄风格婚礼请柬。",
    },
  },
  // Every decorative surface is generated from CSS gradients and clip-paths,
  // so this template ships without any bitmap decor of its own.
  assets: [],
});

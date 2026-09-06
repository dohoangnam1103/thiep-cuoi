import { chungdoiThemeConfig } from "@/data/chungdoi-theme-config";
import { resolveZodiacCardImages } from "@/lib/zodiac-decor";

export type OgCoupleContent = {
  brideShortName: string;
  groomShortName: string;
  brideFullName: string;
  groomFullName: string;
  brideFirst: boolean;
};

export function resolveCoupleNames(content: OgCoupleContent): string {
  const bride = content.brideShortName || content.brideFullName;
  const groom = content.groomShortName || content.groomFullName;
  const first = content.brideFirst ? bride : groom;
  const second = content.brideFirst ? groom : bride;
  return [first, second].filter(Boolean).join(" & ");
}

export function resolveOgDate(date: string): string {
  return date.trim();
}

const FONT_FILE_BY_FAMILY: Record<string, string> = {
  "Fz Aghita": "FzAghita.ttf",
  "Fz Qellia": "Fz_Qellia_Fix.ttf",
  "UNI Chu truyen thong": "UNI_Chu_truyen_thong.ttf",
  "DFVN New Eddy": "DFVN-NewEddy-Regular.otf",
  Pattaya: "Pattaya-Regular.woff",
  "1FTV VIP Signora": "1FTV-VIP-Signora-Regular.otf",
  "SVN-HC Haydon Brush": "SVN-HC-Haydon-Brush.otf",
  Lora: "Lora-Regular.ttf",
  "Viaoda Libre": "ViaodaLibre-Regular.ttf",
  "The Nautigal": "TheNautigal-Regular.ttf",
  "SVN-HC Built Titling": "SVN-HC-Built-Titling.otf",
  "Alex Brush": "AlexBrush-Regular.ttf",
  "SVN-HC Pacifico": "SVN-HC-Pacifico.otf",
  HelveticaNeue: "HelveticaNeueLight.otf",
  "SVN-HC Marvin Visions": "SVN-HC-Marvin-Visions.otf",
};

const FALLBACK_FONT = { family: "Lora", file: "Lora-Regular.ttf" };

function firstFontFamily(stack: string | null | undefined): string | null {
  if (!stack) return null;
  const match = stack.match(/^\s*"?([^",]+)"?/);
  return match ? match[1].trim() : null;
}

export function resolveOgFont(templateId: string): { family: string; file: string } {
  const family = firstFontFamily(chungdoiThemeConfig[templateId]?.fonts.couple);
  if (family && FONT_FILE_BY_FAMILY[family]) {
    return { family, file: FONT_FILE_BY_FAMILY[family] };
  }
  return { ...FALLBACK_FONT };
}

export type OgDecor = { src: string; className: string };

export type OgTheme = {
  background: string;
  cardBg: string;
  textPrimary: string;
  textSecondary: string;
  accent: string;
  decor: OgDecor[];
};

export function resolveOgTheme(templateId: string, primaryColor: string): OgTheme {
  const cfg = chungdoiThemeConfig[templateId];
  if (cfg) {
    const cardImages = resolveZodiacCardImages(cfg.decorations.cardImages);
    return {
      background: cfg.theme.background,
      cardBg: cfg.theme.cardBg,
      textPrimary: cfg.theme.textPrimary,
      textSecondary: cfg.theme.textSecondary,
      accent: cfg.theme.accent,
      decor: cardImages.map((img) => ({
        src: img.src,
        className: img.className,
      })),
    };
  }
  const accent = primaryColor || "#710001";
  return {
    background: `linear-gradient(to bottom right, ${accent}, ${accent})`,
    cardBg: "rgba(255, 250, 244, 0.96)",
    textPrimary: accent,
    textSecondary: accent,
    accent,
    decor: [],
  };
}

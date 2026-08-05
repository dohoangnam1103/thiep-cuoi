import type { ChungDoiCardImage } from "@/data/chungdoi-theme-config";
import { orderByBrideFirst } from "@/lib/invitation-display";
import {
  isZodiacId,
  zodiacArtworkPath,
  type ZodiacArtworkId,
  type ZodiacArtworkVariant,
} from "@/lib/zodiac";

type ZodiacDecorationContent = {
  couple?: {
    brideZodiac?: string;
    groomZodiac?: string;
    brideFirst?: boolean;
  };
};

const PLACEHOLDER_PATTERN = /^\{\{[^{}]+\}\}$/;

type TokenSpec = {
  side: "first" | "second";
  variant: ZodiacArtworkVariant;
};

const TOKEN_SPECS: Readonly<Record<string, TokenSpec>> = {
  "{{brideZodiac}}": { side: "first", variant: "filled" },
  "{{groomZodiac}}": { side: "second", variant: "filled" },
  "{{brideZodiacLine}}": { side: "first", variant: "line" },
  "{{groomZodiacLine}}": { side: "second", variant: "line" },
};

function resolvedArtworkId(
  value: string | undefined,
  fallback: ZodiacArtworkId,
): ZodiacArtworkId {
  return isZodiacId(value) ? value : fallback;
}

export function resolveZodiacCardImages(
  cardImages: ChungDoiCardImage[],
  content?: ZodiacDecorationContent,
): ChungDoiCardImage[] {
  if (!cardImages.some((image) => PLACEHOLDER_PATTERN.test(image.src))) {
    return cardImages;
  }

  const bride = resolvedArtworkId(content?.couple?.brideZodiac, "phuong");
  const groom = resolvedArtworkId(content?.couple?.groomZodiac, "rong");
  const [first, second] = orderByBrideFirst(
    bride,
    groom,
    content?.couple?.brideFirst ?? true,
  );

  return cardImages.map((image) => {
    if (!PLACEHOLDER_PATTERN.test(image.src)) return image;

    const spec = TOKEN_SPECS[image.src];
    const id = spec?.side === "first" ? first : spec?.side === "second" ? second : "rong";
    const variant = spec?.variant ?? "filled";
    return {
      ...image,
      src: zodiacArtworkPath(id, variant),
    };
  });
}

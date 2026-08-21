export type LayeredImageGiftVisual = {
  kind: "layered-image";
  asset: string;
};

export type GiftboxGiftVisual = {
  kind: "giftbox";
  boxImage: string;
  decorImages: readonly string[];
};

export type ProceduralGiftVisual = {
  kind: "procedural";
};

export type GiftVisual =
  | LayeredImageGiftVisual
  | GiftboxGiftVisual
  | ProceduralGiftVisual;

const ENVELOPE_TEMPLATE_SLUGS = [
  "song-hy-red",
  "song-hy-green",
  "double-dragon-red",
  "double-phoenix-red",
  "elegant-leaf-green",
  "dragon-phoenix-red",
  "dragon-phoenix-v3-red",
  "dragon-phoenix-v2-red",
  "double-dragon-green",
  "boho-floral-green",
  "boho-floral-pink",
  "jasmine-white",
  "silk-flora-brown",
  "chateau-blue",
  "brocade-flower-red",
  "crystal-floral-blue",
  "baroque-gold",
  "qasr-green",
  "qasr-gold",
  "royal-red",
  "nhat-binh-red",
  "hoa-tinh-red",
  "co-ba-red",
  "royal-blue",
  "royal-green",
  "spring-garden-green",
  "chibi-red",
  "boho-floral-brown",
  "spring-garden-red",
  "dragon-phoenix-green",
  "spring-garden-blue",
  "minimalism-red",
  "minimalism-dark-red",
  "cherry-blossom-pink",
  "double-phoenix-green",
  "double-dragon-blue",
  "dragon-phoenix-blue",
  "dragon-phoenix-black",
] as const;

export const SOURCE_GIFT_VISUAL_SLUGS = [
  ...ENVELOPE_TEMPLATE_SLUGS,
  "chateau-green",
  "glass-garden-green",
  "glass-garden-pink",
] as const;

const envelopeVisuals = Object.fromEntries(
  ENVELOPE_TEMPLATE_SLUGS.map((slug) => [
    slug,
    {
      kind: "layered-image",
      asset: `/chungdoi/images/giftbox/${slug}/envelope.webp`,
    } satisfies LayeredImageGiftVisual,
  ]),
) as Record<(typeof ENVELOPE_TEMPLATE_SLUGS)[number], LayeredImageGiftVisual>;

const sourceGiftVisuals: Record<string, GiftVisual> = {
  ...envelopeVisuals,
  "chateau-green": {
    kind: "giftbox",
    boxImage: "/chungdoi/images/giftbox/chateau-green/box.webp",
    decorImages: [
      "/chungdoi/images/giftbox/mini/dragon_phoenix_v2.webp",
      "/chungdoi/images/giftbox/mini/glass_garden_green.webp",
      "/chungdoi/images/giftbox/mini/saraya_gold.webp",
      "/chungdoi/images/giftbox/mini/qasr_gold.webp",
      "/chungdoi/images/giftbox/mini/chateau_blue.webp",
      "/chungdoi/images/giftbox/mini/spring_garden_red.webp",
      "/chungdoi/images/giftbox/mini/spring_garden_green.webp",
    ],
  },
  "glass-garden-green": {
    kind: "giftbox",
    boxImage: "/chungdoi/images/giftbox/glass-garden-green/box.webp",
    decorImages: [
      "/chungdoi/images/giftbox/mini/saraya_gold.webp",
      "/chungdoi/images/giftbox/mini/jasmine_white.webp",
      "/chungdoi/images/giftbox/mini/double_phoenix_red.webp",
      "/chungdoi/images/giftbox/mini/baroque_gold.webp",
      "/chungdoi/images/giftbox/mini/boho_floral_pink.webp",
      "/chungdoi/images/giftbox/mini/brocade_flower_red.webp",
      "/chungdoi/images/giftbox/mini/chateau_green.webp",
    ],
  },
  "glass-garden-pink": {
    kind: "giftbox",
    boxImage: "/chungdoi/images/giftbox/glass-garden-pink/box.webp",
    decorImages: [
      "/chungdoi/images/giftbox/mini/crystal_floral_green.webp",
      "/chungdoi/images/giftbox/mini/spring_garden_green.webp",
      "/chungdoi/images/giftbox/mini/spring_garden_red.webp",
      "/chungdoi/images/giftbox/mini/spring_garden_blue.webp",
      "/chungdoi/images/giftbox/mini/royal.webp",
      "/chungdoi/images/giftbox/mini/royal_red.webp",
      "/chungdoi/images/giftbox/mini/double_dragon_red.webp",
    ],
  },
};

const originalGiftVisuals: Record<string, GiftVisual> = {
  "ivory-signature": {
    kind: "layered-image",
    asset: "/chungdoi/images/giftbox/ivory-signature/envelope.webp",
  },
};

const PROCEDURAL_FALLBACK: ProceduralGiftVisual = { kind: "procedural" };

export function resolveGiftVisual(templateSlug: string): GiftVisual {
  return sourceGiftVisuals[templateSlug] ?? originalGiftVisuals[templateSlug] ?? PROCEDURAL_FALLBACK;
}

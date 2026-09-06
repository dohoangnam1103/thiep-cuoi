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
  "minimalism-dark-blue",
  "minimalism-green",
  "minimalism-jade",
  "minimalism-sky-blue",
  "minimalism-powder-pink",
  "minimalism-purple",
  "cherry-blossom-pink",
  "double-phoenix-green",
  "double-dragon-blue",
  "dragon-phoenix-blue",
  "dragon-phoenix-black",
  "lien-hoa-pink",
  "sunflower",
] as const;

export const SOURCE_GIFT_VISUAL_SLUGS = [
  ...ENVELOPE_TEMPLATE_SLUGS,
  "chateau-green",
  "crystal-floral-red",
  "glass-garden-green",
  "glass-garden-pink",
  "minimalism-brown",
  "mahal-gold",
  "hoa-kho-orange",
  "porcelain-blue",
  "porcelain-red",
  "porcelain-brown",
  "porcelain-v2-red",
  "porcelain-v2-green",
  "royal-v2-green",
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
  "hong-van-rose": {
    kind: "layered-image",
    asset: "/chungdoi/images/envelope/crystal_floral_red.webp",
  },
  "porcelain-blue": {
    kind: "giftbox",
    boxImage: "/chungdoi/images/giftbox/porcelain-blue/box.webp",
    decorImages: [
      "/chungdoi/images/giftbox/mini/qasr_green.webp",
      "/chungdoi/images/giftbox/mini/crystal_floral_red.webp",
      "/chungdoi/images/giftbox/mini/boho_floral_brown.webp",
      "/chungdoi/images/giftbox/mini/crystal_floral_blue.webp",
      "/chungdoi/images/giftbox/mini/baroque_v2_darkred.webp",
      "/chungdoi/images/giftbox/mini/nhat_binh_red.webp",
      "/chungdoi/images/giftbox/mini/minimalism_darkblue.webp",
    ],
  },
  "porcelain-red": {
    kind: "layered-image",
    asset: "/chungdoi/images/envelope/porcelain_red.webp",
  },
  "porcelain-brown": {
    kind: "layered-image",
    asset: "/chungdoi/images/envelope/porcelain_brown.webp",
  },
  "porcelain-v2-red": {
    kind: "layered-image",
    asset: "/chungdoi/images/envelope/porcelain_v2_red.webp",
  },
  "porcelain-v2-green": {
    kind: "layered-image",
    asset: "/chungdoi/images/envelope/porcelain_v2_green.webp",
  },
  "hoa-kho-orange": { kind: "layered-image", asset: "/chungdoi/images/envelope/hoa_kho_orange.webp" },
  "mahal-gold": {
    kind: "layered-image",
    asset: "/chungdoi/images/envelope/mahal_gold.webp",
  },
  "crystal-floral-red": {
    kind: "layered-image",
    asset: "/chungdoi/images/envelope/crystal_floral_red.webp",
  },
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
  "minimalism-brown": {
    kind: "giftbox",
    boxImage: "/chungdoi/images/giftbox/minimalism-brown/box.webp",
    decorImages: [
      "/chungdoi/images/giftbox/mini/hoa_tinh_red.webp",
      "/chungdoi/images/giftbox/mini/minimalism_red.webp",
      "/chungdoi/images/giftbox/mini/royal_red.webp",
      "/chungdoi/images/giftbox/mini/minimalism_green.webp",
      // Bản gốc trỏ `mini/sunflower_yellow.webp` nhưng file đó 404 ngay trên
      // chungdoi.com (ảnh hỏng, natural size 0×0), nên dùng ảnh khác cùng bộ.
      "/chungdoi/images/giftbox/mini/saraya_gold.webp",
      "/chungdoi/images/giftbox/mini/minimalism_purple.webp",
      "/chungdoi/images/giftbox/mini/glass_garden_pink.webp",
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
  "royal-v2-green": {
    kind: "giftbox",
    boxImage: "/chungdoi/images/giftbox/royal-v2-green/box.webp",
    decorImages: Array.from(
      { length: 7 },
      (_, index) => `/chungdoi/images/giftbox/royal-v2-green/decor-${index + 1}.webp`,
    ),
  },
};

const originalGiftVisuals: Record<string, GiftVisual> = {
  "ivory-signature": {
    kind: "layered-image",
    asset: "/chungdoi/images/giftbox/ivory-signature/envelope.webp",
  },
  "nguyet-bach": {
    kind: "layered-image",
    asset: "/chungdoi/images/giftbox/nguyet-bach/envelope.webp",
  },
};

const PROCEDURAL_FALLBACK: ProceduralGiftVisual = { kind: "procedural" };

export function resolveGiftVisual(templateSlug: string): GiftVisual {
  return sourceGiftVisuals[templateSlug] ?? originalGiftVisuals[templateSlug] ?? PROCEDURAL_FALLBACK;
}

export type GiftVisualLayer = {
  role: "back" | "front";
  src: string;
  className: string;
  required: boolean;
};

export type LayeredImageGiftVisual = {
  kind: "layered-image";
  layers: readonly GiftVisualLayer[];
  wrapperClassName?: string;
};

export type GiftBoxVisual = {
  kind: "giftbox";
  boxImage: string;
  decorImages: readonly string[];
};

export type GiftVisual =
  | { kind: "procedural" }
  | LayeredImageGiftVisual
  | GiftBoxVisual;

const backLayerClassName = "ienv-back absolute inset-0 z-[1] h-full w-full origin-bottom object-contain object-bottom [filter:drop-shadow(0_8px_14px_rgba(0,0,0,0.18))] [transform:translateX(20%)_translateY(-10%)_scale(-0.8,0.8)_rotate(-15deg)]";
const frontLayerClassName = "ienv-card absolute inset-0 z-[2] h-full w-full object-contain object-bottom -rotate-[10deg] [filter:drop-shadow(0_10px_18px_rgba(0,0,0,0.22))]";
const doubleDragonWrapperClassName = "bg-[url('/images/double-dragon.webp')] bg-[length:clamp(300px,50vw,500px)] bg-center";

function pairedEnvelope(slug: string, wrapperClassName?: string): LayeredImageGiftVisual {
  const src = `/chungdoi/images/giftbox/${slug}/envelope.webp`;

  return {
    kind: "layered-image",
    layers: [
      {
        role: "back",
        src,
        className: backLayerClassName,
        required: true,
      },
      {
        role: "front",
        src,
        className: frontLayerClassName,
        required: true,
      },
    ],
    ...(wrapperClassName ? { wrapperClassName } : {}),
  };
}

const GIFT_VISUALS = {
  "boho-floral-green": pairedEnvelope("boho-floral-green"),
  "boho-floral-pink": pairedEnvelope("boho-floral-pink"),
  "boho-floral-brown": pairedEnvelope("boho-floral-brown"),
  "spring-garden-green": pairedEnvelope("spring-garden-green"),
  "spring-garden-blue": pairedEnvelope("spring-garden-blue"),
  "elegant-leaf-green": pairedEnvelope("elegant-leaf-green"),
  "jasmine-white": pairedEnvelope("jasmine-white"),
  "silk-flora-brown": pairedEnvelope("silk-flora-brown"),
  "hoa-tinh-red": pairedEnvelope("hoa-tinh-red"),
  "minimalism-red": pairedEnvelope("minimalism-red"),
  "crystal-floral-blue": pairedEnvelope("crystal-floral-blue"),
  "chibi-red": pairedEnvelope("chibi-red"),
  "double-dragon-red": pairedEnvelope("double-dragon-red", doubleDragonWrapperClassName),
  "double-dragon-blue": pairedEnvelope("double-dragon-blue", doubleDragonWrapperClassName),
  "double-dragon-green": pairedEnvelope("double-dragon-green", doubleDragonWrapperClassName),
  "dragon-phoenix-v3-red": pairedEnvelope("dragon-phoenix-v3-red"),
  "qasr-green": pairedEnvelope("qasr-green"),
  "qasr-gold": pairedEnvelope("qasr-gold"),
  "cherry-blossom-pink": {
    kind: "layered-image",
    layers: [
      {
        role: "front",
        src: "/chungdoi/images/envelope/cherry_blossom_pink.webp",
        className: frontLayerClassName,
        required: true,
      },
    ],
  },
  "chateau-green": {
    kind: "giftbox",
    boxImage: "/chungdoi/images/giftbox/chateau_green.webp",
    decorImages: [
      "/chungdoi/images/giftbox/mini/spring_garden_red.webp",
      "/chungdoi/images/giftbox/mini/spring_garden_green.webp",
      "/chungdoi/images/giftbox/mini/dragon_phoenix_v2.webp",
      "/chungdoi/images/giftbox/mini/saraya_gold.webp",
      "/chungdoi/images/giftbox/mini/qasr_gold.webp",
      "/chungdoi/images/giftbox/mini/chateau_blue.webp",
      "/chungdoi/images/giftbox/mini/glass_garden_green.webp",
    ],
  },
  "glass-garden-green": {
    kind: "giftbox",
    boxImage: "/chungdoi/images/giftbox/glass_garden_green.webp",
    decorImages: [
      "/chungdoi/images/giftbox/mini/boho_floral_pink.webp",
      "/chungdoi/images/giftbox/mini/saraya_gold.webp",
      "/chungdoi/images/giftbox/mini/jasmine_white.webp",
      "/chungdoi/images/giftbox/mini/double_phoenix_red.webp",
      "/chungdoi/images/giftbox/mini/baroque_gold.webp",
      "/chungdoi/images/giftbox/mini/chateau_green.webp",
      "/chungdoi/images/giftbox/mini/brocade_flower_red.webp",
    ],
  },
} satisfies Record<string, GiftVisual>;

export const CLONED_GIFT_VISUAL_SLUGS = Object.keys(GIFT_VISUALS);

export function resolveGiftVisual(slug: string): GiftVisual {
  if (slug in GIFT_VISUALS) {
    return GIFT_VISUALS[slug as keyof typeof GIFT_VISUALS];
  }

  return { kind: "procedural" };
}

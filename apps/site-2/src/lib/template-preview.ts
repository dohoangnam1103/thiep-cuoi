import { templatePreviewVersion } from "./template-preview-version";

export function templatePreviewUrl(source: string): string {
  const separator = source.includes("?") ? "&" : "?";
  return `${source}${separator}v=${templatePreviewVersion}`;
}

const listingImageHeights = {
  baroque_gold: 7666,
  boho_floral_brown: 7629,
  boho_floral_green: 8355,
  boho_floral_pink: 7576,
  brocade_flower_red: 8118,
  chateau_blue: 9381,
  chateau_green: 9536,
  cherry_blossom_pink: 8414,
  chibi_red: 7931,
  co_ba_red: 8130,
  crystal_floral_blue: 9168,
  double_dragon_blue: 7814,
  double_dragon_green: 8354,
  double_dragon_red: 7838,
  double_phoenix_green: 6856,
  double_phoenix_red: 7742,
  dragon_phoenix_black: 8694,
  dragon_phoenix_blue: 8904,
  dragon_phoenix_green: 8264,
  dragon_phoenix_red_480: 8904,
  dragon_phoenix_v2_red: 7450,
  dragon_phoenix_v3_red: 7056,
  elegant_leaf_green: 8106,
  glass_garden_green: 8045,
  hoa_tinh_red: 7310,
  jasmine_white: 8254,
  minimalism_red: 7411,
  nhat_binh_red: 7946,
  qasr_gold: 8350,
  qasr_green: 8746,
  royal_blue: 6613,
  royal_green: 6646,
  royal_red: 6677,
  silk_flora_brown: 8310,
  song_hy_green: 7853,
  song_hy_red: 7885,
  spring_garden_blue: 9226,
  spring_garden_green: 7698,
  spring_garden_red: 7670,
} as const;

export function listingImageHeight(src: string): number {
  const filename = src.slice(src.lastIndexOf("/") + 1, -".webp".length);
  return (
    listingImageHeights[filename as keyof typeof listingImageHeights] ?? 768
  );
}

/** Next.js Image Optimization API URL for template previews. Resizes the
 *  original (often 6000–9500px tall) down to `width` pixels wide so gallery
 *  cards never serve full-resolution artwork. Quality defaults to 84 which
 *  matches one of the configured qualities in next.config.ts. */
export function templatePreviewOptimizedUrl(
  source: string,
  width: number,
  quality = 84,
): string {
  const encoded = encodeURIComponent(templatePreviewUrl(source));
  return `/_next/image?url=${encoded}&w=${width}&q=${quality}`;
}

const HERO_IMAGE_TEMPLATE_SLUGS = new Set([
  "song-hy-red",
  "song-hy-green",
  "boho-floral-green",
  "boho-floral-brown",
  "elegant-leaf-green",
  "hoa-tinh-red",
  "cherry-blossom-pink",
  "dragon-phoenix-v3-red",
]);

const DUAL_HERO_IMAGE_TEMPLATE_SLUGS = new Set([
  "double-dragon-red",
  "double-dragon-blue",
  "boho-floral-pink",
]);

export function templateSupportsHeroImage(templateSlug: string): boolean {
  return HERO_IMAGE_TEMPLATE_SLUGS.has(templateSlug) || DUAL_HERO_IMAGE_TEMPLATE_SLUGS.has(templateSlug);
}

export function heroImageCount(templateSlug: string): 0 | 1 | 2 {
  if (DUAL_HERO_IMAGE_TEMPLATE_SLUGS.has(templateSlug)) return 2;
  if (HERO_IMAGE_TEMPLATE_SLUGS.has(templateSlug)) return 1;
  return 0;
}

const HERO_IMAGE_TEMPLATE_SLUGS = new Set([
  "song-hy-red",
  "song-hy-green",
  "cherry-blossom-pink",
  "dragon-phoenix-v3-red",
]);

// Templates whose card header shows two photos side by side.
const DUAL_HERO_IMAGE_TEMPLATE_SLUGS = new Set([
  "double-dragon-red",
  "double-dragon-blue",
  "double-dragon-green",
  "boho-floral-pink",
  "boho-floral-green",
  "boho-floral-brown",
  "elegant-leaf-green",
  "hoa-tinh-red",
]);

export function templateSupportsHeroImage(templateSlug: string): boolean {
  return HERO_IMAGE_TEMPLATE_SLUGS.has(templateSlug) || DUAL_HERO_IMAGE_TEMPLATE_SLUGS.has(templateSlug);
}

export function heroImageCount(templateSlug: string): 0 | 1 | 2 {
  if (DUAL_HERO_IMAGE_TEMPLATE_SLUGS.has(templateSlug)) return 2;
  if (HERO_IMAGE_TEMPLATE_SLUGS.has(templateSlug)) return 1;
  return 0;
}

const HERO_IMAGE_TEMPLATE_SLUGS = new Set([
  "song-hy-red",
  "song-hy-green",
  "boho-floral-green",
  "boho-floral-brown",
  "boho-floral-pink",
  "elegant-leaf-green",
  "hoa-tinh-red",
  "cherry-blossom-pink",
  "dragon-phoenix-v3-red",
]);

export function templateSupportsHeroImage(templateSlug: string): boolean {
  return HERO_IMAGE_TEMPLATE_SLUGS.has(templateSlug);
}

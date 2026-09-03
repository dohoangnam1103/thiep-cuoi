import { generatedTemplateManifests } from "@/data/templates/generated-data";
import type { TemplateManifest } from "@/data/templates/template-manifest";

const HERO_IMAGE_TEMPLATE_SLUGS = new Set([
  "song-hy-red",
  "song-hy-green",
  "cherry-blossom-pink",
  "dragon-phoenix-v3-red",
  "minimalism-dark-red",
  "minimalism-purple",
  "minimalism-brown",
  "minimalism-jade",
  "minimalism-sky-blue",
  "minimalism-powder-pink",
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
  // Cụm phong bì ở hero lồng hai ảnh nghiêng ngược chiều nhau.
  "minimalism-green",
]);

export function templateSupportsHeroImage(templateSlug: string): boolean {
  return heroImageCount(templateSlug) > 0;
}

export function templateSupportsZodiac(templateSlug: string): boolean {
  return templateSlug === "thap-nhi-chi-do";
}

export function heroImageCount(templateSlug: string): 0 | 1 | 2 {
  const generatedCount = (generatedTemplateManifests as readonly TemplateManifest[])
    .find((manifest) => manifest.slug === templateSlug)
    ?.heroImageCount;
  if (generatedCount !== undefined) return generatedCount;
  if (DUAL_HERO_IMAGE_TEMPLATE_SLUGS.has(templateSlug)) return 2;
  if (HERO_IMAGE_TEMPLATE_SLUGS.has(templateSlug)) return 1;
  return 0;
}

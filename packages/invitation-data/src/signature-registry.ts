import type { SiteId } from "@chungdoi/site-config";

export const SIGNATURE_TEMPLATE_SLUGS = [
  "jasmine-white",
  "silk-flora-brown",
] as const;

export type SignatureTemplateSlug =
  (typeof SIGNATURE_TEMPLATE_SLUGS)[number];

const SIGNATURE_SET: ReadonlySet<string> = new Set(SIGNATURE_TEMPLATE_SLUGS);

export function isSignatureTemplate(slug: string): boolean {
  return SIGNATURE_SET.has(slug);
}

export function isTemplateAvailable(siteId: SiteId, _slug: string): boolean {
  return siteId === "master";
}

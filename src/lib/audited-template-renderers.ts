export const AUDITED_TEMPLATE_SLUGS = [
  "boho-floral-green",
  "boho-floral-pink",
  "boho-floral-brown",
  "spring-garden-red",
  "spring-garden-green",
  "spring-garden-blue",
  "elegant-leaf-green",
  "jasmine-white",
  "silk-flora-brown",
  "hoa-tinh-red",
  "minimalism-red",
  "brocade-flower-red",
  "crystal-floral-blue",
  "baroque-gold",
  "glass-garden-green",
  "chibi-red",
  "cherry-blossom-pink",
  "editorial-noir",
  "ticket-terracotta",
  "zen-sand",
  "arch-sage",
] as const;

export type AuditedTemplateSlug = (typeof AUDITED_TEMPLATE_SLUGS)[number];

const auditedTemplateSlugSet = new Set<string>(AUDITED_TEMPLATE_SLUGS);

export function isAuditedTemplateSlug(slug: string): slug is AuditedTemplateSlug {
  return auditedTemplateSlugSet.has(slug);
}

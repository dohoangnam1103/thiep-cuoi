import {
  generatedTemplateSlugs,
  type GeneratedTemplateSlug,
} from "@/data/templates/generated-data";

export const BASE_AUDITED_TEMPLATE_SLUGS = [
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
  "glass-garden-pink",
  "lien-hoa-pink",
  "minimalism-dark-red",
  "minimalism-green",
  "minimalism-brown",
  "minimalism-jade",
  "minimalism-sky-blue",
  "minimalism-powder-pink",
  "minimalism-purple",
  "chibi-red",
  "cherry-blossom-pink",
  "sunflower",
] as const;

export const AUDITED_TEMPLATE_SLUGS = [
  ...BASE_AUDITED_TEMPLATE_SLUGS,
  ...generatedTemplateSlugs,
] as const;

export type BaseAuditedTemplateSlug = (typeof BASE_AUDITED_TEMPLATE_SLUGS)[number];
export type AuditedTemplateSlug = BaseAuditedTemplateSlug | GeneratedTemplateSlug;

const auditedTemplateSlugSet = new Set<string>(AUDITED_TEMPLATE_SLUGS);

export function isAuditedTemplateSlug(slug: string): slug is AuditedTemplateSlug {
  return auditedTemplateSlugSet.has(slug);
}

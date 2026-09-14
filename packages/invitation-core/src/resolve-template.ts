import type { SiteId } from "@chungdoi/site-config";
import type { TemplateDefinition } from "./types.js";

export type { TemplateDefinition };

export function resolveTemplateConfig<T extends Record<string, unknown>>(
  definition: TemplateDefinition<T>,
  siteId: SiteId,
  invitationOverride: Partial<T> = {},
): T {
  if (!definition.availableOn.includes(siteId)) {
    throw new Error(`Template ${definition.id} is not available on ${siteId}`);
  }

  return {
    ...definition.defaultConfig,
    ...(definition.siteVariants?.[siteId] ?? {}),
    ...invitationOverride,
  };
}

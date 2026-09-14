import type { SiteId } from "@chungdoi/site-config";

export type TemplateDefinition<T extends Record<string, unknown>> = {
  id: string;
  availableOn: readonly SiteId[];
  defaultConfig: T;
  siteVariants?: Partial<Record<SiteId, Partial<T>>>;
};

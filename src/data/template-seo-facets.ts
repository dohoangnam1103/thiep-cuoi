import {
  completedTemplates,
  type ChungDoiTemplate,
} from "@/data/chungdoi";
import type { TemplateSeoFacet } from "@/data/template-seo-facet-definitions";

export * from "@/data/template-seo-facet-definitions";

export function templatesForSeoFacet(
  facet: TemplateSeoFacet,
  templates: readonly ChungDoiTemplate[] = completedTemplates,
): ChungDoiTemplate[] {
  return templates.filter(
    (template) => template[facet.filterKey] === facet.filterValue,
  );
}

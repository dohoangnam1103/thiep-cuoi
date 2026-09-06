import type { ComponentType } from "react";

import type { ChungDoiDemoContent } from "@/data/chungdoi-demo-content";
import type { TemplateCeremonyRendering } from "@/data/templates/template-manifest";

export type TemplateRendererEntry = {
  component: ComponentType<{ content: ChungDoiDemoContent }>;
  ceremonyRendering: TemplateCeremonyRendering;
};

export function templateRendererEntry(
  component: TemplateRendererEntry["component"],
  ceremonyRendering: TemplateCeremonyRendering,
): TemplateRendererEntry {
  return { component, ceremonyRendering };
}

import type { ComponentType } from "react";

import type { ChungDoiDemoContent } from "../signature/types";
export type TemplateCeremonyRendering = "inline-all" | "post-template";

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

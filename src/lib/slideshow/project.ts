import { z } from "zod";

import {
  weddingSlideshowSourceSchema,
  type WeddingSlideshowSource,
} from "@/components/slideshow/core/source";
import type { SlideshowScene } from "@/components/slideshow/core/types";
import {
  isSupportedSlideshowTemplateVersion,
  slideshowTemplateById,
  type SlideshowTemplateId,
} from "@/components/slideshow/templates/catalog";
import { FREE_TRIAL_MS } from "@/lib/trial";

export const SLIDESHOW_PRICE_VND = 199_000;

const sceneOverrideSchema = z.object({
  title: z.string().max(200).optional(),
  caption: z.string().max(1_000).optional(),
});

export const slideshowSceneOverridesSchema = z.record(
  z.string(),
  z.record(z.string(), sceneOverrideSchema),
);

export type SlideshowSceneOverrides = z.infer<typeof slideshowSceneOverridesSchema>;

const musicUrlSchema = z.string().trim().max(2_048).refine((value) => {
  if (!value || value.startsWith("/")) return true;
  try {
    const url = new URL(value);
    return url.protocol === "https:";
  } catch {
    return false;
  }
}, "Đường dẫn nhạc không hợp lệ");

export const slideshowProjectDraftSchema = z.object({
  templateId: z.string(),
  templateVersion: z.number().int().positive(),
  source: weddingSlideshowSourceSchema,
  sceneOverrides: slideshowSceneOverridesSchema.default({}),
  musicUrl: musicUrlSchema.default(""),
}).superRefine((value, context) => {
  if (!isSupportedSlideshowTemplateVersion(value.templateId, value.templateVersion)) {
    context.addIssue({
      code: "custom",
      path: ["templateVersion"],
      message: "Phiên bản mẫu slideshow không được hỗ trợ",
    });
  }
});

export type SlideshowProjectDraft = Omit<
  z.infer<typeof slideshowProjectDraftSchema>,
  "templateId"
> & { templateId: SlideshowTemplateId };

export function parseSlideshowProjectDraft(input: unknown): SlideshowProjectDraft {
  return slideshowProjectDraftSchema.parse(input) as SlideshowProjectDraft;
}

export function parseStoredSlideshowProject(input: {
  templateId: string;
  templateVersion: number;
  sourceJson: string;
  sceneOverridesJson: string;
  musicUrl: string | null;
}): SlideshowProjectDraft {
  return parseSlideshowProjectDraft({
    templateId: input.templateId,
    templateVersion: input.templateVersion,
    source: JSON.parse(input.sourceJson) as unknown,
    sceneOverrides: JSON.parse(input.sceneOverridesJson) as unknown,
    musicUrl: input.musicUrl ?? "",
  });
}

export function serializeSlideshowProjectDraft(draft: SlideshowProjectDraft) {
  const parsed = parseSlideshowProjectDraft(draft);
  return {
    templateId: parsed.templateId,
    templateVersion: parsed.templateVersion,
    sourceJson: JSON.stringify(parsed.source),
    sceneOverridesJson: JSON.stringify(parsed.sceneOverrides),
    musicUrl: parsed.musicUrl || null,
  };
}

export function sceneOverrideGroupKey(templateId: string, templateVersion: number): string {
  return `${templateId}@${templateVersion}`;
}

export function applySceneOverrides(
  scenes: SlideshowScene[],
  overrides: SlideshowSceneOverrides,
  templateId: string,
  templateVersion: number,
): SlideshowScene[] {
  const group = overrides[sceneOverrideGroupKey(templateId, templateVersion)] ?? {};
  return scenes.map((scene) => ({ ...scene, ...group[String(scene.id)] }));
}

export type SlideshowEntitlement = "trial" | "paid" | "complimentary" | "expired";

export function slideshowTrialEndsAt(trialStartedAt: Date): Date {
  return new Date(trialStartedAt.getTime() + FREE_TRIAL_MS);
}

export function getSlideshowEntitlement(
  project: { paid: boolean; complimentary: boolean; trialStartedAt: Date },
  now = new Date(),
): SlideshowEntitlement {
  if (project.paid) return "paid";
  if (project.complimentary) return "complimentary";
  return now < slideshowTrialEndsAt(project.trialStartedAt) ? "trial" : "expired";
}

export function canEditSlideshow(
  project: { paid: boolean; complimentary: boolean; trialStartedAt: Date },
  now = new Date(),
): boolean {
  return getSlideshowEntitlement(project, now) !== "expired";
}

export function defaultTemplateVersion(templateId: SlideshowTemplateId): number {
  return slideshowTemplateById[templateId].version;
}

export function projectTitle(source: WeddingSlideshowSource): string {
  return `${source.couple.brideName} & ${source.couple.groomName}`;
}

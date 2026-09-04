import type { WeddingSlideshowSource } from "../core/source";
import type { SlideshowScene } from "../core/types";
import {
  isSupportedSlideshowTemplateVersion,
  slideshowTemplateById,
  slideshowTemplateVersionKey,
  type SlideshowTemplateId,
} from "./catalog";
import { createCinematicStoryboard } from "./cinematic/storyboard";
import { createEditorialStoryboard } from "./editorial/storyboard";
import { createNocturneStoryboard } from "./nocturne/storyboard";

type StoryboardFactory = (source: WeddingSlideshowSource) => SlideshowScene[];

const storyboardFactories: Record<string, StoryboardFactory> = {
  "cinematic@1": createCinematicStoryboard,
  "editorial@1": createEditorialStoryboard,
  "nocturne@1": createNocturneStoryboard,
};

export function createSlideshowStoryboard(
  templateId: SlideshowTemplateId,
  source: WeddingSlideshowSource,
  templateVersion: number = slideshowTemplateById[templateId].version,
): SlideshowScene[] {
  if (!isSupportedSlideshowTemplateVersion(templateId, templateVersion)) {
    throw new Error(`Unsupported slideshow template: ${templateId}@${templateVersion}`);
  }
  const factory = storyboardFactories[
    slideshowTemplateVersionKey(templateId, templateVersion)
  ];
  if (!factory) {
    throw new Error(`Missing slideshow storyboard: ${templateId}@${templateVersion}`);
  }
  return factory(source);
}

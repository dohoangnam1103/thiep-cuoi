import type { SlideshowTemplateManifest } from "../core/types";

export const slideshowTemplateCatalog = [
  {
    id: "cinematic",
    version: 1,
    durationMs: 20_000,
    nameKey: "templates.cinematic",
    descriptionKey: "templateDescriptions.cinematic",
    previewImages: {
      tv: "/chungdoi/images/home-2/lab/v11/story/couple-editorial-wide.png",
      phone: "/chungdoi/images/home-2/lab/v11/story/bride-veil-closeup.png",
    },
    tags: ["cinematic", "ballroom", "minimal"],
    capabilities: {
      formats: ["tv", "phone"],
      minPhotos: 1,
      maxPhotos: 60,
      supportsCustomMusic: true,
      supportsFamilyChapter: true,
      supportsLongStory: false,
      supportsVideoClips: true,
    },
  },
  {
    id: "editorial",
    version: 1,
    durationMs: 15_000,
    nameKey: "templates.editorial",
    descriptionKey: "templateDescriptions.editorial",
    previewImages: {
      tv: "/chungdoi/images/gallery/minimalism-dark-red/photo-3.webp",
      phone: "/chungdoi/images/gallery/minimalism-dark-red/photo-5.webp",
    },
    tags: ["editorial", "modern", "magazine"],
    capabilities: {
      formats: ["tv", "phone"],
      minPhotos: 1,
      maxPhotos: 80,
      supportsCustomMusic: true,
      supportsFamilyChapter: false,
      supportsLongStory: true,
      supportsVideoClips: true,
    },
  },
  {
    id: "nocturne",
    version: 1,
    durationMs: 32_000,
    nameKey: "templates.nocturne",
    descriptionKey: "templateDescriptions.nocturne",
    previewImages: {
      tv: "/chungdoi/images/gallery/editorial-noir/photo-3.webp",
      phone: "/chungdoi/images/gallery/editorial-noir/photo-1.webp",
    },
    tags: ["luxury", "lacquer", "editorial"],
    capabilities: {
      formats: ["tv", "phone"],
      minPhotos: 1,
      maxPhotos: 80,
      supportsCustomMusic: true,
      supportsFamilyChapter: false,
      supportsLongStory: true,
      supportsVideoClips: true,
    },
  },
] as const satisfies readonly SlideshowTemplateManifest[];

export type SlideshowTemplateId = (typeof slideshowTemplateCatalog)[number]["id"];
export type SlideshowTemplateVersionKey = `${SlideshowTemplateId}@${number}`;

export const slideshowTemplateById = Object.fromEntries(
  slideshowTemplateCatalog.map((template) => [template.id, template]),
) as Record<SlideshowTemplateId, (typeof slideshowTemplateCatalog)[number]>;

export function isSlideshowTemplateId(value: string): value is SlideshowTemplateId {
  return Object.hasOwn(slideshowTemplateById, value);
}

const supportedSlideshowTemplateVersions = new Set<string>([
  "cinematic@1",
  "editorial@1",
  "nocturne@1",
]);

export function isSupportedSlideshowTemplateVersion(
  templateId: string,
  version: number,
): templateId is SlideshowTemplateId {
  return isSlideshowTemplateId(templateId)
    && supportedSlideshowTemplateVersions.has(`${templateId}@${version}`);
}

export function slideshowTemplateVersionKey(
  templateId: SlideshowTemplateId,
  version: number,
): SlideshowTemplateVersionKey {
  return `${templateId}@${version}`;
}

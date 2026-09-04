export type SlideshowFormat = "tv" | "phone";
export type SlideshowMediaKind = "image" | "video";

export type SlideshowScene = {
  id: number;
  eyebrow: string;
  title: string;
  caption: string;
  image: string;
  imageKind?: SlideshowMediaKind;
  imageAlt?: string;
  secondaryImage?: string;
  secondaryImageKind?: SlideshowMediaKind;
  secondaryImageAlt?: string;
};

export type SlideshowCompositionProps = {
  activeIndex: number;
  format: SlideshowFormat;
  /** Trạng thái timeline để template đồng bộ media chuyển động với nút Play/Pause. */
  playing?: boolean;
  scenes: SlideshowScene[];
};

export type SlideshowTemplateCapability = {
  formats: readonly SlideshowFormat[];
  minPhotos: number;
  maxPhotos: number;
  supportsCustomMusic: boolean;
  supportsFamilyChapter: boolean;
  supportsLongStory: boolean;
  supportsVideoClips: boolean;
};

export type SlideshowTemplateManifest<Id extends string = string> = {
  id: Id;
  version: number;
  /** Tổng thời lượng preview/render do art direction của version này sở hữu. */
  durationMs: number;
  nameKey: `templates.${string}`;
  descriptionKey: `templateDescriptions.${string}`;
  previewImages: {
    tv: string;
    phone: string;
  };
  tags: readonly string[];
  capabilities: SlideshowTemplateCapability;
};

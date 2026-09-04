import { photoAt, type WeddingSlideshowSource } from "../../core/source";
import type { SlideshowScene } from "../../core/types";
import {
  editorialTemplateDataSchema,
  type EditorialTemplateData,
} from "./schema";

function sceneMedia(source: WeddingSlideshowSource, primaryIndex: number, secondaryIndex: number) {
  const primary = photoAt(source, primaryIndex);
  const secondary = photoAt(source, secondaryIndex);
  return {
    image: primary.url,
    imageKind: primary.kind,
    imageAlt: primary.alt,
    secondaryImage: secondary.url,
    secondaryImageKind: secondary.kind,
    secondaryImageAlt: secondary.alt,
  };
}

export function createEditorialStoryboard(
  source: WeddingSlideshowSource,
  input?: Partial<EditorialTemplateData>,
): SlideshowScene[] {
  const data = editorialTemplateDataSchema.parse(input ?? {});
  const couple = `${source.couple.brideName} & ${source.couple.groomName}`;

  return [
    {
      id: 1,
      eyebrow: data.coverLabel,
      title: couple,
      caption: source.event.dateLabel,
      ...sceneMedia(source, 0, 2),
    },
    {
      id: 2,
      eyebrow: data.featureLabel,
      title: source.story.opening,
      caption: source.story.journey,
      ...sceneMedia(source, 3, 1),
    },
    {
      id: 3,
      eyebrow: data.closingLabel,
      title: "Ngày mình thành đôi",
      caption: source.story.closing,
      ...sceneMedia(source, 2, 0),
    },
  ];
}

import { photoAt, type WeddingSlideshowSource } from "../../core/source";
import type { SlideshowScene } from "../../core/types";
import {
  cinematicTemplateDataSchema,
  type CinematicTemplateData,
} from "./schema";

function sceneMedia(source: WeddingSlideshowSource, index: number) {
  const media = photoAt(source, index);
  return {
    image: media.url,
    imageKind: media.kind,
    imageAlt: media.alt,
  };
}

export function createCinematicStoryboard(
  source: WeddingSlideshowSource,
  input?: Partial<CinematicTemplateData>,
): SlideshowScene[] {
  const data = cinematicTemplateDataSchema.parse(input ?? {});
  const couple = `${source.couple.brideName} & ${source.couple.groomName}`;

  return [
    {
      id: 1,
      eyebrow: data.openingLabel,
      title: couple,
      caption: source.event.dateLabel,
      ...sceneMedia(source, 0),
    },
    {
      id: 2,
      eyebrow: data.storyLabel,
      title: source.story.opening,
      caption: source.story.journey,
      ...sceneMedia(source, 1),
    },
    {
      id: 3,
      eyebrow: data.closingLabel,
      title: "Mình cưới nhé",
      caption: source.story.closing,
      ...sceneMedia(source, 2),
    },
    {
      id: 4,
      eyebrow: data.endingLabel,
      title: "Hẹn gặp bạn trong ngày vui",
      caption: `${source.event.dateLabel} · ${source.event.locationLabel}`,
      ...sceneMedia(source, 3),
    },
  ];
}

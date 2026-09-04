import type {
  SlideshowSourceMedia,
  WeddingSlideshowSource,
} from "../../core/source";
import type { SlideshowScene } from "../../core/types";

const NOCTURNE_SCENE_COUNT = 8;

function sampledPhotoIndex(source: WeddingSlideshowSource, sceneIndex: number): number {
  const photoCount = source.photos.length;
  if (photoCount <= NOCTURNE_SCENE_COUNT) return sceneIndex % photoCount;
  return Math.round((sceneIndex * (photoCount - 1)) / (NOCTURNE_SCENE_COUNT - 1));
}

function companionPhotoIndex(source: WeddingSlideshowSource, primaryIndex: number): number {
  if (source.photos.length === 1) return primaryIndex;
  const offset = Math.max(1, Math.floor(source.photos.length / 2));
  const candidate = (primaryIndex + offset) % source.photos.length;
  return candidate === primaryIndex ? (primaryIndex + 1) % source.photos.length : candidate;
}

function mediaFields(primary: SlideshowSourceMedia, secondary: SlideshowSourceMedia) {
  return {
    image: primary.url,
    imageKind: primary.kind,
    imageAlt: primary.alt,
    secondaryImage: secondary.url,
    secondaryImageKind: secondary.kind,
    secondaryImageAlt: secondary.alt,
  };
}

function sceneMedia(source: WeddingSlideshowSource, sceneIndex: number) {
  const primaryIndex = sampledPhotoIndex(source, sceneIndex);
  const secondaryIndex = companionPhotoIndex(source, primaryIndex);
  return mediaFields(source.photos[primaryIndex], source.photos[secondaryIndex]);
}

/**
 * Storyboard premium có tám act cố định để scene override bền vững. Với album
 * trên tám tệp, media được sample đều từ đầu tới cuối thay vì chỉ lấy bốn ảnh
 * đầu; album ngắn vẫn an toàn và không lặp primary/secondary khi có từ hai ảnh.
 */
export function createNocturneStoryboard(source: WeddingSlideshowSource): SlideshowScene[] {
  const couple = `${source.couple.brideName} & ${source.couple.groomName}`;

  return [
    {
      id: 1,
      eyebrow: "Dạ khúc ngày chung đôi",
      title: couple,
      caption: source.event.dateLabel,
      ...sceneMedia(source, 0),
    },
    {
      id: 2,
      eyebrow: "Chương I · Gặp gỡ",
      title: source.story.opening,
      caption: "Có những cuộc gặp gỡ rất khẽ, nhưng ở lại suốt một đời.",
      ...sceneMedia(source, 1),
    },
    {
      id: 3,
      eyebrow: "Chương II · Chúng mình",
      title: "Ở cạnh nhau, mọi ngày đều thành kỷ niệm",
      caption: source.story.journey,
      ...sceneMedia(source, 2),
    },
    {
      id: 4,
      eyebrow: "Những khung hình giữ lại",
      title: "Một hành trình. Rất nhiều khoảnh khắc.",
      caption: "Và trong mỗi khoảnh khắc ấy, luôn có chúng mình.",
      ...sceneMedia(source, 3),
    },
    {
      id: 5,
      eyebrow: "Lời hứa",
      title: "Từ hôm nay, mình cùng đi tiếp",
      caption: source.story.closing,
      ...sceneMedia(source, 4),
    },
    {
      id: 6,
      eyebrow: "Save the date",
      title: source.event.dateLabel,
      caption: source.event.locationLabel,
      ...sceneMedia(source, 5),
    },
    {
      id: 7,
      eyebrow: "Ngày mình thành đôi",
      title: couple,
      caption: "Hai câu chuyện, từ nay viết chung một chương.",
      ...sceneMedia(source, 6),
    },
    {
      id: 8,
      eyebrow: "Trân trọng",
      title: "Hẹn gặp bạn trong ngày vui của chúng mình",
      caption: `${source.event.dateLabel} · ${source.event.locationLabel}`,
      ...sceneMedia(source, 7),
    },
  ];
}

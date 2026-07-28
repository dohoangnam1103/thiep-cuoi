import type { ChungDoiDemoContent } from "@/data/chungdoi-demo-content";

export const DEFAULT_OPENING_MESSAGE = "TRÂN TRỌNG BÁO TIN\nLỄ THÀNH HÔN CỦA CON CHÚNG TÔI.";

export type CeremonyType = "thanh-hon" | "vu-quy";

export function ceremonyTypeLabel(type: string | null | undefined): "THÀNH HÔN" | "VU QUY" {
  return type === "vu-quy" ? "VU QUY" : "THÀNH HÔN";
}

export function defaultCeremonyMessage(type: string | null | undefined): string {
  return `LỄ ${ceremonyTypeLabel(type)} SẼ ĐƯỢC CỬ HÀNH TẠI TƯ GIA`;
}

export function invitationOpeningMessage(content: ChungDoiDemoContent): string {
  return content.couple.openingMessage?.trim() || DEFAULT_OPENING_MESSAGE;
}

export function invitationCeremonies(content: ChungDoiDemoContent) {
  if (content.ceremonies) {
    return content.ceremonies
      .map((ceremony) => ({
        title: ceremony.title.trim(),
        date: ceremony.date.trim(),
        time: ceremony.time.trim(),
      }))
      .filter((ceremony) => ceremony.title || ceremony.date || ceremony.time);
  }

  const legacy = {
    title: content.couple.ceremonyHeader?.trim()
      || defaultCeremonyMessage(content.couple.ceremonyType),
    date: content.couple.ceremonyDate.trim(),
    time: content.couple.ceremonyTime.trim(),
  };
  return legacy.title || legacy.date || legacy.time ? [legacy] : [];
}

export function invitationCeremonyMessage(content: ChungDoiDemoContent): string {
  if (content.ceremonies) {
    return invitationCeremonies(content)[0]?.title ?? "";
  }
  return content.couple.ceremonyHeader?.trim() || defaultCeremonyMessage(content.couple.ceremonyType);
}

export function invitationHeroImage(content: ChungDoiDemoContent): string {
  if (content.showHeroImage === false) return "";
  return content.heroImage?.trim() || content.gallery[0] || "";
}

export type HeroPhotos = { bride: string; groom: string };

type HeroPhotoOptions = {
  /** Fill an empty slot with the next unused album photo. */
  albumFallback?: boolean;
  /**
   * The layout pins each photo to a side (a bride frame, a groom frame), so the
   * album fills bride-first regardless of which family is announced first.
   */
  fixedSides?: boolean;
};

/**
 * Header photos keyed by person: `heroImage` is always the bride's slot and
 * `heroImage2` the groom's. Keeping them person-scoped means changing the
 * display order never moves a photo under the other person's name.
 *
 * An empty slot can borrow from the album. Those photos belong to nobody yet,
 * so they fill in display order — the card keeps reading left to right even
 * when the groom's family comes first.
 */
export function invitationHeroPhotos(
  content: ChungDoiDemoContent,
  { albumFallback = false, fixedSides = false }: HeroPhotoOptions = {},
): HeroPhotos {
  if (content.showHeroImage === false) return { bride: "", groom: "" };

  const photos = {
    bride: content.heroImage?.trim() || "",
    groom: content.heroImage2?.trim() || "",
  };
  if (!albumFallback) return photos;

  const album = content.gallery.filter((photo) => photo.trim());
  let unused = 0;
  const fillOrder = fixedSides
    ? (["bride", "groom"] as const)
    : orderByBrideFirst<CoupleSide>("bride", "groom", content.couple.brideFirst);
  for (const side of fillOrder) {
    photos[side] ||= album[unused++] || "";
  }
  return photos;
}

/** Both header photos in display order, so slot 1 follows whoever comes first. */
export function orderedHeroPhotos(
  content: ChungDoiDemoContent,
  options?: HeroPhotoOptions,
): [string, string] {
  const photos = invitationHeroPhotos(content, options);
  return orderByBrideFirst(photos.bride, photos.groom, content.couple.brideFirst);
}

export function orderByBrideFirst<T>(bride: T, groom: T, brideFirst: boolean): [T, T] {
  return brideFirst ? [bride, groom] : [groom, bride];
}

export type CoupleSide = "bride" | "groom";

export type InvitationPerson = {
  side: CoupleSide;
  fullName: string;
  shortName: string;
  birthOrder: string;
  /** The header photo uploaded for this person, never for this position. */
  heroPhoto: string;
};

/**
 * Both people keyed by side, each carrying their own header photo. Use this when
 * a template pins artwork to a side (a bride frame, a groom frame) so the photo
 * and the frame can never drift apart; use {@link orderedCouple} when the layout
 * only cares about who comes first.
 */
export function invitationCouple(
  content: ChungDoiDemoContent,
  options?: HeroPhotoOptions,
): Record<CoupleSide, InvitationPerson> {
  const { couple } = content;
  const heroPhotos = invitationHeroPhotos(content, options);
  return {
    bride: {
      side: "bride",
      fullName: couple.brideFullName,
      shortName: couple.brideShortName || couple.brideFullName,
      birthOrder: couple.brideBirthOrder || "Út Nữ",
      heroPhoto: heroPhotos.bride,
    },
    groom: {
      side: "groom",
      fullName: couple.groomFullName,
      shortName: couple.groomShortName || couple.groomFullName,
      birthOrder: couple.groomBirthOrder || "Trưởng Nam",
      heroPhoto: heroPhotos.groom,
    },
  };
}

export function orderedCouple(content: ChungDoiDemoContent) {
  const { bride, groom } = invitationCouple(content);
  return orderByBrideFirst(bride, groom, content.couple.brideFirst);
}

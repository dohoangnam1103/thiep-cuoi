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

/**
 * Second header photo for templates that show two photos at the top of the card.
 * Falls back to the album when the dedicated slot is empty: if slot 1 is filled the
 * album starts at index 0, otherwise slot 1 already consumed gallery[0].
 */
export function invitationHeroImage2(content: ChungDoiDemoContent): string {
  if (content.showHeroImage === false) return "";
  const explicit = content.heroImage2?.trim();
  if (explicit) return explicit;
  return (content.heroImage?.trim() ? content.gallery[0] : content.gallery[1]) || "";
}

/** Both header photos in display order (slot 1, slot 2), with album fallback. */
export function invitationHeroImages(content: ChungDoiDemoContent): [string, string] {
  return [invitationHeroImage(content), invitationHeroImage2(content)];
}

/**
 * Only what the user uploaded into the two header slots, in display order.
 * Use this for templates that already ship a curated default portrait per side
 * so the theme artwork stays in place until a photo is actually uploaded.
 */
export function invitationHeroSlots(content: ChungDoiDemoContent): [string, string] {
  if (content.showHeroImage === false) return ["", ""];
  return [content.heroImage?.trim() || "", content.heroImage2?.trim() || ""];
}

export function orderByBrideFirst<T>(bride: T, groom: T, brideFirst: boolean): [T, T] {
  return brideFirst ? [bride, groom] : [groom, bride];
}

export function orderedCouple(content: ChungDoiDemoContent) {
  const { couple } = content;
  return orderByBrideFirst(
    {
      side: "bride" as const,
      fullName: couple.brideFullName,
      shortName: couple.brideShortName || couple.brideFullName,
      birthOrder: couple.brideBirthOrder || "Út Nữ",
    },
    {
      side: "groom" as const,
      fullName: couple.groomFullName,
      shortName: couple.groomShortName || couple.groomFullName,
      birthOrder: couple.groomBirthOrder || "Trưởng Nam",
    },
    couple.brideFirst,
  );
}

import type { ChungDoiDemoContent } from "@/data/chungdoi-demo-content";

export const DEFAULT_OPENING_MESSAGE = "TRÂN TRỌNG BÁO TIN\nLỄ THÀNH HÔN CỦA CON CHÚNG TÔI.";

export type CeremonyType = "thanh-hon" | "vu-quy";

export function ceremonyTypeLabel(type: string | null | undefined): "THÀNH HÔN" | "VU QUY" {
  return type === "vu-quy" ? "VU QUY" : "THÀNH HÔN";
}

export function defaultCeremonyMessage(type: string | null | undefined): string {
  return `LỄ ${ceremonyTypeLabel(type)} SẼ ĐƯỢC CỬ HÀNH TẠI\nTƯ GIA`;
}

export function invitationOpeningMessage(content: ChungDoiDemoContent): string {
  return content.couple.openingMessage?.trim() || DEFAULT_OPENING_MESSAGE;
}

export function invitationCeremonyMessage(content: ChungDoiDemoContent): string {
  return content.couple.ceremonyHeader?.trim() || defaultCeremonyMessage(content.couple.ceremonyType);
}

export function invitationHeroImage(content: ChungDoiDemoContent): string {
  if (content.showHeroImage === false) return "";
  return content.heroImage?.trim() || content.gallery[0] || "";
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

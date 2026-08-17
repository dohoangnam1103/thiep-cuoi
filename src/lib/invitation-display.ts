import type { ChungDoiDemoContent } from "@/data/chungdoi-demo-content";
import { isUsableVietQrAccount } from "@/lib/vietqr";

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

export type InvitationGiftAccount = {
  side: CoupleSide;
  /** Bank name as entered, trimmed. */
  bank: string;
  /** Account number as entered, trimmed. */
  num: string;
  /** Account holder as entered, trimmed. */
  name: string;
  /** Birth-order caption for this side, already defaulted. */
  birthOrder: string;
  fullName: string;
  shortName: string;
};

/**
 * Transfer accounts that can actually produce a VietQR, in display order.
 *
 * Templates each used to build and filter this list themselves, and most only
 * checked the bank name. A half-filled form — bank picked from the combobox,
 * account number left blank — therefore passed the check and rendered a gift
 * section whose QR request `/api/vietqr` rejects, which guests saw as a broken
 * image next to empty account lines. Deciding validity here, with the same rule
 * as the QR endpoint, keeps every template consistent and stops the next one
 * from reintroducing the bug.
 *
 * Callers still own presentation: pick whatever label shape the layout needs
 * from the returned fields.
 */
export function invitationGiftAccounts(
  content: ChungDoiDemoContent,
): InvitationGiftAccount[] {
  const { bank, couple } = content;
  const { bride, groom } = invitationCouple(content);

  return orderByBrideFirst<InvitationGiftAccount>(
    {
      side: "bride",
      bank: bank.brideBankName.trim(),
      num: bank.brideAccountNumber.trim(),
      name: bank.brideAccountName.trim(),
      birthOrder: bride.birthOrder,
      fullName: bride.fullName,
      shortName: bride.shortName,
    },
    {
      side: "groom",
      bank: bank.groomBankName.trim(),
      num: bank.groomAccountNumber.trim(),
      name: bank.groomAccountName.trim(),
      birthOrder: groom.birthOrder,
      fullName: groom.fullName,
      shortName: groom.shortName,
    },
    couple.brideFirst,
  ).filter((account) =>
    isUsableVietQrAccount({ bank: account.bank, accountNumber: account.num }),
  );
}

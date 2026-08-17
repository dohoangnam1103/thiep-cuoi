import type { ChungDoiDemoContent } from "@/data/chungdoi-demo-content";
import type { Prisma } from "@/generated/prisma/client";
import { normalizeAlbumLayout } from "@/lib/album-layout";
import { DEFAULT_OPENING_MESSAGE } from "@/lib/invitation-display";
import { shortNameFromFullName } from "@/lib/short-name";

export type InvitationWithRelations = Prisma.InvitationGetPayload<{
  include: {
    content: true;
    ceremonies: true;
    schedule: true;
    gallery: true;
    wishes: true;
  };
}>;

const clean = (v: string | null | undefined): string | null => {
  const trimmed = v?.trim();
  return trimmed ? trimmed : null;
};

const slugify = (value: string): string =>
  value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[đĐ]/g, "d")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const normalizeBirthOrder = (value: string | null | undefined): string => {
  const trimmed = value?.trim() ?? "";
  const labels: Record<string, string> = {
    "ut-nu": "Út Nữ",
    "ut-nam": "Út Nam",
    "truong-nu": "Trưởng Nữ",
    "truong-nam": "Trưởng Nam",
    "thu-nu": "Thứ Nữ",
    "thu-nam": "Thứ Nam",
  };
  return labels[slugify(trimmed)] ?? trimmed;
};

export function toDemoContent(invitation: InvitationWithRelations): ChungDoiDemoContent {
  const c = invitation.content;
  const ceremonies = [...invitation.ceremonies]
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((ceremony) => ({
      title: ceremony.title,
      date: ceremony.date,
      time: ceremony.time,
    }));
  const firstCeremony = ceremonies[0];

  return {
    slug: invitation.templateId,
    invitationId: invitation.id,
    theme: {
      primaryColor: clean(c?.primaryColor) ?? "#c8102e",
      fontFamily: clean(c?.fontFamily),
      assetFolder: clean(c?.assetFolder),
      assets: [],
    },
    couple: {
      brideFullName: c?.brideFullName ?? "",
      groomFullName: c?.groomFullName ?? "",
      brideShortName: clean(c?.brideShortName) ?? shortNameFromFullName(c?.brideFullName ?? ""),
      groomShortName: clean(c?.groomShortName) ?? shortNameFromFullName(c?.groomFullName ?? ""),
      brideBirthOrder: normalizeBirthOrder(c?.brideBirthOrder),
      groomBirthOrder: normalizeBirthOrder(c?.groomBirthOrder),
      brideZodiac: c?.brideZodiac ?? "",
      groomZodiac: c?.groomZodiac ?? "",
      brideFirst: c?.brideFirst ?? true,
      date: c?.date ?? "",
      time: c?.time ?? "",
      // Fall back to the legacy columns: an invitation with no CeremonyItem row
      // still carries its ceremony details on InvitationContent.
      ceremonyDate: firstCeremony?.date ?? c?.ceremonyDate ?? "",
      ceremonyTime: firstCeremony?.time ?? c?.ceremonyTime ?? "",
      ceremonyHeader: firstCeremony?.title ?? c?.ceremonyHeader ?? "",
      ceremonyType: c?.ceremonyType === "vu-quy" ? "vu-quy" : "thanh-hon",
      openingMessage: clean(c?.openingMessage) ?? DEFAULT_OPENING_MESSAGE,
    },
    families: {
      brideFather: c?.brideFather ?? "",
      brideMother: c?.brideMother ?? "",
      brideAddress: c?.brideAddress ?? "",
      groomFather: c?.groomFather ?? "",
      groomMother: c?.groomMother ?? "",
      groomAddress: c?.groomAddress ?? "",
      brideParentTitle: c?.brideParentTitle ?? "",
      groomParentTitle: c?.groomParentTitle ?? "",
    },
    venue: {
      address: c?.address ?? "",
      mapAddress: c?.mapAddress ?? "",
      banquetTime: clean(c?.time) ?? c?.banquetTime ?? "",
    },
    // No CeremonyItem row means "never set", not "explicitly cleared", so leave
    // this undefined and let the legacy ceremony columns above drive the card.
    ceremonies: ceremonies.length ? ceremonies : undefined,
    schedule: [...invitation.schedule]
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((s) => ({ time: s.time, label: s.label })),
    gallery: [...invitation.gallery]
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((g) => g.url),
    heroImage: c?.heroImage ?? "",
    heroImage2: c?.heroImage2 ?? "",
    showHeroImage: c?.showHeroImage ?? true,
    dressCodeColors: c?.dressCodeColors ?? "",
    albumLayout: normalizeAlbumLayout(c?.albumLayout),
    wishes: invitation.wishes.map((w) => ({
      name: w.name,
      time: w.createdAt.toISOString(),
      text: w.text,
    })),
    bank: {
      brideBankName: c?.brideBankName ?? "",
      brideAccountNumber: c?.brideAccountNumber ?? "",
      brideAccountName: c?.brideAccountName ?? "",
      groomBankName: c?.groomBankName ?? "",
      groomAccountNumber: c?.groomAccountNumber ?? "",
      groomAccountName: c?.groomAccountName ?? "",
    },
    music: clean(c?.music),
  };
}

import type { ChungDoiDemoContent } from "@chungdoi/invitation-data/demo-content";

import { normalizeAlbumLayout } from "../signature/album-layout";
import { DEFAULT_OPENING_MESSAGE } from "../signature/invitation-display";
import { shortNameFromFullName } from "./short-name";
import { dedicatedHeroImage } from "../signature/hero-image-source";

export type InvitationDemoRecord = {
  id: string;
  templateId: string;
  isDemo: boolean;
  content: {
    primaryColor: string;
    fontFamily: string | null;
    assetFolder: string | null;
    brideFullName: string;
    groomFullName: string;
    brideShortName: string;
    groomShortName: string;
    brideBirthOrder: string;
    groomBirthOrder: string;
    brideZodiac: string;
    groomZodiac: string;
    brideFirst: boolean;
    date: string;
    time: string;
    ceremonyDate: string;
    ceremonyTime: string;
    ceremonyHeader: string;
    ceremonyType: string;
    openingMessage: string;
    heroImage: string;
    heroImage2: string;
    showHeroImage: boolean;
    dressCodeColors: string;
    albumLayout: string;
    brideFather: string;
    brideMother: string;
    brideAddress: string;
    groomFather: string;
    groomMother: string;
    groomAddress: string;
    brideParentTitle: string;
    groomParentTitle: string;
    address: string;
    mapAddress: string;
    banquetTime: string;
    brideBankName: string;
    brideAccountNumber: string;
    brideAccountName: string;
    groomBankName: string;
    groomAccountNumber: string;
    groomAccountName: string;
    music: string | null;
  } | null;
  ceremonies: { title: string; date: string; time: string; sortOrder: number }[];
  schedule: { time: string; label: string; sortOrder: number }[];
  gallery: { url: string; sortOrder: number }[];
  wishes: { name: string; text: string; createdAt: Date }[];
};

export type InvitationWithRelations = InvitationDemoRecord;

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

export function toDemoContent(invitation: InvitationDemoRecord): ChungDoiDemoContent {
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
      userFontFamily: invitation.isDemo ? null : clean(c?.fontFamily),
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
    heroImage: dedicatedHeroImage(c?.heroImage),
    heroImage2: dedicatedHeroImage(c?.heroImage2),
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

import type { ChungDoiDemoContent } from "@/data/chungdoi-demo-content";
import type { Prisma } from "@/generated/prisma/client";

export type InvitationWithRelations = Prisma.InvitationGetPayload<{
  include: {
    content: true;
    schedule: true;
    gallery: true;
    wishes: true;
  };
}>;

const clean = (v: string | null | undefined): string | null => {
  const trimmed = v?.trim();
  return trimmed ? trimmed : null;
};

export function toDemoContent(invitation: InvitationWithRelations): ChungDoiDemoContent {
  const c = invitation.content;

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
      brideShortName: c?.brideShortName ?? "",
      groomShortName: c?.groomShortName ?? "",
      brideBirthOrder: c?.brideBirthOrder ?? "",
      groomBirthOrder: c?.groomBirthOrder ?? "",
      brideFirst: c?.brideFirst ?? true,
      date: c?.date ?? "",
      time: c?.time ?? "",
      ceremonyDate: c?.ceremonyDate ?? "",
      ceremonyTime: c?.ceremonyTime ?? "",
      ceremonyHeader: c?.ceremonyHeader ?? "",
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
      banquetTime: c?.banquetTime ?? "",
    },
    schedule: [...invitation.schedule]
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((s) => ({ time: s.time, label: s.label })),
    gallery: [...invitation.gallery]
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((g) => g.url),
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

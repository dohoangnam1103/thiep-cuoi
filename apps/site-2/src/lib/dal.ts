import { isTemplateAvailable } from "@chungdoi/invitation-data";
import type { InvitationRenderContent } from "@chungdoi/invitation-core/signature";

import { prisma } from "./prisma";

export const SITE2_ID = "site-2" as const;

function assertSignatureTemplate(templateSlug: string): void {
  if (!isTemplateAvailable(SITE2_ID, templateSlug)) {
    throw new Error(`Template ${templateSlug} is not available on site-2`);
  }
}

export async function createInvitation(userId: string, templateSlug: string) {
  assertSignatureTemplate(templateSlug);
  return prisma.invitation.create({
    data: {
      userId,
      templateId: templateSlug,
      status: "draft",
      content: { create: {} },
    },
    select: { id: true, templateId: true, status: true },
  });
}

export type DashboardInvitationStatus = "draft" | "published" | "unknown";

export type DashboardInvitation = {
  id: string;
  slug: string | null;
  templateId: string;
  status: DashboardInvitationStatus;
  updatedAt: Date;
  coupleLabel: string;
};

/* Database statuses are free-form strings, so the dashboard only ever sees
 * the typed union above. Anything unfamiliar becomes "unknown", never a lie. */
export function normalizeDashboardStatus(
  status: string,
): DashboardInvitationStatus {
  if (status === "published") return "published";
  if (status === "draft") return "draft";
  return "unknown";
}

/* Project-first projection for the dashboard: most recently touched first,
 * with just the fields one card needs. */
export async function listDashboardInvitations(
  userId: string,
): Promise<DashboardInvitation[]> {
  const rows = await prisma.invitation.findMany({
    where: { userId },
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      slug: true,
      templateId: true,
      status: true,
      updatedAt: true,
      content: {
        select: { brideFullName: true, groomFullName: true },
      },
    },
  });
  return rows.map((row) => {
    const bride = row.content?.brideFullName.trim() ?? "";
    const groom = row.content?.groomFullName.trim() ?? "";
    return {
      id: row.id,
      slug: row.slug,
      templateId: row.templateId,
      status: normalizeDashboardStatus(row.status),
      updatedAt: row.updatedAt,
      coupleLabel: [bride, groom].filter(Boolean).join(" & "),
    };
  });
}

export async function listUserInvitations(userId: string) {
  return prisma.invitation.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      templateId: true,
      status: true,
      slug: true,
      updatedAt: true,
    },
  });
}

export async function getOwnedInvitation(id: string, userId: string) {
  return prisma.invitation.findFirst({
    where: { id, userId },
    include: {
      content: true,
      ceremonies: { orderBy: { sortOrder: "asc" } },
      schedule: { orderBy: { sortOrder: "asc" } },
      gallery: { orderBy: { sortOrder: "asc" } },
      wishes: { orderBy: { createdAt: "asc" } },
    },
  });
}

const EDITABLE_CONTENT_FIELDS = [
  "brideFullName",
  "groomFullName",
  "brideShortName",
  "groomShortName",
  "date",
  "time",
  "ceremonyDate",
  "ceremonyTime",
  "ceremonyHeader",
  "openingMessage",
  "brideFather",
  "brideMother",
  "groomFather",
  "groomMother",
  "address",
  "banquetTime",
] as const;

export type EditableContent = Partial<
  Record<(typeof EDITABLE_CONTENT_FIELDS)[number], string>
>;

export async function updateInvitationContent(
  id: string,
  userId: string,
  fields: EditableContent,
) {
  const invitation = await prisma.invitation.findFirst({
    where: { id, userId },
    select: { id: true, templateId: true },
  });
  if (!invitation) {
    throw new Error("Invitation not found");
  }
  assertSignatureTemplate(invitation.templateId);

  const data: Record<string, string> = {};
  for (const key of EDITABLE_CONTENT_FIELDS) {
    if (typeof fields[key] === "string") {
      data[key] = (fields[key] as string).slice(0, 500);
    }
  }
  await prisma.invitationContent.upsert({
    where: { invitationId: id },
    create: { invitationId: id, ...data },
    update: data,
  });
}

export async function publishInvitation(id: string, userId: string) {
  const invitation = await prisma.invitation.findFirst({
    where: { id, userId },
    select: { id: true, templateId: true, slug: true },
  });
  if (!invitation) {
    throw new Error("Invitation not found");
  }
  assertSignatureTemplate(invitation.templateId);

  const slug =
    invitation.slug ??
    `${invitation.templateId}-${invitation.id.slice(-6).toLowerCase()}`;
  return prisma.invitation.update({
    where: { id },
    data: { status: "published", slug, publishedAt: new Date() },
    select: { id: true, slug: true, status: true },
  });
}

export async function getPublishedBySlug(
  slug: string,
): Promise<InvitationRenderContent | null> {
  const invitation = await prisma.invitation.findFirst({
    where: { slug, status: "published" },
    include: {
      content: true,
      ceremonies: { orderBy: { sortOrder: "asc" } },
      schedule: { orderBy: { sortOrder: "asc" } },
      gallery: { orderBy: { sortOrder: "asc" } },
      wishes: { orderBy: { createdAt: "asc" } },
    },
  });
  if (!invitation || !isTemplateAvailable(SITE2_ID, invitation.templateId)) {
    return null;
  }
  return toRenderContent(invitation);
}

/** Render content for the owner's editor preview (draft or published). */
export async function getOwnedRenderContent(
  id: string,
  userId: string,
): Promise<InvitationRenderContent | null> {
  const invitation = await getOwnedInvitation(id, userId);
  if (!invitation || !isTemplateAvailable(SITE2_ID, invitation.templateId)) {
    return null;
  }
  return toRenderContent(invitation);
}

type LoadedInvitation = {
  id: string;
  templateId: string;
  content: {
    primaryColor: string;
    fontFamily: string | null;
    assetFolder: string | null;
    music: string | null;
    dressCodeColors: string;
    brideFullName: string;
    groomFullName: string;
    brideShortName: string;
    groomShortName: string;
    brideBirthOrder: string;
    groomBirthOrder: string;
    brideFirst: boolean;
    date: string;
    time: string;
    ceremonyDate: string;
    ceremonyTime: string;
    ceremonyHeader: string;
    ceremonyType: string;
    openingMessage: string;
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
    heroImage: string;
    heroImage2: string;
    showHeroImage: boolean;
    brideBankName: string;
    brideAccountNumber: string;
    brideAccountName: string;
    groomBankName: string;
    groomAccountNumber: string;
    groomAccountName: string;
  } | null;
  ceremonies: { title: string; date: string; time: string }[];
  schedule: { time: string; label: string }[];
  gallery: { url: string }[];
  wishes: { name: string; text: string; createdAt: Date }[];
};

function toRenderContent(
  invitation: LoadedInvitation,
): InvitationRenderContent {
  const c = invitation.content;
  return {
    slug: invitation.templateId,
    invitationId: invitation.id,
    theme: {
      primaryColor: c?.primaryColor ?? "#c8102e",
      userFontFamily: null,
      fontFamily: c?.fontFamily ?? null,
      assetFolder: c?.assetFolder ?? null,
      assets: [],
    },
    music: c?.music ?? null,
    dressCodeColors: c?.dressCodeColors ?? "",
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
      ceremonyType:
        c?.ceremonyType === "vu-quy" ? "vu-quy" : ("thanh-hon" as const),
      openingMessage: c?.openingMessage ?? "",
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
    ceremonies: invitation.ceremonies.map((ceremony) => ({
      title: ceremony.title,
      date: ceremony.date,
      time: ceremony.time,
    })),
    schedule: invitation.schedule.map((item) => ({
      time: item.time,
      label: item.label,
    })),
    gallery: invitation.gallery.map((photo) => photo.url),
    heroImage: c?.heroImage ?? "",
    heroImage2: c?.heroImage2 ?? "",
    showHeroImage: c?.showHeroImage ?? true,
    wishes: invitation.wishes.map((wish) => ({
      name: wish.name,
      time: wish.createdAt.toISOString(),
      text: wish.text,
    })),
    bank: {
      brideBankName: c?.brideBankName ?? "",
      brideAccountNumber: c?.brideAccountNumber ?? "",
      brideAccountName: c?.brideAccountName ?? "",
      groomBankName: c?.groomBankName ?? "",
      groomAccountNumber: c?.groomAccountNumber ?? "",
      groomAccountName: c?.groomAccountName ?? "",
    },
  };
}

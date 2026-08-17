import "server-only";

import type { Prisma } from "@/generated/prisma/client";
import type { z } from "zod";

import {
  contentSchema,
  parseCeremonies,
  parseGallery,
  parseSchedule,
} from "@/app/editor/[id]/content-schema";
import { isGoogleMapsShortUrl } from "@/lib/google-maps";
import { expandGoogleMapsShortUrl } from "@/lib/google-maps-server";

export type PreparedInvitationDraft = {
  persistedData: z.infer<typeof contentSchema>;
  templateId: string;
  contentData: Omit<z.infer<typeof contentSchema>, "templateId">;
  ceremonies: ReturnType<typeof parseCeremonies>;
  schedule: ReturnType<typeof parseSchedule>;
  gallery: ReturnType<typeof parseGallery>;
};

export async function prepareInvitationDraft(
  formData: FormData,
): Promise<{ data: PreparedInvitationDraft } | { errorCode: "invalidData" }> {
  const parsed = contentSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { errorCode: "invalidData" };
  }
  const ceremonies = parseCeremonies(formData);
  const schedule = parseSchedule(formData);
  const gallery = parseGallery(formData);
  const mapAddress = isGoogleMapsShortUrl(parsed.data.mapAddress)
    ? await expandGoogleMapsShortUrl(parsed.data.mapAddress)
    : parsed.data.mapAddress;
  const firstCeremony = ceremonies[0];
  const persistedData = {
    ...parsed.data,
    ceremonyHeader: firstCeremony?.title ?? "",
    ceremonyDate: firstCeremony?.date ?? "",
    ceremonyTime: firstCeremony?.time ?? "",
    mapAddress,
  };
  const { templateId, ...contentData } = persistedData;
  return {
    data: { persistedData, templateId, contentData, ceremonies, schedule, gallery },
  };
}

export async function writeInvitationDraft(
  db: Prisma.TransactionClient,
  invitationId: string,
  draft: PreparedInvitationDraft,
): Promise<void> {
  await db.invitation.update({
    where: { id: invitationId },
    data: { templateId: draft.templateId },
  });
  await db.invitationContent.upsert({
    where: { invitationId },
    create: { invitationId, ...draft.contentData },
    update: draft.contentData,
  });
  await db.ceremonyItem.deleteMany({ where: { invitationId } });
  await db.scheduleItem.deleteMany({ where: { invitationId } });
  await db.galleryPhoto.deleteMany({ where: { invitationId } });
  if (draft.ceremonies.length) {
    await db.ceremonyItem.createMany({
      data: draft.ceremonies.map((ceremony, sortOrder) => ({
        invitationId,
        title: ceremony.title,
        date: ceremony.date,
        time: ceremony.time,
        sortOrder,
      })),
    });
  }
  if (draft.schedule.length) {
    await db.scheduleItem.createMany({
      data: draft.schedule.map((item, sortOrder) => ({
        invitationId,
        time: item.time,
        label: item.label,
        sortOrder,
      })),
    });
  }
  if (draft.gallery.length) {
    await db.galleryPhoto.createMany({
      data: draft.gallery.map((url, sortOrder) => ({
        invitationId,
        url,
        sortOrder,
      })),
    });
  }
}

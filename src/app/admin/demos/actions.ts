"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import { verifyAdmin } from "@/lib/admin-dal";
import { getVietnameseTemplateSlug } from "@/data/chungdoi";
import { routing } from "@/i18n/routing";
import {
  contentSchema,
  parseCeremonies,
  parseSchedule,
  parseGallery,
  type EditorState,
} from "@/app/editor/[id]/content-schema";

export async function saveDemo(id: string, _prev: EditorState, formData: FormData): Promise<EditorState> {
  await verifyAdmin();

  const invitation = await prisma.invitation.findFirst({ where: { id, isDemo: true } });
  if (!invitation) return { error: "Không tìm thấy thiệp demo" };

  const parsed = contentSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dữ liệu không hợp lệ" };
  }
  const ceremonies = parseCeremonies(formData);
  const firstCeremony = ceremonies[0];
  const { templateId, ...contentData } = {
    ...parsed.data,
    ceremonyHeader: firstCeremony?.title ?? "",
    ceremonyDate: firstCeremony?.date ?? "",
    ceremonyTime: firstCeremony?.time ?? "",
  };
  const schedule = parseSchedule(formData);
  const gallery = parseGallery(formData);

  await prisma.$transaction([
    prisma.invitation.update({ where: { id }, data: { templateId } }),
    prisma.invitationContent.upsert({
      where: { invitationId: id },
      create: { invitationId: id, ...contentData },
      update: contentData,
    }),
    prisma.ceremonyItem.deleteMany({ where: { invitationId: id } }),
    prisma.scheduleItem.deleteMany({ where: { invitationId: id } }),
    prisma.galleryPhoto.deleteMany({ where: { invitationId: id } }),
    ...(ceremonies.length
      ? [
          prisma.ceremonyItem.createMany({
            data: ceremonies.map((ceremony, i) => ({
              invitationId: id,
              title: ceremony.title,
              date: ceremony.date,
              time: ceremony.time,
              sortOrder: i,
            })),
          }),
        ]
      : []),
    ...(schedule.length
      ? [
          prisma.scheduleItem.createMany({
            data: schedule.map((s, i) => ({ invitationId: id, time: s.time, label: s.label, sortOrder: i })),
          }),
        ]
      : []),
    ...(gallery.length
      ? [
          prisma.galleryPhoto.createMany({
            data: gallery.map((url, i) => ({ invitationId: id, url, sortOrder: i })),
          }),
        ]
      : []),
  ]);

  revalidatePath("/admin/demos");
  for (const locale of routing.locales) {
    const slug = locale === "vi" ? getVietnameseTemplateSlug(templateId) : templateId;
    revalidatePath(`/${locale}/templates/${slug}/demo`);
  }

  return { ok: true, persisted: true };
}

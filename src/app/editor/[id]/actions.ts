"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import { verifySession, ownInvitation } from "@/lib/dal";
import { isGoogleMapsShortUrl, isGoogleMapsUrl } from "@/lib/google-maps";
import { expandGoogleMapsShortUrl } from "@/lib/google-maps-server";
import {
  contentSchema,
  parseCeremonies,
  parseSchedule,
  parseGallery,
  type EditorState,
} from "./content-schema";
import { slugFromFormFields } from "./slug";

const SLUG_RE = /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/;

async function persistDraft(id: string, formData: FormData) {
  const parsed = contentSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dữ liệu không hợp lệ" } as const;
  }

  const data = parsed.data;
  const ceremonies = parseCeremonies(formData);
  const schedule = parseSchedule(formData);
  const gallery = parseGallery(formData);
  const mapAddress = isGoogleMapsShortUrl(data.mapAddress)
    ? await expandGoogleMapsShortUrl(data.mapAddress)
    : data.mapAddress;
  const firstCeremony = ceremonies[0];
  const persistedData = {
    ...data,
    ceremonyHeader: firstCeremony?.title ?? "",
    ceremonyDate: firstCeremony?.date ?? "",
    ceremonyTime: firstCeremony?.time ?? "",
    mapAddress,
  };
  const { templateId, ...contentData } = persistedData;

  await prisma.$transaction([
    prisma.invitation.update({
      where: { id },
      data: { templateId },
    }),
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

  return { data: persistedData } as const;
}

export async function resolveGoogleMapsLink(value: string): Promise<{
  url: string;
  resolved: boolean;
  valid: boolean;
}> {
  await verifySession();
  const source = value.trim();
  if (!isGoogleMapsUrl(source) || source.length > 1_200) {
    return { url: source, resolved: false, valid: false };
  }
  const url = await expandGoogleMapsShortUrl(source);
  return {
    url,
    resolved: url !== source,
    valid: true,
  };
}

export async function saveDraft(id: string, _prev: EditorState, formData: FormData): Promise<EditorState> {
  const { userId } = await verifySession();
  const invitation = await ownInvitation(id, userId);
  if (!invitation) return { error: "Không tìm thấy thiệp" };

  const result = await persistDraft(id, formData);
  if ("error" in result) return { error: result.error };

  revalidatePath(`/editor/${id}`);
  return { ok: true, persisted: true };
}

/**
 * Lưu ngầm bản nháp (autosave). Khác saveDraft: không revalidate để tránh
 * remount form khi user đang gõ, và trả boolean cho autosave-controller biết
 * có nên dời baseline hay giữ lại để thử lại.
 */
export async function autosaveDraft(id: string, formData: FormData): Promise<boolean> {
  const { userId } = await verifySession();
  const invitation = await ownInvitation(id, userId);
  if (!invitation) return false;

  const result = await persistDraft(id, formData);
  return !("error" in result);
}

export async function checkSlug(slug: string, invitationId: string): Promise<{ available: boolean; reason?: string }> {
  const { userId } = await verifySession();
  const normalized = slug.trim().toLowerCase();
  if (!normalized) return { available: false, reason: "Chưa nhập đường dẫn" };
  if (!SLUG_RE.test(normalized)) {
    return { available: false, reason: "Chỉ dùng chữ thường, số và dấu gạch ngang" };
  }
  const existing = await prisma.invitation.findUnique({ where: { slug: normalized } });
  if (existing && existing.id !== invitationId) {
    return { available: false, reason: "Đường dẫn đã được dùng" };
  }
  if (existing && existing.userId !== userId) {
    return { available: false, reason: "Đường dẫn đã được dùng" };
  }
  return { available: true };
}

export async function publish(id: string, _prev: EditorState, formData: FormData): Promise<EditorState> {
  const { userId } = await verifySession();
  const invitation = await ownInvitation(id, userId);
  if (!invitation) return { error: "Không tìm thấy thiệp" };

  const draft = await persistDraft(id, formData);
  if ("error" in draft) return { error: draft.error };

  // persistDraft đã ghi nội dung mới nhất; giữ Server Component đồng bộ kể cả khi
  // các điều kiện xuất bản bên dưới chưa đạt.
  revalidatePath(`/editor/${id}`);

  if (!draft.data.brideFullName.trim() || !draft.data.groomFullName.trim()) {
    return {
      error: "Cần tên cô dâu và chú rể trước khi xuất bản",
      focusField: !draft.data.brideFullName.trim() ? "brideFullName" : "groomFullName",
      persisted: true,
    };
  }
  if (!draft.data.date.trim()) {
    return { error: "Cần ngày cưới trước khi xuất bản", focusField: "date", persisted: true };
  }
  if (!draft.data.time.trim()) {
    return { error: "Cần giờ tiệc cưới trước khi xuất bản", focusField: "time", persisted: true };
  }

  const formSlug = String(formData.get("slug") ?? "").trim().toLowerCase();
  const baseSlug = formSlug || slugFromFormFields(draft.data);
  if (!baseSlug) {
    return { error: "Chưa có tên cô dâu/chú rể để tạo đường dẫn", persisted: true };
  }

  const slugCheck = await checkSlug(baseSlug, id);
  if (!slugCheck.available) {
    return { error: slugCheck.reason ?? "Đường dẫn không hợp lệ", focusField: "slug", persisted: true };
  }

  const publishedAt = invitation.publishedAt ?? new Date();
  await prisma.invitation.update({
    where: { id },
    data: {
      slug: baseSlug,
      status: "published",
      ...(invitation.publishedAt ? {} : { publishedAt }),
    },
  });

  revalidatePath(`/editor/${id}`);
  revalidatePath(`/thiep/${baseSlug}`);
  return {
    ok: true,
    persisted: true,
    publishedSlug: baseSlug,
    publishedAt: publishedAt.toISOString(),
  };
}

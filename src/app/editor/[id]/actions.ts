"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import { verifySession, ownInvitation } from "@/lib/dal";
import {
  contentSchema,
  parseSchedule,
  parseGallery,
  type EditorState,
} from "./content-schema";
import { slugFromFormFields, slugSuffix } from "./slug";

const SLUG_RE = /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/;

async function persistDraft(id: string, formData: FormData) {
  const parsed = contentSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dữ liệu không hợp lệ" } as const;
  }

  const data = parsed.data;
  const schedule = parseSchedule(formData);
  const gallery = parseGallery(formData);
  const { templateId, ...contentData } = data;

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
    prisma.scheduleItem.deleteMany({ where: { invitationId: id } }),
    prisma.galleryPhoto.deleteMany({ where: { invitationId: id } }),
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

  return { data } as const;
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
    return { error: "Cần tên cô dâu và chú rể trước khi xuất bản", persisted: true };
  }
  if (!draft.data.date.trim()) {
    return { error: "Cần ngày cưới trước khi xuất bản", persisted: true };
  }

  const formSlug = String(formData.get("slug") ?? "").trim().toLowerCase();
  const baseSlug = formSlug || slugFromFormFields(draft.data);
  if (!baseSlug) {
    return { error: "Chưa có tên cô dâu/chú rể để tạo đường dẫn", persisted: true };
  }

  let rawSlug = baseSlug;
  let slugCheck = await checkSlug(rawSlug, id);
  if (!slugCheck.available && slugCheck.reason === "Đường dẫn đã được dùng") {
    rawSlug = `${baseSlug}-${slugSuffix()}`;
    slugCheck = await checkSlug(rawSlug, id);
  }
  if (!slugCheck.available) {
    return { error: slugCheck.reason ?? "Đường dẫn không hợp lệ", persisted: true };
  }

  await prisma.invitation.update({
    where: { id },
    data: {
      slug: rawSlug,
      status: "published",
      ...(invitation.publishedAt ? {} : { publishedAt: new Date() }),
    },
  });

  revalidatePath(`/editor/${id}`);
  revalidatePath(`/thiep/${rawSlug}`);
  redirect(`/thiep/${rawSlug}?published=1`);
}

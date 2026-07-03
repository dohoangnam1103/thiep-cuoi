"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { verifySession, ownInvitation } from "@/lib/dal";
import { VALID_TEMPLATE_IDS } from "./templates";

const SLUG_RE = /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/;

const scheduleItemSchema = z.object({
  time: z.string().max(20),
  label: z.string().max(120),
});

const contentSchema = z.object({
  templateId: z.enum(VALID_TEMPLATE_IDS),
  primaryColor: z.string().max(32).optional().default(""),
  fontFamily: z.string().max(80).optional().default(""),
  music: z.string().max(300).optional().default(""),

  brideFullName: z.string().max(120).optional().default(""),
  groomFullName: z.string().max(120).optional().default(""),
  brideShortName: z.string().max(60).optional().default(""),
  groomShortName: z.string().max(60).optional().default(""),
  groomBirthOrder: z.string().max(40).optional().default(""),
  brideBirthOrder: z.string().max(40).optional().default(""),
  brideFirst: z.coerce.boolean().optional().default(true),
  date: z.string().max(20).optional().default(""),
  time: z.string().max(20).optional().default(""),
  ceremonyDate: z.string().max(20).optional().default(""),
  ceremonyTime: z.string().max(20).optional().default(""),
  ceremonyHeader: z.string().max(200).optional().default(""),

  brideFather: z.string().max(120).optional().default(""),
  brideMother: z.string().max(120).optional().default(""),
  brideAddress: z.string().max(200).optional().default(""),
  groomFather: z.string().max(120).optional().default(""),
  groomMother: z.string().max(120).optional().default(""),
  groomAddress: z.string().max(200).optional().default(""),
  brideParentTitle: z.string().max(60).optional().default(""),
  groomParentTitle: z.string().max(60).optional().default(""),

  address: z.string().max(200).optional().default(""),
  mapAddress: z.string().max(300).optional().default(""),
  banquetTime: z.string().max(60).optional().default(""),

  brideBankName: z.string().max(120).optional().default(""),
  brideAccountNumber: z.string().max(60).optional().default(""),
  brideAccountName: z.string().max(120).optional().default(""),
  groomBankName: z.string().max(120).optional().default(""),
  groomAccountNumber: z.string().max(60).optional().default(""),
  groomAccountName: z.string().max(120).optional().default(""),
});

export type EditorState = { error?: string; ok?: boolean } | undefined;

function parseSchedule(formData: FormData) {
  const times = formData.getAll("scheduleTime").map(String);
  const labels = formData.getAll("scheduleLabel").map(String);
  const items: { time: string; label: string }[] = [];
  for (let i = 0; i < Math.max(times.length, labels.length); i++) {
    const time = (times[i] ?? "").trim();
    const label = (labels[i] ?? "").trim();
    if (!time && !label) continue;
    const parsed = scheduleItemSchema.safeParse({ time, label });
    if (parsed.success) items.push(parsed.data);
  }
  return items;
}

function parseGallery(formData: FormData) {
  return formData
    .getAll("galleryUrl")
    .map(String)
    .map((u) => u.trim())
    .filter(Boolean)
    .slice(0, 30);
}

export async function saveDraft(id: string, _prev: EditorState, formData: FormData): Promise<EditorState> {
  const { userId } = await verifySession();
  const invitation = await ownInvitation(id, userId);
  if (!invitation) return { error: "Không tìm thấy thiệp" };

  const parsed = contentSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dữ liệu không hợp lệ" };
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

  revalidatePath(`/editor/${id}`);
  return { ok: true };
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

  const content = await prisma.invitationContent.findUnique({ where: { invitationId: id } });
  if (!content) return { error: "Vui lòng lưu nội dung trước khi xuất bản" };
  if (!content.brideFullName.trim() || !content.groomFullName.trim()) {
    return { error: "Cần tên cô dâu và chú rể trước khi xuất bản" };
  }
  if (!content.date.trim()) {
    return { error: "Cần ngày cưới trước khi xuất bản" };
  }

  const rawSlug = String(formData.get("slug") ?? "").trim().toLowerCase();
  const slugCheck = await checkSlug(rawSlug, id);
  if (!slugCheck.available) {
    return { error: slugCheck.reason ?? "Đường dẫn không hợp lệ" };
  }

  await prisma.invitation.update({
    where: { id },
    data: { slug: rawSlug, status: "published" },
  });

  revalidatePath(`/thiep/${rawSlug}`);
  redirect(`/thiep/${rawSlug}`);
}

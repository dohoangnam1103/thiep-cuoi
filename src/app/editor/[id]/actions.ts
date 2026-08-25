"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import { verifyAccountSession, ownInvitation } from "@/lib/dal";
import { isGoogleMapsUrl } from "@/lib/google-maps";
import { expandGoogleMapsShortUrl } from "@/lib/google-maps-server";
import { publicationIssue, validateInvitationSlug } from "@/lib/invitation-editor-rules";
import { prepareInvitationDraft, writeInvitationDraft } from "@/lib/invitation-editor-store";
import { type EditorState, type SlugCheckResult } from "./content-schema";
import { slugFromFormFields } from "./slug";

/**
 * Cùng một cửa với trang editor: chỉ account thật được ghi. Session ẩn danh bị
 * đẩy về /login kèm `next` trỏ lại chính thiệp đang mở.
 */
async function requireOwnedInvitation(id: string) {
  const { userId } = await verifyAccountSession(`/editor/${id}`, "create");
  const invitation = await ownInvitation(id, userId);
  if (!invitation) return null;
  return { invitation, userId };
}

export async function resolveGoogleMapsLink(value: string): Promise<{
  url: string;
  resolved: boolean;
  valid: boolean;
}> {
  await verifyAccountSession("/dashboard", "create");
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
  const access = await requireOwnedInvitation(id);
  if (!access) return { errorCode: "invitationNotFound" };

  const prepared = await prepareInvitationDraft(formData);
  if ("errorCode" in prepared) {
    return { errorCode: prepared.errorCode };
  }

  await prisma.$transaction((db) => writeInvitationDraft(db, id, prepared.data));
  revalidatePath(`/editor/${id}`);
  return { ok: true, persisted: true };
}

/**
 * Lưu ngầm bản nháp (autosave). Khác saveDraft: không revalidate để tránh
 * remount form khi user đang gõ, và trả boolean cho autosave-controller biết
 * có nên dời baseline hay giữ lại để thử lại.
 */
export async function autosaveDraft(id: string, formData: FormData): Promise<boolean> {
  const access = await requireOwnedInvitation(id);
  if (!access) return false;

  const prepared = await prepareInvitationDraft(formData);
  if ("errorCode" in prepared) return false;

  await prisma.$transaction((db) => writeInvitationDraft(db, id, prepared.data));
  return true;
}

export async function checkSlug(
  slug: string,
  invitationId: string,
): Promise<SlugCheckResult> {
  const access = await requireOwnedInvitation(invitationId);
  if (!access) {
    return { available: false, reasonCode: "invitationNotFound" };
  }
  const normalized = slug.trim().toLowerCase();
  const syntax = validateInvitationSlug(normalized);
  if (!syntax.available) {
    return syntax;
  }
  const existing = await prisma.invitation.findUnique({ where: { slug: normalized } });
  if (existing && existing.id !== invitationId) {
    return { available: false, reasonCode: "slugTaken" };
  }
  return { available: true };
}

export async function publish(id: string, _prev: EditorState, formData: FormData): Promise<EditorState> {
  const access = await requireOwnedInvitation(id);
  if (!access) return { errorCode: "invitationNotFound" };

  const prepared = await prepareInvitationDraft(formData);
  if ("errorCode" in prepared) {
    return { errorCode: prepared.errorCode };
  }

  await prisma.$transaction((db) => writeInvitationDraft(db, id, prepared.data));
  // Draft đã ghi nội dung mới nhất; giữ Server Component đồng bộ kể cả khi
  // các điều kiện xuất bản bên dưới chưa đạt.
  revalidatePath(`/editor/${id}`);

  const issue = publicationIssue(prepared.data.persistedData);
  if (issue) {
    return {
      errorCode: issue.errorCode,
      focusField: issue.focusField,
      persisted: true,
    };
  }

  const formSlug = String(formData.get("slug") ?? "").trim().toLowerCase();
  const baseSlug = formSlug || slugFromFormFields(prepared.data.persistedData);
  if (!baseSlug) {
    return { errorCode: "slugMissing", persisted: true };
  }

  const syntax = validateInvitationSlug(baseSlug);
  if (!syntax.available) {
    return {
      errorCode: syntax.reasonCode,
      focusField: "slug",
      persisted: true,
    };
  }

  const published = await prisma.$transaction(async (db) => {
    const current = await db.invitation.findFirst({
      where: { id, userId: access.userId },
    });
    if (!current) return { errorCode: "invitationNotFound" } as const;
    const existing = await db.invitation.findUnique({ where: { slug: baseSlug } });
    if (existing && existing.id !== id) return { errorCode: "slugTaken" } as const;
    const publishedAt = current.publishedAt ?? new Date();
    await db.invitation.update({
      where: { id },
      data: {
        slug: baseSlug,
        status: "published",
        ...(current.publishedAt ? {} : { publishedAt }),
      },
    });
    return { publishedAt };
  });

  if ("errorCode" in published) {
    return {
      errorCode: published.errorCode,
      focusField: published.errorCode === "slugTaken" ? "slug" : undefined,
      persisted: true,
    };
  }

  revalidatePath(`/editor/${id}`);
  revalidatePath(`/thiep/${baseSlug}`);
  return {
    ok: true,
    persisted: true,
    publishedSlug: baseSlug,
    publishedAt: published.publishedAt.toISOString(),
  };
}

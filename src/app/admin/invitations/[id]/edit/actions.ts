"use server";

import { revalidatePath } from "next/cache";

import type { Prisma } from "@/generated/prisma/client";
import { verifyAdmin } from "@/lib/admin-dal";
import {
  ADMIN_AUDIT_ACTIONS,
  writeAdminAudit,
} from "@/lib/admin-audit";
import { diffInvitationEditorAudit } from "@/lib/invitation-editor-audit";
import { publicationIssue, validateInvitationSlug } from "@/lib/invitation-editor-rules";
import {
  prepareInvitationDraft,
  writeInvitationDraft,
  type PreparedInvitationDraft,
} from "@/lib/invitation-editor-store";
import { prisma } from "@/lib/prisma";
import { isGoogleMapsUrl } from "@/lib/google-maps";
import { expandGoogleMapsShortUrl } from "@/lib/google-maps-server";
import {
  type EditorErrorCode,
  type EditorState,
  type SlugCheckResult,
} from "@/app/editor/[id]/content-schema";
import { slugFromFormFields } from "@/app/editor/[id]/slug";

/**
 * The only error type a support mutation may turn into an EditorState. Anything
 * else (infrastructure failure, programming bug) is rethrown so it surfaces
 * instead of being masked as a friendly message.
 */
class SupportEditorMutationError extends Error {
  constructor(readonly code: EditorErrorCode) {
    super(code);
  }
}

function editorFailure(error: unknown): EditorState {
  if (error instanceof SupportEditorMutationError) {
    return { errorCode: error.code };
  }
  throw error;
}

const INVITATION_INCLUDE = {
  user: { select: { id: true, email: true } },
  content: true,
  ceremonies: { orderBy: { sortOrder: "asc" } },
  schedule: { orderBy: { sortOrder: "asc" } },
  gallery: { orderBy: { sortOrder: "asc" } },
} as const;

/**
 * Re-query the invitation inside the transaction. The target user is derived
 * only from this row — never from a client-provided userId — so a tampered
 * bound id can never pair one user's profile with another invitation's audit.
 */
async function loadSupportedInvitation(db: Prisma.TransactionClient, id: string) {
  const invitation = await db.invitation.findFirst({
    where: { id, isDemo: false },
    include: INVITATION_INCLUDE,
  });
  if (!invitation) {
    throw new SupportEditorMutationError("invitationNotFound");
  }
  return invitation;
}

function editorDiff(
  invitation: Awaited<ReturnType<typeof loadSupportedInvitation>>,
  prepared: PreparedInvitationDraft,
) {
  return diffInvitationEditorAudit(
    {
      source: "prisma",
      templateId: invitation.templateId,
      content: invitation.content,
      ceremonies: invitation.ceremonies,
      schedule: invitation.schedule,
      gallery: invitation.gallery,
    },
    {
      source: "submitted",
      persistedData: prepared.persistedData,
      ceremonies: prepared.ceremonies,
      schedule: prepared.schedule,
      gallery: prepared.gallery,
    },
  );
}

export async function saveSupportedInvitation(
  id: string,
  _prev: EditorState,
  formData: FormData,
): Promise<EditorState> {
  const { adminId, adminEmail } = await verifyAdmin();

  const prepared = await prepareInvitationDraft(formData);
  if ("errorCode" in prepared) {
    return { errorCode: prepared.errorCode };
  }

  try {
    await prisma.$transaction(async (db) => {
      const invitation = await loadSupportedInvitation(db, id);
      const diff = editorDiff(invitation, prepared.data);
      await writeInvitationDraft(db, invitation.id, prepared.data);
      await writeAdminAudit(db, {
        adminId,
        adminEmail,
        targetUserId: invitation.user.id,
        targetUserEmail: invitation.user.email,
        invitationId: invitation.id,
        action: ADMIN_AUDIT_ACTIONS.invitationUpdated,
        details: {
          changedGroups: diff.changedGroups,
          changedFields: diff.changedFields,
          ...(invitation.templateId === prepared.data.templateId
            ? {}
            : { templateId: prepared.data.templateId }),
        },
      });
    });
  } catch (error) {
    return editorFailure(error);
  }

  revalidatePath(`/admin/invitations/${id}/edit`);
  revalidatePath(`/admin/users`);
  revalidatePath(`/editor/${id}`);
  revalidatePath(`/dashboard`);
  return { ok: true, persisted: true };
}

export async function publishSupportedInvitation(
  id: string,
  _prev: EditorState,
  formData: FormData,
): Promise<EditorState> {
  const { adminId, adminEmail } = await verifyAdmin();

  const prepared = await prepareInvitationDraft(formData);
  if ("errorCode" in prepared) {
    return { errorCode: prepared.errorCode };
  }

  const issue = publicationIssue(prepared.data.persistedData);
  if (issue) {
    return {
      errorCode: issue.errorCode,
      focusField: issue.focusField,
    };
  }

  const formSlug = String(formData.get("slug") ?? "").trim().toLowerCase();
  const baseSlug = formSlug || slugFromFormFields(prepared.data.persistedData);
  if (!baseSlug) {
    return { errorCode: "slugMissing" };
  }
  const syntax = validateInvitationSlug(baseSlug);
  if (!syntax.available) {
    return {
      errorCode: syntax.reasonCode,
      focusField: "slug",
    };
  }

  let result: { slug: string | null; publishedAt: Date };
  try {
    result = await prisma.$transaction(async (db) => {
      const invitation = await loadSupportedInvitation(db, id);

      const existing = await db.invitation.findUnique({ where: { slug: baseSlug } });
      if (existing && existing.id !== invitation.id) {
        throw new SupportEditorMutationError("slugTaken");
      }

      const diff = editorDiff(invitation, prepared.data);
      await writeInvitationDraft(db, invitation.id, prepared.data);

      const wasPublished = invitation.status === "published";
      const publishedAt = invitation.publishedAt ?? new Date();
      await db.invitation.update({
        where: { id: invitation.id },
        data: {
          slug: baseSlug,
          status: "published",
          ...(invitation.publishedAt ? {} : { publishedAt }),
        },
      });

      await writeAdminAudit(db, {
        adminId,
        adminEmail,
        targetUserId: invitation.user.id,
        targetUserEmail: invitation.user.email,
        invitationId: invitation.id,
        action: wasPublished
          ? ADMIN_AUDIT_ACTIONS.invitationUpdated
          : ADMIN_AUDIT_ACTIONS.invitationPublished,
        details: {
          changedGroups: diff.changedGroups,
          changedFields: diff.changedFields,
          ...(invitation.templateId === prepared.data.templateId
            ? {}
            : { templateId: prepared.data.templateId }),
          before: { status: invitation.status, slug: invitation.slug },
          after: { status: "published", slug: baseSlug },
        },
      });

      return { slug: invitation.slug, publishedAt };
    });
  } catch (error) {
    return editorFailure(error);
  }

  revalidatePath(`/admin/invitations/${id}/edit`);
  revalidatePath(`/admin/users`);
  revalidatePath(`/editor/${id}`);
  revalidatePath(`/dashboard`);
  revalidatePath(`/thiep/${baseSlug}`);
  if (result.slug && result.slug !== baseSlug) {
    revalidatePath(`/thiep/${result.slug}`);
  }

  return {
    ok: true,
    persisted: true,
    publishedSlug: baseSlug,
    publishedAt: result.publishedAt.toISOString(),
  };
}

export async function checkSupportedInvitationSlug(
  slug: string,
  invitationId: string,
): Promise<SlugCheckResult> {
  await verifyAdmin();

  const invitation = await prisma.invitation.findFirst({
    where: { id: invitationId, isDemo: false },
    select: { id: true },
  });
  if (!invitation) {
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

export async function resolveSupportedGoogleMapsLink(value: string): Promise<{
  url: string;
  resolved: boolean;
  valid: boolean;
}> {
  await verifyAdmin();
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

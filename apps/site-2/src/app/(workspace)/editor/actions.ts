"use server";

import { revalidatePath } from "next/cache";

import {
  getOwnedInvitation,
  publishInvitation,
  updateInvitationContent,
} from "../../../lib/dal";
import type { ActionResult } from "../../../lib/action-result";
import { getSite2Session } from "../../../lib/session";
import vi from "@messages/vi.json";

const PUBLISH_REQUIRED_FIELDS = ["brideFullName", "groomFullName"] as const;

export async function saveEditorContent(
  invitationId: string,
  fields: Record<string, string>,
): Promise<ActionResult<{ saved: true }>> {
  const session = await getSite2Session();
  if (!session) {
    return { ok: false, formError: vi.editor.notFound };
  }
  try {
    await updateInvitationContent(invitationId, session.userId, fields);
  } catch {
    return { ok: false, formError: vi.editor.notFound };
  }
  revalidatePath(`/editor/${invitationId}`);
  return { ok: true, data: { saved: true } };
}

/* Publish stays server-authoritative: required names are read back from the
 * database, never trusted from the client. Callers flush pending autosaves
 * before invoking so validation sees the latest keystrokes. */
export async function publishEditorInvitation(
  invitationId: string,
): Promise<ActionResult<{ slug: string }>> {
  const session = await getSite2Session();
  if (!session) {
    return { ok: false, formError: vi.editor.notFound };
  }
  const invitation = await getOwnedInvitation(invitationId, session.userId);
  if (!invitation) {
    return { ok: false, formError: vi.editor.notFound };
  }
  const fieldErrors: Record<string, string> = {};
  for (const field of PUBLISH_REQUIRED_FIELDS) {
    if (!invitation.content?.[field]?.trim()) {
      fieldErrors[field] = vi.editor.requiredField;
    }
  }
  if (Object.keys(fieldErrors).length > 0) {
    return {
      ok: false,
      fieldErrors,
      formError: vi.editor.publishValidation,
    };
  }
  try {
    const published = await publishInvitation(invitationId, session.userId);
    if (!published.slug) {
      return { ok: false, formError: vi.editor.notFound };
    }
    revalidatePath(`/editor/${invitationId}`);
    revalidatePath("/dashboard");
    return { ok: true, data: { slug: published.slug } };
  } catch {
    return { ok: false, formError: vi.editor.notFound };
  }
}

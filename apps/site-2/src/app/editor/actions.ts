"use server";

import { revalidatePath } from "next/cache";

import {
  publishInvitation,
  updateInvitationContent,
} from "../../lib/dal";
import { getSite2Session } from "../../lib/session";
import vi from "@messages/vi.json";

export type EditorState = { message?: string; error?: string } | undefined;

export async function saveEditorContent(
  invitationId: string,
  _prev: EditorState,
  formData: FormData,
): Promise<EditorState> {
  const session = await getSite2Session();
  if (!session) {
    return { error: vi.editor.notFound };
  }
  const fields: Record<string, string> = {};
  for (const [key, value] of formData.entries()) {
    if (typeof value === "string") fields[key] = value;
  }
  try {
    await updateInvitationContent(invitationId, session.userId, fields);
  } catch {
    return { error: vi.editor.notFound };
  }
  revalidatePath(`/editor/${invitationId}`);
  return { message: vi.editor.saved };
}

export async function publishEditorInvitation(
  invitationId: string,
): Promise<EditorState> {
  const session = await getSite2Session();
  if (!session) {
    return { error: vi.editor.notFound };
  }
  try {
    await publishInvitation(invitationId, session.userId);
  } catch {
    return { error: vi.editor.notFound };
  }
  revalidatePath(`/editor/${invitationId}`);
  revalidatePath("/dashboard");
  return { message: vi.editor.published };
}

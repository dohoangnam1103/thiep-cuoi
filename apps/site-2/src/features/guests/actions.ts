"use server";

import { revalidatePath } from "next/cache";

import type { ActionResult } from "../../lib/action-result";
import { getSite2Session } from "../../lib/session";
import vi from "@messages/vi.json";
import {
  createGuest,
  deleteGuest,
  updateGuest,
  validateGuestInput,
} from "./dal";
import type { GuestInput } from "./types";

async function sessionUserId(): Promise<string | null> {
  const session = await getSite2Session();
  return session?.userId ?? null;
}

function sessionExpired(): ActionResult<never> {
  return { ok: false, formError: vi.guests.sessionExpired };
}

function guestError(error: unknown): string {
  if (error instanceof Error) {
    if (error.message.includes("Invitation")) return vi.guests.notFound;
    if (error.message.includes("Guest")) return vi.guests.guestNotFound;
  }
  return vi.guests.validationError;
}

export async function createGuestAction(
  invitationId: string,
  input: GuestInput,
): Promise<ActionResult<{ id: string }>> {
  const userId = await sessionUserId();
  if (!userId) return sessionExpired();
  const valid = validateGuestInput(input);
  if (!valid.ok) {
    return {
      ok: false,
      fieldErrors: valid.fieldErrors,
      formError: vi.guests.validationError,
    };
  }
  try {
    const guest = await createGuest(userId, invitationId, input);
    revalidatePath(`/dashboard/${invitationId}/khach-moi`);
    return { ok: true, data: { id: guest.id } };
  } catch (error) {
    return { ok: false, formError: guestError(error) };
  }
}

export async function updateGuestAction(
  invitationId: string,
  guestId: string,
  input: GuestInput,
): Promise<ActionResult<{ id: string }>> {
  const userId = await sessionUserId();
  if (!userId) return sessionExpired();
  const valid = validateGuestInput(input);
  if (!valid.ok) {
    return {
      ok: false,
      fieldErrors: valid.fieldErrors,
      formError: vi.guests.validationError,
    };
  }
  try {
    await updateGuest(userId, invitationId, guestId, input);
    revalidatePath(`/dashboard/${invitationId}/khach-moi`);
    return { ok: true, data: { id: guestId } };
  } catch (error) {
    return { ok: false, formError: guestError(error) };
  }
}

export async function deleteGuestAction(
  invitationId: string,
  guestId: string,
): Promise<ActionResult<{ id: string }>> {
  const userId = await sessionUserId();
  if (!userId) return sessionExpired();
  try {
    await deleteGuest(userId, invitationId, guestId);
    revalidatePath(`/dashboard/${invitationId}/khach-moi`);
    return { ok: true, data: { id: guestId } };
  } catch (error) {
    return { ok: false, formError: guestError(error) };
  }
}

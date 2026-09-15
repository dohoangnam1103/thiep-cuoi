"use server";

import { revalidatePath } from "next/cache";

import {
  submitPublicRsvp,
  submitPublicWish,
} from "./dal";

export type PublicState = { error?: string; ok?: boolean } | undefined;

function formString(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

/* Thin FormData adapters over the site-2 RSVP DAL for the shared invitation
 * renderer. Every check lives in the DAL; these only translate shapes. */
export async function submitRsvpForSlug(
  slug: string,
  _prev: PublicState,
  formData: FormData,
): Promise<PublicState> {
  const guestsRaw = formString(formData, "guests");
  const answers: { questionId: string; value: string }[] = [];
  for (const [key, value] of formData.entries()) {
    if (key.startsWith("question:") && typeof value === "string") {
      answers.push({ questionId: key.slice("question:".length), value });
    }
  }
  const result = await submitPublicRsvp({
    slug,
    token: formString(formData, "guestId") || undefined,
    name: formString(formData, "name"),
    attending: formString(formData, "attending") === "yes",
    partySize: guestsRaw ? Number(guestsRaw) : 1,
    side: formString(formData, "side") || undefined,
    message: formString(formData, "message") || undefined,
    shuttle: formString(formData, "shuttle") === "yes",
    dietary: formString(formData, "dietary") || undefined,
    songRequest: formString(formData, "songRequest") || undefined,
    answers,
  });
  if (!result.ok) {
    return { error: result.error };
  }
  revalidatePath(`/thiep/${slug}`);
  return { ok: true };
}

export async function submitWishForSlug(
  slug: string,
  _prev: PublicState,
  formData: FormData,
): Promise<PublicState> {
  const result = await submitPublicWish({
    slug,
    name: formString(formData, "name"),
    text: formString(formData, "text"),
  });
  if (!result.ok) {
    return { error: result.error };
  }
  revalidatePath(`/thiep/${slug}`);
  return { ok: true };
}

"use server";

import { unlink } from "node:fs/promises";

import { revalidatePath } from "next/cache";

import { ownInvitation, verifySession } from "@/lib/dal";
import { guestMediaPath } from "@/lib/guest-media";
import { prisma } from "@/lib/prisma";

export type ModerationResult = { ok: true } | { ok: false; error: "notFound" | "deleteFailed" };

async function getOwnedInvitation(invitationId: string) {
  const { userId } = await verifySession();
  return ownInvitation(invitationId, userId);
}

function revalidateModerationPages(invitationId: string, slug: string | null) {
  revalidatePath(`/dashboard/${invitationId}/rsvp`);
  if (slug) revalidatePath(`/thiep/${slug}`);
}

export async function deleteWish(invitationId: string, wishId: string): Promise<ModerationResult> {
  const invitation = await getOwnedInvitation(invitationId);
  if (!invitation) return { ok: false, error: "notFound" };

  const result = await prisma.wish.deleteMany({ where: { id: wishId, invitationId } });
  if (result.count === 0) return { ok: false, error: "notFound" };

  revalidateModerationPages(invitationId, invitation.slug);
  return { ok: true };
}

export async function deleteGuestMedia(invitationId: string, mediaId: string): Promise<ModerationResult> {
  const invitation = await getOwnedInvitation(invitationId);
  if (!invitation) return { ok: false, error: "notFound" };

  const media = await prisma.guestMedia.findFirst({
    where: { id: mediaId, invitationId },
    select: { storageKey: true },
  });
  if (!media) return { ok: false, error: "notFound" };

  try {
    const result = await prisma.guestMedia.deleteMany({ where: { id: mediaId, invitationId } });
    if (result.count === 0) return { ok: false, error: "notFound" };
    const filePath = guestMediaPath(media.storageKey);
    if (filePath) await unlink(/* turbopackIgnore: true */ filePath).catch(() => undefined);
  } catch (error) {
    console.error("Unable to delete guest media", error);
    return { ok: false, error: "deleteFailed" };
  }

  revalidateModerationPages(invitationId, invitation.slug);
  return { ok: true };
}

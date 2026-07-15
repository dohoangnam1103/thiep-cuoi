"use server";

import { randomBytes } from "node:crypto";

import { revalidatePath } from "next/cache";

import { ownInvitation, verifySession } from "@/lib/dal";
import { prisma } from "@/lib/prisma";

export type CohostActionResult = {
  ok?: boolean;
  token?: string | null;
  error?: "notFound" | "unpublished";
};

export async function rotateCohostLink(invitationId: string): Promise<CohostActionResult> {
  const { userId } = await verifySession();
  const invitation = await ownInvitation(invitationId, userId);
  if (!invitation) return { error: "notFound" };
  if (!invitation.slug || invitation.status !== "published") return { error: "unpublished" };

  const token = randomBytes(24).toString("base64url");
  await prisma.invitation.update({
    where: { id: invitationId },
    data: { guestManagerToken: token },
  });
  revalidatePath(`/dashboard/${invitationId}/guests`);
  return { ok: true, token };
}

export async function revokeCohostLink(invitationId: string): Promise<CohostActionResult> {
  const { userId } = await verifySession();
  const invitation = await ownInvitation(invitationId, userId);
  if (!invitation) return { error: "notFound" };

  await prisma.invitation.update({
    where: { id: invitationId },
    data: { guestManagerToken: null },
  });
  revalidatePath(`/dashboard/${invitationId}/guests`);
  return { ok: true, token: null };
}

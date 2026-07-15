import { cache } from "react";
import { redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { createSession, getSession } from "@/lib/session";

export const getCurrentUserId = cache(async () => {
  const session = await getSession();
  return session?.userId ?? null;
});

export const getCurrentUser = cache(async () => {
  const userId = await getCurrentUserId();
  if (!userId) return null;
  return prisma.user.findUnique({ where: { id: userId } });
});

export async function verifySession(): Promise<{ userId: string }> {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }
  return session;
}

export async function getOrCreateUserId(): Promise<string> {
  const session = await getSession();
  if (session) return session.userId;

  const user = await prisma.user.create({ data: {} });
  await createSession(user.id);
  return user.id;
}

export async function ownInvitation(invitationId: string, userId: string) {
  const invitation = await prisma.invitation.findUnique({
    where: { id: invitationId },
  });
  if (!invitation || invitation.userId !== userId) {
    return null;
  }
  return invitation;
}

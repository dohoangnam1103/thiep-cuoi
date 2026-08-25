import { cache } from "react";
import { redirect } from "next/navigation";

import { getAccountSessionUserId } from "@/lib/auth/anonymous-account";
import { loginReasonHref, type AuthReason } from "@/lib/auth-redirects";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

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

/**
 * Session gate for anything that takes the visitor's money, and for tạo/sửa
 * thiệp. `verifySession()` is satisfied by an anonymous cookie-only account,
 * which is how an invitation gets paid for with no email attached to it:
 * nothing in checkout ever asks who the buyer is, so a lost cookie leaves us
 * with a payment we cannot trace back to a person. Work — and money — moves
 * only once the session belongs to a real account.
 *
 * `returnTo` brings the visitor back to where they were: signing in adopts the
 * anonymous session, so the invitation they were about to edit or pay for
 * follows them into the account and keeps its id.
 */
export async function verifyAccountSession(
  returnTo: string,
  reason: AuthReason = "checkout",
): Promise<{ userId: string }> {
  const userId = await getAccountSessionUserId();
  if (!userId) {
    redirect(loginReasonHref(reason, returnTo));
  }
  return { userId };
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

import type { Prisma, User } from "@/generated/prisma/client";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

export type AnonymityFields = Pick<User, "email" | "passwordHash">;

/**
 * `getOrCreateUserId()` creates a User row with no credentials at all, so the
 * only way back into that account is the session cookie — which lives 7 days
 * and is never refreshed. A row in that state may be adopted by whatever
 * account the visitor authenticates with; a row that already carries an email
 * or a password belongs to someone and must never be touched.
 */
export function isAnonymousUser(user: AnonymityFields | null | undefined): boolean {
  if (!user) return false;
  return user.email === null && user.passwordHash === null;
}

/**
 * The id of the current session's user when that user is anonymous, so callers
 * can turn it into a real account instead of stranding its invitations.
 */
export async function getAnonymousSessionUserId(): Promise<string | null> {
  const session = await getSession();
  if (!session) return null;

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { email: true, passwordHash: true },
  });
  return isAnonymousUser(user) ? session.userId : null;
}

/**
 * Repoints everything `fromUserId` owns at `toUserId` and drops the emptied
 * row. Returns how many invitations moved. Runs inside a caller-supplied
 * transaction so the counts that guard the delete cannot race a concurrent
 * write.
 */
export async function transferUserOwnership(
  db: Prisma.TransactionClient,
  fromUserId: string,
  toUserId: string,
): Promise<number> {
  const moved = await db.invitation.updateMany({
    where: { userId: fromUserId },
    data: { userId: toUserId },
  });
  await db.templateSuggestion.updateMany({
    where: { userId: fromUserId },
    data: { userId: toUserId },
  });
  await db.adminAuditLog.updateMany({
    where: { targetUserId: fromUserId },
    data: { targetUserId: toUserId },
  });

  // Invitation and TemplateSuggestion both cascade on user delete, so the row
  // may only be removed once both are provably empty.
  const [invitations, suggestions] = await Promise.all([
    db.invitation.count({ where: { userId: fromUserId } }),
    db.templateSuggestion.count({ where: { userId: fromUserId } }),
  ]);
  if (invitations === 0 && suggestions === 0) {
    await db.user.delete({ where: { id: fromUserId } });
  }

  return moved.count;
}

/**
 * Moves everything the anonymous session owns onto an account that already
 * exists. Must run before `createSession()` replaces the cookie, because the
 * cookie is what identifies the row to adopt.
 */
export async function adoptAnonymousSession(accountUserId: string): Promise<number> {
  const anonymousUserId = await getAnonymousSessionUserId();
  if (!anonymousUserId || anonymousUserId === accountUserId) return 0;

  return prisma.$transaction((db) =>
    transferUserOwnership(db, anonymousUserId, accountUserId),
  );
}

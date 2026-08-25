import type { Prisma, User } from "@/generated/prisma/client";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

export type AnonymityFields = Pick<User, "email" | "passwordHash">;

/**
 * Trước đây luồng tạo thiệp mint được User row không có credential nào, nên
 * đường duy nhất trở lại account đó là session cookie — sống 7 ngày và không
 * bao giờ được gia hạn. Lối tạo đó đã bị chặn (mọi flow tạo thiệp giờ đòi
 * account thật), nhưng các row cũ trên prod vẫn còn: một row như vậy có thể
 * được nhận về bởi account mà khách đăng nhập; row đã có email hoặc password là
 * của một người cụ thể và không bao giờ được chạm vào.
 */
export function isAnonymousUser(user: AnonymityFields | null | undefined): boolean {
  if (!user) return false;
  return user.email === null && user.passwordHash === null;
}

async function loadSessionUser(): Promise<{
  userId: string;
  user: AnonymityFields | null;
} | null> {
  const session = await getSession();
  if (!session) return null;

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { email: true, passwordHash: true },
  });
  return { userId: session.userId, user };
}

/**
 * The id of the current session's user when that user is anonymous, so callers
 * can turn it into a real account instead of stranding its invitations.
 */
export async function getAnonymousSessionUserId(): Promise<string | null> {
  const loaded = await loadSessionUser();
  if (!loaded) return null;
  return isAnonymousUser(loaded.user) ? loaded.userId : null;
}

/**
 * The id of the current session's user when that user is a real account — a row
 * carrying an email or a password, so the visitor can prove who they are
 * without the cookie. Null for an anonymous row and for a cookie pointing at a
 * user that no longer exists; neither can be contacted or recovered.
 */
export async function getAccountSessionUserId(): Promise<string | null> {
  const loaded = await loadSessionUser();
  if (!loaded?.user || isAnonymousUser(loaded.user)) return null;
  return loaded.userId;
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

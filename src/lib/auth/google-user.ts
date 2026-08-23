import type { PrismaClient, User } from "@/generated/prisma/client";

import {
  adoptAnonymousSession,
  getAnonymousSessionUserId,
} from "@/lib/auth/anonymous-account";

type UserClient = Pick<PrismaClient["user"], "findUnique" | "create" | "update">;

/**
 * Resolves the account behind an OAuth email, folding in whatever the current
 * anonymous session owns: returning visitors get their drafts moved onto the
 * existing account, first-timers get their cookie-only row upgraded in place.
 * Without this a visitor who paid before logging in keeps two accounts, and the
 * paid invitation stays on the one nobody can sign back into.
 */
export async function findOrCreateOAuthUser(userClient: UserClient, email: string): Promise<User> {
  const existing = await userClient.findUnique({ where: { email } });
  if (existing) {
    await adoptAnonymousSession(existing.id);
    return existing;
  }

  const anonymousUserId = await getAnonymousSessionUserId();
  if (anonymousUserId) {
    return userClient.update({
      where: { id: anonymousUserId },
      data: { email },
    });
  }

  return userClient.create({
    data: {
      email,
      passwordHash: null,
    },
  });
}

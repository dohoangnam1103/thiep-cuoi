import type { PrismaClient, User } from "@/generated/prisma/client";

type UserClient = Pick<PrismaClient["user"], "findUnique" | "create">;

export async function findOrCreateGoogleUser(userClient: UserClient, email: string): Promise<User> {
  const existing = await userClient.findUnique({ where: { email } });
  if (existing) return existing;

  return userClient.create({
    data: {
      email,
      passwordHash: null,
    },
  });
}

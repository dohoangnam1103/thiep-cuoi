import { getCurrentUserId } from "@/lib/dal";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const userId = await getCurrentUserId();
  if (!userId) {
    return Response.json({ loggedIn: false, firstInvitationId: null, invitationCount: 0, email: null });
  }

  const [invitation, invitationCount, user] = await Promise.all([
    prisma.invitation.findFirst({
      where: { userId },
      orderBy: { createdAt: "desc" },
      select: { id: true },
    }),
    prisma.invitation.count({ where: { userId } }),
    prisma.user.findUnique({ where: { id: userId }, select: { email: true } }),
  ]);

  return Response.json({
    loggedIn: true,
    firstInvitationId: invitation?.id ?? null,
    invitationCount,
    email: user?.email ?? null,
  });
}

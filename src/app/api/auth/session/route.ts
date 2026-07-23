import { getCurrentUserId } from "@/lib/dal";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const userId = await getCurrentUserId();
  if (!userId) {
    return Response.json({ loggedIn: false, firstInvitationId: null, email: null });
  }

  const [invitation, user] = await Promise.all([
    prisma.invitation.findFirst({
      where: { userId },
      orderBy: { createdAt: "desc" },
      select: { id: true },
    }),
    prisma.user.findUnique({ where: { id: userId }, select: { email: true } }),
  ]);

  return Response.json({
    loggedIn: true,
    firstInvitationId: invitation?.id ?? null,
    email: user?.email ?? null,
  });
}

import { getCurrentUserId } from "@/lib/dal";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const userId = await getCurrentUserId();
  if (!userId) {
    return Response.json({ loggedIn: false, firstInvitationId: null });
  }

  const invitation = await prisma.invitation.findFirst({
    where: { userId },
    orderBy: { createdAt: "desc" },
    select: { id: true },
  });

  return Response.json({ loggedIn: true, firstInvitationId: invitation?.id ?? null });
}

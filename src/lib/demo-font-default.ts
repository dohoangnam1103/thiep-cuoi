import type { Prisma } from "@/generated/prisma/client";

/** Copy the demo's current font into a new invitation; never resolve it live. */
export async function getDemoFontFamily(
  db: Pick<Prisma.TransactionClient, "invitation">,
  templateId: string,
): Promise<string> {
  const demo = await db.invitation.findFirst({
    where: { templateId, isDemo: true },
    select: { content: { select: { fontFamily: true } } },
  });
  return demo?.content?.fontFamily ?? "";
}

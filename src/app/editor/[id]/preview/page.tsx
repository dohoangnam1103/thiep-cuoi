import { notFound } from "next/navigation";

import { ChungDoiDemo } from "@/components/chungdoi-demo";
import { templates } from "@/data/chungdoi";
import { verifySession, ownInvitation } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { toDemoContent } from "@/lib/to-demo-content";

export default async function EditorPreviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { userId } = await verifySession();
  const owned = await ownInvitation(id, userId);
  if (!owned) notFound();

  const invitation = await prisma.invitation.findUnique({
    where: { id },
    include: { content: true, ceremonies: true, schedule: true, gallery: true, wishes: true },
  });
  if (!invitation) notFound();

  const template = templates.find((t) => t.slug === invitation.templateId) ?? templates[0];
  const content = toDemoContent(invitation);

  return <ChungDoiDemo template={template} content={content} />;
}

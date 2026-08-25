import { notFound } from "next/navigation";

import { ChungDoiDemo } from "@/components/chungdoi-demo";
import { templates } from "@/data/chungdoi";
import { getCover3dEnabled } from "@/lib/cover-3d-config";
import { verifyAccountSession, ownInvitation } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { toDemoContent } from "@/lib/to-demo-content";

export default async function EditorPreviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { userId } = await verifyAccountSession(`/editor/${id}/preview`, "create");
  const owned = await ownInvitation(id, userId);
  if (!owned) notFound();

  const invitation = await prisma.invitation.findUnique({
    where: { id },
    include: { content: true, ceremonies: true, schedule: true, gallery: true, wishes: true },
  });
  if (!invitation) notFound();

  const template = templates.find((t) => t.slug === invitation.templateId) ?? templates[0];
  const content = toDemoContent(invitation);
  const cover3dEnabled = await getCover3dEnabled();

  return (
    <ChungDoiDemo template={template} content={content} cover3dEnabled={cover3dEnabled} />
  );
}

import { notFound } from "next/navigation";

import { verifySession, ownInvitation } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { EditorForm } from "./EditorForm";

export default async function EditorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { userId } = await verifySession();
  const invitation = await ownInvitation(id, userId);
  if (!invitation) notFound();

  const [content, schedule, gallery] = await Promise.all([
    prisma.invitationContent.findUnique({ where: { invitationId: id } }),
    prisma.scheduleItem.findMany({ where: { invitationId: id }, orderBy: { sortOrder: "asc" } }),
    prisma.galleryPhoto.findMany({ where: { invitationId: id }, orderBy: { sortOrder: "asc" } }),
  ]);

  return (
    <EditorForm
      invitationId={id}
      status={invitation.status}
      paid={invitation.paid}
      currentSlug={invitation.slug}
      templateId={invitation.templateId}
      content={content}
      schedule={schedule.map((s) => ({ time: s.time, label: s.label }))}
      gallery={gallery.map((g) => g.url)}
    />
  );
}

import { hasLocale } from "next-intl";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";

import { routing } from "@/i18n/routing";
import { verifySession, ownInvitation } from "@/lib/dal";
import { getEditorDraftMessages } from "@/lib/editor-draft-messages";
import { getMusicPickerMessages } from "@/lib/music-picker-messages";
import { prisma } from "@/lib/prisma";
import { EditorForm } from "./EditorForm";

export default async function EditorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { userId } = await verifySession();
  const invitation = await ownInvitation(id, userId);
  if (!invitation) notFound();

  const requestedLocale = (await cookies()).get("NEXT_LOCALE")?.value;
  const locale = hasLocale(routing.locales, requestedLocale)
    ? requestedLocale
    : routing.defaultLocale;
  const [content, schedule, gallery, musicMessages, draftMessages] = await Promise.all([
    prisma.invitationContent.findUnique({ where: { invitationId: id } }),
    prisma.scheduleItem.findMany({ where: { invitationId: id }, orderBy: { sortOrder: "asc" } }),
    prisma.galleryPhoto.findMany({ where: { invitationId: id }, orderBy: { sortOrder: "asc" } }),
    getMusicPickerMessages(locale),
    getEditorDraftMessages(locale),
  ]);
  const initialTrack = content?.music
    ? await prisma.track.findFirst({
        where: { url: content.music },
        select: { url: true, title: true, artist: true },
      })
    : null;

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
      locale={locale}
      musicMessages={musicMessages}
      draftMessages={draftMessages}
      initialTrack={initialTrack}
    />
  );
}

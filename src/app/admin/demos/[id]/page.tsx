import Link from "next/link";
import { NextIntlClientProvider } from "next-intl";
import { notFound } from "next/navigation";

import viMessages from "../../../../../messages/vi.json";
import { verifyAdmin } from "@/lib/admin-dal";
import { getInvitationActivation } from "@/lib/invitation-entitlement";
import { getMusicPickerMessages } from "@/lib/music-picker-messages";
import { prisma } from "@/lib/prisma";
import { getTemplateLabels } from "@/lib/template-labels";
import { EditorForm } from "@/app/editor/[id]/EditorForm";
import { saveDemo } from "../actions";

export default async function AdminDemoEditPage({ params }: { params: Promise<{ id: string }> }) {
  await verifyAdmin();
  const { id } = await params;

  const [musicMessages, templateLabels] = await Promise.all([
    getMusicPickerMessages("vi"),
    getTemplateLabels(),
  ]);
  const invitation = await prisma.invitation.findFirst({
    where: { id, isDemo: true },
    include: {
      content: true,
      ceremonies: { orderBy: { sortOrder: "asc" } },
      schedule: { orderBy: { sortOrder: "asc" } },
      gallery: { orderBy: { sortOrder: "asc" } },
    },
  });
  if (!invitation) notFound();
  const initialTrack = invitation.content?.music
    ? await prisma.track.findFirst({
        where: { url: invitation.content.music },
        select: { url: true, title: true, artist: true },
      })
    : null;

  return (
    <div className="space-y-4">
      <Link href="/admin/demos" className="text-sm text-primary hover:underline">
        ← Danh sách thiệp demo
      </Link>
      <NextIntlClientProvider locale="vi" messages={{ editor: viMessages.editor }}>
        <EditorForm
          mode="demo-admin"
          saveAction={saveDemo}
          invitationId={invitation.id}
          status={invitation.status}
          activation={getInvitationActivation(invitation)}
          currentSlug={invitation.slug}
          templateId={invitation.templateId}
          content={invitation.content}
          ceremonies={invitation.ceremonies.map((ceremony) => ({
            title: ceremony.title,
            date: ceremony.date,
            time: ceremony.time,
          }))}
          schedule={invitation.schedule.map((s) => ({ time: s.time, label: s.label }))}
          gallery={invitation.gallery.map((g) => g.url)}
          locale="vi"
          musicMessages={musicMessages}
          initialTrack={initialTrack}
          templateLabels={templateLabels}
        />
      </NextIntlClientProvider>
    </div>
  );
}

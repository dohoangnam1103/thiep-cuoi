import { NextIntlClientProvider } from "next-intl";
import { notFound } from "next/navigation";

import viMessages from "../../../../../../messages/vi.json";
import { verifyAdmin } from "@/lib/admin-dal";
import { getInvitationActivation } from "@/lib/invitation-entitlement";
import { getMusicPickerMessages } from "@/lib/music-picker-messages";
import { prisma } from "@/lib/prisma";
import { getTemplateLabels } from "@/lib/template-labels";
import { EditorForm } from "@/app/editor/[id]/EditorForm";
import {
  checkSupportedInvitationSlug,
  publishSupportedInvitation,
  resolveSupportedGoogleMapsLink,
  saveSupportedInvitation,
} from "./actions";

export default async function AdminInvitationSupportEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await verifyAdmin();
  const { id } = await params;

  const [musicMessages, templateLabels] = await Promise.all([
    getMusicPickerMessages("vi"),
    getTemplateLabels(),
  ]);
  const invitation = await prisma.invitation.findFirst({
    where: { id, isDemo: false },
    include: {
      user: { select: { id: true, email: true } },
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
    <NextIntlClientProvider
      locale="vi"
      messages={{
        editor: viMessages.editor,
        gatefoldLab: viMessages.gatefoldLab,
        sleeveLab: viMessages.sleeveLab,
        doraemonDoorLab: viMessages.doraemonDoorLab,
        doraemonDoor: viMessages.doraemonDoor,
        invitationControls: viMessages.invitationControls,
        detectiveConanCasebookLab: viMessages.detectiveConanCasebookLab,
        detectiveConanCasebook: viMessages.detectiveConanCasebook,
        invitationTemplate: viMessages.invitationTemplate,
        comicHero: viMessages.comicHero,
        flowDemoLab: viMessages.flowDemoLab,
        listing: viMessages.listing,
        templatePreviewModal: viMessages.templatePreviewModal,
        trialCountdown: viMessages.trialCountdown,
        home: viMessages.home,
        chrome: viMessages.chrome,
      }}
    >
      <EditorForm
        mode="support-admin"
        supportContext={{ userId: invitation.user.id, email: invitation.user.email ?? "—" }}
        saveAction={saveSupportedInvitation}
        publishAction={publishSupportedInvitation}
        checkSlugAction={checkSupportedInvitationSlug}
        resolveMapAction={resolveSupportedGoogleMapsLink}
        activation={getInvitationActivation(invitation)}
        invitationId={invitation.id}
        status={invitation.status}
        publishedAt={invitation.publishedAt?.toISOString() ?? null}
        currentSlug={invitation.slug}
        templateId={invitation.templateId}
        content={invitation.content}
        ceremonies={invitation.ceremonies.map((item) => ({
          title: item.title,
          date: item.date,
          time: item.time,
        }))}
        schedule={invitation.schedule.map((item) => ({
          time: item.time,
          label: item.label,
        }))}
        gallery={invitation.gallery.map((item) => item.url)}
        locale="vi"
        musicMessages={musicMessages}
        initialTrack={initialTrack}
        templateLabels={templateLabels}
      />
    </NextIntlClientProvider>
  );
}

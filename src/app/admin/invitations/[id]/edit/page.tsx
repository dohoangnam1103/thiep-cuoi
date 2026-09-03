import { NextIntlClientProvider } from "next-intl";
import { editorMessageNamespaces, selectMessages } from "@/i18n/message-scopes";
import { notFound } from "next/navigation";

import viMessages from "../../../../../../messages/vi.json";
import { verifyAdmin } from "@/lib/admin-dal";
import { getCover3dEnabled } from "@/lib/cover-3d-config";
import { getInvitationActivation } from "@/lib/invitation-entitlement";
import { getMusicPickerMessages } from "@/lib/music-picker-messages";
import { prisma } from "@/lib/prisma";
import { getTemplateLabels } from "@/lib/template-labels";
import { getTemplateMobileThumbnailOverrides } from "@/lib/template-mobile-thumbnails";
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

  const [musicMessages, templateLabels, mobileThumbnailOverrides, cover3dEnabled] = await Promise.all([
    getMusicPickerMessages("vi"),
    getTemplateLabels(),
    getTemplateMobileThumbnailOverrides(),
    getCover3dEnabled(),
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
      messages={selectMessages(viMessages, editorMessageNamespaces)}
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
        mobileThumbnailOverrides={mobileThumbnailOverrides}
        cover3dEnabled={cover3dEnabled}
      />
    </NextIntlClientProvider>
  );
}

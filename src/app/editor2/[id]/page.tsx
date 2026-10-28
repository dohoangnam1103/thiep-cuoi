import { notFound } from "next/navigation";
import { Editor2Workspace } from "@/components/editor2/workspace";
import { ownInvitation } from "@/lib/dal";
import { getSession } from "@/lib/session";
import { getAccountSessionUserId } from "@/lib/auth/anonymous-account";
import { editor2SampleAlbumPhotos, editor2SampleHeroPhotos, editor2Seed } from "@/lib/editor2-draft";
import { prisma } from "@/lib/prisma";
import { getTemplateLabels } from "@/lib/template-labels";
import { toDemoContent } from "@/lib/to-demo-content";
import { getCover3dEnabled } from "@/lib/cover-3d-config";
import { isInvitationActivated } from "@/lib/invitation-entitlement";
import { chungdoiDemoContent } from "@/data/chungdoi-demo-content";

export default async function Editor2Page({ params, searchParams }: {
  params: Promise<{ id: string }>; searchParams: Promise<{ publish?: string }>;
}) {
  const { id } = await params;
  const session = await getSession();
  if (!session || !await ownInvitation(id, session.userId)) notFound();
  const [invitation, labels, accountUserId, query, cover3dEnabled] = await Promise.all([
    prisma.invitation.findUnique({ where: { id }, include: {
      content: true, ceremonies: true, schedule: true, gallery: true,
    } }),
    getTemplateLabels(), getAccountSessionUserId(), searchParams, getCover3dEnabled(),
  ]);
  if (!invitation) notFound();
  const base = toDemoContent({ ...invitation, wishes: [] });
  const hideBranding = isInvitationActivated(invitation);
  const samples = Object.fromEntries(Object.entries(chungdoiDemoContent).map(([slug, sample]) => [slug, {
    heroPhotos: editor2SampleHeroPhotos(sample),
    gallery: editor2SampleAlbumPhotos(sample),
  }]));
  return <Editor2Workspace id={id} initial={editor2Seed(invitation.templateId, invitation.content, base)}
    labels={labels} currentSlug={invitation.slug} status={invitation.status} base={base} samples={samples} cover3dEnabled={cover3dEnabled} hideBranding={hideBranding}
    isAccount={Boolean(accountUserId)} resumePublication={Boolean(accountUserId) && query.publish === "1"} />;
}

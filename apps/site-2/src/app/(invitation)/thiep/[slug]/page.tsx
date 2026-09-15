import { notFound } from "next/navigation";

import { getPublishedBySlug } from "../../../../lib/dal";
import { getTemplateMeta } from "../../../../lib/catalog";
import { Site2InvitationView } from "../../../../components/invitation/site2-invitation-view";

export default async function Site2PublicInvitation({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ guest?: string }>;
}) {
  const { slug } = await params;
  const { guest } = await searchParams;
  const content = await getPublishedBySlug(slug);
  if (!content) {
    notFound();
  }
  const template = getTemplateMeta(content.slug);
  if (!template) {
    notFound();
  }
  return (
    <Site2InvitationView
      template={template}
      content={content}
      slug={slug}
      guestToken={guest}
    />
  );
}

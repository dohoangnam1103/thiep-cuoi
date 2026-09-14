import { notFound } from "next/navigation";

import { getPublishedBySlug } from "../../../lib/dal";
import { getTemplateMeta } from "../../../lib/catalog";
import SignatureDemoView from "../../mau-thiep/[slug]/demo/demo-view";

export default async function Site2PublicInvitation({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const content = await getPublishedBySlug(slug);
  if (!content) {
    notFound();
  }
  const template = getTemplateMeta(content.slug);
  if (!template) {
    notFound();
  }
  return <SignatureDemoView template={template} content={content} />;
}

import { notFound } from "next/navigation";

import { getPublishedBySlug } from "../../../lib/dal";
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
  return <SignatureDemoView slug={content.slug} content={content} />;
}

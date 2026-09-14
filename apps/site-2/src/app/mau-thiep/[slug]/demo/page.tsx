import Link from "next/link";
import { notFound } from "next/navigation";

import { getDemoContent, getTemplateMeta, resolveCatalogSlug } from "../../../../lib/catalog";
import vi from "@messages/vi.json";
import SignatureDemoView from "./demo-view";

export default async function SignatureDemoPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug: raw } = await params;
  const slug = resolveCatalogSlug(raw);
  if (!slug) {
    notFound();
  }
  const template = getTemplateMeta(slug);
  if (!template) {
    notFound();
  }
  const content = await getDemoContent(slug);
  return (
    <div>
      <div className="mx-auto max-w-4xl px-4 pt-6">
        <Link href="/mau-thiep" className="text-sm font-semibold underline">
          {vi.demo.backToListing}
        </Link>
      </div>
      <SignatureDemoView template={template} content={content} />
    </div>
  );
}

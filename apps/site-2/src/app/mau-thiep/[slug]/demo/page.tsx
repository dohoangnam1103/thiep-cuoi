import Link from "next/link";
import { notFound } from "next/navigation";
import { isTemplateAvailable } from "@chungdoi/invitation-data";
import { SIGNATURE_TEMPLATE_SLUGS } from "@chungdoi/invitation-data";

import { getSignatureDemo } from "../../../../data/signature-demos";
import vi from "@messages/vi.json";
import SignatureDemoView from "./demo-view";

type SignatureSlug = (typeof SIGNATURE_TEMPLATE_SLUGS)[number];

export default async function SignatureDemoPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  if (!isTemplateAvailable("site-2", slug)) {
    notFound();
  }
  const content = getSignatureDemo(slug);
  if (!content) {
    notFound();
  }
  return (
    <div>
      <div className="mx-auto max-w-4xl px-4 pt-6">
        <Link href="/mau-thiep" className="text-sm font-semibold underline">
          {vi.demo.backToListing}
        </Link>
      </div>
      <SignatureDemoView slug={slug as SignatureSlug} content={content} />
    </div>
  );
}

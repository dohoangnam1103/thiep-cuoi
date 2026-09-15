import Link from "next/link";
import { notFound } from "next/navigation";

import { getDemoContent, getTemplateMeta, resolveCatalogSlug } from "../../../../../lib/catalog";
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
      <div className="sticky top-16 z-40 border-b border-[var(--s2-line)] bg-[var(--s2-canvas)]/95 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-3 px-4 sm:px-6">
          <Link
            href="/mau-thiep"
            className="text-[14px] font-semibold text-[var(--s2-muted)] transition-colors hover:text-[var(--s2-ink)]"
          >
            ← {vi.demo.backToListing}
          </Link>
          <p className="hidden truncate text-[14px] font-bold sm:block">
            {template.name}
          </p>
          <Link
            href="/dang-nhap?mode=register"
            className="shrink-0 rounded-full bg-[var(--s2-accent)] px-5 py-2 text-[14px] font-semibold text-[var(--s2-accent-ink)] transition-transform active:scale-[0.98]"
          >
            {vi.demo.useCta}
          </Link>
        </div>
      </div>
      <SignatureDemoView template={template} content={content} />
    </div>
  );
}

import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { getOwnedInvitation, getOwnedRenderContent } from "../../../../lib/dal";
import { getSite2Session } from "../../../../lib/session";
import { getTemplateMeta, toListingItem } from "../../../../lib/catalog";
import { EditorPreviewSheet } from "../../../../components/workspace/editor-preview-sheet";
import { EditorSectionNav } from "../../../../components/workspace/editor-section-nav";
import vi from "@messages/vi.json";
import Site2EditorForm from "./editor-form";
import { EditorPreview } from "./editor-preview";

export default async function Site2EditorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getSite2Session();
  const { id } = await params;
  if (!session) {
    redirect(`/dang-nhap?next=/editor/${id}`);
  }
  const invitation = await getOwnedInvitation(id, session.userId);
  if (!invitation) {
    notFound();
  }
  const templateMeta = getTemplateMeta(invitation.templateId);
  const templateName = templateMeta
    ? toListingItem(templateMeta).name
    : invitation.templateId;
  const content = invitation.content;
  const initial = {
    brideFullName: content?.brideFullName ?? "",
    groomFullName: content?.groomFullName ?? "",
    brideShortName: content?.brideShortName ?? "",
    groomShortName: content?.groomShortName ?? "",
    date: content?.date ?? "",
    time: content?.time ?? "",
    ceremonyDate: content?.ceremonyDate ?? "",
    ceremonyTime: content?.ceremonyTime ?? "",
    ceremonyHeader: content?.ceremonyHeader ?? "",
    openingMessage: content?.openingMessage ?? "",
    brideFather: content?.brideFather ?? "",
    brideMother: content?.brideMother ?? "",
    groomFather: content?.groomFather ?? "",
    groomMother: content?.groomMother ?? "",
    address: content?.address ?? "",
    banquetTime: content?.banquetTime ?? "",
  };
  const preview = await getOwnedRenderContent(id, session.userId);
  const previewSheet = preview ? (
    <EditorPreviewSheet>
      <EditorPreview slug={invitation.templateId} content={preview} />
    </EditorPreviewSheet>
  ) : undefined;

  return (
    <div className="mx-auto w-full max-w-7xl px-4 pb-20 pt-6 sm:px-6 md:pt-10">
      <Link
        href="/dashboard"
        className="text-[14px] font-semibold text-[var(--s2-muted)] transition-colors hover:text-[var(--s2-ink)]"
      >
        ← {vi.editor.backToDashboard}
      </Link>
      <h1 className="s2-display mt-3 text-3xl font-semibold tracking-tight text-[var(--s2-ink)] md:text-5xl">
        {vi.editor.title}: {templateName}
      </h1>
      <div className="mt-8 grid items-start gap-8 xl:grid-cols-[220px_minmax(0,1fr)_380px]">
        <EditorSectionNav />
        <div className="min-w-0">
          <Site2EditorForm
            invitationId={invitation.id}
            initial={initial}
            publicSlug={invitation.slug}
            previewAction={previewSheet}
          />
        </div>
        <aside className="hidden min-w-0 xl:block">
          <div className="sticky top-24">
            <h2 className="mb-3 text-[15px] font-extrabold text-[var(--s2-ink)]">
              {vi.editor.previewTitle}
            </h2>
            {preview ? (
              <EditorPreview slug={invitation.templateId} content={preview} />
            ) : (
              <p className="text-[14px] text-[var(--s2-muted)]">
                {vi.editor.notFound}
              </p>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}

import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { getOwnedInvitation, getOwnedRenderContent } from "../../../lib/dal";
import { getSite2Session } from "../../../lib/session";
import vi from "@messages/vi.json";
import Site2EditorForm from "./editor-form";
import { EditorPreview } from "./editor-preview";

export default async function Site2EditorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getSite2Session();
  if (!session) {
    redirect("/dang-nhap");
  }
  const { id } = await params;
  const invitation = await getOwnedInvitation(id, session.userId);
  if (!invitation) {
    notFound();
  }
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

  return (
    <div className="mx-auto max-w-7xl px-4 pb-20 pt-10 sm:px-6 md:pt-14">
      <Link
        href="/dashboard"
        className="text-[14px] font-semibold text-[var(--muted)] transition-colors hover:text-[var(--ink)]"
      >
        ← {vi.editor.backToDashboard}
      </Link>
      <h1 className="mt-3 text-2xl font-extrabold tracking-tight md:text-4xl">
        {vi.editor.title} — {invitation.templateId}
      </h1>
      <div className="mt-8 grid items-start gap-8 xl:grid-cols-[1fr_420px]">
        <Site2EditorForm
          invitationId={invitation.id}
          initial={initial}
          publicSlug={invitation.slug}
        />
        <aside className="xl:sticky xl:top-24">
          <h2 className="mb-3 text-[15px] font-extrabold">
            {vi.editor.previewTitle}
          </h2>
          {preview ? (
            <EditorPreview slug={invitation.templateId} content={preview} />
          ) : (
            <p className="text-[14px] text-[var(--muted)]">
              {vi.editor.notFound}
            </p>
          )}
        </aside>
      </div>
    </div>
  );
}

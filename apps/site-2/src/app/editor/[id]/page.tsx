import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { getOwnedInvitation } from "../../../lib/dal";
import { getSite2Session } from "../../../lib/session";
import vi from "@messages/vi.json";
import Site2EditorForm from "./editor-form";

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

  return (
    <div className="mx-auto max-w-4xl px-4 pb-16 pt-12">
      <Link href="/dashboard" className="text-sm font-semibold underline">
        {vi.editor.backToDashboard}
      </Link>
      <h1 className="mt-4 text-2xl font-bold">
        {vi.editor.title} — {invitation.templateId}
      </h1>
      <div className="mt-8">
        <Site2EditorForm
          invitationId={invitation.id}
          initial={initial}
          publicSlug={invitation.slug}
        />
      </div>
    </div>
  );
}

import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { getTemplateMeta } from "../../../../../lib/catalog";
import { getOwnedInvitation } from "../../../../../lib/dal";
import { getSite2Session } from "../../../../../lib/session";
import { GuestList } from "../../../../../features/guests/guest-list";
import { listGuests } from "../../../../../features/guests/dal";
import vi from "@messages/vi.json";

export default async function Site2GuestManager({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getSite2Session();
  const { id } = await params;
  if (!session) {
    redirect(`/dang-nhap?next=/dashboard/${id}/khach-moi`);
  }
  const invitation = await getOwnedInvitation(id, session.userId);
  if (!invitation) {
    notFound();
  }
  const guests = await listGuests(session.userId, invitation.id);
  const templateName =
    getTemplateMeta(invitation.templateId)?.name ?? invitation.templateId;

  return (
    <div className="mx-auto w-full max-w-5xl px-4 pb-20 pt-6 sm:px-6 md:pt-10">
      <Link
        href="/dashboard"
        className="text-[14px] font-semibold text-[var(--s2-muted)] transition-colors hover:text-[var(--s2-ink)]"
      >
        ← {vi.editor.backToDashboard}
      </Link>
      <h1 className="mt-3 text-2xl font-extrabold tracking-tight text-[var(--s2-ink)] md:text-4xl">
        {vi.guests.title}
      </h1>
      <p className="mt-2 text-[15px] text-[var(--s2-muted)]">
        {templateName}
        {invitation.status !== "published" ? ` · ${vi.guests.unpublishedHint}` : null}
      </p>
      <div className="mt-8">
        <GuestList invitationId={invitation.id} initialGuests={guests} />
      </div>
    </div>
  );
}

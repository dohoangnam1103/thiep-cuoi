import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { getOwnedInvitation } from "../../../../../lib/dal";
import { getSite2Session } from "../../../../../lib/session";
import { getTemplateMeta } from "../../../../../lib/catalog";
import { getRsvpSummary } from "../../../../../features/rsvp/dal";
import { RsvpList } from "../../../../../features/rsvp/rsvp-list";
import { RsvpSummary } from "../../../../../features/rsvp/rsvp-summary";
import { PageState } from "../../../../../components/states/page-state";
import vi from "@messages/vi.json";

export default async function Site2RsvpOverview({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getSite2Session();
  const { id } = await params;
  if (!session) {
    redirect(`/dang-nhap?next=/dashboard/${id}/rsvp`);
  }
  const invitation = await getOwnedInvitation(id, session.userId);
  if (!invitation) {
    notFound();
  }
  const summary = await getRsvpSummary(session.userId, invitation.id);
  const templateName =
    getTemplateMeta(invitation.templateId)?.name ?? invitation.templateId;
  const hasData =
    summary.responses.length > 0 ||
    summary.attendingGuests + summary.declinedGuests + summary.pendingGuests >
      0;

  return (
    <div className="mx-auto w-full max-w-5xl px-4 pb-20 pt-6 sm:px-6 md:pt-10">
      <Link
        href="/dashboard"
        className="text-[14px] font-semibold text-[var(--s2-muted)] transition-colors hover:text-[var(--s2-ink)]"
      >
        ← {vi.editor.backToDashboard}
      </Link>
      <h1 className="mt-3 text-2xl font-extrabold tracking-tight text-[var(--s2-ink)] md:text-4xl">
        {vi.rsvp.title}
      </h1>
      <p className="mt-2 text-[15px] text-[var(--s2-muted)]">{templateName}</p>
      <div className="mt-8">
        {!hasData ? (
          <PageState
            kind="empty"
            title={vi.rsvp.emptyTitle}
            description={vi.rsvp.emptyBody}
            action={
              <Link
                href={`/dashboard/${invitation.id}/khach-moi`}
                className="inline-block rounded-full bg-[var(--s2-accent)] px-7 py-3 text-[15px] font-semibold text-[var(--s2-accent-ink)] transition-transform active:scale-[0.98]"
              >
                {vi.guests.manageCta}
              </Link>
            }
          />
        ) : (
          <>
            <RsvpSummary summary={summary} />
            <RsvpList responses={summary.responses} />
          </>
        )}
      </div>
    </div>
  );
}

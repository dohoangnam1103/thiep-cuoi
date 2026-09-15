import Link from "next/link";

import type { DashboardInvitation } from "../../lib/dal";
import { S2Status } from "../ui/status";
import vi from "@messages/vi.json";

const STATUS_LABEL: Record<DashboardInvitation["status"], string> = {
  draft: vi.dashboard.statusDraft,
  published: vi.dashboard.statusPublished,
  unknown: vi.dashboard.statusUnknown,
};

const updatedFormatter = new Intl.DateTimeFormat("vi-VN", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

/* One invitation project. The editor link is the primary action; published
 * invitations add one inline secondary action. Guest, RSVP and payment
 * actions will join a compact menu here in later tasks. */
export function InvitationProjectCard({
  invitation,
  templateName,
  featured = false,
}: {
  invitation: DashboardInvitation;
  templateName: string;
  featured?: boolean;
}) {
  const heading = invitation.coupleLabel || templateName;
  return (
    <article
      data-testid="invitation-card"
      className={`s2-workspace-card p-6 ${featured ? "sm:p-8" : ""}`}
    >
      {featured ? (
        <p className="text-[13px] font-bold uppercase tracking-[0.12em] text-[var(--s2-accent)]">
          {vi.dashboard.recentHeading}
        </p>
      ) : null}
      <div className="mt-2 flex flex-wrap items-center gap-3">
        <S2Status kind={invitation.status} label={STATUS_LABEL[invitation.status]} />
        <p className="text-[13px] text-[var(--s2-muted)]">
          {vi.dashboard.updatedAt}{" "}
          <time dateTime={invitation.updatedAt.toISOString()}>
            {updatedFormatter.format(invitation.updatedAt)}
          </time>
        </p>
      </div>
      <h2
        className={`mt-3 font-extrabold tracking-tight text-[var(--s2-ink)] ${featured ? "text-2xl md:text-3xl" : "text-lg"}`}
      >
        {heading}
      </h2>
      {invitation.coupleLabel ? (
        <p className="mt-1 text-[14px] text-[var(--s2-muted)]">{templateName}</p>
      ) : null}
      <div className="mt-5 flex flex-wrap items-center gap-3">
        <Link
          href={`/editor/${invitation.id}`}
          className="rounded-full bg-[var(--s2-accent)] px-6 py-2.5 text-[14px] font-semibold text-[var(--s2-accent-ink)] transition-transform active:scale-[0.98]"
        >
          {vi.dashboard.openEditor}
        </Link>
        {invitation.status === "published" && invitation.slug ? (
          <Link
            href={`/thiep/${invitation.slug}`}
            className="rounded-full border border-[var(--s2-line)] px-6 py-2.5 text-[14px] font-semibold text-[var(--s2-ink)] transition-colors hover:border-[var(--s2-accent)]"
          >
            {vi.dashboard.viewPublic}
          </Link>
        ) : null}
        <Link
          href={`/dashboard/${invitation.id}/khach-moi`}
          className="text-[14px] font-semibold text-[var(--s2-muted)] transition-colors hover:text-[var(--s2-ink)]"
        >
          {vi.guests.manageCta}
        </Link>
        <Link
          href={`/dashboard/${invitation.id}/rsvp`}
          className="text-[14px] font-semibold text-[var(--s2-muted)] transition-colors hover:text-[var(--s2-ink)]"
        >
          {vi.dashboard.rsvpCta}
        </Link>
        <Link
          href={`/dashboard/${invitation.id}/thanh-toan`}
          className="text-[14px] font-semibold text-[var(--s2-muted)] transition-colors hover:text-[var(--s2-ink)]"
        >
          {vi.payment.manageCta}
        </Link>
      </div>
    </article>
  );
}

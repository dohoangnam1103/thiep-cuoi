import Image from "next/image";
import Link from "next/link";

import type { DashboardInvitation } from "../../lib/dal";
import { templatePreviewUrl } from "../../lib/template-preview";
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

/* One invitation project: cover thumb, status chip and a compact action row.
 * The editor link stays the primary action; published invitations add the
 * public page alongside guest, RSVP and payment links. */
export function InvitationProjectCard({
  invitation,
  templateName,
  coverUrl,
  featured = false,
}: {
  invitation: DashboardInvitation;
  templateName: string;
  coverUrl?: string;
  featured?: boolean;
}) {
  const heading = invitation.coupleLabel || templateName;
  return (
    <article
      data-testid="invitation-card"
      className="s2-glass s2-sheen overflow-hidden"
    >
      <div className={`flex gap-5 p-5 sm:p-6 ${featured ? "sm:gap-7 sm:p-8" : ""}`}>
        {coverUrl ? (
          <span
            aria-hidden
            className={`relative hidden w-24 shrink-0 overflow-hidden rounded-[var(--s2-input-radius)] border border-[var(--s2-line)] bg-[var(--s2-accent-soft)] min-[420px]:block sm:w-28 ${featured ? "sm:w-36" : ""}`}
          >
            <Image
              src={templatePreviewUrl(coverUrl)}
              alt=""
              width={288}
              height={384}
              loading="lazy"
              decoding="async"
              sizes="144px"
              className="aspect-[3/4] h-full w-full object-cover object-top"
            />
          </span>
        ) : null}
        <div className="min-w-0 flex-1">
          {featured ? (
            <p className="text-[12px] font-bold tracking-[0.14em] text-[var(--s2-accent)] uppercase">
              {vi.dashboard.recentHeading}
            </p>
          ) : null}
          <div className="flex flex-wrap items-center gap-3">
            <S2Status
              kind={invitation.status}
              label={STATUS_LABEL[invitation.status]}
            />
            <p className="text-[13px] text-[var(--s2-muted)]">
              {vi.dashboard.updatedAt}{" "}
              <time dateTime={invitation.updatedAt.toISOString()}>
                {updatedFormatter.format(invitation.updatedAt)}
              </time>
            </p>
          </div>
          <h2
            className={`mt-2.5 truncate font-semibold tracking-tight text-[var(--s2-ink)] ${featured ? "s2-display text-2xl md:text-3xl" : "text-lg"}`}
          >
            {heading}
          </h2>
          {invitation.coupleLabel ? (
            <p className="mt-1 truncate text-[14px] text-[var(--s2-muted)]">
              {templateName}
            </p>
          ) : null}
          <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2.5">
            <Link
              href={`/editor/${invitation.id}`}
              className="rounded-full bg-[var(--s2-accent)] px-6 py-2.5 text-[14px] font-semibold text-[var(--s2-accent-ink)] transition-all duration-300 hover:bg-[color-mix(in_oklab,var(--s2-accent)_88%,#0e1a12)] active:scale-[0.98]"
            >
              {vi.dashboard.openEditor}
            </Link>
            {invitation.status === "published" && invitation.slug ? (
              <Link
                href={`/thiep/${invitation.slug}`}
                className="s2-link-underline text-[14px] font-semibold text-[var(--s2-ink)]"
              >
                {vi.dashboard.viewPublic}
              </Link>
            ) : null}
            <Link
              href={`/dashboard/${invitation.id}/khach-moi`}
              className="s2-link-underline text-[14px] font-semibold text-[var(--s2-muted)] transition-colors hover:text-[var(--s2-ink)]"
            >
              {vi.guests.manageCta}
            </Link>
            <Link
              href={`/dashboard/${invitation.id}/rsvp`}
              className="s2-link-underline text-[14px] font-semibold text-[var(--s2-muted)] transition-colors hover:text-[var(--s2-ink)]"
            >
              {vi.dashboard.rsvpCta}
            </Link>
            <Link
              href={`/dashboard/${invitation.id}/thanh-toan`}
              className="s2-link-underline text-[14px] font-semibold text-[var(--s2-muted)] transition-colors hover:text-[var(--s2-ink)]"
            >
              {vi.payment.manageCta}
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
}

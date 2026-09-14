import Link from "next/link";
import { redirect } from "next/navigation";

import { listUserInvitations } from "../../lib/dal";
import { getVisibleCatalogTemplates } from "../../lib/catalog";
import { getSite2Session } from "../../lib/session";
import { site2Logout } from "../auth-actions";
import vi from "@messages/vi.json";
import { createDashboardInvitation } from "./actions";

export default async function Site2Dashboard() {
  const session = await getSite2Session();
  if (!session) {
    redirect("/dang-nhap");
  }
  const [invitations, templates] = await Promise.all([
    listUserInvitations(session.userId),
    getVisibleCatalogTemplates(),
  ]);
  const published = invitations.filter(
    (item) => item.status === "published",
  ).length;

  return (
    <div className="mx-auto max-w-7xl px-4 pb-20 pt-10 sm:px-6 md:pt-14">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-extrabold tracking-tight md:text-4xl">
          {vi.dashboard.title}
        </h1>
        <form action={site2Logout}>
          <button
            type="submit"
            className="text-[14px] font-semibold text-[var(--muted)] transition-colors hover:text-[var(--ink)]"
          >
            {vi.dashboard.logout}
          </button>
        </form>
      </div>

      <dl className="mt-8 grid max-w-lg grid-cols-2 divide-x divide-[var(--line)] rounded-[var(--radius-card)] border border-[var(--line)] bg-white p-6">
        <div className="pr-4">
          <dt className="text-[13px] text-[var(--muted)]">
            {vi.dashboard.statTotal}
          </dt>
          <dd className="mt-1 text-3xl font-extrabold tabular-nums">
            {invitations.length}
          </dd>
        </div>
        <div className="pl-4">
          <dt className="text-[13px] text-[var(--muted)]">
            {vi.dashboard.statPublished}
          </dt>
          <dd className="mt-1 text-3xl font-extrabold tabular-nums">
            {published}
          </dd>
        </div>
      </dl>

      <section className="mt-8 rounded-[var(--radius-card)] border border-[var(--line)] bg-white p-6 sm:p-8">
        <h2 className="text-lg font-extrabold">{vi.dashboard.createTitle}</h2>
        <form
          action={createDashboardInvitation}
          className="mt-4 flex flex-col gap-3 sm:flex-row"
        >
          <select
            name="templateSlug"
            aria-label={vi.dashboard.createTitle}
            className="rounded-[var(--radius-input)] border border-[var(--line)] bg-white px-4 py-3 text-[15px] outline-none focus:border-[var(--accent)] sm:max-w-xs"
          >
            {templates.map((template) => (
              <option key={template.slug} value={template.slug}>
                {template.name}
              </option>
            ))}
          </select>
          <button
            type="submit"
            className="rounded-[var(--radius-pill)] bg-[var(--accent)] px-7 py-3 text-[15px] font-semibold text-[var(--accent-ink)] transition-transform active:scale-[0.98]"
          >
            {vi.dashboard.createCta}
          </button>
        </form>
      </section>

      {invitations.length === 0 ? (
        <p className="mt-8 text-[15px] text-[var(--muted)]">
          {vi.dashboard.empty}
        </p>
      ) : (
        <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {invitations.map((invitation) => (
            <li
              key={invitation.id}
              data-testid="invitation-card"
              className="rounded-[var(--radius-card)] border border-[var(--line)] bg-white p-6"
            >
              <p
                className={`inline-block rounded-[var(--radius-pill)] px-3 py-1 text-[12px] font-bold ${
                  invitation.status === "published"
                    ? "bg-[var(--accent)] text-[var(--accent-ink)]"
                    : "bg-[#eef0f4] text-[var(--muted)]"
                }`}
              >
                {invitation.status === "published"
                  ? vi.dashboard.statusPublished
                  : vi.dashboard.statusDraft}
              </p>
              <p className="mt-3 font-bold">{invitation.templateId}</p>
              <div className="mt-4 flex gap-4 text-[14px] font-semibold">
                <Link
                  href={`/editor/${invitation.id}`}
                  className="text-[var(--accent)]"
                >
                  {vi.dashboard.openEditor}
                </Link>
                {invitation.slug ? (
                  <Link
                    href={`/thiep/${invitation.slug}`}
                    className="text-[var(--muted)] transition-colors hover:text-[var(--ink)]"
                  >
                    {vi.dashboard.viewPublic}
                  </Link>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

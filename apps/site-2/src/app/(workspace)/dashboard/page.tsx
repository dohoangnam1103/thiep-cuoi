import { redirect } from "next/navigation";

import {
  getTemplateMeta,
  getVisibleCatalogTemplates,
  toListingItem,
} from "../../../lib/catalog";
import { listDashboardInvitations } from "../../../lib/dal";
import { getSite2Session } from "../../../lib/session";
import { DashboardActions } from "../../../components/workspace/dashboard-actions";
import { DashboardEmptyState } from "../../../components/workspace/dashboard-empty-state";
import { InvitationProjectCard } from "../../../components/workspace/invitation-project-card";
import vi from "@messages/vi.json";

export default async function Site2Dashboard() {
  const session = await getSite2Session();
  if (!session) {
    redirect("/dang-nhap?next=/dashboard");
  }
  const [invitations, templates] = await Promise.all([
    listDashboardInvitations(session.userId),
    getVisibleCatalogTemplates(),
  ]);
  const items = templates.map(toListingItem);
  const itemBySlug = new Map(items.map((item) => [item.slug, item]));
  const templateName = (templateId: string) =>
    itemBySlug.get(templateId)?.name ?? templateId;
  const coverUrl = (templateId: string) =>
    getTemplateMeta(templateId)?.listing;
  const [recent, ...rest] = invitations;
  const published = invitations.filter(
    (item) => item.status === "published",
  ).length;

  return (
    <div className="mx-auto w-full max-w-5xl px-4 pb-20 pt-6 sm:px-6 md:pt-10">
      <h1 className="s2-display text-3xl font-semibold tracking-tight text-[var(--s2-ink)] md:text-5xl">
        {vi.dashboard.title}
      </h1>

      {invitations.length === 0 ? (
        <DashboardEmptyState />
      ) : (
        <>
          {recent ? (
            <div className="mt-8">
              <InvitationProjectCard
                invitation={recent}
                templateName={templateName(recent.templateId)}
                coverUrl={coverUrl(recent.templateId)}
                featured
              />
            </div>
          ) : null}
          {rest.length > 0 ? (
            <section className="mt-6">
              <h2 className="text-lg font-semibold text-[var(--s2-ink)]">
                {vi.dashboard.allHeading}
              </h2>
              <ul className="mt-4 grid gap-4 sm:grid-cols-2">
                {rest.map((invitation) => (
                  <li key={invitation.id}>
                    <InvitationProjectCard
                      invitation={invitation}
                      templateName={templateName(invitation.templateId)}
                      coverUrl={coverUrl(invitation.templateId)}
                    />
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
          <dl className="mt-6 grid grid-cols-2 gap-4">
            <div className="s2-workspace-card px-5 py-4">
              <dt className="text-[13px] font-medium text-[var(--s2-muted)]">
                {vi.dashboard.statTotal}
              </dt>
              <dd className="s2-display mt-1 text-3xl font-semibold tabular-nums text-[var(--s2-ink)]">
                {invitations.length}
              </dd>
            </div>
            <div className="s2-workspace-card px-5 py-4">
              <dt className="text-[13px] font-medium text-[var(--s2-muted)]">
                {vi.dashboard.statPublished}
              </dt>
              <dd className="s2-display mt-1 text-3xl font-semibold tabular-nums text-[var(--s2-ink)]">
                {published}
              </dd>
            </div>
          </dl>
        </>
      )}

      <DashboardActions
        templates={items.map((item) => ({
          slug: item.slug,
          name: item.name,
        }))}
      />
    </div>
  );
}

import { redirect } from "next/navigation";

import { getTemplateMeta, getVisibleCatalogTemplates } from "../../../lib/catalog";
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
  const templateName = (templateId: string) =>
    getTemplateMeta(templateId)?.name ?? templateId;
  const [recent, ...rest] = invitations;
  const published = invitations.filter(
    (item) => item.status === "published",
  ).length;

  return (
    <div className="mx-auto w-full max-w-5xl px-4 pb-20 pt-6 sm:px-6 md:pt-10">
      <h1 className="text-2xl font-extrabold tracking-tight text-[var(--s2-ink)] md:text-4xl">
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
                featured
              />
            </div>
          ) : null}
          {rest.length > 0 ? (
            <section className="mt-8">
              <h2 className="text-lg font-extrabold text-[var(--s2-ink)]">
                {vi.dashboard.allHeading}
              </h2>
              <ul className="mt-4 grid gap-4 sm:grid-cols-2">
                {rest.map((invitation) => (
                  <li key={invitation.id}>
                    <InvitationProjectCard
                      invitation={invitation}
                      templateName={templateName(invitation.templateId)}
                    />
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
          <dl className="mt-8 flex gap-6 text-[13px] text-[var(--s2-muted)]">
            <div className="flex items-baseline gap-2">
              <dt>{vi.dashboard.statTotal}</dt>
              <dd className="text-base font-extrabold tabular-nums text-[var(--s2-ink)]">
                {invitations.length}
              </dd>
            </div>
            <div className="flex items-baseline gap-2">
              <dt>{vi.dashboard.statPublished}</dt>
              <dd className="text-base font-extrabold tabular-nums text-[var(--s2-ink)]">
                {published}
              </dd>
            </div>
          </dl>
        </>
      )}

      <DashboardActions
        templates={templates.map((template) => ({
          slug: template.slug,
          name: template.name,
        }))}
      />
    </div>
  );
}

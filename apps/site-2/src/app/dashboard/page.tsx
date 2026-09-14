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

  return (
    <div className="mx-auto max-w-4xl px-4 pb-16 pt-12">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{vi.dashboard.title}</h1>
        <form action={site2Logout}>
          <button type="submit" className="text-sm font-semibold underline">
            {vi.dashboard.logout}
          </button>
        </form>
      </div>

      <section className="mt-8 rounded-2xl border border-[#e5dcc8] bg-white/60 p-6">
        <h2 className="font-bold">{vi.dashboard.createTitle}</h2>
        <form action={createDashboardInvitation} className="mt-4 flex gap-3">
          <select
            name="templateSlug"
            aria-label={vi.dashboard.createTitle}
            className="max-w-xs rounded-lg border border-[#e5dcc8] bg-white px-3 py-2 text-sm"
          >
            {templates.map((template) => (
              <option key={template.slug} value={template.slug}>
                {template.name}
              </option>
            ))}
          </select>
          <button
            type="submit"
            className="rounded-full bg-[#9a6a42] px-6 py-2 text-sm font-semibold text-white"
          >
            {vi.dashboard.createCta}
          </button>
        </form>
      </section>

      {invitations.length === 0 ? (
        <p className="mt-8 text-sm opacity-70">{vi.dashboard.empty}</p>
      ) : (
        <ul className="mt-8 grid gap-4 md:grid-cols-2">
          {invitations.map((invitation) => (
            <li
              key={invitation.id}
              data-testid="invitation-card"
              className="rounded-2xl border border-[#e5dcc8] bg-white/60 p-6"
            >
              <p className="text-sm opacity-70">
                {invitation.status === "published"
                  ? vi.dashboard.statusPublished
                  : vi.dashboard.statusDraft}
              </p>
              <p className="mt-1 font-bold">{invitation.templateId}</p>
              <div className="mt-4 flex gap-4 text-sm font-semibold">
                <Link href={`/editor/${invitation.id}`} className="underline">
                  {vi.dashboard.openEditor}
                </Link>
                {invitation.slug ? (
                  <Link href={`/thiep/${invitation.slug}`} className="underline">
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

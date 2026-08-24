import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";

import type { Prisma } from "@/generated/prisma/client";
import { templateLabel } from "@/app/editor/[id]/templates";
import { verifyAdmin } from "@/lib/admin-dal";
import {
  activationWhere,
  invitationMatchesSearch,
  INVITATION_ACTIVATION_FILTERS,
  INVITATION_STATUS_FILTERS,
  normalizeSearch,
  parseActivationFilter,
  parseStatusFilter,
  REAL_INVITATION_WHERE,
} from "@/lib/admin-invitation-filters";
import { createVietnamDateFormatter } from "@/lib/datetime";
import {
  getInvitationActivation,
  isInvitationExpired,
} from "@/lib/invitation-entitlement";
import { prisma } from "@/lib/prisma";
import { getTemplateLabels } from "@/lib/template-labels";

export const metadata: Metadata = {
  title: "Thiệp thật | Quản trị",
  robots: { index: false, follow: false },
};

const dateFormat = createVietnamDateFormatter({
  dateStyle: "short",
  timeStyle: "short",
});

const numberFormat = new Intl.NumberFormat("vi-VN");

const inputClass =
  "rounded-lg border border-border bg-background px-3 py-1.5 text-sm text-foreground outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20";

export default async function AdminInvitationsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; activation?: string }>;
}) {
  await verifyAdmin();

  const params = await searchParams;
  const search = (params.q ?? "").trim().slice(0, 120);
  const normalizedSearch = normalizeSearch(params.q);
  const status = parseStatusFilter(params.status);
  const activation = parseActivationFilter(params.activation);

  const where: Prisma.InvitationWhereInput = {
    ...REAL_INVITATION_WHERE,
    ...(status === "all" ? {} : { status }),
    ...activationWhere(activation),
  };

  const [rows, templateLabels, t] = await Promise.all([
    prisma.invitation.findMany({
      where,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        slug: true,
        templateId: true,
        status: true,
        paid: true,
        complimentary: true,
        publishedAt: true,
        createdAt: true,
        updatedAt: true,
        viewCount: true,
        user: { select: { id: true, email: true } },
        content: { select: { groomFullName: true, brideFullName: true } },
      },
    }),
    getTemplateLabels(),
    getTranslations("adminSupport"),
  ]);

  // Both of these resist a column filter: trial expiry depends on the trial
  // window, and case-insensitive Vietnamese needs a locale-aware fold.
  const invitations = rows.filter(
    (row) =>
      invitationMatchesSearch(row, normalizedSearch) &&
      (activation !== "expired" || isInvitationExpired(row)),
  );

  const publishedCount = invitations.filter((row) => row.status === "published").length;
  const paidCount = invitations.filter((row) => row.paid).length;
  const isFiltered = Boolean(search) || status !== "all" || activation !== "all";

  const statusLabel = (value: string): string =>
    value === "published" ? t("published") : t("draft");

  const activationLabel = (row: (typeof invitations)[number]): string => {
    const state = getInvitationActivation(row);
    if (state === "trial" && isInvitationExpired(row)) return t("expired");
    return t(state);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h1 className="font-heading text-2xl text-foreground">
          {t("allInvitationsTitle", { count: invitations.length })}
        </h1>
        <p className="text-sm text-muted-foreground">
          {t("publishedCount", { count: publishedCount })} ·{" "}
          {t("paidCount", { count: paidCount })}
        </p>
      </div>

      <form method="GET" className="flex flex-wrap items-end gap-3">
        <div className="flex flex-col gap-1">
          <label htmlFor="invitation-search" className="text-xs text-muted-foreground">
            {t("invitationSearchLabel")}
          </label>
          <input
            id="invitation-search"
            name="q"
            type="search"
            defaultValue={search}
            placeholder={t("invitationSearchPlaceholder")}
            className={`w-72 ${inputClass}`}
          />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="invitation-status" className="text-xs text-muted-foreground">
            {t("status")}
          </label>
          <select id="invitation-status" name="status" defaultValue={status} className={inputClass}>
            {INVITATION_STATUS_FILTERS.map((value) => (
              <option key={value} value={value}>
                {value === "all" ? t("filterAll") : statusLabel(value)}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="invitation-activation" className="text-xs text-muted-foreground">
            {t("activation")}
          </label>
          <select
            id="invitation-activation"
            name="activation"
            defaultValue={activation}
            className={inputClass}
          >
            {INVITATION_ACTIVATION_FILTERS.map((value) => (
              <option key={value} value={value}>
                {value === "all" ? t("filterAll") : t(value)}
              </option>
            ))}
          </select>
        </div>
        <button
          type="submit"
          className="rounded-lg bg-primary px-4 py-1.5 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90"
        >
          {t("filterButton")}
        </button>
        {isFiltered ? (
          <Link
            href="/admin/invitations"
            className="rounded-lg border border-border px-3 py-1.5 text-sm text-muted-foreground transition hover:bg-secondary"
          >
            {t("clearFilters")}
          </Link>
        ) : null}
      </form>

      <div className="overflow-x-auto rounded-2xl border border-border bg-background">
        <table className="w-full text-sm">
          <thead className="border-b border-border bg-muted/40 text-left text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-medium">{t("template")}</th>
              <th className="px-4 py-3 font-medium">{t("owner")}</th>
              <th className="whitespace-nowrap px-4 py-3 font-medium">{t("status")}</th>
              <th className="whitespace-nowrap px-4 py-3 font-medium">{t("activation")}</th>
              <th className="whitespace-nowrap px-4 py-3 font-medium">{t("createdAt")}</th>
              <th className="whitespace-nowrap px-4 py-3 font-medium">{t("updatedAt")}</th>
              <th className="whitespace-nowrap px-4 py-3 text-right font-medium">
                {t("viewCount")}
              </th>
              <th className="whitespace-nowrap px-4 py-3 font-medium">{t("actions")}</th>
            </tr>
          </thead>
          <tbody>
            {invitations.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-6 text-center text-muted-foreground">
                  {isFiltered ? t("noInvitationsFound") : t("noRealInvitations")}
                </td>
              </tr>
            ) : (
              invitations.map((invitation) => {
                const groom = invitation.content?.groomFullName?.trim();
                const bride = invitation.content?.brideFullName?.trim();
                const published = invitation.status === "published";
                return (
                  <tr key={invitation.id} className="border-b border-border last:border-0">
                    <td className="px-4 py-3">
                      <Link href={`/admin/invitations/${invitation.id}/edit`} className="group block">
                        <span className="block text-xs text-muted-foreground">
                          {templateLabels[invitation.templateId] ??
                            templateLabel(invitation.templateId)}
                        </span>
                        {groom || bride ? (
                          <>
                            {groom ? (
                              <span className="block text-primary group-hover:underline">{groom}</span>
                            ) : null}
                            {bride ? (
                              <span className="block text-primary group-hover:underline">{bride}</span>
                            ) : null}
                          </>
                        ) : (
                          <span className="block text-primary group-hover:underline">
                            {t("coupleFallback", { id: invitation.id.slice(-6) })}
                          </span>
                        )}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      {invitation.user.email ? (
                        <Link
                          href={`/admin/users/${invitation.user.id}`}
                          className="text-primary hover:underline"
                        >
                          {invitation.user.email}
                        </Link>
                      ) : (
                        <span className="whitespace-nowrap rounded-full bg-amber-500/15 px-2 py-0.5 text-xs font-medium text-amber-700">
                          {t("noEmailBadge")}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={
                          published
                            ? "whitespace-nowrap rounded-full bg-emerald-500/15 px-2 py-0.5 text-xs font-medium text-emerald-700"
                            : "whitespace-nowrap rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground"
                        }
                      >
                        {statusLabel(invitation.status)}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">
                      {activationLabel(invitation)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">
                      {dateFormat.format(invitation.createdAt)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">
                      {dateFormat.format(invitation.updatedAt)}
                    </td>
                    <td
                      className="whitespace-nowrap px-4 py-3 text-right tabular-nums text-foreground"
                      title={t("viewCountHint")}
                    >
                      {numberFormat.format(invitation.viewCount)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      {published && invitation.slug ? (
                        <Link
                          href={`/thiep/${invitation.slug}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-primary hover:underline"
                        >
                          {t("view")}
                        </Link>
                      ) : (
                        <Link
                          href={`/editor/${invitation.id}/preview`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-primary hover:underline"
                        >
                          {t("preview")}
                        </Link>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

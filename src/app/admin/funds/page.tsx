import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";

import type { Prisma } from "@/generated/prisma/client";
import { AdminPagination, AdminPerPageField } from "@/components/admin-pagination";
import { AdminTableScroller } from "@/components/admin-table-scroller";
import { verifySuperAdmin } from "@/lib/admin-dal";
import { getProjectFundSummary } from "@/lib/admin-funds";
import { adminPageWindow, adminResetHref, parsePage, parsePerPage } from "@/lib/admin-pagination";
import { endOfDayExclusive, parseDateInput, parseUserSearch } from "@/lib/admin-support-input";
import {
  formatVietnamDate,
  formatVietnamDateTimeShort,
  vietnamDayKey,
} from "@/lib/datetime";
import { prisma } from "@/lib/prisma";
import { RecordWithdrawalDialog, VoidWithdrawalDialog } from "./FundDialogs";

const inputClass =
  "rounded-lg border border-border bg-background px-3 py-1.5 text-sm text-foreground outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20";

function formatVnd(amount: number): string {
  return `${new Intl.NumberFormat("vi-VN").format(amount)}₫`;
}

type FundStatus = "all" | "active" | "voided";

function parseFundStatus(value: string | undefined): FundStatus {
  return value === "active" || value === "voided" ? value : "all";
}

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("adminFunds");
  return {
    title: t("metadataTitle"),
    robots: { index: false, follow: false },
  };
}

export default async function AdminFundsPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    from?: string;
    to?: string;
    status?: string;
    page?: string;
    perPage?: string;
  }>;
}) {
  await verifySuperAdmin();
  const t = await getTranslations("adminFunds");
  const { q, from, to, status: rawStatus, page, perPage } = await searchParams;
  const search = parseUserSearch(q);
  const fromDate = parseDateInput(from);
  const toDate = parseDateInput(to);
  const status = parseFundStatus(rawStatus);
  const withdrawnAt: Prisma.DateTimeFilter = {
    ...(fromDate ? { gte: fromDate } : {}),
    ...(toDate ? { lt: endOfDayExclusive(toDate) } : {}),
  };

  const where: Prisma.ProjectFundWithdrawalWhereInput = {
    ...(search
      ? {
          OR: [
            { purpose: { contains: search } },
            { bankReference: { contains: search } },
            { note: { contains: search } },
            { createdByAdminEmail: { contains: search } },
            {
              allocations: {
                some: {
                  OR: [
                    { recipient: { contains: search } },
                    { note: { contains: search } },
                  ],
                },
              },
            },
          ],
        }
      : {}),
    ...(fromDate || toDate ? { withdrawnAt } : {}),
    ...(status === "active"
      ? { void: { is: null } }
      : status === "voided"
        ? { void: { isNot: null } }
        : {}),
  };
  const isFiltered = Boolean(search || fromDate || toDate || status !== "all");

  const [summary, total] = await Promise.all([
    getProjectFundSummary(),
    prisma.projectFundWithdrawal.count({ where }),
  ]);
  const pagination = adminPageWindow(total, parsePage(page), parsePerPage(perPage));
  const withdrawals = await prisma.projectFundWithdrawal.findMany({
    where,
    orderBy: [{ withdrawnAt: "desc" }, { createdAt: "desc" }],
    skip: pagination.skip,
    take: pagination.take,
    include: {
      allocations: { orderBy: { sortOrder: "asc" } },
      void: true,
    },
  });

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-3xl">
          <h1 className="font-heading text-2xl font-semibold text-foreground">{t("title")}</h1>
          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{t("description")}</p>
        </div>
        <RecordWithdrawalDialog
          recordedBalance={summary.recordedBalance}
          today={vietnamDayKey(new Date())}
        />
      </header>

      <section aria-label={t("summaryLabel")} className="grid gap-4 md:grid-cols-3">
        <article className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <p className="text-sm font-medium text-muted-foreground">{t("totalRevenue")}</p>
          <p className="mt-2 font-heading text-3xl font-semibold text-emerald-700">
            {formatVnd(summary.totalRevenue)}
          </p>
          <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
            {t("revenueBreakdown", {
              invitations: formatVnd(summary.invitationRevenue),
              slideshows: formatVnd(summary.slideshowRevenue),
            })}
          </p>
        </article>

        <article className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <p className="text-sm font-medium text-muted-foreground">{t("totalWithdrawn")}</p>
          <p className="mt-2 font-heading text-3xl font-semibold text-rose-700">
            {formatVnd(summary.totalWithdrawn)}
          </p>
          <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
            {t("withdrawnBreakdown", {
              active: summary.activeWithdrawalCount,
              voided: summary.voidedWithdrawalCount,
            })}
          </p>
        </article>

        <article
          className={`rounded-2xl border p-5 shadow-sm ${
            summary.recordedBalance < 0
              ? "border-rose-500/30 bg-rose-500/10"
              : "border-primary/20 bg-primary/5"
          }`}
        >
          <p className="text-sm font-medium text-muted-foreground">{t("recordedBalance")}</p>
          <p
            className={`mt-2 font-heading text-3xl font-semibold ${
              summary.recordedBalance < 0 ? "text-rose-700" : "text-primary"
            }`}
          >
            {formatVnd(summary.recordedBalance)}
          </p>
          <p className="mt-3 text-xs leading-relaxed text-muted-foreground">{t("balanceFormula")}</p>
        </article>
      </section>

      {summary.recordedBalance < 0 ? (
        <div role="alert" className="rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-800">
          {t("negativeBalanceWarning")}
        </div>
      ) : null}

      {summary.paidWithoutDateCount > 0 ? (
        <div role="alert" className="rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-900">
          {t("missingPaidDateWarning", { count: summary.paidWithoutDateCount })}
        </div>
      ) : null}

      <section className="space-y-4">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <div>
            <h2 className="font-heading text-xl font-semibold text-foreground">
              {t("historyTitle", { count: total })}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">{t("historyDescription")}</p>
          </div>
        </div>

        <form method="GET" className="flex flex-wrap items-end gap-3 rounded-2xl border border-border bg-card p-4">
          <AdminPerPageField pageSize={pagination.pageSize} />
          <div className="flex min-w-56 flex-1 flex-col gap-1">
            <label htmlFor="fund-search" className="text-xs text-muted-foreground">
              {t("searchLabel")}
            </label>
            <input
              id="fund-search"
              name="q"
              type="search"
              defaultValue={search}
              placeholder={t("searchPlaceholder")}
              className={inputClass}
            />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="fund-from" className="text-xs text-muted-foreground">
              {t("fromDate")}
            </label>
            <input id="fund-from" name="from" type="date" defaultValue={from ?? ""} className={inputClass} />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="fund-to" className="text-xs text-muted-foreground">
              {t("toDate")}
            </label>
            <input id="fund-to" name="to" type="date" defaultValue={to ?? ""} className={inputClass} />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="fund-status" className="text-xs text-muted-foreground">
              {t("statusLabel")}
            </label>
            <select id="fund-status" name="status" defaultValue={status} className={inputClass}>
              <option value="all">{t("statusAll")}</option>
              <option value="active">{t("statusActive")}</option>
              <option value="voided">{t("statusVoided")}</option>
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
              href={adminResetHref("/admin/funds", pagination.pageSize)}
              className="rounded-lg border border-border px-3 py-1.5 text-sm text-muted-foreground transition hover:bg-secondary"
            >
              {t("clearFilters")}
            </Link>
          ) : null}
        </form>

        <AdminTableScroller>
          <table className="w-full min-w-[1080px] text-sm">
            <thead className="border-b border-border bg-muted/40 text-left text-muted-foreground">
              <tr>
                <th className="whitespace-nowrap px-4 py-3 font-medium">{t("columnDate")}</th>
                <th className="whitespace-nowrap px-4 py-3 font-medium">{t("columnAmount")}</th>
                <th className="px-4 py-3 font-medium">{t("columnPurpose")}</th>
                <th className="px-4 py-3 font-medium">{t("columnAllocations")}</th>
                <th className="px-4 py-3 font-medium">{t("columnReference")}</th>
                <th className="px-4 py-3 font-medium">{t("columnRecordedBy")}</th>
                <th className="whitespace-nowrap px-4 py-3 font-medium">{t("columnStatus")}</th>
              </tr>
            </thead>
            <tbody>
              {withdrawals.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                    {isFiltered ? t("noFilteredHistory") : t("noHistory")}
                  </td>
                </tr>
              ) : (
                withdrawals.map((withdrawal) => {
                  const isVoided = Boolean(withdrawal.void);
                  return (
                    <tr key={withdrawal.id} className={`border-b border-border align-top last:border-0 ${isVoided ? "bg-muted/20" : ""}`}>
                      <td className="whitespace-nowrap px-4 py-3">
                        <span className={isVoided ? "text-muted-foreground line-through" : "text-foreground"}>
                          {formatVietnamDate(withdrawal.withdrawnAt)}
                        </span>
                        <span className="mt-1 block text-xs text-muted-foreground">
                          {t("recordedAt", { time: formatVietnamDateTimeShort(withdrawal.createdAt) })}
                        </span>
                      </td>
                      <td className={`whitespace-nowrap px-4 py-3 font-semibold ${isVoided ? "text-muted-foreground line-through" : "text-rose-700"}`}>
                        {formatVnd(withdrawal.amount)}
                      </td>
                      <td className="max-w-64 px-4 py-3">
                        <p className={isVoided ? "text-muted-foreground line-through" : "font-medium text-foreground"}>
                          {withdrawal.purpose}
                        </p>
                        {withdrawal.note ? (
                          <p className="mt-1 whitespace-pre-wrap text-xs leading-relaxed text-muted-foreground">
                            {withdrawal.note}
                          </p>
                        ) : null}
                      </td>
                      <td className="min-w-64 px-4 py-3">
                        <ul className="space-y-2">
                          {withdrawal.allocations.map((allocation) => (
                            <li key={allocation.id} className={isVoided ? "text-muted-foreground line-through" : ""}>
                              <span className="font-medium">{allocation.recipient}</span>
                              <span className="whitespace-nowrap"> · {formatVnd(allocation.amount)}</span>
                              {allocation.note ? (
                                <span className="block text-xs text-muted-foreground">{allocation.note}</span>
                              ) : null}
                            </li>
                          ))}
                        </ul>
                      </td>
                      <td className="max-w-48 px-4 py-3 font-mono text-xs text-muted-foreground">
                        {withdrawal.bankReference ?? "—"}
                      </td>
                      <td className="max-w-52 px-4 py-3 text-xs text-muted-foreground">
                        {withdrawal.createdByAdminEmail}
                      </td>
                      <td className="px-4 py-3">
                        {withdrawal.void ? (
                          <div className="max-w-60">
                            <span className="whitespace-nowrap rounded-full bg-muted px-2 py-1 text-xs font-semibold text-muted-foreground">
                              {t("voidedBadge")}
                            </span>
                            <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                              {withdrawal.void.reason}
                            </p>
                            <p className="mt-1 text-xs text-muted-foreground">
                              {t("voidedBy", {
                                admin: withdrawal.void.createdByAdminEmail,
                                time: formatVietnamDateTimeShort(withdrawal.void.createdAt),
                              })}
                            </p>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            <span className="block w-fit whitespace-nowrap rounded-full bg-emerald-500/15 px-2 py-1 text-xs font-semibold text-emerald-700">
                              {t("activeBadge")}
                            </span>
                            <VoidWithdrawalDialog
                              withdrawalId={withdrawal.id}
                              amount={withdrawal.amount}
                              purpose={withdrawal.purpose}
                            />
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </AdminTableScroller>

        <AdminPagination
          pagination={pagination}
          basePath="/admin/funds"
          params={{
            q: search || undefined,
            from: from || undefined,
            to: to || undefined,
            status: status === "all" ? undefined : status,
          }}
        />
      </section>
    </div>
  );
}

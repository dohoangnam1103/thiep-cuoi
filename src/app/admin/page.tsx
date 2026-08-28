import Link from "next/link";
import { getTranslations } from "next-intl/server";
import type { ReactNode } from "react";

import { verifyAdmin } from "@/lib/admin-dal";
import {
  buildDailySeries,
  DAILY_RANGE_OPTIONS,
  dailyWindowStart,
  parseDailyRange,
  sumDailyValues,
} from "@/lib/admin-daily-stats";
import { CUSTOMER_USER_WHERE, REAL_INVITATION_WHERE } from "@/lib/admin-invitation-filters";
import { vietnamDayKey, vietnamStartOfDayOf } from "@/lib/datetime";
import { prisma } from "@/lib/prisma";
import { AdminDailyChart } from "./AdminDailyChart";

function formatVnd(amount: number): string {
  return new Intl.NumberFormat("vi-VN").format(amount) + "đ";
}

function formatCount(value: number): string {
  return new Intl.NumberFormat("vi-VN").format(value);
}

export default async function AdminDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string }>;
}) {
  await verifyAdmin();

  const t = await getTranslations("adminSupport");
  const { range: rangeParam } = await searchParams;
  const range = parseDailyRange(rangeParam);

  // One instant for the whole render, so the window and the "today" bucket
  // cannot straddle midnight between two queries.
  const now = new Date();
  const windowStart = dailyWindowStart(range, now);
  const todayStart = vietnamStartOfDayOf(now);
  const todayKey = vietnamDayKey(now);

  const [
    userCount,
    realInvitations,
    demoCount,
    suggestionCount,
    paidCount,
    revenue,
    newUsers,
    newRealInvitations,
    settledPayments,
    sentEmailAttemptsToday,
    failedEmailAttemptsToday,
  ] = await Promise.all([
    prisma.user.count({ where: CUSTOMER_USER_WHERE }),
    prisma.invitation.count({ where: REAL_INVITATION_WHERE }),
    prisma.invitation.count({ where: { isDemo: true } }),
    prisma.templateSuggestion.count(),
    prisma.payment.count({ where: { status: "paid" } }),
    prisma.payment.aggregate({ where: { status: "paid" }, _sum: { amount: true } }),
    // The three series below fetch one column for the window and are bucketed
    // in `buildDailySeries`; SQLite cannot truncate a DateTime to a Vietnam day.
    prisma.user.findMany({
      where: { ...CUSTOMER_USER_WHERE, createdAt: { gte: windowStart } },
      select: { createdAt: true },
    }),
    prisma.invitation.findMany({
      where: { ...REAL_INVITATION_WHERE, createdAt: { gte: windowStart } },
      select: { createdAt: true },
    }),
    // Bucketed by `paidAt`, not `createdAt`: an order opened on Monday and
    // settled on Wednesday is Wednesday's revenue.
    prisma.payment.findMany({
      where: { status: "paid", paidAt: { gte: windowStart } },
      select: { paidAt: true, amount: true },
    }),
    prisma.emailDeliveryAttempt.count({
      where: { status: "sent", attemptedAt: { gte: todayStart } },
    }),
    prisma.emailDeliveryAttempt.count({
      where: { status: "failed", attemptedAt: { gte: todayStart } },
    }),
  ]);

  const stats: { label: string; value: string; href: string; valueClass?: string }[] = [
    { label: "Người dùng", value: formatCount(userCount), href: "/admin/users" },
    { label: "Thiệp thật", value: formatCount(realInvitations), href: "/admin/invitations" },
    { label: "Thiệp demo", value: formatCount(demoCount), href: "/admin/demos" },
    { label: "Gợi ý mẫu", value: formatCount(suggestionCount), href: "/admin/template-suggestions" },
    { label: "Đơn đã trả", value: formatCount(paidCount), href: "/admin/payments" },
    {
      label: "Doanh thu",
      value: formatVnd(revenue._sum.amount ?? 0),
      href: "/admin/payments",
      // A lifetime total runs to tens of millions, which overflows a sixth of
      // the grid at the size the other cards use.
      valueClass: "text-xl",
    },
    {
      label: t("overviewEmailsSentToday"),
      value: formatCount(sentEmailAttemptsToday),
      href: `/admin/email-logs?from=${todayKey}&to=${todayKey}&status=sent`,
    },
    {
      label: t("overviewEmailsFailedToday"),
      value: formatCount(failedEmailAttemptsToday),
      href: `/admin/email-logs?from=${todayKey}&to=${todayKey}&status=failed`,
    },
  ];

  const userSeries = buildDailySeries(
    newUsers.map((user) => ({ at: user.createdAt })),
    range,
    now,
  );
  const invitationSeries = buildDailySeries(
    newRealInvitations.map((invitation) => ({ at: invitation.createdAt })),
    range,
    now,
  );
  const revenueSeries = buildDailySeries(
    settledPayments.map((payment) => ({ at: payment.paidAt, amount: payment.amount })),
    range,
    now,
  );

  const rangeTotalLabel = t("overviewRangeTotal", { days: range });

  return (
    <div className="space-y-8">
      <div className="space-y-6">
        <h1 className="font-heading text-2xl text-foreground">Tổng quan</h1>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {stats.map((stat) => (
            <Link key={stat.label} href={stat.href} className="transition hover:opacity-80">
              <div className="rounded-2xl border border-border bg-card p-5">
                <p className="text-sm text-muted-foreground">{stat.label}</p>
                <p
                  className={`mt-2 font-bold break-words text-foreground ${stat.valueClass ?? "text-2xl"}`}
                >
                  {stat.value}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>

      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-heading text-xl text-foreground">{t("overviewChartsTitle")}</h2>
          <div
            role="group"
            aria-label={t("overviewRangeLabel")}
            className="flex items-center gap-1 rounded-xl border border-border bg-background p-1 text-sm"
          >
            {DAILY_RANGE_OPTIONS.map((option) => {
              const isActive = option === range;
              return (
                <Link
                  key={option}
                  href={`/admin?range=${option}`}
                  aria-current={isActive ? "true" : undefined}
                  className={`rounded-lg px-3 py-1 transition ${
                    isActive
                      ? "bg-primary/10 font-semibold text-primary"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  {t("overviewRangeOption", { days: option })}
                </Link>
              );
            })}
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <ChartCard
            title={t("overviewNewUsers")}
            total={formatCount(sumDailyValues(userSeries))}
            caption={rangeTotalLabel}
            emptyLabel={t("overviewChartEmpty")}
            isEmpty={sumDailyValues(userSeries) === 0}
          >
            <AdminDailyChart
              data={userSeries}
              seriesLabel={t("overviewNewUsers")}
              color="var(--chart-1)"
            />
          </ChartCard>

          <ChartCard
            title={t("overviewNewInvitations")}
            total={formatCount(sumDailyValues(invitationSeries))}
            caption={rangeTotalLabel}
            emptyLabel={t("overviewChartEmpty")}
            isEmpty={sumDailyValues(invitationSeries) === 0}
          >
            <AdminDailyChart
              data={invitationSeries}
              seriesLabel={t("overviewNewInvitations")}
              color="var(--chart-2)"
            />
          </ChartCard>

          <ChartCard
            className="lg:col-span-2"
            title={t("overviewRevenue")}
            total={formatVnd(sumDailyValues(revenueSeries))}
            caption={rangeTotalLabel}
            emptyLabel={t("overviewChartEmpty")}
            isEmpty={sumDailyValues(revenueSeries) === 0}
          >
            <AdminDailyChart
              data={revenueSeries}
              seriesLabel={t("overviewRevenue")}
              color="var(--chart-3)"
              format="currency"
            />
          </ChartCard>
        </div>
      </section>
    </div>
  );
}

function ChartCard({
  title,
  total,
  caption,
  emptyLabel,
  isEmpty,
  className = "",
  children,
}: {
  title: string;
  total: string;
  caption: string;
  emptyLabel: string;
  /** An all-zero series renders as an empty plot, which reads as broken. */
  isEmpty: boolean;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={`rounded-2xl border border-border bg-card p-5 ${className}`}>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="text-sm font-medium text-foreground">{title}</p>
        <p className="text-sm text-muted-foreground">
          {caption}: <span className="font-semibold text-foreground">{total}</span>
        </p>
      </div>
      {isEmpty ? (
        <p className="flex h-56 items-center justify-center text-sm text-muted-foreground">
          {emptyLabel}
        </p>
      ) : (
        <div className="mt-4">{children}</div>
      )}
    </div>
  );
}

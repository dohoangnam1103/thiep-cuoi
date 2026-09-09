import Link from "next/link";
import { getTranslations } from "next-intl/server";
import type { ReactNode } from "react";

import { verifyAdmin } from "@/lib/admin-dal";
import { getProjectFundSummary } from "@/lib/admin-funds";
import {
  buildDailySeries,
  DAILY_RANGE_OPTIONS,
  dailyWindowStart,
  parseDailyRange,
  sumDailyValues,
} from "@/lib/admin-daily-stats";
import { buildHourlyGrowth, type HourlyGrowthSummary } from "@/lib/admin-hourly-stats";
import { buildPaymentDelayDistribution, type PaymentDelayBucket } from "@/lib/admin-payment-delay";
import { CUSTOMER_USER_WHERE, REAL_INVITATION_WHERE } from "@/lib/admin-invitation-filters";
import { vietnamDayKey, vietnamStartOfDayOf } from "@/lib/datetime";
import { prisma } from "@/lib/prisma";
import { AdminDailyChart } from "./AdminDailyChart";
import { AdminGrowthChart } from "./AdminGrowthChart";
import { AdminHourlyGrowthChart } from "./AdminHourlyGrowthChart";
import { AdminPaymentDelayChart } from "./AdminPaymentDelayChart";

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
  const tFunds = await getTranslations("adminFunds");
  const { range: rangeParam } = await searchParams;
  const range = parseDailyRange(rangeParam);

  // One instant for the whole render, so the window and the "today" bucket
  // cannot straddle midnight between two queries.
  const now = new Date();
  // The hourly card compares today with the same elapsed portion of prior days.
  // Fetch one extra day so the baseline still contains `range` complete dates.
  const windowStart = dailyWindowStart(range + 1, now);
  const todayStart = vietnamStartOfDayOf(now);
  const todayKey = vietnamDayKey(now);

  const [
    userCount,
    realInvitations,
    demoCount,
    suggestionCount,
    paidCount,
    fundSummary,
    newUsers,
    newRealInvitations,
    settledPayments,
    sentEmailAttemptsToday,
    failedEmailAttemptsToday,
    sentReminders,
    paidUserEvents,
  ] = await Promise.all([
    prisma.user.count({ where: CUSTOMER_USER_WHERE }),
    prisma.invitation.count({ where: REAL_INVITATION_WHERE }),
    prisma.invitation.count({ where: { isDemo: true } }),
    prisma.templateSuggestion.count(),
    prisma.payment.count({ where: { status: "paid" } }),
    getProjectFundSummary(),
    // The series below fetch timestamps for the window and are bucketed
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
    // Count logical emails, not retry attempts, on their actual send date.
    prisma.emailDelivery.findMany({
      where: {
        type: { in: ["trial-ending", "expired"] },
        status: "sent",
        sentAt: { gte: windowStart, lte: now },
      },
      select: { sentAt: true },
    }),
    prisma.payment.findMany({
      where: { status: "paid", paidAt: { not: null }, invitation: REAL_INVITATION_WHERE },
      select: {
        paidAt: true,
        invitation: { select: { createdAt: true, userId: true } },
      },
    }),
  ]);

  const stats: { label: string; value: string; href: string; valueClass?: string }[] = [
    { label: "Người dùng", value: formatCount(userCount), href: "/admin/users" },
    { label: "Thiệp thật", value: formatCount(realInvitations), href: "/admin/invitations" },
    { label: "Thiệp demo", value: formatCount(demoCount), href: "/admin/demos" },
    { label: "Gợi ý mẫu", value: formatCount(suggestionCount), href: "/admin/template-suggestions" },
    { label: "Đơn đã trả", value: formatCount(paidCount), href: "/admin/payments" },
    {
      label: tFunds("remainingBalance"),
      value: formatVnd(fundSummary.remainingBalance),
      href: "/admin/funds",
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
  const reminderSeries = buildDailySeries(
    sentReminders.map((delivery) => ({ at: delivery.sentAt })),
    range,
    now,
  );
  const hourlyGrowth = buildHourlyGrowth(
    newUsers.map((user) => ({ at: user.createdAt })),
    newRealInvitations.map((invitation) => ({ at: invitation.createdAt })),
    range,
    now,
  );
  const paymentDelaySeries = buildPaymentDelayDistribution(
    paidUserEvents.map((payment) => ({
      userId: payment.invitation.userId,
      invitationCreatedAt: payment.invitation.createdAt,
      paidAt: payment.paidAt,
    })),
  );
  const paidUserTotal = paymentDelaySeries.reduce((total, point) => total + point.value, 0);
  const paymentDelayLabels: Record<PaymentDelayBucket, string> = {
    "day-0": t("paymentDelayDay0"),
    "day-1": t("paymentDelayDay1"),
    "day-2": t("paymentDelayDay2"),
    "day-3-plus": t("paymentDelayDay3Plus"),
  };

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
          <HourlyGrowthCard
            data={hourlyGrowth.points}
            summary={hourlyGrowth.summary}
            title={t("overviewHourlyTitle")}
            usersLabel={t("overviewNewUsers")}
            invitationsLabel={t("overviewNewInvitations")}
            averageLabel={t("overviewHourlyAverage", { days: range })}
            averageUsersLabel={t("overviewHourlyAverageSeries", { label: t("overviewNewUsers") })}
            averageInvitationsLabel={t("overviewHourlyAverageSeries", { label: t("overviewNewInvitations") })}
            deltaLabel={(delta) =>
              delta === null
                ? t("overviewHourlyNoBaseline")
                : t("overviewHourlyDelta", { value: formatSignedPercent(delta) })
            }
            caption={t("overviewHourlyCaption", { days: range })}
            emptyLabel={t("overviewChartEmpty")}
            isEmpty={
              hourlyGrowth.summary.todayUsers === 0
              && hourlyGrowth.summary.todayInvitations === 0
              && hourlyGrowth.summary.averageUsers === 0
              && hourlyGrowth.summary.averageInvitations === 0
            }
          />

          <ChartCard
            title={t("overviewGrowth")}
            total={t("overviewGrowthTotals", {
              users: formatCount(sumDailyValues(userSeries)),
              invitations: formatCount(sumDailyValues(invitationSeries)),
            })}
            caption={rangeTotalLabel}
            emptyLabel={t("overviewChartEmpty")}
            isEmpty={
              sumDailyValues(userSeries) === 0 && sumDailyValues(invitationSeries) === 0
            }
          >
            <AdminGrowthChart
              users={userSeries}
              invitations={invitationSeries}
              usersLabel={t("overviewNewUsers")}
              invitationsLabel={t("overviewNewInvitations")}
            />
          </ChartCard>

          <div className="rounded-2xl border border-border bg-card p-5">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <p className="text-sm font-medium text-foreground">{t("paymentDelayChartTitle")}</p>
              <p className="text-sm text-muted-foreground">
                {t("paymentDelayPaidUsers")}: {" "}
                <span className="font-semibold text-foreground">{formatCount(paidUserTotal)}</span>
              </p>
            </div>
            {paidUserTotal === 0 ? (
              <p className="flex h-64 items-center justify-center text-sm text-muted-foreground">
                {t("paymentDelayEmpty")}
              </p>
            ) : (
              <div className="mt-4">
                <AdminPaymentDelayChart
                  data={paymentDelaySeries}
                  labels={paymentDelayLabels}
                  seriesLabel={t("paymentDelayUsers")}
                />
              </div>
            )}
          </div>

          <ChartCard
            title={t("overviewRemindersSent")}
            total={formatCount(sumDailyValues(reminderSeries))}
            caption={rangeTotalLabel}
            emptyLabel={t("overviewChartEmpty")}
            isEmpty={sumDailyValues(reminderSeries) === 0}
          >
            <AdminDailyChart
              data={reminderSeries}
              seriesLabel={t("overviewRemindersSent")}
              color="var(--chart-4)"
            />
          </ChartCard>

          <ChartCard
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

function formatAverage(value: number): string {
  return new Intl.NumberFormat("vi-VN", {
    maximumFractionDigits: 1,
  }).format(value);
}

function formatSignedPercent(value: number): string {
  const rounded = Math.round(value);
  return `${rounded > 0 ? "+" : ""}${rounded}%`;
}

function HourlyGrowthCard({
  data,
  summary,
  title,
  usersLabel,
  invitationsLabel,
  averageLabel,
  averageUsersLabel,
  averageInvitationsLabel,
  deltaLabel,
  caption,
  emptyLabel,
  isEmpty,
}: {
  data: Parameters<typeof AdminHourlyGrowthChart>[0]["data"];
  summary: HourlyGrowthSummary;
  title: string;
  usersLabel: string;
  invitationsLabel: string;
  averageLabel: string;
  averageUsersLabel: string;
  averageInvitationsLabel: string;
  deltaLabel: (delta: number | null) => string;
  caption: string;
  emptyLabel: string;
  isEmpty: boolean;
}) {
  const metrics = [
    {
      label: usersLabel,
      today: summary.todayUsers,
      average: summary.averageUsers,
      delta: summary.userDeltaPct,
      tone: "text-[oklch(0.62_0.13_220)]",
    },
    {
      label: invitationsLabel,
      today: summary.todayInvitations,
      average: summary.averageInvitations,
      delta: summary.invitationDeltaPct,
      tone: "text-[var(--chart-1)]",
    },
  ];

  return (
    <div className="rounded-2xl border border-border bg-card p-5 lg:col-span-2">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="text-sm font-medium text-foreground">{title}</p>
        <p className="text-sm text-muted-foreground">{caption}</p>
      </div>
      {isEmpty ? (
        <p className="flex h-56 items-center justify-center text-sm text-muted-foreground">
          {emptyLabel}
        </p>
      ) : (
        <>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {metrics.map((metric) => (
              <div key={metric.label} className="rounded-xl border border-border/70 bg-background/60 px-4 py-3">
                <p className={`text-sm font-medium ${metric.tone}`}>{metric.label}</p>
                <div className="mt-1 flex flex-wrap items-baseline gap-x-3 gap-y-1">
                  <span className="text-2xl font-bold tabular-nums text-foreground">{formatCount(metric.today)}</span>
                  <span className="text-xs text-muted-foreground">
                    {averageLabel}: <strong className="font-semibold text-foreground">{formatAverage(metric.average)}</strong>
                  </span>
                  <span className={`text-xs font-semibold ${metric.delta === null ? "text-muted-foreground" : metric.delta >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}>
                    {deltaLabel(metric.delta)}
                  </span>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4">
            <AdminHourlyGrowthChart
              data={data}
              usersLabel={usersLabel}
              invitationsLabel={invitationsLabel}
              averageUsersLabel={averageUsersLabel}
              averageInvitationsLabel={averageInvitationsLabel}
            />
          </div>
        </>
      )}
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

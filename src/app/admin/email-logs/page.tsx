import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";

import type { Prisma } from "@/generated/prisma/client";
import { AdminPagination, AdminPerPageField } from "@/components/admin-pagination";
import { AdminTableScroller } from "@/components/admin-table-scroller";
import { verifyAdmin } from "@/lib/admin-dal";
import {
  adminPageHref,
  adminPageWindow,
  adminResetHref,
  parsePage,
  parsePerPage,
  perPageParam,
} from "@/lib/admin-pagination";
import {
  defaultDayFilter,
  endOfDayExclusive,
  parseDateInput,
  parseUserSearch,
} from "@/lib/admin-support-input";
import { formatVietnamDateTimeShort } from "@/lib/datetime";
import { emailClickSecret } from "@/lib/email-click";
import { funnelRate, loadEmailFunnel, sumEmailFunnel } from "@/lib/email-funnel";
import { prisma } from "@/lib/prisma";
import {
  FORECAST_RUN_COUNT,
  REMINDER_CRON_HOURS,
  forecastReminders,
  upcomingCronRuns,
} from "@/lib/reminder-forecast";
import { buildCardName } from "@/lib/trial-reminder";

export const metadata: Metadata = {
  title: "Lịch sử email | Quản trị",
  robots: { index: false, follow: false },
};

const inputClass =
  "rounded-lg border border-border bg-background px-3 py-1.5 text-sm text-foreground outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20";

const EMAIL_TYPES = [
  "trial-ending",
  "expired",
  "payment-success",
  "welcome",
  "onboarding-no-invitation",
  "system-notice",
] as const;

const EMAIL_STATUSES = ["pending", "sent", "failed", "blocked"] as const;

function includes<T extends readonly string[]>(values: T, value: string | undefined): value is T[number] {
  return Boolean(value && values.includes(value));
}

function validRunId(value: string | undefined): string | null {
  const candidate = value?.trim() ?? "";
  return /^[a-zA-Z0-9_-]{8,80}$/.test(candidate) ? candidate : null;
}

/**
 * Số kèm tỉ lệ so với mẫu số, ví dụ `3 · 30%`.
 *
 * Mẫu số 0 in dấu gạch chứ không phải `0%`: chưa gửi thư nào thì chưa đo được gì,
 * còn "0%" đọc như một kết quả đã đo. Xem `funnelRate`.
 */
function withRate(value: number, denominator: number): string {
  const rate = funnelRate(value, denominator);
  if (rate === null) return "—";
  return `${value} · ${Math.round(rate * 100)}%`;
}

function statusClass(status: string): string {
  if (status === "sent") return "bg-emerald-500/15 text-emerald-700";
  if (status === "failed") return "bg-rose-500/15 text-rose-700";
  if (status === "blocked") return "bg-violet-500/15 text-violet-700";
  return "bg-amber-500/15 text-amber-700";
}

function runStatusClass(status: string): string {
  if (status === "completed") return "bg-emerald-500/15 text-emerald-700";
  if (status === "failed") return "bg-rose-500/15 text-rose-700";
  if (status === "completed-with-errors") return "bg-amber-500/15 text-amber-700";
  return "bg-sky-500/15 text-sky-700";
}

function runStatusKey(status: string):
  | "emailRunStatus.running"
  | "emailRunStatus.completed"
  | "emailRunStatus.completed-with-errors"
  | "emailRunStatus.failed" {
  if (status === "completed") return "emailRunStatus.completed";
  if (status === "failed") return "emailRunStatus.failed";
  if (status === "completed-with-errors") return "emailRunStatus.completed-with-errors";
  return "emailRunStatus.running";
}

export default async function AdminEmailLogsPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    from?: string;
    to?: string;
    type?: string;
    status?: string;
    context?: string;
    run?: string;
    page?: string;
    perPage?: string;
  }>;
}) {
  await verifyAdmin();
  const t = await getTranslations("adminSupport");
  const params = await searchParams;
  const search = parseUserSearch(params.q);
  const type = includes(EMAIL_TYPES, params.type) ? params.type : null;
  const status = includes(EMAIL_STATUSES, params.status) ? params.status : null;
  const context = params.context === "with-invitation" || params.context === "without-invitation"
    ? params.context
    : null;
  const runId = validRunId(params.run);

  // Mặc định chỉ xem email của hôm nay — xem `defaultDayFilter` cho lý do và
  // cho chỗ chuỗi rỗng khác `undefined`. Bấm vào một lượt gửi thì bỏ mặc định:
  // lượt đó có thể của hôm qua, lọc theo hôm nay sẽ cho ra bảng rỗng khó hiểu.
  const hasDateParam = params.from !== undefined || params.to !== undefined;
  const defaultDay = runId ? null : defaultDayFilter(params.from, params.to);
  const fromValue = defaultDay ?? params.from;
  const toValue = defaultDay ?? params.to;
  const fromDate = parseDateInput(fromValue);
  const toDate = parseDateInput(toValue);

  const attemptedAt: Prisma.DateTimeFilter = {
    ...(fromDate ? { gte: fromDate } : {}),
    ...(toDate ? { lt: endOfDayExclusive(toDate) } : {}),
  };
  const deliveryWhere: Prisma.EmailDeliveryWhereInput = {
    ...(search ? { recipientEmail: { contains: search } } : {}),
    ...(type ? { type } : {}),
    ...(context === "with-invitation" ? { invitationId: { not: null } } : {}),
    ...(context === "without-invitation" ? { invitationId: null } : {}),
  };
  const where: Prisma.EmailDeliveryAttemptWhereInput = {
    ...(fromDate || toDate ? { attemptedAt } : {}),
    ...(status ? { status } : {}),
    ...(runId ? { runId } : {}),
    ...(Object.keys(deliveryWhere).length > 0 ? { delivery: { is: deliveryWhere } } : {}),
  };
  // `hasDateParam` chứ không phải `fromDate`: mặc định hôm nay không phải là
  // một bộ lọc admin đặt ra, nên nó không được làm hiện nút "Xoá lọc".
  const isFiltered = Boolean(search || hasDateParam || type || status || context || runId);

  const [total, sentCount, failedCount, runs, reminderCandidates, funnel] = await Promise.all([
    prisma.emailDeliveryAttempt.count({ where }),
    prisma.emailDeliveryAttempt.count({ where: { ...where, status: "sent" } }),
    prisma.emailDeliveryAttempt.count({ where: { ...where, status: "failed" } }),
    prisma.emailRun.findMany({
      orderBy: { startedAt: "desc" },
      take: 12,
    }),
    // Cùng bộ điều kiện thô mà cron dùng; việc lọc thật do forecastReminders làm
    // qua chính hai hàm điều kiện của cron.
    prisma.invitation.findMany({
      where: {
        isDemo: false,
        paid: false,
        complimentary: false,
        publishedAt: { not: null },
      },
      select: {
        id: true,
        templateId: true,
        paid: true,
        complimentary: true,
        publishedAt: true,
        reminderSentAt: true,
        expiredReminderSentAt: true,
        user: { select: { email: true } },
        content: { select: { brideShortName: true, groomShortName: true } },
      },
    }),
    // Cố ý không nhận `where` của bảng bên dưới: phễu luôn tính toàn thời gian.
    loadEmailFunnel(),
  ]);

  const funnelTotal = sumEmailFunnel(funnel);
  const clickTrackingEnabled = emailClickSecret() !== null;

  const pagination = adminPageWindow(total, parsePage(params.page), parsePerPage(params.perPage));
  const attempts = await prisma.emailDeliveryAttempt.findMany({
    where,
    orderBy: { attemptedAt: "desc" },
    skip: pagination.skip,
    take: pagination.take,
    include: {
      delivery: {
        include: {
          user: { select: { email: true } },
          invitation: {
            select: {
              id: true,
              templateId: true,
              content: { select: { brideFullName: true, groomFullName: true } },
            },
          },
        },
      },
    },
  });

  const cronRuns = upcomingCronRuns(new Date());
  const candidateById = new Map(reminderCandidates.map((invitation) => [invitation.id, invitation]));
  const forecast = forecastReminders(
    reminderCandidates.map((invitation) => ({
      invitationId: invitation.id,
      paid: invitation.paid,
      complimentary: invitation.complimentary,
      publishedAt: invitation.publishedAt,
      reminderSentAt: invitation.reminderSentAt,
      expiredReminderSentAt: invitation.expiredReminderSentAt,
      email: invitation.user.email,
    })),
    cronRuns,
  );
  const forecastCountByRun = new Map<number, number>();
  for (const entry of forecast) {
    const key = entry.scheduledAt.getTime();
    forecastCountByRun.set(key, (forecastCountByRun.get(key) ?? 0) + 1);
  }

  /**
   * Bộ lọc hiện tại dưới dạng query, để link phân trang và link "xem tất cả
   * thời gian" không làm mất chúng.
   *
   * `params.from`/`params.to` giữ nguyên bản, kể cả chuỗi rỗng: đó là cách "xem
   * tất cả thời gian" sống sót qua các trang thay vì bị mặc định hôm nay đè lại.
   */
  const listParams = {
    q: search || undefined,
    from: params.from,
    to: params.to,
    type: type ?? undefined,
    status: status ?? undefined,
    context: context ?? undefined,
    run: runId ?? undefined,
  };
  const allTimeHref = adminPageHref(
    "/admin/email-logs",
    { ...listParams, from: "", to: "", perPage: perPageParam(pagination.pageSize) },
    1,
  );

  const typeLabel: Record<string, string> = {
    "trial-ending": t("emailTypeTrialEnding"),
    expired: t("emailTypeExpired"),
    "payment-success": t("emailTypePaymentSuccess"),
    welcome: t("emailTypeWelcome"),
    "onboarding-no-invitation": t("emailTypeOnboarding"),
    "system-notice": t("emailTypeSystem"),
  };
  const statusLabel: Record<string, string> = {
    pending: t("emailStatusPending"),
    sent: t("emailStatusSent"),
    failed: t("emailStatusFailed"),
    blocked: t("emailStatusBlocked"),
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <h1 className="font-heading text-2xl text-foreground">{t("emailLogsTitle", { count: total })}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t("emailLogsDescription")}</p>
        </div>
        <div className="flex gap-3 text-sm text-muted-foreground">
          <span>{t("emailRunSent")}: <strong className="text-emerald-700">{sentCount}</strong></span>
          <span>{t("emailRunFailed")}: <strong className="text-rose-700">{failedCount}</strong></span>
        </div>
      </div>

      <section className="space-y-3">
        <div>
          <h2 className="font-heading text-lg text-foreground">{t("emailFunnelTitle")}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{t("emailFunnelDescription")}</p>
        </div>

        {!clickTrackingEnabled ? (
          <p className="rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-800">
            {t("emailFunnelClickTrackingOff")}
          </p>
        ) : null}

        {funnelTotal.sent === 0 ? (
          <p className="rounded-2xl border border-border bg-card px-4 py-5 text-sm text-muted-foreground">
            {t("emailFunnelEmpty")}
          </p>
        ) : (
          <>
            <AdminTableScroller>
              <table className="w-full text-sm">
                <thead className="border-b border-border bg-muted/40 text-left text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3 font-medium">{t("emailType")}</th>
                    <th className="whitespace-nowrap px-4 py-3 text-right font-medium">
                      {t("emailFunnelSent")}
                    </th>
                    <th className="whitespace-nowrap px-4 py-3 text-right font-medium">
                      {t("emailFunnelClicked")}
                    </th>
                    <th className="whitespace-nowrap px-4 py-3 text-right font-medium">
                      {t("emailFunnelPaidAfterSent")}
                    </th>
                    <th className="whitespace-nowrap px-4 py-3 text-right font-medium">
                      {t("emailFunnelPaidAfterClick")}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {funnel.map((row) => (
                    <tr key={row.type} className="border-b border-border last:border-0">
                      <td className="whitespace-nowrap px-4 py-3">
                        {typeLabel[row.type] ?? row.type}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-right font-medium text-foreground">
                        {row.sent}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-right text-muted-foreground">
                        {withRate(row.clicked, row.sent)}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-right text-emerald-700">
                        {withRate(row.paidAfterSent, row.sent)}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-right text-emerald-700">
                        {withRate(row.paidAfterClick, row.clicked)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="border-t border-border bg-muted/40 font-medium">
                  <tr>
                    <td className="px-4 py-3">{t("emailFunnelTotal")}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-right text-foreground">
                      {funnelTotal.sent}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right text-muted-foreground">
                      {withRate(funnelTotal.clicked, funnelTotal.sent)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right text-emerald-700">
                      {withRate(funnelTotal.paidAfterSent, funnelTotal.sent)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right text-emerald-700">
                      {withRate(funnelTotal.paidAfterClick, funnelTotal.clicked)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </AdminTableScroller>
            <p className="text-xs text-muted-foreground">{t("emailFunnelCaveat")}</p>
          </>
        )}
      </section>

      <section className="space-y-3">
        <div>
          <h2 className="font-heading text-lg text-foreground">
            {t("emailUpcomingTitle", { count: forecast.length })}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {t("emailUpcomingDescription", { hours: REMINDER_CRON_HOURS.join(", ") })}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {cronRuns.map((run) => {
            const count = forecastCountByRun.get(run.getTime()) ?? 0;
            return (
              <span
                key={run.toISOString()}
                className={`rounded-full border px-3 py-1 text-xs ${
                  count > 0
                    ? "border-primary/25 bg-primary/10 font-medium text-primary"
                    : "border-border/70 bg-muted/30 text-muted-foreground"
                }`}
              >
                {formatVietnamDateTimeShort(run)} · {t("emailUpcomingRunCount", { count })}
              </span>
            );
          })}
        </div>

        {forecast.length === 0 ? (
          <p className="rounded-2xl border border-border bg-card px-4 py-5 text-sm text-muted-foreground">
            {t("emailUpcomingNone", { count: FORECAST_RUN_COUNT })}
          </p>
        ) : (
          <AdminTableScroller>
            <table className="w-full text-sm">
              <thead className="border-b border-border bg-muted/40 text-left text-muted-foreground">
                <tr>
                  <th className="whitespace-nowrap px-4 py-3 font-medium">{t("emailUpcomingScheduledAt")}</th>
                  <th className="px-4 py-3 font-medium">{t("emailRecipient")}</th>
                  <th className="whitespace-nowrap px-4 py-3 font-medium">{t("emailType")}</th>
                  <th className="px-4 py-3 font-medium">{t("emailContext")}</th>
                  <th className="whitespace-nowrap px-4 py-3 font-medium">{t("emailUpcomingExpiresAt")}</th>
                </tr>
              </thead>
              <tbody>
                {forecast.map((entry) => {
                  const invitation = candidateById.get(entry.invitationId);
                  // Tên ngắn, đúng tên sẽ xuất hiện trong email chứ không phải tên đầy đủ.
                  const cardName = buildCardName(invitation?.content ?? null);
                  return (
                    <tr
                      key={`${entry.invitationId}-${entry.kind}`}
                      className="border-b border-border align-top last:border-0"
                    >
                      <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">
                        {formatVietnamDateTimeShort(entry.scheduledAt)}
                      </td>
                      <td className="px-4 py-3 font-medium text-foreground">
                        {invitation?.user.email ?? t("emailNoUser")}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3">
                        {typeLabel[entry.kind] ?? entry.kind}
                      </td>
                      <td className="px-4 py-3">
                        <Link
                          href={`/admin/invitations/${entry.invitationId}/edit`}
                          className="text-primary hover:underline"
                        >
                          <span className="block">{cardName}</span>
                          {invitation ? (
                            <span className="block text-xs text-muted-foreground">{invitation.templateId}</span>
                          ) : null}
                        </Link>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">
                        {formatVietnamDateTimeShort(entry.expiresAt)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </AdminTableScroller>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="font-heading text-lg text-foreground">{t("emailRunsTitle")}</h2>
        {runs.length === 0 ? (
          <p className="rounded-2xl border border-border bg-card px-4 py-5 text-sm text-muted-foreground">
            {t("emailNoRuns")}
          </p>
        ) : (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {runs.map((run) => (
              <Link
                key={run.id}
                href={`/admin/email-logs?run=${encodeURIComponent(run.id)}`}
                className={`rounded-2xl border bg-card p-4 transition hover:border-primary/40 hover:bg-muted/30 ${
                  run.id === runId ? "border-primary" : "border-border"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <p className="font-medium text-foreground">{run.source}</p>
                  <span className={`whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium ${runStatusClass(run.status)}`}>
                    {t(runStatusKey(run.status))}
                  </span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {t("emailRunStarted")}: {formatVietnamDateTimeShort(run.startedAt)}
                </p>
                {run.finishedAt ? (
                  <p className="mt-1 text-xs text-muted-foreground">
                    {t("emailRunFinished")}: {formatVietnamDateTimeShort(run.finishedAt)}
                  </p>
                ) : null}
                <div className="mt-3 grid grid-cols-4 gap-2 text-center text-xs">
                  <span><strong className="block text-foreground">{run.scannedCount}</strong>{t("emailRunScanned")}</span>
                  <span><strong className="block text-emerald-700">{run.sentCount}</strong>{t("emailRunSent")}</span>
                  <span><strong className="block text-rose-700">{run.failedCount}</strong>{t("emailRunFailed")}</span>
                  <span><strong className="block text-muted-foreground">{run.skippedCount}</strong>{t("emailRunSkipped")}</span>
                </div>
                {run.errorMessage ? (
                  <p className="mt-3 line-clamp-2 text-xs text-rose-700">{run.errorMessage}</p>
                ) : null}
              </Link>
            ))}
          </div>
        )}
      </section>

      <form method="GET" className="flex flex-wrap items-end gap-3 rounded-2xl border border-border bg-card p-4">
        {runId ? <input type="hidden" name="run" value={runId} /> : null}
        <AdminPerPageField pageSize={pagination.pageSize} />
        <div className="flex flex-col gap-1">
          <label htmlFor="email-log-search" className="text-xs text-muted-foreground">{t("emailRecipient")}</label>
          <input id="email-log-search" name="q" type="search" defaultValue={search} placeholder="an@gmail.com" className={`w-60 ${inputClass}`} />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="email-log-from" className="text-xs text-muted-foreground">{t("emailFromDate")}</label>
          <input id="email-log-from" name="from" type="date" defaultValue={fromValue ?? ""} className={inputClass} />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="email-log-to" className="text-xs text-muted-foreground">{t("emailToDate")}</label>
          <input id="email-log-to" name="to" type="date" defaultValue={toValue ?? ""} className={inputClass} />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="email-log-type" className="text-xs text-muted-foreground">{t("emailType")}</label>
          <select id="email-log-type" name="type" defaultValue={type ?? ""} className={inputClass}>
            <option value="">{t("emailAllTypes")}</option>
            {EMAIL_TYPES.map((value) => <option key={value} value={value}>{typeLabel[value]}</option>)}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="email-log-status" className="text-xs text-muted-foreground">{t("status")}</label>
          <select id="email-log-status" name="status" defaultValue={status ?? ""} className={inputClass}>
            <option value="">{t("emailAllStatuses")}</option>
            {EMAIL_STATUSES.map((value) => <option key={value} value={value}>{statusLabel[value]}</option>)}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="email-log-context" className="text-xs text-muted-foreground">{t("emailContext")}</label>
          <select id="email-log-context" name="context" defaultValue={context ?? ""} className={inputClass}>
            <option value="">{t("emailAllContexts")}</option>
            <option value="with-invitation">{t("emailWithInvitation")}</option>
            <option value="without-invitation">{t("emailWithoutInvitation")}</option>
          </select>
        </div>
        <button type="submit" className="rounded-lg bg-primary px-4 py-1.5 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90">{t("filterButton")}</button>
        {isFiltered ? <Link href={adminResetHref("/admin/email-logs", pagination.pageSize)} className="rounded-lg border border-border px-3 py-1.5 text-sm text-muted-foreground transition hover:bg-secondary">{t("clearFilters")}</Link> : null}
      </form>

      {defaultDay ? (
        <p className="text-sm text-muted-foreground">
          {t("emailDefaultToday", { date: defaultDay })}{" "}
          <Link href={allTimeHref} className="text-primary hover:underline">
            {t("emailShowAllTime")}
          </Link>
        </p>
      ) : null}

      <AdminTableScroller>
        <table className="w-full text-sm">
          <thead className="border-b border-border bg-muted/40 text-left text-muted-foreground">
            <tr>
              <th className="whitespace-nowrap px-4 py-3 font-medium">{t("emailAttemptedAt")}</th>
              <th className="px-4 py-3 font-medium">{t("emailRecipient")}</th>
              <th className="whitespace-nowrap px-4 py-3 font-medium">{t("emailType")}</th>
              <th className="px-4 py-3 font-medium">{t("emailContext")}</th>
              <th className="whitespace-nowrap px-4 py-3 font-medium">{t("status")}</th>
              <th className="whitespace-nowrap px-4 py-3 font-medium">{t("emailAttempts")}</th>
              <th className="px-4 py-3 font-medium">{t("emailProviderId")}</th>
              <th className="px-4 py-3 font-medium">{t("emailLastError")}</th>
            </tr>
          </thead>
          <tbody>
            {attempts.length === 0 ? (
              <tr><td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">{t("emailNoResults")}</td></tr>
            ) : attempts.map((attempt) => {
              const delivery = attempt.delivery;
              const invitation = delivery.invitation;
              const coupleName = [invitation?.content?.groomFullName, invitation?.content?.brideFullName]
                .map((name) => name?.trim())
                .filter(Boolean)
                .join(" & ");
              return (
                <tr key={attempt.id} className="border-b border-border align-top last:border-0">
                  <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">{formatVietnamDateTimeShort(attempt.attemptedAt)}</td>
                  <td className="px-4 py-3">
                    <span className="block font-medium text-foreground">{delivery.recipientEmail}</span>
                    {delivery.recipientName ? <span className="block text-xs text-muted-foreground">{delivery.recipientName}</span> : null}
                    {delivery.user && delivery.userId ? <Link href={`/admin/users/${delivery.userId}`} className="mt-1 block text-xs text-primary hover:underline">{delivery.user.email ?? t("emailNoUser")}</Link> : null}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3">{typeLabel[delivery.type] ?? delivery.type}</td>
                  <td className="px-4 py-3">
                    {invitation ? (
                      <Link href={`/admin/invitations/${invitation.id}/edit`} className="text-primary hover:underline">
                        <span className="block">{coupleName || invitation.templateId}</span>
                        <span className="block text-xs text-muted-foreground">{invitation.templateId}</span>
                      </Link>
                    ) : <span className="whitespace-nowrap rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">{t("emailNoInvitation")}</span>}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3"><span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusClass(attempt.status)}`}>{statusLabel[attempt.status] ?? attempt.status}</span></td>
                  <td className="whitespace-nowrap px-4 py-3 text-center">{delivery.attemptCount}</td>
                  <td className="max-w-48 break-all px-4 py-3 font-mono text-xs text-muted-foreground">{attempt.providerMessageId ?? "—"}</td>
                  <td className="max-w-xs px-4 py-3 text-xs text-rose-700">{attempt.errorMessage ?? "—"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </AdminTableScroller>

      <AdminPagination pagination={pagination} basePath="/admin/email-logs" params={listParams} />
    </div>
  );
}

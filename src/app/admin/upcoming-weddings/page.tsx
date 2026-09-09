import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";

import { AdminPagination, AdminPerPageField } from "@/components/admin-pagination";
import { AdminTableScroller } from "@/components/admin-table-scroller";
import { REAL_INVITATION_WHERE } from "@/lib/admin-invitation-filters";
import { verifyAdmin } from "@/lib/admin-dal";
import { adminPageWindow, adminResetHref, parsePage, parsePerPage } from "@/lib/admin-pagination";
import {
  daysUntilWedding,
  parseWeddingDate,
  parseWeddingPaymentFilter,
  parseWeddingRange,
  sortUpcomingWeddings,
  weddingMatchesFilters,
} from "@/lib/admin-upcoming-weddings";
import { vietnamDayKey } from "@/lib/datetime";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "Ngày cưới sắp tới | Quản trị",
  robots: { index: false, follow: false },
};

const inputClass =
  "rounded-lg border border-border bg-background px-3 py-1.5 text-sm text-foreground outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20";

const weddingDateFormatter = new Intl.DateTimeFormat("vi-VN", {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});

export default async function AdminUpcomingWeddingsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; payment?: string; range?: string; page?: string; perPage?: string }>;
}) {
  await verifyAdmin();

  const params = await searchParams;
  const search = (params.q ?? "").trim().slice(0, 120);
  const payment = parseWeddingPaymentFilter(params.payment);
  const range = parseWeddingRange(params.range);
  const requestedPage = parsePage(params.page);
  const perPage = parsePerPage(params.perPage);
  const today = vietnamDayKey(new Date());
  const t = await getTranslations("adminSupport");

  const invitations = await prisma.invitation.findMany({
    where: REAL_INVITATION_WHERE,
    select: {
      id: true,
      slug: true,
      status: true,
      paid: true,
      complimentary: true,
      user: { select: { id: true, email: true } },
      content: {
        select: {
          brideFullName: true,
          groomFullName: true,
          date: true,
          time: true,
          banquetTime: true,
          address: true,
        },
      },
    },
  });

  const filteredInvitations = invitations.filter((invitation) =>
    weddingMatchesFilters(invitation, { today, range, payment, search }),
  );
  const allRows = sortUpcomingWeddings(filteredInvitations).map((invitation) => {
    const eventDate = invitation.content?.date?.trim() ?? "";
    return {
      invitation,
      eventDate,
      eventTime: invitation.content?.banquetTime || invitation.content?.time || "",
      groom: invitation.content?.groomFullName?.trim() ?? "",
      bride: invitation.content?.brideFullName?.trim() ?? "",
      email: invitation.user.email ?? "",
      address: invitation.content?.address?.trim() ?? "",
      daysLeft: daysUntilWedding(parseWeddingDate(eventDate)!, today),
    };
  });

  const pagination = adminPageWindow(allRows.length, requestedPage, perPage);
  const rows = allRows.slice(pagination.skip, pagination.skip + pagination.pageSize);

  const isFiltered = Boolean(search) || payment !== "all" || range !== "all";
  const paymentLabel = (paid: boolean, complimentary: boolean) =>
    paid ? t("upcomingWeddingsPaid") : complimentary ? t("complimentary") : t("upcomingWeddingsUnpaid");

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <h1 className="font-heading text-2xl text-foreground">
            {t("upcomingWeddingsTitle", { count: pagination.total })}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">{t("upcomingWeddingsDescription")}</p>
        </div>
        <p className="text-sm text-muted-foreground">
          {t("upcomingWeddingsTotal", { count: pagination.total })}
        </p>
      </div>

      <form method="GET" className="flex flex-wrap items-end gap-3">
        <AdminPerPageField pageSize={pagination.pageSize} />
        <div className="flex flex-col gap-1">
          <label htmlFor="upcoming-search" className="text-xs text-muted-foreground">
            {t("upcomingWeddingsSearchLabel")}
          </label>
          <input
            id="upcoming-search"
            name="q"
            type="search"
            defaultValue={search}
            placeholder={t("upcomingWeddingsSearchPlaceholder")}
            className={`w-72 ${inputClass}`}
          />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="upcoming-payment" className="text-xs text-muted-foreground">
            {t("upcomingWeddingsPaymentStatus")}
          </label>
          <select id="upcoming-payment" name="payment" defaultValue={payment} className={inputClass}>
            <option value="all">{t("filterAll")}</option>
            <option value="paid">{t("upcomingWeddingsPaid")}</option>
            <option value="unpaid">{t("upcomingWeddingsUnpaid")}</option>
            <option value="complimentary">{t("complimentary")}</option>
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="upcoming-range" className="text-xs text-muted-foreground">
            {t("upcomingWeddingsRangeLabel")}
          </label>
          <select id="upcoming-range" name="range" defaultValue={String(range)} className={inputClass}>
            <option value="all">{t("filterAll")}</option>
            {[7, 30, 90].map((days) => (
              <option key={days} value={days}>{t("upcomingWeddingsRangeOption", { days })}</option>
            ))}
          </select>
        </div>
        <button type="submit" className="rounded-lg bg-primary px-4 py-1.5 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90">
          {t("filterButton")}
        </button>
        {isFiltered ? (
          <Link href={adminResetHref("/admin/upcoming-weddings", pagination.pageSize)} className="rounded-lg border border-border px-3 py-1.5 text-sm text-muted-foreground transition hover:bg-secondary">
            {t("clearFilters")}
          </Link>
        ) : null}
      </form>

      <AdminTableScroller>
        <table className="w-full text-sm">
          <thead className="border-b border-border bg-muted/40 text-left text-muted-foreground">
            <tr>
              <th className="whitespace-nowrap px-4 py-3 font-medium">{t("upcomingWeddingsDate")}</th>
              <th className="px-4 py-3 font-medium">{t("upcomingWeddingsCouple")}</th>
              <th className="px-4 py-3 font-medium">{t("upcomingWeddingsOwner")}</th>
              <th className="whitespace-nowrap px-4 py-3 font-medium">{t("upcomingWeddingsPaymentStatus")}</th>
              <th className="whitespace-nowrap px-4 py-3 font-medium">{t("upcomingWeddingsInvitationStatus")}</th>
              <th className="whitespace-nowrap px-4 py-3 font-medium">{t("upcomingWeddingsActions")}</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">{isFiltered ? t("upcomingWeddingsNoResults") : t("upcomingWeddingsEmpty")}</td></tr>
            ) : rows.map(({ invitation, eventDate, eventTime, groom, bride, email, address, daysLeft }) => (
              <tr key={invitation.id} className="border-b border-border last:border-0">
                <td className="whitespace-nowrap px-4 py-3 align-top">
                  <span className="block font-semibold text-foreground">{weddingDateFormatter.format(new Date(`${eventDate}T00:00:00.000Z`))}</span>
                  <span className={`mt-1 block text-xs ${daysLeft <= 7 ? "font-semibold text-rose-700" : "text-muted-foreground"}`}>
                    {daysLeft === 0
                      ? t("upcomingWeddingsToday")
                      : daysLeft === 1
                        ? t("upcomingWeddingsTomorrow")
                        : t("upcomingWeddingsDaysLeft", { count: daysLeft })}
                  </span>
                  {eventTime ? <span className="mt-1 block text-xs text-muted-foreground">{eventTime}</span> : null}
                </td>
                <td className="px-4 py-3 align-top">
                  {groom || bride ? <>{groom ? <span className="block">{groom}</span> : null}{bride ? <span className="block">{bride}</span> : null}</> : <span className="text-muted-foreground">{t("coupleFallback", { id: invitation.id.slice(-6) })}</span>}
                  {address ? <span className="mt-1 block max-w-xs text-xs text-muted-foreground">{address}</span> : null}
                </td>
                <td className="px-4 py-3 align-top">{email ? <Link href={`/admin/users/${invitation.user.id}`} className="text-primary hover:underline">{email}</Link> : <span className="text-xs text-muted-foreground">{t("noEmailBadge")}</span>}</td>
                <td className="px-4 py-3 align-top"><span className={`whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium ${invitation.paid || invitation.complimentary ? "bg-emerald-500/15 text-emerald-700" : "bg-amber-500/15 text-amber-700"}`}>{paymentLabel(invitation.paid, invitation.complimentary)}</span></td>
                <td className="px-4 py-3 align-top"><span className={`whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium ${invitation.status === "published" ? "bg-emerald-500/15 text-emerald-700" : "bg-muted text-muted-foreground"}`}>{invitation.status === "published" ? t("upcomingWeddingsPublished") : t("upcomingWeddingsDraft")}</span></td>
                <td className="whitespace-nowrap px-4 py-3 align-top"><Link href={`/admin/invitations/${invitation.id}/edit`} className="text-primary hover:underline">{t("upcomingWeddingsEditInvitation")}</Link>{invitation.status === "published" && invitation.slug ? <Link href={`/thiep/${invitation.slug}`} target="_blank" rel="noreferrer" className="ml-3 text-primary hover:underline">{t("upcomingWeddingsViewInvitation")}</Link> : null}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </AdminTableScroller>

      <AdminPagination
        pagination={pagination}
        basePath="/admin/upcoming-weddings"
        params={{
          q: search || undefined,
          payment: payment === "all" ? undefined : payment,
          range: range === "all" ? undefined : String(range),
        }}
      />
    </div>
  );
}

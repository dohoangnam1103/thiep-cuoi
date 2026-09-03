import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";

import { AdminPagination, AdminPerPageField } from "@/components/admin-pagination";
import { AdminTableScroller } from "@/components/admin-table-scroller";
import { verifyAdmin } from "@/lib/admin-dal";
import { CUSTOMER_USER_WHERE } from "@/lib/admin-invitation-filters";
import { adminPageWindow, adminResetHref, parsePage, parsePerPage } from "@/lib/admin-pagination";
import { parseUserSearch } from "@/lib/admin-support-input";
import { formatVietnamDate } from "@/lib/datetime";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "Người dùng | Quản trị",
  robots: { index: false, follow: false },
};

const formatDate = formatVietnamDate;

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string; perPage?: string }>;
}) {
  await verifyAdmin();
  const { q, page, perPage } = await searchParams;
  const search = parseUserSearch(q);
  const t = await getTranslations("adminSupport");

  // `CUSTOMER_USER_WHERE` spells out the `email = null` branch, which is the
  // only form that keeps anonymous accounts in the list — see its comment.
  const where = {
    ...CUSTOMER_USER_WHERE,
    ...(search ? { email: { contains: search } } : {}),
  };

  // Đếm trước rồi mới lấy trang: `adminPageWindow` cần tổng để co số trang từ
  // URL về khoảng hợp lệ, nếu không một link cũ sẽ cho ra bảng rỗng.
  const total = await prisma.user.count({ where });
  const pagination = adminPageWindow(total, parsePage(page), parsePerPage(perPage));

  const users = await prisma.user.findMany({
    where,
    orderBy: { createdAt: "desc" },
    skip: pagination.skip,
    take: pagination.take,
    select: {
      id: true,
      email: true,
      createdAt: true,
      _count: { select: { invitations: true } },
    },
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h1 className="font-heading text-2xl font-semibold text-foreground">
          {t("usersTitle", { count: total })}
        </h1>
        <form method="GET" className="flex flex-wrap items-center gap-2">
          <AdminPerPageField pageSize={pagination.pageSize} />
          <label htmlFor="admin-user-search" className="text-sm text-muted-foreground">
            {t("searchLabel")}
          </label>
          <input
            id="admin-user-search"
            name="q"
            type="search"
            defaultValue={search}
            placeholder={t("searchPlaceholder")}
            className="w-64 rounded-lg border border-border bg-background px-3 py-1.5 text-sm text-foreground outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20"
          />
          <button
            type="submit"
            className="rounded-lg bg-primary px-4 py-1.5 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90"
          >
            {t("searchButton")}
          </button>
          {search ? (
            <Link
              href={adminResetHref("/admin/users", pagination.pageSize)}
              className="rounded-lg border border-border px-3 py-1.5 text-sm text-muted-foreground transition hover:bg-secondary"
            >
              {t("clearSearch")}
            </Link>
          ) : null}
        </form>
      </div>

      <AdminTableScroller>
        <table className="w-full text-sm">
          <thead className="border-b border-border bg-muted/40 text-left text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-medium">Email</th>
              <th className="px-4 py-3 font-medium">{t("registeredAt")}</th>
              <th className="px-4 py-3 font-medium">{t("invitationCount")}</th>
            </tr>
          </thead>
          <tbody>
            {users.length === 0 ? (
              <tr>
                <td colSpan={3} className="px-4 py-6 text-center text-muted-foreground">
                  {search ? t("noSearchResults") : t("noUsers")}
                </td>
              </tr>
            ) : (
              users.map((user) => (
                <tr key={user.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/users/${user.id}`}
                      className="font-medium text-primary hover:underline"
                    >
                      {user.email ?? t("userFallback")}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{formatDate(user.createdAt)}</td>
                  <td className="px-4 py-3">{user._count.invitations}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </AdminTableScroller>

      <AdminPagination
        pagination={pagination}
        basePath="/admin/users"
        params={{ q: search || undefined }}
      />
    </div>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";

import { verifyAdmin } from "@/lib/admin-dal";
import { parseUserSearch, SYSTEM_EMAIL } from "@/lib/admin-support-input";
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
  searchParams: Promise<{ q?: string }>;
}) {
  await verifyAdmin();
  const { q } = await searchParams;
  const search = parseUserSearch(q);
  const t = await getTranslations("adminSupport");

  // `NOT: { email: SYSTEM_EMAIL }` is intentional: it keeps `email = null`
  // users in the list. `email: { not: SYSTEM_EMAIL }` would drop them due to
  // SQL/Prisma null semantics.
  const users = await prisma.user.findMany({
    where: {
      NOT: { email: SYSTEM_EMAIL },
      ...(search ? { email: { contains: search } } : {}),
    },
    orderBy: { createdAt: "desc" },
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
          {t("usersTitle", { count: users.length })}
        </h1>
        <form method="GET" className="flex flex-wrap items-center gap-2">
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
              href="/admin/users"
              className="rounded-lg border border-border px-3 py-1.5 text-sm text-muted-foreground transition hover:bg-secondary"
            >
              {t("clearSearch")}
            </Link>
          ) : null}
        </form>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-border bg-background">
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
      </div>
    </div>
  );
}

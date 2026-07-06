import Link from "next/link";

import { verifySession } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { templateLabel } from "@/app/editor/[id]/templates";
import { logout } from "../(auth)/actions";
import { createInvitation } from "./actions";

export default async function DashboardPage() {
  const { userId } = await verifySession();

  const invitations = await prisma.invitation.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: {
      content: { select: { brideFullName: true, groomFullName: true } },
      _count: { select: { rsvps: true, wishes: true } },
    },
  });

  return (
    <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <div className="flex items-center justify-between">
        <h1 className="font-pattaya text-3xl text-foreground">Thiệp của tôi</h1>
        <form action={logout}>
          <button
            type="submit"
            className="rounded-full border border-border px-4 py-2 text-sm font-medium text-muted-foreground transition hover:bg-secondary"
          >
            Đăng xuất
          </button>
        </form>
      </div>

      <form action={createInvitation} className="mt-6">
        <button
          type="submit"
          className="rounded-full bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground shadow-lg shadow-primary/25 transition hover:bg-primary/90"
        >
          + Tạo thiệp mới
        </button>
      </form>

      {invitations.length === 0 ? (
        <p className="mt-12 text-center text-muted-foreground">
          Bạn chưa có thiệp nào. Nhấn &quot;Tạo thiệp mới&quot; để bắt đầu.
        </p>
      ) : (
        <ul className="mt-8 grid gap-4 sm:grid-cols-2">
          {invitations.map((inv) => {
            const bride = inv.content?.brideFullName?.trim();
            const groom = inv.content?.groomFullName?.trim();
            const names = [groom, bride].filter(Boolean).join(" & ");
            const label = names || templateLabel(inv.templateId);
            const published = inv.status === "published";
            return (
              <li
                key={inv.id}
                className="rounded-2xl border border-border bg-card p-5 shadow"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="font-heading text-lg font-semibold text-foreground">{label}</h2>
                    {names ? (
                      <p className="mt-0.5 text-sm text-muted-foreground">{templateLabel(inv.templateId)}</p>
                    ) : null}
                  </div>
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                      published
                        ? "bg-green-500/15 text-green-700"
                        : "bg-amber-500/15 text-amber-700"
                    }`}
                  >
                    {published ? "Đã xuất bản" : "Bản nháp"}
                  </span>
                </div>

                <div className="mt-4 flex gap-4 text-sm text-muted-foreground">
                  <span>{inv._count.rsvps} xác nhận</span>
                  <span>{inv._count.wishes} lời chúc</span>
                </div>

                <div className="mt-4 flex flex-wrap gap-2 text-sm">
                  <Link
                    href={`/editor/${inv.id}`}
                    className="rounded-full bg-secondary px-4 py-1.5 font-medium text-secondary-foreground transition hover:bg-muted"
                  >
                    Chỉnh sửa
                  </Link>
                  <Link
                    href={`/dashboard/${inv.id}/rsvp`}
                    className="rounded-full bg-secondary px-4 py-1.5 font-medium text-secondary-foreground transition hover:bg-muted"
                  >
                    Xem xác nhận
                  </Link>
                  <Link
                    href={`/dashboard/${inv.id}/guests`}
                    className="rounded-full bg-secondary px-4 py-1.5 font-medium text-secondary-foreground transition hover:bg-muted"
                  >
                    Khách mời
                  </Link>
                  {published && inv.slug ? (
                    <Link
                      href={`/thiep/${inv.slug}`}
                      className="rounded-full bg-primary px-4 py-1.5 font-medium text-primary-foreground transition hover:bg-primary/90"
                    >
                      Xem thiệp
                    </Link>
                  ) : null}
                  {inv.paid ? (
                    <span className="rounded-full bg-green-500/15 px-4 py-1.5 font-medium text-green-700">
                      Đã thanh toán
                    </span>
                  ) : (
                    <Link
                      href={`/dashboard/${inv.id}/thanh-toan`}
                      className="rounded-full bg-primary px-4 py-1.5 font-medium text-primary-foreground transition hover:bg-primary/90"
                    >
                      Thanh toán
                    </Link>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}

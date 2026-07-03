import Link from "next/link";
import { notFound } from "next/navigation";

import { verifySession, ownInvitation } from "@/lib/dal";
import { prisma } from "@/lib/prisma";

export default async function RsvpListPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { userId } = await verifySession();
  const invitation = await ownInvitation(id, userId);
  if (!invitation) notFound();

  const [rsvps, wishes] = await Promise.all([
    prisma.rsvp.findMany({
      where: { invitationId: id },
      orderBy: { createdAt: "desc" },
      include: { guest: { select: { name: true } } },
    }),
    prisma.wish.findMany({ where: { invitationId: id }, orderBy: { createdAt: "desc" } }),
  ]);

  const attending = rsvps.filter((r) => r.attending);
  const totalGuests = attending.reduce((sum, r) => sum + r.guests, 0);

  return (
    <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <Link href="/dashboard" className="text-sm text-zinc-400 transition hover:text-white">
        &larr; Về danh sách thiệp
      </Link>
      <div className="mt-3 flex items-center justify-between gap-3">
        <h1 className="font-pattaya text-3xl text-white">Xác nhận tham dự</h1>
        <Link
          href={`/dashboard/${id}/guests`}
          className="rounded-full bg-white/10 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/20"
        >
          Khách mời
        </Link>
      </div>

      <div className="mt-6 grid grid-cols-3 gap-4">
        <div className="rounded-2xl border border-white/10 bg-[#1c1512]/80 p-4 text-center">
          <p className="text-2xl font-bold text-white">{attending.length}</p>
          <p className="text-sm text-zinc-400">Sẽ tham dự</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-[#1c1512]/80 p-4 text-center">
          <p className="text-2xl font-bold text-white">{totalGuests}</p>
          <p className="text-sm text-zinc-400">Tổng khách</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-[#1c1512]/80 p-4 text-center">
          <p className="text-2xl font-bold text-white">{wishes.length}</p>
          <p className="text-sm text-zinc-400">Lời chúc</p>
        </div>
      </div>

      <h2 className="mt-10 text-lg font-semibold text-white">Danh sách phản hồi</h2>
      {rsvps.length === 0 ? (
        <p className="mt-4 text-zinc-400">Chưa có phản hồi nào.</p>
      ) : (
        <div className="mt-4 overflow-hidden rounded-2xl border border-white/10">
          <table className="w-full text-left text-sm">
            <thead className="bg-white/5 text-zinc-400">
              <tr>
                <th className="px-4 py-3 font-medium">Tên</th>
                <th className="px-4 py-3 font-medium">Khách mời</th>
                <th className="px-4 py-3 font-medium">Tham dự</th>
                <th className="px-4 py-3 font-medium">Số khách</th>
                <th className="px-4 py-3 font-medium">Nhà</th>
                <th className="px-4 py-3 font-medium">Xe đưa đón</th>
                <th className="px-4 py-3 font-medium">Ăn kiêng</th>
                <th className="px-4 py-3 font-medium">Bài hát</th>
                <th className="px-4 py-3 font-medium">Lời nhắn</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-zinc-200">
              {rsvps.map((r) => (
                <tr key={r.id}>
                  <td className="px-4 py-3">{r.name}</td>
                  <td className="px-4 py-3">{r.guest?.name ?? "—"}</td>
                  <td className="px-4 py-3">
                    {r.attending ? (
                      <span className="text-green-300">Có</span>
                    ) : (
                      <span className="text-zinc-500">Không</span>
                    )}
                  </td>
                  <td className="px-4 py-3">{r.guests}</td>
                  <td className="px-4 py-3">{r.side ?? "—"}</td>
                  <td className="px-4 py-3">{r.shuttle ? "Có" : "—"}</td>
                  <td className="px-4 py-3">{r.dietary ?? "—"}</td>
                  <td className="px-4 py-3">{r.songRequest ?? "—"}</td>
                  <td className="px-4 py-3">{r.message ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <h2 className="mt-10 text-lg font-semibold text-white">Lời chúc</h2>
      {wishes.length === 0 ? (
        <p className="mt-4 text-zinc-400">Chưa có lời chúc nào.</p>
      ) : (
        <ul className="mt-4 space-y-3">
          {wishes.map((w) => (
            <li key={w.id} className="rounded-2xl border border-white/10 bg-[#1c1512]/80 p-4">
              <p className="font-semibold text-white">{w.name}</p>
              <p className="mt-1 text-sm text-zinc-300">{w.text}</p>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}

import Link from "next/link";
import { notFound } from "next/navigation";

import { verifySession, ownInvitation } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { GuestManager, type GuestRow } from "./GuestManager";

export default async function GuestsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { userId } = await verifySession();
  const invitation = await ownInvitation(id, userId);
  if (!invitation) notFound();

  const guests = await prisma.guest.findMany({
    where: { invitationId: id },
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { rsvps: true } } },
  });

  const rows: GuestRow[] = guests.map((g) => ({
    id: g.id,
    token: g.token,
    name: g.name,
    side: g.side,
    role: g.role,
    note: g.note,
    responded: g._count.rsvps > 0,
  }));

  const responded = rows.filter((r) => r.responded).length;

  return (
    <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <Link
        href={`/dashboard/${id}/rsvp`}
        className="text-sm text-muted-foreground transition hover:text-foreground"
      >
        &larr; Về xác nhận tham dự
      </Link>
      <h1 className="mt-3 font-pattaya text-3xl text-foreground">Khách mời</h1>

      <div className="mt-6 grid grid-cols-2 gap-4">
        <div className="rounded-2xl border border-border bg-card p-4 text-center">
          <p className="text-2xl font-bold text-foreground">{rows.length}</p>
          <p className="text-sm text-muted-foreground">Tổng khách mời</p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-4 text-center">
          <p className="text-2xl font-bold text-foreground">{responded}</p>
          <p className="text-sm text-muted-foreground">Đã phản hồi</p>
        </div>
      </div>

      <GuestManager invitationId={id} slug={invitation.slug} guests={rows} />
    </main>
  );
}

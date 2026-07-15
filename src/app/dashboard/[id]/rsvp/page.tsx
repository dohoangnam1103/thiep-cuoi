import Link from "next/link";
import { notFound } from "next/navigation";

import { verifySession, ownInvitation } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import viMessages from "../../../../../messages/vi.json";
import { guestMediaPublicUrl } from "@/lib/guest-media";
import { ModerationPanel } from "./ModerationPanel";

export default async function RsvpListPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { userId } = await verifySession();
  const invitation = await ownInvitation(id, userId);
  if (!invitation) notFound();

  const [rsvps, wishes, guestMedia] = await Promise.all([
    prisma.rsvp.findMany({
      where: { invitationId: id },
      orderBy: { createdAt: "desc" },
      include: {
        guest: { select: { name: true } },
        answers: {
          include: { question: { select: { label: true, type: true } } },
          orderBy: { question: { sortOrder: "asc" } },
        },
      },
    }),
    prisma.wish.findMany({ where: { invitationId: id }, orderBy: { createdAt: "desc" } }),
    prisma.guestMedia.findMany({ where: { invitationId: id }, orderBy: { createdAt: "desc" } }),
  ]);

  const attending = rsvps.filter((r) => r.attending);
  const declined = rsvps.filter((r) => !r.attending);
  const totalGuests = attending.reduce((sum, r) => sum + r.guests, 0);
  const groomGuests = attending
    .filter((r) => r.side === "Nhà trai")
    .reduce((sum, r) => sum + r.guests, 0);
  const brideGuests = attending
    .filter((r) => r.side === "Nhà gái")
    .reduce((sum, r) => sum + r.guests, 0);
  const answerLabels = viMessages.guestManager.rsvpAnswers;
  const moderationLabels = viMessages.guestManager.moderation;

  return (
    <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <Link href="/dashboard" className="text-sm text-muted-foreground transition hover:text-foreground">
        &larr; Về danh sách thiệp
      </Link>
      <div className="mt-3 flex items-center justify-between gap-3">
        <h1 className="font-pattaya text-3xl text-foreground">Xác nhận tham dự</h1>
        <Link
          href={`/dashboard/${id}/guests`}
          className="rounded-full bg-secondary px-4 py-2 text-sm font-medium text-secondary-foreground transition hover:bg-muted"
        >
          Khách mời
        </Link>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        <div className="rounded-2xl border border-border bg-card p-4 text-center">
          <p className="text-2xl font-bold text-green-700">{attending.length}</p>
          <p className="text-sm text-muted-foreground">Sẽ tham dự</p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-4 text-center">
          <p className="text-2xl font-bold text-red-600">{declined.length}</p>
          <p className="text-sm text-muted-foreground">Không tham dự</p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-4 text-center">
          <p className="text-2xl font-bold text-foreground">{totalGuests}</p>
          <p className="text-sm text-muted-foreground">Tổng khách</p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-4 text-center">
          <p className="text-2xl font-bold text-foreground">{groomGuests}</p>
          <p className="text-sm text-muted-foreground">Khách nhà trai</p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-4 text-center">
          <p className="text-2xl font-bold text-foreground">{brideGuests}</p>
          <p className="text-sm text-muted-foreground">Khách nhà gái</p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-4 text-center">
          <p className="text-2xl font-bold text-foreground">{wishes.length}</p>
          <p className="text-sm text-muted-foreground">Lời chúc</p>
        </div>
      </div>

      <h2 className="mt-10 font-heading text-lg font-semibold text-foreground">Danh sách phản hồi</h2>
      {rsvps.length === 0 ? (
        <p className="mt-4 text-muted-foreground">Chưa có phản hồi nào.</p>
      ) : (
        <div className="mt-4 overflow-hidden rounded-2xl border border-border">
          <table className="w-full text-left text-sm">
            <thead className="bg-secondary text-secondary-foreground">
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
                <th className="px-4 py-3 font-medium">{answerLabels.column}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border text-foreground">
              {rsvps.map((r) => (
                <tr key={r.id} className="transition hover:bg-muted">
                  <td className="px-4 py-3">{r.name}</td>
                  <td className="px-4 py-3">{r.guest?.name ?? "—"}</td>
                  <td className="px-4 py-3">
                    {r.attending ? (
                      <span className="text-green-700">Có</span>
                    ) : (
                      <span className="text-muted-foreground">Không</span>
                    )}
                  </td>
                  <td className="px-4 py-3">{r.guests}</td>
                  <td className="px-4 py-3">{r.side ?? "—"}</td>
                  <td className="px-4 py-3">{r.shuttle ? "Có" : "—"}</td>
                  <td className="px-4 py-3">{r.dietary ?? "—"}</td>
                  <td className="px-4 py-3">{r.songRequest ?? "—"}</td>
                  <td className="px-4 py-3">{r.message ?? "—"}</td>
                  <td className="px-4 py-3">
                    {r.answers.length > 0 ? (
                      <ul className="min-w-48 space-y-1.5">
                        {r.answers.map((answer) => (
                          <li key={answer.id} className="text-xs">
                            <span className="font-medium text-foreground">{answer.question.label}:</span>{" "}
                            <span className="text-muted-foreground">
                              {answer.question.type === "boolean"
                                ? answer.value === "yes" ? answerLabels.yes : answerLabels.no
                                : answer.value}
                            </span>
                          </li>
                        ))}
                      </ul>
                    ) : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <ModerationPanel
        invitationId={id}
        initialWishes={wishes.map((wish) => ({ ...wish, createdAt: wish.createdAt.toISOString() }))}
        initialMedia={guestMedia.map((item) => ({
          id: item.id,
          contributorName: item.contributorName,
          originalName: item.originalName,
          kind: item.kind,
          size: item.size,
          url: invitation.slug ? guestMediaPublicUrl(invitation.slug, item.id) : "",
        }))}
        labels={moderationLabels}
      />
    </main>
  );
}

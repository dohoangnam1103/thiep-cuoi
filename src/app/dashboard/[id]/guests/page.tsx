import Link from "next/link";
import { notFound } from "next/navigation";
import { NextIntlClientProvider } from "next-intl";

import { verifySession, ownInvitation } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { GuestManager, type GuestRow } from "./GuestManager";
import { RsvpQuestionBuilder } from "./RsvpQuestionBuilder";
import { CohostAccess } from "./CohostAccess";
import viMessages from "../../../../../messages/vi.json";

export default async function GuestsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { userId } = await verifySession();
  const invitation = await ownInvitation(id, userId);
  if (!invitation) notFound();

  const [guests, questions] = await Promise.all([
    prisma.guest.findMany({
      where: { invitationId: id },
      orderBy: { createdAt: "desc" },
      include: {
        rsvps: {
          orderBy: { createdAt: "desc" },
          take: 1,
          select: { attending: true, guests: true, createdAt: true },
        },
      },
    }),
    prisma.rsvpQuestion.findMany({
      where: { invitationId: id },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    }),
  ]);

  const rows: GuestRow[] = guests.map((g) => ({
    id: g.id,
    token: g.token,
    name: g.name,
    side: g.side ?? "",
    role: g.role ?? "",
    groupName: g.groupName ?? "",
    tableName: g.tableName ?? "",
    phone: g.phone ?? "",
    email: g.email ?? "",
    greeting: g.greeting ?? "",
    maxGuests: g.maxGuests,
    giftAmount: g.giftAmount,
    note: g.note ?? "",
    responded: g.rsvps.length > 0,
    latestRsvp: g.rsvps[0]
      ? {
          attending: g.rsvps[0].attending,
          guests: g.rsvps[0].guests,
          createdAt: g.rsvps[0].createdAt.toISOString(),
        }
      : null,
  }));

  const responded = rows.filter((r) => r.responded).length;
  const attending = rows.filter((r) => r.latestRsvp?.attending).length;
  const declined = rows.filter((r) => r.latestRsvp?.attending === false).length;
  const expectedGuests = rows.reduce((total, row) => total + row.maxGuests, 0);
  const labels = viMessages.guestManager;
  const questionRows = questions.map((question) => {
    let options: string[] = [];
    if (question.options) {
      try {
        const parsed: unknown = JSON.parse(question.options);
        if (Array.isArray(parsed) && parsed.every((option) => typeof option === "string")) {
          options = parsed;
        }
      } catch {
        options = [];
      }
    }
    return {
      id: question.id,
      label: question.label,
      type: question.type as "text" | "boolean" | "select",
      required: question.required,
      options,
      sortOrder: question.sortOrder,
    };
  });

  return (
    <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <Link
        href={`/dashboard/${id}/rsvp`}
        className="text-sm text-muted-foreground transition hover:text-foreground"
      >
        &larr; {labels.back}
      </Link>
      <h1 className="mt-3 font-pattaya text-3xl text-foreground">{labels.title}</h1>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">{labels.subtitle}</p>

      <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-5">
        <div className="rounded-2xl border border-border bg-card p-4 text-center">
          <p className="text-2xl font-bold text-foreground">{rows.length}</p>
          <p className="text-sm text-muted-foreground">{labels.stats.total}</p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-4 text-center">
          <p className="text-2xl font-bold text-foreground">{responded}</p>
          <p className="text-sm text-muted-foreground">{labels.stats.responded}</p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-4 text-center">
          <p className="text-2xl font-bold text-emerald-700">{attending}</p>
          <p className="text-sm text-muted-foreground">{labels.stats.attending}</p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-4 text-center">
          <p className="text-2xl font-bold text-destructive">{declined}</p>
          <p className="text-sm text-muted-foreground">{labels.stats.declined}</p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-4 text-center">
          <p className="text-2xl font-bold text-foreground">{expectedGuests}</p>
          <p className="text-sm text-muted-foreground">{labels.stats.expected}</p>
        </div>
      </div>

      <NextIntlClientProvider locale="vi" messages={{ guestManager: labels }}>
        <GuestManager invitationId={id} slug={invitation.slug} guests={rows} />
        <RsvpQuestionBuilder invitationId={id} questions={questionRows} />
        <CohostAccess
          invitationId={id}
          initialToken={invitation.guestManagerToken}
          published={invitation.status === "published" && Boolean(invitation.slug)}
        />
      </NextIntlClientProvider>
    </main>
  );
}

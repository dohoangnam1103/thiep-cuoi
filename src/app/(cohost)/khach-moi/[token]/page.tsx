import { NextIntlClientProvider } from "next-intl";
import { notFound } from "next/navigation";

import { GuestManager, type GuestRow } from "@/app/dashboard/[id]/guests/GuestManager";
import { prisma } from "@/lib/prisma";
import viMessages from "../../../../../messages/vi.json";

export default async function CohostGuestPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const invitation = await prisma.invitation.findFirst({
    where: { guestManagerToken: token, status: "published" },
    select: {
      id: true,
      slug: true,
      content: { select: { brideShortName: true, groomShortName: true, brideFullName: true, groomFullName: true } },
      guests: {
        orderBy: { createdAt: "desc" },
        include: {
          rsvps: {
            orderBy: { createdAt: "desc" },
            take: 1,
            select: { attending: true, guests: true, createdAt: true },
          },
        },
      },
    },
  });
  if (!invitation?.slug) notFound();

  const rows: GuestRow[] = invitation.guests.map((guest) => ({
    id: guest.id,
    token: guest.token,
    name: guest.name,
    side: guest.side ?? "",
    role: guest.role ?? "",
    groupName: guest.groupName ?? "",
    tableName: guest.tableName ?? "",
    phone: guest.phone ?? "",
    email: guest.email ?? "",
    greeting: guest.greeting ?? "",
    maxGuests: guest.maxGuests,
    giftAmount: guest.giftAmount,
    note: guest.note ?? "",
    responded: guest.rsvps.length > 0,
    latestRsvp: guest.rsvps[0]
      ? {
          attending: guest.rsvps[0].attending,
          guests: guest.rsvps[0].guests,
          createdAt: guest.rsvps[0].createdAt.toISOString(),
        }
      : null,
  }));

  const groom = invitation.content?.groomShortName || invitation.content?.groomFullName;
  const bride = invitation.content?.brideShortName || invitation.content?.brideFullName;
  const couple = [groom, bride].filter(Boolean).join(" & ");
  const labels = viMessages.guestManager;

  return (
    <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <div className="rounded-2xl border border-primary/20 bg-primary/[0.05] px-5 py-4">
        <p className="font-heading text-xl font-semibold text-foreground">{labels.cohost.pageTitle}</p>
        <p className="mt-1 text-sm text-muted-foreground">{labels.cohost.pageDescription.replace("{couple}", couple || labels.cohost.coupleFallback)}</p>
      </div>
      <NextIntlClientProvider locale="vi" messages={{ guestManager: labels }}>
        <GuestManager invitationId={invitation.id} slug={invitation.slug} guests={rows} accessToken={token} />
      </NextIntlClientProvider>
    </main>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ChungDoiDemo } from "@/components/chungdoi-demo";
import { templates } from "@/data/chungdoi";
import { prisma } from "@/lib/prisma";
import { FREE_TRIAL_DAYS } from "@/lib/payment";
import { toDemoContent } from "@/lib/to-demo-content";
import { submitRsvp, submitWish } from "./actions";

function isExpired(paid: boolean, publishedAt: Date | null): boolean {
  if (paid) return false;
  if (!publishedAt) return false;
  const deadline = publishedAt.getTime() + FREE_TRIAL_DAYS * 24 * 60 * 60 * 1000;
  return Date.now() > deadline;
}

async function loadPublished(slug: string) {
  return prisma.invitation.findFirst({
    where: { slug, status: "published" },
    include: { content: true, schedule: true, gallery: true, wishes: { orderBy: { createdAt: "desc" } } },
  });
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const invitation = await loadPublished(slug);
  if (!invitation?.content) {
    return { title: "Thiệp cưới | Thiệp Mừng Online" };
  }

  const { brideShortName, groomShortName, brideFullName, groomFullName } = invitation.content;
  const bride = brideShortName || brideFullName;
  const groom = groomShortName || groomFullName;
  const title = bride && groom ? `Đám cưới ${groom} & ${bride}` : "Thiệp cưới";
  const firstPhoto = invitation.gallery[0]?.url;

  return {
    title: `${title} | Thiệp Mừng Online`,
    description: `Trân trọng kính mời bạn đến chung vui trong ngày cưới của ${groom} & ${bride}.`,
    openGraph: {
      title,
      images: firstPhoto ? [firstPhoto] : undefined,
    },
  };
}

export default async function PublicInvitationPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ g?: string }>;
}) {
  const { slug } = await params;
  const { g } = await searchParams;
  const invitation = await loadPublished(slug);
  if (!invitation) notFound();

  if (isExpired(invitation.paid, invitation.publishedAt)) {
    return (
      <main className="mx-auto flex min-h-screen max-w-lg flex-col items-center justify-center px-4 text-center">
        <div className="rounded-3xl border border-border bg-card p-10 shadow">
          <h1 className="font-heading text-2xl font-semibold text-foreground">
            Thiệp đã hết hạn dùng thử
          </h1>
          <p className="mt-3 text-muted-foreground">
            Thiệp này đã hết {FREE_TRIAL_DAYS} ngày dùng thử miễn phí. Vui lòng thanh toán để
            kích hoạt vĩnh viễn.
          </p>
          <Link
            href={`/dashboard/${invitation.id}/thanh-toan`}
            className="mt-6 inline-block rounded-full bg-primary px-6 py-3 text-sm font-bold text-primary-foreground shadow-lg shadow-primary/25 transition hover:bg-primary/90"
          >
            Gia hạn / Thanh toán
          </Link>
        </div>
      </main>
    );
  }

  const template = templates.find((t) => t.slug === invitation.templateId) ?? templates[0];
  const content = toDemoContent(invitation);

  const guestRecord = g
    ? await prisma.guest.findUnique({
        where: { token: g },
        select: { id: true, name: true, side: true, role: true, invitationId: true },
      })
    : null;
  const guest =
    g && guestRecord && guestRecord.invitationId === invitation.id
      ? { token: g, name: guestRecord.name, side: guestRecord.side, role: guestRecord.role }
      : null;

  const submitWishForSlug = submitWish.bind(null, slug);
  const submitRsvpForSlug = submitRsvp.bind(null, slug);

  return (
    <ChungDoiDemo
      template={template}
      content={content}
      liveForms={{ wishAction: submitWishForSlug, rsvpAction: submitRsvpForSlug, guest }}
    />
  );
}

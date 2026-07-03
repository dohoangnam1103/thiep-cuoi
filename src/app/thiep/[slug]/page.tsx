import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ChungDoiDemo } from "@/components/chungdoi-demo";
import { templates } from "@/data/chungdoi";
import { prisma } from "@/lib/prisma";
import { toDemoContent } from "@/lib/to-demo-content";
import { submitRsvp, submitWish } from "./actions";

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

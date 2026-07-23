import type { Metadata } from "next";
import { hasLocale } from "next-intl";
import { getTranslations } from "next-intl/server";
import { LayoutDashboard } from "lucide-react";
import { cookies } from "next/headers";
import Link from "next/link";
import { notFound } from "next/navigation";

import { AnalyticsEventOnView } from "@/components/analytics-interactions";
import { ChungDoiDemo } from "@/components/chungdoi-demo";
import { templates } from "@/data/chungdoi";
import { routing } from "@/i18n/routing";
import { getCurrentUserId } from "@/lib/dal";
import { resolveCoupleNames } from "@/lib/og-image";
import { prisma } from "@/lib/prisma";
import { loadPublished } from "@/lib/published-invitation";
import { FREE_TRIAL_DAYS } from "@/lib/payment";
import { SITE_URL } from "@/lib/site-url";
import { toDemoContent } from "@/lib/to-demo-content";
import { submitRsvp, submitWish } from "./actions";

function isExpired(paid: boolean, publishedAt: Date | null): boolean {
  if (paid) return false;
  if (!publishedAt) return false;
  const deadline = publishedAt.getTime() + FREE_TRIAL_DAYS * 24 * 60 * 60 * 1000;
  return Date.now() > deadline;
}

function OwnerManagementLink({ label }: { label: string }) {
  return (
    <nav
      aria-label={label}
      className="pointer-events-none fixed inset-x-0 top-0 z-[120] flex justify-end p-3 sm:p-4"
    >
      <Link
        href="/dashboard"
        className="pointer-events-auto inline-flex min-h-11 items-center gap-2 rounded-full border border-white/30 bg-black/75 px-4 py-2.5 text-sm font-semibold text-white shadow-xl backdrop-blur-md transition hover:bg-black/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-black/50"
      >
        <LayoutDashboard className="size-4" aria-hidden />
        {label}
      </Link>
    </nav>
  );
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

  const names = resolveCoupleNames(invitation.content);
  const title = names ? `Đám cưới ${names}` : "Thiệp cưới";
  const description = names
    ? `Trân trọng kính mời bạn đến chung vui trong ngày cưới của ${names}.`
    : "Trân trọng kính mời bạn đến chung vui trong ngày cưới.";

  return {
    metadataBase: new URL(SITE_URL),
    title: `${title} | Thiệp Mừng Online`,
    description,
    robots: { index: false, follow: false },
    alternates: { canonical: `/thiep/${slug}` },
    openGraph: {
      title,
      description,
      url: `/thiep/${slug}`,
      siteName: "Thiệp Mừng Online",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

export default async function PublicInvitationPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ g?: string; published?: string }>;
}) {
  const { slug } = await params;
  const { g, published } = await searchParams;
  const invitation = await loadPublished(slug);
  if (!invitation) notFound();

  const currentUserId = await getCurrentUserId();
  const isOwner = currentUserId === invitation.userId;
  const requestedLocale = isOwner ? (await cookies()).get("NEXT_LOCALE")?.value : null;
  const locale = hasLocale(routing.locales, requestedLocale)
    ? requestedLocale
    : routing.defaultLocale;
  const invitationTranslations = await getTranslations({ locale, namespace: "publicInvitation" });
  const ownerLabel = isOwner ? invitationTranslations("manage") : null;
  const ownerManagement = ownerLabel ? <OwnerManagementLink label={ownerLabel} /> : null;

  if (isExpired(invitation.paid, invitation.publishedAt)) {
    return (
      <>
        <AnalyticsEventOnView
          eventName="view_invitation"
          params={{
            template_id: invitation.templateId,
            owner_view: isOwner,
            invitation_status: "expired",
          }}
        />
        {ownerManagement}
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
              data-ga-event="checkout_click"
              data-ga-param-source="expired_invitation"
              className="mt-6 inline-block rounded-full bg-primary px-6 py-3 text-sm font-bold text-primary-foreground shadow-lg shadow-primary/25 transition hover:bg-primary/90"
            >
              Gia hạn / Thanh toán
            </Link>
          </div>
        </main>
      </>
    );
  }

  const template = templates.find((t) => t.slug === invitation.templateId) ?? templates[0];
  const content = toDemoContent(invitation);

  const guestRecord = g
      ? await prisma.guest.findUnique({
        where: { token: g },
        select: {
          id: true,
          name: true,
          side: true,
          role: true,
          greeting: true,
          maxGuests: true,
          invitationId: true,
        },
      })
    : null;
  const guest =
    g && guestRecord && guestRecord.invitationId === invitation.id
      ? {
          token: g,
          name: guestRecord.name,
          side: guestRecord.side,
          role: guestRecord.role,
          greeting: guestRecord.greeting,
          maxGuests: guestRecord.maxGuests,
        }
      : null;
  const recipientLabel = guest
    ? guest.greeting || [guest.role?.trim(), guest.name.trim()].filter(Boolean).join(" ")
    : invitationTranslations("guestFallback");

  const questions = invitation.rsvpQuestions.map((question) => {
    let options: string[] = [];
    if (question.options) {
      try {
        const parsed: unknown = JSON.parse(question.options);
        if (Array.isArray(parsed) && parsed.every((option) => typeof option === "string")) options = parsed;
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
    };
  });

  const rsvpLabels = {
    open: invitationTranslations("rsvp.open"),
    title: invitationTranslations("rsvp.title"),
    description: invitationTranslations("rsvp.description"),
    close: invitationTranslations("rsvp.close"),
    name: invitationTranslations("rsvp.name"),
    attending: invitationTranslations("rsvp.attending"),
    attendingYes: invitationTranslations("rsvp.attendingYes"),
    attendingNo: invitationTranslations("rsvp.attendingNo"),
    guestCount: invitationTranslations("rsvp.guestCount"),
    side: invitationTranslations("rsvp.side"),
    sideEmpty: invitationTranslations("rsvp.sideEmpty"),
    groomSide: invitationTranslations("rsvp.groomSide"),
    brideSide: invitationTranslations("rsvp.brideSide"),
    shuttle: invitationTranslations("rsvp.shuttle"),
    dietary: invitationTranslations("rsvp.dietary"),
    songRequest: invitationTranslations("rsvp.songRequest"),
    message: invitationTranslations("rsvp.message"),
    answerYes: invitationTranslations("rsvp.answerYes"),
    answerNo: invitationTranslations("rsvp.answerNo"),
    selectPlaceholder: invitationTranslations("rsvp.selectPlaceholder"),
    submit: invitationTranslations("rsvp.submit"),
    submitting: invitationTranslations("rsvp.submitting"),
    success: invitationTranslations("rsvp.success"),
  };
  const mediaLabels = {
    open: invitationTranslations("media.open"),
    title: invitationTranslations("media.title"),
    description: invitationTranslations("media.description"),
    close: invitationTranslations("media.close"),
    contributorName: invitationTranslations("media.contributorName"),
    contributorPlaceholder: invitationTranslations("media.contributorPlaceholder"),
    chooseFiles: invitationTranslations("media.chooseFiles"),
    fileHint: invitationTranslations("media.fileHint"),
    selected: invitationTranslations("media.selected"),
    remove: invitationTranslations("media.remove"),
    upload: invitationTranslations("media.upload"),
    uploading: invitationTranslations("media.uploading"),
    loading: invitationTranslations("media.loading"),
    empty: invitationTranslations("media.empty"),
    download: invitationTranslations("media.download"),
    success: invitationTranslations("media.success"),
    errorGeneric: invitationTranslations("media.errorGeneric"),
    errorInvalidName: invitationTranslations("media.errorInvalidName"),
    errorTooManyFiles: invitationTranslations("media.errorTooManyFiles"),
    errorImageTooLarge: invitationTranslations("media.errorImageTooLarge"),
    errorVideoTooLarge: invitationTranslations("media.errorVideoTooLarge"),
    errorUnsupported: invitationTranslations("media.errorUnsupported"),
    errorGalleryFull: invitationTranslations("media.errorGalleryFull"),
  };

  const submitWishForSlug = submitWish.bind(null, slug);
  const submitRsvpForSlug = submitRsvp.bind(null, slug);

  return (
    <>
      <AnalyticsEventOnView
        eventName="view_invitation"
        params={{
          template_id: invitation.templateId,
          owner_view: isOwner,
          personalized_guest_link: Boolean(guest),
          invitation_status: "active",
        }}
        additionalEventName={published === "1" ? "publish_invitation" : undefined}
        cleanQueryParam={published === "1" ? "published" : undefined}
      />
      {ownerManagement}
      <ChungDoiDemo
        template={template}
        content={content}
        liveForms={{
          wishAction: submitWishForSlug,
          rsvpAction: submitRsvpForSlug,
          guest,
          recipientLabel,
          questions,
          rsvpLabels,
          slug,
          mediaLabels,
        }}
      />
    </>
  );
}

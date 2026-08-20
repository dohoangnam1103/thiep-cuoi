import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { verifyAdmin } from "@/lib/admin-dal";
import { parseAuditDetailsForDisplay } from "@/lib/admin-audit-view";
import { SYSTEM_EMAIL } from "@/lib/admin-support-input";
import { getTemplateLabels } from "@/lib/template-labels";
import { getTemplateMobileThumbnailOverrides } from "@/lib/template-mobile-thumbnails";
import { templateLabel } from "@/app/editor/[id]/templates";
import {
  resolveEffectiveInvitationPrice,
  resolveSystemInvitationPrice,
} from "@/lib/invitation-pricing";
import { getPaymentPrices } from "@/lib/payment-config";
import { prisma } from "@/lib/prisma";

import { AdminCreateInvitationButton } from "./AdminCreateInvitationButton";
import { InvitationPriceDialog } from "./InvitationPriceDialog";

export const metadata: Metadata = {
  title: "Hồ sơ người dùng | Quản trị",
  robots: { index: false, follow: false },
};

const dateTimeFormat = new Intl.DateTimeFormat("vi-VN", {
  dateStyle: "medium",
  timeStyle: "short",
});

function formatVnd(value: number): string {
  return `${new Intl.NumberFormat("vi-VN").format(value)}đ`;
}

export default async function AdminUserProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await verifyAdmin();
  const { id } = await params;

  // Reject the system demo account the same way the list page hides it.
  const user = await prisma.user.findFirst({
    where: { id, NOT: { email: SYSTEM_EMAIL } },
    include: {
      invitations: {
        where: { isDemo: false },
        orderBy: { updatedAt: "desc" },
        include: {
          content: { select: { brideFullName: true, groomFullName: true } },
        },
      },
      adminAuditLogs: { orderBy: { createdAt: "desc" }, take: 50 },
    },
  });
  if (!user) notFound();

  const t = await getTranslations("adminSupport");
  const [prices, paidPaymentCount, templateLabels, mobileThumbnailOverrides] = await Promise.all([
    getPaymentPrices(),
    prisma.payment.count({
      where: { status: "paid", invitation: { userId: id } },
    }),
    getTemplateLabels(),
    getTemplateMobileThumbnailOverrides(),
  ]);
  const systemPrice = resolveSystemInvitationPrice(
    prices.productPrice,
    prices.repeatCustomerPrice,
    paidPaymentCount,
  );

  const email = user.email ?? t("userFallback");

  return (
    <div className="space-y-6">
      <Link
        href="/admin/users"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground transition hover:text-foreground"
      >
        ← {t("backToUsers")}
      </Link>

      <div className="flex flex-wrap items-end justify-between gap-3">
        <h1 className="font-heading text-2xl font-semibold text-foreground">{email}</h1>
        <AdminCreateInvitationButton
          userId={user.id}
          templateLabels={templateLabels}
          mobileThumbnailOverrides={mobileThumbnailOverrides}
        />
      </div>

      <section className="space-y-3">
        <h2 className="font-heading text-lg font-semibold text-foreground">
          {t("invitationsTitle")}
        </h2>

        {user.invitations.length === 0 ? (
          <p className="rounded-2xl border border-border bg-background p-6 text-sm text-muted-foreground">
            {t("noInvitations")}
          </p>
        ) : (
          <div className="space-y-3">
            {user.invitations.map((invitation) => {
              const couple = [
                invitation.content?.groomFullName?.trim(),
                invitation.content?.brideFullName?.trim(),
              ]
                .filter(Boolean)
                .join(" & ");
              const effectivePrice = resolveEffectiveInvitationPrice(
                invitation.adminPriceOverride,
                systemPrice,
              );
              const activation = invitation.paid
                ? "paid"
                : invitation.complimentary
                  ? "complimentary"
                  : "trial";

              return (
                <article
                  key={invitation.id}
                  data-invitation-id={invitation.id}
                  className="space-y-3 rounded-2xl border border-border bg-background p-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3 className="font-semibold text-foreground">
                      {couple || t("coupleFallback", { id: invitation.id })}
                    </h3>
                    <div className="flex flex-wrap gap-2 text-xs">
                      <span className="rounded-full border border-border px-2.5 py-1 text-muted-foreground">
                        {t("template")}:{" "}
                        {templateLabels[invitation.templateId] ??
                          templateLabel(invitation.templateId)}
                      </span>
                      <span className="rounded-full border border-border px-2.5 py-1 text-muted-foreground">
                        {t("status")}: {t(invitation.status === "published" ? "published" : "draft")}
                      </span>
                      <span className="rounded-full border border-border px-2.5 py-1 text-muted-foreground">
                        {t("activation")}: {t(activation)}
                      </span>
                      <span className="rounded-full border border-border px-2.5 py-1 text-muted-foreground">
                        {invitation.adminPriceOverride !== null ? t("customPrice") : t("systemPrice")}
                        : {formatVnd(effectivePrice)}
                      </span>
                      <span className="rounded-full border border-border px-2.5 py-1 text-muted-foreground">
                        {t("updatedAt")}: {dateTimeFormat.format(invitation.updatedAt)}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {invitation.status === "published" && invitation.slug ? (
                      <Link
                        href={`/thiep/${invitation.slug}`}
                        className="rounded-lg border border-border px-3 py-1.5 text-sm text-foreground transition hover:bg-secondary"
                      >
                        {t("view")}
                      </Link>
                    ) : (
                      <Link
                        href={`/editor/${invitation.id}/preview`}
                        className="rounded-lg border border-border px-3 py-1.5 text-sm text-foreground transition hover:bg-secondary"
                      >
                        {t("preview")}
                      </Link>
                    )}
                    <Link
                      href={`/admin/invitations/${invitation.id}/edit`}
                      className="rounded-lg border border-border px-3 py-1.5 text-sm text-foreground transition hover:bg-secondary"
                    >
                      {t("edit")}
                    </Link>
                    <InvitationPriceDialog
                      userId={user.id}
                      invitationId={invitation.id}
                      systemPrice={systemPrice}
                      currentOverride={invitation.adminPriceOverride}
                      complimentary={invitation.complimentary}
                      paid={invitation.paid}
                    />
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="font-heading text-lg font-semibold text-foreground">{t("auditTitle")}</h2>
        {user.adminAuditLogs.length === 0 ? (
          <p className="rounded-2xl border border-border bg-background p-6 text-sm text-muted-foreground">
            {t("noAudit")}
          </p>
        ) : (
          <ul className="divide-y divide-border rounded-2xl border border-border bg-background">
            {user.adminAuditLogs.map((entry) => {
              const auditKey = `audit.${entry.action}` as Parameters<typeof t.has>[0];
              const label = t.has(auditKey) ? t(auditKey) : entry.action;

              // Only the allow-listed, typed fields are rendered; raw
              // log.details (which may carry hashes/tokens/bank data) never is.
              const details = parseAuditDetailsForDisplay(entry.details);
              let priceLine: string | null = null;
              let complimentaryLine: string | null = null;
              let supersededLine: string | null = null;
              if (details) {
                if (details.beforePrice !== details.afterPrice) {
                  priceLine = t("auditPriceChange", {
                    before: details.beforePrice === null ? "—" : formatVnd(details.beforePrice),
                    after: details.afterPrice === null ? "—" : formatVnd(details.afterPrice),
                  });
                }
                if (details.beforeComplimentary !== details.afterComplimentary) {
                  const boolText = (value: boolean | null): string =>
                    value === null ? "—" : value ? t("auditBoolYes") : t("auditBoolNo");
                  complimentaryLine = t("auditComplimentaryChange", {
                    before: boolText(details.beforeComplimentary),
                    after: boolText(details.afterComplimentary),
                  });
                }
                if (
                  details.supersededPaymentCount !== null &&
                  details.supersededPaymentCount > 0
                ) {
                  supersededLine = t("auditSupersededPayments", {
                    count: details.supersededPaymentCount,
                  });
                }
              }

              return (
                <li key={entry.id} className="space-y-1 px-4 py-3 text-sm">
                  <p className="text-foreground">{label}</p>
                  {priceLine ? (
                    <p className="text-xs text-muted-foreground">{priceLine}</p>
                  ) : null}
                  {complimentaryLine ? (
                    <p className="text-xs text-muted-foreground">{complimentaryLine}</p>
                  ) : null}
                  {supersededLine ? (
                    <p className="text-xs text-muted-foreground">{supersededLine}</p>
                  ) : null}
                  <p className="text-xs text-muted-foreground">
                    {t("auditActor", {
                      admin: entry.adminEmail,
                      time: dateTimeFormat.format(entry.createdAt),
                    })}
                  </p>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}

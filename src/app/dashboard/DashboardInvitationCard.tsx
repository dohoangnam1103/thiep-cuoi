import { useTranslations } from "next-intl";
import Link from "next/link";

import { TrialCountdownBanner } from "@/components/trial-countdown-banner";
import { resolveDashboardCardTheme } from "@/lib/dashboard-card-theme";
import type { InvitationActivation } from "@/lib/invitation-entitlement";
import { trialExpiresAt } from "@/lib/trial";
import { bodyClass, panelSubTitleClass, pillClass } from "@/lib/typography";

export type DashboardInvitationCardProps = {
  id: string;
  templateId: string;
  templateName: string;
  title: string;
  hasNames: boolean;
  status: string;
  slug: string | null;
  activation: InvitationActivation;
  publishedAt: string | null;
  rsvpCount: number;
  wishCount: number;
};

export function DashboardInvitationCard({
  id,
  templateId,
  templateName,
  title,
  hasNames,
  status,
  slug,
  activation,
  publishedAt,
  rsvpCount,
  wishCount,
}: DashboardInvitationCardProps) {
  const t = useTranslations("dashboardActivation");
  const theme = resolveDashboardCardTheme(templateId);
  const published = status === "published";
  // Card nền theme rất tương phản (nền hoa sáng, nền đỏ tối) nên chữ khó đọc.
  // Bọc RIÊNG cụm text bên trái bằng chip nền trắng mờ ôm sát nội dung (không
  // phủ cả card như tấm cũ) → text luôn đọc được trên mọi nền vì có nền trắng
  // cục bộ, không phụ thuộc quầng sáng. Chip chỉ bật khi có theme.
  const textChipClass = theme
    ? "self-start rounded-xl bg-white/70 px-3 py-2 shadow-sm backdrop-blur-md"
    : "";
  const showTrialBanner = Boolean(published && activation === "trial" && publishedAt);

  return (
    <li
      data-template-id={templateId}
      data-themed={theme ? "true" : "false"}
      className={`relative overflow-hidden rounded-2xl border p-4 shadow sm:p-5 ${
        theme ? "border-black/10" : "border-border bg-card"
      } ${showTrialBanner ? "" : "sm:min-h-[184px]"}`}
      style={theme ? { background: theme.background } : undefined}
    >
      {theme
        ? theme.decorations.map((src, index) => (
            <div
              key={`${src}-${index}`}
              data-decoration
              aria-hidden
              className={`pointer-events-none absolute top-1/2 h-24 w-24 -translate-y-1/2 bg-contain bg-no-repeat opacity-20 transition-opacity sm:h-36 sm:w-36 ${
                index === 0
                  ? "left-0 -translate-x-1/4 bg-left"
                  : "right-0 translate-x-1/4 bg-right"
              }`}
              style={{ backgroundImage: `url(${src})` }}
            />
          ))
        : null}

      <div className="relative z-10">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className={`min-w-0 ${textChipClass}`}>
            <div className="flex flex-wrap items-center gap-3">
              <h2 className={`${panelSubTitleClass} text-foreground`}>
                {title}
              </h2>
              <span
                className={`shrink-0 rounded-full px-2.5 py-1 ${pillClass} ${
                  published
                    ? "bg-green-500/15 text-green-700"
                    : "bg-amber-500/15 text-amber-700"
                }`}
              >
                {published ? "Đã xuất bản" : "Bản nháp"}
              </span>
            </div>
            {hasNames ? (
              <p className={`mt-0.5 ${bodyClass} text-muted-foreground`}>
                {templateName}
              </p>
            ) : null}
            <div className={`mt-2 flex gap-4 ${bodyClass} text-muted-foreground`}>
              <span>{rsvpCount} xác nhận</span>
              <span>{wishCount} lời chúc</span>
            </div>
          </div>

          <div className={`flex flex-wrap gap-2 ${bodyClass} sm:justify-end`}>
            <Link
              href={`/editor/${id}`}
              className="rounded-full bg-secondary px-4 py-1.5 font-medium text-secondary-foreground transition hover:bg-muted"
            >
              Chỉnh sửa
            </Link>
            <Link
              href={`/dashboard/${id}/rsvp`}
              className="rounded-full bg-secondary px-4 py-1.5 font-medium text-secondary-foreground transition hover:bg-muted"
            >
              Xem xác nhận
            </Link>
            <Link
              href={`/dashboard/${id}/guests`}
              className="rounded-full bg-secondary px-4 py-1.5 font-medium text-secondary-foreground transition hover:bg-muted"
            >
              Khách mời
            </Link>
            {published && slug ? (
              <Link
                href={`/thiep/${slug}`}
                className="rounded-full bg-primary px-4 py-1.5 font-medium text-primary-foreground transition hover:bg-primary/90"
              >
                Xem thiệp
              </Link>
            ) : null}
            {activation === "paid" ? (
              <span className="rounded-full bg-green-500/15 px-4 py-1.5 font-medium text-green-700">
                {t("paid")}
              </span>
            ) : null}
            {activation === "complimentary" ? (
              <span className="rounded-full bg-green-500/15 px-4 py-1.5 font-medium text-green-700">
                {t("complimentary")}
              </span>
            ) : null}
          </div>
        </div>
        {showTrialBanner && publishedAt ? (
          <TrialCountdownBanner
            invitationId={id}
            expiresAt={trialExpiresAt(new Date(publishedAt)).getTime()}
            source="dashboard_list"
            className="mt-5"
          />
        ) : null}
      </div>
    </li>
  );
}

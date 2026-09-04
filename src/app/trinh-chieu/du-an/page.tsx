import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import {
  Clapperboard,
  Clock3,
  ExternalLink,
  Film,
  ImageIcon,
  LockKeyhole,
  Pencil,
  Plus,
} from "lucide-react";

import {
  isSlideshowTemplateId,
  slideshowTemplateById,
  slideshowTemplateCatalog,
} from "@/components/slideshow/templates/catalog";
import { verifyAccountSession } from "@/lib/dal";
import { listOwnSlideshowProjects } from "@/lib/slideshow/dal";
import {
  getSlideshowEntitlement,
  slideshowTrialEndsAt,
  type SlideshowEntitlement,
} from "@/lib/slideshow/project";
import {
  MAX_SLIDESHOW_PROJECTS_PER_ACCOUNT,
  MAX_UNPAID_SLIDESHOW_PROJECTS_PER_ACCOUNT,
} from "@/lib/slideshow/storage";

import { SlideshowShareButton } from "./share-button";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Slideshow của tôi | Thiệp Mừng Online",
};

const entitlementTone: Record<SlideshowEntitlement, string> = {
  trial: "border-[#d8ff3e]/30 bg-[#d8ff3e]/10 text-[#e4ff78]",
  paid: "border-emerald-300/30 bg-emerald-300/10 text-emerald-200",
  complimentary: "border-sky-300/30 bg-sky-300/10 text-sky-200",
  expired: "border-amber-300/30 bg-amber-300/10 text-amber-100",
};

export default async function SlideshowProjectsPage() {
  const [{ userId }, t, studioT] = await Promise.all([
    verifyAccountSession("/trinh-chieu/du-an", "slideshow"),
    getTranslations("slideshowDashboard"),
    getTranslations("slideshowStudio"),
  ]);
  const projects = await listOwnSlideshowProjects(userId);
  const now = new Date();
  const dateFormatter = new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "medium",
    timeStyle: "short",
  });
  const unpaidCount = projects.filter(
    (project) => !project.paid && !project.complimentary,
  ).length;
  const atProjectLimit = projects.length >= MAX_SLIDESHOW_PROJECTS_PER_ACCOUNT;
  const atUnpaidLimit = unpaidCount >= MAX_UNPAID_SLIDESHOW_PROJECTS_PER_ACCOUNT;
  const canCreate = !atProjectLimit && !atUnpaidLimit;
  const createBlockedMessage = atProjectLimit
    ? t("limits.project")
    : atUnpaidLimit
      ? t("limits.unpaid")
      : null;

  return (
    <main className="min-h-[100dvh] bg-[radial-gradient(circle_at_50%_-20%,#35342f_0%,#191916_35%,#11110f_72%)]">
      <header className="sticky top-0 z-20 border-b border-white/10 bg-[#11110f]/90 backdrop-blur-xl">
        <div className="mx-auto flex min-h-16 max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <Link href="/trinh-chieu" className="flex min-w-0 items-center gap-3">
            <span className="grid size-9 shrink-0 place-items-center rounded-full border border-[#d8ff3e]/40 bg-[#d8ff3e]/10 text-[#d8ff3e]">
              <Clapperboard size={17} aria-hidden />
            </span>
            <span className="min-w-0">
              <span className="block truncate text-sm font-semibold tracking-tight">
                {t("brand")}
              </span>
              <span className="block truncate text-xs text-white/40">{t("brandHint")}</span>
            </span>
          </Link>
          <nav className="flex flex-wrap items-center justify-end gap-2" aria-label={t("navigation")}>
            <Link
              href="/trinh-chieu/mau"
              className="rounded-full px-3 py-2 text-sm text-white/55 transition hover:bg-white/8 hover:text-white"
            >
              {t("viewTemplates")}
            </Link>
            {canCreate ? (
              <Link
                href="/trinh-chieu/mau"
                className="inline-flex items-center gap-2 rounded-full bg-[#d8ff3e] px-4 py-2 text-sm font-semibold text-[#171811] transition hover:bg-[#e2ff73]"
              >
                <Plus size={16} aria-hidden />
                {t("create")}
              </Link>
            ) : (
              <span
                aria-disabled="true"
                title={createBlockedMessage ?? undefined}
                className="inline-flex cursor-not-allowed items-center gap-2 rounded-full bg-white/8 px-4 py-2 text-sm font-semibold text-white/30"
              >
                <Plus size={16} aria-hidden />
                {t("create")}
              </span>
            )}
          </nav>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#d8ff3e]">
              {t("eyebrow")}
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
              {t("title")}
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-white/50">
              {t("description")}
            </p>
          </div>
          <div className="shrink-0 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-right">
            <p className="text-xl font-semibold text-white">
              {t("projectCount", {
                count: projects.length,
                limit: MAX_SLIDESHOW_PROJECTS_PER_ACCOUNT,
              })}
            </p>
            <p className="mt-0.5 text-xs text-white/40">{t("projectCountHint")}</p>
          </div>
        </div>

        {createBlockedMessage ? (
          <div className="mt-6 flex items-start gap-3 rounded-2xl border border-amber-300/20 bg-amber-300/8 p-4 text-sm text-amber-100">
            <LockKeyhole className="mt-0.5 shrink-0" size={17} aria-hidden />
            <p>{createBlockedMessage}</p>
          </div>
        ) : null}

        {projects.length === 0 ? (
          <div className="mt-10 grid min-h-80 place-items-center rounded-3xl border border-dashed border-white/15 bg-white/[0.025] px-6 py-12 text-center">
            <div className="max-w-md">
              <span className="mx-auto grid size-14 place-items-center rounded-2xl border border-[#d8ff3e]/25 bg-[#d8ff3e]/8 text-[#d8ff3e]">
                <Film size={25} aria-hidden />
              </span>
              <h2 className="mt-5 text-xl font-semibold">{t("empty.title")}</h2>
              <p className="mt-2 text-sm leading-relaxed text-white/45">{t("empty.description")}</p>
              <Link
                href="/trinh-chieu/mau"
                className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#d8ff3e] px-5 py-3 text-sm font-semibold text-black transition hover:bg-[#e2ff73]"
              >
                <Plus size={16} aria-hidden />
                {t("empty.action")}
              </Link>
            </div>
          </div>
        ) : (
          <ul className="mt-10 grid gap-5 lg:grid-cols-2">
            {projects.map((project) => {
              const entitlement = getSlideshowEntitlement(project, now);
              const template = isSlideshowTemplateId(project.templateId)
                ? slideshowTemplateById[project.templateId]
                : null;
              const fallbackTemplate = slideshowTemplateCatalog[0];
              const templateName = template
                ? studioT(template.nameKey)
                : t("unknownTemplate");
              const previewImage = (template ?? fallbackTemplate).previewImages.tv;
              const activePublicLink = entitlement !== "expired";
              const viewerPath = `/trinh-chieu/xem/${project.shareToken}`;
              const statusLabel = t(`status.${entitlement}.label`);
              const statusDescription = entitlement === "trial"
                ? t("status.trial.description", {
                    date: dateFormatter.format(slideshowTrialEndsAt(project.trialStartedAt)),
                  })
                : t(`status.${entitlement}.description`);

              return (
                <li
                  key={project.id}
                  className="group overflow-hidden rounded-3xl border border-white/10 bg-white/[0.045] shadow-[0_24px_70px_rgba(0,0,0,0.22)] transition hover:border-white/20 hover:bg-white/[0.06]"
                >
                  <div className="relative aspect-[16/7] overflow-hidden bg-black">
                    <Image
                      src={previewImage}
                      alt={t("previewAlt", { title: project.title })}
                      fill
                      sizes="(min-width: 1024px) 560px, 100vw"
                      className="object-cover opacity-70 transition duration-500 group-hover:scale-[1.02] group-hover:opacity-85"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#121210] via-transparent to-black/10" />
                    <span className={`absolute left-4 top-4 rounded-full border px-3 py-1.5 text-xs font-semibold ${entitlementTone[entitlement]}`}>
                      {statusLabel}
                    </span>
                    <span className="absolute bottom-4 right-4 rounded-full border border-white/15 bg-black/55 px-3 py-1.5 text-xs text-white/70 backdrop-blur-sm">
                      {templateName} · v{project.templateVersion}
                    </span>
                  </div>

                  <div className="p-5 sm:p-6">
                    <h2 className="truncate text-xl font-semibold tracking-tight">{project.title}</h2>
                    <p className="mt-2 text-sm leading-relaxed text-white/50">{statusDescription}</p>
                    <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-xs text-white/40">
                      <span className="inline-flex items-center gap-1.5">
                        <Clock3 size={14} aria-hidden />
                        <time dateTime={project.updatedAt.toISOString()}>
                          {t("updatedAt", { date: dateFormatter.format(project.updatedAt) })}
                        </time>
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <ImageIcon size={14} aria-hidden />
                        {t("assetCount", { count: project.assetCount })}
                      </span>
                    </div>

                    <div className="mt-6 flex flex-wrap items-center gap-2 border-t border-white/10 pt-5">
                      <Link
                        href={`/trinh-chieu/${project.id}`}
                        className="inline-flex h-10 items-center gap-2 rounded-full bg-white px-4 text-sm font-semibold text-black transition hover:bg-white/85"
                      >
                        <Pencil size={15} aria-hidden />
                        {entitlement === "expired" ? t("openDraft") : t("edit")}
                      </Link>
                      {activePublicLink ? (
                        <>
                          <Link
                            href={viewerPath}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex h-10 items-center gap-2 rounded-full border border-white/12 px-4 text-sm font-medium text-white/70 transition hover:bg-white/8 hover:text-white"
                          >
                            <ExternalLink size={15} aria-hidden />
                            {t("view")}
                          </Link>
                          <SlideshowShareButton path={viewerPath} title={project.title} />
                        </>
                      ) : null}
                      {entitlement === "trial" || entitlement === "expired" ? (
                        <Link
                          href={`/trinh-chieu/${project.id}/thanh-toan`}
                          className="inline-flex h-10 items-center gap-2 rounded-full border border-[#d8ff3e]/35 bg-[#d8ff3e]/8 px-4 text-sm font-semibold text-[#e4ff78] transition hover:bg-[#d8ff3e]/15"
                        >
                          <LockKeyhole size={15} aria-hidden />
                          {entitlement === "expired" ? t("unlock") : t("unlockEarly")}
                        </Link>
                      ) : null}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </main>
  );
}

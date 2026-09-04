import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import {
  Clapperboard,
  Clock3,
  Images,
  MonitorSmartphone,
  Music2,
  Play,
  Plus,
  Video,
} from "lucide-react";

import { slideshowTemplateCatalog } from "@/components/slideshow/templates/catalog";

export const metadata: Metadata = {
  title: "Chọn mẫu slideshow cưới | Thiệp Mừng Online",
};

export default async function SlideshowTemplatesPage() {
  const [t, studioT] = await Promise.all([
    getTranslations("slideshowTemplates"),
    getTranslations("slideshowStudio"),
  ]);

  return (
    <main className="min-h-[100dvh] bg-[radial-gradient(circle_at_50%_-20%,#35342f_0%,#191916_35%,#11110f_72%)]">
      <header className="border-b border-white/10 bg-[#11110f]/85 backdrop-blur-xl">
        <div className="mx-auto flex min-h-16 max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <Link href="/trinh-chieu" className="flex min-w-0 items-center gap-3">
            <span className="grid size-9 shrink-0 place-items-center rounded-full border border-[#d8ff3e]/40 bg-[#d8ff3e]/10 text-[#d8ff3e]">
              <Clapperboard size={17} aria-hidden />
            </span>
            <span>
              <span className="block text-sm font-semibold tracking-tight">{t("brand")}</span>
              <span className="block text-xs text-white/40">{t("brandHint")}</span>
            </span>
          </Link>
          <nav className="flex items-center gap-2" aria-label={t("navigation")}>
            <Link href="/trinh-chieu" className="rounded-full px-3 py-2 text-sm text-white/55 transition hover:bg-white/8 hover:text-white">
              {t("openDemo")}
            </Link>
            <Link href="/trinh-chieu/du-an" className="rounded-full border border-white/12 px-4 py-2 text-sm text-white/70 transition hover:bg-white/8 hover:text-white">
              {t("myProjects")}
            </Link>
          </nav>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
        <div className="max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#d8ff3e]">{t("eyebrow")}</p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight sm:text-5xl">{t("title")}</h1>
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-white/50 sm:text-base">{t("description")}</p>
        </div>

        <div className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {slideshowTemplateCatalog.map((template) => (
            <article key={template.id} id={template.id} className="flex overflow-hidden rounded-3xl border border-white/10 bg-white/[0.045] shadow-[0_28px_80px_rgba(0,0,0,0.28)]">
              <div className="flex min-w-0 flex-1 flex-col">
                <div className="relative aspect-[16/9] overflow-hidden bg-black">
                  <Image
                    src={template.previewImages.tv}
                    alt={t("tvPreviewAlt", { name: studioT(template.nameKey) })}
                    fill
                    priority={template.id === slideshowTemplateCatalog[0].id}
                    sizes="(min-width: 1280px) 370px, (min-width: 768px) 50vw, 100vw"
                    className="object-cover opacity-80 transition duration-700 hover:scale-[1.025]"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#121210] via-transparent to-black/10" />
                  <div className="absolute bottom-4 right-4 aspect-[9/16] h-[44%] overflow-hidden rounded-xl border-2 border-white/25 bg-black shadow-2xl">
                    <Image
                      src={template.previewImages.phone}
                      alt={t("phonePreviewAlt", { name: studioT(template.nameKey) })}
                      fill
                      sizes="100px"
                      className="object-cover"
                    />
                  </div>
                  <span className="absolute left-4 top-4 rounded-full border border-white/15 bg-black/55 px-3 py-1.5 text-xs text-white/75 backdrop-blur-sm">
                    {t("version", { version: template.version })}
                  </span>
                </div>

                <div className="flex flex-1 flex-col p-6 sm:p-7">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h2 className="text-2xl font-semibold tracking-tight">{studioT(template.nameKey)}</h2>
                      <p className="mt-2 text-sm leading-relaxed text-white/50">{studioT(template.descriptionKey)}</p>
                    </div>
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white/60">
                      <Clock3 size={14} aria-hidden />
                      {t("duration", { seconds: Math.round(template.durationMs / 1_000) })}
                    </span>
                  </div>

                  <ul className="mt-6 grid grid-cols-2 gap-3 text-xs text-white/55">
                    <li className="flex items-center gap-2 rounded-xl bg-white/5 px-3 py-3">
                      <MonitorSmartphone size={15} className="shrink-0 text-[#d8ff3e]" aria-hidden />
                      {t("twoFormats")}
                    </li>
                    <li className="flex items-center gap-2 rounded-xl bg-white/5 px-3 py-3">
                      <Images size={15} className="shrink-0 text-[#d8ff3e]" aria-hidden />
                      {t("mediaLimit", { count: template.capabilities.maxPhotos })}
                    </li>
                    <li className="flex items-center gap-2 rounded-xl bg-white/5 px-3 py-3">
                      <Video size={15} className="shrink-0 text-[#d8ff3e]" aria-hidden />
                      {t("video")}
                    </li>
                    <li className="flex items-center gap-2 rounded-xl bg-white/5 px-3 py-3">
                      <Music2 size={15} className="shrink-0 text-[#d8ff3e]" aria-hidden />
                      {t("music")}
                    </li>
                  </ul>

                  <div className="mt-auto grid grid-cols-2 gap-2 pt-7">
                    <Link
                      href={`/trinh-chieu?template=${template.id}#chon-mau`}
                      className="inline-flex h-11 items-center justify-center gap-1.5 whitespace-nowrap rounded-full border border-white/15 px-2 text-center text-xs font-medium text-white/75 transition hover:bg-white/8 hover:text-white 2xl:gap-2 2xl:px-3 2xl:text-sm"
                    >
                      <Play size={15} className="shrink-0" aria-hidden />
                      {t("preview")}
                    </Link>
                    <Link
                      href={`/trinh-chieu/bat-dau?template=${template.id}`}
                      className="inline-flex h-11 items-center justify-center gap-1.5 whitespace-nowrap rounded-full bg-[#d8ff3e] px-2 text-center text-xs font-semibold text-black transition hover:bg-[#e2ff73] 2xl:gap-2 2xl:px-3 2xl:text-sm"
                    >
                      <Plus size={16} className="shrink-0" aria-hidden />
                      {t("useTemplate")}
                    </Link>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>

        <div className="mt-10 rounded-2xl border border-[#d8ff3e]/20 bg-[#d8ff3e]/6 p-5 text-sm leading-relaxed text-white/55">
          <strong className="text-[#e4ff78]">{t("sharedSourceTitle")}</strong>{" "}
          {t("sharedSourceDescription")}
        </div>
      </section>
    </main>
  );
}

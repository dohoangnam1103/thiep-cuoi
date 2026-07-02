"use client";

import { ArrowRight, ImageDown, MessageSquareText, QrCode, Sparkles, Video } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useTranslations } from "next-intl";

import { SiteFooter, SiteHeader } from "@/components/chungdoi-chrome";

const TOOLS: Array<{ icon: LucideIcon; popular: boolean; nameKey: string; descKey: string }> = [
  { icon: Sparkles, popular: true, nameKey: "tool1Name", descKey: "tool1Desc" },
  { icon: MessageSquareText, popular: true, nameKey: "tool2Name", descKey: "tool2Desc" },
  { icon: QrCode, popular: true, nameKey: "tool3Name", descKey: "tool3Desc" },
  { icon: ImageDown, popular: false, nameKey: "tool4Name", descKey: "tool4Desc" },
  { icon: Video, popular: false, nameKey: "tool5Name", descKey: "tool5Desc" },
];

export function ChungDoiTools() {
  const t = useTranslations("tools");

  return (
    <main className="min-h-screen bg-[#18120f] text-white">
      <SiteHeader />

      <section className="border-b border-white/10 bg-[radial-gradient(circle_at_15%_-10%,rgba(251,53,112,0.22),transparent_40%)] py-14 text-center sm:py-20">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <p className="text-sm font-black uppercase tracking-[0.22em] text-[#ff8cad]">{t("eyebrow")}</p>
          <h1 className="mt-4 text-4xl font-black leading-[1.05] tracking-tight text-white sm:text-6xl">{t("title")}</h1>
          <p className="mt-5 text-lg leading-8 text-zinc-300">{t("subtitle")}</p>
        </div>
      </section>

      <section className="py-14 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {TOOLS.map((tool) => {
              const Icon = tool.icon;
              return (
                <article
                  key={tool.nameKey}
                  className="group flex flex-col rounded-[1.75rem] border border-white/10 bg-white/[0.04] p-6 transition hover:-translate-y-1 hover:border-[#fb3570]/50 hover:bg-white/[0.07]"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex size-12 items-center justify-center rounded-2xl bg-[#fb3570] text-white">
                      <Icon className="size-5" />
                    </div>
                    {tool.popular ? (
                      <span className="rounded-full bg-[#fb3570]/15 px-3 py-1 text-xs font-black text-[#ffb5ca]">{t("popular")}</span>
                    ) : null}
                  </div>
                  <h3 className="mt-6 text-xl font-black text-white">{t(tool.nameKey)}</h3>
                  <p className="mt-3 flex-1 text-sm leading-6 text-zinc-300">{t(tool.descKey)}</p>
                  <button className="mt-6 inline-flex items-center gap-2 self-start rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-black text-white transition hover:bg-white/10">
                    {t("open")} <ArrowRight className="size-4" />
                  </button>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}

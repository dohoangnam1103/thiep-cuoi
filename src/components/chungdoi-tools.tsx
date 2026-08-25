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
    <main className="font-app-sans min-h-screen bg-background text-foreground">
      <SiteHeader />

      <section className="border-b border-border bg-secondary py-14 text-center sm:py-20">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <p className="text-sm font-black uppercase tracking-[0.22em] text-accent">{t("eyebrow")}</p>
          <h1 className="mt-4 font-heading text-3xl font-black leading-[1.05] tracking-tight text-foreground sm:text-5xl">{t("title")}</h1>
          <p className="mt-4 text-base leading-7 text-muted-foreground sm:text-lg sm:leading-8">{t("subtitle")}</p>
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
                  className="group flex flex-col rounded-2xl border border-border bg-card p-6 shadow-[0_8px_30px_rgb(0_0_0/0.06)] transition hover:-translate-y-1 hover:border-primary/50"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex size-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
                      <Icon className="size-5" />
                    </div>
                    {tool.popular ? (
                      <span className="rounded-full bg-primary/15 px-3 py-1 text-xs font-black text-primary">{t("popular")}</span>
                    ) : null}
                  </div>
                  <h2 className="mt-6 font-heading text-lg font-black text-foreground sm:text-xl">{t(tool.nameKey)}</h2>
                  <p className="mt-3 flex-1 text-sm leading-6 text-muted-foreground">{t(tool.descKey)}</p>
                  <button className="mt-6 inline-flex items-center gap-2 self-start rounded-full border border-border bg-secondary px-4 py-2 text-sm font-black text-foreground transition hover:bg-muted">
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

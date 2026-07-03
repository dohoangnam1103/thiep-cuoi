import type { Metadata } from "next";
import { ArrowRight, BookOpen, CreditCard, LifeBuoy, Search, Share2, Sparkles, Users } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { SiteFooter, SiteHeader } from "@/components/chungdoi-chrome";
import { helpCategories, helpPopularArticles } from "@/data/chungdoi-content";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "help" });

  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
  };
}

const CATEGORY_ICONS: LucideIcon[] = [Sparkles, BookOpen, Users, Share2, CreditCard, LifeBuoy];

export default async function HelpPage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "help" });

  return (
    <main className="min-h-screen bg-background text-foreground">
      <SiteHeader />

      <section className="border-b border-border bg-[radial-gradient(circle_at_15%_-10%,rgba(122,143,106,0.16),transparent_40%)] py-14 text-center sm:py-20">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <h1 className="font-heading text-4xl font-black leading-[1.05] tracking-tight text-foreground sm:text-6xl">
            {t("title")}
          </h1>
          <p className="mt-5 text-lg leading-8 text-muted-foreground">{t("subtitle")}</p>
          <div className="mt-8 flex items-center gap-3 rounded-full border border-border bg-card px-5 py-3 text-left shadow-[0_8px_30px_rgb(0_0_0/0.06)]">
            <Search className="size-5 shrink-0 text-muted-foreground" />
            <input
              type="search"
              placeholder={t("searchPlaceholder")}
              className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
            />
          </div>
        </div>
      </section>

      <section className="py-14 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {helpCategories.map((category, index) => {
              const Icon = CATEGORY_ICONS[index] ?? BookOpen;
              return (
                <article
                  key={category.name}
                  className="group flex flex-col rounded-2xl border border-border bg-card p-6 shadow-[0_8px_30px_rgb(0_0_0/0.06)] transition hover:-translate-y-1 hover:border-primary/50"
                >
                  <div className="flex size-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
                    <Icon className="size-5" />
                  </div>
                  <h3 className="mt-6 font-heading text-xl font-black text-foreground">{category.name}</h3>
                  <p className="mt-3 flex-1 text-sm leading-6 text-muted-foreground">{category.description}</p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="border-t border-border bg-secondary py-14 sm:py-20">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <h2 className="font-heading text-2xl font-black text-foreground sm:text-3xl">{t("popularTitle")}</h2>
          <div className="mt-8 divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card shadow-[0_8px_30px_rgb(0_0_0/0.06)]">
            {helpPopularArticles.map((article) => (
              <Link
                key={article}
                href="/help"
                className="flex items-center justify-between gap-4 p-5 text-sm font-bold text-foreground transition hover:bg-muted"
              >
                {article}
                <ArrowRight className="size-4 shrink-0 text-accent" />
              </Link>
            ))}
          </div>
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}

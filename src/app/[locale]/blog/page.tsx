import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { SiteFooter, SiteHeader } from "@/components/chungdoi-chrome";
import { blogPosts } from "@/data/chungdoi-content";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { pageSeo, staticAlternates } from "@/lib/seo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "blog" });
  const title = t("metaTitle");
  const description = t("metaDescription");

  return {
    ...pageSeo({
      title,
      description,
      alternates: staticAlternates("/blog", locale),
      locale,
    }),
    robots: { index: false, follow: true },
  };
}

export default async function BlogPage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "blog" });

  return (
    <main className="min-h-screen bg-background text-foreground">
      <SiteHeader />

      <section className="border-b border-border bg-secondary py-14 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <p className="text-sm font-black uppercase tracking-[0.22em] text-accent">{t("eyebrow")}</p>
          <h1 className="mt-4 font-heading text-4xl font-black leading-[1.05] tracking-tight text-foreground sm:text-6xl">
            {t("title")}
          </h1>
        </div>
      </section>

      <section className="py-14 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {blogPosts.map((post) => (
              <Link
                key={post.slug}
                href={{ pathname: "/blog/[slug]", params: { slug: post.slug } }}
                className="group flex flex-col rounded-2xl border border-border bg-card p-6 shadow-[0_8px_30px_rgb(0_0_0/0.06)] transition hover:-translate-y-1 hover:border-primary/50"
              >
                <h2 className="font-heading text-lg font-black leading-snug text-foreground transition group-hover:text-primary">
                  {post.title}
                </h2>
                <p className="mt-3 flex-1 text-sm leading-6 text-muted-foreground">{post.excerpt}</p>
                <span className="mt-5 text-sm font-black text-primary">{t("readMore")}</span>
              </Link>
            ))}
          </div>
          <p className="mt-10 text-center text-sm text-muted-foreground">{t("pagination")}</p>
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}

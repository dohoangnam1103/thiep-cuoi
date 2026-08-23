import type { Metadata } from "next";
import Image from "next/image";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { SiteFooter, SiteHeader } from "@/components/chungdoi-chrome";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { listPublishedBlogPosts } from "@/lib/blog-posts";
import { createVietnamDateFormatter } from "@/lib/datetime";
import { pageSeo, staticAlternates } from "@/lib/seo";

export const dynamic = "force-dynamic";

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
  const posts = await listPublishedBlogPosts();
  const dateFormatter = createVietnamDateFormatter({ dateStyle: "medium" }, locale);

  return (
    <main className="min-h-screen bg-background text-foreground">
      <SiteHeader />

      <section className="border-b border-border bg-secondary py-14 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <p className="text-sm font-black uppercase tracking-[0.22em] text-accent">{t("eyebrow")}</p>
          <h1 className="mt-4 font-heading text-3xl font-black leading-[1.05] tracking-tight text-foreground sm:text-5xl">
            {t("title")}
          </h1>
        </div>
      </section>

      <section className="py-14 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {posts.length > 0 ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {posts.map((post) => (
              <Link
                key={post.slug}
                href={{ pathname: "/blog/[slug]", params: { slug: post.slug } }}
                className="group flex min-w-0 flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-[0_8px_30px_rgb(0_0_0/0.06)] transition hover:-translate-y-1 hover:border-primary/50"
              >
                {post.thumbnailUrl ? (
                  <div className="relative aspect-[16/9] overflow-hidden bg-muted">
                    <Image
                      src={post.thumbnailUrl}
                      alt=""
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      className="object-cover transition duration-500 group-hover:scale-[1.03]"
                    />
                  </div>
                ) : null}
                <div className="flex flex-1 flex-col p-6">
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-bold text-muted-foreground">
                    {post.category ? <span className="text-accent">{post.category}</span> : null}
                    {post.publishedAt ? (
                      <time dateTime={post.publishedAt.toISOString()}>
                        {dateFormatter.format(post.publishedAt)}
                      </time>
                    ) : null}
                  </div>
                  <h2 className="mt-3 font-heading text-base font-black leading-snug text-foreground sm:text-lg transition group-hover:text-primary">
                    {post.title}
                  </h2>
                  <p className="mt-3 flex-1 text-sm leading-6 text-muted-foreground">{post.excerpt}</p>
                  <span className="mt-5 text-sm font-black text-primary">{t("readMore")}</span>
                </div>
              </Link>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-border bg-card px-5 py-14 text-center text-muted-foreground">
              {t("empty")}
            </div>
          )}
          <p className="mt-8 text-center text-xs text-muted-foreground sm:text-sm">
            {t("postCount", { count: posts.length })}
          </p>
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}

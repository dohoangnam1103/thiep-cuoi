import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { SiteFooter, SiteHeader } from "@/components/chungdoi-chrome";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { sanitizeBlogHtml } from "@/lib/blog-content";
import {
  getPublishedBlogPost,
  getRelatedBlogPosts,
} from "@/lib/blog-posts";
import { blogAlternates, pageSeo } from "@/lib/seo";

export const dynamic = "force-dynamic";

type BlogDetailProps = {
  params: Promise<{ locale: Locale; slug: string }>;
};

export async function generateMetadata({ params }: BlogDetailProps): Promise<Metadata> {
  const { locale, slug } = await params;
  const post = await getPublishedBlogPost(slug);
  const t = await getTranslations({ locale, namespace: "blog" });

  if (!post) {
    return {
      title: { absolute: t("metaTitle") },
      robots: { index: false, follow: true },
    };
  }

  const title = `${post.title} | Thiệp Mừng Online Blog`;

  return {
    ...pageSeo({
      title,
      description: post.excerpt,
      alternates: blogAlternates(slug, locale),
      locale,
      type: "article",
    }),
    robots: { index: false, follow: true },
  };
}

export default async function BlogDetailPage({ params }: BlogDetailProps) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "blog" });
  const post = await getPublishedBlogPost(slug);

  if (!post) notFound();

  const related = await getRelatedBlogPosts(post);
  const contentHtml = sanitizeBlogHtml(post.contentHtml);
  const dateFormatter = new Intl.DateTimeFormat(locale, { dateStyle: "long" });

  return (
    <main className="min-h-screen bg-background text-foreground">
      <SiteHeader />

      <article className="mx-auto max-w-3xl px-4 py-14 sm:px-6 sm:py-20 lg:px-8">
        <Link href="/blog" className="text-sm font-bold text-primary transition hover:text-primary/80">
          {t("backToBlog")}
        </Link>
        <div className="mt-6 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm font-bold text-muted-foreground">
          {post.category ? <span className="text-accent">{post.category}</span> : null}
          {post.publishedAt ? (
            <time dateTime={post.publishedAt.toISOString()}>
              {dateFormatter.format(post.publishedAt)}
            </time>
          ) : null}
        </div>
        <h1 className="mt-6 font-heading text-3xl font-black leading-tight tracking-tight text-foreground sm:text-5xl">
          {post.title}
        </h1>
        <p className="mt-6 text-lg leading-8 text-muted-foreground">{post.excerpt}</p>
        {post.thumbnailUrl ? (
          <div className="relative mt-8 aspect-video overflow-hidden rounded-2xl bg-muted">
            <Image
              src={post.thumbnailUrl}
              alt=""
              fill
              priority
              sizes="(max-width: 768px) 100vw, 768px"
              className="object-cover"
            />
          </div>
        ) : null}
        <div
          className="blog-article-content mt-10"
          dangerouslySetInnerHTML={{ __html: contentHtml }}
        />
      </article>

      <section className="border-t border-border bg-secondary py-14 sm:py-20">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <h2 className="font-heading text-2xl font-black text-foreground sm:text-3xl">{t("related")}</h2>
          <div className="mt-8 grid gap-6 sm:grid-cols-3">
            {related.map((item) => (
              <Link
                key={item.slug}
                href={{ pathname: "/blog/[slug]", params: { slug: item.slug } }}
                className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-[0_8px_30px_rgb(0_0_0/0.06)] transition hover:-translate-y-1 hover:border-primary/50"
              >
                {item.thumbnailUrl ? (
                  <div className="relative aspect-video bg-muted">
                    <Image
                      src={item.thumbnailUrl}
                      alt=""
                      fill
                      sizes="(max-width: 640px) 100vw, 33vw"
                      className="object-cover"
                    />
                  </div>
                ) : null}
                <div className="p-5">
                  <h3 className="font-heading text-lg font-black leading-snug text-foreground group-hover:text-primary">
                    {item.title}
                  </h3>
                  <p className="mt-3 line-clamp-2 text-sm leading-6 text-muted-foreground">{item.excerpt}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}

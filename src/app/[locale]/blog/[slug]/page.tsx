import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { SiteFooter, SiteHeader } from "@/components/chungdoi-chrome";
import { blogPosts } from "@/data/chungdoi-content";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { blogAlternates } from "@/lib/seo";
import { absoluteUrl } from "@/lib/site-url";

type BlogDetailProps = {
  params: Promise<{ locale: Locale; slug: string }>;
};

export function generateStaticParams() {
  return blogPosts.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }: BlogDetailProps): Promise<Metadata> {
  const { locale, slug } = await params;
  const post = blogPosts.find((item) => item.slug === slug);
  const t = await getTranslations({ locale, namespace: "blog" });

  if (!post) {
    return { title: { absolute: t("metaTitle") } };
  }

  const title = `${post.title} | Thiệp Mừng Online Blog`;
  const image = absoluteUrl("/chungdoi/icon-v2.png");

  return {
    title: { absolute: title },
    description: post.excerpt,
    alternates: blogAlternates(slug, locale),
    openGraph: {
      type: "article",
      title,
      description: post.excerpt,
      images: [{ url: image }],
      siteName: "Thiệp Mừng Online",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: post.excerpt,
      images: [image],
    },
  };
}

export default async function BlogDetailPage({ params }: BlogDetailProps) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "blog" });
  const post = blogPosts.find((item) => item.slug === slug);

  if (!post) notFound();

  const related = blogPosts.filter((item) => item.slug !== post.slug).slice(0, 3);

  return (
    <main className="min-h-screen bg-background text-foreground">
      <SiteHeader />

      <article className="mx-auto max-w-3xl px-4 py-14 sm:px-6 sm:py-20 lg:px-8">
        <Link href="/blog" className="text-sm font-bold text-primary transition hover:text-primary/80">
          ← {t("backToBlog")}
        </Link>
        <h1 className="mt-6 font-heading text-3xl font-black leading-tight tracking-tight text-foreground sm:text-5xl">
          {post.title}
        </h1>
        <p className="mt-6 text-lg leading-8 text-muted-foreground">{post.excerpt}</p>
        <div className="mt-8 space-y-5 text-base leading-8 text-foreground">
          <p>{t("cloneNote1")}</p>
          <p>{t("cloneNote2")}</p>
        </div>
      </article>

      <section className="border-t border-border bg-secondary py-14 sm:py-20">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <h2 className="font-heading text-2xl font-black text-foreground sm:text-3xl">{t("related")}</h2>
          <div className="mt-8 grid gap-6 sm:grid-cols-3">
            {related.map((item) => (
              <Link
                key={item.slug}
                href={{ pathname: "/blog/[slug]", params: { slug: item.slug } }}
                className="group flex flex-col rounded-2xl border border-border bg-card p-5 shadow-[0_8px_30px_rgb(0_0_0/0.06)] transition hover:-translate-y-1 hover:border-primary/50"
              >
                <h3 className="font-heading text-lg font-black leading-snug text-foreground group-hover:text-primary">
                  {item.title}
                </h3>
                <p className="mt-3 line-clamp-2 text-sm leading-6 text-muted-foreground">{item.excerpt}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}

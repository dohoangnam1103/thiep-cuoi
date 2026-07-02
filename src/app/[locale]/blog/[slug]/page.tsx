import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { SiteFooter, SiteHeader } from "@/components/chungdoi-chrome";
import { blogPosts } from "@/data/chungdoi-content";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";

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
    return { title: t("metaTitle") };
  }

  return {
    title: `${post.title} | ChungDoi Blog`,
    description: post.excerpt,
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
    <main className="min-h-screen bg-[#18120f] text-white">
      <SiteHeader />

      <article className="mx-auto max-w-3xl px-4 py-14 sm:px-6 sm:py-20 lg:px-8">
        <Link href="/blog" className="text-sm font-bold text-[#ff8cad] transition hover:text-[#fb3570]">
          ← {t("backToBlog")}
        </Link>
        <h1 className="mt-6 text-3xl font-black leading-tight tracking-tight text-white sm:text-5xl">
          {post.title}
        </h1>
        <p className="mt-6 text-lg leading-8 text-zinc-300">{post.excerpt}</p>
        <div className="mt-8 space-y-5 text-base leading-8 text-zinc-400">
          <p>{t("cloneNote1")}</p>
          <p>{t("cloneNote2")}</p>
        </div>
      </article>

      <section className="border-t border-white/10 bg-[#211815] py-14 sm:py-20">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-black text-white sm:text-3xl">{t("related")}</h2>
          <div className="mt-8 grid gap-6 sm:grid-cols-3">
            {related.map((item) => (
              <Link
                key={item.slug}
                href={{ pathname: "/blog/[slug]", params: { slug: item.slug } }}
                className="group flex flex-col rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-5 transition hover:-translate-y-1 hover:border-[#fb3570]/50 hover:bg-white/[0.07]"
              >
                <h3 className="text-lg font-black leading-snug text-white group-hover:text-[#ff8cad]">
                  {item.title}
                </h3>
                <p className="mt-3 line-clamp-2 text-sm leading-6 text-zinc-400">{item.excerpt}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}

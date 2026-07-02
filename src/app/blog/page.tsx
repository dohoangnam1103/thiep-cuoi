import type { Metadata } from "next";

import { SiteFooter, SiteHeader } from "@/components/chungdoi-chrome";
import { blogPosts } from "@/data/chungdoi-content";

export const metadata: Metadata = {
  title: "Blog | ChungDoi Clone",
  description: "Kinh nghiệm và xu hướng thiệp cưới mới nhất từ ChungDoi.",
};

export default function BlogPage() {
  return (
    <main className="min-h-screen bg-[#18120f] text-white">
      <SiteHeader />

      <section className="border-b border-white/10 bg-[radial-gradient(circle_at_15%_-10%,rgba(251,53,112,0.22),transparent_40%)] py-14 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <p className="text-sm font-black uppercase tracking-[0.22em] text-[#ff8cad]">Blog</p>
          <h1 className="mt-4 text-4xl font-black leading-[1.05] tracking-tight text-white sm:text-6xl">
            Kinh nghiệm và xu hướng thiệp cưới mới nhất
          </h1>
        </div>
      </section>

      <section className="py-14 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {blogPosts.map((post) => (
              <a
                key={post.slug}
                href={`/blog/${post.slug}`}
                className="group flex flex-col rounded-[1.75rem] border border-white/10 bg-white/[0.04] p-6 transition hover:-translate-y-1 hover:border-[#fb3570]/50 hover:bg-white/[0.07]"
              >
                <h2 className="text-lg font-black leading-snug text-white transition group-hover:text-[#ffb5ca]">
                  {post.title}
                </h2>
                <p className="mt-3 flex-1 text-sm leading-6 text-zinc-300">{post.excerpt}</p>
                <span className="mt-5 text-sm font-black text-[#fb3570]">Đọc tiếp →</span>
              </a>
            ))}
          </div>
          <p className="mt-10 text-center text-sm text-zinc-500">1 - 12 / 22 bài viết</p>
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}

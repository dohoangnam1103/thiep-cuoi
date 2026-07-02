import type { Metadata } from "next";
import { ArrowRight, BookOpen, CreditCard, LifeBuoy, Search, Share2, Sparkles, Users } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { SiteFooter, SiteHeader } from "@/components/chungdoi-chrome";
import { helpCategories, helpPopularArticles } from "@/data/chungdoi-content";

export const metadata: Metadata = {
  title: "Trung tâm trợ giúp | ChungDoi",
  description: "Tìm câu trả lời nhanh chóng. Tạo thiệp cưới hoàn hảo cùng ChungDoi.",
};

const CATEGORY_ICONS: LucideIcon[] = [Sparkles, BookOpen, Users, Share2, CreditCard, LifeBuoy];

export default function HelpPage() {
  return (
    <main className="min-h-screen bg-[#18120f] text-white">
      <SiteHeader />

      <section className="border-b border-white/10 bg-[radial-gradient(circle_at_15%_-10%,rgba(251,53,112,0.22),transparent_40%)] py-14 text-center sm:py-20">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl font-black leading-[1.05] tracking-tight text-white sm:text-6xl">
            Trung tâm trợ giúp
          </h1>
          <p className="mt-5 text-lg leading-8 text-zinc-300">
            Tìm câu trả lời nhanh chóng. Tạo thiệp cưới hoàn hảo cùng ChungDoi.
          </p>
          <div className="mt-8 flex items-center gap-3 rounded-full border border-white/10 bg-white/[0.05] px-5 py-3 text-left">
            <Search className="size-5 shrink-0 text-zinc-500" />
            <input
              type="search"
              placeholder="Tìm kiếm câu hỏi..."
              className="w-full bg-transparent text-sm text-white placeholder:text-zinc-500 focus:outline-none"
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
                  className="group flex flex-col rounded-[1.75rem] border border-white/10 bg-white/[0.04] p-6 transition hover:-translate-y-1 hover:border-[#fb3570]/50 hover:bg-white/[0.07]"
                >
                  <div className="flex size-12 items-center justify-center rounded-2xl bg-[#fb3570] text-white">
                    <Icon className="size-5" />
                  </div>
                  <h3 className="mt-6 text-xl font-black text-white">{category.name}</h3>
                  <p className="mt-3 flex-1 text-sm leading-6 text-zinc-300">{category.description}</p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="border-t border-white/10 bg-[#211815] py-14 sm:py-20">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-black text-white sm:text-3xl">Bài viết phổ biến</h2>
          <div className="mt-8 divide-y divide-white/10 overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.04]">
            {helpPopularArticles.map((article) => (
              <a
                key={article}
                href="/help"
                className="flex items-center justify-between gap-4 p-5 text-sm font-bold text-white transition hover:bg-white/[0.04]"
              >
                {article}
                <ArrowRight className="size-4 shrink-0 text-[#ff8cad]" />
              </a>
            ))}
          </div>
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}

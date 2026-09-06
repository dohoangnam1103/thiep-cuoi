"use client";

import type { ChungDoiDemoContent } from "@/data/chungdoi-demo-content";
import { formatDate } from "@/components/chungdoi-tpl-shared";

const rose = "/chungdoi/images/themes/_decor/brocade-flower-red/hoa-hong.webp";

export function HongVanCover({
  content,
  onOpen,
}: {
  content: ChungDoiDemoContent;
  onOpen: () => void;
}) {
  const people = content.couple.brideFirst
    ? [content.couple.brideShortName, content.couple.groomShortName]
    : [content.couple.groomShortName, content.couple.brideShortName];
  const date = formatDate(content.couple.date);

  return (
    <div data-hong-van-cover className="relative w-full overflow-hidden rounded-[2rem] border border-[#d7a85b]/70 bg-[#7b111d] shadow-[0_28px_80px_-18px_rgba(0,0,0,.7)]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_35%,rgba(174,38,46,.9),rgba(92,8,18,.98)_72%)]" />
      <div className="absolute inset-[10px] rounded-[1.65rem] border border-[#e4bd72]/45" />
      <div className="absolute inset-[18px] rounded-[1.45rem] border border-[#e4bd72]/20" />

      <div className="pointer-events-none absolute -left-[9%] -top-[4%] w-[40%] rotate-[-18deg] md:-left-[3%] md:-top-[12%] md:w-[24%]">
        <img src={rose} alt="" className="w-full drop-shadow-[0_16px_14px_rgba(0,0,0,.38)]" />
      </div>
      <div className="pointer-events-none absolute -right-[8%] bottom-[-7%] w-[48%] rotate-[18deg] md:-right-[2%] md:bottom-[-18%] md:w-[27%]">
        <img src={rose} alt="" className="w-full drop-shadow-[0_16px_14px_rgba(0,0,0,.38)]" />
      </div>
      <div className="pointer-events-none absolute bottom-[4%] left-[12%] w-[27%] rotate-[-12deg] opacity-80 md:bottom-[-6%] md:left-[31%] md:w-[16%]">
        <img src={rose} alt="" className="w-full drop-shadow-[0_12px_12px_rgba(0,0,0,.32)]" />
      </div>

      {/* The shared envelope owns width and viewport fitting. Natural content
          can grow for longer names; these minimums match the classic covers. */}
      <div className="relative z-10 flex min-h-[536px] flex-col items-center justify-center px-6 py-8 text-center text-[#fff4df] sm:min-h-[554px] md:min-h-[516px] md:px-16">
        <p className="mb-4 text-[10px] font-semibold uppercase tracking-[.38em] text-[#edc77e]">Thiệp cưới</p>
        <div className="mb-5 flex items-center gap-4 text-[#edc77e]">
          <span className="h-px w-12 bg-[#edc77e]/70 md:w-24" />
          <span className="text-xl">✦</span>
          <span className="h-px w-12 bg-[#edc77e]/70 md:w-24" />
        </div>
        <h1 className="max-w-full font-art-qellia text-[2.6rem] leading-[.95] tracking-tight [overflow-wrap:anywhere] sm:text-[2.9rem] md:text-[3.5rem]">
          {people[0]} <span className="my-2 block text-[.48em] text-[#edc77e]">&amp;</span> {people[1]}
        </h1>
        {date ? <p className="mt-6 text-sm tracking-[.32em] text-[#f4d8a0] md:text-base">{date.day}.{date.month}.{date.yearNumber}</p> : null}
        <button type="button" onClick={onOpen} className="mt-7 rounded-full border border-[#edc77e]/80 bg-[#a82432] px-8 py-3 text-sm font-semibold text-[#fff7eb] shadow-[0_12px_28px_rgba(0,0,0,.35)] transition hover:-translate-y-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#edc77e] md:mt-8 md:px-10 md:py-3.5">
          Mở thiệp
        </button>
      </div>
    </div>
  );
}

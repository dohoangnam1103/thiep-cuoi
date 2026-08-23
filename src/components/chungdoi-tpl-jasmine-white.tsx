"use client";

import type { ChungDoiDemoContent } from "@/data/chungdoi-demo-content";
import { FloralInvitation } from "@/components/chungdoi-tpl-floral-base";
import { orderedCouple } from "@/lib/invitation-display";

const BASE = "/chungdoi/images/themes/_decor/moclan-white";
const compactName = (value: string) => value.trim().split(/\s+/).slice(-2).join(" ");

function JasmineWhiteHero({ content }: { content: ChungDoiDemoContent }) {
  const people = orderedCouple(content);
  const scriptFont = { fontFamily: '"The Nautigal", cursive' };

  return (
    <header data-template-hero="jasmine-white" className="relative flex w-full justify-center pb-8 pt-16 text-[#404a1d] md:pb-12 md:pt-24">
      <div className="relative w-[86%] md:w-[70%]">
        <img src={`${BASE}/khung-hoa.webp`} alt="" aria-hidden className="block h-auto w-full" />
        <div className="absolute inset-x-0 top-[12%] z-10 flex flex-col items-center text-center md:top-[8%]">
          <span className="whitespace-pre-line text-center text-[12px] uppercase leading-[1.55] tracking-[0.25em] md:text-[15px]">THE<br />WEDDING<br />OF</span>
          <div className="mt-6 flex flex-col items-center text-[72px] leading-[0.72] md:mt-8 md:text-[120px]" style={scriptFont}>
          <span>{compactName(people[0].shortName)}</span>
          <span className="my-3 text-[0.72em] md:my-5">&amp;</span>
          <span>{compactName(people[1].shortName)}</span>
          </div>
        </div>
      </div>
    </header>
  );
}

export function JasmineWhiteInvitation({ content }: { content: ChungDoiDemoContent }) {
  return (
    <FloralInvitation
      coupleNameClass="font-couple-garamond"
      content={content}
      hero={<JasmineWhiteHero content={content} />}
      palette={{
        outerBg: "linear-gradient(180deg,#fbfaf6 0%,#f4efe4 55%,#eee5d5 100%)",
        cardBg: "rgba(255,255,255,0.72)",
        text: "#6d5a41",
        accent: "#b08a4a",
        nameFont: { fontFamily: '"The Nautigal", cursive' },
        ampFont: { fontFamily: '"The Nautigal", cursive' },
        giftHeading: "Hộp Quà Mừng",
        giftMode: "envelope",
        giftColor: "#404a1d",
        footerBg: "transparent",
        footerText: "#404a1d",
      }}
      backdrop={[
        { src: `${BASE}/hoa.webp`, className: "top-[520px] -right-[32%] h-[680px] opacity-[0.2] md:-right-[12%] md:h-[960px]" },
        { src: `${BASE}/hoa.webp`, className: "top-[1540px] -left-[32%] h-[680px] opacity-[0.16] md:-left-[12%] md:h-[960px]", flip: true },
      ]}
      albumDecor={[{ src: `${BASE}/hoa.webp`, className: "-right-[28%] top-0 h-[460px] opacity-[0.16] md:h-[660px]" }]}
      lowerDecor={{ src: `${BASE}/hoa.webp`, className: "bottom-[40px] -right-[34%] h-[620px] opacity-[0.1] md:-right-[10%] md:h-[850px]" }}
    />
  );
}

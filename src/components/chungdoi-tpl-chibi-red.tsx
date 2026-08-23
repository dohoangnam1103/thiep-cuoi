"use client";

import type { ChungDoiDemoContent } from "@/data/chungdoi-demo-content";
import { FloralInvitation } from "@/components/chungdoi-tpl-floral-base";

const BASE = "/chungdoi/images/themes/_decor/chibi_red";
const compactName = (value: string) => value.trim().split(/\s+/).slice(-2).join(" ");

function ChibiRedHero({ content }: { content: ChungDoiDemoContent }) {
  const { couple } = content;
  const nameFont = { fontFamily: '"DFVN New Eddy", "Fz Qellia", serif' };

  return (
    <header data-template-hero="chibi-red" className="relative z-20 flex w-full flex-col items-center bg-[#fff1df] pt-5 text-center text-[#4c2d1f] md:pt-10">
      <div className="relative z-10 mb-5 flex flex-wrap items-center justify-center gap-2 text-[24px] leading-none md:mb-8 md:gap-4 md:text-[32px] lg:text-[38px]" style={nameFont}>
        <span>{compactName(couple.brideFirst ? (couple.brideShortName || couple.brideFullName) : (couple.groomShortName || couple.groomFullName))}</span>
        <span className="text-[30px] md:text-[40px] lg:text-[48px]" style={{ fontFamily: '"Babylonica", cursive' }}>&amp;</span>
        <span>{compactName(couple.brideFirst ? (couple.groomShortName || couple.groomFullName) : (couple.brideShortName || couple.brideFullName))}</span>
      </div>
      <div className="relative z-[2] mx-auto w-[90%] max-w-[294px] md:max-w-[360px] lg:max-w-[414px]">
        <img src={`${BASE}/couple-main.webp`} alt="" aria-hidden className="h-auto w-full" />
      </div>
      <div className="relative mx-auto w-full max-w-[326px] md:max-w-[400px] lg:max-w-[460px]">
        <img src={`${BASE}/decorative-flowers.webp`} alt="" aria-hidden className="relative z-[1] -mt-[30px] w-full" />
        <img src={`${BASE}/double-happiness.webp`} alt="" aria-hidden className="absolute bottom-[-20px] left-1/2 z-[3] w-[98px] -translate-x-1/2 md:w-[120px] lg:w-[140px]" />
      </div>
    </header>
  );
}

export function ChibiRedInvitation({ content }: { content: ChungDoiDemoContent }) {
  return (
    <FloralInvitation
      coupleNameClass="font-couple-garamond"
      content={content}
      hero={<ChibiRedHero content={content} />}
      albumFirst
      palette={{
        outerBg: "#ffffff",
        surfaceBg: "#fff1df",
        cardBg: "rgba(255,255,255,0.7)",
        text: "#7c2d25",
        accent: "#d63b2e",
        nameFont: { fontFamily: '"DFVN New Eddy", "Fz Qellia", serif' },
        ampFont: { fontFamily: '"Alex Brush", "The Nautigal", cursive' },
        welcome: "Happy Wedding",
        footerBg: "transparent",
        footerText: "#572f24",
      }}
      albumDecor={[{ src: `${BASE}/decorative-header.webp`, className: "left-1/2 -top-8 h-auto w-[278px] -translate-x-1/2 opacity-100 md:w-[340px] lg:w-[400px]" }]}
    />
  );
}

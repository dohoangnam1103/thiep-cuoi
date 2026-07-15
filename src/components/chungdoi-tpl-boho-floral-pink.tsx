"use client";

import type { ChungDoiDemoContent } from "@/data/chungdoi-demo-content";
import { FloralInvitation } from "@/components/chungdoi-tpl-floral-base";

const BASE = "/chungdoi/images/themes/_decor/boho-floral-pink";
const scriptFont = { fontFamily: '"Fz Aghita", "The Nautigal", cursive' };

function BohoFloralPinkHero({ content }: { content: ChungDoiDemoContent }) {
  const { couple, gallery } = content;

  return (
    <header
      data-template-hero="boho-floral-pink"
      className="relative z-20 min-h-[910px] overflow-hidden px-6 pb-4 pt-[190px] text-[#9d6d63] md:min-h-[900px] md:px-8 md:pb-8 md:pt-[300px]"
    >
      <img
        src={`${BASE}/asset_1.webp`}
        alt=""
        aria-hidden
        className="pointer-events-none absolute -left-[17%] -top-[2%] z-0 w-[112%] max-w-none md:-left-[2%] md:-top-[1%] md:w-[75%]"
      />
      <img
        src={`${BASE}/asset_2.webp`}
        alt=""
        aria-hidden
        className="pointer-events-none absolute -right-[48%] top-[8%] z-0 h-[94%] w-auto max-w-none opacity-[0.09] md:-right-[8%] md:top-[3%] md:h-[106%]"
      />

      <div className="absolute right-[8%] top-[160px] z-20 flex w-[47%] flex-col items-center text-center md:right-[17%] md:top-[160px] md:w-[32%]">
        <span className="text-[12px] tracking-[0.12em] md:text-[14px]">{couple.groomBirthOrder || "Trưởng Nam"}</span>
        <span className="mt-1 text-[29px] leading-tight md:text-[36px]" style={scriptFont}>{couple.groomShortName || couple.groomFullName}</span>
        <span className="mt-3 text-[12px] tracking-[0.12em] md:text-[14px]">{couple.brideBirthOrder || "Út Nữ"}</span>
        <span className="mt-1 text-[29px] leading-tight md:text-[36px]" style={scriptFont}>{couple.brideShortName || couple.brideFullName}</span>
      </div>

      <div className="relative z-10 mx-auto h-[690px] w-full max-w-[430px] md:ml-[18%] md:h-[650px] md:max-w-[440px]">
        {gallery[0] ? (
          <figure className="absolute left-[24%] top-[95px] w-[54%] rotate-[12deg] border-[5px] border-[#f4b7c2] bg-white shadow-sm md:left-[30%] md:top-[25px] md:w-[52%]">
            <div className="aspect-[0.72] overflow-hidden">
              <img src={gallery[0]} alt={couple.groomFullName} className="h-full w-full object-cover" />
            </div>
            <figcaption className="absolute -bottom-1 left-1/2 -translate-x-1/2 whitespace-nowrap text-[27px] text-white md:text-[34px]" style={scriptFont}>Love always</figcaption>
          </figure>
        ) : null}
        {gallery[1] ? (
          <figure className="absolute bottom-[28px] left-[3%] w-[52%] -rotate-[12deg] border-[5px] border-[#aaa8c2] bg-white shadow-sm md:bottom-0 md:left-[4%] md:w-[51%]">
            <div className="aspect-[0.72] overflow-hidden">
              <img src={gallery[1]} alt={couple.brideFullName} className="h-full w-full object-cover" />
            </div>
            <figcaption className="absolute -bottom-1 left-1/2 -translate-x-1/2 whitespace-nowrap text-[27px] text-white md:text-[34px]" style={scriptFont}>Symphony</figcaption>
          </figure>
        ) : null}
      </div>
    </header>
  );
}

export function BohoFloralPinkInvitation({ content }: { content: ChungDoiDemoContent }) {
  return (
    <FloralInvitation
      content={content}
      hero={<BohoFloralPinkHero content={content} />}
      palette={{
        outerBg: "#ffffff",
        cardBg: "#fffaf7",
        surfaceBg: "#fffaf7",
        text: "#9d6d63",
        accent: "#9d6d63",
        nameFont: scriptFont,
        ampFont: scriptFont,
        footerBg: "transparent",
        footerText: "#9d6d63",
      }}
      backdrop={[
        { src: `${BASE}/asset_3.webp`, className: "top-[1380px] -right-[30%] h-[680px] opacity-[0.18] md:-right-[8%] md:h-[980px]" },
      ]}
      albumDecor={[{ src: `${BASE}/asset_1.webp`, className: "-right-[30%] top-0 h-[500px] opacity-[0.12] md:h-[700px]" }]}
      lowerDecor={{ src: `${BASE}/asset_3.webp`, className: "bottom-[80px] -right-[42%] h-[720px] opacity-[0.07] md:-right-[12%] md:h-[920px]" }}
    />
  );
}

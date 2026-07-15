"use client";

import type { ChungDoiDemoContent } from "@/data/chungdoi-demo-content";
import { FloralInvitation } from "@/components/chungdoi-tpl-floral-base";

const BASE = "/chungdoi/images/themes/_decor/silkflora-brown";
const compactName = (value: string) => value.trim().split(/\s+/).slice(-2).join(" ");

function SilkFloraBrownHero({ content }: { content: ChungDoiDemoContent }) {
  const { couple } = content;
  const scriptFont = { fontFamily: '"The Nautigal", cursive' };

  return (
    <header data-template-hero="silk-flora-brown" className="relative z-20 flex min-h-[860px] w-full flex-col items-start overflow-hidden px-4 pb-8 pt-[100px] text-[#996247] sm:px-5 md:min-h-[1180px] md:pb-12 md:pt-[152px]">
      <img src={`${BASE}/top-flower.webp`} alt="" aria-hidden className="pointer-events-none absolute top-0 z-0 ml-[4vw] block h-auto w-auto max-w-[min(420px,calc(96vw-2rem))] -rotate-[30deg] object-contain object-top md:ml-[26vw] md:max-w-[min(560px,calc(72vw-2rem))] lg:ml-[35vw] lg:max-w-[min(600px,calc(63vw-2rem))]" />
      <p className="relative z-10 ml-[6%] whitespace-pre text-left text-[clamp(9px,2.4vw,15px)] uppercase tracking-[0.36em] md:ml-[3%] md:text-[clamp(16px,2.8vw,42px)] lg:text-[clamp(17px,1.85vw,40px)]">The Wedding Of</p>
      <h1 className="relative z-10 mb-[20px] ml-[4%] mt-[360px] flex w-[48%] flex-col items-center text-center text-[72px] leading-[0.88] md:ml-[11%] md:mt-[410px] md:w-[35%] md:text-[120px]" style={scriptFont}>
        <span>{compactName(couple.groomShortName || couple.groomFullName)}</span>
        <span className="my-2 text-[0.72em] md:my-0">&amp;</span>
        <span>{compactName(couple.brideShortName || couple.brideFullName)}</span>
      </h1>
    </header>
  );
}

export function SilkFloraBrownInvitation({ content }: { content: ChungDoiDemoContent }) {
  return (
    <FloralInvitation
      content={content}
      hero={<SilkFloraBrownHero content={content} />}
      palette={{
        outerBg: "linear-gradient(180deg,#f4ece0 0%,#ead8c2 55%,#dfc4a7 100%)",
        cardBg: "rgba(255,250,243,0.68)",
        text: "#6f4f35",
        accent: "#9a6a42",
        nameFont: { fontFamily: '"The Nautigal", cursive' },
        ampFont: { fontFamily: '"The Nautigal", cursive' },
        giftHeading: "Hộp Quà Mừng",
        giftMode: "qr",
        giftColor: "#996247",
        footerBg: "transparent",
        footerText: "#996247",
      }}
      backdrop={[
        { src: `${BASE}/middle.webp`, className: "top-[620px] -right-[30%] h-[660px] opacity-[0.18] md:-right-[12%] md:h-[980px]" },
        { src: `${BASE}/middle.webp`, className: "top-[1560px] -left-[30%] h-[660px] opacity-[0.16] md:-left-[12%] md:h-[980px]", flip: true },
      ]}
      albumDecor={[{ src: `${BASE}/middle.webp`, className: "-right-[28%] top-2 h-[430px] opacity-[0.18] md:h-[640px]" }]}
      lowerDecor={{ src: `${BASE}/bottom.webp`, className: "bottom-[20px] -right-[24%] h-[650px] opacity-[0.11] md:-right-[7%] md:h-[900px]" }}
    />
  );
}

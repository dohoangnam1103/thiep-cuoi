"use client";

import type { ChungDoiDemoContent } from "@/data/chungdoi-demo-content";
import { FloralInvitation } from "@/components/chungdoi-tpl-floral-base";

const BASE = "/chungdoi/images/themes/_decor/chibi_red";

export function ChibiRedInvitation({ content }: { content: ChungDoiDemoContent }) {
  return (
    <FloralInvitation
      content={content}
      palette={{
        outerBg: "linear-gradient(180deg,#fff5ef 0%,#ffe8dd 52%,#ffd8cc 100%)",
        cardBg: "rgba(255,255,255,0.7)",
        text: "#7c2d25",
        accent: "#d63b2e",
        nameFont: { fontFamily: '"DFVN New Eddy", "Fz Qellia", serif' },
        ampFont: { fontFamily: '"Alex Brush", "The Nautigal", cursive' },
        welcome: "Happy Wedding",
      }}
      backdrop={[
        { src: `${BASE}/decorative-dragon.webp`, className: "top-[620px] -right-[26%] h-[520px] opacity-[0.14] md:-right-[8%] md:h-[760px]" },
        { src: `${BASE}/cherry-blossom.webp`, className: "top-[1600px] -left-[24%] h-[520px] opacity-[0.16] md:-left-[8%] md:h-[780px]" },
      ]}
      headerDecor={[
        { src: `${BASE}/decorative-header.webp`, className: "-top-4 left-1/2 h-[220px] -translate-x-1/2 opacity-90 md:h-[330px]" },
        { src: `${BASE}/double-happiness.webp`, className: "top-[190px] left-1/2 h-[92px] -translate-x-1/2 opacity-35 md:top-[250px] md:h-[128px]" },
      ]}
      albumDecor={[{ src: `${BASE}/decorative-flowers.webp`, className: "-right-[20%] top-8 h-[360px] opacity-[0.18] md:h-[520px]" }]}
      footerDecor={{ src: `${BASE}/decorative-diamond.webp`, className: "opacity-35" }}
    />
  );
}

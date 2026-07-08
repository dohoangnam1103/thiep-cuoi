"use client";

import type { ChungDoiDemoContent } from "@/data/chungdoi-demo-content";
import { FloralInvitation } from "@/components/chungdoi-tpl-floral-base";

const BASE = "/chungdoi/images/themes/_decor/boho-floral-pink";

export function BohoFloralPinkInvitation({ content }: { content: ChungDoiDemoContent }) {
  return (
    <FloralInvitation
      content={content}
      palette={{
        outerBg: "linear-gradient(180deg,#fbf1f3 0%,#f6e6ea 55%,#f2dde3 100%)",
        cardBg: "rgba(255,255,255,0.66)",
        text: "#76565d",
        accent: "#b46f7d",
        nameFont: { fontFamily: '"Cormorant Garamond", "Playfair Display", serif' },
        ampFont: { fontFamily: '"Alex Brush", "The Nautigal", cursive' },
      }}
      backdrop={[
        { src: `${BASE}/asset_1.webp`, className: "top-[540px] -right-[28%] h-[620px] opacity-[0.18] md:-right-[10%] md:h-[900px]" },
        { src: `${BASE}/asset_3.webp`, className: "top-[1580px] -left-[28%] h-[620px] opacity-[0.16] md:-left-[10%] md:h-[900px]" },
      ]}
      headerDecor={[
        { src: `${BASE}/asset_2.webp`, className: "-top-8 left-1/2 h-[260px] -translate-x-1/2 opacity-90 md:h-[390px]" },
      ]}
      albumDecor={[{ src: `${BASE}/asset_1.webp`, className: "-right-[26%] top-4 h-[420px] opacity-[0.18] md:h-[620px]" }]}
      footerDecor={{ src: `${BASE}/asset_3.webp`, className: "opacity-35" }}
    />
  );
}

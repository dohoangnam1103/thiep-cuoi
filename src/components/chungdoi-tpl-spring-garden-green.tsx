"use client";

import type { ChungDoiDemoContent } from "@/data/chungdoi-demo-content";
import { FloralInvitation } from "@/components/chungdoi-tpl-floral-base";

const BASE = "/chungdoi/images/themes/_decor/nature";

export function SpringGardenGreenInvitation({ content }: { content: ChungDoiDemoContent }) {
  return (
    <FloralInvitation
      content={content}
      palette={{
        outerBg: "linear-gradient(180deg,#f0f4ef 0%,#e8ede6 55%,#dfe5dd 100%)",
        cardBg: "rgba(255,255,255,0.62)",
        text: "#5d6a57",
        accent: "#697a62",
        nameFont: { fontFamily: '"Playfair Display", "Cormorant Garamond", serif' },
        ampFont: { fontFamily: '"Alex Brush", "The Nautigal", cursive' },
      }}
      backdrop={[
        { src: `${BASE}/flower_paralax.webp`, className: "top-[620px] -right-[24%] h-[820px] opacity-[0.16] md:top-[760px] md:-right-[12%] md:h-[1240px]" },
        { src: `${BASE}/flower_paralax.webp`, className: "top-[1500px] -left-[24%] h-[820px] opacity-[0.14] md:top-[1700px] md:-left-[12%] md:h-[1240px]", flip: true },
      ]}
      headerDecor={[
        { src: `${BASE}/flower_top.webp`, className: "-top-2 right-0 h-[210px] opacity-95 md:h-[320px]" },
        { src: `${BASE}/flower_top.webp`, className: "-top-2 left-0 h-[210px] opacity-95 md:h-[320px]", flip: true },
      ]}
      albumDecor={[{ src: `${BASE}/flower_paralax.webp`, className: "-right-[34%] top-10 h-[520px] rotate-12 opacity-[0.12] md:-right-[16%] md:h-[780px]" }]}
      footerDecor={{ src: `${BASE}/flower_paralax.webp`, className: "opacity-20" }}
    />
  );
}

"use client";

import type { ChungDoiDemoContent } from "@/data/chungdoi-demo-content";
import { FloralInvitation } from "@/components/chungdoi-tpl-floral-base";

const BASE = "/chungdoi/images/themes/_decor/silkflora-brown";

export function SilkFloraBrownInvitation({ content }: { content: ChungDoiDemoContent }) {
  return (
    <FloralInvitation
      content={content}
      palette={{
        outerBg: "linear-gradient(180deg,#f4ece0 0%,#ead8c2 55%,#dfc4a7 100%)",
        cardBg: "rgba(255,250,243,0.68)",
        text: "#6f4f35",
        accent: "#9a6a42",
        nameFont: { fontFamily: '"Cormorant Garamond", "Playfair Display", serif' },
        ampFont: { fontFamily: '"Alex Brush", "The Nautigal", cursive' },
        giftHeading: "QR Mừng Cưới",
      }}
      backdrop={[
        { src: `${BASE}/middle.webp`, className: "top-[620px] -right-[30%] h-[660px] opacity-[0.18] md:-right-[12%] md:h-[980px]" },
        { src: `${BASE}/middle.webp`, className: "top-[1560px] -left-[30%] h-[660px] opacity-[0.16] md:-left-[12%] md:h-[980px]", flip: true },
      ]}
      headerDecor={[{ src: `${BASE}/top-flower.webp`, className: "-top-10 left-1/2 h-[260px] -translate-x-1/2 opacity-90 md:h-[380px]" }]}
      albumDecor={[{ src: `${BASE}/middle.webp`, className: "-right-[28%] top-2 h-[430px] opacity-[0.18] md:h-[640px]" }]}
      footerDecor={{ src: `${BASE}/bottom.webp`, className: "opacity-90" }}
    />
  );
}

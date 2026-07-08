"use client";

import type { ChungDoiDemoContent } from "@/data/chungdoi-demo-content";
import { FloralInvitation } from "@/components/chungdoi-tpl-floral-base";

const BASE = "/chungdoi/images/themes/jasmine-white";

export function JasmineWhiteInvitation({ content }: { content: ChungDoiDemoContent }) {
  return (
    <FloralInvitation
      content={content}
      palette={{
        outerBg: "linear-gradient(180deg,#fbfaf6 0%,#f4efe4 55%,#eee5d5 100%)",
        cardBg: "rgba(255,255,255,0.72)",
        text: "#6d5a41",
        accent: "#b08a4a",
        nameFont: { fontFamily: '"Playfair Display", "Cormorant Garamond", serif' },
        ampFont: { fontFamily: '"Alex Brush", "The Nautigal", cursive' },
        giftHeading: "QR Mừng Cưới",
      }}
      backdrop={[
        { src: `${BASE}/hoa.webp`, className: "top-[520px] -right-[32%] h-[680px] opacity-[0.2] md:-right-[12%] md:h-[960px]" },
        { src: `${BASE}/hoa.webp`, className: "top-[1540px] -left-[32%] h-[680px] opacity-[0.16] md:-left-[12%] md:h-[960px]", flip: true },
      ]}
      headerDecor={[{ src: `${BASE}/hoa.webp`, className: "-top-10 left-1/2 h-[290px] -translate-x-1/2 opacity-70 md:h-[430px]" }]}
      albumDecor={[{ src: `${BASE}/hoa.webp`, className: "-right-[28%] top-0 h-[460px] opacity-[0.16] md:h-[660px]" }]}
      footerDecor={{ src: `${BASE}/hoa.webp`, className: "opacity-30" }}
    />
  );
}

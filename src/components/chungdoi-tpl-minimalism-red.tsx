"use client";

import type { ChungDoiDemoContent } from "@/data/chungdoi-demo-content";
import { FloralInvitation } from "@/components/chungdoi-tpl-floral-base";

const BASE = "/chungdoi/images/themes/_decor/minimalism-red";

export function MinimalismRedInvitation({ content }: { content: ChungDoiDemoContent }) {
  return (
    <FloralInvitation
      content={content}
      palette={{
        outerBg: "#fff8f4",
        cardBg: "rgba(255,255,255,0.78)",
        text: "#6b2f2b",
        accent: "#b72f2b",
        nameFont: { fontFamily: '"Playfair Display", "Cormorant Garamond", serif' },
        ampFont: { fontFamily: '"Alex Brush", "The Nautigal", cursive' },
      }}
      headerDecor={[{ src: `${BASE}/header-top-01.png`, className: "-top-1 left-1/2 h-[190px] -translate-x-1/2 opacity-95 md:h-[280px]" }]}
      albumDecor={[{ src: `${BASE}/header-bottom-01.png`, className: "-right-[18%] top-8 h-[260px] opacity-[0.18] md:h-[390px]" }]}
      footerDecor={{ src: `${BASE}/header-bottom-01.png`, className: "opacity-95" }}
    />
  );
}

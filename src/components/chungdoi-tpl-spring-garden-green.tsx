"use client";

import type { ChungDoiDemoContent } from "@/data/chungdoi-demo-content";
import { FloralInvitation } from "@/components/chungdoi-tpl-floral-base";
import { orderedCouple } from "@/lib/invitation-display";

const compactName = (value: string) => value.trim().split(/\s+/).slice(-2).join(" ");

function SpringGardenGreenHero({ content }: { content: ChungDoiDemoContent }) {
  const people = orderedCouple(content);
  const nameFont = { fontFamily: '"UNI Chu truyen thong", "Baskerville", serif' };

  return (
    <header data-template-hero="spring-garden-green" className="relative z-20 flex h-[472px] flex-col items-center justify-center text-center text-[#5d6a57] md:h-[650px]">
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-[-49px] z-0 h-[1560px] w-[1680px] -translate-x-1/2 bg-[url('/chungdoi/images/themes/_decor/nature/flower_top.webp')] bg-contain bg-top bg-no-repeat opacity-70 md:h-[2800px] md:w-[3000px]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-[-130px] z-[1] h-[1650px] w-[1730px] -translate-x-[31%] bg-[url('/chungdoi/images/themes/_decor/nature/flower_paralax.webp')] bg-contain bg-center bg-no-repeat opacity-20 md:h-[2946px] md:w-[3092px]"
      />
      <div className="relative z-10 flex w-full flex-col items-center gap-6 px-6 text-[50px] leading-[75px] md:px-10 md:text-[70px] md:leading-[105px]" style={nameFont}>
        <span>{compactName(people[0].shortName)}</span>
        <span className="text-[37px] leading-[56px] md:text-[50px] md:leading-[75px]">&amp;</span>
        <span>{compactName(people[1].shortName)}</span>
      </div>
    </header>
  );
}

export function SpringGardenGreenInvitation({ content }: { content: ChungDoiDemoContent }) {
  return (
    <FloralInvitation
      content={content}
      hero={<SpringGardenGreenHero content={content} />}
      albumFirst
      palette={{
        outerBg: "#ffffff",
        surfaceBg: "rgba(255,255,255,0.82)",
        cardBg: "rgba(255,255,255,0.62)",
        text: "#5d6a57",
        accent: "#697a62",
        nameFont: { fontFamily: '"Playfair Display", "Cormorant Garamond", serif' },
        ampFont: { fontFamily: '"Alex Brush", "The Nautigal", cursive' },
        footerBg: "transparent",
        footerText: "#5d6a57",
      }}
    />
  );
}

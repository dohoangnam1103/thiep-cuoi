"use client";

import type { ChungDoiDemoContent } from "@/data/chungdoi-demo-content";
import { FloralInvitation } from "@/components/chungdoi-tpl-floral-base";
import { orderedCouple } from "@/lib/invitation-display";

const BASE = "/chungdoi/images/themes/_decor/minimalism-red";
const compactName = (value: string) => value.trim().split(/\s+/).slice(-2).join(" ");

function MinimalismRedHero({ content }: { content: ChungDoiDemoContent }) {
  const people = orderedCouple(content);
  const scriptFont = { fontFamily: '"The Nautigal", cursive' };

  return (
    <>
      <div aria-hidden className="h-[56px] w-full bg-[#7c151a] md:h-[114px]" />
      <header data-template-hero="minimalism-red" className="relative z-20 flex flex-col bg-[#fffaf7] pb-8 md:pb-12">
        <div className="mb-[114px] mt-24 flex w-full justify-center md:mb-[146px] md:mt-32">
          <img src={`${BASE}/header-top-01.png`} alt="" aria-hidden className="h-auto w-[310px] object-contain md:w-[580px] lg:w-[620px]" />
        </div>
        <h1
          className="relative z-10 ml-[20%] mt-[15px] flex flex-col items-start text-[52px] leading-[0.72] text-black md:ml-[25%] md:mt-[85px] md:text-[76px] lg:ml-[28%] lg:text-[84px]"
          style={scriptFont}
        >
          <span>{compactName(people[0].shortName)}</span>
          <span className="my-3 ml-[18%] md:my-5">&amp;</span>
          <span>{compactName(people[1].shortName)}</span>
        </h1>
        <div className="flex w-full justify-center pb-[50px] md:-mt-[70px] md:pb-[75px]">
          <img src={`${BASE}/header-bottom-01.png`} alt="" aria-hidden className="h-auto w-[310px] object-contain md:w-[580px] lg:w-[620px]" />
        </div>
      </header>
    </>
  );
}

export function MinimalismRedInvitation({ content }: { content: ChungDoiDemoContent }) {
  return (
    <FloralInvitation
      content={content}
      hero={<MinimalismRedHero content={content} />}
      palette={{
        outerBg: "#ffffff",
        surfaceBg: "#fffaf7",
        cardBg: "rgba(255,255,255,0.12)",
        text: "#000000",
        accent: "#7c151a",
        nameFont: { fontFamily: '"Fz Qellia", serif' },
        ampFont: { fontFamily: '"The Nautigal", cursive' },
        footerBg: "#7c151a",
        footerText: "#ffffff",
      }}
    />
  );
}

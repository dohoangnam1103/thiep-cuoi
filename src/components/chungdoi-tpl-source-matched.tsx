"use client";

import type { CSSProperties, ReactNode } from "react";

import { FloralInvitation, type FloralPalette } from "@/components/chungdoi-tpl-floral-base";
import type { ChungDoiDemoContent } from "@/data/chungdoi-demo-content";

const scriptFont: CSSProperties = { fontFamily: '"Fz Aghita", "The Nautigal", cursive' };
const serifFont: CSSProperties = { fontFamily: '"DFVN New Eddy", "Cormorant Garamond", serif' };
const traditionalFont: CSSProperties = { fontFamily: '"UNI Chu truyen thong", "Baskerville", serif' };

function names(content: ChungDoiDemoContent) {
  return {
    groom: content.couple.groomShortName || content.couple.groomFullName,
    bride: content.couple.brideShortName || content.couple.brideFullName,
  };
}

function compactName(value: string) {
  return value.trim().split(/\s+/).slice(-2).join(" ");
}

function NameLockup({ content, className = "", font = scriptFont }: { content: ChungDoiDemoContent; className?: string; font?: CSSProperties }) {
  const couple = names(content);
  return (
    <div className={`relative z-20 flex flex-col items-center text-center leading-[0.95] ${className}`} style={font}>
      <span>{couple.groom}</span>
      <span className="my-2 text-[0.62em]">&amp;</span>
      <span>{couple.bride}</span>
    </div>
  );
}

function BotanicalPortraitHero({ content, decor, tone }: { content: ChungDoiDemoContent; decor: string; tone: "green" | "brown" | "pink" }) {
  const gallery = content.gallery;
  const couple = names(content);
  const toneClasses = tone === "green" ? "text-[#355b22]" : tone === "brown" ? "text-[#5b3025]" : "text-[#8b4c55]";
  return (
    <header className={`relative z-20 min-h-[760px] overflow-hidden px-5 pt-12 ${toneClasses}`}>
      <img src={decor} alt="" aria-hidden className="pointer-events-none absolute -left-28 -top-20 z-0 h-[360px] w-[360px] max-w-none object-contain opacity-95" />
      <img src={decor} alt="" aria-hidden className="pointer-events-none absolute -bottom-24 -right-28 z-0 h-[390px] w-[390px] max-w-none rotate-180 object-contain opacity-90" />
      <div className="relative z-10 mx-auto mt-10 h-[555px] max-w-[410px]">
        {gallery[0] ? (
          <figure className="absolute left-[3%] top-4 w-[58%] -rotate-6">
            <div className="aspect-[4/5] overflow-hidden border-[6px] border-white bg-white shadow-[0_18px_42px_rgba(74,47,37,0.2)]">
              <img src={gallery[0]} alt={content.couple.groomFullName} className="h-full w-full object-cover" />
            </div>
            <figcaption className="mt-3 text-right text-[24px] leading-none" style={scriptFont}>{couple.groom}</figcaption>
          </figure>
        ) : null}
        {gallery[1] ? (
          <figure className="absolute bottom-3 right-[1%] w-[54%] rotate-6">
            <div className="aspect-[4/5] overflow-hidden border-[6px] border-white bg-white shadow-[0_18px_42px_rgba(74,47,37,0.2)]">
              <img src={gallery[1]} alt={content.couple.brideFullName} className="h-full w-full object-cover" />
            </div>
            <figcaption className="mt-3 text-[24px] leading-none" style={scriptFont}>{couple.bride}</figcaption>
          </figure>
        ) : null}
      </div>
    </header>
  );
}

function WatercolorAlbumHero({ content, decor, tone }: { content: ChungDoiDemoContent; decor: string; tone: "red" | "green" | "blue" }) {
  const color = tone === "red" ? "text-[#d25f65]" : tone === "green" ? "text-[#5d6a57]" : "text-[#50768e]";
  return (
    <header className={`relative z-20 flex min-h-[420px] flex-col items-center justify-center overflow-hidden px-5 py-20 ${color}`}>
      <img src={decor} alt="" aria-hidden className="pointer-events-none absolute inset-x-0 top-0 z-0 h-[270px] w-full object-cover object-top opacity-55" />
      <img src={decor} alt="" aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 z-0 h-[250px] w-full rotate-180 object-cover object-top opacity-25" />
      <NameLockup content={content} className="text-[54px] md:text-[76px]" font={traditionalFont} />
    </header>
  );
}

function ElegantLeafHero({ content }: { content: ChungDoiDemoContent }) {
  const gallery = content.gallery;
  const couple = names(content);
  return (
    <header className="relative z-20 min-h-[760px] overflow-hidden px-5 pt-14 text-[#365c43]">
      <img src="/chungdoi/images/themes/_decor/thanhdiep-green/la1.webp" alt="" aria-hidden className="pointer-events-none absolute -left-24 -top-20 z-0 h-[510px] w-auto max-w-none object-contain opacity-90" />
      <img src="/chungdoi/images/themes/_decor/thanhdiep-green/la2.webp" alt="" aria-hidden className="pointer-events-none absolute -bottom-28 -right-24 z-0 h-[530px] w-auto max-w-none object-contain opacity-80" />
      <div className="relative z-10 mx-auto mt-10 h-[600px] max-w-[410px]">
        {gallery[0] ? <img src={gallery[0]} alt={content.couple.groomFullName} className="absolute left-0 top-6 aspect-[4/5] w-[58%] -rotate-6 border-[6px] border-white object-cover shadow-xl" /> : null}
        {gallery[1] ? <img src={gallery[1]} alt={content.couple.brideFullName} className="absolute bottom-14 right-0 aspect-[4/5] w-[55%] rotate-6 border-[6px] border-white object-cover shadow-xl" /> : null}
        <div className="absolute right-0 top-4 z-20 w-[42%] text-center">
          <span className="block text-[10px] uppercase tracking-[0.22em] opacity-70">{content.couple.groomBirthOrder}</span>
          <span className="mt-2 block text-[25px]" style={scriptFont}>{couple.groom}</span>
        </div>
        <div className="absolute bottom-0 left-0 z-20 w-[44%] text-center">
          <span className="block text-[10px] uppercase tracking-[0.22em] opacity-70">{content.couple.brideBirthOrder}</span>
          <span className="mt-2 block text-[25px]" style={scriptFont}>{couple.bride}</span>
        </div>
      </div>
    </header>
  );
}

function JasmineHero({ content }: { content: ChungDoiDemoContent }) {
  return (
    <header className="relative z-20 flex min-h-[760px] items-start justify-center overflow-hidden bg-[#fbfaf6] px-5 pt-32 text-[#66723e]">
      <div className="absolute left-1/2 top-20 z-0 h-[540px] w-[72%] -translate-x-1/2 rounded-t-[50%] border border-[#7d8851]/80" />
      <img src="/chungdoi/images/themes/jasmine-white/hoa.webp" alt="" aria-hidden className="pointer-events-none absolute -bottom-8 -right-28 z-0 h-[460px] w-auto max-w-none object-contain" />
      <NameLockup content={content} className="mt-20 max-w-[68%] text-[45px]" font={scriptFont} />
    </header>
  );
}

function FloralArchHero({ content, frame, color, font = serifFont, nameClassName = "text-[48px] md:text-[68px]" }: { content: ChungDoiDemoContent; frame: string; color: string; font?: CSSProperties; nameClassName?: string }) {
  return (
    <header className="relative z-20 flex min-h-[760px] items-center justify-center overflow-hidden px-5 py-12" style={{ color }}>
      <img src={frame} alt="" aria-hidden className="pointer-events-none absolute left-1/2 top-4 z-0 h-[730px] w-auto max-w-none -translate-x-1/2 object-contain" />
      <NameLockup content={content} className={`max-w-[72%] ${nameClassName}`} font={font} />
    </header>
  );
}

function SilkLineHero({ content }: { content: ChungDoiDemoContent }) {
  const couple = names(content);
  return (
    <header className="relative z-20 min-h-[760px] overflow-hidden px-6 text-[#9a674f]">
      <img src="/chungdoi/images/themes/silk-flora-brown/top-flower.webp" alt="" aria-hidden className="pointer-events-none absolute inset-0 z-0 h-full w-full object-cover object-top opacity-95" />
      <div className="relative z-10 flex min-h-[760px] items-end justify-start pb-36">
        <div className="flex w-[48%] flex-col items-center text-center text-[34px] leading-[0.95]" style={scriptFont}>
          <span>{compactName(couple.groom)}</span>
          <span className="my-3 text-[23px]">&amp;</span>
          <span>{compactName(couple.bride)}</span>
        </div>
      </div>
    </header>
  );
}

function LoveArtHero({ content }: { content: ChungDoiDemoContent }) {
  const gallery = content.gallery;
  return (
    <header className="relative z-20 min-h-[820px] overflow-hidden bg-white px-5 pb-12 pt-16 text-[#e12e32]">
      <img src="/chungdoi/images/themes/_decor/love-art/title.webp" alt="" aria-hidden className="mx-auto h-auto w-[290px] object-contain" />
      <div className="relative mx-auto mt-8 h-[470px] max-w-[390px]">
        <img src="/chungdoi/images/themes/_decor/love-art/hy.webp" alt="" aria-hidden className="pointer-events-none absolute left-1/2 top-0 z-0 h-24 w-24 -translate-x-1/2 object-contain" />
        {gallery[0] ? <img src={gallery[0]} alt={content.couple.brideFullName} className="absolute left-1 top-16 aspect-[4/5] w-[48%] -rotate-6 rounded-lg border-[5px] border-[#dd2630] object-cover shadow-lg" /> : null}
        {gallery[1] ? <img src={gallery[1]} alt={content.couple.groomFullName} className="absolute bottom-6 right-0 aspect-[4/5] w-[48%] rotate-6 rounded-lg border-[5px] border-[#dd2630] object-cover shadow-lg" /> : null}
      </div>
      <NameLockup content={content} className="text-[48px] text-[#6d43bc]" font={scriptFont} />
      <img src="/chungdoi/images/themes/_decor/love-art/love.webp" alt="" aria-hidden className="mx-auto mt-7 h-auto w-[180px] object-contain" />
    </header>
  );
}

function MinimalHero({ content }: { content: ChungDoiDemoContent }) {
  return (
    <header className="relative z-20 min-h-[760px] overflow-hidden bg-[#fffaf6] px-5 pb-16 pt-10 text-[#8d191f]">
      <img src="/chungdoi/images/themes/_decor/minimalism-red/header-top-01.png" alt="" aria-hidden className="pointer-events-none absolute left-1/2 top-5 z-0 h-auto w-[500px] max-w-none -translate-x-1/2 object-contain" />
      <div className="relative z-10 flex min-h-[700px] items-end justify-center">
        <NameLockup content={content} className="text-[48px]" font={scriptFont} />
      </div>
    </header>
  );
}

function GlassGardenHero({ content }: { content: ChungDoiDemoContent }) {
  return (
    <header className="relative z-20 flex min-h-[820px] items-center justify-center overflow-hidden px-5 py-16 text-[#55704d]">
      <img src="/chungdoi/images/themes/glass-garden-green/floral-background.webp" alt="" aria-hidden className="pointer-events-none absolute inset-0 z-0 h-full w-full object-cover" />
      <div className="relative z-10 flex min-h-[640px] w-[82%] flex-col items-center justify-center rounded-[48%_48%_16%_16%/20%_20%_10%_10%] border border-white/70 bg-white/35 px-6 py-16 text-center shadow-[0_25px_80px_rgba(56,85,46,0.18)] backdrop-blur-[10px]">
        <NameLockup content={content} className="text-[48px]" font={scriptFont} />
      </div>
    </header>
  );
}

function ChibiHero({ content }: { content: ChungDoiDemoContent }) {
  return (
    <header className="relative z-20 min-h-[800px] overflow-hidden bg-[#fff1df] px-5 pb-10 pt-12 text-[#8a3129]">
      <NameLockup content={content} className="text-[31px]" font={serifFont} />
      <img src="/chungdoi/images/themes/_decor/chibi_red/couple-main.webp" alt="" aria-hidden className="relative z-10 mx-auto mt-3 h-[690px] w-auto max-w-none object-contain" />
    </header>
  );
}

function CherryHero({ content }: { content: ChungDoiDemoContent }) {
  const gallery = content.gallery;
  return (
    <header className="relative z-20 min-h-[820px] overflow-hidden bg-[#fffdf9] px-5 pb-16 pt-10 text-[#d94866]">
      <img src="/chungdoi/images/themes/cherry-blossom-pink/2.webp" alt="" aria-hidden className="pointer-events-none absolute inset-x-0 top-0 z-0 h-[520px] w-full object-cover object-top opacity-95" />
      {gallery[0] ? (
        <div className="relative z-10 mx-auto mt-24 w-[72%] -rotate-6 border-[9px] border-white bg-white shadow-[0_24px_55px_rgba(132,62,76,0.2)]">
          <img src={gallery[0]} alt={`${content.couple.groomFullName} & ${content.couple.brideFullName}`} className="aspect-[4/5] w-full object-cover" />
        </div>
      ) : null}
      <NameLockup content={content} className="mt-14 text-[48px]" font={scriptFont} />
    </header>
  );
}

function palette(text: string, accent: string, outerBg: string, cardBg = "rgba(255,255,255,0.92)", font: CSSProperties = scriptFont): FloralPalette {
  return { outerBg, cardBg, text, accent, nameFont: font, ampFont: font };
}

function buildTemplate(content: ChungDoiDemoContent): { hero: ReactNode; palette: FloralPalette; albumFirst?: boolean } {
  switch (content.slug) {
    case "boho-floral-green":
      return { hero: <BotanicalPortraitHero content={content} decor="/chungdoi/images/themes/_decor/boho-floral-green/flower.webp" tone="green" />, palette: palette("#30530f", "#6b8040", "#fffaf7") };
    case "boho-floral-brown":
      return { hero: <BotanicalPortraitHero content={content} decor="/chungdoi/images/themes/_decor/boho-floral-brown/flower_top.webp" tone="brown" />, palette: palette("#5b3025", "#7a4938", "#fffaf6") };
    case "boho-floral-pink":
      return { hero: <BotanicalPortraitHero content={content} decor="/chungdoi/images/themes/_decor/boho-floral-pink/asset_1.webp" tone="pink" />, palette: palette("#8b4c55", "#b66f7a", "#fff9fa") };
    case "spring-garden-red":
      return { hero: <WatercolorAlbumHero content={content} decor="/chungdoi/images/themes/_decor/vuon-xuan-red/top-right.webp" tone="red" />, palette: palette("#d25f65", "#b54b51", "#fff2f3", "rgba(255,255,255,0.86)", traditionalFont), albumFirst: true };
    case "spring-garden-green":
      return { hero: <WatercolorAlbumHero content={content} decor="/chungdoi/images/themes/_decor/nature/flower_top.webp" tone="green" />, palette: palette("#5d6a57", "#697a62", "#f2f5f0", "rgba(255,255,255,0.86)", traditionalFont), albumFirst: true };
    case "spring-garden-blue":
      return { hero: <WatercolorAlbumHero content={content} decor="/chungdoi/images/themes/_decor/vuon-xuan-blue/button.webp" tone="blue" />, palette: palette("#50768e", "#3f657d", "#edf6fa", "rgba(255,255,255,0.86)", traditionalFont), albumFirst: true };
    case "elegant-leaf-green":
      return { hero: <ElegantLeafHero content={content} />, palette: palette("#365c43", "#4f7459", "#f8fbf7") };
    case "jasmine-white":
      return { hero: <JasmineHero content={content} />, palette: palette("#6d5a41", "#9d804d", "#fbfaf6") };
    case "silk-flora-brown":
      return { hero: <SilkLineHero content={content} />, palette: palette("#9a674f", "#a97155", "#fffaf3") };
    case "hoa-tinh-red":
      return { hero: <LoveArtHero content={content} />, palette: palette("#5b3a8b", "#e12e32", "#ffffff") };
    case "minimalism-red":
      return { hero: <MinimalHero content={content} />, palette: palette("#6b2f2b", "#9a1f25", "#fffaf6", "rgba(255,255,255,0.9)", scriptFont) };
    case "brocade-flower-red":
      return { hero: <FloralArchHero content={content} frame="/chungdoi/images/themes/_decor/brocade-flower-red/main-pattern.webp" color="#8d2e24" font={serifFont} />, palette: palette("#8d2e24", "#a43a2f", "#fff6e7", "rgba(255,250,240,0.92)", serifFont) };
    case "crystal-floral-blue":
      return { hero: <FloralArchHero content={content} frame="/chungdoi/images/themes/_decor/crystal-floral-blue/flower-frame.webp" color="#2a4a7f" font={serifFont} />, palette: palette("#2a4a7f", "#416da8", "#ffffff", "rgba(255,255,255,0.94)", serifFont) };
    case "baroque-gold":
      return { hero: <FloralArchHero content={content} frame="/chungdoi/images/themes/_decor/baroque-gold/khung.webp" color="#8a6a2b" font={serifFont} nameClassName="text-[38px] md:text-[54px]" />, palette: palette("#8a6a2b", "#b99349", "#fffaf0", "rgba(255,252,246,0.94)", serifFont) };
    case "glass-garden-green":
      return { hero: <GlassGardenHero content={content} />, palette: palette("#55704d", "#6f8b65", "#edf4e9", "rgba(255,255,255,0.62)", scriptFont) };
    case "chibi-red":
      return { hero: <ChibiHero content={content} />, palette: palette("#7c2d25", "#d63b2e", "#fff1df", "rgba(255,255,255,0.84)", serifFont) };
    case "cherry-blossom-pink":
      return { hero: <CherryHero content={content} />, palette: palette("#d94866", "#df6b83", "#fffdf9", "rgba(255,255,255,0.9)", scriptFont) };
    default:
      return { hero: null, palette: palette("#5f4b3e", "#8a6b55", "#fffaf6") };
  }
}

export function SourceMatchedInvitation({ content }: { content: ChungDoiDemoContent }) {
  const template = buildTemplate(content);
  return <FloralInvitation content={content} palette={template.palette} hero={template.hero} albumFirst={template.albumFirst} />;
}

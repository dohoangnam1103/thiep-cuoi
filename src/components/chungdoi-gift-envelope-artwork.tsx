"use client";

import type {
  GiftBoxVisual,
  LayeredImageGiftVisual,
} from "@/data/chungdoi-gift-visuals";
import { cn } from "@/lib/utils";

const GIFTBOX_DECOR_CLASSES = [
  "igb-decor-1 -left-5 top-2.5 z-[1] w-[34px] -rotate-[22deg]",
  "igb-decor-2 left-[168px] top-0.5 z-[1] w-[38px] rotate-[20deg]",
  "igb-decor-3 -left-4 top-[120px] z-[1] w-[26px] -rotate-[18deg]",
  "igb-decor-4 left-[182px] top-[114px] z-[1] w-6 rotate-[14deg]",
  "igb-decor-5 -left-2 top-[172px] z-[3] w-11 rotate-[8deg]",
  "igb-decor-6 left-[26px] top-[182px] z-[3] w-[26px] -rotate-[10deg]",
  "igb-decor-7 left-[118px] top-44 z-[3] w-10 -rotate-[14deg]",
] as const;

function Sparkles() {
  return (
    <>
      <span aria-hidden className="ienv-sparkle absolute left-[12%] top-[6%] z-20 text-[21px] text-amber-400">✦</span>
      <span aria-hidden className="ienv-sparkle-2 absolute right-[8%] top-[14%] z-20 text-[15px] text-amber-400">✦</span>
      <span aria-hidden className="ienv-sparkle-3 absolute left-[3%] top-[34%] z-20 text-[13px] text-amber-400">✦</span>
      <span aria-hidden className="ienv-sparkle-4 absolute right-[3%] top-[24%] z-20 text-[13px] text-amber-400">✦</span>
    </>
  );
}

export function LayeredGiftArtwork({ visual }: { visual: LayeredImageGiftVisual }) {
  return (
    <div
      data-gift-artwork="layered-image"
      className={cn(
        "relative flex h-full w-full items-end justify-center pb-12",
        visual.wrapperClassName,
      )}
    >
      <Sparkles />
      <div className="relative h-[275px] w-[190px]">
        <div className="ienv-shadow pointer-events-none absolute -bottom-1.5 left-1/2 z-0 h-[11px] w-[125px] -translate-x-1/2 rounded-[50%] bg-black/45 blur" />
        {visual.layers.map((layer) => (
          <img
            key={layer.role}
            src={layer.src}
            alt=""
            aria-hidden
            data-gift-layer={layer.role}
            className={cn("pointer-events-none", layer.className)}
            onError={layer.required ? undefined : (event) => {
              event.currentTarget.hidden = true;
            }}
          />
        ))}
      </div>
    </div>
  );
}

export function GiftBoxArtwork({ visual }: { visual: GiftBoxVisual }) {
  return (
    <div data-gift-artwork="giftbox" className="igb-wrapper relative flex h-full w-full items-end justify-center pb-8">
      <div className="igb-bob relative h-[220px] w-[200px]" aria-hidden>
        {visual.decorImages.map((src, index) => (
          <img
            key={src}
            src={src}
            alt=""
            className={cn(
              "igb-decor pointer-events-none absolute [filter:drop-shadow(0_2px_3px_rgba(0,0,0,0.25))]",
              GIFTBOX_DECOR_CLASSES[index],
            )}
            onError={(event) => {
              event.currentTarget.hidden = true;
            }}
          />
        ))}
        <img
          src={visual.boxImage}
          alt=""
          className="igb-box pointer-events-none absolute bottom-0 left-1/2 z-[2] max-h-[220px] w-[170px] -translate-x-1/2 object-contain [filter:drop-shadow(0_10px_18px_rgba(0,0,0,0.25))]"
        />
      </div>
    </div>
  );
}

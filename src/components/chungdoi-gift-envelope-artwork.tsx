import type {
  GiftboxGiftVisual,
  LayeredImageGiftVisual,
} from "@/data/chungdoi-gift-visuals";
import { resolveGiftVisual } from "@/data/chungdoi-gift-visuals";

const GIFTBOX_DECOR_CLASSES = [
  "-left-5 top-2.5 z-[1] w-[34px] -rotate-[22deg]",
  "left-[168px] top-0.5 z-[1] w-[38px] rotate-[20deg]",
  "-left-4 top-[120px] z-[1] w-[26px] -rotate-[18deg]",
  "left-[182px] top-[114px] z-[1] w-6 rotate-[14deg]",
  "-left-2 top-[172px] z-[3] w-11 rotate-[8deg]",
  "left-[26px] top-[182px] z-[3] w-[26px] -rotate-[10deg]",
  "left-[118px] top-44 z-[3] w-10 -rotate-[14deg]",
] as const;

export function LayeredGiftArtwork({
  visual,
}: {
  visual: LayeredImageGiftVisual;
}) {
  return (
    <div
      data-testid="gift-envelope-animation"
      className="igb-wrapper relative flex h-full w-full items-center justify-center"
    >
      <span aria-hidden className="nhat-binh-sparkle absolute left-[14%] top-[10%] z-10 text-base text-white">✦</span>
      <span aria-hidden className="nhat-binh-sparkle nhat-binh-sparkle-2 absolute right-[10%] top-[34%] z-10 text-xs text-white">✦</span>
      <span aria-hidden className="nhat-binh-sparkle nhat-binh-sparkle-3 absolute bottom-[18%] left-[18%] z-10 text-[10px] text-white">✦</span>
      <div className="igb-bob relative flex h-full w-full items-center justify-center" aria-hidden>
        <div className="relative z-[2] -mr-[13%] w-[46%] max-w-[132px] origin-bottom -rotate-[8deg]">
          <img
            data-gift-image="front"
            src={visual.asset}
            alt=""
            className="igb-box h-auto w-full origin-bottom object-contain drop-shadow-[0_8px_16px_rgba(0,0,0,0.18)]"
          />
        </div>
        <div className="relative z-[1] w-[46%] max-w-[132px] origin-bottom scale-x-[-1] -rotate-[8deg]">
          <img
            data-gift-image="back"
            src={visual.asset}
            alt=""
            className="igb-box h-auto w-full origin-bottom object-contain drop-shadow-[0_8px_16px_rgba(0,0,0,0.18)]"
          />
        </div>
      </div>
    </div>
  );
}

export function GiftboxArtwork({ visual }: { visual: GiftboxGiftVisual }) {
  return (
    <div
      data-testid="gift-envelope-animation"
      className="igb-wrapper relative flex h-full w-full items-end justify-center pb-8"
    >
      <div className="igb-bob relative h-[220px] w-[200px]" aria-hidden>
        {visual.decorImages.slice(0, GIFTBOX_DECOR_CLASSES.length).map((src, index) => (
          <img
            key={src}
            src={src}
            alt=""
            className={`igb-decor igb-decor-${index + 1} pointer-events-none absolute drop-shadow-[0_2px_3px_rgba(0,0,0,0.25)] ${GIFTBOX_DECOR_CLASSES[index]}`}
          />
        ))}
        <img
          data-gift-image="box"
          src={visual.boxImage}
          alt=""
          className="igb-box pointer-events-none absolute bottom-0 left-1/2 z-[2] max-h-[220px] w-[170px] -translate-x-1/2 object-contain drop-shadow-[0_10px_18px_rgba(0,0,0,0.25)]"
        />
      </div>
    </div>
  );
}

export function TemplateGiftArtwork({ templateSlug }: { templateSlug: string }) {
  const visual = resolveGiftVisual(templateSlug);
  if (visual.kind === "layered-image") return <LayeredGiftArtwork visual={visual} />;
  if (visual.kind === "giftbox") return <GiftboxArtwork visual={visual} />;
  return null;
}

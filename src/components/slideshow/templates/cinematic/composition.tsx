import { SlideshowMedia } from "../../core/media";
import type { SlideshowCompositionProps } from "../../core/types";

export function CinematicComposition({ activeIndex, format, scenes }: SlideshowCompositionProps) {
  const scene = scenes[activeIndex];

  return (
    <div className="absolute inset-0 overflow-hidden bg-[#11110f]">
      <SlideshowMedia
        key={`${scene.id}-${format}-${scene.image}`}
        src={scene.image}
        kind={scene.imageKind}
        alt={scene.imageAlt}
        priority
        sizes={format === "tv" ? "(min-width: 1024px) 70vw, 100vw" : "380px"}
        className={`slideshow-moving-image object-cover ${format === "phone" ? "object-[62%_center]" : "object-center"}`}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-[#080907]/85 via-transparent to-[#080907]/20" />
      <div className="absolute inset-x-4 top-4 flex gap-1.5">
        {scenes.map((item, index) => (
          <span key={item.id} className={`h-0.5 flex-1 rounded-full ${index <= activeIndex ? "bg-[#d8ff3e]" : "bg-white/25"}`} />
        ))}
      </div>
      <div className={`absolute inset-x-0 bottom-0 ${format === "tv" ? "p-[6%]" : "p-7 pb-12"}`}>
        <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.28em] text-[#d8ff3e] sm:text-xs">
          {scene.eyebrow}
        </p>
        <h1 className={`max-w-[18ch] font-semibold leading-[0.96] tracking-[-0.045em] text-[#f8f8f5] ${
          format === "tv" ? "text-[clamp(2rem,5vw,5.5rem)]" : "text-4xl"
        }`}>
          {scene.title}
        </h1>
        <p className={`mt-4 max-w-[38ch] leading-relaxed text-white/72 ${format === "tv" ? "text-sm sm:text-base" : "text-sm"}`}>
          {scene.caption}
        </p>
      </div>
    </div>
  );
}

import { SlideshowMedia } from "../../core/media";
import type { SlideshowCompositionProps } from "../../core/types";

export function EditorialComposition({ activeIndex, format, scenes }: SlideshowCompositionProps) {
  const scene = scenes[activeIndex];
  const fallback = scenes[(activeIndex + 1) % scenes.length];
  const companionImage = scene.secondaryImage ?? fallback.image;
  const companionKind = scene.secondaryImageKind ?? fallback.imageKind;
  const companionAlt = scene.secondaryImageAlt ?? fallback.imageAlt;

  if (format === "phone") {
    return (
      <div className="absolute inset-0 overflow-hidden bg-[#e9edf2] text-[#162135]">
        <EditorialProgress activeIndex={activeIndex} scenes={scenes} />
        <div className="absolute left-5 right-16 top-5 h-[44%] overflow-hidden rounded-sm">
          <SlideshowMedia
            key={`${scene.id}-editorial-phone-${scene.image}`}
            src={scene.image}
            kind={scene.imageKind}
            alt={scene.imageAlt}
            priority
            sizes="380px"
            className="slideshow-editorial-image object-cover object-[62%_center]"
          />
        </div>
        <div className="absolute right-5 top-[36%] h-[21%] w-[38%] overflow-hidden rounded-sm border-4 border-[#e9edf2]">
          <SlideshowMedia src={companionImage} kind={companionKind} alt={companionAlt} sizes="150px" className="object-cover" />
        </div>
        <div className="absolute inset-x-5 bottom-8">
          <p className="mb-4 max-w-[18ch] text-[10px] font-bold uppercase tracking-[0.22em] text-[#375ce7]">{scene.eyebrow}</p>
          <h1 className="max-w-[9ch] text-[2.7rem] font-black leading-[0.88] tracking-[-0.065em]">{scene.title}</h1>
          <div className="mt-5 grid grid-cols-[24px_1fr] gap-3">
            <span className="h-px bg-[#375ce7]" />
            <p className="max-w-[26ch] text-xs font-medium leading-relaxed text-[#344155]">{scene.caption}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="absolute inset-0 overflow-hidden bg-[#e9edf2] text-[#162135]">
      <EditorialProgress activeIndex={activeIndex} scenes={scenes} />
      <div className="absolute inset-y-[7%] left-[5%] w-[47%] overflow-hidden rounded-sm">
        <SlideshowMedia
          key={`${scene.id}-editorial-tv-${scene.image}`}
          src={scene.image}
          kind={scene.imageKind}
          alt={scene.imageAlt}
          priority
          sizes="40vw"
          className="slideshow-editorial-image object-cover object-[58%_center]"
        />
      </div>
      <div className="absolute bottom-[7%] left-[44%] h-[30%] w-[20%] overflow-hidden rounded-sm border-[6px] border-[#e9edf2]">
        <SlideshowMedia src={companionImage} kind={companionKind} alt={companionAlt} sizes="18vw" className="object-cover" />
      </div>
      <div className="absolute bottom-[11%] right-[5%] top-[12%] flex w-[33%] flex-col justify-between">
        <p className="max-w-[18ch] text-[clamp(0.55rem,0.9vw,0.8rem)] font-bold uppercase tracking-[0.22em] text-[#375ce7]">{scene.eyebrow}</p>
        <div>
          <h1 className="max-w-[9ch] text-[clamp(2.1rem,4.5vw,5rem)] font-black leading-[0.86] tracking-[-0.07em]">{scene.title}</h1>
          <p className="mt-6 max-w-[28ch] border-l-2 border-[#375ce7] pl-4 text-[clamp(0.65rem,1vw,0.95rem)] font-medium leading-relaxed text-[#344155]">{scene.caption}</p>
        </div>
      </div>
    </div>
  );
}

function EditorialProgress({ activeIndex, scenes }: Pick<SlideshowCompositionProps, "activeIndex" | "scenes">) {
  return (
    <div className="absolute left-[2%] top-[4%] flex w-[24%] gap-1">
      {scenes.map((scene, index) => (
        <span key={scene.id} className={`h-1 flex-1 ${index === activeIndex ? "bg-[#375ce7]" : "bg-[#162135]/15"}`} />
      ))}
    </div>
  );
}

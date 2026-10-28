import { cn } from "@/lib/utils";
import type { AlbumLayout } from "@/lib/album-layout";

/**
 * Schematic thumbnails for the album layout picker.
 *
 * Summarizes the shared `AlbumGallery` layouts (chungdoi-tpl-shared.tsx):
 *   grid      → 4 photos, two columns of 3:4 tiles
 *   mosaic    → 6 photos, three columns with the first tile spanning 2×2
 *   coverflow → a centred slide with its neighbours pushed back
 *
 * Empty tiles inherit the option's text colour. Optional gallery photos make
 * the same diagrams into photo thumbnails. Purely decorative: the option label
 * carries the accessible name. Compact is unchanged for the original editor.
 */

const tile = "relative overflow-hidden rounded-[2px] bg-current";
type DiagramProps = { photos?: readonly string[]; large: boolean };

export function AlbumLayoutPreview({ layout, className, photos, size = "compact" }: {
  layout: AlbumLayout; className?: string; photos?: readonly string[]; size?: "compact" | "large";
}) {
  const props = { photos, large: size === "large" };
  return (
    <span
      aria-hidden="true"
      className={cn("flex items-center justify-center", props.large ? "h-24" : "h-12", className)}
    >
      {layout === "grid" ? <GridDiagram {...props} /> : null}
      {layout === "mosaic" ? <MosaicDiagram {...props} /> : null}
      {layout === "coverflow" ? <CoverflowDiagram {...props} /> : null}
    </span>
  );
}

function PreviewTile({ photos, index, className, emptyClassName }: {
  photos?: readonly string[]; index: number; className: string; emptyClassName: string;
}) {
  const photo = photos?.length ? photos[index % photos.length] : undefined;
  return <span className={cn(tile, className, !photo && emptyClassName)}>
    {/* eslint-disable-next-line @next/next/no-img-element */}
    {photo && <img src={photo} alt="" loading="lazy" decoding="async" className="absolute inset-0 h-full w-full object-cover" />}
  </span>;
}

function GridDiagram({ photos, large }: DiagramProps) {
  return (
    <span className={cn("grid grid-cols-2 gap-[3px]", large ? "w-full max-w-16" : "w-9")}>
      {Array.from({ length: 4 }, (_, index) => (
        <PreviewTile key={index} photos={photos} index={index} className="aspect-[3/4]" emptyClassName="opacity-30" />
      ))}
    </span>
  );
}

function MosaicDiagram({ photos, large }: DiagramProps) {
  return (
    <span className={cn("grid grid-cols-3 gap-[3px] [grid-auto-rows:1fr]", large ? "w-full max-w-20" : "w-12")}>
      {Array.from({ length: 6 }, (_, index) => (
        <PreviewTile
          key={index}
          photos={photos}
          index={index}
          className={cn(
            "aspect-square",
            index === 0 && "col-span-2 row-span-2",
          )}
          emptyClassName={index === 0 ? "opacity-45" : "opacity-30"}
        />
      ))}
    </span>
  );
}

function CoverflowDiagram({ photos, large }: DiagramProps) {
  return (
    <span className={cn("flex items-center justify-center gap-[3px]", large ? "w-full max-w-24" : "w-14")}>
      <PreviewTile photos={photos} index={0} className={cn("-rotate-6", large ? "aspect-[3/4] w-1/4" : "h-7 w-4")} emptyClassName="opacity-20" />
      <PreviewTile photos={photos} index={1} className={large ? "aspect-[3/4] w-1/2" : "h-10 w-7"} emptyClassName="opacity-45" />
      <PreviewTile photos={photos} index={2} className={cn("rotate-6", large ? "aspect-[3/4] w-1/4" : "h-7 w-4")} emptyClassName="opacity-20" />
    </span>
  );
}

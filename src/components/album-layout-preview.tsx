import { cn } from "@/lib/utils";
import type { AlbumLayout } from "@/lib/album-layout";

/**
 * Schematic thumbnails for the album layout picker.
 *
 * Drawn with the same grid classes `AlbumGallery` (chungdoi-tpl-shared.tsx)
 * uses, so the diagram cannot drift from what the invitation actually renders:
 *   grid      → 4 photos, two columns of 3:4 tiles
 *   mosaic    → 6 photos, three columns with the first tile spanning 2×2
 *   coverflow → a centred slide with its neighbours pushed back
 *
 * Tiles paint with `bg-current`, so they inherit the button's text colour and
 * dim automatically when the option is not selected. Purely decorative: the
 * option label carries the accessible name.
 */

const tile = "rounded-[2px] bg-current";

export function AlbumLayoutPreview({ layout, className }: { layout: AlbumLayout; className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn("flex h-12 items-center justify-center", className)}
    >
      {layout === "grid" ? <GridDiagram /> : null}
      {layout === "mosaic" ? <MosaicDiagram /> : null}
      {layout === "coverflow" ? <CoverflowDiagram /> : null}
    </span>
  );
}

function GridDiagram() {
  return (
    <span className="grid w-9 grid-cols-2 gap-[3px]">
      {Array.from({ length: 4 }, (_, index) => (
        <span key={index} className={cn(tile, "aspect-[3/4] opacity-30")} />
      ))}
    </span>
  );
}

function MosaicDiagram() {
  return (
    <span className="grid w-12 grid-cols-3 gap-[3px] [grid-auto-rows:1fr]">
      {Array.from({ length: 6 }, (_, index) => (
        <span
          key={index}
          className={cn(
            tile,
            "aspect-square",
            index === 0 ? "col-span-2 row-span-2 opacity-45" : "opacity-30",
          )}
        />
      ))}
    </span>
  );
}

function CoverflowDiagram() {
  return (
    <span className="flex w-14 items-center justify-center gap-[3px]">
      <span className={cn(tile, "h-7 w-4 -rotate-6 opacity-20")} />
      <span className={cn(tile, "h-10 w-7 opacity-45")} />
      <span className={cn(tile, "h-7 w-4 rotate-6 opacity-20")} />
    </span>
  );
}

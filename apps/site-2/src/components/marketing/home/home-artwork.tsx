import type { Site2ListingItem } from "../../../lib/catalog";
import { templatePreviewOptimizedUrl } from "../../../lib/template-preview";
import artwork from "./home-artwork.json";

export function HomeArtwork({ item, small = false, priority = false }: {
  item: Site2ListingItem;
  small?: boolean;
  priority?: boolean;
}) {
  const prepared = (artwork as Record<string, { small: string; large: string; height: number }>)[item.listing];
  return (
    // These checked-in WebP crops are already resized. A native img avoids
    // a second optimization pass and lets the exhibition reuse cached art.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={prepared ? (small ? prepared.small : prepared.large) : templatePreviewOptimizedUrl(item.listing, small ? 320 : 640)}
      alt={item.name}
      width={small ? 320 : 640}
      height={prepared ? prepared.height / (small ? 2 : 1) : 960}
      loading={priority ? "eager" : "lazy"}
      fetchPriority={priority ? "high" : undefined}
      draggable={false}
    />
  );
}

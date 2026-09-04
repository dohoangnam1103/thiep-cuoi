import Image from "next/image";

import type { SlideshowMediaKind } from "./types";

type SlideshowMediaProps = {
  alt?: string;
  className: string;
  kind?: SlideshowMediaKind;
  priority?: boolean;
  sizes: string;
  src: string;
};

/**
 * Primitive dùng chung để template có thể đặt ảnh hoặc video vào artwork riêng.
 * Video luôn muted/playsInline và tự trim bằng cách loop trong slot cố định.
 */
export function SlideshowMedia({
  alt = "",
  className,
  kind = "image",
  priority = false,
  sizes,
  src,
}: SlideshowMediaProps) {
  if (kind === "video") {
    return (
      <video
        key={src}
        src={src}
        aria-label={alt || undefined}
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
        className={`absolute inset-0 size-full ${className}`}
      />
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      fill
      priority={priority}
      unoptimized={src.startsWith("/api/slideshows/media/")}
      sizes={sizes}
      className={className}
    />
  );
}

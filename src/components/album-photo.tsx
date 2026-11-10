"use client";

import type { ComponentProps } from "react";
import { albumPhotoProps } from "@/lib/album-photo-source";

export function AlbumPhoto({ src, sizes = "(min-width: 768px) 280px, 50vw", maxWidth = 1920, onError, ...props }: Omit<ComponentProps<"img">, "src" | "srcSet"> & { src: string; maxWidth?: number }) {
  const fallback = (image: HTMLImageElement) => {
    if (!image.getAttribute("srcset")) return;
    image.removeAttribute("srcset");
    image.removeAttribute("sizes");
    image.src = src;
  };
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      {...props}
      {...albumPhotoProps(src, sizes, maxWidth)}
      alt={props.alt ?? ""}
      decoding="async"
      data-album-source={src}
      onError={event => { fallback(event.currentTarget); onError?.(event); }}
    />
  );
}

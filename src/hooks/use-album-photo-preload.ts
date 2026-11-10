"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AlbumPhotoCache, lightboxPhotoWidth } from "@/lib/album-photo-cache";
import { albumPhotoSource } from "@/lib/album-photo-source";

/** Share decoded display photos between the visible album and its lightbox. */
export function useAlbumPhotoPreload(photos: string[]) {
  const albumRef = useRef<HTMLDivElement>(null);
  const [preparedPhotos] = useState(() => new AlbumPhotoCache());
  const prepareAt = useCallback((index: number) => {
    if (!photos.length) return;
    const width = lightboxPhotoWidth();
    const nearby = [...new Set([0, 1, -1, 2, -2].map(offset => (index + offset + photos.length) % photos.length))];
    const retained = new Set(nearby.map(i => albumPhotoSource(photos[i], width)));
    preparedPhotos.retain(retained);
    nearby.forEach(i => preparedPhotos.prepare(photos[i], width));
  }, [photos, preparedPhotos]);

  useEffect(() => {
    const root = albumRef.current;
    if (!root) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      prepareAt(0);
      observer.disconnect();
    }, { rootMargin: "600px 0px" });
    observer.observe(root);
    return () => observer.disconnect();
  }, [prepareAt]);

  return { albumRef, preparedPhotos, prepareAt };
}

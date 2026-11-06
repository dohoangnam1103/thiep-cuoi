"use client";

import { memo, useEffect, useLayoutEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { getImageProps } from "next/image";

export const LightboxThumbnails = memo(function LightboxThumbnails({
  gallery, index, accent, onSelect,
}: {
  gallery: string[];
  index: number;
  accent: string;
  onSelect: (index: number) => void;
}) {
  const t = useTranslations("invitationTemplate");
  const strip = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState<Set<number>>(() => new Set());

  useEffect(() => {
    const root = strip.current;
    if (!root) return;
    // Native lazy-loading can fetch the entire short horizontal strip. Observe
    // its own viewport instead, and release image nodes as thumbnails leave it.
    const observer = new IntersectionObserver(entries => {
      setVisible(previous => {
        const next = new Set(previous);
        for (const entry of entries) {
          const photoIndex = Number((entry.target as HTMLElement).dataset.lightboxThumbIndex);
          if (entry.isIntersecting) next.add(photoIndex);
          else next.delete(photoIndex);
        }
        return next.size === previous.size && [...next].every(i => previous.has(i)) ? previous : next;
      });
    }, { root, rootMargin: "0px 32px" });
    root.querySelectorAll("button").forEach(button => observer.observe(button));
    return () => observer.disconnect();
  }, [gallery]);

  useLayoutEffect(() => {
    strip.current?.querySelector(`[data-lightbox-thumb-index="${index}"]`)
      ?.scrollIntoView({ block: "nearest", inline: "nearest", behavior: "instant" });
  }, [gallery, index]);

  return (
    <div
      ref={strip}
      data-testid="wedding-lightbox-thumbnails"
      data-lenis-prevent
      className="absolute bottom-4 z-10 flex max-w-[min(92vw,448px)] gap-2 overflow-x-auto px-2"
      onClick={event => event.stopPropagation()}
    >
      {gallery.map((src, i) => (
        <button
          key={`${i}-${src}`}
          type="button"
          data-lightbox-thumb-index={i}
          aria-label={t("lightboxThumbnailAlt", { index: i + 1 })}
          aria-current={i === index ? "true" : undefined}
          onClick={() => onSelect(i)}
          className="h-14 w-14 shrink-0 overflow-hidden rounded-md border-2 transition-opacity"
          style={{ borderColor: i === index ? accent : "transparent", opacity: i === index ? 1 : 0.6 }}
        >
          {visible.has(i) ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              {...getImageProps({
                src,
                alt: t("lightboxThumbnailAlt", { index: i + 1 }),
                width: 56,
                height: 56,
                sizes: "56px",
                quality: 75,
                // Keep external/versioned URLs on the existing direct path;
                // only same-origin unversioned files match the optimizer policy.
                unoptimized: !src.startsWith("/") || src.startsWith("//") || src.includes("?"),
              }).props}
              loading="eager"
              alt={t("lightboxThumbnailAlt", { index: i + 1 })}
              decoding="async"
              draggable={false}
              className="h-full w-full object-cover"
            />
          ) : null}
        </button>
      ))}
    </div>
  );
});

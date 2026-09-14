"use client";

import Image, { getImageProps } from "next/image";
import { useState } from "react";

import thumbnails from "../data/listing-thumbnails.json";
import { listingImageHeight, templatePreviewUrl } from "../lib/template-preview";

const sizes =
  "(min-width: 1280px) calc((100vw - 118px) / 5), (min-width: 1024px) calc((100vw - 118px) / 4), (min-width: 768px) calc((100vw - 76px) / 3), (min-width: 640px) calc((100vw - 76px) / 2), calc((100vw - 34px) / 2)";

type Thumbnail = {
  width: number;
  height: number;
  cropHeight: number;
  variants: { width: number; src: string }[];
};

/**
 * Listing thumbnail with the master hover behavior: on mouse hover the full
 * tall preview loads and slowly scrolls inside the fixed frame (10s
 * alternate). Touch devices and reduced-motion users get the static image.
 */
export function TemplateCardImage({
  source,
  portrait,
  alt,
  slug,
  href,
  eager = false,
}: {
  source: string;
  portrait: string;
  alt: string;
  slug: string;
  href: string;
  eager?: boolean;
}) {
  const [requested, setRequested] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [active, setActive] = useState(false);
  const [thumbnailFailed, setThumbnailFailed] = useState(false);
  const thumbnail = (thumbnails as Record<string, Thumbnail>)[source];
  const useCrop = Boolean(thumbnail && !thumbnailFailed);
  const fallbackHeight = listingImageHeight(source);
  const fallback = getImageProps({
    src: templatePreviewUrl(source),
    alt,
    width: 768,
    height: fallbackHeight,
    sizes,
  }).props;
  const mobile = getImageProps({
    src: portrait,
    alt,
    width: 768,
    height: 988,
    sizes,
  }).props;
  const src = useCrop ? thumbnail.variants.at(-1)!.src : fallback.src;
  const srcSet = useCrop
    ? thumbnail.variants.map((variant) => `${variant.src} ${variant.width}w`).join(", ")
    : fallback.srcSet;

  function activate() {
    // Touch users go straight to the demo; do not download an invisible image.
    if (!window.matchMedia("(min-width: 640px)").matches) return;
    setRequested(true);
    setActive(true);
  }

  return (
    <>
      {eager ? (
        <link
          rel="preload"
          as="image"
          imageSrcSet={srcSet}
          imageSizes={sizes}
          media="(min-width: 640px)"
        />
      ) : null}
      <a
        href={href}
        className="relative block h-[var(--frame-h)] w-full overflow-hidden bg-[#eee5d5] text-left [--frame-h:280px] sm:[--frame-h:360px]"
        onPointerEnter={(event) => {
          if (event.pointerType === "mouse") activate();
        }}
        onPointerLeave={() => setActive(false)}
        onFocus={activate}
        onBlur={() => setActive(false)}
      >
        <picture>
          <source media="(max-width: 639px)" srcSet={mobile.srcSet} sizes={sizes} />
          <img
            src={src}
            srcSet={srcSet}
            sizes={sizes}
            width={useCrop ? thumbnail.width : 768}
            height={useCrop ? thumbnail.cropHeight : fallbackHeight}
            alt={alt}
            loading={eager ? "eager" : "lazy"}
            fetchPriority={eager ? "high" : "auto"}
            decoding="async"
            onError={() => setThumbnailFailed(true)}
            data-testid={`template-listing-thumbnail-${slug}`}
            className="block h-full w-full max-w-none object-cover object-center sm:h-auto sm:object-top"
          />
        </picture>
        {requested ? (
          <Image
            src={templatePreviewUrl(source)}
            alt=""
            aria-hidden="true"
            width={thumbnail?.width ?? 768}
            height={thumbnail?.height ?? fallbackHeight}
            sizes={sizes}
            loading="eager"
            decoding="async"
            onLoad={() => setLoaded(true)}
            data-testid={`template-listing-full-${slug}`}
            data-active={active && loaded ? "true" : "false"}
            className={`absolute inset-x-0 top-0 hidden h-auto w-full max-w-none transition-transform duration-[10000ms] ease-in-out data-[active=true]:translate-y-[min(0px,calc(var(--frame-h)-100%))] motion-reduce:transition-none sm:block ${loaded ? "visible" : "invisible"}`}
          />
        ) : null}
      </a>
    </>
  );
}

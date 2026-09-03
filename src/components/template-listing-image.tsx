"use client";

import Image, { getImageProps } from "next/image";
import { useState } from "react";

import thumbnails from "@/data/listing-thumbnails.json";
import mobileThumbnails from "@/data/listing-mobile-thumbnails.json";
import { templatePreviewUrl } from "@/lib/template-preview-url";

const sizes = "(min-width: 1280px) 284px, (min-width: 1024px) calc((100vw - 118px) / 3), (min-width: 640px) calc((100vw - 76px) / 2), calc(100vw - 34px)";

type Thumbnail = {
  width: number;
  height: number;
  cropHeight: number;
  variants: { width: number; src: string }[];
};

export function TemplateListingImage({
  source,
  fallbackHeight,
  alt,
  slug,
  mobileThumbnailUrl,
  eager = false,
  highPriority = false,
  onSelect,
}: {
  source: string;
  fallbackHeight: number;
  alt: string;
  slug: string;
  mobileThumbnailUrl?: string;
  eager?: boolean;
  highPriority?: boolean;
  onSelect: () => void;
}) {
  const [requested, setRequested] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [active, setActive] = useState(false);
  const [thumbnailFailed, setThumbnailFailed] = useState(false);
  const thumbnail = (thumbnails as Record<string, Thumbnail>)[source];
  const useCrop = Boolean(thumbnail && !thumbnailFailed);
  const fallback = getImageProps({
    src: templatePreviewUrl(source), alt, width: 768, height: fallbackHeight, sizes,
  }).props;
  const preparedMobile = mobileThumbnailUrl
    ? (mobileThumbnails as Record<string, Omit<Thumbnail, "cropHeight">>)[mobileThumbnailUrl]
    : undefined;
  const mobile = preparedMobile && !thumbnailFailed
    ? { srcSet: preparedMobile.variants.map(variant => `${variant.src} ${variant.width}w`).join(", ") }
    : mobileThumbnailUrl ? getImageProps({
      src: mobileThumbnailUrl, alt, width: 768, height: 988, sizes,
    }).props : undefined;
  const src = useCrop ? thumbnail.variants.at(-1)!.src : fallback.src;
  const srcSet = useCrop ? thumbnail.variants.map(variant => `${variant.src} ${variant.width}w`).join(", ") : fallback.srcSet;

  function activate() {
    // Touch users open the existing modal; do not download an invisible desktop image.
    if (!window.matchMedia("(min-width: 640px)").matches) return;
    setRequested(true);
    setActive(true);
  }

  return (
    <>
    {eager && !highPriority ? (
      <link rel="preload" as="image" imageSrcSet={srcSet} imageSizes={sizes} media="(min-width: 640px)" />
    ) : null}
    <button
      type="button"
      onClick={onSelect}
      data-ga-event="preview_template"
      data-ga-param-template-id={slug}
      data-ga-param-source="listing_card"
      className="relative block h-[460px] w-full overflow-hidden rounded-2xl bg-muted text-left"
      onPointerEnter={(event) => { if (event.pointerType === "mouse") activate(); }}
      onPointerLeave={() => setActive(false)}
      onFocus={activate}
      onBlur={() => setActive(false)}
    >
      <picture>
        {mobile ? <source media="(max-width: 639px)" srcSet={mobile.srcSet} sizes={sizes} /> : null}
        {/* Prebuilt responsive WebP variants intentionally bypass runtime optimization. */}
        <img
          src={src}
          srcSet={srcSet}
          sizes={sizes}
          width={useCrop ? thumbnail.width : 768}
          height={useCrop ? thumbnail.cropHeight : fallbackHeight}
          alt={alt}
          loading={highPriority ? "eager" : "lazy"}
          fetchPriority={highPriority ? "high" : "auto"}
          decoding="async"
          onError={() => setThumbnailFailed(true)}
          data-testid={`template-listing-thumbnail-${slug}`}
          className={mobile
            ? "block h-full w-full max-w-none object-cover object-center sm:h-auto sm:object-top"
            : "block h-auto w-full max-w-none"}
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
          className={`absolute inset-x-0 top-0 hidden h-auto w-full max-w-none transition-transform duration-[10000ms] ease-in-out data-[active=true]:translate-y-[min(0px,calc(460px_-_100%))] motion-reduce:transition-none sm:block ${loaded ? "visible" : "invisible"}`}
        />
      ) : null}
    </button>
    </>
  );
}

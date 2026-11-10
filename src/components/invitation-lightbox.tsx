"use client";

import { type Dispatch, type SetStateAction, useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useTranslations } from "next-intl";
import { LightboxThumbnails } from "@/components/lightbox-thumbnails";
import { LightboxZoomControls, useLightboxZoom, VI_LIGHTBOX_ZOOM_LABELS } from "@/components/lightbox-zoom";
import { INVITATION_LIGHTBOX_OPEN_EVENT } from "@/lib/invitation-lightbox-events";
import { albumPhotoSource } from "@/lib/album-photo-source";
import { AlbumPhotoCache, lightboxPhotoWidth } from "@/lib/album-photo-cache";

export function Lightbox({
  gallery,
  index,
  setIndex,
  accent = "#ffffff",
  modal = false,
  preparedPhotos,
}: {
  gallery: string[];
  index: number | null;
  setIndex: Dispatch<SetStateAction<number | null>>;
  accent?: string;
  modal?: boolean;
  preparedPhotos?: AlbumPhotoCache;
}) {
  const count = gallery.length;
  const t = useTranslations("invitationTemplate");
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const open = index !== null;
  const [instantNavigation, setInstantNavigation] = useState(false);
  const [loadingPhoto, setLoadingPhoto] = useState(false);
  const loadingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [originalPhoto, setOriginalPhoto] = useState<string | null>(null);
  const navigationVersion = useRef(0);
  const pendingIndex = useRef<number | null>(null);
  const [localPhotos] = useState(() => new AlbumPhotoCache());
  const photoCache = preparedPhotos ?? localPhotos;
  const displayWidth = lightboxPhotoWidth();
  const preparePhoto = useCallback((position: number) => {
    return photoCache.prepare(gallery[position], displayWidth);
  }, [photoCache, displayWidth, gallery]);
  const clearLoading = useCallback(() => {
    if (loadingTimer.current !== null) clearTimeout(loadingTimer.current);
    loadingTimer.current = null;
    setLoadingPhoto(false);
  }, []);
  const requestPhoto = useCallback((next: number) => {
    const version = ++navigationVersion.current;
    pendingIndex.current = next;
    setInstantNavigation(index !== null && Math.abs(next - index) > 1);
    clearLoading();
    const photo = preparePhoto(next);
    // A decoded neighbor commits in the pointer-up event: no snap back and
    // second animation while an already-loaded image is decoded again.
    if (photo.ready) {
      setIndex(next);
      return;
    }
    loadingTimer.current = setTimeout(() => setLoadingPhoto(true), 180);
    void photo.promise.then(() => {
      if (version !== navigationVersion.current) return;
      clearLoading();
      setIndex(next);
    });
  }, [clearLoading, index, preparePhoto, setIndex]);
  const step = useCallback((dir: number) => {
    if (index === null) return;
    requestPhoto(((pendingIndex.current ?? index) + dir + count) % count);
  }, [count, index, requestPhoto]);
  const zoom = useLightboxZoom({
    enabled: index !== null,
    onSwipe: step,
    swipeThreshold: typeof window !== "undefined" ? Math.min(80, window.innerWidth * 0.2) : 60,
  });
  const resetZoom = zoom.resetZoom;

  const navigate = useCallback((direction: number) => {
    resetZoom(false);
    step(direction);
  }, [resetZoom, step]);

  const select = useCallback((next: number) => {
    resetZoom(false);
    requestPhoto(next);
  }, [requestPhoto, resetZoom]);
  const close = useCallback(() => {
    navigationVersion.current++;
    pendingIndex.current = null;
    clearLoading();
    resetZoom(false);
    setIndex(null);
  }, [clearLoading, resetZoom, setIndex]);

  useEffect(() => {
    if (index === null || count === 0) {
      navigationVersion.current++;
      pendingIndex.current = null;
      if (!preparedPhotos) photoCache.clear();
      return;
    }
    const nearby = new Set([0, 1, -1, 2, -2].map(offset => (index + offset + count) % count));
    const retained = new Set([...nearby].map(i => albumPhotoSource(gallery[i], displayWidth)));
    photoCache.retain(retained);
    for (const position of nearby) preparePhoto(position);
  }, [count, photoCache, displayWidth, gallery, index, preparePhoto, preparedPhotos]);

  const activeSource = index === null ? null : gallery[index];
  const zoomed = zoom.scale > 1;
  useEffect(() => {
    if (!activeSource || !zoomed || albumPhotoSource(activeSource, displayWidth) === activeSource) return;
    let cancelled = false;
    const image = new Image();
    image.decoding = "async";
    image.src = activeSource;
    // Only the selected, zoomed photo uses camera resolution. Keep its display
    // derivative visible while loading; zoom and pan never wait on the network.
    void image.decode().then(() => {
      if (!cancelled) setOriginalPhoto(activeSource);
    }).catch(() => {});
    return () => { cancelled = true; };
  }, [activeSource, displayWidth, zoomed]);

  useEffect(() => {
    const cache = photoCache;
    const version = navigationVersion;
    return () => {
      version.current++;
      cache.clear();
      if (loadingTimer.current !== null) clearTimeout(loadingTimer.current);
    };
  }, [photoCache]);

  useEffect(() => {
    if (!open) return;
    const previousFocus = document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null;
    const originalOverflow = document.body.style.overflow;
    const originalRootOverflow = document.documentElement.style.overflow;
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";
    window.dispatchEvent(new Event(INVITATION_LIGHTBOX_OPEN_EVENT));
    const focusFrame = modal ? window.requestAnimationFrame(() => closeButtonRef.current?.focus()) : null;

    return () => {
      if (focusFrame !== null) window.cancelAnimationFrame(focusFrame);
      document.body.style.overflow = originalOverflow;
      document.documentElement.style.overflow = originalRootOverflow;
      if (modal) previousFocus?.focus();
    };
  }, [modal, open]);

  useEffect(() => {
    if (index === null) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        close();
        return;
      }
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        navigate(-1);
        return;
      }
      if (event.key === "ArrowRight") {
        event.preventDefault();
        navigate(1);
        return;
      }
      if (!modal || event.key !== "Tab") return;

      const focusable = dialogRef.current?.querySelectorAll<HTMLElement>(
        "button:not([disabled]), a[href], [tabindex]:not([tabindex='-1'])",
      );
      if (!focusable?.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [close, index, modal, navigate]);

  if (index === null) return null;

  return createPortal((
    <div
      ref={dialogRef}
      data-testid="wedding-lightbox"
      data-lenis-prevent
      role={modal ? "dialog" : undefined}
      aria-modal={modal ? "true" : undefined}
      aria-label={modal ? t("lightboxLabel") : undefined}
      tabIndex={modal ? -1 : undefined}
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center overflow-hidden bg-black/90"
      onClick={close}
    >
      <button ref={closeButtonRef} type="button" aria-label={t("lightboxClose")} onClick={(e) => { e.stopPropagation(); close(); }} className="absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center text-2xl text-white/90 transition-opacity hover:opacity-70">✕</button>
      <div className="absolute top-5 z-10 text-sm text-white/80">{index + 1} / {count}</div>
      {loadingPhoto ? <div role="status" className="pointer-events-none absolute top-12 z-10 text-xs text-white/80">{t("lightboxLoading")}</div> : null}
      <button type="button" aria-label={t("lightboxPrevious")} onClick={(e) => { e.stopPropagation(); navigate(-1); }} className="absolute left-3 top-1/2 z-10 flex h-12 w-12 -translate-y-1/2 items-center justify-center text-3xl text-white/90 transition-opacity hover:opacity-70 md:left-8">‹</button>
      <button type="button" aria-label={t("lightboxNext")} onClick={(e) => { e.stopPropagation(); navigate(1); }} className="absolute right-3 top-1/2 z-10 flex h-12 w-12 -translate-y-1/2 items-center justify-center text-3xl text-white/90 transition-opacity hover:opacity-70 md:right-8">›</button>

      <div
        data-testid="wedding-lightbox-track"
        className="flex h-full w-full motion-reduce:transition-none!"
        onClickCapture={zoom.onClickCapture}
        onPointerCancel={zoom.onPointerCancel}
        onPointerDown={zoom.onPointerDown}
        onPointerMove={zoom.onPointerMove}
        onPointerUp={zoom.onPointerUp}
        onWheel={zoom.onWheel}
        style={{
          touchAction: "none",
          transform: `translate3d(calc(${-index * 100}% + var(--lightbox-drag, 0px)), 0, 0)`,
          transition: zoom.trackAnimating && !instantNavigation ? "transform 320ms cubic-bezier(0.22, 1, 0.36, 1)" : "none",
        }}
      >
        {gallery.map((src, i) => (
          <div
            key={`${i}-${src}`}
            ref={i === index ? zoom.viewportRef : undefined}
            className="flex h-full w-full shrink-0 items-center justify-center px-4"
          >
            {Math.min(Math.abs(i - index), count - Math.abs(i - index)) <= 1 ? <img
              ref={i === index ? zoom.imageRef : undefined}
              src={i === index && zoom.scale > 1 && originalPhoto === src ? src : albumPhotoSource(src, displayWidth)}
              data-album-source={src}
              alt={t("lightboxPhotoAlt", { index: i + 1 })}
              data-testid={i === index ? "wedding-lightbox-image" : undefined}
              data-zoom-scale={i === index ? zoom.scale.toFixed(2) : undefined}
              draggable={false}
              decoding="async"
              onError={event => {
                const image = event.currentTarget;
                if (image.getAttribute("src") !== src) image.src = src;
              }}
              onClick={(e) => e.stopPropagation()}
              onDoubleClick={i === index ? zoom.onDoubleClick : undefined}
              style={i === index ? zoom.imageStyle : undefined}
              className="max-h-[78vh] max-w-[92vw] select-none rounded-lg object-contain motion-reduce:transition-none!"
            /> : null}
          </div>
        ))}
      </div>

      <LightboxZoomControls
        className="absolute bottom-20 left-1/2 z-20 -translate-x-1/2"
        labels={VI_LIGHTBOX_ZOOM_LABELS}
        resetZoom={zoom.resetZoom}
        scale={zoom.scale}
        testIdPrefix="wedding-lightbox"
        zoomIn={zoom.zoomIn}
        zoomOut={zoom.zoomOut}
      />

      <LightboxThumbnails gallery={gallery} index={index} accent={accent} onSelect={select} />
    </div>
  ), document.body);
}


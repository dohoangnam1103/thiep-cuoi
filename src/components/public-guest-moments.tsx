"use client";

import { ChevronLeft, ChevronRight, Download, Film, ImagePlus, Play, X } from "lucide-react";
import Image from "next/image";
import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { createPortal } from "react-dom";

import { useLiveForms } from "@/components/chungdoi-live-forms";
import {
  LightboxZoomControls,
  useLightboxZoom,
} from "@/components/lightbox-zoom";
import {
  guestMediaPreview,
  type GuestMediaApiPayload,
  type PublicGuestMedia,
} from "@/lib/public-guest-media";

type GuestMediaGalleryContextValue = {
  enabled: boolean;
  loadError: string;
  loading: boolean;
  media: PublicGuestMedia[];
  prependMedia: (items: PublicGuestMedia[]) => void;
  refresh: () => Promise<void>;
  uploadOpen: boolean;
  setUploadOpen: (open: boolean) => void;
};

const GuestMediaGalleryContext = createContext<GuestMediaGalleryContextValue | null>(null);

export function GuestMediaGalleryProvider({ children }: { children: ReactNode }) {
  const live = useLiveForms();
  const [media, setMedia] = useState<PublicGuestMedia[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [uploadOpen, setUploadOpen] = useState(false);

  const refresh = useCallback(async () => {
    if (!live) {
      setMedia([]);
      setLoadError("");
      setLoading(false);
      return;
    }

    setLoading(true);
    setLoadError("");
    try {
      const response = await fetch(
        `/api/invitations/${encodeURIComponent(live.slug)}/contributions`,
        { cache: "no-store" },
      );
      const payload = await response.json() as GuestMediaApiPayload;
      if (!response.ok || !payload.media) throw new Error(payload.error);
      setMedia(payload.media);
    } catch {
      setLoadError(live.mediaLabels.errorGeneric);
    } finally {
      setLoading(false);
    }
  }, [live]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const prependMedia = useCallback((items: PublicGuestMedia[]) => {
    setMedia((current) => {
      const incomingIds = new Set(items.map((item) => item.id));
      return [...items, ...current.filter((item) => !incomingIds.has(item.id))];
    });
  }, []);

  return (
    <GuestMediaGalleryContext.Provider
      value={{
        enabled: Boolean(live),
        loadError,
        loading,
        media,
        prependMedia,
        refresh,
        uploadOpen,
        setUploadOpen,
      }}
    >
      {children}
    </GuestMediaGalleryContext.Provider>
  );
}

export function useGuestMediaGallery() {
  const value = useContext(GuestMediaGalleryContext);
  if (!value) {
    throw new Error("useGuestMediaGallery must be used inside GuestMediaGalleryProvider");
  }
  return value;
}

type MomentsStyle = {
  bodyClassName: string;
  cardClassName: string;
  gridClassName: string;
  headingClassName: string;
  headingWrapClassName: string;
  mediaClassName: string;
  sectionClassName: string;
};

const SQUARE_GRID = "grid w-full grid-cols-2 gap-3 md:gap-4";
const WIDE_SQUARE_GRID = `mx-auto max-w-[560px] ${SQUARE_GRID}`;
const PORTRAIT_GRID = `mx-auto max-w-[560px] ${SQUARE_GRID}`;
const SQUARE_CARD_SOFT = "group relative aspect-square cursor-pointer overflow-hidden rounded-lg border border-black/5";
const PORTRAIT_CARD = "group relative aspect-[3/4] cursor-pointer overflow-hidden rounded-xl border border-black/10";
const MEDIA = "h-full w-full object-cover transition-transform duration-200 group-hover:scale-[1.03]";
const BAND_HEADING = "text-center text-[20px] font-bold uppercase tracking-wide md:text-[24px]";
const EDITORIAL_HEADING = "text-center text-[22px] font-bold uppercase tracking-wide md:text-[28px]";

const DOUBLE_DRAGON_RED: MomentsStyle = {
  sectionClassName: "w-full bg-[#ECDFD6] text-[#882925]",
  headingWrapClassName: "w-full bg-[#882925] px-4 py-3 md:py-4",
  headingClassName: `${BAND_HEADING} font-serif text-[#ECDFD6]`,
  bodyClassName: "mx-auto w-full max-w-lg px-2 py-4 sm:px-4",
  gridClassName: SQUARE_GRID,
  cardClassName: SQUARE_CARD_SOFT,
  mediaClassName: MEDIA,
};

const DOUBLE_DRAGON_BLUE: MomentsStyle = {
  ...DOUBLE_DRAGON_RED,
  sectionClassName: "w-full bg-[#E8ECD6] text-[#253F78]",
  headingWrapClassName: "w-full bg-[#253F78] px-4 py-3 md:py-4",
  headingClassName: `${BAND_HEADING} font-serif text-[#E8ECD6]`,
};

const SONG_HY_RED: MomentsStyle = {
  ...DOUBLE_DRAGON_RED,
  sectionClassName: "w-full bg-[#FFF7EB] text-[#800000]",
  headingWrapClassName: "w-full bg-[#800000] px-4 py-3 md:py-4",
  headingClassName: `${BAND_HEADING} font-serif text-[#FFEED2]`,
};

const SONG_HY_GREEN: MomentsStyle = {
  ...DOUBLE_DRAGON_RED,
  sectionClassName: "w-full bg-[#FFF7EB] text-[#1F3A25]",
  headingWrapClassName: "w-full bg-[#1F3A25] px-4 py-3 md:py-4",
  headingClassName: `${BAND_HEADING} font-serif text-[#E8F0E4]`,
};

const SONG_LONG_GREEN: MomentsStyle = {
  ...DOUBLE_DRAGON_RED,
  sectionClassName: "w-full bg-[#ECE8D6] text-[#1F3A25]",
  headingWrapClassName: "w-full bg-[#1F3A25] px-4 py-3 md:py-4",
  headingClassName: `${BAND_HEADING} font-serif text-[#ECE8D6]`,
};

const DRAGON_PHOENIX_RED: MomentsStyle = {
  sectionClassName: "w-full bg-[#680e0e] px-4 py-10 text-[#e9ce9e] md:px-10 md:py-14",
  headingWrapClassName: "w-full",
  headingClassName: "text-center font-serif text-[22px] font-semibold md:text-[28px]",
  bodyClassName: "mx-auto mt-6 w-full max-w-[560px]",
  gridClassName: WIDE_SQUARE_GRID,
  cardClassName: "group relative aspect-square cursor-pointer overflow-hidden rounded-xl border border-[#e9ce9e]/30",
  mediaClassName: MEDIA,
};

const DRAGON_PHOENIX_GREEN: MomentsStyle = {
  ...DRAGON_PHOENIX_RED,
  sectionClassName: "w-full bg-[#162614] px-4 py-10 text-[#e9ce9e] md:px-10 md:py-14",
};

const DRAGON_PHOENIX_BLUE: MomentsStyle = {
  ...DRAGON_PHOENIX_RED,
  sectionClassName: "w-full bg-[#0A202F] px-4 py-10 text-[#e9ce9e] md:px-10 md:py-14",
};

const DRAGON_PHOENIX_BLACK: MomentsStyle = {
  ...DRAGON_PHOENIX_RED,
  sectionClassName: "w-full bg-[#0a0a0a] px-4 py-10 text-[#FFC662] md:px-10 md:py-14",
  cardClassName: "group relative aspect-square cursor-pointer overflow-hidden rounded-xl border border-[#FFC662]/30",
};

const ROYAL_RED: MomentsStyle = {
  sectionClassName: "w-full bg-gradient-to-br from-[#3E0001] via-[#7A0003] to-[#3E0001] px-4 py-10 text-[#E1BC7C] md:px-10 md:py-14",
  headingWrapClassName: "w-full",
  headingClassName: "text-center font-serif text-[24px] font-bold uppercase tracking-[0.04em] md:text-[32px]",
  bodyClassName: "mx-auto mt-6 w-full max-w-[560px]",
  gridClassName: WIDE_SQUARE_GRID,
  cardClassName: "group relative aspect-square cursor-pointer overflow-hidden rounded-xl border border-[#E1BC7C]/30",
  mediaClassName: MEDIA,
};

const ROYAL_BLUE: MomentsStyle = {
  ...ROYAL_RED,
  sectionClassName: "w-full bg-gradient-to-br from-[#00112E] via-[#002875] to-[#00112E] px-4 py-10 text-[#E1BC7C] md:px-10 md:py-14",
};

const ROYAL_GREEN: MomentsStyle = {
  ...ROYAL_RED,
  sectionClassName: "w-full bg-gradient-to-br from-[#001A08] via-[#003F1E] to-[#001A08] px-4 py-10 text-[#E1BC7C] md:px-10 md:py-14",
};

const PHOENIX_RED: MomentsStyle = {
  sectionClassName: "relative w-full bg-[#710001] px-6 py-8 text-white md:px-8 md:py-12",
  headingWrapClassName: "w-full",
  headingClassName: BAND_HEADING,
  bodyClassName: "mx-auto mt-6 w-full max-w-[550px]",
  gridClassName: SQUARE_GRID,
  cardClassName: "group relative aspect-square cursor-pointer overflow-hidden rounded-lg border border-white/10 bg-white/50",
  mediaClassName: MEDIA,
};

const PHOENIX_GREEN: MomentsStyle = {
  ...PHOENIX_RED,
  sectionClassName: "relative w-full bg-[#1F3A25] px-6 py-8 text-white md:px-8 md:py-12",
};

const PORTRAIT_GOLD: MomentsStyle = {
  sectionClassName: "w-full bg-[#fbf6ea] px-4 py-10 text-[#8a6a1f] md:px-10 md:py-14",
  headingWrapClassName: "w-full",
  headingClassName: EDITORIAL_HEADING,
  bodyClassName: "mt-6 w-full",
  gridClassName: PORTRAIT_GRID,
  cardClassName: "group relative aspect-[3/4] cursor-pointer overflow-hidden rounded-xl border border-[#b8912f]/40",
  mediaClassName: MEDIA,
};

const PORTRAIT_GREEN: MomentsStyle = {
  ...PORTRAIT_GOLD,
  sectionClassName: "w-full bg-[#fbfaf5] px-4 py-10 text-[#2f4a34] md:px-10 md:py-14",
  cardClassName: "group relative aspect-[3/4] cursor-pointer overflow-hidden rounded-xl border border-[#2f4a34]/30",
};

const PORTRAIT_BROWN: MomentsStyle = {
  ...PORTRAIT_GOLD,
  sectionClassName: "w-full bg-[#fffaf7] px-4 py-10 text-[#6b4a2e] md:px-10 md:py-14",
  cardClassName: "group relative aspect-[3/4] cursor-pointer overflow-hidden rounded-xl border border-[#6b4a2e]/30",
};

const PORTRAIT_PINK: MomentsStyle = {
  ...PORTRAIT_GOLD,
  sectionClassName: "w-full bg-[#fdf3f6] px-4 py-10 text-[#b03a5b] md:px-10 md:py-14",
  cardClassName: "group relative aspect-[3/4] cursor-pointer overflow-hidden rounded-xl border border-[#b03a5b]/30",
};

const PORTRAIT_BLUE: MomentsStyle = {
  ...PORTRAIT_GOLD,
  sectionClassName: "w-full bg-[#f8fbff] px-4 py-10 text-[#2a4a7f] md:px-10 md:py-14",
  cardClassName: "group relative aspect-[3/4] cursor-pointer overflow-hidden rounded-xl border border-[#2a4a7f]/30",
};

const PORTRAIT_RED: MomentsStyle = {
  ...PORTRAIT_GOLD,
  sectionClassName: "w-full bg-[#fff5f5] px-4 py-10 text-[#a83232] md:px-10 md:py-14",
  cardClassName: "group relative aspect-[3/4] cursor-pointer overflow-hidden rounded-xl border border-[#a83232]/30",
};

const MOMENTS_STYLES: Record<string, MomentsStyle> = {
  "song-hy-red": SONG_HY_RED,
  "song-hy-green": SONG_HY_GREEN,
  "double-dragon-red": DOUBLE_DRAGON_RED,
  "double-phoenix-red": PHOENIX_RED,
  "elegant-leaf-green": PORTRAIT_GREEN,
  "dragon-phoenix-red": DRAGON_PHOENIX_RED,
  "dragon-phoenix-v3-red": {
    ...PORTRAIT_RED,
    sectionClassName: "w-full bg-[#710013] px-4 py-10 text-[#ffbe89] md:px-10 md:py-14",
    cardClassName: "group relative aspect-[3/4] cursor-pointer overflow-hidden rounded-xl border border-[#ffbe89]/50",
  },
  "dragon-phoenix-v2-red": {
    ...PORTRAIT_RED,
    sectionClassName: "w-full bg-[#ffe3b1] px-4 py-10 text-[#8c1c1c] md:px-10 md:py-14",
    cardClassName: "group relative aspect-[3/4] cursor-pointer overflow-hidden rounded-xl border border-[#8c1c1c]/35",
  },
  "double-dragon-green": SONG_LONG_GREEN,
  "boho-floral-green": {
    ...PORTRAIT_GREEN,
    sectionClassName: "w-full bg-[#fffaf7] px-4 py-10 text-[#30530F] md:px-10 md:py-14",
    cardClassName: "group relative aspect-[3/4] cursor-pointer overflow-hidden rounded-xl border border-[#6B8040]/35",
  },
  "boho-floral-pink": {
    ...PORTRAIT_PINK,
    sectionClassName: "w-full bg-[#fffaf7] px-4 py-10 text-[#9d6d63] md:px-10 md:py-14",
    cardClassName: "group relative aspect-[3/4] cursor-pointer overflow-hidden rounded-xl border border-[#9d6d63]/30",
  },
  "jasmine-white": {
    ...PORTRAIT_GOLD,
    sectionClassName: "w-full bg-[#f4efe4] px-4 py-10 text-[#b08a4a] md:px-10 md:py-14",
  },
  "silk-flora-brown": {
    ...PORTRAIT_BROWN,
    sectionClassName: "w-full bg-[#ead8c2] px-4 py-10 text-[#9a6a42] md:px-10 md:py-14",
  },
  "chateau-blue": {
    ...PORTRAIT_BLUE,
    sectionClassName: "w-full bg-[#f8fbff] px-4 py-10 text-[#123467] md:px-10 md:py-14",
    cardClassName: "group relative aspect-[3/4] cursor-pointer overflow-hidden rounded-xl border border-[#123467]/30",
  },
  "brocade-flower-red": PORTRAIT_RED,
  "crystal-floral-blue": PORTRAIT_BLUE,
  "chateau-green": {
    ...PORTRAIT_GREEN,
    sectionClassName: "w-full bg-[#eef6f0] px-4 py-10 text-[#1f4034] md:px-10 md:py-14",
    cardClassName: "group relative aspect-[3/4] cursor-pointer overflow-hidden rounded-xl border border-[#1f4034]/30",
  },
  "baroque-gold": PORTRAIT_GOLD,
  "qasr-green": {
    ...PORTRAIT_GREEN,
    sectionClassName: "w-full bg-[#f8f4e8] px-4 py-10 text-[#1e3d2f] md:px-10 md:py-14",
    cardClassName: "group relative aspect-[3/4] cursor-pointer overflow-hidden rounded-xl border border-[#c9a24a]/50",
  },
  "qasr-gold": {
    ...PORTRAIT_GOLD,
    sectionClassName: "w-full bg-[#fbf5e6] px-4 py-10 text-[#7a5a1e] md:px-10 md:py-14",
    cardClassName: "group relative aspect-[3/4] cursor-pointer overflow-hidden rounded-xl border border-[#a8842c]/50",
  },
  "glass-garden-green": {
    ...PORTRAIT_GREEN,
    sectionClassName: "w-full bg-[#eef7f0] px-4 py-10 text-[#47613e] md:px-10 md:py-14",
    cardClassName: "group relative aspect-[3/4] cursor-pointer overflow-hidden rounded-xl border border-[#47613e]/30",
  },
  "royal-red": ROYAL_RED,
  "nhat-binh-red": {
    sectionClassName: "w-full bg-[#F8F3E0] px-6 py-10 text-[#542E08] md:px-10 md:py-14",
    headingWrapClassName: "w-full",
    headingClassName: "text-center text-[21px] font-normal uppercase tracking-[0.02em] text-[#C32A29] md:text-[32px]",
    bodyClassName: "mx-auto mt-8 w-full max-w-[560px]",
    gridClassName: WIDE_SQUARE_GRID,
    cardClassName: "group relative aspect-square cursor-pointer overflow-hidden rounded-xl border border-[#542E08]/20 bg-[#542E08]/5",
    mediaClassName: MEDIA,
  },
  "hoa-tinh-red": {
    ...PORTRAIT_RED,
    sectionClassName: "w-full bg-[#fffaf7] px-4 py-10 text-[#d70c1b] md:px-10 md:py-14",
    cardClassName: "group relative aspect-[3/4] cursor-pointer overflow-hidden rounded-xl border border-[#d70c1b]/30",
  },
  "co-ba-red": {
    sectionClassName: "w-full bg-[#F8F3E0] px-6 py-10 text-[#542E08] md:px-10 md:py-14",
    headingWrapClassName: "w-full",
    headingClassName: "text-center text-[21px] font-normal uppercase tracking-[0.02em] text-[#C32A29] md:text-[32px]",
    bodyClassName: "mx-auto mt-8 w-full max-w-[560px]",
    gridClassName: WIDE_SQUARE_GRID,
    cardClassName: "group relative aspect-square cursor-pointer overflow-hidden rounded-xl border border-[#542E08]/20 bg-[#542E08]/5",
    mediaClassName: MEDIA,
  },
  "royal-blue": ROYAL_BLUE,
  "royal-green": ROYAL_GREEN,
  "spring-garden-green": {
    ...PORTRAIT_GREEN,
    sectionClassName: "w-full bg-white/80 px-4 py-10 text-[#697a62] md:px-10 md:py-14",
    cardClassName: "group relative aspect-[3/4] cursor-pointer overflow-hidden rounded-xl border border-[#697a62]/30",
  },
  "chibi-red": {
    ...PORTRAIT_RED,
    sectionClassName: "w-full bg-[#fff1df] px-4 py-10 text-[#d63b2e] md:px-10 md:py-14",
    cardClassName: "group relative aspect-[3/4] cursor-pointer overflow-hidden rounded-xl border border-[#d63b2e]/30",
  },
  "boho-floral-brown": PORTRAIT_BROWN,
  "spring-garden-red": {
    sectionClassName: "w-full bg-[#fff0f0] px-6 py-10 text-[#D25F65] md:px-10 md:py-14",
    headingWrapClassName: "w-full",
    headingClassName: EDITORIAL_HEADING,
    bodyClassName: "mx-auto mt-7 w-full max-w-[560px]",
    gridClassName: WIDE_SQUARE_GRID,
    cardClassName: "group relative aspect-square cursor-pointer overflow-hidden rounded-xl border border-[#D25F65]/35",
    mediaClassName: MEDIA,
  },
  "dragon-phoenix-green": DRAGON_PHOENIX_GREEN,
  "spring-garden-blue": {
    sectionClassName: "w-full bg-[#eef7fa] px-6 py-10 text-[#486C7D] md:px-10 md:py-14",
    headingWrapClassName: "w-full",
    headingClassName: EDITORIAL_HEADING,
    bodyClassName: "mx-auto mt-7 w-full max-w-[560px]",
    gridClassName: WIDE_SQUARE_GRID,
    cardClassName: "group relative aspect-square cursor-pointer overflow-hidden rounded-xl border border-[#486C7D]/30 bg-white/70",
    mediaClassName: MEDIA,
  },
  "minimalism-red": {
    ...PORTRAIT_RED,
    sectionClassName: "w-full bg-[#fffaf7] px-4 py-10 text-[#7c151a] md:px-10 md:py-14",
    cardClassName: "group relative aspect-[3/4] cursor-pointer overflow-hidden rounded-xl border border-[#7c151a]/30",
  },
  "cherry-blossom-pink": {
    sectionClassName: "w-full bg-[#fdf3f6] px-6 py-10 text-[#ae4c51] md:px-10 md:py-14",
    headingWrapClassName: "w-full",
    headingClassName: "text-center font-serif text-[20px] font-normal uppercase tracking-[0.05em] md:text-[26px]",
    bodyClassName: "mx-auto mt-7 w-full max-w-[560px]",
    gridClassName: WIDE_SQUARE_GRID,
    cardClassName: "group relative aspect-square cursor-pointer overflow-hidden rounded-xl border border-white/20 bg-white/5",
    mediaClassName: MEDIA,
  },
  "double-phoenix-green": PHOENIX_GREEN,
  "double-dragon-blue": DOUBLE_DRAGON_BLUE,
  "dragon-phoenix-blue": DRAGON_PHOENIX_BLUE,
  "dragon-phoenix-black": DRAGON_PHOENIX_BLACK,
};

const DEFAULT_STYLE: MomentsStyle = {
  sectionClassName: "w-full bg-[#fffaf7] px-4 py-10 text-neutral-800 md:px-10 md:py-14",
  headingWrapClassName: "w-full",
  headingClassName: EDITORIAL_HEADING,
  bodyClassName: "mx-auto mt-6 w-full max-w-[560px]",
  gridClassName: PORTRAIT_GRID,
  cardClassName: PORTRAIT_CARD,
  mediaClassName: MEDIA,
};

function GuestMediaLightbox({
  index,
  media,
  onClose,
  onIndexChange,
}: {
  index: number | null;
  media: PublicGuestMedia[];
  onClose: () => void;
  onIndexChange: (index: number) => void;
}) {
  const live = useLiveForms();
  const count = media.length;
  const item = index === null ? null : media[index] ?? null;

  const step = useCallback((direction: number) => {
    if (index === null || count === 0) return;
    onIndexChange((index + direction + count) % count);
  }, [count, index, onIndexChange]);
  const zoom = useLightboxZoom({
    enabled: item?.kind === "image",
    onSwipe: step,
  });
  const resetZoom = zoom.resetZoom;
  const navigate = useCallback((direction: number) => {
    resetZoom(false);
    step(direction);
  }, [resetZoom, step]);
  const close = useCallback(() => {
    resetZoom(false);
    onClose();
  }, [onClose, resetZoom]);

  useEffect(() => {
    if (index === null) return;
    const originalOverflow = document.body.style.overflow;
    const ownsOverflowLock = originalOverflow !== "hidden";
    if (ownsOverflowLock) {
      document.body.style.overflow = "hidden";
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
      if (event.key === "ArrowLeft") navigate(-1);
      if (event.key === "ArrowRight") navigate(1);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      if (
        ownsOverflowLock
        && document.body.style.overflow === "hidden"
      ) {
        document.body.style.overflow = originalOverflow;
      }
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [close, index, navigate]);

  if (index === null || !live) return null;
  if (!item) return null;
  const labels = live.mediaLabels;
  const zoomLabels = {
    zoomIn: labels.zoomIn,
    zoomOut: labels.zoomOut,
    resetZoom: labels.resetZoom,
  };

  return createPortal(
    <div
      data-testid="guest-moments-lightbox"
      className="fixed inset-0 z-[150] flex flex-col overflow-hidden bg-black/95 text-white"
      onClick={close}
    >
      <div className="relative z-20 flex min-h-16 items-center justify-between gap-3 px-3 sm:px-5">
        <span className="rounded-full bg-white/10 px-3 py-1 text-sm tabular-nums">
          {index + 1} / {count}
        </span>
        <div className="flex items-center gap-2">
          <a
            data-testid="guest-moments-download"
            href={`${item.url}?download=1`}
            download
            onClick={(event) => event.stopPropagation()}
            aria-label={`${labels.download}: ${item.originalName}`}
            className="inline-flex min-h-11 items-center gap-2 rounded-full bg-white px-4 text-sm font-semibold text-neutral-900 transition hover:bg-neutral-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
          >
            <Download className="size-4" aria-hidden />
            <span className="hidden sm:inline">{labels.download}</span>
          </a>
          <button
            type="button"
            aria-label={labels.close}
            onClick={(event) => {
              event.stopPropagation();
              close();
            }}
            className="grid size-11 place-items-center rounded-full bg-white/10 transition hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
          >
            <X className="size-5" aria-hidden />
          </button>
        </div>
      </div>

      <div className="relative min-h-0 flex-1 overflow-hidden pb-24">
        {count > 1 ? (
          <>
            <button
              type="button"
              aria-label={labels.previous}
              onClick={(event) => {
                event.stopPropagation();
                navigate(-1);
              }}
              className="absolute left-2 z-20 grid size-12 place-items-center rounded-full bg-black/40 transition hover:bg-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white sm:left-5"
            >
              <ChevronLeft className="size-7" aria-hidden />
            </button>
            <button
              type="button"
              aria-label={labels.next}
              onClick={(event) => {
                event.stopPropagation();
                navigate(1);
              }}
              className="absolute right-2 z-20 grid size-12 place-items-center rounded-full bg-black/40 transition hover:bg-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white sm:right-5"
            >
              <ChevronRight className="size-7" aria-hidden />
            </button>
          </>
        ) : null}

        <div
          data-testid="guest-moments-track"
          className="flex h-full w-full"
          onPointerCancel={zoom.onPointerCancel}
          onPointerDown={zoom.onPointerDown}
          onPointerMove={zoom.onPointerMove}
          onPointerUp={zoom.onPointerUp}
          onWheel={zoom.onWheel}
          style={{
            touchAction: "none",
            transform: `translate3d(calc(${-index * 100}% + ${zoom.trackDrag}px), 0, 0)`,
            transition: zoom.trackAnimating ? "transform 320ms cubic-bezier(0.22, 1, 0.36, 1)" : "none",
            willChange: "transform",
          }}
        >
          {media.map((slide, slideIndex) => (
            <div
              key={slide.id}
              ref={slideIndex === index ? zoom.viewportRef : undefined}
              className="flex h-full w-full shrink-0 items-center justify-center px-4 sm:px-20"
            >
              <div
                className="flex max-h-full max-w-full flex-col items-center"
                onClick={(event) => event.stopPropagation()}
              >
                {slide.kind === "image" ? (
                  // A normal img keeps its fitted box equal to the visible photo,
                  // which gives the zoom controller accurate pan boundaries.
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    ref={slideIndex === index ? zoom.imageRef : undefined}
                    src={slide.url}
                    alt={`${labels.imageAlt}: ${slide.originalName}`}
                    data-testid={slideIndex === index ? "guest-moments-image" : undefined}
                    data-zoom-scale={slideIndex === index ? zoom.scale.toFixed(2) : undefined}
                    draggable={false}
                    onDoubleClick={slideIndex === index ? zoom.onDoubleClick : undefined}
                    style={slideIndex === index ? zoom.imageStyle : undefined}
                    className="h-[72dvh] max-h-[900px] w-[94vw] select-none rounded-lg object-contain drop-shadow-2xl sm:w-[80vw]"
                  />
                ) : (
                  <video
                    src={slide.url}
                    aria-label={`${labels.videoAlt}: ${slide.originalName}`}
                    controls
                    playsInline
                    preload="metadata"
                    onPointerDown={(event) => event.stopPropagation()}
                    className="max-h-[72dvh] max-w-[94vw] rounded-lg bg-black object-contain shadow-2xl sm:max-w-[80vw]"
                  >
                    {labels.videoAlt}
                  </video>
                )}
                <div className="mt-4 max-w-[92vw] text-center">
                  <p className="text-sm font-semibold">{slide.contributorName}</p>
                  <p className="mt-1 truncate text-xs text-white/65">{slide.originalName}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {item.kind === "image" ? (
        <LightboxZoomControls
          className="absolute bottom-20 left-1/2 z-30 -translate-x-1/2"
          labels={zoomLabels}
          resetZoom={zoom.resetZoom}
          scale={zoom.scale}
          testIdPrefix="guest-moments"
          zoomIn={zoom.zoomIn}
          zoomOut={zoom.zoomOut}
        />
      ) : null}

      <div
        className="absolute inset-x-0 bottom-3 z-20 mx-auto flex max-w-[92vw] justify-center gap-2 overflow-x-auto px-2"
        onClick={(event) => event.stopPropagation()}
      >
        {media.map((thumbnail, thumbnailIndex) => (
          <button
            key={thumbnail.id}
            type="button"
            onClick={() => {
              zoom.resetZoom(false);
              onIndexChange(thumbnailIndex);
            }}
            aria-label={`${labels.open}: ${thumbnail.originalName}`}
            className={`relative size-14 shrink-0 overflow-hidden rounded-md border-2 transition ${
              thumbnailIndex === index ? "border-white opacity-100" : "border-transparent opacity-55"
            }`}
          >
            {thumbnail.kind === "image" ? (
              <Image
                src={thumbnail.url}
                alt=""
                aria-hidden
                fill
                unoptimized
                sizes="56px"
                className="object-cover"
              />
            ) : (
              <span className="grid size-full place-items-center bg-neutral-900">
                <Film className="size-5" aria-hidden />
              </span>
            )}
          </button>
        ))}
      </div>
    </div>,
    document.body,
  );
}

function PublicGuestMomentsSection({ templateSlug }: { templateSlug: string }) {
  const live = useLiveForms();
  const { media, setUploadOpen } = useGuestMediaGallery();
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const { items, extraCount } = guestMediaPreview(media);
  const style = MOMENTS_STYLES[templateSlug] ?? DEFAULT_STYLE;

  const closeLightbox = useCallback(() => setLightboxIndex(null), []);

  if (!live || items.length === 0) return null;
  const labels = live.mediaLabels;

  return (
    <>
      <section
        data-testid="guest-moments-section"
        aria-labelledby="guest-moments-heading"
        className={style.sectionClassName}
      >
        <div className={style.headingWrapClassName}>
          <h2 id="guest-moments-heading" className={style.headingClassName}>
            {labels.title}
          </h2>
        </div>
        <div className={style.bodyClassName}>
          <div data-testid="guest-moments-preview" className={style.gridClassName}>
            {items.map((item, itemIndex) => {
              const showExtra = itemIndex === items.length - 1 && extraCount > 0;
              return (
                <button
                  key={item.id}
                  type="button"
                  data-guest-moment-index={itemIndex}
                  onClick={() => setLightboxIndex(itemIndex)}
                  aria-label={`${labels.open}: ${item.originalName}`}
                  className={style.cardClassName}
                >
                  {item.kind === "image" ? (
                    <Image
                      src={item.url}
                      alt={`${labels.imageAlt}: ${item.originalName}`}
                      fill
                      unoptimized
                      sizes="(max-width: 640px) 50vw, 280px"
                      className={style.mediaClassName}
                    />
                  ) : (
                    <span className="relative grid size-full place-items-center bg-neutral-900 text-white">
                      <video
                        src={item.url}
                        muted
                        playsInline
                        preload="metadata"
                        aria-hidden
                        className={style.mediaClassName}
                      />
                      <span className="absolute inset-0 grid place-items-center bg-black/25">
                        <span className="grid size-12 place-items-center rounded-full bg-black/60">
                          <Play className="ml-0.5 size-5 fill-current" aria-hidden />
                        </span>
                      </span>
                    </span>
                  )}
                  {showExtra ? (
                    <span
                      data-testid="guest-moments-extra"
                      className="absolute inset-0 flex items-center justify-center bg-black/60 text-lg font-semibold text-white"
                    >
                      +{extraCount}
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>
          <div className="mt-6 flex justify-center">
            <button
              type="button"
              onClick={() => setUploadOpen(true)}
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border-2 border-current px-6 text-sm font-semibold transition hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-current"
            >
              <ImagePlus className="size-4" aria-hidden />
              {labels.uploadCta}
            </button>
          </div>
        </div>
      </section>
      <GuestMediaLightbox
        index={lightboxIndex}
        media={media}
        onClose={closeLightbox}
        onIndexChange={setLightboxIndex}
      />
    </>
  );
}

function ActiveGuestMomentsPortal({ templateSlug }: { templateSlug: string }) {
  const [host, setHost] = useState<HTMLElement | null>(null);

  useEffect(() => {
    let portalHost: HTMLDivElement | null = null;
    let observer: MutationObserver | null = null;
    let mountedInExplicitSlot = false;

    const mountBeforeFooter = () => {
      if (portalHost?.isConnected) {
        return mountedInExplicitSlot ? "slot" : "footer";
      }

      if (portalHost) {
        portalHost = null;
        setHost(null);
      }

      const explicitSlot = document.querySelector<HTMLElement>(
        "[data-guest-moments-slot]",
      );
      if (explicitSlot) {
        portalHost = document.createElement("div");
        portalHost.dataset.guestMomentsHost = templateSlug;
        portalHost.className = "h-full w-full";
        explicitSlot.replaceChildren(portalHost);
        mountedInExplicitSlot = true;
        setHost(portalHost);
        return "slot";
      }

      const footer = document.querySelector<HTMLElement>("[data-template-footer]");
      if (!footer?.parentElement) return null;

      portalHost = document.createElement("div");
      portalHost.dataset.guestMomentsHost = templateSlug;
      portalHost.className = "w-full shrink-0";
      footer.parentElement.insertBefore(portalHost, footer);
      mountedInExplicitSlot = false;
      setHost(portalHost);
      return "footer";
    };

    const initialMount = mountBeforeFooter();
    if (initialMount !== "footer") {
      observer = new MutationObserver(() => {
        const nextMount = mountBeforeFooter();
        if (nextMount === "footer") observer?.disconnect();
      });
      observer.observe(document.body, { childList: true, subtree: true });
    }

    return () => {
      observer?.disconnect();
      portalHost?.remove();
    };
  }, [templateSlug]);

  if (!host) return null;
  return createPortal(<PublicGuestMomentsSection templateSlug={templateSlug} />, host);
}

export function PublicGuestMomentsPortal({ templateSlug }: { templateSlug: string }) {
  const { enabled, media } = useGuestMediaGallery();
  if (!enabled || media.length === 0) return null;
  return <ActiveGuestMomentsPortal key={templateSlug} templateSlug={templateSlug} />;
}

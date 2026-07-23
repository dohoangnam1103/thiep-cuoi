"use client";

import { type ComponentPropsWithoutRef, type CSSProperties, type Dispatch, type ReactNode, type SetStateAction, useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

import type { ChungDoiDemoContent } from "@/data/chungdoi-demo-content";
import { useWishFormBinding } from "@/components/chungdoi-live-forms";
import {
  LightboxZoomControls,
  useLightboxZoom,
  VI_LIGHTBOX_ZOOM_LABELS,
} from "@/components/lightbox-zoom";
import { buildVietQrImageUrl } from "@/lib/vietqr";
import { formatVietnameseLunarDate } from "@/lib/vietnamese-lunar-date";
import { orderedCouple } from "@/lib/invitation-display";

export { buildVietQrImageUrl } from "@/lib/vietqr";

export const VN_DAYS = ["Chủ Nhật", "Thứ Hai", "Thứ Ba", "Thứ Tư", "Thứ Năm", "Thứ Sáu", "Thứ Bảy"];
export const WEEKDAY_LABELS = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];

export function hexToRgba(hex: string, alpha: number) {
  const clean = hex.replace("#", "");
  const value = clean.length === 3 ? clean.split("").map((c) => c + c).join("") : clean;
  const r = parseInt(value.slice(0, 2), 16);
  const g = parseInt(value.slice(2, 4), 16);
  const b = parseInt(value.slice(4, 6), 16);
  if ([r, g, b].some(Number.isNaN)) return `rgba(0,0,0,${alpha})`;
  return `rgba(${r},${g},${b},${alpha})`;
}

export function parseISODate(iso: string) {
  const d = new Date(`${iso}T00:00:00`);
  return Number.isNaN(d.getTime()) ? null : d;
}

export type FormattedDate = {
  weekday: string;
  day: string;
  month: string;
  monthNumber: number;
  dayNumber: number;
  yearNumber: number;
  lunar: string;
};

export function formatDate(iso: string): FormattedDate | null {
  const d = parseISODate(iso);
  if (!d) return null;
  return {
    weekday: VN_DAYS[d.getDay()],
    day: String(d.getDate()).padStart(2, "0"),
    month: String(d.getMonth() + 1).padStart(2, "0"),
    monthNumber: d.getMonth() + 1,
    dayNumber: d.getDate(),
    yearNumber: d.getFullYear(),
    lunar: formatVietnameseLunarDate(iso),
  };
}

export function buildCalendar(iso: string) {
  const d = parseISODate(iso);
  if (!d) return null;
  const year = d.getFullYear();
  const month = d.getMonth();
  const firstWeekday = (new Date(year, month, 1).getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = [
    ...Array.from({ length: firstWeekday }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  return { cells, highlight: d.getDate(), month: month + 1, year };
}

export function formatWishTime(raw: string) {
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return raw;
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(d.getHours())}:${pad(d.getMinutes())} ${pad(d.getDate())}/${d.getMonth() + 1}/${d.getFullYear()}`;
}

export function useLightbox(count: number) {
  const [lightbox, setLightbox] = useState<number | null>(null);

  return { lightbox: count > 0 ? lightbox : null, setLightbox };
}

export function Lightbox({
  gallery,
  index,
  setIndex,
  accent = "#ffffff",
}: {
  gallery: string[];
  index: number | null;
  setIndex: Dispatch<SetStateAction<number | null>>;
  accent?: string;
}) {
  const count = gallery.length;
  const step = useCallback((dir: number) => {
    setIndex((v) => (v === null ? v : (v + dir + count) % count));
  }, [count, setIndex]);
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
  const close = useCallback(() => {
    resetZoom(false);
    setIndex(null);
  }, [resetZoom, setIndex]);

  useEffect(() => {
    if (index === null) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
      if (event.key === "ArrowLeft") navigate(-1);
      if (event.key === "ArrowRight") navigate(1);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [close, index, navigate]);

  if (index === null) return null;

  return createPortal((
    <div
      data-testid="wedding-lightbox"
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center overflow-hidden bg-black/90"
      onClick={close}
    >
      <button type="button" aria-label="Đóng" onClick={(e) => { e.stopPropagation(); close(); }} className="absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center text-2xl text-white/90 transition-opacity hover:opacity-70">✕</button>
      <div className="absolute top-5 z-10 text-sm text-white/80">{index + 1} / {count}</div>
      <button type="button" aria-label="Ảnh trước" onClick={(e) => { e.stopPropagation(); navigate(-1); }} className="absolute left-3 top-1/2 z-10 flex h-12 w-12 -translate-y-1/2 items-center justify-center text-3xl text-white/90 transition-opacity hover:opacity-70 md:left-8">‹</button>
      <button type="button" aria-label="Ảnh sau" onClick={(e) => { e.stopPropagation(); navigate(1); }} className="absolute right-3 top-1/2 z-10 flex h-12 w-12 -translate-y-1/2 items-center justify-center text-3xl text-white/90 transition-opacity hover:opacity-70 md:right-8">›</button>

      <div
        data-testid="wedding-lightbox-track"
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
        }}
      >
        {gallery.map((src, i) => (
          <div
            key={src}
            ref={i === index ? zoom.viewportRef : undefined}
            className="flex h-full w-full shrink-0 items-center justify-center px-4"
          >
            <img
              ref={i === index ? zoom.imageRef : undefined}
              src={src}
              alt={`Wedding photo ${i + 1}`}
              data-testid={i === index ? "wedding-lightbox-image" : undefined}
              data-zoom-scale={i === index ? zoom.scale.toFixed(2) : undefined}
              draggable={false}
              onClick={(e) => e.stopPropagation()}
              onDoubleClick={i === index ? zoom.onDoubleClick : undefined}
              style={i === index ? zoom.imageStyle : undefined}
              className="max-h-[78vh] max-w-[92vw] select-none rounded-lg object-contain"
            />
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

      <div className="absolute bottom-4 z-10 flex max-w-[92vw] gap-2 overflow-x-auto px-2" onClick={(e) => e.stopPropagation()}>
        {gallery.map((src, i) => (
          <button key={src} type="button" onClick={() => { zoom.resetZoom(false); setIndex(i); }} className="h-14 w-14 shrink-0 overflow-hidden rounded-md border-2 transition-opacity" style={{ borderColor: i === index ? accent : "transparent", opacity: i === index ? 1 : 0.6 }}>
            <img src={src} alt={`Thumbnail ${i + 1}`} draggable={false} className="h-full w-full object-cover" />
          </button>
        ))}
      </div>
    </div>
  ), document.body);
}

export function googleCalendarUrl(content: ChungDoiDemoContent) {
  const { date, time } = content.couple;
  const people = orderedCouple(content);
  const title = `Đám cưới ${people[0].shortName} & ${people[1].shortName}`;
  const start = `${date.replace(/-/g, "")}T${(time || "18:00").replace(":", "")}00`;
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: title,
    dates: `${start}/${start}`,
    location: content.venue.mapAddress || content.venue.address,
    details: content.venue.address,
  });
  return `https://www.google.com/calendar/render?${params.toString()}`;
}

function coordsFromMapsUrl(value: string): string | null {
  const place = value.match(/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/);
  if (place) return `${place[1]},${place[2]}`;
  const at = value.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
  if (at) return `${at[1]},${at[2]}`;
  return null;
}

export function mapEmbedUrl(query: string) {
  const trimmed = query.trim();
  if (/^https?:\/\/\S*google\.[^/]*\/maps/i.test(trimmed)) {
    const coords = coordsFromMapsUrl(trimmed);
    if (coords) return `https://www.google.com/maps?q=${coords}&output=embed`;
  }
  return `https://www.google.com/maps?q=${encodeURIComponent(trimmed)}&output=embed`;
}

type InvitationMapProps = Omit<ComponentPropsWithoutRef<"iframe">, "src"> & {
  query: string;
};

export function InvitationMap({ query, title, ...iframeProps }: InvitationMapProps) {
  return (
    <iframe
      {...iframeProps}
      src={mapEmbedUrl(query)}
      title={title ?? query}
    />
  );
}

export function FamilyColumn({ title, a, b, addr }: { title: string; a: string; b: string; addr: string }) {
  return (
    <div className="flex min-h-0 w-full min-w-0 flex-col items-center gap-1.5">
      <span className="text-[15px] font-normal md:text-[18px] lg:text-[19px]">{title}</span>
      <span className="whitespace-nowrap text-[20px] font-bold">{a}</span>
      <span className="whitespace-nowrap text-[20px] font-bold">{b}</span>
      {addr ? <div className="mt-1 w-full max-w-[169px] whitespace-pre-line text-[13px] leading-normal md:max-w-[260px] md:text-[15px] lg:max-w-[300px] lg:text-[16px]">{addr}</div> : null}
    </div>
  );
}

export function FitText({
  children,
  maxFontSize,
  className,
  style,
}: {
  children: string;
  maxFontSize: number;
  className?: string;
  style?: CSSProperties;
}) {
  const outerRef = useRef<HTMLHeadingElement>(null);
  const innerRef = useRef<HTMLSpanElement>(null);
  const [fontSize, setFontSize] = useState(maxFontSize);
  useEffect(() => {
    const outer = outerRef.current;
    const inner = innerRef.current;
    if (!outer || !inner) return;
    const fit = () => {
      const avail = outer.clientWidth;
      if (!avail) return;
      inner.style.fontSize = `${maxFontSize}px`;
      const natural = inner.scrollWidth;
      inner.style.fontSize = "";
      const next =
        natural > avail
          ? Math.max(1, Math.floor((maxFontSize * avail) / natural))
          : maxFontSize;
      setFontSize(next);
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(outer);
    if (typeof document !== "undefined" && document.fonts && document.fonts.ready) {
      document.fonts.ready.then(fit).catch(() => {});
    }
    return () => ro.disconnect();
  }, [children, maxFontSize]);
  return (
    <h3 ref={outerRef} className={className} style={{ ...style, fontSize }}>
      <span ref={innerRef} className="inline-block whitespace-nowrap">
        {children}
      </span>
    </h3>
  );
}

/** Generic wish form bound to the live-forms provider. `accent` colors the border + button. */
export function SharedWishForm({ accent }: { accent: string }) {
  const { formProps, pending, state } = useWishFormBinding();

  return (
    <form {...formProps} className="mx-auto mt-6 w-full max-w-full md:max-w-[600px]">
      <div className="flex flex-col gap-3">
        <input name="name" required maxLength={120} className="w-full rounded-[6px] border px-4 py-2 text-[13px] outline-none" style={{ borderColor: hexToRgba(accent, 0.3) }} placeholder="Tên của bạn" />
        <textarea name="text" rows={3} required maxLength={1000} className="w-full rounded-[6px] border px-4 py-2 text-[13px] outline-none" style={{ borderColor: hexToRgba(accent, 0.3) }} placeholder="Lời chúc của bạn" />
        {state?.error ? <p className="text-[12px]" style={{ color: "#c0392b" }}>{state.error}</p> : null}
        {state?.ok ? <p className="text-[12px]" style={{ color: accent }}>Cảm ơn lời chúc của bạn!</p> : null}
        <div className="mt-2 flex items-center justify-end">
          <button type="submit" disabled={pending} className="rounded-full px-4 py-1.5 text-[11px] font-semibold uppercase disabled:opacity-60" style={{ backgroundColor: accent, color: "#fff" }}>{pending ? "Đang gửi..." : "Gửi lời chúc"}</button>
        </div>
      </div>
    </form>
  );
}

/** Đếm ngược tới `target` (ISO "YYYY-MM-DDTHH:mm"). Màu do wrapper set qua className/style. */
export function SharedCountdown({ target, className, style }: { target: string; className?: string; style?: CSSProperties }) {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    const tick = () => setNow(Date.now());
    const raf = requestAnimationFrame(tick);
    const id = window.setInterval(tick, 1000);
    return () => {
      cancelAnimationFrame(raf);
      window.clearInterval(id);
    };
  }, []);
  const diff = now === null ? 0 : Math.max(0, new Date(target).getTime() - now);
  const days = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  const mins = Math.floor((diff % 3600000) / 60000);
  const secs = Math.floor((diff % 60000) / 1000);
  return (
    <p className={className ?? "mt-2 text-center text-[20px] font-semibold md:text-[22px]"} style={style}>
      {days} ngày {hours} giờ {mins} phút {secs} giây
    </p>
  );
}

/** Slideshow ảnh cover: tự chạy 4s + mũi tên + dot. Bọc trong khung `relative`. */
export function SharedCarousel({ photos, className, arrowColor = "#fff" }: { photos: string[]; className?: string; arrowColor?: string }) {
  const [i, setI] = useState(0);
  const count = photos.length;
  useEffect(() => {
    if (count <= 1) return;
    const id = window.setInterval(() => setI((v) => (v + 1) % count), 4000);
    return () => window.clearInterval(id);
  }, [count]);
  if (count === 0) return null;
  const step = (d: number) => setI((v) => (v + d + count) % count);
  return (
    <div className={className ?? "absolute inset-0 overflow-hidden"}>
      <div className="flex h-full w-full transition-transform duration-500 ease-out" style={{ transform: `translate3d(${-i * 100}%,0,0)` }}>
        {photos.map((src, idx) => (
          <div key={src} className="h-full w-full shrink-0">
            <img alt={`Ảnh cưới ${idx + 1}`} src={src} className="h-full w-full object-cover" />
          </div>
        ))}
      </div>
      {count > 1 ? (
        <>
          <button type="button" aria-label="Ảnh trước" onClick={() => step(-1)} className="absolute left-1 top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-black/25 text-2xl transition hover:bg-black/40" style={{ color: arrowColor }}>‹</button>
          <button type="button" aria-label="Ảnh sau" onClick={() => step(1)} className="absolute right-1 top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-black/25 text-2xl transition hover:bg-black/40" style={{ color: arrowColor }}>›</button>
          <div className="absolute inset-x-0 bottom-2 z-10 flex justify-center gap-1.5">
            {photos.map((src, idx) => (
              <button key={src} type="button" aria-label={`Ảnh ${idx + 1}`} onClick={() => setI(idx)} className="h-1.5 w-1.5 rounded-full transition" style={{ backgroundColor: idx === i ? "#fff" : "rgba(255,255,255,0.5)" }} />
            ))}
          </div>
        </>
      ) : null}
    </div>
  );
}

/** Khối Dress Code: heading + phụ đề + chip màu trang phục. */
export function DressCode({
  colors,
  heading,
  headingColor,
  subLabel = "Trang phục dự tiệc",
  subColor,
}: {
  colors: { color: string; border?: string }[];
  heading?: ReactNode;
  headingColor?: string;
  subLabel?: string;
  subColor?: string;
}) {
  return (
    <div className="flex w-full flex-col items-center gap-4">
      {heading != null ? heading : <h2 className="text-center text-[20px] font-bold uppercase tracking-wide md:text-[24px]" style={{ color: headingColor }}>Dress Code</h2>}
      <p className="text-center text-sm opacity-70 md:text-base" style={{ color: subColor ?? headingColor }}>{subLabel}</p>
      <div className="flex flex-wrap justify-center gap-4 md:gap-6">
        {colors.map((c, i) => (
          <div key={i} className="h-10 w-10 rounded-full shadow-md md:h-12 md:w-12" style={{ backgroundColor: c.color, border: c.border ? `1.5px solid ${c.border}` : undefined }} />
        ))}
      </div>
    </div>
  );
}

export type GiftBank = { label: string; bank: string; num: string; name: string };

export function GiftQrGrid({
  banks,
  heading = "Hộp Quà Mừng",
  accent,
}: {
  banks: GiftBank[];
  heading?: string;
  accent: string;
}) {
  if (banks.length === 0) return null;

  return (
    <div data-testid="gift-qr-grid" className="flex w-full flex-col items-center gap-6 text-center">
      <h2 className="text-[20px] font-bold uppercase tracking-wide md:text-[24px]" style={{ color: accent }}>{heading}</h2>
      <div className="flex w-full flex-row flex-wrap items-start justify-center gap-4 sm:gap-8">
        {banks.map((gift) => {
          const qr = buildVietQrImageUrl({ bank: gift.bank, accountNumber: gift.num, accountName: gift.name });
          return (
            <div key={gift.label} className="flex max-w-[200px] flex-1 flex-col items-center">
              <h3 className="mb-2 flex min-h-8 items-start justify-center text-xs font-semibold" style={{ color: accent }}>{gift.label}</h3>
              <div className="size-32 rounded-xl bg-white p-2 shadow-lg sm:size-40">
                <img src={qr} alt={`QR - ${gift.label}`} className="h-full w-full object-contain" />
              </div>
              <p className="mt-2 text-[13px] font-semibold" style={{ color: accent }}>{gift.bank}</p>
              <p className="font-mono text-[13px]" style={{ color: accent }}>{gift.num}</p>
              <p className="text-[13px]" style={{ color: accent }}>{gift.name}</p>
              <a href={`${qr}&download=1`} download className="mt-3 rounded-full border px-4 py-1.5 text-[11px] font-semibold uppercase" style={{ borderColor: accent, color: accent }}>Lưu QR</a>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function GiftEnvelopeCorner({ className, rotation }: { className: string; rotation: number }) {
  return (
    <svg className={`absolute ${className}`} width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" strokeWidth="2" style={{ transform: `rotate(${rotation}deg)` }} aria-hidden>
      <path d="M2 2 L2 16 L6 16 L6 6 L16 6 L16 2 Z" opacity="0.85" strokeLinecap="square" strokeLinejoin="miter" />
      <path d="M6 10 L10 10 L10 6" opacity="0.85" strokeLinecap="square" />
    </svg>
  );
}

/** Nút phong bì mừng cưới (囍) + modal QR chuyển khoản. Tự quản state đóng/mở. */
export function GiftEnvelope({
  banks,
  accent,
  dark,
  cardBg,
  heading = "Phong Bao Mừng Cưới",
  labelColor,
  variant = "envelope",
}: {
  banks: GiftBank[];
  accent: string;
  dark: string;
  cardBg: string;
  heading?: string;
  labelColor?: string;
  variant?: "envelope" | "giftbox";
}) {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (!open) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = original;
    };
  }, [open]);
  if (banks.length === 0) return null;
  const muted = labelColor ?? hexToRgba(dark, 0.72);
  return (
    <div className="flex w-full flex-col items-center gap-4">
      <h2 className="text-center text-[20px] font-bold uppercase tracking-wide md:text-[24px]" style={{ color: dark }}>{heading}</h2>
      <button data-testid="gift-envelope" type="button" aria-label={`Mở ${heading.toLowerCase()}`} onClick={() => setOpen(true)} className={`group relative cursor-pointer border-none bg-transparent outline-none ${variant === "giftbox" ? "h-[280px] w-[260px]" : "h-64 w-[200px]"}`}>
        {variant === "giftbox" ? (
          <div data-testid="gift-envelope-animation" className="igb-wrapper relative flex h-full w-full items-end justify-center pb-8">
            <span className="igb-sparkle absolute left-[14%] top-[8%] z-20 text-[22px]" style={{ color: dark }}>✦</span>
            <span className="igb-sparkle igb-sparkle-2 absolute right-[10%] top-[18%] z-20 text-base" style={{ color: dark }}>✦</span>
            <span className="igb-sparkle igb-sparkle-3 absolute left-[5%] top-[32%] z-20 text-sm" style={{ color: dark }}>✦</span>
            <span className="igb-sparkle igb-sparkle-4 absolute right-[5%] top-[26%] z-20 text-sm" style={{ color: dark }}>✦</span>
            <div className="igb-confetti-field absolute left-1/2 top-[28%] z-0" aria-hidden>
              {Array.from({ length: 8 }, (_, index) => <i key={index} className={`igb-confetti igb-confetti-${index + 1}`} />)}
            </div>
            <div className="igb-bob relative h-[220px] w-[200px]" aria-hidden>
              <div className="igb-shadow absolute -bottom-2 left-1/2 h-3 w-36 -translate-x-1/2 rounded-full bg-black/40 blur-sm" />
              <span className="igb-present igb-present-1 absolute left-2 top-10 h-14 w-14"><i /></span>
              <span className="igb-present igb-present-2 absolute right-0 top-4 h-12 w-12"><i /></span>
              <span className="igb-present igb-present-3 absolute bottom-3 left-1/2 -ml-12 h-24 w-24"><i /></span>
              <span className="igb-present igb-present-4 absolute bottom-8 left-0 h-12 w-12"><i /></span>
              <span className="igb-present igb-present-5 absolute bottom-5 right-0 h-16 w-16"><i /></span>
            </div>
          </div>
        ) : (
        <div data-testid="gift-envelope-animation" className="nhat-binh-envelope-wrapper relative flex h-full w-full items-center justify-center">
          {[
            { w: 30.8, style: { top: "5%", right: "5%" } },
            { w: 25.2, style: { top: "20%", left: "0%" } },
            { w: 28, style: { bottom: "20%", right: "0%" } },
            { w: 22.4, style: { bottom: "8%", left: "8%" } },
            { w: 21, style: { top: "45%", right: "-5%" } },
          ].map((c, i) => (
            <div key={i} className={`nhat-binh-coin-${i + 1} absolute rounded-full`} style={{ width: c.w, height: c.w, background: "#fbbf24", border: "2px solid #f59e0b", boxShadow: "rgba(0, 0, 0, 0.3) 0px 1px 3px", ...c.style }}>
              <div className="absolute rounded-full" style={{ inset: 2, border: "2px solid #fde047" }} />
              <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2" style={{ width: c.w * 0.28, height: c.w * 0.28, border: "2px solid #d97706", boxShadow: "rgba(0, 0, 0, 0.2) 1px 1px 2px inset" }} />
            </div>
          ))}
          <span className="nhat-binh-sparkle absolute text-white" style={{ top: "8%", left: "20%", fontSize: 14 }}>✦</span>
          <span className="nhat-binh-sparkle nhat-binh-sparkle-2 absolute text-white" style={{ bottom: "35%", right: "8%", fontSize: 11.2 }}>✦</span>
          <span className="nhat-binh-sparkle nhat-binh-sparkle-3 absolute text-white" style={{ top: "40%", left: "3%", fontSize: 8.4 }}>✦</span>
          <div className="nhat-binh-envelope-body relative" style={{ width: 140, height: 196 }}>
            <div className="absolute rounded-b-lg" style={{ left: 2, right: -2, bottom: -3, height: 196, backgroundColor: "#5c1612" }} />
            <div className="absolute rounded-r-lg" style={{ top: 2, bottom: -2, right: -3, width: 140, backgroundColor: "#6b1d18" }} />
            <div className="nhat-binh-envelope-front absolute inset-0 overflow-hidden rounded-lg" style={{ backgroundColor: "#b91c1c", boxShadow: "rgba(0, 0, 0, 0.3) 0px 4px 20px" }}>
              <div className="absolute inset-0 opacity-20" style={{ backgroundImage: "repeating-radial-gradient(circle at 0 0, transparent 0, transparent 11.2px, #7f1d1d 11.2px, #7f1d1d 11.9px)", backgroundSize: "21px 21px", backgroundPosition: "10.5px 10.5px" }} />
              <div className="absolute left-0 right-0 top-0" style={{ height: 4, backgroundColor: "#fbbf24" }} />
              <div className="absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full shadow-lg" style={{ width: 63, height: 63, background: "radial-gradient(circle, #fbbf24 0%, #d97706 100%)", border: "3px solid #fef3c7" }}>
                <span className="font-bold" style={{ fontSize: 30.8, color: "#b91c1c", lineHeight: 1, textShadow: "rgba(0, 0, 0, 0.2) 1px 1px 2px" }}>囍</span>
              </div>
              <GiftEnvelopeCorner className="left-2 top-2" rotation={0} />
              <GiftEnvelopeCorner className="right-2 top-2" rotation={90} />
              <GiftEnvelopeCorner className="bottom-2 left-2" rotation={-90} />
              <GiftEnvelopeCorner className="bottom-2 right-2" rotation={180} />
            </div>
          </div>
        </div>
        )}
        <p className={`${variant === "giftbox" ? "igb-hint bottom-0" : "nhat-binh-hint-text -bottom-2"} absolute left-1/2 -translate-x-1/2 whitespace-nowrap text-xs font-medium`} style={{ color: muted }}>Nhấn để mở</p>
      </button>
      {open ? createPortal((
        <div className="gift-modal-backdrop fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-3 sm:p-4" onClick={() => setOpen(false)}>
          <div className="gift-modal-panel max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl sm:max-w-xl" style={{ backgroundColor: cardBg }} onClick={(e) => e.stopPropagation()}>
            <div className="relative px-6 pb-4 pt-6 text-center" style={{ backgroundColor: dark }}>
              <button type="button" onClick={() => setOpen(false)} aria-label="Đóng" className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full text-white/80 hover:bg-white/20 hover:text-white">✕</button>
              <h2 className="text-[20px] font-bold uppercase tracking-wide text-white md:text-[24px]">{heading}</h2>
            </div>
            <div className="p-4 sm:p-6">
              <div data-testid="gift-bank-list" className="flex flex-row flex-wrap items-start justify-center gap-x-16 gap-y-8 sm:gap-x-24">
                {banks.map((q) => {
                  const qr = buildVietQrImageUrl({ bank: q.bank, accountNumber: q.num, accountName: q.name });
                  return (
                    <div data-testid="gift-bank-card" key={q.label} className="flex w-[42%] max-w-40 flex-col items-center">
                      <div className="flex aspect-square w-full items-center justify-center rounded-xl bg-white p-2 shadow-lg" style={{ border: `2px solid ${hexToRgba(accent, 0.2)}` }}>
                        <img alt={`QR - ${q.label}`} className="h-full w-full object-contain" src={qr} />
                      </div>
                      <div className="mt-2 space-y-0.5 text-center" style={{ color: muted }}>
                        <p className="text-[10px]">{q.bank}</p>
                        <p className="font-mono text-[10px]">{q.num}</p>
                        <p className="text-[10px] font-semibold">{q.name}</p>
                      </div>
                      <a href={`${qr}&download=1`} download className="mt-1.5 inline-flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-medium" style={{ color: dark, backgroundColor: hexToRgba(accent, 0.1) }}>Lưu QR</a>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      ), document.body) : null}
    </div>
  );
}

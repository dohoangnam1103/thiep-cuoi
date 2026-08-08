"use client";

import { type ComponentPropsWithoutRef, type CSSProperties, type Dispatch, type ReactNode, type SetStateAction, useCallback, useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import dynamic from "next/dynamic";

import type { AlbumLayout } from "@/lib/album-layout";

const CoverflowGallery = dynamic(() => import("./album-coverflow"), { ssr: false });
import {
  useRsvpFormBinding,
  useWishFormBinding,
  type PublicRsvpLabels,
  type PublicRsvpQuestion,
} from "@/components/chungdoi-live-forms";
import {
  GiftboxArtwork,
  LayeredGiftArtwork,
} from "@/components/chungdoi-gift-envelope-artwork";
import { resolveGiftVisual } from "@/data/chungdoi-gift-visuals";
import {
  LightboxZoomControls,
  useLightboxZoom,
  VI_LIGHTBOX_ZOOM_LABELS,
} from "@/components/lightbox-zoom";
import {
  coordinatesFromGoogleMapsUrl,
  isGoogleMapsUrl,
} from "@/lib/google-maps";
import { buildVietQrImageUrl } from "@/lib/vietqr";
import { formatVietnameseLunarDate } from "@/lib/vietnamese-lunar-date";
import { cn } from "@/lib/utils";

export { buildVietQrImageUrl } from "@/lib/vietqr";
export { googleCalendarUrl } from "@/lib/google-calendar-url";

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

export function mapEmbedUrl(query: string) {
  const trimmed = query.trim();
  if (isGoogleMapsUrl(trimmed)) {
    const coords = coordinatesFromGoogleMapsUrl(trimmed);
    if (coords) return `https://www.google.com/maps?q=${coords}&output=embed`;
  }
  return `https://www.google.com/maps?q=${encodeURIComponent(trimmed)}&output=embed`;
}

export function directionsUrl(query: string) {
  const trimmed = query.trim();
  let destination = trimmed;
  if (isGoogleMapsUrl(trimmed)) {
    const coords = coordinatesFromGoogleMapsUrl(trimmed);
    if (coords) destination = coords;
  }
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destination)}`;
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

type MapDirectionsButtonProps = {
  query: string;
  label?: string;
  className?: string;
  style?: CSSProperties;
};

export function MapDirectionsButton({ query, label = "Chỉ đường", className, style }: MapDirectionsButtonProps) {
  return (
    <a
      href={directionsUrl(query)}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "mt-4 inline-flex items-center justify-center gap-2 rounded-full border border-current px-5 py-2 text-sm font-medium tracking-wide transition-opacity hover:opacity-70",
        className,
      )}
      style={style}
    >
      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0Z" />
        <circle cx="12" cy="10" r="3" />
      </svg>
      {label}
    </a>
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

type SharedWishFormLabels = {
  nameLabel?: string;
  namePlaceholder?: string;
  textLabel?: string;
  textPlaceholder?: string;
  success?: string;
  submit?: string;
  pending?: string;
};

/** Generic wish form bound to the live-forms provider. `accent` colors the border + button. */
export function SharedWishForm({
  accent,
  centered = false,
  labels,
}: {
  accent: string;
  centered?: boolean;
  labels?: SharedWishFormLabels;
}) {
  const { formProps, pending, state } = useWishFormBinding();
  const nameId = useId();
  const textId = useId();
  const copy = {
    namePlaceholder: "Tên của bạn",
    textPlaceholder: "Lời chúc của bạn",
    success: "Cảm ơn lời chúc của bạn!",
    submit: "Gửi lời chúc",
    pending: "Đang gửi...",
    ...labels,
  };

  return (
    <form {...formProps} className="mx-auto mt-6 w-full max-w-full md:max-w-[600px]">
      <div className="flex flex-col gap-3">
        <label className="sr-only" htmlFor={nameId}>{labels?.nameLabel ?? copy.namePlaceholder}</label>
        <input id={nameId} name="name" required maxLength={120} className={cn("w-full rounded-[6px] border bg-white/90 px-4 py-2 text-[13px] text-[#17201b] outline-none placeholder:text-[#67726b]", centered && "text-center")} style={{ borderColor: hexToRgba(accent, 0.3) }} placeholder={copy.namePlaceholder} />
        <label className="sr-only" htmlFor={textId}>{labels?.textLabel ?? copy.textPlaceholder}</label>
        <textarea id={textId} name="text" rows={3} required maxLength={1000} className={cn("w-full rounded-[6px] border bg-white/90 px-4 py-2 text-[13px] text-[#17201b] outline-none placeholder:text-[#67726b]", centered && "text-center")} style={{ borderColor: hexToRgba(accent, 0.3) }} placeholder={copy.textPlaceholder} />
        {state?.error ? <p className="text-[12px]" style={{ color: "#c0392b" }}>{state.error}</p> : null}
        {state?.ok ? <p className="text-[12px]" style={{ color: accent }}>{copy.success}</p> : null}
        <div className={cn("mt-2 flex items-center", centered ? "justify-center" : "justify-end")}>
          <button type="submit" disabled={pending} className="rounded-full px-4 py-1.5 text-[11px] font-semibold uppercase disabled:opacity-60" style={{ backgroundColor: accent, color: "#fff" }}>{pending ? copy.pending : copy.submit}</button>
        </div>
      </div>
    </form>
  );
}

/**
 * Inline RSVP block bound to the live-forms provider. Templates that want the
 * confirmation form inside the invitation body (rather than the floating
 * dialog) render this next to `SharedWishForm`. Falls back to `null` when the
 * template is previewed outside a published page.
 */
export function SharedRsvpForm({
  accent,
  centered = false,
  className,
  heading,
}: {
  accent: string;
  centered?: boolean;
  className?: string;
  /** Rendered above the fields, inside the same null-check, so templates never
   * leave an orphan section heading when the form is hidden in preview. */
  heading?: ReactNode;
}) {
  const { isLive, formProps, pending, state, guest, questions, labels } = useRsvpFormBinding();
  const nameId = useId();
  const attendingId = useId();
  const guestsId = useId();
  const sideId = useId();
  const messageId = useId();

  if (!isLive || !labels) return null;

  const fieldClass = cn(
    "w-full rounded-[6px] border bg-white/90 px-4 py-2 text-[13px] text-[#17201b] outline-none placeholder:text-[#67726b]",
    centered && "text-center",
  );
  const fieldStyle = { borderColor: hexToRgba(accent, 0.3) };
  const labelClass = cn("text-[11px] font-semibold uppercase tracking-wide", centered && "text-center");

  return (
    <div className={cn("w-full", className)}>
      {heading}
      <form {...formProps} className="mx-auto mt-6 w-full max-w-full md:max-w-[600px]">
        <div className="flex flex-col gap-3">
          {guest ? <input type="hidden" name="guestId" value={guest.token} /> : null}

          <label className={labelClass} htmlFor={nameId} style={{ color: accent }}>{labels.name}</label>
          <input
            id={nameId}
            name="name"
            required
            maxLength={120}
            defaultValue={guest?.name ?? ""}
            className={fieldClass}
            style={fieldStyle}
            placeholder={labels.name}
          />

          <label className={labelClass} htmlFor={attendingId} style={{ color: accent }}>{labels.attending}</label>
          <select id={attendingId} name="attending" defaultValue="yes" className={fieldClass} style={fieldStyle}>
            <option value="yes">{labels.attendingYes}</option>
            <option value="no">{labels.attendingNo}</option>
          </select>

          <label className={labelClass} htmlFor={guestsId} style={{ color: accent }}>{labels.guestCount}</label>
          <input
            id={guestsId}
            name="guests"
            type="number"
            min={0}
            max={guest?.maxGuests && guest.maxGuests > 0 ? guest.maxGuests : 50}
            defaultValue={1}
            className={fieldClass}
            style={fieldStyle}
          />

          <label className={labelClass} htmlFor={sideId} style={{ color: accent }}>{labels.side}</label>
          <select id={sideId} name="side" defaultValue={guest?.side ?? ""} className={fieldClass} style={fieldStyle}>
            <option value="">{labels.sideEmpty}</option>
            <option value="Nhà trai">{labels.groomSide}</option>
            <option value="Nhà gái">{labels.brideSide}</option>
          </select>

          {questions.map((question) => (
            <RsvpCustomQuestion
              key={question.id}
              question={question}
              labels={labels}
              fieldClass={fieldClass}
              fieldStyle={fieldStyle}
              labelClass={labelClass}
              accent={accent}
            />
          ))}

          <label className={labelClass} htmlFor={messageId} style={{ color: accent }}>{labels.message}</label>
          <textarea
            id={messageId}
            name="message"
            rows={3}
            maxLength={1000}
            className={fieldClass}
            style={fieldStyle}
            placeholder={labels.message}
          />

          {state?.error ? <p className="text-[12px]" style={{ color: "#c0392b" }}>{state.error}</p> : null}
          {state?.ok ? <p className="text-[12px]" style={{ color: accent }}>{labels.success}</p> : null}
          <div className={cn("mt-2 flex items-center", centered ? "justify-center" : "justify-end")}>
            <button
              type="submit"
              disabled={pending}
              className="rounded-full px-4 py-1.5 text-[11px] font-semibold uppercase disabled:opacity-60"
              style={{ backgroundColor: accent, color: "#fff" }}
            >
              {pending ? labels.submitting : labels.submit}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

function RsvpCustomQuestion({
  question,
  labels,
  fieldClass,
  fieldStyle,
  labelClass,
  accent,
}: {
  question: PublicRsvpQuestion;
  labels: PublicRsvpLabels;
  fieldClass: string;
  fieldStyle: CSSProperties;
  labelClass: string;
  accent: string;
}) {
  const fieldId = useId();
  const name = `question:${question.id}`;

  return (
    <>
      <label className={labelClass} htmlFor={fieldId} style={{ color: accent }}>{question.label}</label>
      {question.type === "boolean" ? (
        <select id={fieldId} name={name} required={question.required} defaultValue="" className={fieldClass} style={fieldStyle}>
          <option value="">{labels.selectPlaceholder}</option>
          <option value="yes">{labels.answerYes}</option>
          <option value="no">{labels.answerNo}</option>
        </select>
      ) : question.type === "select" ? (
        <select id={fieldId} name={name} required={question.required} defaultValue="" className={fieldClass} style={fieldStyle}>
          <option value="">{labels.selectPlaceholder}</option>
          {question.options.map((option) => (
            <option key={option} value={option}>{option}</option>
          ))}
        </select>
      ) : (
        <input
          id={fieldId}
          name={name}
          required={question.required}
          maxLength={200}
          className={fieldClass}
          style={fieldStyle}
          placeholder={question.label}
        />
      )}
    </>
  );
}

/** Đếm ngược tới `target` (ISO "YYYY-MM-DDTHH:mm"). Màu do wrapper set qua className/style. */
export function SharedCountdown({
  target,
  className,
  labels,
  style,
}: {
  target: string;
  className?: string;
  labels?: { days?: string; hours?: string; minutes?: string; seconds?: string };
  style?: CSSProperties;
}) {
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
      {days} {labels?.days ?? "ngày"} {hours} {labels?.hours ?? "giờ"} {mins} {labels?.minutes ?? "phút"} {secs} {labels?.seconds ?? "giây"}
    </p>
  );
}

/** Slideshow ảnh cover: tự chạy 4s + mũi tên + dot. Bọc trong khung `relative`. */
export function SharedCarousel({ photos, className, arrowColor = "#fff" }: { photos: string[]; className?: string; arrowColor?: string }) {
  const [i, setI] = useState(0);
  const autoplayTimerRef = useRef<number | null>(null);
  const count = photos.length;

  const resetAutoplay = useCallback(function scheduleNextSlide() {
    if (autoplayTimerRef.current !== null) {
      window.clearTimeout(autoplayTimerRef.current);
      autoplayTimerRef.current = null;
    }
    if (count <= 1) return;

    autoplayTimerRef.current = window.setTimeout(() => {
      autoplayTimerRef.current = null;
      setI((value) => (value + 1) % count);
      scheduleNextSlide();
    }, 4000);
  }, [count]);

  useEffect(() => {
    resetAutoplay();
    return () => {
      if (autoplayTimerRef.current !== null) {
        window.clearTimeout(autoplayTimerRef.current);
        autoplayTimerRef.current = null;
      }
    };
  }, [resetAutoplay]);

  if (count === 0) return null;
  const step = (d: number) => {
    resetAutoplay();
    setI((value) => (value + d + count) % count);
  };
  const select = (index: number) => {
    resetAutoplay();
    setI(index);
  };

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
              <button key={src} type="button" aria-label={`Ảnh ${idx + 1}`} onClick={() => select(idx)} className="h-1.5 w-1.5 rounded-full transition" style={{ backgroundColor: idx === i ? "#fff" : "rgba(255,255,255,0.5)" }} />
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

/**
 * Copies a value (account number, address…) to the clipboard and flips its own
 * label to a confirmation for ~1.8s. Silently no-ops when the Clipboard API is
 * unavailable (insecure origin, old in-app browsers) instead of throwing.
 */
export function CopyValueButton({
  value,
  accent,
  label,
  copiedLabel,
  className,
  testId,
}: {
  value: string;
  accent: string;
  label: string;
  copiedLabel: string;
  className?: string;
  testId?: string;
}) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const timer = window.setTimeout(() => setCopied(false), 1800);
    return () => window.clearTimeout(timer);
  }, [copied]);

  const copy = async () => {
    if (!navigator.clipboard?.writeText) return;
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  };

  return (
    <button
      type="button"
      data-testid={testId}
      onClick={copy}
      aria-label={`${label}: ${value}`}
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide transition-opacity hover:opacity-80",
        className,
      )}
      style={{ borderColor: hexToRgba(accent, 0.35), color: accent }}
    >
      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        {copied ? <path d="M20 6 9 17l-5-5" /> : <><rect x="9" y="9" width="12" height="12" rx="2" /><path d="M5 15V5a2 2 0 0 1 2-2h10" /></>}
      </svg>
      {copied ? copiedLabel : label}
    </button>
  );
}

export function GiftQrGrid({
  banks,
  heading = "Hộp Quà Mừng",
  accent,
  radiusClass = "rounded-xl",
  saveQrLabel = "Lưu QR",
  copyNumberLabel = "Sao chép STK",
  numberCopiedLabel = "Đã sao chép",
  headingClassName,
}: {
  banks: GiftBank[];
  heading?: string;
  accent: string;
  radiusClass?: string;
  saveQrLabel?: string;
  copyNumberLabel?: string;
  numberCopiedLabel?: string;
  headingClassName?: string;
}) {
  if (banks.length === 0) return null;

  return (
    <div data-testid="gift-qr-grid" className="flex w-full flex-col items-center gap-6 text-center">
      <h2
        className={cn("text-[20px] font-bold uppercase tracking-wide md:text-[24px]", headingClassName)}
        style={{ color: accent }}
      >
        {heading}
      </h2>
      <div className="flex w-full flex-row flex-wrap items-start justify-center gap-4 sm:gap-8">
        {banks.map((gift) => {
          const qr = buildVietQrImageUrl({ bank: gift.bank, accountNumber: gift.num, accountName: gift.name });
          return (
            <div key={gift.label} className="flex max-w-[200px] flex-1 flex-col items-center">
              <h3 className="mb-2 flex min-h-8 items-start justify-center text-xs font-semibold" style={{ color: accent }}>{gift.label}</h3>
              <div className={cn("size-32 bg-white p-2 shadow-lg sm:size-40", radiusClass)}>
                <img src={qr} alt={`QR - ${gift.label}`} className="h-full w-full object-contain" />
              </div>
              <p className="mt-2 text-[13px] font-semibold" style={{ color: accent }}>{gift.bank}</p>
              <p className="font-mono text-[13px]" style={{ color: accent }}>{gift.num}</p>
              <p className="text-[13px]" style={{ color: accent }}>{gift.name}</p>
              <CopyValueButton
                testId="gift-copy-account"
                value={gift.num}
                accent={accent}
                label={copyNumberLabel}
                copiedLabel={numberCopiedLabel}
                className="mt-2"
              />
              <a href={`${qr}&download=1`} download className="mt-2 rounded-full border px-4 py-1.5 text-[11px] font-semibold uppercase" style={{ borderColor: accent, color: accent }}>{saveQrLabel}</a>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/**
 * Two-sided gift card: the front shows the couple's thank-you, the back the
 * bank details + QR. Click, Enter or Space flips it. `prefers-reduced-motion`
 * users get a cross-fade instead of the 3D rotation (see `.gift-flip-*` in
 * globals.css).
 */
export function GiftFlipCard({
  bank,
  accent,
  dark,
  faceClassName,
  frontTitle,
  frontHint,
  backHint,
  saveQrLabel = "Lưu QR",
  copyNumberLabel = "Sao chép STK",
  numberCopiedLabel = "Đã sao chép",
  className,
}: {
  bank: GiftBank;
  accent: string;
  dark: string;
  /** Surface class for both faces so the card inherits the template palette. */
  faceClassName?: string;
  frontTitle: string;
  frontHint: string;
  backHint: string;
  saveQrLabel?: string;
  copyNumberLabel?: string;
  numberCopiedLabel?: string;
  className?: string;
}) {
  const [flipped, setFlipped] = useState(false);
  const qr = buildVietQrImageUrl({ bank: bank.bank, accountNumber: bank.num, accountName: bank.name });

  return (
    <div className={cn("gift-flip-scene w-full max-w-[280px]", className)}>
      <div
        data-testid="gift-flip-card"
        data-flipped={flipped ? "true" : "false"}
        role="button"
        tabIndex={0}
        aria-pressed={flipped}
        aria-label={flipped ? backHint : frontHint}
        onClick={() => setFlipped((value) => !value)}
        onKeyDown={(event) => {
          if (event.key !== "Enter" && event.key !== " ") return;
          event.preventDefault();
          setFlipped((value) => !value);
        }}
        className="gift-flip-card relative h-[360px] w-full cursor-pointer outline-none"
      >
        <div
          className={cn("gift-flip-face absolute inset-0 flex flex-col items-center justify-center gap-4 rounded-[1.5rem] border p-6 text-center", faceClassName)}
          style={{ borderColor: hexToRgba(accent, 0.28) }}
        >
          <span className="flex h-16 w-16 items-center justify-center rounded-full text-2xl" style={{ backgroundColor: hexToRgba(accent, 0.12), color: accent }}>♡</span>
          <p className="text-[15px] font-semibold leading-6" style={{ color: dark }}>{frontTitle}</p>
          <p className="text-[11px] uppercase tracking-wide" style={{ color: hexToRgba(dark, 0.6) }}>{frontHint}</p>
        </div>

        <div
          className={cn("gift-flip-face gift-flip-face-back absolute inset-0 flex flex-col items-center justify-center gap-2 rounded-[1.5rem] border p-5 text-center", faceClassName)}
          style={{ borderColor: hexToRgba(accent, 0.28) }}
        >
          <div className="size-28 rounded-xl bg-white p-1.5 shadow-sm">
            <img src={qr} alt={`QR - ${bank.label}`} className="h-full w-full object-contain" />
          </div>
          <p className="text-[12px] font-semibold" style={{ color: dark }}>{bank.bank}</p>
          <p className="font-mono text-[12px]" style={{ color: dark }}>{bank.num}</p>
          <p className="text-[11px]" style={{ color: hexToRgba(dark, 0.7) }}>{bank.name}</p>
          <div className="mt-1 flex flex-wrap items-center justify-center gap-2" onClick={(event) => event.stopPropagation()}>
            <CopyValueButton value={bank.num} accent={accent} label={copyNumberLabel} copiedLabel={numberCopiedLabel} />
            <a href={`${qr}&download=1`} download className="inline-flex items-center rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide" style={{ borderColor: hexToRgba(accent, 0.35), color: accent }}>{saveQrLabel}</a>
          </div>
          <p className="mt-1 text-[10px] uppercase tracking-wide" style={{ color: hexToRgba(dark, 0.55) }}>{backHint}</p>
        </div>
      </div>
    </div>
  );
}

export type SharedWish = { name: string; time: string; text: string };

/**
 * Wish list capped at `initialCount` with a "show all" toggle. Templates own the
 * card markup through `renderWish` so each theme keeps its own surface, border
 * and radius; this component only owns the collapse behaviour.
 */
export function SharedWishList({
  wishes,
  renderWish,
  accent,
  initialCount = 4,
  showAllLabel = "Xem tất cả",
  collapseLabel = "Thu gọn",
  className,
  listClassName,
}: {
  wishes: SharedWish[];
  renderWish: (wish: SharedWish) => ReactNode;
  accent: string;
  initialCount?: number;
  showAllLabel?: string;
  collapseLabel?: string;
  className?: string;
  listClassName?: string;
}) {
  const [expanded, setExpanded] = useState(false);
  if (wishes.length === 0) return null;

  const hidden = wishes.length - initialCount;
  const visible = expanded ? wishes : wishes.slice(0, initialCount);

  return (
    <div className={className}>
      <div data-testid="wish-list" className={cn("grid gap-4", listClassName)}>
        {visible.map((wish) => (
          <div key={`${wish.name}-${wish.time}`}>{renderWish(wish)}</div>
        ))}
      </div>
      {hidden > 0 ? (
        <div className="mt-6 flex justify-center">
          <button
            type="button"
            data-testid="wish-list-toggle"
            onClick={() => setExpanded((value) => !value)}
            className="rounded-full border px-5 py-2 text-[11px] font-semibold uppercase tracking-wide transition-opacity hover:opacity-80"
            style={{ borderColor: hexToRgba(accent, 0.35), color: accent }}
          >
            {expanded ? collapseLabel : `${showAllLabel} (${wishes.length})`}
          </button>
        </div>
      ) : null}
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

/** Nút phong bì mừng cưới theo từng mẫu + modal QR chuyển khoản. */
export function GiftEnvelope({
  templateSlug,
  banks,
  accent,
  dark,
  cardBg,
  heading = "Phong Bao Mừng Cưới",
  labelColor,
  openLabel = "Nhấn để mở",
}: {
  templateSlug: string;
  banks: GiftBank[];
  accent: string;
  dark: string;
  cardBg: string;
  heading?: string;
  labelColor?: string;
  openLabel?: string;
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
  const visual = resolveGiftVisual(templateSlug);
  return (
    <div className="flex w-full flex-col items-center gap-4">
      <h2 className="text-center text-[20px] font-bold uppercase tracking-wide md:text-[24px]" style={{ color: dark }}>{heading}</h2>
      <button
        data-testid="gift-envelope"
        data-gift-visual-kind={visual.kind}
        data-gift-visual-slug={templateSlug}
        type="button"
        aria-label={openLabel}
        onClick={() => setOpen(true)}
        className={cn(
          "group relative cursor-pointer border-none bg-transparent outline-none",
          visual.kind === "giftbox" || visual.kind === "layered-image"
            ? "h-[300px] w-[280px]"
            : "h-64 w-[200px]",
        )}
      >
        {visual.kind === "layered-image" ? (
          <LayeredGiftArtwork visual={visual} />
        ) : visual.kind === "giftbox" ? (
          <GiftboxArtwork visual={visual} />
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
        <p className={`${visual.kind === "procedural" ? "nhat-binh-hint-text -bottom-2" : "igb-hint bottom-0"} absolute left-1/2 -translate-x-1/2 whitespace-nowrap text-xs font-medium`} style={{ color: muted }}>{openLabel}</p>
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

export function AlbumGallery({
  photos,
  layout = "grid",
  accent,
  gridAspect = "aspect-[3/4]",
  radiusClass = "rounded-xl",
}: {
  photos: string[];
  layout?: AlbumLayout;
  accent: string;
  gridAspect?: string;
  radiusClass?: string;
}) {
  const { lightbox, setLightbox } = useLightbox(photos.length);
  if (photos.length === 0) return null;

  const border = hexToRgba(accent, 0.3);
  const lightboxEl = <Lightbox gallery={photos} index={lightbox} setIndex={setLightbox} accent={accent} />;

  if (layout === "coverflow") {
    return (
      <div className="w-full">
        <CoverflowGallery photos={photos} accent={accent} onOpen={setLightbox} />
        {lightboxEl}
      </div>
    );
  }

  if (layout === "mosaic") {
    const shown = photos.slice(0, 6);
    const extra = Math.max(0, photos.length - shown.length);
    const spanFor = (i: number) => {
      if (i !== 0) return "col-span-1 row-span-1";
      // Six tiles fill a 3×3 desktop mosaic. On the two-column mobile grid,
      // keep all six square so no unmatched cell is left at the bottom.
      return shown.length === 6
        ? "col-span-1 row-span-1 md:col-span-2 md:row-span-2"
        : "col-span-2 row-span-2";
    };
    return (
      <div className="w-full max-w-[400px] md:max-w-[560px]">
        <div className="grid grid-cols-2 gap-3 [grid-auto-rows:1fr] md:grid-cols-3 md:gap-4">
          {shown.map((src, i) => (
            <button
              key={src}
              type="button"
              onClick={() => setLightbox(i)}
              className={cn(
                "group relative aspect-square cursor-pointer overflow-hidden border",
                radiusClass,
                spanFor(i),
              )}
              style={{ borderColor: border }}
            >
              <img alt={`Ảnh cưới ${i + 1}`} className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-[1.03]" src={src} />
              {i === shown.length - 1 && extra > 0 ? (
                <div className="absolute inset-0 flex items-center justify-center bg-black/55">
                  <span className="text-lg font-semibold text-white">+{extra}</span>
                </div>
              ) : null}
            </button>
          ))}
        </div>
        {lightboxEl}
      </div>
    );
  }

  const shown = photos.slice(0, 4);
  const extra = Math.max(0, photos.length - 4);
  return (
    <div className="grid w-full max-w-[400px] grid-cols-2 gap-3 md:max-w-[560px] md:gap-4">
      {shown.map((src, i) => (
        <button
          key={src}
          type="button"
          onClick={() => setLightbox(i)}
          className={cn(
            "group relative cursor-pointer overflow-hidden border",
            gridAspect,
            radiusClass,
          )}
          style={{ borderColor: border }}
        >
          <img alt={`Ảnh cưới ${i + 1}`} className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-[1.03]" src={src} />
          {i === shown.length - 1 && extra > 0 ? (
            <div className="absolute inset-0 flex items-center justify-center bg-black/55">
              <span className="text-lg font-semibold text-white">+{extra}</span>
            </div>
          ) : null}
        </button>
      ))}
      {lightboxEl}
    </div>
  );
}

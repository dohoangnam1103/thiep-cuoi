"use client";

import Lenis from "lenis";
import { Pause, Play } from "lucide-react";
import dynamic from "next/dynamic";
import { type ComponentType, type Dispatch, type MouseEvent, type SetStateAction, type TouchEvent, useEffect, useMemo, useRef, useState } from "react";

import type { ChungDoiTemplate } from "@/data/chungdoi";
import { chungdoiDemoContent, type ChungDoiDemoContent } from "@/data/chungdoi-demo-content";
import { chungdoiThemeConfig } from "@/data/chungdoi-theme-config";
import { LiveFormsProvider, useLiveForms, useWishFormBinding, type LiveForms } from "@/components/chungdoi-live-forms";
import { PublicRsvpDialog } from "@/components/public-rsvp-dialog";
import { PublicGuestMediaDialog } from "@/components/public-guest-media-dialog";
import { TARGET_PX } from "@/components/chungdoi-envelope-3d";
import { InvitationMap } from "@/components/chungdoi-tpl-shared";
import { isAuditedTemplateSlug, type AuditedTemplateSlug } from "@/lib/audited-template-renderers";

const BaroqueGoldInvitation = dynamic(() => import("@/components/chungdoi-tpl-baroque-gold").then((m) => m.BaroqueGoldInvitation));
const BohoFloralInvitation = dynamic(() => import("@/components/chungdoi-tpl-boho-floral-brown").then((m) => m.BohoFloralInvitation));
const BohoFloralGreenInvitation = dynamic(() => import("@/components/chungdoi-tpl-boho-floral-green").then((m) => m.BohoFloralGreenInvitation));
const BohoFloralPinkInvitation = dynamic(() => import("@/components/chungdoi-tpl-boho-floral-pink").then((m) => m.BohoFloralPinkInvitation));
const BrocadeFlowerRedInvitation = dynamic(() => import("@/components/chungdoi-tpl-brocade-flower-red").then((m) => m.BrocadeFlowerRedInvitation));
const ChateauGreenInvitation = dynamic(() => import("@/components/chungdoi-tpl-chateau-green").then((m) => m.ChateauGreenInvitation));
const CherryBlossomInvitation = dynamic(() => import("@/components/chungdoi-tpl-cherry-blossom-pink").then((m) => m.CherryBlossomInvitation));
const CrystalFloralInvitation = dynamic(() => import("@/components/chungdoi-tpl-crystal-floral-blue").then((m) => m.CrystalFloralInvitation));
const DragonPhoenixV2Invitation = dynamic(() => import("@/components/chungdoi-tpl-dragon-phoenix-v2-red").then((m) => m.DragonPhoenixV2Invitation));
const DragonPhoenixV3Invitation = dynamic(() => import("@/components/chungdoi-tpl-dragon-phoenix-v3-red").then((m) => m.DragonPhoenixV3Invitation));
const ElegantLeafInvitation = dynamic(() => import("@/components/chungdoi-tpl-elegant-leaf-green").then((m) => m.ElegantLeafInvitation));
const GlassGardenInvitation = dynamic(() => import("@/components/chungdoi-tpl-glass-garden-green").then((m) => m.GlassGardenInvitation));
const HoaTinhInvitation = dynamic(() => import("@/components/chungdoi-tpl-hoa-tinh-red").then((m) => m.HoaTinhInvitation));
const JasmineWhiteInvitation = dynamic(() => import("@/components/chungdoi-tpl-jasmine-white").then((m) => m.JasmineWhiteInvitation));
const MinimalismRedInvitation = dynamic(() => import("@/components/chungdoi-tpl-minimalism-red").then((m) => m.MinimalismRedInvitation));
const QasrGoldInvitation = dynamic(() => import("@/components/chungdoi-tpl-qasr-gold").then((m) => m.QasrGoldInvitation));
const QasrGreenInvitation = dynamic(() => import("@/components/chungdoi-tpl-qasr-green").then((m) => m.QasrGreenInvitation));
const ChibiRedInvitation = dynamic(() => import("@/components/chungdoi-tpl-chibi-red").then((m) => m.ChibiRedInvitation));
const SilkFloraBrownInvitation = dynamic(() => import("@/components/chungdoi-tpl-silk-flora-brown").then((m) => m.SilkFloraBrownInvitation));
const SpringGardenBlueInvitation = dynamic(() => import("@/components/chungdoi-tpl-spring-garden-blue").then((m) => m.SpringGardenBlueInvitation));
const SpringGardenGreenInvitation = dynamic(() => import("@/components/chungdoi-tpl-spring-garden-green").then((m) => m.SpringGardenGreenInvitation));
const SpringGardenRedInvitation = dynamic(() => import("@/components/chungdoi-tpl-spring-garden-red").then((m) => m.SpringGardenRedInvitation));
const PhoenixInvitation = dynamic(() => import("@/components/chungdoi-tpl-phoenix").then((m) => m.PhoenixInvitation));
const SongHyGreenInvitation = dynamic(() => import("@/components/chungdoi-tpl-song-hy").then((m) => m.SongHyGreenInvitation));
const SongHyRedInvitation = dynamic(() => import("@/components/chungdoi-tpl-song-hy").then((m) => m.SongHyRedInvitation));
const NhatBinhInvitation = dynamic(() => import("@/components/chungdoi-tpl-nhat-binh").then((m) => m.NhatBinhInvitation));
const CoBaInvitation = dynamic(() => import("@/components/chungdoi-tpl-co-ba").then((m) => m.CoBaInvitation));
const DragonPhoenixRedInvitation = dynamic(() => import("@/components/chungdoi-tpl-dragon-phoenix").then((m) => m.DragonPhoenixRedInvitation));
const DragonPhoenixGreenInvitation = dynamic(() => import("@/components/chungdoi-tpl-dragon-phoenix").then((m) => m.DragonPhoenixGreenInvitation));
const DragonPhoenixBlueInvitation = dynamic(() => import("@/components/chungdoi-tpl-dragon-phoenix").then((m) => m.DragonPhoenixBlueInvitation));
const DragonPhoenixBlackInvitation = dynamic(() => import("@/components/chungdoi-tpl-dragon-phoenix").then((m) => m.DragonPhoenixBlackInvitation));
const DoubleDragonRedInvitation = dynamic(() => import("@/components/chungdoi-tpl-double-dragon").then((m) => m.DoubleDragonRedInvitation));
const DoubleDragonBlueInvitation = dynamic(() => import("@/components/chungdoi-tpl-double-dragon").then((m) => m.DoubleDragonBlueInvitation));
const SongLongXanhInvitation = dynamic(() => import("@/components/chungdoi-tpl-song-long-xanh").then((m) => m.SongLongXanhInvitation));
const RoyalRedInvitation = dynamic(() => import("@/components/chungdoi-tpl-royal").then((m) => m.RoyalRedInvitation));
const RoyalBlueInvitation = dynamic(() => import("@/components/chungdoi-tpl-royal").then((m) => m.RoyalBlueInvitation));
const RoyalGreenInvitation = dynamic(() => import("@/components/chungdoi-tpl-royal").then((m) => m.RoyalGreenInvitation));
const ChateauBlueInvitation = dynamic(() => import("@/components/chungdoi-tpl-chateau-blue").then((m) => m.ChateauInvitation));

const AUDITED_TEMPLATE_RENDERERS = {
  "boho-floral-green": BohoFloralGreenInvitation,
  "boho-floral-pink": BohoFloralPinkInvitation,
  "boho-floral-brown": BohoFloralInvitation,
  "spring-garden-red": SpringGardenRedInvitation,
  "spring-garden-green": SpringGardenGreenInvitation,
  "spring-garden-blue": SpringGardenBlueInvitation,
  "elegant-leaf-green": ElegantLeafInvitation,
  "jasmine-white": JasmineWhiteInvitation,
  "silk-flora-brown": SilkFloraBrownInvitation,
  "hoa-tinh-red": HoaTinhInvitation,
  "minimalism-red": MinimalismRedInvitation,
  "brocade-flower-red": BrocadeFlowerRedInvitation,
  "crystal-floral-blue": CrystalFloralInvitation,
  "baroque-gold": BaroqueGoldInvitation,
  "glass-garden-green": GlassGardenInvitation,
  "chibi-red": ChibiRedInvitation,
  "cherry-blossom-pink": CherryBlossomInvitation,
} satisfies Record<AuditedTemplateSlug, ComponentType<{ content: ChungDoiDemoContent }>>;
const Envelope3D = dynamic(() => import("@/components/chungdoi-envelope-3d"), { ssr: false });

const VN_DAYS = ["Chủ Nhật", "Thứ Hai", "Thứ Ba", "Thứ Tư", "Thứ Năm", "Thứ Sáu", "Thứ Bảy"];
const WEEKDAY_LABELS = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];
const DEFAULT_MUSIC = "/chungdoi/music/perfect-ed-sheeran.mp3";

function hexToRgba(hex: string, alpha: number) {
  const clean = hex.replace("#", "");
  const value = clean.length === 3 ? clean.split("").map((c) => c + c).join("") : clean;
  const r = parseInt(value.slice(0, 2), 16);
  const g = parseInt(value.slice(2, 4), 16);
  const b = parseInt(value.slice(4, 6), 16);
  if ([r, g, b].some(Number.isNaN)) return `rgba(0,0,0,${alpha})`;
  return `rgba(${r},${g},${b},${alpha})`;
}

function parseISODate(iso: string) {
  const d = new Date(`${iso}T00:00:00`);
  return Number.isNaN(d.getTime()) ? null : d;
}

type FormattedDate = {
  weekday: string;
  day: string;
  month: string;
  monthNumber: number;
  dayNumber: number;
  yearNumber: number;
};

function formatDate(iso: string): FormattedDate | null {
  const d = parseISODate(iso);
  if (!d) return null;
  return {
    weekday: VN_DAYS[d.getDay()],
    day: String(d.getDate()).padStart(2, "0"),
    month: String(d.getMonth() + 1).padStart(2, "0"),
    monthNumber: d.getMonth() + 1,
    dayNumber: d.getDate(),
    yearNumber: d.getFullYear(),
  };
}

function buildCalendar(iso: string) {
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

function formatWishTime(raw: string) {
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return raw;
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(d.getHours())}:${pad(d.getMinutes())} ${pad(d.getDate())}/${d.getMonth() + 1}/${d.getFullYear()}`;
}

function useLightbox(count: number) {
  const [lightbox, setLightbox] = useState<number | null>(null);

  useEffect(() => {
    if (lightbox === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLightbox(null);
      else if (e.key === "ArrowLeft") setLightbox((v) => (v === null ? v : (v - 1 + count) % count));
      else if (e.key === "ArrowRight") setLightbox((v) => (v === null ? v : (v + 1) % count));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lightbox, count]);

  return { lightbox, setLightbox };
}

function Lightbox({
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
  const [drag, setDrag] = useState(0);
  const [animate, setAnimate] = useState(true);
  const startRef = useRef<{ x: number; y: number; dragging: boolean } | null>(null);

  if (index === null) return null;

  const step = (dir: number) => setIndex((v) => (v === null ? v : (v + dir + count) % count));

  const onTouchStart = (e: TouchEvent) => {
    const t = e.touches[0];
    if (!t) return;
    startRef.current = { x: t.clientX, y: t.clientY, dragging: false };
    setAnimate(false);
  };
  const onTouchMove = (e: TouchEvent) => {
    const s = startRef.current;
    const t = e.touches[0];
    if (!s || !t) return;
    const dx = t.clientX - s.x;
    const dy = t.clientY - s.y;
    if (!s.dragging && Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 8) s.dragging = true;
    if (s.dragging) setDrag(dx);
  };
  const onTouchEnd = () => {
    const s = startRef.current;
    startRef.current = null;
    const dx = drag;
    setAnimate(true);
    setDrag(0);
    if (!s || !s.dragging) return;
    const width = typeof window !== "undefined" ? window.innerWidth : 320;
    if (Math.abs(dx) > Math.min(80, width * 0.2)) step(dx < 0 ? 1 : -1);
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center overflow-hidden bg-black/90 touch-pan-y"
      onClick={() => setIndex(null)}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      <button type="button" aria-label="Đóng" onClick={(e) => { e.stopPropagation(); setIndex(null); }} className="absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center text-2xl text-white/90 transition-opacity hover:opacity-70">✕</button>
      <div className="absolute top-5 z-10 text-sm text-white/80">{index + 1} / {count}</div>
      <button type="button" aria-label="Ảnh trước" onClick={(e) => { e.stopPropagation(); step(-1); }} className="absolute left-3 top-1/2 z-10 flex h-12 w-12 -translate-y-1/2 items-center justify-center text-3xl text-white/90 transition-opacity hover:opacity-70 md:left-8">‹</button>
      <button type="button" aria-label="Ảnh sau" onClick={(e) => { e.stopPropagation(); step(1); }} className="absolute right-3 top-1/2 z-10 flex h-12 w-12 -translate-y-1/2 items-center justify-center text-3xl text-white/90 transition-opacity hover:opacity-70 md:right-8">›</button>

      <div
        className="flex h-full w-full"
        style={{
          transform: `translate3d(calc(${-index * 100}% + ${drag}px), 0, 0)`,
          transition: animate ? "transform 320ms cubic-bezier(0.22, 1, 0.36, 1)" : "none",
        }}
      >
        {gallery.map((src, i) => (
          <div key={src} className="flex h-full w-full shrink-0 items-center justify-center px-4">
            <img
              src={src}
              alt={`Wedding photo ${i + 1}`}
              draggable={false}
              onClick={(e) => e.stopPropagation()}
              className="max-h-[78vh] max-w-[92vw] select-none rounded-lg object-contain"
            />
          </div>
        ))}
      </div>

      <div className="absolute bottom-4 z-10 flex max-w-[92vw] gap-2 overflow-x-auto px-2" onClick={(e) => e.stopPropagation()}>
        {gallery.map((src, i) => (
          <button key={src} type="button" onClick={() => { setAnimate(true); setIndex(i); }} className="h-14 w-14 shrink-0 overflow-hidden rounded-md border-2 transition-opacity" style={{ borderColor: i === index ? accent : "transparent", opacity: i === index ? 1 : 0.6 }}>
            <img src={src} alt={`Thumbnail ${i + 1}`} draggable={false} className="h-full w-full object-cover" />
          </button>
        ))}
      </div>
    </div>
  );
}

function googleCalendarUrl(content: ChungDoiDemoContent) {
  const { groomShortName, brideShortName, date, time } = content.couple;
  const title = `Đám cưới ${groomShortName} & ${brideShortName}`;
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

/** Resolved visual tokens for one template (from the reverse-engineered config, with fallbacks). */
type Tokens = {
  background: string;
  cardBg: string;
  textPrimary: string;
  textSecondary: string;
  accent: string;
  dividerFrom: string;
  dividerTo: string;
  buttonBg: string;
  buttonText: string;
  guestBoxBg: string;
  guestBoxBorder: string;
  particleColors: string[];
  particleType: string;
  coupleFont: string | undefined;
  sealType: string | null;
  cardImages: { src: string; className: string; flyOnOpen: boolean }[];
};

function resolveTokens(content: ChungDoiDemoContent): Tokens {
  const cfg = chungdoiThemeConfig[content.slug];
  const fallbackAccent = content.theme.primaryColor || "#710001";
  const crawledFont = content.theme.fontFamily
    ? `"${content.theme.fontFamily}", "Fz Aghita", "Pattaya", cursive`
    : undefined;

  if (!cfg) {
    return {
      background: `linear-gradient(to bottom right, ${fallbackAccent}, ${fallbackAccent})`,
      cardBg: "rgba(255, 250, 244, 0.96)",
      textPrimary: fallbackAccent,
      textSecondary: hexToRgba(fallbackAccent, 0.8),
      accent: fallbackAccent,
      dividerFrom: "transparent",
      dividerTo: hexToRgba(fallbackAccent, 0.5),
      buttonBg: fallbackAccent,
      buttonText: "#FFF0E7",
      guestBoxBg: hexToRgba(fallbackAccent, 0.1),
      guestBoxBorder: hexToRgba(fallbackAccent, 0.25),
      particleColors: [fallbackAccent],
      particleType: "happiness",
      coupleFont: crawledFont,
      sealType: null,
      cardImages: [],
    };
  }

  const t = cfg.theme;
  return {
    background: t.background,
    cardBg: t.cardBg,
    textPrimary: t.textPrimary,
    textSecondary: t.textSecondary,
    accent: t.accent,
    dividerFrom: t.dividerFrom,
    dividerTo: t.dividerTo,
    buttonBg: t.buttonBg,
    buttonText: t.buttonText,
    guestBoxBg: t.guestBoxBg,
    guestBoxBorder: t.guestBoxBorder ?? hexToRgba(t.accent, 0.25),
    particleColors: t.particleColors.length ? t.particleColors : [t.accent],
    particleType: t.particleType,
    coupleFont: cfg.fonts.couple ?? crawledFont,
    sealType: cfg.sealType,
    cardImages: cfg.decorations.cardImages,
  };
}

const RISING_TYPES = new Set(["happiness"]);

function ParticleGlyph({ type, color }: { type: string; color: string }) {
  if (type === "happiness") {
    return <span style={{ color }}>囍</span>;
  }
  if (type === "hearts") {
    return <span style={{ color }}>♥</span>;
  }
  if (type === "confetti") {
    return <span className="inline-block size-2 rounded-[1px]" style={{ backgroundColor: color }} />;
  }
  if (type === "leaves") {
    return (
      <svg viewBox="0 0 24 24" width="1em" height="1em" fill={color} aria-hidden="true">
        <path d="M12 2C7 6 4 10 4 15a8 8 0 0016 0c0-5-3-9-8-13z" />
      </svg>
    );
  }
  // flowers / petals / default → 6-petal blossom
  return (
    <svg viewBox="0 0 24 24" width="1em" height="1em" fill={color} aria-hidden="true">
      <g>
        <ellipse cx="12" cy="5" rx="2.2" ry="4.5" />
        <ellipse cx="12" cy="5" rx="2.2" ry="4.5" transform="rotate(60 12 12)" />
        <ellipse cx="12" cy="5" rx="2.2" ry="4.5" transform="rotate(120 12 12)" />
        <ellipse cx="12" cy="5" rx="2.2" ry="4.5" transform="rotate(180 12 12)" />
        <ellipse cx="12" cy="5" rx="2.2" ry="4.5" transform="rotate(240 12 12)" />
        <ellipse cx="12" cy="5" rx="2.2" ry="4.5" transform="rotate(300 12 12)" />
      </g>
      <circle cx="12" cy="12" r="1.8" fillOpacity="0.45" />
    </svg>
  );
}

function ParticleField({ tokens }: { tokens: Tokens }) {
  const rising = RISING_TYPES.has(tokens.particleType);
  const items = Array.from({ length: 12 });
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" style={{ zIndex: 1 }}>
      {items.map((_, i) => {
        const color = tokens.particleColors[i % tokens.particleColors.length];
        const pos = rising
          ? { bottom: "-40px", top: "auto" as const }
          : { top: "-40px", bottom: "auto" as const };
        return (
          <span
            key={i}
            className={`demo-ambient-symbol absolute ${rising ? "" : "demo-ambient-fall"}`}
            style={
              {
                ...pos,
                left: `${(i * 41 + 7) % 100}%`,
                fontSize: `${14 + (i % 5) * 3}px`,
                animationDelay: `${(i % 6) * 0.5}s`,
                animationDuration: `${9 + (i % 5)}s`,
                "--sway": `${((i * 23) % 50) - 25}px`,
              } as React.CSSProperties & Record<string, string>
            }
          >
            <ParticleGlyph type={tokens.particleType} color={color} />
          </span>
        );
      })}
    </div>
  );
}

function Seal({ tokens, opening }: { tokens: Tokens; opening: boolean }) {
  return (
    <>
      {opening ? (
        <span
          className="pointer-events-none absolute left-1/2 top-[50px] z-20 size-14 rounded-full"
          style={{
            transform: "translate(-50%, -50%)",
            border: `2px solid ${tokens.accent}`,
            animation: "demo-seal-ring 0.6s ease-out forwards",
          }}
        />
      ) : null}
      <div
        className="absolute left-1/2 top-[50px] z-30 flex size-14 items-center justify-center rounded-full"
        style={{
          transform: "translate(-50%, -50%)",
          background: `radial-gradient(circle at 30% 30%, ${tokens.accent}, ${hexToRgba(tokens.accent, 0.85)})`,
          boxShadow: `0 4px 20px ${hexToRgba(tokens.accent, 0.5)}, inset 0 2px 4px rgba(255,255,255,0.3)`,
          animation: opening
            ? "demo-seal-break 0.5s ease-in forwards"
            : "demo-seal-pulse 2s ease-in-out infinite",
        }}
      >
        {tokens.sealType === "heart" ? (
          <svg
            viewBox="0 0 24 24"
            className="size-5"
            aria-hidden="true"
            style={{ color: tokens.buttonText }}
          >
            <path
              fill="currentColor"
              d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
            />
          </svg>
        ) : (
          <span className="text-xl leading-none" style={{ color: tokens.buttonText }}>
            囍
          </span>
        )}
      </div>
    </>
  );
}

function BurstParticles({ tokens }: { tokens: Tokens }) {
  const items = Array.from({ length: 14 });
  return (
    <div
      className="pointer-events-none absolute left-1/2 top-[50px] z-40"
      style={{ transform: "translate(-50%, -50%)" }}
    >
      {items.map((_, i) => {
        const angle = (i / items.length) * Math.PI * 2;
        const dist = 70 + (i % 4) * 26;
        const dx = Math.cos(angle) * dist;
        const dy = Math.sin(angle) * dist;
        const color = tokens.particleColors[i % tokens.particleColors.length];
        return (
          <span
            key={i}
            className="absolute left-0 top-0 block size-2 rounded-full"
            style={
              {
                backgroundColor: color,
                "--dx": `${dx}px`,
                "--dy": `${dy}px`,
                "--rot-start": `${(i * 37) % 60}deg`,
                "--rot-end": `${180 + ((i * 53) % 180)}deg`,
                animation: `demo-particle-burst 1.4s ease-out ${i * 12}ms forwards`,
              } as React.CSSProperties & Record<string, string>
            }
          />
        );
      })}
    </div>
  );
}

/** Chỉ phần thẻ thiệp (không có overlay/particle) — dùng chung cho cover 2D và node chụp texture 3D. */
function CoverCard({
  content,
  tokens,
  onOpen,
  opening = false,
}: {
  content: ChungDoiDemoContent;
  tokens: Tokens;
  onOpen: () => void;
  opening?: boolean;
}) {
  const liveForms = useLiveForms();
  const date = formatDate(content.couple.date);
  const names = content.couple.brideFirst
    ? [content.couple.brideShortName, content.couple.groomShortName]
    : [content.couple.groomShortName, content.couple.brideShortName];
  const nameStyle = tokens.coupleFont ? { fontFamily: tokens.coupleFont } : undefined;

  return (
    <div
      className="relative rounded-lg"
      style={{ aspectRatio: "3 / 4.5", boxShadow: "0 25px 60px -12px rgba(0,0,0,0.45), 0 8px 24px rgba(0,0,0,0.2)" }}
    >
      {/* composited theme layer + corner decorations (behind the text) */}
      <div
        className="absolute inset-0 overflow-hidden rounded-lg"
        style={{ background: coverCardBackground(tokens), border: `1px solid ${tokens.guestBoxBorder}` }}
      >
        {tokens.cardImages.map((img, i) => (
          <img
            key={i}
            src={img.src}
            alt=""
            aria-hidden="true"
            className={`pointer-events-none absolute ${img.className}`}
            style={img.flyOnOpen && opening ? { opacity: 0 } : undefined}
          />
        ))}
      </div>

      {/* fly-out layer (không clip): bản gốc phía trên ẩn đi, bản này phóng to bay ra */}
      {opening ? (
        <div className="pointer-events-none absolute inset-0 z-20">
          {tokens.cardImages
            .filter((img) => img.flyOnOpen)
            .map((img, i) => (
              <div key={i} className={`pointer-events-none absolute ${img.className}`}>
                <img
                  src={img.src}
                  alt=""
                  aria-hidden="true"
                  className="block h-auto w-full"
                  style={{ animation: "demo-dragon-fly 1.2s ease-in forwards" }}
                />
              </div>
            ))}
        </div>
      ) : null}

      {/* transparent text layer on top: absolute + flex center → không đẩy chiều
          cao, cha giữ đúng aspectRatio 3:4.5 (portrait), 2D và texture 3D khớp. */}
      <div className="absolute inset-0 z-10 flex flex-col items-center justify-center px-6 text-center">
        <div className="mb-2 flex flex-col items-center text-3xl leading-tight sm:text-4xl" style={{ color: tokens.textPrimary }}>
          <span className="block w-full" style={nameStyle}>
            {names[0]}
          </span>
          <span className="my-1 block w-full text-lg leading-none sm:text-xl" style={nameStyle}>
            &amp;
          </span>
          <span className="block w-full" style={nameStyle}>
            {names[1]}
          </span>
        </div>

        <div className="mb-3 flex items-center justify-center gap-3">
          <span className="h-px w-10" style={{ background: `linear-gradient(to right, ${tokens.dividerFrom}, ${tokens.accent})` }} />
          <span className="text-sm" style={{ color: tokens.accent, opacity: 0.7 }}>
            ❦
          </span>
          <span className="h-px w-10" style={{ background: `linear-gradient(to left, ${tokens.dividerFrom}, ${tokens.accent})` }} />
        </div>

        {date ? (
          <p className="mb-5 text-[18px]" style={{ color: tokens.textSecondary }}>
            {date.dayNumber} tháng {date.monthNumber}, {date.yearNumber}
          </p>
        ) : null}

        <div className="mb-6">
          <p className="mb-2 text-[16px] font-light" style={{ color: tokens.textSecondary }}>
            Thân Mời
          </p>
          <div className="mb-2 inline-block rounded-xl px-5 py-2.5" style={{ backgroundColor: tokens.guestBoxBg }}>
            <span className="block text-lg font-semibold sm:text-xl" style={{ color: tokens.textPrimary }}>
              {liveForms?.recipientLabel ?? "Quý khách"}
            </span>
          </div>
          <p className="mx-auto max-w-xs text-[15px] font-light" style={{ color: tokens.textSecondary }}>
            đến dự buổi tiệc chung vui cùng gia đình
          </p>
        </div>

        <button
          type="button"
          data-open-btn
          onClick={onOpen}
          className="demo-shine relative mx-auto inline-flex items-center justify-center overflow-hidden rounded-full px-8 py-2.5 text-lg font-semibold shadow-lg transition hover:-translate-y-0.5"
          style={{ backgroundColor: tokens.buttonBg, color: tokens.buttonText }}
        >
          Mở thiệp
        </button>
      </div>
    </div>
  );
}

/** Màu three.js không nhận rgba()/gradient — ép về hex an toàn với fallback. */
function toSolidColor(value: string, fallback: string) {
  if (value.startsWith("#")) return value;
  // cardBg thường là linear-gradient(...) → rút hex đầu tiên làm màu đặc.
  const hex = value.match(/#[0-9a-fA-F]{3,8}/);
  return hex ? hex[0] : fallback;
}

type RgbaColor = { r: number; g: number; b: number; a: number };

function parseCssColor(value: string): RgbaColor | null {
  const normalized = value.trim();
  const hex = normalized.match(/^#([0-9a-fA-F]{3,8})$/);
  if (hex) {
    const raw = hex[1];
    const expanded = raw.length === 3 || raw.length === 4
      ? raw.split("").map((part) => part + part).join("")
      : raw;
    if (expanded.length !== 6 && expanded.length !== 8) return null;
    return {
      r: Number.parseInt(expanded.slice(0, 2), 16),
      g: Number.parseInt(expanded.slice(2, 4), 16),
      b: Number.parseInt(expanded.slice(4, 6), 16),
      a: expanded.length === 8 ? Number.parseInt(expanded.slice(6, 8), 16) / 255 : 1,
    };
  }

  const rgb = normalized.match(
    /^rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)(?:\s*,\s*([\d.]+))?\s*\)$/i,
  );
  if (!rgb) return null;
  return {
    r: Number(rgb[1]),
    g: Number(rgb[2]),
    b: Number(rgb[3]),
    a: rgb[4] === undefined ? 1 : Number(rgb[4]),
  };
}

function representativeColor(value: string): RgbaColor | null {
  const matches = value.match(/#[0-9a-fA-F]{3,8}|rgba?\([^)]*\)/gi) ?? [];
  const colors = matches.map(parseCssColor).filter((color): color is RgbaColor => color !== null);
  return colors[Math.floor(colors.length / 2)] ?? null;
}

function compositeColor(foreground: RgbaColor, background: RgbaColor): RgbaColor {
  const alpha = Math.min(1, Math.max(0, foreground.a));
  return {
    r: foreground.r * alpha + background.r * (1 - alpha),
    g: foreground.g * alpha + background.g * (1 - alpha),
    b: foreground.b * alpha + background.b * (1 - alpha),
    a: 1,
  };
}

function colorToHex(color: RgbaColor) {
  const channel = (value: number) => Math.round(Math.min(255, Math.max(0, value))).toString(16).padStart(2, "0");
  return `#${channel(color.r)}${channel(color.g)}${channel(color.b)}`;
}

/**
 * Card nền rgba trước đây phụ thuộc vào nền phía sau: DOM 2D pha trên nền theme,
 * còn node chụp texture 3D pha trên fallback màu kem. Ghép hai lớp ngay trong
 * card để cả hai đường render luôn nhận đúng cùng một kết quả.
 */
function coverCardBackground(tokens: Tokens) {
  const cardBg = tokens.cardBg.trim();
  if (!/^rgba?\(/i.test(cardBg)) return cardBg;
  return `linear-gradient(${cardBg}, ${cardBg}), ${tokens.background}`;
}

/** Màu đại diện cho cạnh/lưng WebGL, sau khi đã pha cardBg lên nền theme. */
function coverPaperColor(tokens: Tokens) {
  const fallback: RgbaColor = { r: 255, g: 240, b: 231, a: 1 };
  const background = representativeColor(tokens.background) ?? fallback;
  const opaqueBackground = background.a < 1 ? compositeColor(background, fallback) : background;
  const card = representativeColor(tokens.cardBg) ?? fallback;
  return colorToHex(compositeColor(card, opaqueBackground));
}

/** Cover phong bì 3D: render CoverCard DOM thật áp phẳng lên mặt phong bì R3F qua drei <Html transform>. */
function EnvelopeCover({
  content,
  tokens,
  onOpen,
  opening,
}: {
  content: ChungDoiDemoContent;
  tokens: Tokens;
  onOpen: () => void;
  opening: boolean;
}) {
  // Lúc mở: 3D face là texture tĩnh, không diễn được fly-phượng/bay-away. Swap
  // sang DOM phẳng để chạy animation mở. Dùng cùng TARGET_PX như card 3D —
  // KHÔNG dùng CoverOverlay chung (md:max-w-560px) vì nó nở gần-vuông → card
  // giật từ dọc sang vuông ngay lúc bấm mở.
  if (opening) {
    // Box 3D scale để chiếu ra đúng TARGET_PX (xem chungdoi-envelope-3d). DOM lúc
    // mở dùng CÙNG TARGET_PX → swap 3D→DOM không đổi cỡ, hết giật.
    return (
      <div
        className="fixed inset-0 z-[90] flex items-center justify-center overflow-hidden p-4"
        style={{ background: tokens.background, animation: "demo-cover-out 0.8s ease-in forwards" }}
      >
        <ParticleField tokens={tokens} />
        <BurstParticles tokens={tokens} />
        <div
          className="relative z-10 w-full"
          style={{ maxWidth: TARGET_PX, animation: "demo-envelope-away 0.8s ease-in forwards" }}
        >
          <Seal tokens={tokens} opening={opening} />
          <CoverCard content={content} tokens={tokens} onOpen={onOpen} opening={opening} />
        </div>
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center overflow-hidden p-4"
      style={{ background: tokens.background }}
    >
      <button
        type="button"
        data-open-invitation-control
        onClick={onOpen}
        className="sr-only focus:fixed focus:bottom-6 focus:left-1/2 focus:z-[100] focus:block focus:h-auto focus:w-auto focus:-translate-x-1/2 focus:overflow-visible focus:rounded-full focus:bg-white focus:px-5 focus:py-3 focus:text-sm focus:font-semibold focus:text-neutral-900 focus:shadow-xl focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:ring-offset-2"
      >
        Mở thiệp
      </button>
      <ParticleField tokens={tokens} />

      <div className="relative z-10 h-full w-full">
        <Envelope3D
          onOpen={onOpen}
          paperColor={coverPaperColor(tokens)}
          accentColor={toSolidColor(tokens.accent, "#8C1C13")}
          renderCard={(handleOpen) => (
            <div className="relative">
              <Seal tokens={tokens} opening={opening} />
              <CoverCard content={content} tokens={tokens} onOpen={handleOpen} opening={opening} />
            </div>
          )}
        />
        <p
          className="pointer-events-none absolute inset-x-0 bottom-6 text-center text-sm"
          style={{ color: tokens.accent }}
        >
          Kéo để xoay · Chụm 2 ngón để zoom
        </p>
      </div>
    </div>
  );
}

function SectionHeading({ children, tokens }: { children: React.ReactNode; tokens: Tokens }) {
  return (
    <h2
      className="text-center text-2xl font-bold uppercase"
      style={{ fontFamily: '"Times New Roman", serif', color: tokens.accent, letterSpacing: "1.2px" }}
    >
      {children}
    </h2>
  );
}

function FamilyBlock({
  title,
  father,
  mother,
  address,
  tokens,
}: {
  title: string;
  father: string;
  mother: string;
  address: string;
  tokens: Tokens;
}) {
  return (
    <div className="text-center" style={{ color: tokens.textPrimary }}>
      <p className="text-sm font-semibold uppercase tracking-wide">{title}</p>
      <p className="mt-2 text-lg font-semibold">{father}</p>
      <p className="text-lg font-semibold">{mother}</p>
      {address ? <p className="mt-2 text-sm leading-6 opacity-90">{address}</p> : null}
    </div>
  );
}

function GenericWishForm({ tokens }: { tokens: Tokens }) {
  const { formProps, pending, state } = useWishFormBinding();

  return (
    <form {...formProps} className="mt-6 space-y-3">
      <input name="name" required maxLength={120} className="w-full rounded-xl border bg-white/70 px-4 py-3 text-sm outline-none" style={{ borderColor: tokens.dividerTo, color: tokens.textPrimary }} placeholder="Nhập tên của bạn*" />
      <textarea name="text" rows={3} required maxLength={1000} className="w-full rounded-xl border bg-white/70 px-4 py-3 text-sm outline-none" style={{ borderColor: tokens.dividerTo, color: tokens.textPrimary }} placeholder="Nhập lời chúc của bạn*" />
      {state?.error ? <p className="text-sm text-red-600">{state.error}</p> : null}
      {state?.ok ? <p className="text-sm" style={{ color: tokens.accent }}>Cảm ơn lời chúc của bạn!</p> : null}
      <button type="submit" disabled={pending} className="w-full rounded-full py-3 text-sm font-bold uppercase tracking-widest transition hover:-translate-y-0.5 disabled:opacity-60" style={{ backgroundColor: tokens.buttonBg, color: tokens.buttonText }}>{pending ? "Đang gửi..." : "Gửi lời chúc"}</button>
    </form>
  );
}

function InvitationBody({ content, tokens }: { content: ChungDoiDemoContent; tokens: Tokens }) {
  const { couple, families, venue, schedule, gallery, wishes, bank } = content;
  const ceremony = formatDate(couple.ceremonyDate || couple.date);
  const reception = formatDate(couple.date);
  const calendar = buildCalendar(couple.date);
  const nameStyle = tokens.coupleFont ? { fontFamily: tokens.coupleFont } : undefined;

  const brideBlock = (
    <FamilyBlock title={families.brideParentTitle || "Ông Bà"} father={families.brideFather} mother={families.brideMother} address={families.brideAddress} tokens={tokens} />
  );
  const groomBlock = (
    <FamilyBlock title={families.groomParentTitle || "Ông Bà"} father={families.groomFather} mother={families.groomMother} address={families.groomAddress} tokens={tokens} />
  );

  const hasBank = Boolean(bank.brideBankName || bank.groomBankName);
  const galleryPreview = gallery.slice(0, 4);
  const extraCount = Math.max(0, gallery.length - 4);
  const mapQuery = venue.mapAddress || venue.address.replace(/\n+/g, ", ").trim();
  const { lightbox, setLightbox } = useLightbox(gallery.length);

  return (
    <div className="relative mx-auto w-full max-w-[440px] px-5 pb-16 pt-10" style={{ color: tokens.textPrimary }}>
      <section className="reveal is-visible relative">
        <SectionHeading tokens={tokens}>Thông Tin Lễ Cưới</SectionHeading>

        <div className="mt-8 grid grid-cols-2 gap-6">
          {couple.brideFirst ? (<>{brideBlock}{groomBlock}</>) : (<>{groomBlock}{brideBlock}</>)}
        </div>

        <div className="mt-10 text-center">
          <span className="block text-4xl leading-[1.15]" style={{ ...nameStyle, color: tokens.textPrimary }}>
            {couple.brideFirst ? couple.brideFullName : couple.groomFullName}
          </span>
          <p className="my-2 text-2xl">&amp;</p>
          <span className="block text-4xl leading-[1.15]" style={{ ...nameStyle, color: tokens.textPrimary }}>
            {couple.brideFirst ? couple.groomFullName : couple.brideFullName}
          </span>
        </div>

        {ceremony ? (
          <div className="mt-10 text-center">
            {couple.ceremonyHeader ? (
              <p className="whitespace-pre-line text-sm font-semibold uppercase tracking-wide">{couple.ceremonyHeader}</p>
            ) : null}
            {couple.ceremonyTime ? <p className="mt-2 text-sm">Vào lúc {couple.ceremonyTime}</p> : null}
            <div className="mt-4 flex items-center justify-center gap-3 text-sm font-semibold uppercase">
              <span>{ceremony.weekday}</span>
              <span>|</span>
              <span className="text-3xl font-bold">{ceremony.day}</span>
              <span>|</span>
              <span>Tháng {ceremony.month}</span>
            </div>
            <p className="mt-2 text-2xl font-bold">{ceremony.yearNumber}</p>
          </div>
        ) : null}
      </section>

      {galleryPreview.length > 0 ? (
        <section className="reveal is-visible mt-16">
          <SectionHeading tokens={tokens}>Album Ảnh Cưới</SectionHeading>
          <div className="mt-6 grid grid-cols-2 gap-3">
            {galleryPreview.map((src, index) => {
              const isLast = index === galleryPreview.length - 1;
              return (
                <button key={src} type="button" onClick={() => setLightbox(index)} className="relative cursor-pointer overflow-hidden rounded-lg">
                  <img src={src} alt={`Ảnh cưới ${index + 1}`} className="aspect-[3/4] w-full object-cover" />
                  {isLast && extraCount > 0 ? (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/45 text-2xl font-bold text-white">+{extraCount}</div>
                  ) : null}
                </button>
              );
            })}
          </div>
        </section>
      ) : null}

      <Lightbox gallery={gallery} index={lightbox} setIndex={setLightbox} accent={tokens.accent} />

      {reception ? (
        <section className="reveal is-visible mt-16 text-center">
          <h3 className="text-lg font-semibold" style={{ fontFamily: '"Times New Roman", serif' }}>Tiệc cưới sẽ diễn ra vào lúc:</h3>
          <p className="mt-3 text-4xl font-bold">{venue.banquetTime || couple.time}</p>
          <div className="mt-3 flex items-center justify-center gap-2 text-sm font-semibold uppercase">
            <span>{reception.weekday}</span><span>/</span><span>{reception.day}</span><span>/</span><span>Tháng {reception.month}</span>
          </div>

          {calendar ? (
            <div className="mx-auto mt-8 max-w-[320px] rounded-2xl border p-4" style={{ borderColor: tokens.guestBoxBorder }}>
              <p className="text-sm font-semibold uppercase tracking-wide">Tháng {calendar.month} / {calendar.year}</p>
              <div className="mt-3 grid grid-cols-7 gap-1 text-xs font-semibold">
                {WEEKDAY_LABELS.map((day) => (<span key={day} className="py-1">{day}</span>))}
              </div>
              <div className="mt-1 grid grid-cols-7 gap-1 text-sm">
                {calendar.cells.map((day, index) => (
                  <span
                    key={index}
                    className={`flex aspect-square items-center justify-center rounded-full ${day === calendar.highlight ? "font-bold" : ""}`}
                    style={day === calendar.highlight ? { backgroundColor: tokens.accent, color: tokens.buttonText } : undefined}
                  >
                    {day ?? ""}
                  </span>
                ))}
              </div>
            </div>
          ) : null}

          <a
            href={googleCalendarUrl(content)}
            target="_blank"
            rel="noreferrer"
            className="mt-6 inline-flex items-center justify-center rounded-full border px-6 py-2 text-sm font-semibold transition"
            style={{ borderColor: tokens.accent, color: tokens.accent }}
          >
            Thêm vào lịch
          </a>

          <div className="mt-6">
            <button type="button" className="inline-flex items-center justify-center rounded-full px-10 py-3 text-sm font-bold uppercase tracking-widest shadow-md transition hover:-translate-y-1" style={{ backgroundColor: tokens.buttonBg, color: tokens.buttonText }}>
              Xác Nhận
            </button>
          </div>
        </section>
      ) : null}

      {mapQuery ? (
        <section className="reveal is-visible mt-16 text-center">
          <h3 className="text-lg font-semibold" style={{ fontFamily: '"Times New Roman", serif' }}>Tiệc cưới sẽ tổ chức tại</h3>
          <p className="mx-auto mt-3 max-w-xs whitespace-pre-line text-sm leading-6">{venue.address}</p>
          <div className="mt-5 overflow-hidden rounded-2xl border" style={{ borderColor: tokens.guestBoxBorder }}>
            <InvitationMap query={mapQuery} title={mapQuery} className="h-64 w-full" loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
          </div>
        </section>
      ) : null}

      {schedule.length > 0 ? (
        <section className="reveal is-visible mt-16">
          <SectionHeading tokens={tokens}>Lịch Trình Ngày Cưới</SectionHeading>
          <ul className="mx-auto mt-8 max-w-sm">
            {schedule.map((item, index) => (
              <li key={`${item.time}-${index}`} className="relative flex gap-5 pb-8 pl-4 last:pb-0">
                <div className="flex flex-col items-center">
                  <span className="z-10 flex size-3 rounded-full" style={{ backgroundColor: tokens.accent }} />
                  {index < schedule.length - 1 ? (<span className="absolute top-3 h-full w-px" style={{ backgroundColor: tokens.dividerTo }} />) : null}
                </div>
                <div className="-mt-1">
                  <p className="text-xl font-bold">{item.time}</p>
                  <p className="mt-1 text-sm">{item.label}</p>
                </div>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="reveal is-visible mt-16">
        <h2 className="text-center font-pattaya text-3xl" style={{ color: tokens.accent }}>Sổ lưu bút</h2>
        <GenericWishForm tokens={tokens} />
        {wishes.length > 0 ? (
          <div className="mt-8 space-y-4">
            {wishes.map((wish, index) => (
              <div key={`${wish.name}-${index}`} className="rounded-2xl border p-4" style={{ borderColor: tokens.guestBoxBorder, backgroundColor: tokens.guestBoxBg }}>
                <div className="flex items-baseline justify-between gap-3">
                  <span className="font-semibold">{wish.name}</span>
                  <span className="text-xs opacity-70">{formatWishTime(wish.time)}</span>
                </div>
                <p className="mt-2 text-sm leading-6">{wish.text}</p>
              </div>
            ))}
          </div>
        ) : null}
      </section>

      {hasBank ? (
        <section className="reveal is-visible mt-16">
          <SectionHeading tokens={tokens}>Mừng Cưới</SectionHeading>
          <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2">
            {bank.brideBankName ? (
              <div className="flex flex-col items-center rounded-2xl border p-5 text-center" style={{ borderColor: tokens.guestBoxBorder, backgroundColor: tokens.guestBoxBg }}>
                <h3 className="text-base font-semibold">Cô Dâu - {bank.brideAccountName}</h3>
                <p className="mt-3 text-sm font-semibold">{bank.brideBankName}</p>
                <p className="text-sm">{bank.brideAccountNumber}</p>
                <p className="text-sm">{bank.brideAccountName}</p>
              </div>
            ) : null}
            {bank.groomBankName ? (
              <div className="flex flex-col items-center rounded-2xl border p-5 text-center" style={{ borderColor: tokens.guestBoxBorder, backgroundColor: tokens.guestBoxBg }}>
                <h3 className="text-base font-semibold">Chú Rể - {bank.groomAccountName}</h3>
                <p className="mt-3 text-sm font-semibold">{bank.groomBankName}</p>
                <p className="text-sm">{bank.groomAccountNumber}</p>
                <p className="text-sm">{bank.groomAccountName}</p>
              </div>
            ) : null}
          </div>
        </section>
      ) : null}

      <section className="reveal is-visible mt-16 text-center">
        <p className="text-sm leading-7">Sự hiện diện của quý khách là niềm vinh hạnh của gia đình chúng tôi!</p>
        <a href="https://thiepmungonline.com" target="_blank" rel="noreferrer" className="mt-6 inline-flex items-center gap-1 text-sm font-semibold" style={{ color: tokens.accent }}>♡ thiepmungonline.com</a>
      </section>
    </div>
  );
}

export function ChungDoiDemo({
  template,
  content: contentProp,
  liveForms = null,
  captureMode = false,
}: {
  template: ChungDoiTemplate;
  content?: ChungDoiDemoContent;
  liveForms?: LiveForms;
  captureMode?: boolean;
}) {
  const content = contentProp ?? chungdoiDemoContent[template.slug];

  const [opened, setOpened] = useState(captureMode);
  const [opening, setOpening] = useState(false);
  const [playing, setPlaying] = useState(false);
  const openTimerRef = useRef<number | null>(null);
  const autoScrollTimerRef = useRef<number | null>(null);
  const autoScrollFinishedRef = useRef(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const lenisRef = useRef<Lenis | null>(null);
  const [autoScrolling, setAutoScrolling] = useState(false);
  const autoScrollingRef = useRef(false);

  useEffect(() => {
    autoScrollingRef.current = autoScrolling;
  }, [autoScrolling]);

  const tokens = useMemo(() => (content ? resolveTokens(content) : null), [content]);

  useEffect(() => {
    if (opened || !content) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = original;
    };
  }, [opened, content]);

  useEffect(() => {
    if (!opened || captureMode) return;

    const lenis = new Lenis({ syncTouch: false, allowNestedScroll: true });
    lenisRef.current = lenis;

    let rafId = requestAnimationFrame(function raf(time) {
      lenis.raf(time);
      rafId = requestAnimationFrame(raf);
    });

    // Khi user tự cuộn (vuốt/lăn), dừng auto-scroll để tránh giật.
    // Dùng touchmove chứ không phải touchstart: tap thuần (không kéo) do onClick
    // xử lý toggle, tránh chồng chéo tap→touchstart→click.
    const onUserGesture = () => {
      if (autoScrollingRef.current) setAutoScrolling(false);
    };
    window.addEventListener("wheel", onUserGesture, { passive: true });
    window.addEventListener("touchmove", onUserGesture, { passive: true });

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("wheel", onUserGesture);
      window.removeEventListener("touchmove", onUserGesture);
      lenis.destroy();
      lenisRef.current = null;
    };
  }, [captureMode, opened]);

  useEffect(() => {
    if (!opened || !autoScrolling || captureMode) return;
    const lenis = lenisRef.current;
    if (!lenis) return;

    const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
    const remaining = maxScroll - lenis.scroll;
    if (remaining <= 1) {
      autoScrollFinishedRef.current = true;
      setAutoScrolling(false);
      return;
    }

    // Tốc độ ~0.08 px/ms như bản cũ → suy ra duration theo quãng còn lại.
    const duration = remaining / 0.08 / 1000;
    lenis.scrollTo(maxScroll, {
      duration,
      easing: (t) => t,
      onComplete: () => {
        autoScrollFinishedRef.current = true;
        setAutoScrolling(false);
      },
    });

    return () => {
      // Dừng animation scrollTo bằng cách neo về vị trí hiện tại.
      lenis.scrollTo(lenis.scroll, { immediate: true });
    };
  }, [autoScrolling, captureMode, opened]);

  useEffect(() => {
    return () => {
      if (openTimerRef.current) window.clearTimeout(openTimerRef.current);
      if (autoScrollTimerRef.current) window.clearTimeout(autoScrollTimerRef.current);
    };
  }, []);

  useEffect(() => {
    const originalScrollRestoration = history.scrollRestoration;
    history.scrollRestoration = "manual";

    const jump = () => {
      const root = document.documentElement;
      const originalScrollBehavior = root.style.scrollBehavior;
      root.style.scrollBehavior = "auto";
      window.scrollTo(0, 0);
      root.style.scrollBehavior = originalScrollBehavior;
    };

    jump();
    const raf = requestAnimationFrame(jump);

    return () => {
      cancelAnimationFrame(raf);
      history.scrollRestoration = originalScrollRestoration;
    };
  }, []);

  if (!content || !tokens) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-[#f3e6d0] px-6 text-center">
        <h1 className="text-2xl font-bold text-[#710001]">Demo đang được cập nhật</h1>
        <p className="mt-3 max-w-md text-sm text-[#710001]/80">
          Mẫu thiệp &ldquo;{template.name}&rdquo; hiện chưa có dữ liệu demo. Vui lòng quay lại sau.
        </p>
      </main>
    );
  }

  const AuditedTemplateRenderer = isAuditedTemplateSlug(content.slug)
    ? AUDITED_TEMPLATE_RENDERERS[content.slug]
    : null;

  function openInvitation() {
    const root = document.documentElement;
    const originalScrollBehavior = root.style.scrollBehavior;
    root.style.scrollBehavior = "auto";
    window.scrollTo(0, 0);
    root.style.scrollBehavior = originalScrollBehavior;

    autoScrollFinishedRef.current = false;
    setOpening(true);
    openTimerRef.current = window.setTimeout(() => {
      setOpened(true);
      autoScrollTimerRef.current = window.setTimeout(() => {
        setAutoScrolling(true);
      }, 2000);
    }, 800);
    const audio = audioRef.current;
    if (audio) {
      audio.play().then(() => setPlaying(true)).catch(() => setPlaying(false));
    }
  }

  function toggleMusic() {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) {
      audio.play().then(() => setPlaying(true)).catch(() => setPlaying(false));
    } else {
      audio.pause();
      setPlaying(false);
    }
  }

  function toggleAutoScroll(event: MouseEvent<HTMLElement>) {
    if (!opened || autoScrollFinishedRef.current) return;
    const target = event.target as HTMLElement;
    if (target.closest("button,a,input,textarea,select,label,[role='button'],[contenteditable='true']")) return;
    setAutoScrolling((value) => !value);
  }

  return (
    <LiveFormsProvider value={liveForms}>
    <main
      id="top"
      data-capture-mode={captureMode ? "true" : undefined}
      className="relative min-h-screen bg-white"
      onClick={toggleAutoScroll}
    >
      {!captureMode ? <audio ref={audioRef} src={content.music ?? DEFAULT_MUSIC} loop preload="auto" /> : null}

      {!opened && !captureMode ? (
        <EnvelopeCover content={content} tokens={tokens} opening={opening} onOpen={openInvitation} />
      ) : null}

      {AuditedTemplateRenderer ? (
        <div className="contents" data-template-renderer={content.slug}>
          <AuditedTemplateRenderer content={content} />
        </div>
      ) : content.slug === "double-phoenix-red" || content.slug === "double-phoenix-green" ? (
        <PhoenixInvitation content={content} />
      ) : content.slug === "song-hy-green" ? (
        <SongHyGreenInvitation content={content} />
      ) : content.slug === "song-hy-red" ? (
        <SongHyRedInvitation content={content} />
      ) : content.slug === "nhat-binh-red" ? (
        <NhatBinhInvitation content={content} />
      ) : content.slug === "co-ba-red" ? (
        <CoBaInvitation content={content} />
      ) : content.slug === "dragon-phoenix-red" ? (
        <DragonPhoenixRedInvitation content={content} />
      ) : content.slug === "dragon-phoenix-green" ? (
        <DragonPhoenixGreenInvitation content={content} />
      ) : content.slug === "dragon-phoenix-blue" ? (
        <DragonPhoenixBlueInvitation content={content} />
      ) : content.slug === "dragon-phoenix-black" ? (
        <DragonPhoenixBlackInvitation content={content} />
      ) : content.slug === "double-dragon-red" ? (
        <DoubleDragonRedInvitation content={content} />
      ) : content.slug === "double-dragon-blue" ? (
        <DoubleDragonBlueInvitation content={content} />
      ) : content.slug === "double-dragon-green" ? (
        <SongLongXanhInvitation content={content} />
      ) : content.slug === "royal-red" ? (
        <RoyalRedInvitation content={content} />
      ) : content.slug === "royal-blue" ? (
        <RoyalBlueInvitation content={content} />
      ) : content.slug === "royal-green" ? (
        <RoyalGreenInvitation content={content} />
      ) : content.slug === "chateau-blue" ? (
        <ChateauBlueInvitation content={content} />
      ) : content.slug === "chateau-green" ? (
        <ChateauGreenInvitation content={content} />
      ) : content.slug === "qasr-green" ? (
        <QasrGreenInvitation content={content} />
      ) : content.slug === "qasr-gold" ? (
        <QasrGoldInvitation content={content} />
      ) : content.slug === "dragon-phoenix-v2-red" ? (
        <DragonPhoenixV2Invitation content={content} />
      ) : content.slug === "dragon-phoenix-v3-red" ? (
        <DragonPhoenixV3Invitation content={content} />
      ) : (
        <div className="mx-auto max-w-[520px]" style={{ background: tokens.cardBg, minHeight: "100vh" }}>
          <InvitationBody content={content} tokens={tokens} />
        </div>
      )}

      {opened && !captureMode ? (
        <>
          <PublicRsvpDialog />
          <PublicGuestMediaDialog />
          <button
            type="button"
            onClick={toggleMusic}
            aria-label={playing ? "Tạm dừng nhạc" : "Phát nhạc"}
            className="fixed bottom-5 right-4 z-40 flex size-12 items-center justify-center rounded-full shadow-lg transition hover:-translate-y-1 sm:right-6"
            style={{ backgroundColor: tokens.buttonBg, color: tokens.buttonText }}
          >
            {playing ? <Pause className="size-5" /> : <Play className="size-5" />}
          </button>
        </>
      ) : null}
    </main>
    </LiveFormsProvider>
  );
}

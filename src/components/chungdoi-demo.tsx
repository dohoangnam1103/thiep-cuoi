"use client";

import Lenis from "lenis";
import { Pause, Play } from "lucide-react";
import { type MouseEvent, useEffect, useMemo, useRef, useState } from "react";

import type { ChungDoiTemplate } from "@/data/chungdoi";
import { chungdoiDemoContent, type ChungDoiDemoContent } from "@/data/chungdoi-demo-content";
import { chungdoiThemeConfig } from "@/data/chungdoi-theme-config";
import { LiveFormsProvider, useWishFormBinding, type LiveForms } from "@/components/chungdoi-live-forms";

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

function mapEmbedUrl(query: string) {
  return `https://www.google.com/maps?q=${encodeURIComponent(query)}&output=embed`;
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
        <span className="text-xl" style={{ color: tokens.buttonText }}>
          {tokens.sealType === "heart" ? "♥" : "囍"}
        </span>
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

function CoverOverlay({
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
  const date = formatDate(content.couple.date);
  const names = content.couple.brideFirst
    ? [content.couple.brideShortName, content.couple.groomShortName]
    : [content.couple.groomShortName, content.couple.brideShortName];
  const nameStyle = tokens.coupleFont ? { fontFamily: tokens.coupleFont } : undefined;

  const flyImages = tokens.cardImages.filter((img) => img.flyOnOpen);

  return (
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center overflow-hidden p-4"
      style={{
        background: tokens.background,
        animation: opening ? "demo-cover-out 0.8s ease-in forwards" : undefined,
      }}
    >
      <ParticleField tokens={tokens} />

      {opening ? <BurstParticles tokens={tokens} /> : null}

      <div
        className="relative z-10 w-full max-w-[310px] sm:max-w-[340px] md:max-w-[560px]"
        style={{ animation: opening ? "demo-envelope-away 0.8s ease-in forwards" : undefined }}
      >
        <Seal tokens={tokens} opening={opening} />
        <div
          className="relative rounded-lg"
          style={{ boxShadow: "0 25px 60px -12px rgba(0,0,0,0.45), 0 8px 24px rgba(0,0,0,0.2)" }}
        >
          {/* base cream layer + corner decorations (behind the text) */}
          <div
            className="absolute inset-0 overflow-hidden rounded-lg"
            style={{ background: tokens.cardBg, border: `1px solid ${tokens.guestBoxBorder}` }}
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

          {/* transparent text layer on top */}
          <div className="relative z-10 px-6 pb-14 pt-24 text-center md:pb-10">
            <h1 className="mb-2 flex flex-col items-center text-3xl leading-tight sm:text-4xl" style={{ color: tokens.textPrimary }}>
              <span className="block w-full" style={nameStyle}>
                {names[0]}
              </span>
              <span className="my-1 block w-full text-lg leading-none sm:text-xl" style={nameStyle}>
                &amp;
              </span>
              <span className="block w-full" style={nameStyle}>
                {names[1]}
              </span>
            </h1>

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
                <h2 className="text-lg font-semibold sm:text-xl" style={{ color: tokens.textPrimary }}>
                  Gia đình Anh Mạnh
                </h2>
              </div>
              <p className="mx-auto max-w-xs text-[15px] font-light" style={{ color: tokens.textSecondary }}>
                đến dự buổi tiệc chung vui cùng gia đình
              </p>
            </div>

            <button
              type="button"
              onClick={onOpen}
              className="demo-shine relative mx-auto inline-flex items-center justify-center overflow-hidden rounded-full px-8 py-2.5 text-lg font-semibold shadow-lg transition hover:-translate-y-0.5"
              style={{ backgroundColor: tokens.buttonBg, color: tokens.buttonText }}
            >
              Mở thiệp
            </button>
          </div>
        </div>

        {opening
          ? flyImages.map((img, i) => (
              <div key={i} className={`pointer-events-none absolute ${img.className}`}>
                <img
                  src={img.src}
                  alt=""
                  aria-hidden="true"
                  className="block h-auto w-full"
                  style={{ animation: "demo-dragon-fly 1.2s ease-in forwards" }}
                />
              </div>
            ))
          : null}
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
                <div key={src} className="relative overflow-hidden rounded-lg">
                  <img src={src} alt={`Ảnh cưới ${index + 1}`} className="aspect-[3/4] w-full object-cover" />
                  {isLast && extraCount > 0 ? (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/45 text-2xl font-bold text-white">+{extraCount}</div>
                  ) : null}
                </div>
              );
            })}
          </div>
        </section>
      ) : null}

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
            <iframe src={mapEmbedUrl(mapQuery)} title={mapQuery} className="h-64 w-full" loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
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

function FitText({
  children,
  maxFontSize,
  className,
  style,
}: {
  children: string;
  maxFontSize: number;
  className?: string;
  style?: React.CSSProperties;
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

function FamilyColumn({ title, a, b, addr }: { title: string; a: string; b: string; addr: string }) {
  return (
    <div className="flex min-h-0 w-full min-w-0 flex-col items-center gap-1.5">
      <span className="text-[15px] font-normal md:text-[18px] lg:text-[19px]">{title}</span>
      <span className="whitespace-nowrap text-[20px] font-bold">{a}</span>
      <span className="whitespace-nowrap text-[20px] font-bold">{b}</span>
      {addr ? <div className="mt-1 w-full max-w-[169px] whitespace-pre-line text-[13px] leading-normal md:max-w-[260px] md:text-[15px] lg:max-w-[300px] lg:text-[16px]">{addr}</div> : null}
    </div>
  );
}

function PhoenixWishForm({ M }: { M: string }) {
  const { formProps, pending, state } = useWishFormBinding();

  return (
    <form {...formProps} className="mx-auto mt-6 w-full max-w-full md:max-w-[600px]">
      <div className="flex flex-col gap-3">
        <input name="name" required maxLength={120} className="w-full rounded-[6px] border px-4 py-2 text-[13px] outline-none" style={{ borderColor: hexToRgba(M, 0.3) }} placeholder="Tên của bạn" />
        <textarea name="text" rows={3} required maxLength={1000} className="w-full rounded-[6px] border px-4 py-2 text-[13px] outline-none" style={{ borderColor: hexToRgba(M, 0.3) }} placeholder="Lời chúc của bạn" />
        {state?.error ? <p className="text-[12px]" style={{ color: "#c0392b" }}>{state.error}</p> : null}
        {state?.ok ? <p className="text-[12px]" style={{ color: M }}>Cảm ơn lời chúc của bạn!</p> : null}
        <div className="mt-2 flex items-center justify-end">
          <button type="submit" disabled={pending} className="rounded-full px-4 py-1.5 text-[11px] font-semibold uppercase disabled:opacity-60" style={{ backgroundColor: M, color: "#fff" }}>{pending ? "Đang gửi..." : "Gửi lời chúc"}</button>
        </div>
      </div>
    </form>
  );
}

/** Faithful rebuild of the Double Phoenix Red (song-phung-do) opened invitation. */
function PhoenixInvitation({ content }: { content: ChungDoiDemoContent }) {
  const { couple, families, venue, schedule, gallery, wishes } = content;
  const SONGPHUNG = `/chungdoi/images/themes/${content.theme.assetFolder || "songphung-red"}`;
  const M = content.theme.primaryColor || "#710001";
  const CREAM = "#ffffff";
  const brideShort = couple.brideShortName || "Ngọc Ánh";
  const groomShort = couple.groomShortName || "Thế Bảo";
  const reception = formatDate(couple.date);
  const calendar = buildCalendar(couple.date);
  const galleryShown = gallery.slice(0, 4);
  const galleryExtra = Math.max(0, gallery.length - 4);
  const mapQuery = venue.mapAddress || venue.address.replace(/\n+/g, ", ").trim();
  const [lightbox, setLightbox] = useState<number | null>(null);

  useEffect(() => {
    if (lightbox === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLightbox(null);
      else if (e.key === "ArrowLeft") setLightbox((v) => (v === null ? v : (v - 1 + gallery.length) % gallery.length));
      else if (e.key === "ArrowRight") setLightbox((v) => (v === null ? v : (v + 1) % gallery.length));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lightbox, gallery.length]);

  const parallaxRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const root = parallaxRef.current;
    if (!root) return;
    const layers = Array.from(root.querySelectorAll<HTMLElement>("[data-parallax]"));
    let raf = 0;
    const update = () => {
      raf = 0;
      const scrolled = -root.getBoundingClientRect().top;
      for (const el of layers) {
        const speed = Number(el.dataset.parallax) || 0;
        const flip = el.dataset.flip === "1" ? " scaleX(-1)" : "";
        el.style.transform = `translateY(${(scrolled * speed).toFixed(2)}px)${flip}`;
      }
    };
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(update); };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => { window.removeEventListener("scroll", onScroll); cancelAnimationFrame(raf); };
  }, []);

  return (
    <div className="flex w-full justify-center overflow-x-clip" style={{ backgroundColor: CREAM, color: M }}>
      <div ref={parallaxRef} className="relative w-full max-w-[480px] overflow-hidden md:mx-auto md:max-w-[900px] md:border" style={{ borderColor: "#71000122" }}>
        <div
          className="pointer-events-none absolute inset-0 z-0"
          style={{ backgroundImage: `url("${SONGPHUNG}/NENGIAY.jpg")`, backgroundSize: "100%", backgroundRepeat: "repeat-y", backgroundPosition: "center top", opacity: 0.3 }}
        />
        <div data-parallax="0.25" className="pointer-events-none absolute right-[50%] top-[800px] z-[5] overflow-hidden opacity-10 md:top-[1150px] lg:top-[1200px]" style={{ willChange: "transform", backfaceVisibility: "hidden" }}>
          <img src={`${SONGPHUNG}/Phuong line.webp`} alt="" className="h-[850px] w-auto object-contain md:h-[1594px]" style={{ objectPosition: "right top", maxWidth: "none" }} />
        </div>
        <div data-parallax="0.25" data-flip="1" className="pointer-events-none absolute left-[50%] top-[2000px] z-[5] overflow-hidden opacity-10 md:top-[2050px] lg:top-[2100px]" style={{ willChange: "transform", backfaceVisibility: "hidden" }}>
          <img src={`${SONGPHUNG}/Phuong line.webp`} alt="" className="h-[850px] w-auto object-contain md:h-[1594px]" style={{ objectPosition: "left top", maxWidth: "none" }} />
        </div>
        <div data-parallax="0.35" data-flip="1" className="pointer-events-none absolute left-[50%] top-[1050px] z-[5] overflow-hidden opacity-10 md:top-[1200px] lg:top-[1250px]" style={{ willChange: "transform", backfaceVisibility: "hidden" }}>
          <img src={`${SONGPHUNG}/HOA.webp`} alt="" className="h-[390px] w-auto object-contain md:h-[731px]" style={{ objectPosition: "left top", maxWidth: "none" }} />
        </div>
        <div data-parallax="0.45" className="pointer-events-none absolute right-[50%] top-[1750px] z-[5] overflow-hidden opacity-10 md:top-[2900px] lg:top-[2950px]" style={{ willChange: "transform", backfaceVisibility: "hidden" }}>
          <img src={`${SONGPHUNG}/HOA.webp`} alt="" className="h-[600px] w-auto object-contain md:h-[1125px]" style={{ objectPosition: "right top", maxWidth: "none" }} />
        </div>

        <header className="relative z-10 flex flex-col items-center justify-center pb-[180px] pt-12 text-center md:pb-[220px] md:pt-16">
          <div className="mb-6 w-full pl-6 text-left text-[36px] uppercase md:mb-8 md:ml-[80px] md:pl-8 md:text-[52px]" style={{ fontFamily: '"Fz Aghita", "Pattaya", cursive' }}>
            <div className="ml-[15px]">{brideShort}</div>
            <div className="ml-[50px] mt-[10px]">{groomShort}</div>
          </div>
          <div className="relative flex h-[260px] w-full items-center justify-center md:h-[488px]">
            <div className="absolute left-0 z-0 h-[110px] w-full md:h-[206px]" style={{ backgroundColor: M, top: "50%" }} />
            <div data-parallax="-0.15" className="absolute left-[-90px] top-0 z-10 h-[480px] w-[230px] md:left-[-169px] md:h-[900px] md:w-[431px]" style={{ willChange: "transform", backfaceVisibility: "hidden" }}>
              <img src={`${SONGPHUNG}/Phuong 2.webp`} alt="Phoenix Left" className="h-full w-full object-contain" style={{ objectPosition: "left center" }} />
            </div>
            <div className="relative z-20 h-[155px] w-[155px] md:h-[291px] md:w-[291px]">
              <img src={`${SONGPHUNG}/CHU HY.webp`} alt="囍" className="h-full w-full object-contain" />
            </div>
            <div data-parallax="0.15" data-flip="1" className="absolute top-[-120px] z-10 h-[320px] w-[155px] md:top-[-225px] md:h-[600px] md:w-[291px]" style={{ left: "calc(50% + 77.5px)", transform: "scaleX(-1)", willChange: "transform", backfaceVisibility: "hidden" }}>
              <img src={`${SONGPHUNG}/Phuong.webp`} alt="Phoenix Right" className="h-full w-full object-contain" style={{ objectPosition: "right center" }} />
            </div>
          </div>
        </header>

        <section className="relative z-10 px-6 py-10 md:px-4 md:py-14">
          <div data-parallax="0.1" data-flip="1" className="pointer-events-none absolute right-0 top-[-220px] z-[5] h-auto w-[192px] opacity-100 md:top-[-270px] md:w-[360px] lg:top-[-290px]" style={{ willChange: "transform", backfaceVisibility: "hidden", transform: "scaleX(-1)" }}>
            <img src={`${SONGPHUNG}/HOA.webp`} alt="Flower Background" className="h-auto w-full object-contain" />
          </div>
          <div className="mb-12 flex flex-col items-center gap-6 text-center md:mb-16 md:gap-8">
            <h2 className="relative z-10 text-[20px] font-bold uppercase md:text-[24px]">Thông Tin Lễ Cưới</h2>
            <div className="flex w-full items-start justify-center gap-3 md:gap-8">
              <FamilyColumn title="Ông Bà" a={families.brideFather} b={families.brideMother} addr={families.brideAddress} />
              <div className="h-[60px] w-px self-center" style={{ backgroundColor: hexToRgba(M, 0.4) }} />
              <FamilyColumn title="Ông Bà" a={families.groomFather} b={families.groomMother} addr={families.groomAddress} />
            </div>
            <div className="flex w-full flex-col items-center gap-2">
              <h3 className="font-qellia flex w-full items-center justify-center whitespace-nowrap text-[40px] leading-[52px] md:text-[64px] md:leading-[100px]">{couple.brideFullName}</h3>
              <div className="text-[12px] uppercase tracking-[0.2em] md:text-[13px]">{couple.brideBirthOrder || "Út Nữ"}</div>
              <div className="text-[35px] md:text-[48px]">&amp;</div>
              <h3 className="font-qellia flex w-full items-center justify-center whitespace-nowrap text-[40px] leading-[52px] md:text-[64px] md:leading-[100px]">{couple.groomFullName}</h3>
              <div className="text-[12px] uppercase tracking-[0.2em] md:text-[13px]">{couple.groomBirthOrder || "Út Nam"}</div>
            </div>
            <p className="whitespace-pre-line text-center text-[14px] md:text-[15px]">{couple.ceremonyHeader || "LỄ THÀNH HÔN ĐƯỢC CỬ HÀNH TẠI\nTƯ GIA"}</p>
            {couple.ceremonyTime ? <p className="text-[14px] md:text-[15px]">Vào lúc {couple.ceremonyTime}</p> : null}
          </div>
        </section>

        {galleryShown.length > 0 ? (
          <section className="relative z-10 flex flex-col items-center px-6 py-6 md:px-8 md:py-10">
            <h2 className="mb-6 text-center text-[20px] font-bold uppercase md:text-[24px]">Album Ảnh Cưới</h2>
            <div className="w-full max-w-[320px] md:max-w-[550px]">
              <div className="grid grid-cols-2 gap-3 p-4 md:gap-4 md:p-6">
                {galleryShown.map((src, i) => (
                  <button key={src} type="button" onClick={() => setLightbox(i)} className="group relative aspect-square cursor-pointer overflow-hidden rounded-lg border bg-white/50" style={{ borderColor: "#00000011" }}>
                    <img src={src} alt={`Wedding photo ${i + 1}`} className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-[1.03]" />
                    {i === galleryShown.length - 1 && galleryExtra > 0 ? (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/55 text-lg font-semibold text-white">+{galleryExtra}</div>
                    ) : null}
                  </button>
                ))}
              </div>
            </div>
          </section>
        ) : null}

        {lightbox !== null ? (
          <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black/90" onClick={() => setLightbox(null)}>
            <button type="button" aria-label="Đóng" onClick={() => setLightbox(null)} className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center text-2xl text-white/90 transition-opacity hover:opacity-70">✕</button>
            <div className="absolute top-5 text-sm text-white/80">{lightbox + 1} / {gallery.length}</div>
            <button type="button" aria-label="Ảnh trước" onClick={(e) => { e.stopPropagation(); setLightbox((v) => (v === null ? v : (v - 1 + gallery.length) % gallery.length)); }} className="absolute left-3 top-1/2 flex h-12 w-12 -translate-y-1/2 items-center justify-center text-3xl text-white/90 transition-opacity hover:opacity-70 md:left-8">‹</button>
            <img src={gallery[lightbox]} alt={`Wedding photo ${lightbox + 1}`} onClick={(e) => e.stopPropagation()} className="max-h-[78vh] max-w-[92vw] rounded-lg object-contain" />
            <button type="button" aria-label="Ảnh sau" onClick={(e) => { e.stopPropagation(); setLightbox((v) => (v === null ? v : (v + 1) % gallery.length)); }} className="absolute right-3 top-1/2 flex h-12 w-12 -translate-y-1/2 items-center justify-center text-3xl text-white/90 transition-opacity hover:opacity-70 md:right-8">›</button>
            <div className="absolute bottom-4 flex max-w-[92vw] gap-2 overflow-x-auto px-2" onClick={(e) => e.stopPropagation()}>
              {gallery.map((src, i) => (
                <button key={src} type="button" onClick={() => setLightbox(i)} className="h-14 w-14 shrink-0 overflow-hidden rounded-md border-2 transition-opacity" style={{ borderColor: i === lightbox ? CREAM : "transparent", opacity: i === lightbox ? 1 : 0.6 }}>
                  <img src={src} alt={`Thumbnail ${i + 1}`} className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          </div>
        ) : null}

        {reception ? (
          <section className="relative z-10 flex flex-col items-center gap-4 px-6 py-10 text-center md:gap-6 md:py-14">
            <h3 className="flex flex-col items-center text-[18px] uppercase md:text-[20px]">Tiệc cưới sẽ diễn ra vào lúc:</h3>
            <div className="text-[18px] font-semibold md:text-[20px]">{venue.banquetTime || couple.time}</div>
            <div className="flex items-center justify-center">
              <span className="text-[18px] font-semibold uppercase md:text-[20px]">{reception.weekday}</span>
              <span className="mx-2 text-[14px] opacity-50 md:mx-3">/</span>
              <span className="text-[30px] font-semibold md:text-[36px]">{reception.day}</span>
              <span className="mx-2 text-[14px] opacity-50 md:mx-3">/</span>
              <span className="text-[18px] font-semibold uppercase md:text-[20px]">Tháng {reception.month}</span>
            </div>
            <div className="flex items-center justify-center gap-8">
              {schedule.slice(0, 2).map((s) => (
                <div key={s.label} className="flex flex-col items-center">
                  <span className="text-[11px] uppercase tracking-wider">{s.label}</span>
                  <span className="mt-1 text-[18px] font-semibold md:text-[20px]">{s.time}</span>
                </div>
              ))}
            </div>
            {calendar ? (
              <div className="mx-auto mt-2 w-[296px] max-w-full md:w-[352px]">
                <div className="mx-auto w-full max-w-[280px] overflow-hidden rounded-lg border md:max-w-[310px]" style={{ borderColor: hexToRgba(M, 0.25) }}>
                  <div className="py-2.5 text-center text-[13px] font-semibold tracking-wide md:text-[14px]" style={{ backgroundColor: M, color: "#fff" }}>Tháng {calendar.month} / {calendar.year}</div>
                  <div className="grid grid-cols-7 border-b-2" style={{ borderColor: hexToRgba(M, 0.15) }}>
                    {WEEKDAY_LABELS.map((d) => (<div key={d} className="py-1.5 text-center text-[10px] font-medium opacity-60 md:text-[11px]">{d}</div>))}
                  </div>
                  <div className="grid grid-cols-7 gap-y-0.5 px-1 py-2">
                    {calendar.cells.map((day, i) => (
                      <div key={i} className="flex h-[30px] items-center justify-center md:h-[34px]">
                        {day === calendar.highlight ? (
                          <span className="flex size-7 items-center justify-center rounded-full text-[11px] font-bold text-white md:text-[12px]" style={{ backgroundColor: M }}>{day}</span>
                        ) : day ? (<span className="text-[12px] md:text-[13px]">{day}</span>) : null}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : null}
            <a href={googleCalendarUrl(content)} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex items-center justify-center text-sm tracking-wider underline decoration-1 underline-offset-4 transition-opacity hover:opacity-70" style={{ color: M, fontFamily: 'Baskerville, "Times New Roman", serif' }}>Thêm vào lịch</a>
            <button type="button" className="mt-2 rounded-full px-10 py-2.5 text-[13px] font-semibold uppercase tracking-wider" style={{ backgroundColor: M, color: "#fff" }}>Xác Nhận</button>
          </section>
        ) : null}

        {mapQuery ? (
          <section className="relative z-10 flex flex-col gap-6 px-6 pb-12 text-center md:gap-8 md:px-10 md:pb-16">
            <h3 className="text-[20px] font-bold uppercase tracking-[0.05em] md:text-[24px]">Tiệc cưới sẽ tổ chức tại</h3>
            <p className="mx-auto max-w-sm whitespace-pre-line border-b pb-3 text-[14px] leading-relaxed md:max-w-[600px] md:text-base" style={{ borderColor: "#8B000022" }}>{venue.address}</p>
            <div className="flex w-full flex-col items-center gap-4 md:gap-5">
              <iframe src={mapEmbedUrl(mapQuery)} title={mapQuery} className="h-[260px] w-full max-w-[340px] overflow-hidden rounded-2xl md:h-[360px] md:max-w-[600px]" loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
            </div>
          </section>
        ) : null}

        {schedule.length > 0 ? (
          <section className="relative z-10 px-6 py-10 md:px-8 md:py-12">
            <h2 className="mb-8 text-center text-[20px] font-bold uppercase md:text-[24px]">Lịch Trình Ngày Cưới</h2>
            <ol className="mx-auto grid max-w-[420px] grid-cols-[1fr_auto_1fr] items-stretch gap-x-4">
              {schedule.map((s, i) => (
                <li key={`${s.time}-${i}`} className="contents">
                  <span className="pt-0.5 text-right text-[16px] tabular-nums md:text-[17px]">{s.time}</span>
                  <span className="relative flex items-center justify-center self-stretch">
                    {i > 0 ? <span className="absolute left-1/2 top-0 -mt-4 h-4 w-px -translate-x-1/2" style={{ backgroundColor: hexToRgba(M, 0.3) }} /> : null}
                    <span className="relative block size-2.5 rounded-full" style={{ backgroundColor: M }} />
                    {i < schedule.length - 1 ? <span className="absolute bottom-0 left-1/2 -mb-4 h-4 w-px -translate-x-1/2" style={{ backgroundColor: hexToRgba(M, 0.3) }} /> : null}
                  </span>
                  <span className="pb-6 pt-0.5 text-left text-[17px] font-medium leading-tight md:text-[19px]">{s.label}</span>
                </li>
              ))}
            </ol>
          </section>
        ) : null}

        <section className="relative z-10 px-4 py-10 md:px-8">
          <div className="text-center">
            <h2 className="font-pattaya mb-6 text-[22px] md:text-[24px]">Sổ lưu bút</h2>
          </div>
          <PhoenixWishForm M={M} />
          {wishes.length > 0 ? (
            <div className="chungdoi-scroll mx-auto mt-8 max-h-[500px] w-full max-w-full space-y-3 overflow-y-auto pr-2 md:max-w-[600px]">
              {wishes.map((w, i) => (
                <div key={`${w.name}-${i}`} className="rounded-lg border p-3 text-xs" style={{ borderColor: hexToRgba(M, 0.2), backgroundColor: "#ffffff" }}>
                  <div className="flex items-start justify-between">
                    <span className="font-semibold" style={{ color: M }}>{w.name}</span>
                    <span className="text-xs opacity-70">{formatWishTime(w.time)}</span>
                  </div>
                  <p className="mt-2 leading-relaxed">{w.text}</p>
                </div>
              ))}
            </div>
          ) : null}
        </section>

        {content.bank.brideBankName || content.bank.groomBankName ? (
          <section className="relative z-10 px-6 py-10 text-center md:px-8">
            <h2 className="mb-8 text-[20px] font-bold uppercase md:text-[24px]">QR Mừng Cưới</h2>
            <div className="flex flex-row flex-wrap items-start justify-center gap-4 sm:gap-8">
              {([
                { label: `Cô Dâu - ${content.bank.brideAccountName}`, bank: content.bank.brideBankName, num: content.bank.brideAccountNumber, name: content.bank.brideAccountName },
                { label: `Chú Rể - ${content.bank.groomAccountName}`, bank: content.bank.groomBankName, num: content.bank.groomAccountNumber, name: content.bank.groomAccountName },
              ] as const).filter((q) => q.bank).map((q) => {
                const qr = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(`${q.bank} ${q.num} ${q.name}`)}`;
                return (
                  <div key={q.label} className="flex max-w-[200px] flex-1 flex-col items-center">
                    <h3 className="mb-2 flex min-h-[2rem] items-start justify-center text-xs font-semibold">{q.label}</h3>
                    <div className="size-32 rounded-xl bg-white p-2 sm:size-40">
                      <img src={qr} alt={`QR - ${q.label}`} className="h-full w-full object-contain" />
                    </div>
                    <p className="mt-2 text-[13px] font-semibold">{q.bank}</p>
                    <p className="text-[13px]">{q.num}</p>
                    <p className="text-[13px]">{q.name}</p>
                    <a href={qr} target="_blank" rel="noreferrer" className="mt-3 rounded-full border px-4 py-1.5 text-[11px] font-semibold uppercase" style={{ borderColor: M, color: M }}>Lưu QR</a>
                  </div>
                );
              })}
            </div>
          </section>
        ) : null}

        <footer className="relative z-10 flex w-full flex-col items-center justify-center px-4 py-6 text-center" style={{ backgroundColor: M }}>
          <span className="flex flex-col items-center gap-1 whitespace-pre-line text-[12px] md:text-[15px] lg:text-[18px]" style={{ fontFamily: 'Baskerville, "Times New Roman", serif', color: "#fff0e7" }}>
            <span dir="auto">Sự hiện diện của quý khách là niềm vinh hạnh của gia đình chúng tôi!</span>
          </span>
        </footer>
        <div className="relative z-10 flex items-center justify-center py-3">
          <a href="https://thiepmungonline.com" target="_blank" rel="noopener noreferrer" className="text-xs opacity-50 transition-opacity hover:opacity-70" style={{ color: M }}>♡ thiepmungonline.com</a>
        </div>
      </div>
    </div>
  );
}

const SHR = "/chungdoi/images/themes/song-hy-red";
const SHG = "/chungdoi/images/themes/song-hy-green";

type SongHyPalette = {
  accent: string;
  cardBg: string;
  bandText: string;
  gray: string;
  sunburstFilter: string;
  chuHyFilter: string;
  arcFill: string;
  starSrc: string | null;
  modalBg: string;
};

const SONG_HY_GREEN: SongHyPalette = {
  accent: "#1F3A25",
  cardBg: "#FFF7EB",
  bandText: "#e8f0e4",
  gray: "#666666",
  sunburstFilter: "hue-rotate(100deg) saturate(0.6) brightness(0.7)",
  chuHyFilter: "hue-rotate(100deg) saturate(0.7)",
  arcFill: "#e8f0e4",
  starSrc: `${SHG}/star.webp`,
  modalBg: "rgb(220, 235, 222)",
};

const SONG_HY_RED: SongHyPalette = {
  accent: "#800000",
  cardBg: "#FFF7EB",
  bandText: "#FFEED2",
  gray: "#666666",
  sunburstFilter: "none",
  chuHyFilter: "none",
  arcFill: "#ffeed2",
  starSrc: null,
  modalBg: "rgb(245, 224, 224)",
};

function givenName(full: string) {
  const parts = full.trim().split(/\s+/).filter(Boolean);
  return parts.length >= 3 ? parts.slice(-2).join(" ") : parts.join(" ");
}

function SongHyBand({ palette, children }: { palette: SongHyPalette; children: React.ReactNode }) {
  return (
    <div className="w-full py-3 md:py-4" style={{ backgroundColor: palette.accent }}>
      <h2 className="flex flex-col items-center text-center text-[20px] font-bold uppercase tracking-wide md:text-[24px]" style={{ color: palette.bandText, fontFamily: '"Times New Roman", serif' }}>
        {children}
      </h2>
    </div>
  );
}

function SongHyWishForm({ palette }: { palette: SongHyPalette }) {
  const { formProps, pending, state } = useWishFormBinding();

  return (
    <form {...formProps} className="mx-auto mt-6 w-full max-w-full md:max-w-[600px]">
      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-lg">
        <div className="mb-4">
          <input name="name" required maxLength={120} placeholder="Nhập tên của bạn*" className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-green-400 focus:ring-2 focus:ring-green-200" type="text" />
        </div>
        <textarea name="text" required maxLength={1000} placeholder="Nhập lời chúc của bạn*" className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-green-400 focus:ring-2 focus:ring-green-200" rows={4} style={{ resize: "none" }} />
        {state?.error ? <p className="mt-2 text-sm text-red-600">{state.error}</p> : null}
        {state?.ok ? <p className="mt-2 text-sm" style={{ color: palette.accent }}>Cảm ơn lời chúc của bạn!</p> : null}
        <div className="mt-4 flex items-center justify-end text-xs">
          <button type="submit" disabled={pending} className="rounded-full px-4 py-2 text-sm font-medium text-white transition-all duration-200 hover:scale-105 disabled:opacity-60 sm:px-8 sm:py-3 sm:text-base" style={{ backgroundColor: palette.accent }}>{pending ? "ĐANG GỬI..." : "GỬI LỜI CHÚC"}</button>
        </div>
      </div>
    </form>
  );
}

function SongHyFamilyColumn({ palette, title, a, b, addr }: { palette: SongHyPalette; title: string; a: string; b: string; addr: string }) {
  return (
    <div className="flex min-w-0 max-w-[160px] flex-1 flex-col items-center gap-1 text-center md:max-w-[280px]">
      <span className="text-[14px] md:text-[15px]" style={{ color: palette.gray }}>{title}</span>
      <span className="whitespace-nowrap font-semibold" style={{ color: palette.accent, fontSize: 15 }}>{a}</span>
      <span className="whitespace-nowrap font-semibold" style={{ color: palette.accent, fontSize: 15 }}>{b}</span>
      {addr ? <div className="mt-1 flex flex-col whitespace-pre-line text-[12px] leading-tight md:text-[13px]" style={{ color: palette.gray }}>{addr}</div> : null}
    </div>
  );
}

function SongHyDateRow({ palette, weekday, day, month }: { palette: SongHyPalette; weekday: string; day: string; month: string }) {
  return (
    <div className="mt-5 flex items-center justify-center">
      <span className="w-[70px] whitespace-nowrap text-right text-[14px] uppercase md:w-[85px] md:text-[15px]" style={{ color: palette.gray, fontFamily: 'Baskerville, "Times New Roman", serif' }}>{weekday}</span>
      <span className="mx-3 h-[25px] w-px self-center opacity-50 md:mx-4" style={{ backgroundColor: palette.gray }} />
      <span className="text-[32px] md:text-[38px]" style={{ color: palette.accent, fontFamily: 'Baskerville, "Times New Roman", serif' }}>{day}</span>
      <span className="mx-3 h-[25px] w-px self-center opacity-50 md:mx-4" style={{ backgroundColor: palette.gray }} />
      <span className="w-[70px] whitespace-nowrap text-left text-[14px] uppercase md:w-[85px] md:text-[15px]" style={{ color: palette.gray, fontFamily: 'Baskerville, "Times New Roman", serif' }}>Tháng {month}</span>
    </div>
  );
}

function SongHyCountdown({ palette, target }: { palette: SongHyPalette; target: string }) {
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
  const targetMs = new Date(target).getTime();
  const diff = now === null ? 0 : Math.max(0, targetMs - now);
  const days = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  const mins = Math.floor((diff % 3600000) / 60000);
  const secs = Math.floor((diff % 60000) / 1000);
  return (
    <div className="mt-2 text-center text-[20px] font-semibold" style={{ color: palette.gray, fontFamily: 'Baskerville, "Times New Roman", serif' }}>
      <p>{days} ngày {hours} giờ {mins} phút {secs} giây</p>
    </div>
  );
}

/** Faithful rebuild of the Song Hỷ (double-happiness) opened invitation, palette-parametrized for the green and red variants. */
function SongHyInvitation({ content, palette }: { content: ChungDoiDemoContent; palette: SongHyPalette }) {
  const { couple, families, venue, schedule, gallery, wishes } = content;
  const [giftOpen, setGiftOpen] = useState(false);
  const groomGiven = givenName(couple.groomFullName);
  const brideGiven = givenName(couple.brideFullName);
  const wedding = formatDate(couple.date);
  const weekdayUpper = wedding ? wedding.weekday.toUpperCase() : "";
  const calendar = buildCalendar(couple.date);
  const portrait = gallery[0];
  const albumShown = gallery.slice(0, 4);
  const albumExtra = Math.max(0, gallery.length - 4);
  const mapQuery = venue.mapAddress || venue.address.replace(/\n+/g, ", ").trim();
  // lunar date is demo-specific; project has no lunar-calendar dependency
  const LUNAR = "(Tức ngày 17/06 năm Bính Ngọ)";
  const banks = ([
    { title: `${couple.groomBirthOrder || "Trưởng Nam"} - ${content.bank.groomAccountName}`, bank: content.bank.groomBankName, num: content.bank.groomAccountNumber, name: content.bank.groomAccountName },
    { title: `${couple.brideBirthOrder || "Út Nữ"} - ${content.bank.brideAccountName}`, bank: content.bank.brideBankName, num: content.bank.brideAccountNumber, name: content.bank.brideAccountName },
  ] as const).filter((q) => q.bank);

  return (
    <div className="relative isolate flex w-full max-w-[480px] flex-col overflow-hidden overflow-x-clip md:mx-auto md:max-w-[900px] md:border" style={{ backgroundColor: palette.cardBg, borderColor: hexToRgba(palette.accent, 0.13) }}>
      <header className="relative w-full overflow-hidden pb-[100px] md:pb-[130px]" style={{ backgroundColor: palette.cardBg }}>
        <div className="pointer-events-none absolute left-1/2 top-0 aspect-square w-[min(671px,130vw)] -translate-x-1/2 -translate-y-1/2 md:w-[min(872px,100%)]" aria-hidden="true">
          <img alt="" className="h-full w-full" src={`${SHR}/sunburst.svg`} style={{ filter: palette.sunburstFilter }} />
        </div>
        <p className="relative z-10 px-4 pt-10 text-center text-[11px] uppercase tracking-[0.35em] md:pt-[52px] md:text-[14px]" style={{ color: palette.bandText, fontFamily: '"Cormorant Garamond", "Times New Roman", serif', textShadow: `${palette.accent} 0px 1px 4px` }}>WELCOME TO OUR WEDDING</p>
        <div className="relative z-10 mx-auto mt-3 flex w-full max-w-[872px] items-center justify-center gap-4 px-4 md:mt-4 md:gap-5 md:px-10">
          <div className="min-w-0 flex-1 text-center">
            <p className="mb-1 text-[11px] md:text-[14px]" style={{ color: palette.bandText, fontFamily: '"Avenir Next", sans-serif', textShadow: `${palette.accent} 0px 1px 4px` }}>{couple.groomBirthOrder || "Trưởng Nam"}</p>
            <p className="whitespace-nowrap uppercase" style={{ fontSize: 23, color: palette.bandText, fontFamily: '"Big Caslon", Baskerville, "Times New Roman", serif', textShadow: `${palette.accent} 0px 1px 4px` }}>{groomGiven}</p>
          </div>
          <div className="flex w-[64px] shrink-0 items-center justify-center md:w-[83px]">
            <img alt="" className="h-[64px] w-[64px] object-contain md:h-[83px] md:w-[83px]" src={`${SHR}/chu-hy.webp`} style={{ filter: palette.chuHyFilter }} />
          </div>
          <div className="min-w-0 flex-1 text-center">
            <p className="mb-1 text-[11px] md:text-[14px]" style={{ color: palette.bandText, fontFamily: '"Avenir Next", sans-serif', textShadow: `${palette.accent} 0px 1px 4px` }}>{couple.brideBirthOrder || "Út Nữ"}</p>
            <p className="whitespace-nowrap uppercase" style={{ fontSize: 23, color: palette.bandText, fontFamily: '"Big Caslon", Baskerville, "Times New Roman", serif', textShadow: `${palette.accent} 0px 1px 4px` }}>{brideGiven}</p>
          </div>
        </div>
        <div className="relative z-10 mt-2 flex justify-center px-6 md:mt-3">
          <div className="relative mx-auto w-full max-w-[286px] md:max-w-[372px]">
            <div className="relative w-full translate-y-[50px] md:translate-y-[73px]">
              <div className="relative aspect-[286/481] w-full">
                <div className="absolute inset-0 overflow-hidden rounded-t-full bg-[#d9d9d9]">
                  {portrait ? <img alt="" className="h-full w-full object-cover" src={portrait} /> : null}
                </div>
                <div className="pointer-events-none absolute inset-x-0 top-0 z-10 aspect-[2/1] w-full overflow-visible">
                  <div className="pointer-events-none absolute inset-0 size-full -translate-y-5 md:-translate-y-[15px] lg:-translate-y-[20px]" aria-label="LOVE NEVER FAILS">
                    <svg className="h-full w-full overflow-visible" viewBox="0 0 286 143" preserveAspectRatio="xMidYMax meet" aria-hidden="true">
                      <defs>
                        <path id="lnf-arc" d="M -6.84 143 A 149.84 149.84 0 0 1 292.84 143" fill="none" />
                      </defs>
                      <text fill={palette.arcFill} fontSize="18" fontFamily='"Cormorant Garamond", "Times New Roman", serif' letterSpacing="0.22em" dominantBaseline="central">
                        <textPath href="#lnf-arc" startOffset="50%" textAnchor="middle" method="align" spacing="auto">LOVE NEVER FAILS</textPath>
                      </text>
                      {palette.starSrc ? (
                        <>
                          <image href={palette.starSrc} x="14.15" y="46.39" width="16" height="16" opacity="0.9" />
                          <image href={palette.starSrc} x="255.85" y="46.39" width="16" height="16" opacity="0.9" />
                        </>
                      ) : null}
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <SongHyBand palette={palette}>THÔNG TIN LỄ CƯỚI</SongHyBand>
      <div className="relative w-full overflow-hidden" style={{ backgroundColor: palette.cardBg }}>
        <div className="relative z-10">
          <div className="mt-6 flex w-full items-start justify-center gap-3 px-2 sm:px-4 md:gap-8">
            <SongHyFamilyColumn palette={palette} title={families.groomParentTitle || "Ông Bà"} a={families.groomFather} b={families.groomMother} addr={families.groomAddress} />
            <div className="h-[60px] w-px self-center" style={{ backgroundColor: palette.accent }} />
            <SongHyFamilyColumn palette={palette} title={families.brideParentTitle || "Ông Bà"} a={families.brideFather} b={families.brideMother} addr={families.brideAddress} />
          </div>
          <div className="mt-8 flex flex-col gap-2 px-4 text-center text-[16px] uppercase tracking-wider md:text-[20px]" style={{ whiteSpace: "pre-line", color: palette.accent, fontFamily: 'Baskerville, "Times New Roman", serif' }}>
            {"TRÂN TRỌNG BÁO TIN\nLỄ THÀNH HÔN CỦA CON CHÚNG TÔI"}
          </div>
          <div className="relative mb-6 mt-4 flex flex-col items-center gap-3 text-center md:gap-4">
            <h3 className="font-qellia flex w-[80%] items-center justify-center whitespace-nowrap leading-[50px] md:leading-[100px]" style={{ fontSize: 64, color: palette.accent }}>{couple.groomFullName}</h3>
            <div className="text-[12px] uppercase tracking-[0.2em] md:text-[13px]" style={{ color: palette.gray, fontFamily: 'Baskerville, "Times New Roman", serif' }}>{couple.groomBirthOrder || "Trưởng Nam"}</div>
            <div className="font-qellia text-[30px] md:text-[35px]" style={{ color: palette.gray }}>&amp;</div>
            <h3 className="font-qellia flex w-[80%] items-center justify-center whitespace-nowrap leading-[50px] md:leading-[100px]" style={{ fontSize: 64, color: palette.accent }}>{couple.brideFullName}</h3>
            <div className="text-[12px] uppercase tracking-[0.2em] md:text-[13px]" style={{ color: palette.gray, fontFamily: 'Baskerville, "Times New Roman", serif' }}>{couple.brideBirthOrder || "Út Nữ"}</div>
          </div>
          <div className="flex w-full flex-col items-center justify-center px-4 py-8 sm:px-6" style={{ color: palette.gray, fontFamily: 'Baskerville, "Times New Roman", serif' }}>
            <div style={{ color: palette.accent }}>
              <span className="flex flex-col items-center whitespace-pre-line text-center text-[16px] leading-relaxed md:text-[20px]">{couple.ceremonyHeader || "LỄ THÀNH HÔN ĐƯỢC CỬ HÀNH TẠI\nTƯ GIA"}</span>
            </div>
            {couple.ceremonyTime ? <p className="mt-2 text-center text-[14px] uppercase md:text-[15px]" style={{ color: palette.gray }}>VÀO LÚC {couple.ceremonyTime}</p> : null}
            {wedding ? <SongHyDateRow palette={palette} weekday={weekdayUpper} day={wedding.day} month={wedding.month} /> : null}
            {wedding ? <div className="mt-2 text-center text-[20px] md:text-[22px]" style={{ color: palette.gray }}>{wedding.yearNumber}</div> : null}
            <div className="mt-2 text-center text-[13px] uppercase tracking-wide md:text-[14px]" style={{ color: palette.gray }}>{LUNAR}</div>
          </div>
        </div>
      </div>

      {albumShown.length > 0 ? (
        <>
          <SongHyBand palette={palette}>Album Ảnh Cưới</SongHyBand>
          <div className="relative w-full overflow-hidden" style={{ backgroundColor: palette.cardBg }}>
            <div className="relative z-10 mx-auto w-full max-w-lg px-2 py-4 sm:px-4">
              <div className="grid grid-cols-2 gap-4">
                {albumShown.map((src, i) => (
                  <div key={src} className="group relative aspect-square cursor-pointer overflow-hidden rounded-lg">
                    <img alt={`Wedding photo ${i + 1}`} className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-[1.03]" src={src} />
                    {i === albumShown.length - 1 && albumExtra > 0 ? (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/60">
                        <span className="text-lg font-semibold text-white">+{albumExtra}</span>
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      ) : null}

      <SongHyBand palette={palette}>THÔNG TIN TIỆC CƯỚI</SongHyBand>
      <div className="relative w-full overflow-hidden" style={{ backgroundColor: palette.cardBg }}>
        <div className="relative z-10 -mt-[1px] flex w-full flex-col items-center justify-center px-2 pb-8 pt-6 sm:px-4">
          <h3 className="flex flex-col items-center text-center text-[16px] uppercase md:text-[20px]" style={{ color: palette.accent, fontFamily: 'Baskerville, "Times New Roman", serif' }}>Tiệc cưới sẽ diễn ra vào lúc:</h3>
          <div className="mt-2 text-center text-[20px] font-semibold md:text-[24px]" style={{ color: palette.accent, fontFamily: 'Baskerville, "Times New Roman", serif' }}>{venue.banquetTime || couple.time}</div>
          {wedding ? <SongHyDateRow palette={palette} weekday={weekdayUpper} day={wedding.day} month={wedding.month} /> : null}
          {wedding ? <div className="mt-2 text-center text-[20px] md:text-[22px]" style={{ color: palette.gray, fontFamily: 'Baskerville, "Times New Roman", serif' }}>{wedding.yearNumber}</div> : null}
          <div className="mt-2 text-center text-[13px] md:text-[14px]" style={{ color: palette.gray, fontFamily: 'Baskerville, "Times New Roman", serif' }}>{LUNAR}</div>
          <div className="mt-4 flex items-center justify-center gap-8">
            <div className="flex flex-col items-center">
              <span className="text-[11px] uppercase" style={{ color: palette.gray, fontFamily: 'Baskerville, "Times New Roman", serif' }}>Khai tiệc</span>
              <span className="mt-1 text-[20px] font-semibold" style={{ color: palette.accent, fontFamily: 'Baskerville, "Times New Roman", serif' }}>{venue.banquetTime || couple.time}</span>
            </div>
          </div>
          <div className="mt-4 flex flex-col items-center justify-center">
            <h2 className="flex flex-col items-center text-center text-[20px] uppercase" style={{ color: palette.gray, fontFamily: 'Baskerville, "Times New Roman", serif' }}>Cùng đếm ngược</h2>
            <SongHyCountdown palette={palette} target={`${couple.date}T${couple.time || "18:00"}`} />
          </div>
          {calendar ? (
            <div className="mx-auto mt-2 w-[296px] max-w-full md:w-[352px]">
              <div className="mx-auto w-full overflow-hidden rounded-lg border" style={{ borderColor: hexToRgba(palette.accent, 0.27), color: palette.accent }}>
                <div className="border-b py-2.5 text-center text-[13px] font-semibold tracking-wide md:text-[14px]" style={{ borderColor: hexToRgba(palette.accent, 0.27) }}>Tháng {calendar.month} / {calendar.year}</div>
                <div className="grid grid-cols-7 border-b-2" style={{ borderColor: palette.accent }}>
                  {WEEKDAY_LABELS.map((d) => (<div key={d} className="py-1.5 text-center text-[10px] font-medium opacity-60 md:text-[11px]">{d}</div>))}
                </div>
                <div className="grid grid-cols-7 gap-y-0.5 px-1 py-2">
                  {calendar.cells.map((day, i) => (
                    <div key={i} className="flex h-[30px] items-center justify-center md:h-[34px]">
                      {day === calendar.highlight ? (
                        <div className="relative flex h-[24px] w-[26px] items-center justify-center md:h-[28px] md:w-[30px]">
                          <svg viewBox="0 0 24 22" className="absolute inset-0 h-full w-full drop-shadow-sm" fill={palette.accent}>
                            <path d="M12 21C12 21 1.5 13.5 1.5 7.5C1.5 4.46 3.96 2 7 2C8.76 2 10.35 2.81 11.4 4.09L12 4.8L12.6 4.09C13.65 2.81 15.24 2 17 2C20.04 2 22.5 4.46 22.5 7.5C22.5 13.5 12 21 12 21Z" />
                          </svg>
                          <span className="relative z-10 text-[11px] font-bold md:text-[12px]" style={{ color: "#fff" }}>{day}</span>
                        </div>
                      ) : day ? (<span className="text-[12px] md:text-[13px]">{day}</span>) : null}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : null}
          <a href={googleCalendarUrl(content)} target="_blank" rel="noopener noreferrer" className="mt-6 inline-flex items-center justify-center text-sm tracking-wider underline decoration-1 underline-offset-4 transition-opacity hover:opacity-70" style={{ color: palette.accent }}>Thêm vào lịch</a>
        </div>
        <div className="relative z-10 flex w-full flex-col items-center justify-center pb-8 pt-2 md:pb-10 md:pt-2">
          <button type="button" className="inline-flex items-center justify-center rounded-[10px] px-4 py-2 text-sm font-semibold tracking-wider transition-transform hover:scale-[1.03] md:text-base" style={{ backgroundColor: palette.accent, color: palette.bandText, fontFamily: 'Baskerville, "Times New Roman", serif' }}>XÁC NHẬN</button>
        </div>
      </div>

      {mapQuery ? (
        <div className="relative w-full overflow-hidden" style={{ backgroundColor: palette.cardBg }}>
          <section className="relative z-10 flex w-full flex-col items-center pb-8">
            <SongHyBand palette={palette}>Tiệc cưới sẽ tổ chức tại</SongHyBand>
            <div className="mt-6 flex w-[92%] max-w-3xl flex-col items-center whitespace-pre-line break-words rounded-lg p-4 text-center text-sm font-medium md:text-base" style={{ backgroundColor: palette.cardBg, color: palette.gray, fontFamily: 'Baskerville, "Times New Roman", serif' }}>{venue.address}</div>
            <div className="relative flex w-full flex-col items-center gap-4 md:gap-5">
              <iframe className="mt-4 h-[350px] w-[92%] max-w-3xl rounded-xl md:h-[450px]" src={mapEmbedUrl(mapQuery)} title={mapQuery} loading="lazy" allowFullScreen referrerPolicy="no-referrer-when-downgrade" />
            </div>
          </section>
        </div>
      ) : null}

      <div className="relative z-10 flex flex-col items-center gap-5 px-6 py-10 md:px-10 md:py-12">
        <div className="flex flex-col items-center gap-1">
          <h2 className="flex flex-col items-center text-center text-[20px] font-bold uppercase tracking-wide md:text-[24px]" style={{ color: palette.accent, fontFamily: '"Times New Roman", serif' }}>DRESS CODE</h2>
          <p className="text-center text-sm opacity-70 md:text-base" style={{ color: palette.accent, fontFamily: 'Baskerville, "Times New Roman", serif' }}>Trang phục dự tiệc</p>
        </div>
        <div className="flex flex-wrap justify-center gap-4 md:gap-6">
          <div className="h-10 w-10 rounded-full shadow-md md:h-12 md:w-12" style={{ backgroundColor: "rgb(139, 154, 107)" }} />
          <div className="h-10 w-10 rounded-full shadow-md md:h-12 md:w-12" style={{ backgroundColor: "rgb(232, 232, 232)", border: `1.5px solid ${hexToRgba(palette.accent, 0.19)}` }} />
          <div className="h-10 w-10 rounded-full shadow-md md:h-12 md:w-12" style={{ backgroundColor: "rgb(232, 220, 200)", border: `1.5px solid ${hexToRgba(palette.accent, 0.19)}` }} />
        </div>
      </div>

      {schedule.length > 0 ? (
        <div className="relative z-10 mb-10 mt-10 flex flex-col gap-6 px-4 md:mb-12 md:mt-12 md:gap-8">
          <h2 className="flex flex-col items-center text-center text-[20px] font-bold uppercase tracking-wide md:text-[24px]" style={{ color: palette.accent, fontFamily: '"Times New Roman", serif' }}>LỊCH TRÌNH NGÀY CƯỚI</h2>
          <ol className="relative mx-auto grid w-full max-w-[460px] grid-cols-[minmax(0,1fr)_16px_minmax(0,1fr)] items-center gap-x-6 gap-y-8 md:gap-x-8 md:gap-y-10" style={{ fontFamily: 'Baskerville, "Times New Roman", serif' }}>
            {schedule.map((s, i) => {
              const isFirst = i === 0;
              const isLast = i === schedule.length - 1;
              const lineClass = isFirst
                ? "absolute left-1/2 w-px -translate-x-1/2 top-1/2 -bottom-8 md:-bottom-10"
                : isLast
                  ? "absolute left-1/2 w-px -translate-x-1/2 -top-8 md:-top-10 bottom-1/2"
                  : "absolute left-1/2 w-px -translate-x-1/2 -top-8 md:-top-10 -bottom-8 md:-bottom-10";
              return (
                <li key={`${s.time}-${i}`} className="contents">
                  <span className="pt-0.5 text-right text-[16px] leading-snug tabular-nums tracking-wide md:text-[17px]" style={{ color: palette.accent, fontFamily: 'Baskerville, "Times New Roman", serif' }}>{s.time}</span>
                  <span aria-hidden="true" className="relative flex items-center justify-center self-stretch">
                    <span className={lineClass} style={{ backgroundColor: hexToRgba(palette.accent, 0.4) }} />
                    <span className="relative block h-2.5 w-2.5 rounded-full" style={{ backgroundColor: palette.accent, boxShadow: `${hexToRgba(palette.accent, 0.13)} 0px 0px 0px 2px` }} />
                  </span>
                  <span className="pt-0.5 text-left text-[17px] font-medium leading-snug md:text-[19px]" style={{ color: palette.gray, fontFamily: 'Baskerville, "Times New Roman", serif' }}>{s.label}</span>
                </li>
              );
            })}
          </ol>
        </div>
      ) : null}

      <SongHyBand palette={palette}>Sổ lưu bút</SongHyBand>
      <div className="relative w-full overflow-hidden" style={{ backgroundColor: palette.cardBg }}>
        <section className="relative z-10 flex w-full flex-col items-center justify-center px-2 py-8 sm:px-4" style={{ color: palette.gray }}>
          <SongHyWishForm palette={palette} />
          <div className="mx-auto mt-8 max-h-[500px] w-full max-w-full space-y-3 overflow-y-auto pr-2 md:max-w-[600px]">
            {wishes.length > 0 ? (
              wishes.map((w, i) => (
                <div key={`${w.name}-${i}`} className="rounded-lg border p-3 text-xs" style={{ borderColor: hexToRgba(palette.accent, 0.2), backgroundColor: "#fff" }}>
                  <div className="flex items-start justify-between">
                    <span className="font-semibold" style={{ color: palette.accent }}>{w.name}</span>
                    <span className="opacity-70">{formatWishTime(w.time)}</span>
                  </div>
                  <p className="mt-2 leading-relaxed">{w.text}</p>
                </div>
              ))
            ) : (
              <p className="flex flex-col items-center text-center text-sm opacity-70">Chưa có lời chúc nào. Hãy là người đầu tiên!</p>
            )}
          </div>
        </section>
      </div>

      <div className="relative w-full overflow-hidden" style={{ backgroundColor: palette.cardBg }}>
        <div className="relative z-10 flex flex-col items-center justify-center py-8">
          <h2 className="mb-4 flex flex-col items-center text-[20px] font-bold uppercase tracking-wide md:text-[24px]" style={{ color: palette.accent, fontFamily: 'Baskerville, "Times New Roman", serif' }}>Phong Bao Mừng Cưới</h2>
          <button type="button" aria-label="Mở hộp mừng cưới" onClick={() => setGiftOpen(true)} className="group relative cursor-pointer border-none bg-transparent outline-none" style={{ width: 200, height: 256 }}>
            <div className="relative flex h-full w-full items-center justify-center">
              {[
                { w: 30.8, style: { top: "5%", right: "5%" } },
                { w: 25.2, style: { top: "20%", left: "0%" } },
                { w: 28, style: { bottom: "20%", right: "0%" } },
                { w: 22.4, style: { bottom: "8%", left: "8%" } },
                { w: 21, style: { top: "45%", right: "-5%" } },
              ].map((c, i) => (
                <div key={i} className="absolute rounded-full" style={{ width: c.w, height: c.w, background: "rgb(251, 191, 36)", border: "2px solid rgb(245, 158, 11)", boxShadow: "rgba(0, 0, 0, 0.3) 0px 1px 3px", ...c.style }}>
                  <div className="absolute rounded-full" style={{ inset: 2, border: "2px solid rgb(253, 224, 71)" }} />
                </div>
              ))}
              <span className="absolute text-white" style={{ top: "8%", left: "20%", fontSize: 14 }}>✦</span>
              <span className="absolute text-white" style={{ bottom: "35%", right: "8%", fontSize: 11.2 }}>✦</span>
              <span className="absolute text-white" style={{ top: "40%", left: "3%", fontSize: 8.4 }}>✦</span>
              <div className="relative" style={{ width: 140, height: 196 }}>
                <div className="absolute rounded-b-lg" style={{ left: 2, right: -2, bottom: -3, height: 196, backgroundColor: "rgb(92, 22, 18)" }} />
                <div className="absolute rounded-r-lg" style={{ top: 2, bottom: -2, right: -3, width: 140, backgroundColor: "rgb(107, 29, 24)" }} />
                <div className="absolute inset-0 overflow-hidden rounded-lg" style={{ backgroundColor: "rgb(185, 28, 28)", boxShadow: "rgba(0, 0, 0, 0.3) 0px 4px 20px" }}>
                  <div className="absolute left-0 right-0 top-0" style={{ height: 4, backgroundColor: "rgb(251, 191, 36)" }} />
                  <div className="absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full shadow-lg" style={{ width: 63, height: 63, background: "radial-gradient(circle, rgb(251, 191, 36) 0%, rgb(217, 119, 6) 100%)", border: "3px solid rgb(254, 243, 199)" }}>
                    <span className="font-bold" style={{ fontSize: 30.8, color: "rgb(185, 28, 28)", lineHeight: 1, textShadow: "rgba(0, 0, 0, 0.2) 1px 1px 2px" }}>囍</span>
                  </div>
                </div>
              </div>
            </div>
            <p className="absolute -bottom-2 left-1/2 -translate-x-1/2 whitespace-nowrap text-xs font-medium" style={{ color: "rgb(70, 70, 70)" }}>Nhấn để mở</p>
          </button>
        </div>
      </div>

      {giftOpen ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-center" onClick={() => setGiftOpen(false)}>
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto sm:max-w-xl" style={{ backgroundColor: palette.modalBg }} onClick={(e) => e.stopPropagation()}>
            <div className="relative px-6 pb-4 pt-6 text-center" style={{ backgroundColor: palette.accent }}>
              <button type="button" onClick={() => setGiftOpen(false)} aria-label="Đóng" className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full text-white/80 hover:bg-white/20 hover:text-white">✕</button>
              <h2 className="text-[20px] font-bold uppercase tracking-wide text-white md:text-[24px]" style={{ textShadow: "rgba(0, 0, 0, 0.2) 1px 1px 2px", fontFamily: 'Baskerville, "Times New Roman", serif' }}>Phong Bao Mừng Cưới</h2>
            </div>
            <div className="p-4 sm:p-6">
              <div className="flex flex-col items-center gap-4 sm:flex-row sm:flex-wrap sm:items-start sm:justify-center" style={{ color: "rgb(70, 70, 70)" }}>
                {banks.map((q) => {
                  const qr = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(`${q.bank} ${q.num} ${q.name}`)}`;
                  return (
                    <div key={q.title} className="flex max-w-[180px] flex-1 flex-col items-center sm:max-w-none">
                      <h3 className="mb-2 line-clamp-2 flex min-h-[2rem] items-start justify-center text-center text-xs font-medium" style={{ color: palette.accent }}>{q.title}</h3>
                      <div className="flex h-32 w-32 items-center justify-center rounded-xl bg-white p-2 shadow-lg sm:h-40 sm:w-40" style={{ border: `2px solid ${hexToRgba(palette.accent, 0.125)}` }}>
                        <img alt={`QR - ${q.title}`} className="h-full w-full object-contain" src={qr} />
                      </div>
                      <div className="mt-2 space-y-0.5 text-center">
                        <p className="text-[10px]" style={{ color: "rgb(70, 70, 70)" }}>{q.bank}</p>
                        <p className="font-mono text-[10px]" style={{ color: "rgb(70, 70, 70)" }}>{q.num}</p>
                        <p className="text-[10px] font-semibold" style={{ color: "rgb(70, 70, 70)" }}>{q.name}</p>
                      </div>
                      <a href={qr} target="_blank" rel="noreferrer" className="mt-1.5 inline-flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-medium" style={{ color: palette.accent, backgroundColor: hexToRgba(palette.accent, 0.082) }}>Lưu QR</a>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      ) : null}

      <div className="relative z-10 mx-auto max-w-4xl px-2 py-8 text-center sm:px-4">
        <span className="flex flex-col items-center gap-1 whitespace-pre-line text-xl" style={{ color: palette.gray, fontFamily: 'Baskerville, "Times New Roman", serif' }}>Sự hiện diện của quý khách là niềm vinh hạnh của gia đình chúng tôi!</span>
      </div>
      <footer className="flex w-full items-center justify-center py-1.5" style={{ backgroundColor: palette.cardBg }}>
        <a href="https://thiepmungonline.com" target="_blank" rel="noopener noreferrer" className="text-xs opacity-50 transition-opacity hover:opacity-70" style={{ color: palette.gray }}>♡ thiepmungonline.com</a>
      </footer>
    </div>
  );
}

const NB_PACIFICO = '"SVN-HC Pacifico", cursive';
const NB_TITLING = '"SVN-HC Built Titling", "Times New Roman", serif';
const NB_CAROSELLO = '"SVN-HC Carosello", cursive';
const NB_HELV = 'HelveticaNeue, "Helvetica Neue", Helvetica, Arial, sans-serif';

function NhatBinhHeading({ children, red, small = false }: { children: React.ReactNode; red: string; small?: boolean }) {
  return (
    <h2
      className={`text-center uppercase ${small ? "text-[21px] md:text-[25px] lg:text-[32px]" : "text-[30px] md:text-[35px] lg:text-[45px]"}`}
      style={{ fontFamily: NB_TITLING, color: red, fontWeight: 400, letterSpacing: "0.02em" }}
    >
      {children}
    </h2>
  );
}

function NhatBinhWishForm({ red, brown }: { red: string; brown: string }) {
  const { formProps, pending, state } = useWishFormBinding();

  return (
    <form {...formProps} className="mx-auto mt-8 w-full max-w-full md:max-w-[600px]">
      <div className="flex flex-col gap-3">
        <input name="name" required maxLength={120} className="w-full rounded-[6px] border bg-white/70 px-4 py-2.5 text-[13px] outline-none" style={{ borderColor: hexToRgba(red, 0.3), color: brown }} placeholder="Nhập tên của bạn*" />
        <textarea name="text" rows={3} required maxLength={1000} className="w-full rounded-[6px] border bg-white/70 px-4 py-2.5 text-[13px] outline-none" style={{ borderColor: hexToRgba(red, 0.3), color: brown }} placeholder="Nhập lời chúc của bạn*" />
        {state?.error ? <p className="text-[12px] text-red-600">{state.error}</p> : null}
        {state?.ok ? <p className="text-[12px]" style={{ color: red }}>Cảm ơn lời chúc của bạn!</p> : null}
        <div className="mt-1 flex items-center justify-end">
          <button type="submit" disabled={pending} className="rounded-full px-5 py-2 text-[12px] font-semibold uppercase tracking-wider disabled:opacity-60" style={{ backgroundColor: red, color: "#fff" }}>{pending ? "Đang gửi..." : "Gửi lời chúc"}</button>
        </div>
      </div>
    </form>
  );
}

/** Faithful rebuild of the Nhật Bình Đỏ (nhat-binh-red) opened invitation. */
function NhatBinhCover({
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
  const NB = `/chungdoi/images/themes/${content.theme.assetFolder || "nhat-binh-red"}`;
  const RED = content.theme.primaryColor || "#c32a29";
  const BROWN = "#542E08";
  const date = formatDate(content.couple.date);
  const groomShort = content.couple.groomShortName || "Thế Bảo";
  const brideShort = content.couple.brideShortName || "Ngọc Ánh";
  const names = content.couple.brideFirst ? [brideShort, groomShort] : [groomShort, brideShort];

  return (
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center overflow-hidden p-4"
      style={{
        background: "linear-gradient(165deg, #4a3428 0%, #352518 45%, #241a12 100%)",
        animation: opening ? "demo-cover-out 0.8s ease-in forwards" : undefined,
      }}
    >
      <ParticleField tokens={tokens} />
      {opening ? <BurstParticles tokens={tokens} /> : null}

      <div
        className="relative z-10 w-full max-w-[310px] sm:max-w-[340px] md:max-w-[560px]"
        style={{ animation: opening ? "demo-envelope-away 0.8s ease-in forwards" : undefined }}
      >
        {/* seal — cream 囍 mask on the red disc */}
        {opening ? (
          <span
            className="pointer-events-none absolute left-1/2 top-[50px] z-20 size-14 rounded-full"
            style={{
              transform: "translate(-50%, -50%)",
              border: `2px solid ${RED}`,
              animation: "demo-seal-ring 0.6s ease-out forwards",
            }}
          />
        ) : null}
        <div
          className="absolute left-1/2 top-[50px] z-30 flex size-[56px] items-center justify-center rounded-full"
          style={{
            transform: "translate(-50%, -50%)",
            background: `radial-gradient(circle at 30% 30%, ${RED}, ${hexToRgba(RED, 0.85)})`,
            boxShadow: `0 4px 20px ${hexToRgba(RED, 0.5)}, inset 0 2px 4px rgba(255,255,255,0.3)`,
            animation: opening
              ? "demo-seal-break 0.5s ease-in forwards"
              : "demo-seal-pulse 2s ease-in-out infinite",
          }}
        >
          <span
            className="block size-8"
            style={{
              backgroundColor: "#f8f3e0",
              opacity: 0.9,
              WebkitMaskImage: `url('${NB}/chinese_happiness.webp')`,
              maskImage: `url('${NB}/chinese_happiness.webp')`,
              WebkitMaskSize: "contain",
              maskSize: "contain",
              WebkitMaskRepeat: "no-repeat",
              maskRepeat: "no-repeat",
              WebkitMaskPosition: "center",
              maskPosition: "center",
            }}
          />
        </div>

        <div
          className="relative rounded-lg"
          style={{ boxShadow: "0 25px 60px -12px rgba(0,0,0,0.45), 0 8px 24px rgba(0,0,0,0.2)" }}
        >
          {/* base cream layer + 4 decorations (opacity 0.42) */}
          <div
            className="absolute inset-0 overflow-hidden rounded-lg"
            style={{
              background: "linear-gradient(to bottom right, #f8f3e0, #efe6d0, #f8f3e0)",
              border: `1px solid ${hexToRgba(RED, 0.15)}`,
            }}
          >
            <img
              src={`${NB}/hoa.webp`}
              alt=""
              aria-hidden="true"
              className="pointer-events-none absolute left-[calc(2.5rem-30px)] top-[calc(3.5rem+50px+30px)] z-0 max-h-[min(150px,32vh)] w-[min(150px,40%)] max-w-[min(200px,46%)] origin-top-left object-contain opacity-[0.42] [transform:scaleY(-1)_rotate(20deg)] sm:left-[calc(3rem-30px)] sm:top-[calc(4rem+50px+30px)] sm:w-[min(165px,38%)] md:left-[calc(3.5rem-30px)] md:top-[calc(4.75rem+50px+30px)] md:max-h-[170px] md:w-[min(175px,36%)]"
            />
            <img
              src={`${NB}/long-den.webp`}
              alt=""
              aria-hidden="true"
              className="pointer-events-none absolute right-0 top-0 w-[52px] min-w-[48px] max-w-[18%] -translate-x-[10px] -translate-y-[15px] object-contain opacity-[0.42] sm:right-1 sm:top-1 sm:w-14 md:-top-0.5 md:right-2 md:w-16 md:max-w-[85px]"
            />
            <img
              src={`${NB}/quat.webp`}
              alt=""
              aria-hidden="true"
              className="pointer-events-none absolute bottom-3 left-1 z-0 max-h-[min(276px,50vh)] w-[min(228px,72%)] origin-center -translate-x-[100px] translate-y-[30px] rotate-45 object-contain opacity-[0.42] sm:bottom-4 sm:left-2 sm:w-[min(252px,68%)] md:bottom-5 md:left-3 md:max-h-[300px]"
            />
            <img
              src={`${NB}/may.webp`}
              alt=""
              aria-hidden="true"
              className="pointer-events-none absolute bottom-3 right-1 z-0 max-h-[min(264px,48vh)] w-[min(300px,78%)] origin-center -scale-x-100 translate-x-[150px] translate-y-[40px] object-contain opacity-[0.42] sm:bottom-4 sm:right-2 sm:w-[min(330px,74%)] md:bottom-5 md:right-3 md:max-h-[288px]"
            />
          </div>

          {/* text layer */}
          <div className="relative z-10 px-6 pb-14 pt-24 text-center md:pb-10">
            <h1 className="mb-2 flex flex-col items-center leading-tight">
              <span className="block w-full" style={{ fontFamily: NB_PACIFICO, color: RED, fontSize: "30px" }}>
                {names[0]}
              </span>
              <span
                className="my-1 block w-full leading-none"
                style={{ fontFamily: 'Baskerville, "Times New Roman", serif', color: BROWN, fontSize: "18px" }}
              >
                &amp;
              </span>
              <span className="block w-full" style={{ fontFamily: NB_PACIFICO, color: RED, fontSize: "30px" }}>
                {names[1]}
              </span>
            </h1>

            <div className="mb-3 flex items-center justify-center gap-3">
              <span className="h-px w-10" style={{ background: `linear-gradient(to right, transparent, ${RED})` }} />
              <span className="text-sm" style={{ color: RED, opacity: 0.7 }}>
                ❦
              </span>
              <span className="h-px w-10" style={{ background: `linear-gradient(to left, transparent, ${RED})` }} />
            </div>

            {date ? (
              <p className="mb-5 text-[18px]" style={{ color: hexToRgba(BROWN, 0.88) }}>
                {date.dayNumber} tháng {date.monthNumber}, {date.yearNumber}
              </p>
            ) : null}

            <div className="mb-6">
              <p className="mb-2 text-[16px] font-light" style={{ color: hexToRgba(BROWN, 0.88) }}>
                Thân Mời
              </p>
              <div className="mb-2 inline-block rounded-xl px-5 py-2.5" style={{ backgroundColor: hexToRgba(BROWN, 0.06) }}>
                <h2 className="text-lg font-semibold sm:text-xl" style={{ color: BROWN }}>
                  Gia đình em Tính &amp; Tuyết
                </h2>
              </div>
              <p className="mx-auto max-w-xs text-[15px] font-light" style={{ color: hexToRgba(BROWN, 0.88) }}>
                Dự tiệc chung vui cùng anh chị
              </p>
            </div>

            <button
              type="button"
              onClick={onOpen}
              className="demo-shine relative mx-auto inline-flex items-center justify-center overflow-hidden rounded-full px-8 py-2.5 text-lg font-semibold shadow-lg transition hover:-translate-y-0.5"
              style={{ backgroundColor: RED, color: "#f8f3e0" }}
            >
              Mở thiệp
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

const NB_CORNER_W = "w-[clamp(45px,15vw,80px)] md:w-[clamp(68px,14vw,104px)] lg:w-[clamp(76px,12vw,112px)]";

function NhatBinhSectionCorners({ nb, bottomOffsetClass = "bottom-[-15px]" }: { nb: string; bottomOffsetClass?: string }) {
  return (
    <div className="pointer-events-none absolute inset-0 z-[3]" aria-hidden="true">
      <img src={`${nb}/corner.webp`} alt="" aria-hidden="true" className={`pointer-events-none absolute left-0 top-[-10px] h-auto object-contain md:top-[-5px] ${NB_CORNER_W}`} />
      <div className={`pointer-events-none absolute right-0 top-[-10px] flex h-fit shrink-0 justify-end overflow-hidden md:top-[-5px] ${NB_CORNER_W}`}>
        <img src={`${nb}/corner.webp`} alt="" aria-hidden="true" className="pointer-events-none h-auto w-full max-w-none object-contain [transform:scaleX(-1)]" />
      </div>
      <div className={`pointer-events-none absolute ${bottomOffsetClass} left-0 flex h-fit shrink-0 items-end justify-start overflow-hidden ${NB_CORNER_W}`}>
        <img src={`${nb}/corner.webp`} alt="" aria-hidden="true" className="pointer-events-none h-auto w-full max-w-none object-contain [transform:scaleY(-1)]" />
      </div>
      <div className={`pointer-events-none absolute ${bottomOffsetClass} right-0 flex h-fit shrink-0 items-end justify-end overflow-hidden ${NB_CORNER_W}`}>
        <img src={`${nb}/corner.webp`} alt="" aria-hidden="true" className="pointer-events-none h-auto w-full max-w-none object-contain [transform:scaleX(-1)_scaleY(-1)]" />
      </div>
    </div>
  );
}

const NB_CLOUD_LAYERS = [
  { top: "8%", side: "right" as const, opacity: 0.3, speed: 0.04 },
  { top: "22%", side: "left" as const, opacity: 0.3, speed: 0.06 },
  { top: "36%", side: "right" as const, opacity: 0.3, speed: 0.05 },
  { top: "50%", side: "left" as const, opacity: 0.3, speed: 0.07 },
  { top: "64%", side: "right" as const, opacity: 0.3, speed: 0.03 },
  { top: "78%", side: "left" as const, opacity: 0.3, speed: 0.055 },
  { top: "92%", side: "right" as const, opacity: 0.8, speed: 0.045 },
];

function NhatBinhCloudBackground({ nb }: { nb: string }) {
  return (
    <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden" aria-hidden="true">
      {NB_CLOUD_LAYERS.map((c, i) => (
        <div
          key={i}
          className="pointer-events-none absolute"
          style={{ width: "168%", maxWidth: 1300, top: c.top, [c.side]: "25%", opacity: c.opacity }}
        >
          <div data-parallax={c.speed} className="will-change-transform">
            <img src={`${nb}/may.webp`} alt="" aria-hidden="true" className="block h-auto w-full" />
          </div>
        </div>
      ))}
    </div>
  );
}

function NhatBinhInvitation({ content }: { content: ChungDoiDemoContent }) {
  const { couple, families, venue, schedule, gallery, wishes } = content;
  const NB = `/chungdoi/images/themes/${content.theme.assetFolder || "nhat-binh-red"}`;
  const RED = content.theme.primaryColor || "#c32a29";
  const BROWN = "#542E08";
  const CREAM = "#F8F3E0";
  const groomShort = couple.groomShortName || "Thế Bảo";
  const brideShort = couple.brideShortName || "Ngọc Ánh";
  const ceremony = formatDate(couple.ceremonyDate || couple.date);
  const reception = formatDate(couple.date);
  const calendar = buildCalendar(couple.date);
  const galleryShown = gallery.slice(0, 4);
  const galleryExtra = Math.max(0, gallery.length - 4);
  const mapQuery = venue.mapAddress || venue.address.replace(/\n+/g, ", ").trim();
  const LUNAR = "(Tức ngày 17/03 năm Bính Ngọ)";
  const [giftOpen, setGiftOpen] = useState(false);
  const banks = ([
    { title: `Chú Rể - ${content.bank.groomAccountName}`, bank: content.bank.groomBankName, num: content.bank.groomAccountNumber, name: content.bank.groomAccountName },
    { title: `Cô Dâu - ${content.bank.brideAccountName}`, bank: content.bank.brideBankName, num: content.bank.brideAccountNumber, name: content.bank.brideAccountName },
  ] as const).filter((q) => q.bank);

  const parallaxRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const root = parallaxRef.current;
    if (!root) return;
    const layers = Array.from(root.querySelectorAll<HTMLElement>("[data-parallax]"));
    let raf = 0;
    const update = () => {
      raf = 0;
      const scrolled = -root.getBoundingClientRect().top;
      for (const el of layers) {
        const speed = Number(el.dataset.parallax) || 0;
        el.style.transform = `translateY(${(scrolled * speed).toFixed(2)}px)`;
      }
    };
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(update); };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => { window.removeEventListener("scroll", onScroll); cancelAnimationFrame(raf); };
  }, []);

  return (
    <div className="flex w-full justify-center overflow-x-clip bg-white" style={{ color: BROWN }}>
      <div ref={parallaxRef} className="relative w-full max-w-[480px] overflow-hidden pb-8 md:mx-auto md:max-w-[900px] md:border" style={{ backgroundColor: CREAM, borderColor: hexToRgba(RED, 0.18), fontFamily: '"HelveticaNeue", sans-serif' }}>
        {/* paper texture overlay */}
        <div
          className="pointer-events-none absolute inset-0 z-0"
          aria-hidden="true"
          style={{ opacity: 0.15, backgroundImage: `url("${NB}/paper.webp")`, backgroundRepeat: "repeat-y", backgroundPosition: "center top", backgroundSize: "100%" }}
        />
        {/* header collage */}
        <header className="relative z-10 flex w-full flex-col items-center pt-[calc(clamp(75px,calc(5vw+45px),140px)+30px)] md:pt-[calc(clamp(75px,calc(5vw+45px),140px)+50px)]" aria-label="Đầu thiệp">
          <p
            className="relative z-20 max-w-[95%] text-center uppercase"
            style={{ fontFamily: NB_PACIFICO, color: RED, fontSize: "clamp(20px, 5.5vw, 40px)", lineHeight: 1.2, letterSpacing: "0.03em", WebkitTextStroke: "1px #f8c88b", paintOrder: "stroke" }}
          >
            {groomShort} &amp; {brideShort}
          </p>
          <div className="relative z-10 mt-2 h-[min(92vw,420px)] w-full max-w-[480px] md:h-[480px] md:max-w-[769px]">
            {/* 囍 double-happiness */}
            <div data-parallax="0.12" className="pointer-events-none absolute z-[4] left-1/2 top-[calc(14%_-_35px)] w-[75%] max-w-[736px] translate-x-[calc(-50%_+_35px)] md:w-[54.6%] md:max-w-[416px] md:translate-x-[calc(-50%_+_50px)]" style={{ willChange: "transform" }}>
              <img src={`${NB}/chu-hy.webp`} alt="" aria-hidden="true" className="h-auto w-full object-contain" />
            </div>
            {/* fan */}
            <div data-parallax="0.16" className="pointer-events-none absolute z-[2] left-[calc(18%_-_65px)] top-[36%] w-[55%] max-w-[398px] md:left-[calc(18%_-_20px)] md:top-[calc(36%_+_50px)] md:w-[29.9%] md:max-w-[225px]" style={{ willChange: "transform" }}>
              <img src={`${NB}/quat.webp`} alt="" aria-hidden="true" className="h-auto w-full object-contain" />
            </div>
            {/* cloud swoosh */}
            <div data-parallax="0.08" className="pointer-events-none absolute z-[3] left-1/2 top-[calc(42%_+_100px)] w-[85%] max-w-[892px] -translate-x-1/2 md:top-[calc(42%_+_140px)] md:w-[66.3%] md:max-w-[504px]" style={{ willChange: "transform" }}>
              <img src={`${NB}/may-to.webp`} alt="" aria-hidden="true" className="h-auto w-full object-contain" />
            </div>
            {/* bride & groom illustration */}
            <div className="pointer-events-none absolute z-[9] left-1/2 top-[calc(22%_+_40px)] w-[70%] max-w-[653px] -translate-x-1/2 md:w-[48.1%] md:max-w-[369px]">
              <img src={`${NB}/dau-re.webp`} alt="" aria-hidden="true" className="h-auto w-full object-contain" />
            </div>
            {/* Nhà có hỷ */}
            <div
              data-parallax="0.1"
              className="pointer-events-none absolute z-[10] text-center left-[calc(3%_+_25px)] md:left-[calc(3%_+_100px)] [-webkit-text-stroke:3px_#FAD9B0] md:[-webkit-text-stroke:5px_#FAD9B0] [paint-order:stroke_fill]"
              style={{ top: "calc(52% + 120px)", color: "#CD211C", fontFamily: '"SVN-HC Marvin Visions", sans-serif', fontSize: "clamp(28px, 5vw, 52px)", lineHeight: 1, willChange: "transform" }}
            >
              <div className="inline-block">
                <p className="mb-0">Nhà</p>
                <p className="mb-0">có</p>
                <p>hỷ</p>
              </div>
            </div>
            {/* peach branch — top-left, flipped */}
            <div className="pointer-events-none absolute z-[6] w-[280px] max-w-full -left-10 top-[65px] md:w-[320px] md:max-w-[min(320px,46%)] md:-left-12 md:top-[78px] lg:w-[456px] lg:max-w-[min(456px,53%)] lg:-left-14 lg:top-[calc(86px-1cm)]">
              <div className="w-full" style={{ transformOrigin: "left top", transform: "scaleY(-1) rotate(20deg)" }}>
                <img src={`${NB}/hoa.webp`} alt="" aria-hidden="true" className="h-auto w-full object-contain" />
              </div>
            </div>
            {/* lantern */}
            <div data-parallax="0.2" className="pointer-events-none absolute z-[7] w-[8%] min-w-[48px] max-w-[63px] top-[calc(4%_-_180px)] right-[calc(6%_-_15px)] md:w-[9.2%] md:min-w-[63px] md:max-w-[85px] md:top-[calc(4%_-_246px)] md:right-[calc(6%_-_24px)] lg:min-w-[67px] lg:max-w-[90px] lg:top-[calc(4%_-_276px)]" style={{ willChange: "transform" }}>
              <img src={`${NB}/long-den.webp`} alt="" aria-hidden="true" className="h-auto w-full object-contain" />
            </div>
          </div>
        </header>

        {/* body — single wrapper with scattered-cloud background */}
        <div className="relative z-10 pt-[280px] md:pt-[350px] lg:pt-[380px]">
          <NhatBinhCloudBackground nb={NB} />

        {/* Thông Tin Lễ Cưới */}
        <section className="relative z-[2] px-6 py-10 md:px-10 md:py-14">
          <NhatBinhSectionCorners nb={NB} />
          <NhatBinhHeading red={RED}>Thông Tin Lễ Cưới</NhatBinhHeading>
          <div className="relative mx-auto mt-8 grid w-full max-w-[366px] grid-cols-[1fr_auto_1fr] items-start gap-3 text-center md:max-w-[520px] md:gap-6 lg:max-w-[600px]">
            <FamilyColumn title={families.groomParentTitle || "Ông Bà"} a={families.groomFather} b={families.groomMother} addr={families.groomAddress} />
            <div className="flex h-[50px] w-0 shrink-0 items-center justify-center self-stretch px-0 md:h-[64px]">
              <div className="h-full w-px" style={{ backgroundColor: BROWN }} />
            </div>
            <FamilyColumn title={families.brideParentTitle || "Ông Bà"} a={families.brideFather} b={families.brideMother} addr={families.brideAddress} />
          </div>
          <div className="mt-10 flex w-full flex-col items-center gap-1 text-center md:gap-2">
            <FitText maxFontSize={82} className="flex w-[90%] items-center justify-center leading-tight md:w-[95%] md:leading-snug [-webkit-text-stroke:3px_#F8C88B] md:[-webkit-text-stroke:4px_#F8C88B] lg:[-webkit-text-stroke:5px_#F8C88B] [paint-order:stroke_fill]" style={{ fontFamily: NB_PACIFICO, color: RED, letterSpacing: "0.025em" }}>{couple.groomFullName}</FitText>
            <div className="text-[14px] uppercase md:text-[17px]" style={{ fontFamily: '"HelveticaNeue", sans-serif', color: BROWN }}>{couple.groomBirthOrder || "Trưởng Nam"}</div>
            <div className="text-[58px] md:text-[77px] lg:text-[86px]" style={{ fontFamily: NB_CAROSELLO, color: RED }}>&amp;</div>
            <FitText maxFontSize={82} className="flex w-[90%] items-center justify-center leading-tight md:w-[95%] md:leading-snug [-webkit-text-stroke:3px_#F8C88B] md:[-webkit-text-stroke:4px_#F8C88B] lg:[-webkit-text-stroke:5px_#F8C88B] [paint-order:stroke_fill]" style={{ fontFamily: NB_PACIFICO, color: RED, letterSpacing: "0.025em" }}>{couple.brideFullName}</FitText>
            <div className="text-[14px] uppercase md:text-[17px]" style={{ fontFamily: NB_HELV, color: BROWN }}>{couple.brideBirthOrder || "Út Nữ"}</div>
          </div>
          {ceremony ? (
            <div className="mt-10 flex flex-col items-center gap-4 text-center md:gap-5" style={{ fontFamily: NB_HELV, color: BROWN }}>
              <div className="flex flex-col items-center gap-2">
                <span className="whitespace-pre-line text-center font-bold text-[15px] md:text-[19px] lg:text-[20px]">{couple.ceremonyHeader || "LỄ THÀNH HÔN ĐƯỢC CỬ HÀNH TẠI\nTƯ GIA"}</span>
                <p className="text-center font-bold uppercase text-[15px] md:text-[19px] lg:text-[20px]">VÀO LÚC</p>
              </div>
              <div className="text-[20px] md:text-[30px]">{couple.ceremonyTime || "09:00"}</div>
              <div className="flex items-center justify-center gap-2 md:gap-3">
                <span className="text-right font-bold text-[15px] uppercase md:text-[18px] lg:text-[19px]">{ceremony.weekday}</span>
                <div className="shrink-0" style={{ width: "30px", height: "1px", transform: "rotate(90deg)", backgroundColor: BROWN }} />
                <span className="text-[36px] font-bold leading-none md:text-[42px] lg:text-[46px]">{ceremony.day}</span>
                <div className="shrink-0" style={{ width: "30px", height: "1px", transform: "rotate(90deg)", backgroundColor: BROWN }} />
                <span className="text-left font-bold text-[15px] uppercase md:text-[18px] lg:text-[19px]">Tháng {ceremony.month}</span>
              </div>
              <div className="text-[22px] font-bold md:text-[26px] lg:text-[28px]">{ceremony.yearNumber}</div>
              <div className="font-bold text-[15px] md:text-[18px] lg:text-[19px]">{LUNAR}</div>
            </div>
          ) : null}
        </section>


        {/* Album Ảnh Cưới */}
        {galleryShown.length > 0 ? (
          <>
            <section className="relative z-[2] px-6 py-10 md:px-10 md:py-14">
              <NhatBinhHeading red={RED}>Album Ảnh Cưới</NhatBinhHeading>
              <div className="mx-auto mt-8 grid max-w-[560px] grid-cols-2 gap-3 md:gap-4">
                {galleryShown.map((src, i) => {
                  const isLast = i === galleryShown.length - 1;
                  return (
                    <div key={src} className="group relative aspect-square cursor-pointer overflow-hidden rounded-xl border" style={{ borderColor: hexToRgba(BROWN, 0.2), backgroundColor: hexToRgba(BROWN, 0.03) }}>
                      <img src={src} alt={`Ảnh cưới ${i + 1}`} className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-[1.03]" />
                      {isLast && galleryExtra > 0 ? (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/55">
                          <span className="text-lg font-semibold text-white">+{galleryExtra}</span>
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            </section>
          </>
        ) : null}

        {/* Thông Tin Tiệc Cưới */}
        {reception ? (
          <section className="relative z-[2] flex flex-col items-center gap-8 px-6 py-10 text-center md:gap-12 md:py-14" style={{ fontFamily: NB_HELV, color: BROWN }}>
            <NhatBinhSectionCorners nb={NB} bottomOffsetClass="bottom-[20px]" />
            <NhatBinhHeading red={RED}>Thông Tin Tiệc Cưới</NhatBinhHeading>
            <div className="flex flex-col items-center gap-4 md:gap-5">
              <h3 className="flex flex-col items-center text-center font-bold uppercase text-[19px] md:text-[33px] lg:text-[36px]" style={{ fontFamily: NB_TITLING, fontWeight: 400, letterSpacing: "0.02em" }}>Tiệc cưới sẽ diễn ra vào lúc:</h3>
              <div className="text-[26px] md:text-[38px]">{venue.banquetTime || couple.time}</div>
              <div className="flex items-center justify-center gap-6 font-bold">
                <span className="text-right text-[15px] uppercase tracking-wide md:text-[20px]">{reception.weekday}</span>
                <div className="shrink-0" style={{ width: "34px", height: "1px", transform: "rotate(90deg)", backgroundColor: BROWN }} />
                <span className="text-[38px] font-bold leading-none md:text-[50px]">{reception.day}</span>
                <div className="shrink-0" style={{ width: "34px", height: "1px", transform: "rotate(90deg)", backgroundColor: BROWN }} />
                <span className="text-left text-[15px] uppercase tracking-wide md:text-[20px]">Tháng {reception.month}</span>
              </div>
              <div className="text-[23px] font-bold md:text-[31px]">{reception.yearNumber}</div>
              <div className="text-[15px] uppercase tracking-[0.2em] md:text-[18px]">{LUNAR}</div>
              <div className="mt-4 flex items-center justify-center gap-8">
                <div className="flex flex-col items-center">
                  <span className="text-sm uppercase tracking-wider md:text-[15px]">Đón khách</span>
                  <span className="mt-1 text-xl font-bold md:mt-1.5 md:text-2xl">{schedule[0]?.time || "17:30"}</span>
                </div>
                <div className="flex flex-col items-center">
                  <span className="text-sm uppercase tracking-wider md:text-[15px]">Khai tiệc</span>
                  <span className="mt-1 text-xl font-bold md:mt-1.5 md:text-2xl">{venue.banquetTime || couple.time}</span>
                </div>
              </div>
            {calendar ? (
              <div className="mx-auto mt-2 w-[296px] max-w-full md:w-[352px]">
                <div className="mx-auto w-full overflow-hidden rounded-lg border" style={{ borderColor: hexToRgba(RED, 0.25) }}>
                  <div className="py-2.5 text-center text-[13px] font-semibold tracking-wide md:text-[14px]" style={{ backgroundColor: RED, color: "#fff" }}>Tháng {calendar.month} / {calendar.year}</div>
                  <div className="grid grid-cols-7 border-b-2" style={{ borderColor: hexToRgba(RED, 0.15) }}>
                    {WEEKDAY_LABELS.map((d) => (<div key={d} className="py-1.5 text-center text-[10px] font-medium opacity-60 md:text-[11px]">{d}</div>))}
                  </div>
                  <div className="grid grid-cols-7 gap-y-0.5 px-1 py-2">
                    {calendar.cells.map((day, i) => (
                      <div key={i} className="flex h-[30px] items-center justify-center md:h-[34px]">
                        {day === calendar.highlight ? (
                          <span className="flex size-7 items-center justify-center rounded-full text-[11px] font-bold text-white md:text-[12px]" style={{ backgroundColor: RED }}>{day}</span>
                        ) : day ? (<span className="text-[12px] md:text-[13px]">{day}</span>) : null}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : null}
              <a href={googleCalendarUrl(content)} target="_blank" rel="noopener noreferrer" className="mt-4 inline-flex items-center justify-center text-sm tracking-wide underline decoration-1 underline-offset-4 transition-opacity hover:opacity-70 md:text-base" style={{ color: BROWN }}>Thêm vào lịch</a>
            </div>
            <div className="mt-2 flex w-full flex-col items-center justify-center">
              <button type="button" className="inline-flex min-h-[42px] items-center justify-center rounded-full px-6 text-sm font-semibold leading-none tracking-wide transition-transform hover:scale-[1.03] md:min-h-[46px] md:text-base" style={{ backgroundColor: RED, color: CREAM }}>XÁC NHẬN</button>
            </div>
          </section>
        ) : null}

        {mapQuery ? (
          <section className="relative z-[2] mt-6 w-full px-2 py-[10px] md:px-10 md:py-[15px] lg:py-[20px]">
            <div className="relative text-center">
              <h3 className="flex flex-col items-center text-center text-[30px] font-bold uppercase md:text-[35px] lg:text-[45px]" style={{ color: RED, fontFamily: NB_TITLING, fontWeight: 400, letterSpacing: "0.02em" }}>
                <span>Tiệc cưới sẽ tổ chức tại</span>
              </h3>
              <div className="mx-auto mt-2 max-w-[280px] whitespace-pre-line text-center text-[15px] leading-snug md:mt-3 md:max-w-md md:text-[18px] lg:max-w-lg lg:text-[20px]" style={{ color: BROWN, fontFamily: NB_HELV }}>{venue.address}</div>
            </div>
            <iframe src={mapEmbedUrl(mapQuery)} title={mapQuery} className="mx-auto mt-2 h-[240px] w-full max-w-[338px] overflow-hidden rounded-[15px] md:h-[320px] md:max-w-[560px] lg:h-[340px] lg:max-w-[600px]" loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
          </section>
        ) : null}


        {/* Lịch Trình Ngày Cưới */}
        {schedule.length > 0 ? (
          <>
            <section className="relative z-[2] px-6 py-10 md:px-10 md:py-14">
              <NhatBinhHeading red={RED}>Lịch Trình Ngày Cưới</NhatBinhHeading>
              <ol className="mx-auto mt-8 grid max-w-[420px] grid-cols-[1fr_auto_1fr] items-stretch gap-x-4">
                {schedule.map((s, i) => (
                  <li key={`${s.time}-${i}`} className="contents">
                    <span className="pt-0.5 text-right text-[16px] font-semibold tabular-nums md:text-[17px]" style={{ color: RED }}>{s.time}</span>
                    <span className="relative flex items-center justify-center self-stretch">
                      {i > 0 ? <span className="absolute left-1/2 top-0 -mt-4 h-4 w-px -translate-x-1/2" style={{ backgroundColor: hexToRgba(RED, 0.3) }} /> : null}
                      <span className="relative block size-2.5 rounded-full" style={{ backgroundColor: RED }} />
                      {i < schedule.length - 1 ? <span className="absolute bottom-0 left-1/2 -mb-4 h-4 w-px -translate-x-1/2" style={{ backgroundColor: hexToRgba(RED, 0.3) }} /> : null}
                    </span>
                    <span className="pb-6 pt-0.5 text-left text-[16px] leading-tight md:text-[18px]">{s.label}</span>
                  </li>
                ))}
              </ol>
            </section>
          </>
        ) : null}

        {/* Sổ lưu bút */}
        <section className="relative z-[2] px-6 py-10 md:px-10">
          <NhatBinhHeading red={RED}>Sổ lưu bút</NhatBinhHeading>
          <NhatBinhWishForm red={RED} brown={BROWN} />
          <div className="mx-auto mt-8 w-full max-w-full md:max-w-[600px]">
            {wishes.length > 0 ? (
              <div className="space-y-3">
                {wishes.map((w, i) => (
                  <div key={`${w.name}-${i}`} className="rounded-lg border p-3 text-xs" style={{ borderColor: hexToRgba(RED, 0.2), backgroundColor: "#fff" }}>
                    <div className="flex items-start justify-between">
                      <span className="font-semibold" style={{ color: RED }}>{w.name}</span>
                      <span className="opacity-70">{formatWishTime(w.time)}</span>
                    </div>
                    <p className="mt-2 leading-relaxed">{w.text}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-sm opacity-70">Chưa có lời chúc nào. Hãy là người đầu tiên!</p>
            )}
          </div>
        </section>


        {/* Phong Bao Mừng Cưới */}
        {banks.length > 0 ? (
          <div className="relative z-[2] flex flex-col items-center justify-center px-2 py-[10px] text-center md:px-10 md:py-[15px] lg:py-[20px]">
            <h2 className="mb-4 flex flex-col items-center text-[21px] md:text-[25px] lg:text-[32px]" style={{ color: BROWN, fontFamily: NB_TITLING, fontWeight: 400, letterSpacing: "0.02em" }}>Phong Bao Mừng Cưới</h2>
            <button type="button" aria-label="Mở hộp mừng cưới" onClick={() => setGiftOpen(true)} className="group relative cursor-pointer border-none bg-transparent outline-none" style={{ width: 200, height: 256 }}>
              <div className="nhat-binh-envelope-wrapper relative flex h-full w-full items-center justify-center">
                {[
                  { w: 30.8, style: { top: "5%", right: "5%" } },
                  { w: 25.2, style: { top: "20%", left: "0%" } },
                  { w: 28, style: { bottom: "20%", right: "0%" } },
                  { w: 22.4, style: { bottom: "8%", left: "8%" } },
                  { w: 21, style: { top: "45%", right: "-5%" } },
                ].map((c, i) => (
                  <div key={i} className={`absolute rounded-full nhat-binh-coin-${i + 1}`} style={{ width: c.w, height: c.w, background: "rgb(251, 191, 36)", border: "2px solid rgb(245, 158, 11)", boxShadow: "rgba(0, 0, 0, 0.3) 0px 1px 3px", ...c.style }}>
                    <div className="absolute rounded-full" style={{ inset: 2, border: "2px solid rgb(253, 224, 71)" }} />
                    <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2" style={{ width: c.w * 0.28, height: c.w * 0.28, border: "2px solid rgb(217, 119, 6)", boxShadow: "rgba(0, 0, 0, 0.2) 1px 1px 2px inset" }} />
                  </div>
                ))}
                <span className="nhat-binh-sparkle absolute text-white" style={{ top: "8%", left: "20%", fontSize: 14 }}>✦</span>
                <span className="nhat-binh-sparkle nhat-binh-sparkle-2 absolute text-white" style={{ bottom: "35%", right: "8%", fontSize: 11.2 }}>✦</span>
                <span className="nhat-binh-sparkle nhat-binh-sparkle-3 absolute text-white" style={{ top: "40%", left: "3%", fontSize: 8.4 }}>✦</span>
                <div className="nhat-binh-envelope-body relative" style={{ width: 140, height: 196 }}>
                  <div className="absolute rounded-b-lg" style={{ left: 2, right: -2, bottom: -3, height: 196, backgroundColor: "rgb(92, 22, 18)" }} />
                  <div className="absolute rounded-r-lg" style={{ top: 2, bottom: -2, right: -3, width: 140, backgroundColor: "rgb(107, 29, 24)" }} />
                  <div className="nhat-binh-envelope-front absolute inset-0 overflow-hidden rounded-lg" style={{ backgroundColor: "rgb(185, 28, 28)", boxShadow: "rgba(0, 0, 0, 0.3) 0px 4px 20px" }}>
                    <div className="absolute inset-0 opacity-20" style={{ backgroundImage: "repeating-radial-gradient(circle at 0px 0px, transparent 0px, transparent 11.2px, rgb(127, 29, 29) 11.2px, rgb(127, 29, 29) 11.9px)", backgroundSize: "21px 21px", backgroundPosition: "10.5px 10.5px" }} />
                    <div className="absolute left-0 right-0 top-0" style={{ height: 4, backgroundColor: "rgb(251, 191, 36)" }} />
                    <div className="absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full shadow-lg" style={{ width: 63, height: 63, background: "radial-gradient(circle, rgb(251, 191, 36) 0%, rgb(217, 119, 6) 100%)", border: "3px solid rgb(254, 243, 199)" }}>
                      <span className="font-bold" style={{ fontSize: 30.8, color: "rgb(185, 28, 28)", lineHeight: 1, textShadow: "rgba(0, 0, 0, 0.2) 1px 1px 2px" }}>囍</span>
                    </div>
                    {([
                      { pos: "top-2 left-2", rot: 0 },
                      { pos: "top-2 right-2", rot: 90 },
                      { pos: "bottom-2 left-2", rot: -90 },
                      { pos: "bottom-2 right-2", rot: 180 },
                    ] as const).map((corner) => (
                      <svg key={corner.pos} className={`absolute ${corner.pos}`} width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" strokeWidth="2" style={{ transform: `rotate(${corner.rot}deg)` }}>
                        <path d="M2 2 L2 16 L6 16 L6 6 L16 6 L16 2 Z" opacity="0.85" strokeLinecap="square" strokeLinejoin="miter" />
                        <path d="M6 10 L10 10 L10 6" opacity="0.85" strokeLinecap="square" />
                      </svg>
                    ))}
                  </div>
                </div>
              </div>
              <p className="nhat-binh-hint-text absolute -bottom-2 left-1/2 -translate-x-1/2 whitespace-nowrap text-xs font-medium" style={{ color: BROWN }}>Nhấn để mở</p>
            </button>
          </div>
        ) : null}
        </div>

        {giftOpen ? (
          <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-center" onClick={() => setGiftOpen(false)}>
            <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto sm:max-w-xl" style={{ backgroundColor: CREAM }} onClick={(e) => e.stopPropagation()}>
              <div className="relative px-6 pb-4 pt-6 text-center" style={{ backgroundColor: RED }}>
                <button type="button" onClick={() => setGiftOpen(false)} aria-label="Đóng" className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full text-white/80 hover:bg-white/20 hover:text-white">✕</button>
                <h2 className="text-[21px] text-white md:text-[25px] lg:text-[32px]" style={{ textShadow: "rgba(0, 0, 0, 0.2) 1px 1px 2px", fontFamily: NB_TITLING, fontWeight: 400, letterSpacing: "0.02em" }}>Phong Bao Mừng Cưới</h2>
              </div>
              <div className="p-4 sm:p-6">
                <div className="flex flex-col items-center gap-4 sm:flex-row sm:flex-wrap sm:items-start sm:justify-center" style={{ color: BROWN }}>
                  {banks.map((q) => {
                    const qr = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(`${q.bank} ${q.num} ${q.name}`)}`;
                    return (
                      <div key={q.title} className="flex max-w-[180px] flex-1 flex-col items-center sm:max-w-none">
                        <h3 className="mb-2 line-clamp-2 flex min-h-[2rem] items-start justify-center text-center text-xs font-medium" style={{ color: RED }}>{q.title}</h3>
                        <div className="flex h-32 w-32 items-center justify-center rounded-xl bg-white p-2 shadow-lg sm:h-40 sm:w-40" style={{ border: `2px solid ${hexToRgba(RED, 0.125)}` }}>
                          <img alt={`QR - ${q.title}`} className="h-full w-full object-contain" src={qr} />
                        </div>
                        <div className="mt-2 space-y-0.5 text-center">
                          <p className="text-[10px]" style={{ color: BROWN }}>{q.bank}</p>
                          <p className="font-mono text-[10px]" style={{ color: BROWN }}>{q.num}</p>
                          <p className="text-[10px] font-semibold" style={{ color: BROWN }}>{q.name}</p>
                        </div>
                        <a href={qr} target="_blank" rel="noreferrer" className="mt-1.5 inline-flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-medium" style={{ color: RED, backgroundColor: hexToRgba(RED, 0.082) }}>Lưu QR</a>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        ) : null}

        <footer className="relative z-[2] mx-auto flex w-full max-w-[329px] flex-col items-center px-4 py-[10px] text-center md:max-w-2xl md:px-10 md:py-[15px] lg:py-[20px]">
          <span className="flex flex-col items-center gap-1 whitespace-pre-line text-[14px] leading-normal md:text-base lg:text-lg" style={{ color: BROWN, fontFamily: NB_HELV }}>Sự hiện diện của quý khách là niềm vinh hạnh của gia đình chúng tôi!</span>
        </footer>
        <div className="absolute bottom-2 left-0 right-0 z-20 flex items-center justify-center" style={{ color: BROWN, fontFamily: '"Palatino Linotype", "Book Antiqua", Palatino, Georgia, serif' }}>
          <a href="https://thiepmungonline.com" target="_blank" rel="noopener noreferrer" className="text-[14px] text-xs opacity-70 transition-opacity hover:opacity-90 md:text-[15px]" style={{ color: BROWN }}>♡ thiepmungonline.com</a>
        </div>
      </div>
    </div>
  );
}

const COBA_MARVIN = '"SVN-HC Marvin Visions", sans-serif';
const COBA_HAYDON = '"SVN-HC Haydon Brush", cursive';
const COBA_HELV = 'HelveticaNeue, "Helvetica Neue", Helvetica, Arial, sans-serif';

function CoBaHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2
      className="w-full text-center uppercase text-[30px] md:text-[35px] lg:text-[45px]"
      style={{ color: "#2F6982", fontFamily: COBA_MARVIN, fontWeight: 400, letterSpacing: "0.02em" }}
    >
      {children}
    </h2>
  );
}

/** THỨ HAI | 11 | THÁNG 05 date row used in the ceremony and reception blocks. */
function CoBaDateRow({ weekday, day, month, dayFontClass, gap, dividerLen }: {
  weekday: string;
  day: string;
  month: string;
  dayFontClass: string;
  gap: string;
  dividerLen: number;
}) {
  return (
    <div className={`flex items-center justify-center ${gap}`} style={{ color: "#542E08" }}>
      <span className="text-[15px] font-bold uppercase md:text-[18px] lg:text-[19px]" style={{ fontFamily: COBA_HELV, textAlign: "right" }}>{weekday}</span>
      <div className="shrink-0 bg-[#542e08]" style={{ width: dividerLen, height: 1, transform: "rotate(90deg)" }} />
      <span className={`font-bold leading-none ${dayFontClass}`} style={{ fontFamily: COBA_HELV }}>{day}</span>
      <div className="shrink-0 bg-[#542e08]" style={{ width: dividerLen, height: 1, transform: "rotate(90deg)" }} />
      <span className="text-[15px] font-bold uppercase md:text-[18px] lg:text-[19px]" style={{ fontFamily: COBA_HELV, textAlign: "left" }}>Tháng {month}</span>
    </div>
  );
}

function CoBaWishForm({ BROWN, CREAM }: { BROWN: string; CREAM: string }) {
  const { formProps, pending, state } = useWishFormBinding();

  return (
    <form {...formProps} className="mx-auto mt-6 w-full max-w-full md:max-w-[600px]">
      <div className="rounded-md border border-solid p-4 md:p-5" style={{ borderColor: BROWN, backgroundColor: hexToRgba(CREAM, 0.35) }}>
        <div className="mb-4">
          <input name="name" required maxLength={120} placeholder="Nhập tên của bạn*" className="w-full rounded-lg border px-4 py-3 text-base focus:outline-none md:py-3.5 md:text-[17px]" type="text" style={{ borderColor: BROWN, color: BROWN, backgroundColor: hexToRgba(CREAM, 0.5) }} />
        </div>
        <textarea name="text" required maxLength={1000} placeholder="Nhập lời chúc của bạn*" className="w-full rounded-lg border px-4 py-3 text-base focus:outline-none md:py-3.5 md:text-[17px]" rows={4} style={{ borderColor: BROWN, color: BROWN, backgroundColor: hexToRgba(CREAM, 0.5), resize: "none" }} />
        {state?.error ? <p className="mt-3 text-sm" style={{ color: "#c0392b" }}>{state.error}</p> : null}
        {state?.ok ? <p className="mt-3 text-sm" style={{ color: BROWN }}>Cảm ơn lời chúc của bạn!</p> : null}
        <div className="mt-4 flex items-center justify-between text-sm md:text-[15px]">
          <div />
          <button type="submit" disabled={pending} className="rounded-full px-6 py-2.5 text-base font-semibold transition-transform hover:scale-105 disabled:opacity-60 md:px-7 md:text-[17px]" style={{ backgroundColor: BROWN, color: CREAM }}>{pending ? "ĐANG GỬI..." : "GỬI LỜI CHÚC"}</button>
        </div>
      </div>
    </form>
  );
}

/** Faithful rebuild of the Cô Ba Đỏ (co-ba-red) opened invitation. */
function CoBaInvitation({ content }: { content: ChungDoiDemoContent }) {
  const { couple, families, venue, schedule, gallery, wishes } = content;
  const COBA = "/chungdoi/images/themes/co-ba-red";
  const RED = "#C32A29";
  const BROWN = "#542E08";
  const CREAM = "#F8F3E0";
  const groomShort = couple.groomShortName || "Văn Toàn";
  const brideShort = couple.brideShortName || "Thanh Diệp";
  const names = couple.brideFirst ? [brideShort, groomShort] : [groomShort, brideShort];
  const ceremony = formatDate(couple.date);
  const reception = formatDate(couple.date);
  const calendar = buildCalendar(couple.date);
  const galleryShown = gallery.slice(0, 4);
  const galleryExtra = Math.max(0, gallery.length - 4);
  const mapQuery = venue.mapAddress || venue.address.replace(/\n+/g, ", ").trim();
  const LUNAR = "(Tức ngày 25/03 năm Bính Ngọ)";

  const [bankOpen, setBankOpen] = useState(false);
  const parallaxRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const root = parallaxRef.current;
    if (!root) return;
    const layers = Array.from(root.querySelectorAll<HTMLElement>("[data-parallax]"));
    let raf = 0;
    const update = () => {
      raf = 0;
      const scrolled = -root.getBoundingClientRect().top;
      for (const el of layers) {
        const speed = Number(el.dataset.parallax) || 0;
        el.style.transform = `translateY(${(scrolled * speed).toFixed(2)}px)`;
      }
    };
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(update); };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => { window.removeEventListener("scroll", onScroll); cancelAnimationFrame(raf); };
  }, []);

  const bankCards = ([
    { role: "Chú Rể", bank: content.bank.groomBankName, num: content.bank.groomAccountNumber, name: content.bank.groomAccountName },
    { role: "Cô Dâu", bank: content.bank.brideBankName, num: content.bank.brideAccountNumber, name: content.bank.brideAccountName },
  ] as const).filter((q) => q.bank);

  return (
    <div className="flex w-full justify-center overflow-x-clip bg-white" style={{ color: BROWN }}>
      <div
        ref={parallaxRef}
        className="relative isolate w-full max-w-[480px] overflow-hidden md:mx-auto md:max-w-[900px] md:border md:border-[#542e0822]"
        style={{ backgroundColor: CREAM, color: BROWN, fontFamily: COBA_HELV }}
      >
        {/* paper texture overlay */}
        <div
          className="pointer-events-none absolute inset-0 z-0"
          aria-hidden="true"
          style={{ opacity: 0.18, backgroundImage: `url("${COBA}/paper.webp")`, backgroundRepeat: "repeat-y", backgroundPosition: "center top", backgroundSize: "100%" }}
        />

        {/* header */}
        <header className="relative z-10 flex w-full flex-col items-center pt-[calc(clamp(75px,calc(5vw+45px),140px)+30px)] md:pt-[calc(clamp(75px,calc(5vw+45px),140px)+50px)]">
          <div className="pointer-events-none absolute left-1/2 top-[50px] z-[20] -translate-x-1/2 text-center md:top-[100px] lg:top-[120px]" aria-hidden="true">
            <div className="inline-flex flex-col items-center">
              <p className="whitespace-nowrap" style={{ color: "#CD211C", fontFamily: COBA_MARVIN, fontSize: "clamp(31px, 5.5vw, 47px)", lineHeight: 1 }}>Thiệp mời</p>
              <p className="whitespace-nowrap" style={{ marginTop: 4, marginLeft: "70%", color: "#2F6982", fontFamily: COBA_HAYDON, fontSize: "clamp(25px, 4.5vw, 40px)", lineHeight: 1 }}>Đám Cưới</p>
            </div>
          </div>
          <p
            className="relative z-20 mt-[50px] max-w-[95%] text-center uppercase md:mt-[100px] lg:mt-[100px]"
            style={{ fontFamily: COBA_MARVIN, color: RED, fontSize: "clamp(20px, 5.5vw, 40px)", lineHeight: 1.2, letterSpacing: "0.03em" }}
          >
            {names[0]} &amp; {names[1]}
          </p>
          <div className="relative z-10 mt-2 h-[min(92vw,420px)] w-full max-w-[480px] md:h-[480px] md:max-w-[769px]">
            <div className="pointer-events-none absolute left-1/2 top-[calc(14%_-_115px)] z-[4] w-[130%] max-w-none -translate-x-1/2 md:top-[calc(14%_-_245px)] md:w-[140%] lg:top-[calc(14%_-_245px)] lg:w-[140%]">
              <div data-parallax="0.03" className="will-change-transform">
                <img alt="" aria-hidden="true" className="h-auto w-full object-contain" src={`${COBA}/cho-ben-thanh.webp`} />
              </div>
            </div>
            <div className="pointer-events-none absolute left-1/2 top-[calc(22%_+_40px)] z-[9] w-[70%] max-w-[653px] -translate-x-1/2 md:w-[48.1%] md:max-w-[369px]">
              <div className="will-change-transform">
                <img alt="" aria-hidden="true" className="h-auto w-full object-contain" src={`${COBA}/dau-re.webp`} />
              </div>
            </div>
          </div>
        </header>

        {/* content */}
        <section className="relative z-10 px-4 pb-8 pt-[210px] md:px-10 md:pb-12 md:pt-[262px] lg:pt-[285px]">
          <div className="relative z-[2] flex w-full flex-col items-center gap-10 md:gap-16 lg:gap-20">
            {/* Thông tin lễ cưới */}
            <CoBaHeading>Thông tin lễ cưới</CoBaHeading>

            <div className="relative grid w-full max-w-[366px] grid-cols-[1fr_auto_1fr] items-start gap-3 py-[10px] text-center md:max-w-[520px] md:gap-6 md:py-[15px] lg:max-w-[600px] lg:py-[20px]" style={{ color: BROWN, fontFamily: COBA_HELV }}>
              <div className="flex min-h-0 w-full min-w-0 flex-col items-center gap-1.5">
                <span className="text-[15px] font-normal md:text-[18px] lg:text-[19px]">{families.groomParentTitle || "Ông Bà"}</span>
                <span className="whitespace-nowrap text-[20px] font-bold">{families.groomFather}</span>
                <span className="whitespace-nowrap text-[20px] font-bold">{families.groomMother}</span>
                <div className="mt-1 w-full max-w-[169px] whitespace-pre-line text-[13px] font-normal leading-normal md:max-w-[260px] md:text-[15px] lg:max-w-[300px] lg:text-[16px]">{families.groomAddress}</div>
              </div>
              <div className="flex h-[50px] w-0 shrink-0 items-center justify-center self-stretch px-0 md:h-[64px]">
                <div className="h-full w-px bg-[#542e08]" />
              </div>
              <div className="flex min-h-0 w-full min-w-0 flex-col items-center gap-1.5">
                <span className="text-[15px] font-normal md:text-[18px] lg:text-[19px]">{families.brideParentTitle || "Ông Bà"}</span>
                <span className="whitespace-nowrap text-[20px] font-bold">{families.brideFather}</span>
                <span className="whitespace-nowrap text-[20px] font-bold">{families.brideMother}</span>
                <div className="mt-1 w-full max-w-[169px] whitespace-pre-line text-[13px] font-normal leading-normal md:max-w-[260px] md:text-[15px] lg:max-w-[300px] lg:text-[16px]">{families.brideAddress}</div>
              </div>
            </div>

            <div className="flex max-w-[320px] flex-col gap-1 py-[10px] text-center text-[16px] leading-snug md:max-w-[460px] md:py-[15px] md:text-[22px] lg:max-w-[560px] lg:py-[20px] lg:text-[23px]" style={{ whiteSpace: "pre-line", fontFamily: COBA_HELV, color: BROWN, fontWeight: 700 }}>
              TRÂN TRỌNG BÁO TIN{"\n"}LỄ THÀNH HÔN CỦA CON CHÚNG TÔI
            </div>

            <div className="relative flex flex-col items-center gap-1 py-[10px] text-center md:gap-2 md:py-[15px] lg:py-[20px]">
              <h3 className="flex w-[90%] items-center justify-center whitespace-nowrap leading-tight md:w-[95%] md:leading-snug" style={{ fontSize: 70, fontFamily: COBA_HAYDON, color: RED, fontWeight: 400, letterSpacing: "0.025em" }}>{couple.groomFullName}</h3>
              <div className="text-[14px] uppercase md:text-[17px]" style={{ color: BROWN, fontFamily: COBA_HELV }}>{couple.groomBirthOrder || "Trưởng Nam"}</div>
              <div className="text-[58px] md:text-[77px] lg:text-[86px]" style={{ fontFamily: COBA_HAYDON, color: RED }}>&amp;</div>
              <h3 className="flex w-[90%] items-center justify-center whitespace-nowrap leading-tight md:w-[95%] md:leading-snug" style={{ fontSize: 70, fontFamily: COBA_HAYDON, color: RED, fontWeight: 400, letterSpacing: "0.025em" }}>{couple.brideFullName}</h3>
              <div className="text-[14px] uppercase md:text-[17px]" style={{ color: BROWN, fontFamily: COBA_HELV }}>{couple.brideBirthOrder || "Út Nữ"}</div>
            </div>

            {/* ceremony */}
            <div className="relative flex flex-col items-center gap-4 py-[10px] text-center md:gap-5 md:py-[15px] lg:py-[20px]" style={{ fontFamily: COBA_HELV }}>
              <div className="flex flex-col items-center gap-2" style={{ color: BROWN }}>
                <span className="text-center text-[15px] font-bold md:text-[19px] lg:text-[20px]" style={{ whiteSpace: "pre-line" }}>{couple.ceremonyHeader || "LỄ THÀNH HÔN ĐƯỢC CỬ HÀNH TẠI\nTƯ GIA"}</span>
                <p className="text-center text-[15px] font-bold uppercase md:text-[19px] lg:text-[20px]">Vào lúc</p>
              </div>
              {couple.ceremonyTime ? <div className="text-[20px] md:text-[30px]">{couple.ceremonyTime}</div> : null}
              {ceremony ? (
                <>
                  <CoBaDateRow weekday={ceremony.weekday} day={ceremony.day} month={ceremony.month} dayFontClass="text-[36px] md:text-[42px] lg:text-[46px]" gap="gap-2 md:gap-3" dividerLen={30} />
                  <div className="text-[22px] font-bold md:text-[26px] lg:text-[28px]">{ceremony.yearNumber}</div>
                  <div className="text-[15px] font-bold md:text-[18px] lg:text-[19px]">{LUNAR}</div>
                </>
              ) : null}
            </div>

            {/* Album ảnh cưới */}
            {galleryShown.length > 0 ? (
              <div className="relative flex w-full max-w-[478px] flex-col items-center px-2 py-[10px] md:max-w-none md:px-10 md:py-[15px] lg:px-10 lg:py-[20px]">
                <CoBaHeading>Album Ảnh Cưới</CoBaHeading>
                <div className="mt-6 w-full max-w-[390px] md:max-w-[560px] lg:max-w-[600px]">
                  <div className="grid grid-cols-2 gap-3 md:gap-4">
                    {galleryShown.map((src, i) => (
                      <div key={src} className="group relative aspect-square cursor-pointer overflow-hidden rounded-xl border border-[#542e0833] bg-[#542e0808]">
                        <img alt={`Wedding photo ${i + 1}`} className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-[1.03]" src={src} style={{ objectPosition: "50% 50%" }} />
                        {i === galleryShown.length - 1 && galleryExtra > 0 ? (
                          <div className="absolute inset-0 flex items-center justify-center bg-black/55">
                            <span className="text-lg font-semibold text-white">+{galleryExtra}</span>
                          </div>
                        ) : null}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : null}

            {/* Thông tin tiệc cưới */}
            {reception ? (
              <div className="relative z-[1] flex w-full flex-col items-center gap-8 py-[10px] md:gap-12 md:py-[15px] lg:gap-14 lg:py-[20px]">
                <CoBaHeading>Thông tin tiệc cưới</CoBaHeading>
                <div className="flex flex-col items-center gap-4 text-center md:gap-5" style={{ fontFamily: COBA_HELV, color: BROWN }}>
                  <h3 className="flex flex-col items-center text-center text-[19px] font-bold uppercase md:text-[33px] lg:text-[36px]" style={{ color: BROWN, fontFamily: COBA_MARVIN, fontWeight: 400, letterSpacing: "0.02em" }}>Tiệc cưới sẽ diễn ra vào lúc:</h3>
                  <div className="text-center text-[26px] md:text-[38px]">{venue.banquetTime || couple.time}</div>
                  <CoBaDateRow weekday={reception.weekday} day={reception.day} month={reception.month} dayFontClass="text-[38px] md:text-[50px]" gap="gap-6" dividerLen={34} />
                  <div className="text-[23px] font-bold md:text-[31px]">{reception.yearNumber}</div>
                  <div className="text-[15px] uppercase tracking-[0.2em] md:text-[18px]">{LUNAR}</div>
                  <div className="mt-4 flex items-center justify-center gap-8">
                    <div className="flex flex-col items-center">
                      <span className="text-sm uppercase tracking-wider md:text-[15px]">Đón khách</span>
                      <span className="mt-1 text-xl font-bold md:mt-1.5 md:text-2xl">17:00</span>
                    </div>
                    <div className="flex flex-col items-center">
                      <span className="text-sm uppercase tracking-wider md:text-[15px]">Khai tiệc</span>
                      <span className="mt-1 text-xl font-bold md:mt-1.5 md:text-2xl">{venue.banquetTime || couple.time}</span>
                    </div>
                  </div>
                  {calendar ? (
                    <div className="mx-auto mt-2 w-[296px] max-w-full md:w-[352px]">
                      <div className="mx-auto w-full overflow-hidden rounded-lg border" style={{ borderColor: hexToRgba(BROWN, 0.27), color: BROWN }}>
                        <div className="border-b py-2.5 text-center text-[13px] font-semibold tracking-wide md:text-[14px]" style={{ borderColor: hexToRgba(BROWN, 0.27) }}>Tháng {calendar.month} / {calendar.year}</div>
                        <div className="grid grid-cols-7 border-b-2" style={{ borderColor: BROWN }}>
                          {WEEKDAY_LABELS.map((d) => (<div key={d} className="py-1.5 text-center text-[10px] font-medium opacity-60 md:text-[11px]">{d}</div>))}
                        </div>
                        <div className="grid grid-cols-7 gap-y-0.5 px-1 py-2">
                          {calendar.cells.map((day, i) => (
                            <div key={i} className="flex h-[30px] items-center justify-center md:h-[34px]">
                              {day === calendar.highlight ? (
                                <div className="relative flex h-[24px] w-[26px] items-center justify-center md:h-[28px] md:w-[30px]">
                                  <svg viewBox="0 0 24 22" className="absolute inset-0 h-full w-full drop-shadow-sm" fill={BROWN}>
                                    <path d="M12 21C12 21 1.5 13.5 1.5 7.5C1.5 4.46 3.96 2 7 2C8.76 2 10.35 2.81 11.4 4.09L12 4.8L12.6 4.09C13.65 2.81 15.24 2 17 2C20.04 2 22.5 4.46 22.5 7.5C22.5 13.5 12 21 12 21Z" />
                                  </svg>
                                  <span className="relative z-10 text-[11px] font-bold md:text-[12px]" style={{ color: "#fff" }}>{day}</span>
                                </div>
                              ) : day ? (<span className="text-[12px] md:text-[13px]">{day}</span>) : null}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : null}
                  <a href={googleCalendarUrl(content)} target="_blank" rel="noopener noreferrer" className="mt-4 inline-flex items-center justify-center text-sm tracking-wide underline decoration-1 underline-offset-4 transition-opacity hover:opacity-70 md:text-base" style={{ color: BROWN, fontFamily: COBA_HELV }}>Thêm vào lịch</a>
                </div>
                <div className="mt-2 flex w-full flex-col items-center justify-center">
                  <button type="button" className="inline-flex min-h-[42px] items-center justify-center rounded-full px-6 py-0 text-sm font-semibold leading-none tracking-wide transition-transform hover:scale-[1.03] md:min-h-[46px] md:text-base" style={{ backgroundColor: BROWN, color: CREAM, fontFamily: COBA_HELV }}>XÁC NHẬN</button>
                </div>
              </div>
            ) : null}

            {/* map */}
            {mapQuery ? (
              <section className="relative w-full px-2 py-[10px] md:px-10 md:py-[15px] lg:py-[20px]">
                <div className="relative text-center">
                  <h3 className="flex flex-col items-center text-center text-[30px] font-bold uppercase md:text-[35px] lg:text-[45px]" style={{ color: "#2F6982", fontFamily: COBA_MARVIN, fontWeight: 400, letterSpacing: "0.02em" }}>Tiệc cưới sẽ tổ chức tại</h3>
                  <div className="mx-auto mt-2 max-w-[280px] whitespace-pre-line text-center text-[15px] leading-snug md:mt-3 md:max-w-md md:text-[18px] lg:max-w-lg lg:text-[20px]" style={{ color: BROWN, fontFamily: COBA_HELV }}>{venue.address}</div>
                </div>
                <div className="relative flex w-full flex-col items-center gap-4 md:gap-5">
                  <iframe title={mapQuery} className="mt-2 h-[240px] w-full max-w-[338px] overflow-hidden rounded-[15px] md:h-[320px] md:max-w-[560px] lg:h-[340px] lg:max-w-[600px]" src={mapEmbedUrl(mapQuery)} loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
                </div>
              </section>
            ) : null}

            {/* schedule */}
            {schedule.length > 0 ? (
              <div className="relative flex w-full flex-col gap-6 px-4 md:gap-8">
                <h2 className="flex flex-col items-center text-center text-[30px] font-bold uppercase md:text-[35px] lg:text-[45px]" style={{ color: "#2F6982", fontFamily: COBA_MARVIN, fontWeight: 400, letterSpacing: "0.02em" }}>Lịch trình ngày cưới</h2>
                <ol className="relative mx-auto grid w-full max-w-[460px] grid-cols-[minmax(0,1fr)_16px_minmax(0,1fr)] items-center gap-x-6 gap-y-8 md:gap-x-8 md:gap-y-10" style={{ fontFamily: COBA_HELV }}>
                  {schedule.map((s, i) => (
                    <li key={`${s.time}-${i}`} className="contents">
                      <span className="pt-0.5 text-right text-[16px] tabular-nums leading-snug tracking-wide md:text-[17px]" style={{ color: RED, fontFamily: COBA_HELV }}>{s.time}</span>
                      <span aria-hidden="true" className="relative flex items-center justify-center self-stretch">
                        {i > 0 ? <span className="absolute left-1/2 -top-8 h-8 w-px -translate-x-1/2 md:-top-10" style={{ backgroundColor: hexToRgba(RED, 0.4) }} /> : null}
                        <span className="relative block h-2.5 w-2.5 rounded-full" style={{ backgroundColor: RED, boxShadow: `0 0 0 2px ${hexToRgba(RED, 0.13)}` }} />
                        {i < schedule.length - 1 ? <span className="absolute bottom-1/2 left-1/2 top-1/2 w-px -translate-x-1/2 md:-bottom-10" style={{ backgroundColor: hexToRgba(RED, 0.4) }} /> : null}
                      </span>
                      <span className="pt-0.5 text-left text-[17px] font-medium leading-snug md:text-[19px]" style={{ color: BROWN, fontFamily: COBA_HELV }}>{s.label}</span>
                    </li>
                  ))}
                </ol>
              </div>
            ) : null}

            {/* guestbook */}
            <section className="relative mx-auto w-full max-w-[338px] px-2 py-[10px] md:max-w-[560px] md:px-10 md:py-[15px] lg:max-w-[600px] lg:py-[20px]" style={{ color: BROWN, fontFamily: COBA_HELV }}>
              <div className="text-center">
                <h2 className="text-[30px] font-bold uppercase md:text-[35px] lg:text-[45px]" style={{ color: "#2F6982", fontFamily: COBA_MARVIN, fontWeight: 400, letterSpacing: "0.02em" }}>Sổ lưu bút</h2>
              </div>
              <CoBaWishForm BROWN={BROWN} CREAM={CREAM} />
              <div className="mx-auto mt-8 max-h-[500px] w-full max-w-full space-y-3 overflow-y-auto pr-2 md:max-w-[600px]">
                {wishes.length > 0 ? (
                  wishes.map((w, i) => (
                    <div key={`${w.name}-${i}`} className="rounded-lg border p-3 text-sm" style={{ borderColor: hexToRgba(BROWN, 0.2), backgroundColor: "#fff" }}>
                      <div className="flex items-start justify-between">
                        <span className="font-semibold" style={{ color: RED }}>{w.name}</span>
                        <span className="opacity-70">{formatWishTime(w.time)}</span>
                      </div>
                      <p className="mt-2 leading-relaxed">{w.text}</p>
                    </div>
                  ))
                ) : (
                  <p className="flex flex-col items-center text-center text-base opacity-70 md:text-[17px]">Chưa có lời chúc nào. Hãy là người đầu tiên!</p>
                )}
              </div>
            </section>

            {/* bank envelope */}
            {bankCards.length > 0 ? (
              <div className="relative flex w-full max-w-[248px] flex-col items-center justify-center px-2 py-[10px] md:max-w-none md:px-10 md:py-[15px] lg:py-[20px]">
                <h2 className="mb-4 flex flex-col items-center text-[21px] md:text-[25px] lg:text-[32px]" style={{ color: BROWN, fontFamily: COBA_MARVIN, fontWeight: 400, letterSpacing: "0.02em" }}>Phong Bao Mừng Cưới</h2>
                <button type="button" aria-label="Mở hộp mừng cưới" onClick={() => setBankOpen(true)} className="group relative cursor-pointer border-none bg-transparent outline-none" style={{ width: 200, height: 256 }}>
                  <div className="relative flex h-full w-full items-center justify-center">
                    {/* envelope body */}
                    <div className="relative" style={{ width: 140, height: 196 }}>
                      <div className="absolute overflow-hidden rounded-lg" style={{ inset: 0, backgroundColor: "#b91c1c", boxShadow: "0 4px 20px rgba(0,0,0,0.3)" }}>
                        <div className="absolute left-0 right-0 top-0" style={{ height: 4, backgroundColor: "#fbbf24" }} />
                        <div className="absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full shadow-lg" style={{ width: 63, height: 63, background: "radial-gradient(circle, #fbbf24 0%, #d97706 100%)", border: "3px solid #fef3c7" }}>
                          <span className="font-bold" style={{ fontSize: 30.8, color: "#b91c1c", lineHeight: 1, textShadow: "1px 1px 2px rgba(0,0,0,0.2)" }}>囍</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <p className="absolute -bottom-2 left-1/2 -translate-x-1/2 whitespace-nowrap text-xs font-medium" style={{ color: BROWN }}>Nhấn để mở</p>
                </button>
                {bankOpen ? (
                  <div className="fixed inset-0 z-[95] flex items-end justify-center bg-black/60 p-0 sm:items-center sm:p-4" onClick={() => setBankOpen(false)}>
                    <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto sm:max-w-xl" style={{ backgroundColor: CREAM }} onClick={(e) => e.stopPropagation()}>
                      <div className="relative px-6 pb-4 pt-6 text-center" style={{ backgroundColor: RED }}>
                        <button type="button" aria-label="Đóng" onClick={() => setBankOpen(false)} className="absolute right-3 top-3 text-white/80 hover:text-white">✕</button>
                        <h2 className="text-[21px] text-white md:text-[25px] lg:text-[32px]" style={{ textShadow: "1px 1px 2px rgba(0,0,0,0.2)", fontFamily: COBA_MARVIN, fontWeight: 400, letterSpacing: "0.02em" }}>Phong Bao Mừng Cưới</h2>
                      </div>
                      <div className="p-4 sm:p-6">
                        <div className="flex flex-col items-center gap-4 sm:flex-row sm:flex-wrap sm:items-start sm:justify-center" style={{ color: BROWN }}>
                          {bankCards.map((q) => {
                            const qr = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(`${q.bank} ${q.num} ${q.name}`)}`;
                            return (
                              <div key={q.role} className="flex max-w-[180px] flex-1 flex-col items-center sm:max-w-none">
                                <h3 className="mb-2 flex min-h-[2rem] items-start justify-center text-center text-xs font-medium" style={{ color: RED }}>{q.role} - {q.name}</h3>
                                <div className="flex h-32 w-32 items-center justify-center rounded-xl bg-white p-2 shadow-lg sm:h-40 sm:w-40" style={{ border: `2px solid ${hexToRgba(RED, 0.125)}` }}>
                                  <img alt={`QR - ${q.role} - ${q.name}`} className="h-full w-full object-contain" src={qr} />
                                </div>
                                <div className="mt-2 space-y-0.5 text-center">
                                  <p className="text-[10px]">{q.bank}</p>
                                  <p className="font-mono text-[10px]">{q.num}</p>
                                  <p className="text-[10px] font-semibold">{q.name}</p>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : null}
              </div>
            ) : null}

            {/* footer */}
            <footer className="flex w-full max-w-[329px] flex-col items-center px-4 py-[10px] text-center md:max-w-2xl md:px-10 md:py-[15px] lg:py-[20px]">
              <span className="flex flex-col items-center gap-1 whitespace-pre-line text-[14px] leading-normal md:text-base lg:text-lg" style={{ color: BROWN, fontFamily: COBA_HELV }}>Sự hiện diện của quý khách là niềm vinh hạnh của gia đình chúng tôi!</span>
            </footer>
          </div>
        </section>

        <div className="relative z-20 flex items-center justify-center pb-3 pt-2">
          <a href="https://thiepmungonline.com" target="_blank" rel="noopener noreferrer" className="text-[14px] opacity-70 transition-opacity hover:opacity-90 md:text-[15px]" style={{ color: BROWN, fontFamily: '"Palatino Linotype", "Book Antiqua", Palatino, Georgia, serif' }}>♡ thiepmungonline.com</a>
        </div>
      </div>
    </div>
  );
}

const LPD_UNI = '"UNI Chu truyen thong", "Baskerville", "Times New Roman", serif';
const LPD_BODY = 'Baskerville, "Times New Roman", serif';
const LPD_CN_WEEKDAY = ["星期日", "星期一", "星期二", "星期三", "星期四", "星期五", "星期六"];
const LPD_SCHEDULE_CN: Record<string, string> = {
  "Đón khách": "賓客迎接",
  "Khai tiệc": "開席",
  "Rót rượu, cắt bánh": "敬酒、切蛋糕",
  "Phục vụ món chính": "上主菜",
  "Kết thúc tiệc": "宴會結束",
};

/** CHỦ NHẬT/星期日 | 01 | THÁNG 02/2月 bilingual date row for the long-phung-do template. */
function LpdDateRow({ vnWeekday, cnWeekday, day, month, gold, dayClass }: {
  vnWeekday: string;
  cnWeekday: string;
  day: string;
  month: string;
  gold: string;
  dayClass: string;
}) {
  return (
    <div className="flex items-center justify-center gap-4 md:gap-6" style={{ color: gold, fontFamily: LPD_BODY }}>
      <div className="flex flex-col items-center leading-tight">
        <span className="text-[15px] font-semibold uppercase md:text-[18px]">{vnWeekday}</span>
        <span className="text-[12px] opacity-70 md:text-[14px]">{cnWeekday}</span>
      </div>
      <div className="shrink-0" style={{ width: 2, height: 28, backgroundColor: hexToRgba(gold, 0.5) }} />
      <span className={`font-semibold leading-none ${dayClass}`}>{day}</span>
      <div className="shrink-0" style={{ width: 2, height: 28, backgroundColor: hexToRgba(gold, 0.5) }} />
      <div className="flex flex-col items-center leading-tight">
        <span className="text-[15px] font-semibold uppercase md:text-[18px]">Tháng {month}</span>
        <span className="text-[12px] opacity-70 md:text-[14px]">{Number(month)}月</span>
      </div>
    </div>
  );
}

function DragonPhoenixWishForm({ GOLD, BTN_TEXT }: { GOLD: string; BTN_TEXT: string }) {
  const { formProps, pending, state } = useWishFormBinding();

  return (
    <form {...formProps} className="mx-auto mt-6 w-full">
      <div className="rounded-2xl border p-4 md:p-5" style={{ borderColor: hexToRgba(GOLD, 0.35), backgroundColor: hexToRgba(GOLD, 0.06) }}>
        <div className="mb-4">
          <input name="name" required maxLength={120} placeholder="Nhập tên của bạn*" className="w-full rounded-lg border bg-transparent px-4 py-3 text-base focus:outline-none md:py-3.5 md:text-[17px]" type="text" style={{ borderColor: hexToRgba(GOLD, 0.4), color: GOLD }} />
        </div>
        <textarea name="text" required maxLength={1000} placeholder="Nhập lời chúc của bạn*" className="w-full rounded-lg border bg-transparent px-4 py-3 text-base focus:outline-none md:py-3.5 md:text-[17px]" rows={4} style={{ borderColor: hexToRgba(GOLD, 0.4), color: GOLD, resize: "none" }} />
        {state?.error ? <p className="mt-2 text-sm" style={{ color: "#ffb4a2" }}>{state.error}</p> : null}
        {state?.ok ? <p className="mt-2 text-sm" style={{ color: GOLD }}>Cảm ơn lời chúc của bạn!</p> : null}
        <div className="mt-4 flex items-center justify-between">
          <span aria-hidden="true" className="text-xl">🪄</span>
          <button type="submit" disabled={pending} className="rounded-full px-6 py-2.5 text-base font-semibold transition-transform hover:scale-105 disabled:opacity-60 md:px-7 md:text-[17px]" style={{ backgroundColor: GOLD, color: BTN_TEXT }}>{pending ? "Đang gửi..." : "GỬI LỜI CHÚC / 送出祝福"}</button>
        </div>
      </div>
    </form>
  );
}

/** Faithful rebuild of the Long Phụng Đỏ (dragon-phoenix-red) opened invitation — dark red + gold, bilingual VN/中文. */
function DragonPhoenixInvitation({ content }: { content: ChungDoiDemoContent }) {
  const { couple, families, venue, schedule, gallery, wishes } = content;
  const LPD = "/chungdoi/images/themes/dragon-phoenix-red";
  const GOLD = "#e9ce9e";
  const GOLD_MUTED = "#d9bc86";
  const CARD_BG = "#680e0e";
  const BTN_TEXT = "#553f18";
  const groomShort = couple.groomShortName || couple.groomFullName;
  const brideShort = couple.brideShortName || couple.brideFullName;
  const headerNames = couple.brideFirst ? [brideShort, groomShort] : [groomShort, brideShort];
  const ceremony = formatDate(couple.ceremonyDate || couple.date);
  const reception = formatDate(couple.date);
  const calendar = buildCalendar(couple.date);
  const galleryShown = gallery.slice(0, 4);
  const galleryExtra = Math.max(0, gallery.length - 4);
  const mapQuery = venue.mapAddress || venue.address.replace(/\n+/g, ", ").trim();
  const CEREMONY_LUNAR = "(Tức ngày 14/12 năm Ất Tỵ / 農曆 14/12 乙巳)";
  const RECEPTION_LUNAR = "(Tức ngày 14/04 năm Bính Ngọ / 農曆 14/04 丙午)";

  const [bankOpen, setBankOpen] = useState(false);
  const parallaxRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const root = parallaxRef.current;
    if (!root) return;
    const layers = Array.from(root.querySelectorAll<HTMLElement>("[data-parallax]"));
    let raf = 0;
    const update = () => {
      raf = 0;
      const scrolled = -root.getBoundingClientRect().top;
      for (const el of layers) {
        const speed = Number(el.dataset.parallax) || 0;
        el.style.transform = `translateY(${(scrolled * speed).toFixed(2)}px)`;
      }
    };
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(update); };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => { window.removeEventListener("scroll", onScroll); cancelAnimationFrame(raf); };
  }, []);

  const bankCards = ([
    { role: "Chú Rể / 新郎", bank: content.bank.groomBankName, num: content.bank.groomAccountNumber, name: content.bank.groomAccountName },
    { role: "Cô Dâu / 新娘", bank: content.bank.brideBankName, num: content.bank.brideAccountNumber, name: content.bank.brideAccountName },
  ] as const).filter((q) => q.bank);

  return (
    <div className="flex w-full justify-center overflow-x-clip bg-white">
      <div
        ref={parallaxRef}
        className="relative isolate w-full max-w-[480px] overflow-hidden rounded md:mx-auto md:max-w-[900px] md:border md:border-[#e9ce9e22]"
        style={{ backgroundColor: CARD_BG, color: GOLD, fontFamily: LPD_BODY }}
      >
        {/* parallax dragon / phoenix artwork */}
        <div className="pointer-events-none absolute -top-[40px] left-1/2 z-[1] w-[clamp(800px,150vw,1600px)] max-w-none -translate-x-1/2 opacity-[0.12]" aria-hidden="true">
          <div data-parallax="0.04" className="will-change-transform">
            <img alt="" aria-hidden="true" className="h-auto w-full object-contain" src={`${LPD}/rong.webp`} />
          </div>
        </div>
        <div className="pointer-events-none absolute bottom-[6%] left-1/2 z-[1] w-[clamp(800px,150vw,1600px)] max-w-none -translate-x-1/2 opacity-[0.12]" aria-hidden="true">
          <div data-parallax="-0.03" className="will-change-transform">
            <img alt="" aria-hidden="true" className="h-auto w-full object-contain" src={`${LPD}/phuong.webp`} />
          </div>
        </div>

        {/* header */}
        <header className="relative z-10 flex h-[472px] flex-col items-center justify-center text-center md:h-[650px]">
          <div className="pointer-events-none absolute left-1/2 top-12 flex w-full -translate-x-1/2 justify-center gap-8 opacity-[0.15] md:top-16" aria-hidden="true">
            <img alt="" className="h-[354px] w-auto md:h-[572px]" src={`${LPD}/rong.webp`} />
            <img alt="" className="h-[354px] w-auto md:h-[572px]" src={`${LPD}/phuong.webp`} />
          </div>
          <h1 className="relative z-10 flex flex-col items-center" style={{ fontFamily: LPD_UNI, color: GOLD }}>
            <span className="whitespace-nowrap leading-[75px] md:leading-[105px]" style={{ fontSize: 70 }}>{headerNames[0]}</span>
            <span className="mt-1 text-[37px] md:text-[50px]">&amp;</span>
            <span className="whitespace-nowrap leading-[75px] md:leading-[105px]" style={{ fontSize: 70 }}>{headerNames[1]}</span>
          </h1>
        </header>

        {/* content */}
        <section className="relative z-10 px-4 pb-10 pt-4 md:px-10 md:pb-14">
          <div className="relative z-[2] flex w-full flex-col items-center gap-12 md:gap-16">
            {/* Album ảnh cưới */}
            {galleryShown.length > 0 ? (
              <div className="flex w-full max-w-[478px] flex-col items-center md:max-w-none">
                <h2 className="text-center text-[26px] font-semibold uppercase md:text-[32px]" style={{ color: GOLD, fontFamily: LPD_BODY, letterSpacing: "0.04em" }}>
                  Album Ảnh Cưới <span className="opacity-70">/ 婚禮相冊</span>
                </h2>
                <div className="mt-6 w-full max-w-[390px] md:max-w-[560px]">
                  <div className="grid grid-cols-2 gap-3 md:gap-4">
                    {galleryShown.map((src, i) => (
                      <div key={src} className="group relative aspect-square cursor-pointer overflow-hidden rounded-xl border" style={{ borderColor: hexToRgba(GOLD, 0.25) }}>
                        <img alt={`Wedding photo ${i + 1}`} className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-[1.03]" src={src} />
                        {i === galleryShown.length - 1 && galleryExtra > 0 ? (
                          <div className="absolute inset-0 flex items-center justify-center bg-black/55">
                            <span className="text-lg font-semibold text-white">+{galleryExtra}</span>
                          </div>
                        ) : null}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : null}

            {/* Thông tin lễ cưới */}
            <h2 className="text-center text-[26px] font-semibold uppercase md:text-[32px]" style={{ color: GOLD, fontFamily: LPD_BODY, letterSpacing: "0.04em" }}>
              Thông tin lễ cưới <span className="opacity-70">/ 婚禮資訊</span>
            </h2>
            <div className="grid w-full max-w-[366px] grid-cols-2 items-start gap-6 text-center md:max-w-[560px] md:gap-10" style={{ color: GOLD, fontFamily: LPD_BODY }}>
              <div className="flex flex-col items-center gap-1.5">
                <span className="text-[15px] md:text-[18px]">{families.groomParentTitle || "Ông Bà"} <span className="opacity-70">/ 先生與女士</span></span>
                <span className="whitespace-nowrap text-[19px] font-semibold md:text-[21px]">{families.groomFather}</span>
                <span className="whitespace-nowrap text-[19px] font-semibold md:text-[21px]">{families.groomMother}</span>
                <div className="mt-1 w-full max-w-[169px] whitespace-pre-line text-[13px] leading-normal opacity-90 md:max-w-[240px] md:text-[15px]">{families.groomAddress}</div>
                <div className="text-[12px] opacity-60 md:text-[13px]">台北市大安區忠孝東路123號</div>
              </div>
              <div className="flex flex-col items-center gap-1.5">
                <span className="text-[15px] md:text-[18px]">{families.brideParentTitle || "Ông Bà"} <span className="opacity-70">/ 先生與女士</span></span>
                <span className="whitespace-nowrap text-[19px] font-semibold md:text-[21px]">{families.brideFather}</span>
                <span className="whitespace-nowrap text-[19px] font-semibold md:text-[21px]">{families.brideMother}</span>
                <div className="mt-1 w-full max-w-[169px] whitespace-pre-line text-[13px] leading-normal opacity-90 md:max-w-[240px] md:text-[15px]">{families.brideAddress}</div>
                <div className="text-[12px] opacity-60 md:text-[13px]">台北市信義區信義路456號</div>
              </div>
            </div>

            {/* báo tin */}
            <div className="flex flex-col items-center gap-2 text-center" style={{ color: GOLD }}>
              <div className="flex max-w-[320px] flex-col gap-1 text-[16px] font-semibold leading-snug md:max-w-[460px] md:text-[22px]" style={{ whiteSpace: "pre-line", fontFamily: LPD_BODY }}>
                TRÂN TRỌNG BÁO TIN{"\n"}LỄ THÀNH HÔN CỦA CON CHÚNG TÔI
              </div>
              <div className="flex flex-col gap-0.5 text-[13px] opacity-70 md:text-[15px]" style={{ whiteSpace: "pre-line" }}>
                謹此敬告{"\n"}我們子女的婚禮
              </div>
            </div>

            {/* couple full names */}
            <div className="flex flex-col items-center gap-1 text-center">
              <h3 className="flex min-h-[80px] w-[80%] items-center justify-center whitespace-nowrap leading-[50px]" style={{ fontSize: 64, fontFamily: LPD_UNI, color: GOLD }}>{couple.groomFullName}</h3>
              <div className="text-[13px] uppercase opacity-80 md:text-[15px]" style={{ fontFamily: LPD_BODY }}>ÚT NAM <span className="opacity-70">/ 幼子</span></div>
              <div className="text-[35px] md:text-[48px]" style={{ fontFamily: LPD_UNI, color: GOLD }}>&amp;</div>
              <h3 className="flex min-h-[80px] w-[80%] items-center justify-center whitespace-nowrap leading-[50px]" style={{ fontSize: 64, fontFamily: LPD_UNI, color: GOLD }}>{couple.brideFullName}</h3>
              <div className="text-[13px] uppercase opacity-80 md:text-[15px]" style={{ fontFamily: LPD_BODY }}>ÚT NỮ <span className="opacity-70">/ 幼女</span></div>
            </div>

            {/* ceremony */}
            <div className="flex flex-col items-center gap-4 text-center" style={{ fontFamily: LPD_BODY, color: GOLD }}>
              <div className="flex flex-col items-center gap-1">
                <span className="text-[15px] font-semibold md:text-[19px]" style={{ whiteSpace: "pre-line" }}>{couple.ceremonyHeader || "LỄ THÀNH HÔN ĐƯỢC CỬ HÀNH TẠI\nTƯ GIA"}</span>
                <span className="text-[13px] opacity-70 md:text-[15px]" style={{ whiteSpace: "pre-line" }}>婚禮儀式舉行地點{"\n"}自宅</span>
              </div>
              <p className="text-[15px] font-semibold uppercase md:text-[18px]">Vào lúc <span className="opacity-70">/ 時間</span></p>
              {couple.ceremonyTime ? <div className="text-[20px] md:text-[30px]">{couple.ceremonyTime}</div> : null}
              {ceremony ? (
                <>
                  <LpdDateRow vnWeekday={ceremony.weekday} cnWeekday={LPD_CN_WEEKDAY[(ceremony.dayNumber + new Date(`${couple.ceremonyDate || couple.date}T00:00:00`).getDay() - ceremony.dayNumber + 7) % 7]} day={ceremony.day} month={ceremony.month} gold={GOLD} dayClass="text-[36px] md:text-[46px]" />
                  <div className="text-[22px] font-semibold md:text-[26px]">{ceremony.yearNumber}</div>
                  <div className="text-[14px] opacity-80 md:text-[16px]">{CEREMONY_LUNAR}</div>
                </>
              ) : null}
            </div>

            {/* Thông tin tiệc cưới */}
            {reception ? (
              <div className="flex w-full flex-col items-center gap-8" style={{ fontFamily: LPD_BODY, color: GOLD }}>
                <h2 className="text-center text-[26px] font-semibold uppercase md:text-[32px]" style={{ color: GOLD, letterSpacing: "0.04em" }}>
                  Thông tin tiệc cưới <span className="opacity-70">/ 婚宴資訊</span>
                </h2>
                <div className="flex flex-col items-center gap-1">
                  <span className="text-[17px] font-semibold md:text-[22px]">Tiệc cưới sẽ diễn ra vào lúc:</span>
                  <span className="text-[13px] opacity-70 md:text-[15px]">婚宴將於以下時間舉行：</span>
                </div>
                <div className="text-[26px] md:text-[38px]">{venue.banquetTime || couple.time}</div>
                <LpdDateRow vnWeekday={reception.weekday} cnWeekday={LPD_CN_WEEKDAY[new Date(`${couple.date}T00:00:00`).getDay()]} day={reception.day} month={reception.month} gold={GOLD} dayClass="text-[38px] md:text-[50px]" />
                <div className="text-[23px] font-semibold md:text-[31px]">{reception.yearNumber}</div>
                <div className="text-[14px] opacity-80 md:text-[16px]">{RECEPTION_LUNAR}</div>
                <div className="flex flex-col items-center">
                  <span className="text-sm uppercase tracking-wider md:text-[15px]">Khai tiệc <span className="opacity-70">/ 開席</span></span>
                  <span className="mt-1 text-xl font-semibold md:text-2xl">{venue.banquetTime || couple.time}</span>
                </div>
                {calendar ? (
                  <div className="mx-auto mt-2 w-[296px] max-w-full md:w-[352px]">
                    <div className="mx-auto w-full overflow-hidden rounded-lg border" style={{ borderColor: hexToRgba(GOLD, 0.3), color: GOLD }}>
                      <div className="border-b py-2.5 text-center text-[13px] font-semibold tracking-wide md:text-[14px]" style={{ borderColor: hexToRgba(GOLD, 0.3) }}>Tháng {calendar.month} / {calendar.year}</div>
                      <div className="grid grid-cols-7 border-b-2" style={{ borderColor: hexToRgba(GOLD, 0.5) }}>
                        {WEEKDAY_LABELS.map((d) => (<div key={d} className="py-1.5 text-center text-[10px] font-medium opacity-60 md:text-[11px]">{d}</div>))}
                      </div>
                      <div className="grid grid-cols-7 gap-y-0.5 px-1 py-2">
                        {calendar.cells.map((day, i) => (
                          <div key={i} className="flex h-[30px] items-center justify-center md:h-[34px]">
                            {day === calendar.highlight ? (
                              <div className="relative flex h-[24px] w-[26px] items-center justify-center md:h-[28px] md:w-[30px]">
                                <svg viewBox="0 0 24 22" className="absolute inset-0 h-full w-full drop-shadow-sm" fill={GOLD}>
                                  <path d="M12 21C12 21 1.5 13.5 1.5 7.5C1.5 4.46 3.96 2 7 2C8.76 2 10.35 2.81 11.4 4.09L12 4.8L12.6 4.09C13.65 2.81 15.24 2 17 2C20.04 2 22.5 4.46 22.5 7.5C22.5 13.5 12 21 12 21Z" />
                                </svg>
                                <span className="relative z-10 text-[11px] font-bold md:text-[12px]" style={{ color: "#333333" }}>{day}</span>
                              </div>
                            ) : day ? (<span className="text-[12px] md:text-[13px]">{day}</span>) : null}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : null}
                <a href={googleCalendarUrl(content)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center text-sm tracking-wide underline decoration-1 underline-offset-4 transition-opacity hover:opacity-70 md:text-base" style={{ color: GOLD }}>Thêm vào lịch <span className="opacity-70">/ 添加到日曆</span></a>
                <button type="button" className="inline-flex min-h-[44px] items-center justify-center rounded-full px-7 py-0 text-sm font-semibold leading-none tracking-wide transition-transform hover:scale-[1.03] md:text-base" style={{ backgroundColor: GOLD, color: BTN_TEXT }}>XÁC NHẬN / 確認出席</button>
              </div>
            ) : null}

            {/* map */}
            {mapQuery ? (
              <section className="relative w-full">
                <div className="text-center">
                  <h3 className="text-[26px] font-semibold uppercase md:text-[32px]" style={{ color: GOLD, letterSpacing: "0.04em" }}>Tiệc cưới sẽ tổ chức tại <span className="opacity-70">/ 婚宴地點</span></h3>
                  <div className="mx-auto mt-2 max-w-[280px] whitespace-pre-line text-center text-[15px] leading-snug opacity-90 md:max-w-md md:text-[18px]" style={{ color: GOLD }}>{venue.address}</div>
                </div>
                <div className="flex w-full flex-col items-center">
                  <iframe title={mapQuery} className="mt-4 h-[280px] w-full max-w-[340px] overflow-hidden rounded-2xl md:h-[380px] md:max-w-[560px]" src={mapEmbedUrl(mapQuery)} loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
                </div>
              </section>
            ) : null}

            {/* schedule */}
            {schedule.length > 0 ? (
              <div className="flex w-full flex-col gap-6">
                <h2 className="text-center text-[26px] font-semibold uppercase md:text-[32px]" style={{ color: GOLD, letterSpacing: "0.04em" }}>Lịch trình ngày cưới <span className="opacity-70">/ 婚禮當日流程</span></h2>
                <ol className="relative mx-auto grid w-full max-w-[460px] grid-cols-[minmax(0,1fr)_16px_minmax(0,1fr)] items-center gap-x-6 gap-y-8 md:gap-x-8 md:gap-y-10">
                  {schedule.map((s, i) => (
                    <li key={`${s.time}-${i}`} className="contents">
                      <span className="pt-0.5 text-right text-[16px] tabular-nums leading-snug tracking-wide md:text-[17px]" style={{ color: GOLD_MUTED }}>{s.time}</span>
                      <span aria-hidden="true" className="relative flex items-center justify-center self-stretch">
                        {i > 0 ? <span className="absolute left-1/2 -top-8 h-8 w-px -translate-x-1/2 md:-top-10" style={{ backgroundColor: hexToRgba(GOLD, 0.4) }} /> : null}
                        <span className="relative block h-2.5 w-2.5 rounded-full" style={{ backgroundColor: GOLD, boxShadow: `0 0 0 2px ${hexToRgba(GOLD, 0.2)}` }} />
                        {i < schedule.length - 1 ? <span className="absolute bottom-1/2 left-1/2 top-1/2 w-px -translate-x-1/2 md:-bottom-10" style={{ backgroundColor: hexToRgba(GOLD, 0.4) }} /> : null}
                      </span>
                      <span className="flex flex-col pt-0.5 text-left leading-snug">
                        <span className="text-[17px] font-medium md:text-[19px]" style={{ color: GOLD }}>{s.label}</span>
                        {LPD_SCHEDULE_CN[s.label] ? <span className="text-[13px] opacity-70 md:text-[14px]" style={{ color: GOLD }}>{LPD_SCHEDULE_CN[s.label]}</span> : null}
                      </span>
                    </li>
                  ))}
                </ol>
              </div>
            ) : null}

            {/* guestbook */}
            <section className="mx-auto w-full max-w-[338px] md:max-w-[560px]" style={{ color: GOLD }}>
              <div className="text-center">
                <h2 className="text-[26px] font-semibold uppercase md:text-[32px]" style={{ color: GOLD, letterSpacing: "0.04em" }}>Sổ lưu bút <span className="opacity-70">/ 賓客留言</span></h2>
              </div>
              <DragonPhoenixWishForm GOLD={GOLD} BTN_TEXT={BTN_TEXT} />
              <div className="mx-auto mt-8 max-h-[500px] w-full space-y-3 overflow-y-auto pr-2">
                {wishes.length > 0 ? (
                  wishes.map((w, i) => (
                    <div key={`${w.name}-${i}`} className="rounded-xl border p-3 text-sm" style={{ borderColor: hexToRgba(GOLD, 0.25), backgroundColor: hexToRgba(GOLD, 0.05) }}>
                      <div className="flex items-start justify-between">
                        <span className="font-semibold" style={{ color: GOLD }}>{w.name}</span>
                        <span className="opacity-60">{formatWishTime(w.time)}</span>
                      </div>
                      <p className="mt-2 whitespace-pre-line leading-relaxed" style={{ color: GOLD_MUTED }}>{w.text}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-base opacity-70 md:text-[17px]">Chưa có lời chúc nào. Hãy là người đầu tiên!</p>
                )}
              </div>
            </section>

            {/* bank envelope */}
            {bankCards.length > 0 ? (
              <div className="flex w-full flex-col items-center justify-center">
                <h2 className="mb-1 text-[24px] font-semibold md:text-[30px]" style={{ color: GOLD, letterSpacing: "0.02em" }}>Phong Bao Mừng Cưới</h2>
                <p className="mb-4 text-[14px] opacity-70 md:text-[16px]" style={{ color: GOLD }}>結婚紅包</p>
                <button type="button" aria-label="Mở hộp mừng cưới" onClick={() => setBankOpen(true)} className="group relative cursor-pointer border-none bg-transparent outline-none" style={{ width: 200, height: 256 }}>
                  <div className="relative flex h-full w-full items-center justify-center">
                    <span aria-hidden="true" className="absolute left-6 top-6 text-lg" style={{ color: GOLD }}>✦</span>
                    <span aria-hidden="true" className="absolute right-7 top-10 text-sm" style={{ color: GOLD }}>✦</span>
                    <span aria-hidden="true" className="absolute bottom-10 left-10 text-sm" style={{ color: GOLD }}>✦</span>
                    <div className="relative" style={{ width: 140, height: 196 }}>
                      <div className="absolute overflow-hidden rounded-lg" style={{ inset: 0, backgroundColor: "#8a1220", boxShadow: "0 4px 20px rgba(0,0,0,0.4)" }}>
                        <div className="absolute left-0 right-0 top-0" style={{ height: 4, backgroundColor: GOLD }} />
                        <div className="absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full shadow-lg" style={{ width: 63, height: 63, background: `radial-gradient(circle, ${GOLD} 0%, #d97706 100%)`, border: "3px solid #fef3c7" }}>
                          <span className="font-bold" style={{ fontSize: 30.8, color: "#8a1220", lineHeight: 1 }}>囍</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <p className="absolute -bottom-3 left-1/2 flex -translate-x-1/2 flex-col items-center whitespace-nowrap text-xs font-medium" style={{ color: GOLD }}>
                    <span>Nhấn để mở</span>
                    <span className="opacity-70">點擊開啟</span>
                  </p>
                </button>
                {bankOpen ? (
                  <div className="fixed inset-0 z-[95] flex items-end justify-center bg-black/60 p-0 sm:items-center sm:p-4" onClick={() => setBankOpen(false)}>
                    <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto sm:max-w-xl" style={{ backgroundColor: CARD_BG }} onClick={(e) => e.stopPropagation()}>
                      <div className="relative px-6 pb-4 pt-6 text-center" style={{ backgroundColor: "#8a1220" }}>
                        <button type="button" aria-label="Đóng" onClick={() => setBankOpen(false)} className="absolute right-3 top-3 text-white/80 hover:text-white">✕</button>
                        <h2 className="text-[21px] md:text-[26px]" style={{ color: GOLD, letterSpacing: "0.02em" }}>Phong Bao Mừng Cưới / 結婚紅包</h2>
                      </div>
                      <div className="p-4 sm:p-6">
                        <div className="flex flex-col items-center gap-4 sm:flex-row sm:flex-wrap sm:items-start sm:justify-center" style={{ color: GOLD }}>
                          {bankCards.map((q) => {
                            const qr = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(`${q.bank} ${q.num} ${q.name}`)}`;
                            return (
                              <div key={q.role} className="flex max-w-[180px] flex-1 flex-col items-center sm:max-w-none">
                                <h3 className="mb-2 flex min-h-[2rem] items-start justify-center text-center text-xs font-medium" style={{ color: GOLD }}>{q.role} - {q.name}</h3>
                                <div className="flex h-32 w-32 items-center justify-center rounded-xl bg-white p-2 shadow-lg sm:h-40 sm:w-40" style={{ border: `2px solid ${hexToRgba(GOLD, 0.3)}` }}>
                                  <img alt={`QR - ${q.role} - ${q.name}`} className="h-full w-full object-contain" src={qr} />
                                </div>
                                <div className="mt-2 space-y-0.5 text-center">
                                  <p className="text-[10px]">{q.bank}</p>
                                  <p className="font-mono text-[10px]">{q.num}</p>
                                  <p className="text-[10px] font-semibold">{q.name}</p>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : null}
              </div>
            ) : null}

            {/* footer */}
            <footer className="flex w-full max-w-[329px] flex-col items-center gap-1 text-center md:max-w-2xl">
              <span className="whitespace-pre-line text-[14px] leading-normal md:text-base" style={{ color: GOLD }}>Gia đình xin chân thành cảm ơn quý khách đã đến chung vui.</span>
              <span className="text-[13px] opacity-70 md:text-[15px]" style={{ color: GOLD_MUTED }}>您的蒞臨是我們最大的榮幸！</span>
            </footer>
          </div>
        </section>

        <div className="relative z-20 flex items-center justify-center pb-3 pt-2">
          <a href="https://thiepmungonline.com" target="_blank" rel="noopener noreferrer" className="text-[14px] opacity-70 transition-opacity hover:opacity-90 md:text-[15px]" style={{ color: GOLD }}>♡ thiepmungonline.com</a>
        </div>
      </div>
    </div>
  );
}

const DD_TEX = "/images/double-dragon.webp";
const DD_HY = "/images/chu-hy.webp";
const DD_SERIF = 'Baskerville, "Times New Roman", serif';
const DD_TNR = '"Times New Roman", serif';

interface DdPalette {
  red: string;
  linen: string;
  gray: string;
  lunar: string;
  groomLabel: string;
  brideLabel: string;
  avatars: { groom: string; bride: string };
}

const DD_RED_PALETTE: DdPalette = {
  red: "#882925",
  linen: "#ECDFD6",
  gray: "#464646",
  lunar: "(Tức ngày 14/12 năm Ất Tỵ)",
  groomLabel: "Trưởng Nam",
  brideLabel: "Út Nữ",
  avatars: {
    groom: "/chungdoi/uploads/double-dragon-red/800e73ae-d21f-4bbd-8546-cd7bb9399e45.jpg",
    bride: "/chungdoi/uploads/double-dragon-red/bf33d754-3356-434c-ab17-4e0d07257698.jpg",
  },
};

const DD_BLUE_PALETTE: DdPalette = {
  red: "#253F78",
  linen: "#E8ECD6",
  gray: "#464646",
  lunar: "(Tức ngày 12/09 năm Ất Tỵ)",
  groomLabel: "Út Nam",
  brideLabel: "Thứ Nữ",
  avatars: {
    groom: "/chungdoi/uploads/double-dragon-blue/ff30b091-fbe1-4f66-8163-be41d70554d6.jpg",
    bride: "/chungdoi/uploads/double-dragon-blue/26477c03-eb5a-4486-b06b-74ea917b48e1.jpg",
  },
};

function DdTexture({ posY, opacity = 0.25 }: { posY: string; opacity?: number }) {
  return (
    <div
      className="pointer-events-none absolute inset-0"
      style={{ backgroundImage: `url("${DD_TEX}")`, backgroundSize: "clamp(300px, 50vw, 500px)", backgroundPositionY: posY, mixBlendMode: "color-dodge", opacity }}
    />
  );
}

function DdRedBand({ children, red, linen }: { children: React.ReactNode; red: string; linen: string }) {
  return (
    <div className="w-full py-3 md:py-4" style={{ backgroundColor: red }}>
      <h2 className="flex flex-col items-center text-center text-[20px] font-bold uppercase tracking-wide md:text-[24px]" style={{ color: linen, fontFamily: DD_TNR }}>
        {children}
      </h2>
    </div>
  );
}

function DoubleDragonWishForm({ red }: { red: string }) {
  const { formProps, pending, state } = useWishFormBinding();

  return (
    <form {...formProps} className="mx-auto mt-6 w-full max-w-full md:max-w-[600px]">
      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-lg">
        <div className="mb-4">
          <input name="name" required maxLength={120} placeholder="Nhập tên của bạn*" className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-red-400 focus:ring-2 focus:ring-red-200" type="text" />
        </div>
        <textarea name="text" required maxLength={1000} placeholder="Nhập lời chúc của bạn*" rows={4} className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-red-400 focus:ring-2 focus:ring-red-200" style={{ resize: "none" }} />
        {state?.error ? <p className="mt-3 text-sm text-red-600">{state.error}</p> : null}
        {state?.ok ? <p className="mt-3 text-sm" style={{ color: red }}>Cảm ơn lời chúc của bạn!</p> : null}
        <div className="mt-4 flex items-center justify-end text-xs">
          <button type="submit" disabled={pending} className="rounded-full px-4 py-2 text-sm font-medium text-white transition-all duration-200 hover:scale-105 disabled:opacity-60 sm:px-8 sm:py-3 sm:text-base" style={{ backgroundColor: red }}>{pending ? "Đang gửi..." : "GỬI LỜI CHÚC"}</button>
        </div>
      </div>
    </form>
  );
}

function DoubleDragonInvitation({ content, palette = DD_RED_PALETTE }: { content: ChungDoiDemoContent; palette?: DdPalette }) {
  const { couple, families, venue, schedule, gallery, wishes } = content;
  const DD_RED = palette.red;
  const DD_LINEN = palette.linen;
  const DD_GRAY = palette.gray;
  const DD_LUNAR = palette.lunar;
  const DD_AVATARS = palette.avatars;
  const reception = formatDate(couple.date);
  const calendar = buildCalendar(couple.date);
  const galleryShown = gallery.slice(0, 4);
  const galleryExtra = Math.max(0, gallery.length - 4);
  const mapQuery = venue.mapAddress || venue.address.replace(/\n+/g, ", ").trim();

  const bankCards = ([
    { label: `Chú Rể - ${content.bank.groomAccountName}`, bank: content.bank.groomBankName, num: content.bank.groomAccountNumber, name: content.bank.groomAccountName },
    { label: `Cô Dâu - ${content.bank.brideAccountName}`, bank: content.bank.brideBankName, num: content.bank.brideAccountNumber, name: content.bank.brideAccountName },
  ] as const).filter((q) => q.bank);

  return (
    <div className="flex w-full justify-center overflow-x-clip bg-white">
      <div className="relative flex w-full max-w-[480px] flex-col overflow-hidden md:mx-auto md:max-w-[900px] md:border md:border-[#88292522]" style={{ backgroundColor: DD_LINEN }}>
        {/* top red band */}
        <div className="relative h-12 w-full sm:h-16 md:h-[128px]" style={{ backgroundColor: DD_RED }}>
          <div className="absolute inset-0 opacity-40" style={{ backgroundImage: `url("${DD_TEX}")`, backgroundSize: "clamp(300px, 50vw, 500px)" }} />
        </div>

        {/* header: 囍 divider + avatars */}
        <div className="relative w-full overflow-hidden px-2 py-6 sm:py-8 md:py-10" style={{ backgroundColor: DD_LINEN }}>
          <DdTexture posY="50%" />
          <div className="absolute left-0 right-0 top-[66px] z-10 h-[40px] sm:top-[88px] sm:h-[50px] md:top-[125px] md:h-[70px]" style={{ backgroundColor: DD_RED }}>
            <div className="absolute inset-0 opacity-40" style={{ backgroundImage: `url("${DD_TEX}")`, backgroundSize: "clamp(300px, 50vw, 500px)", backgroundPositionY: "30%" }} />
            <img alt="" src={DD_HY} className="absolute left-1/2 top-1/2 h-[52px] w-[52px] -translate-x-1/2 -translate-y-1/2 sm:h-[70px] sm:w-[70px] md:h-[96px] md:w-[96px]" />
          </div>
          <div className="pointer-events-none relative z-20 flex items-start justify-center gap-2 sm:gap-4">
            <div className="pointer-events-auto flex min-w-0 flex-1 flex-col items-center">
              <img src={DD_AVATARS.groom} alt={couple.groomShortName} className="h-[120px] w-[120px] rounded-full object-cover sm:h-[160px] sm:w-[160px] md:h-[240px] md:w-[240px]" />
              <div className="mt-2 text-xs font-light sm:mt-3 sm:text-sm md:mt-4 md:text-base" style={{ color: DD_GRAY }}>{couple.groomBirthOrder || palette.groomLabel}</div>
              <div className="whitespace-nowrap text-2xl sm:text-3xl md:text-4xl" style={{ color: DD_RED, fontFamily: '"Fz Aghita", cursive' }}>{couple.groomShortName}</div>
            </div>
            <div className="w-[52px] shrink-0 sm:w-[70px] md:w-[96px]" />
            <div className="pointer-events-auto flex min-w-0 flex-1 flex-col items-center">
              <img src={DD_AVATARS.bride} alt={couple.brideShortName} className="h-[120px] w-[120px] rounded-full object-cover sm:h-[160px] sm:w-[160px] md:h-[240px] md:w-[240px]" />
              <div className="mt-2 text-xs font-light sm:mt-3 sm:text-sm md:mt-4 md:text-base" style={{ color: DD_GRAY }}>{couple.brideBirthOrder || palette.brideLabel}</div>
              <div className="whitespace-nowrap text-2xl sm:text-3xl md:text-4xl" style={{ color: DD_RED, fontFamily: '"Fz Aghita", cursive' }}>{couple.brideShortName}</div>
            </div>
          </div>
        </div>

        <DdRedBand red={DD_RED} linen={DD_LINEN}>THÔNG TIN LỄ CƯỚI</DdRedBand>

        {/* family + báo tin + ceremony */}
        <div className="relative w-full overflow-hidden" style={{ backgroundColor: DD_LINEN }}>
          <DdTexture posY="10%" />
          <div className="relative z-10">
            <div className="mt-6 flex w-full items-start justify-center gap-3 px-2 sm:px-4 md:gap-8" style={{ color: DD_RED, fontFamily: DD_SERIF }}>
              {[
                { title: families.groomParentTitle || "Ông bà", a: families.groomFather, b: families.groomMother, addr: families.groomAddress },
                { title: families.brideParentTitle || "Ông bà", a: families.brideFather, b: families.brideMother, addr: families.brideAddress },
              ].map((f, i) => (
                <div key={i} className="contents">
                  {i === 1 ? <div className="h-[60px] w-px self-center" style={{ backgroundColor: DD_RED }} /> : null}
                  <div className="flex min-w-0 max-w-[160px] flex-1 flex-col items-center gap-1 text-center md:max-w-[280px]">
                    <span className="text-[14px] md:text-[15px]" style={{ color: DD_GRAY }}>{f.title}</span>
                    <span className="whitespace-nowrap font-semibold" style={{ color: DD_RED, fontSize: 15 }}>{f.a}</span>
                    <span className="whitespace-nowrap font-semibold" style={{ color: DD_RED, fontSize: 15 }}>{f.b}</span>
                    <div className="mt-1 flex flex-col whitespace-pre-line text-[12px] leading-tight md:text-[13px]" style={{ color: DD_GRAY }}>{f.addr}</div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8 flex flex-col gap-2 whitespace-pre-line px-4 text-center text-[16px] uppercase tracking-wider md:text-[20px]" style={{ color: DD_RED, fontFamily: DD_SERIF }}>
              TRÂN TRỌNG BÁO TIN{"\n"}LỄ THÀNH HÔN CỦA CON CHÚNG TÔI
            </div>

            <div className="relative mb-6 mt-4 flex flex-col items-center gap-3 text-center md:gap-4">
              <h3 className="font-qellia flex w-[80%] items-center justify-center whitespace-nowrap leading-[50px] md:leading-[100px]" style={{ fontSize: 64, color: DD_RED }}>{couple.groomFullName}</h3>
              <div className="text-[12px] uppercase tracking-[0.2em] md:text-[13px]" style={{ color: DD_GRAY, fontFamily: DD_SERIF }}>{couple.groomBirthOrder || palette.groomLabel}</div>
              <div className="font-qellia text-[30px] md:text-[35px]" style={{ color: DD_GRAY }}>&amp;</div>
              <h3 className="font-qellia flex w-[80%] items-center justify-center whitespace-nowrap leading-[50px] md:leading-[100px]" style={{ fontSize: 64, color: DD_RED }}>{couple.brideFullName}</h3>
              <div className="text-[12px] uppercase tracking-[0.2em] md:text-[13px]" style={{ color: DD_GRAY, fontFamily: DD_SERIF }}>{couple.brideBirthOrder || palette.brideLabel}</div>
            </div>

            <div className="flex w-full flex-col items-center justify-center px-4 py-8 sm:px-6" style={{ color: DD_GRAY, fontFamily: DD_SERIF }}>
              <div style={{ color: DD_RED }}>
                <span className="flex flex-col items-center whitespace-pre-line text-center text-[16px] leading-relaxed md:text-[20px]">{couple.ceremonyHeader || "LỄ THÀNH HÔN ĐƯỢC CỬ HÀNH TẠI\nTƯ GIA"}</span>
              </div>
              {couple.ceremonyTime ? <p className="mt-2 text-center text-[14px] uppercase md:text-[15px]" style={{ color: DD_GRAY }}>Vào lúc {couple.ceremonyTime}</p> : null}
              {reception ? (
                <>
                  <div className="mt-5 flex items-center justify-center" style={{ color: DD_RED }}>
                    <span className="w-[70px] whitespace-nowrap text-right text-[14px] uppercase md:w-[85px] md:text-[15px]" style={{ color: DD_GRAY }}>{reception.weekday}</span>
                    <span className="mx-3 h-[25px] w-px self-center opacity-50 md:mx-4" style={{ backgroundColor: DD_GRAY }} />
                    <span className="text-[32px] md:text-[38px]" style={{ color: DD_RED }}>{reception.day}</span>
                    <span className="mx-3 h-[25px] w-px self-center opacity-50 md:mx-4" style={{ backgroundColor: DD_GRAY }} />
                    <span className="w-[70px] whitespace-nowrap text-left text-[14px] uppercase md:w-[85px] md:text-[15px]" style={{ color: DD_GRAY }}>Tháng {reception.month}</span>
                  </div>
                  <div className="mt-2 text-center text-[20px] md:text-[22px]" style={{ color: DD_GRAY }}>{reception.yearNumber}</div>
                  <div className="mt-2 text-center text-[13px] uppercase tracking-wide md:text-[14px]" style={{ color: DD_GRAY }}>{DD_LUNAR}</div>
                </>
              ) : null}
            </div>
          </div>
        </div>

        {galleryShown.length > 0 ? (
          <>
            <DdRedBand red={DD_RED} linen={DD_LINEN}>Album Ảnh Cưới</DdRedBand>
            <div className="relative w-full overflow-hidden" style={{ backgroundColor: DD_LINEN }}>
              <DdTexture posY="40%" />
              <div className="relative z-10 mx-auto w-full max-w-lg px-2 py-4 sm:px-4">
                <div className="grid grid-cols-2 gap-4">
                  {galleryShown.map((src, i) => (
                    <div key={src} className="group relative aspect-square cursor-pointer overflow-hidden rounded-lg">
                      <img src={src} alt={`Wedding photo ${i + 1}`} className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-[1.03]" />
                      {i === galleryShown.length - 1 && galleryExtra > 0 ? (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/60">
                          <span className="text-lg font-semibold text-white">+{galleryExtra}</span>
                        </div>
                      ) : null}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        ) : null}

        {reception ? (
          <>
            <DdRedBand red={DD_RED} linen={DD_LINEN}>THÔNG TIN TIỆC CƯỚI</DdRedBand>
            <div className="relative w-full overflow-hidden" style={{ backgroundColor: DD_LINEN }}>
              <DdTexture posY="60%" />
              <div className="relative z-10 -mt-[1px] flex w-full flex-col items-center justify-center px-2 pb-8 pt-6 sm:px-4">
                <h3 className="flex flex-col items-center text-center text-[16px] uppercase md:text-[20px]" style={{ color: DD_RED, fontFamily: DD_SERIF }}>Tiệc cưới sẽ diễn ra vào lúc:</h3>
                <div className="mt-2 text-center text-[20px] font-semibold md:text-[24px]" style={{ color: DD_RED, fontFamily: DD_SERIF }}>{venue.banquetTime || couple.time}</div>
                <div className="mt-5 flex items-center justify-center" style={{ fontFamily: DD_SERIF }}>
                  <span className="w-[70px] whitespace-nowrap text-right text-[14px] uppercase md:w-[85px] md:text-[15px]" style={{ color: DD_GRAY }}>{reception.weekday}</span>
                  <span className="mx-3 h-[25px] w-px self-center opacity-50 md:mx-4" style={{ backgroundColor: DD_GRAY }} />
                  <span className="text-[32px] md:text-[38px]" style={{ color: DD_RED }}>{reception.day}</span>
                  <span className="mx-3 h-[25px] w-px self-center opacity-50 md:mx-4" style={{ backgroundColor: DD_GRAY }} />
                  <span className="w-[70px] whitespace-nowrap text-left text-[14px] uppercase md:w-[85px] md:text-[15px]" style={{ color: DD_GRAY }}>Tháng {reception.month}</span>
                </div>
                <div className="mt-2 text-center text-[20px] md:text-[22px]" style={{ color: DD_GRAY }}>{reception.yearNumber}</div>
                <div className="mt-2 text-center text-[13px] md:text-[14px]" style={{ color: DD_GRAY }}>{DD_LUNAR}</div>
                {schedule.length > 0 ? (
                  <div className="mt-4 flex items-center justify-center gap-8">
                    <div className="flex flex-col items-center">
                      <span className="text-[11px] uppercase" style={{ color: DD_GRAY, fontFamily: DD_SERIF }}>{schedule[1]?.label || schedule[0].label}</span>
                      <span className="mt-1 text-[20px] font-semibold" style={{ color: DD_RED, fontFamily: DD_SERIF }}>{venue.banquetTime || couple.time}</span>
                    </div>
                  </div>
                ) : null}
                {calendar ? (
                  <div className="mx-auto mt-2 w-[296px] max-w-full md:w-[352px]">
                    <div className="mx-auto w-full overflow-hidden rounded-lg border" style={{ borderColor: hexToRgba(DD_RED, 0.27), color: DD_RED }}>
                      <div className="border-b py-2.5 text-center text-[13px] font-semibold tracking-wide md:text-[14px]" style={{ borderColor: hexToRgba(DD_RED, 0.27) }}>Tháng {calendar.month} / {calendar.year}</div>
                      <div className="grid grid-cols-7 border-b-2" style={{ borderColor: DD_RED }}>
                        {WEEKDAY_LABELS.map((d) => (<div key={d} className="py-1.5 text-center text-[10px] font-medium opacity-60 md:text-[11px]">{d}</div>))}
                      </div>
                      <div className="grid grid-cols-7 gap-y-0.5 px-1 py-2">
                        {calendar.cells.map((day, i) => (
                          <div key={i} className="flex h-[30px] items-center justify-center md:h-[34px]">
                            {day === calendar.highlight ? (
                              <div className="relative flex h-[24px] w-[26px] items-center justify-center md:h-[28px] md:w-[30px]">
                                <svg viewBox="0 0 24 22" className="absolute inset-0 h-full w-full drop-shadow-sm" fill={DD_RED}>
                                  <path d="M12 21C12 21 1.5 13.5 1.5 7.5C1.5 4.46 3.96 2 7 2C8.76 2 10.35 2.81 11.4 4.09L12 4.8L12.6 4.09C13.65 2.81 15.24 2 17 2C20.04 2 22.5 4.46 22.5 7.5C22.5 13.5 12 21 12 21Z" />
                                </svg>
                                <span className="relative z-10 text-[11px] font-bold md:text-[12px]" style={{ color: "#fff" }}>{day}</span>
                              </div>
                            ) : day ? (<span className="text-[12px] md:text-[13px]">{day}</span>) : null}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : null}
                <a href={googleCalendarUrl(content)} target="_blank" rel="noopener noreferrer" className="mt-4 inline-flex items-center justify-center text-sm tracking-wide underline decoration-1 underline-offset-4 transition-opacity hover:opacity-70" style={{ color: DD_RED, fontFamily: DD_SERIF }}>Thêm vào lịch</a>
                <button type="button" className="mt-3 inline-flex min-h-[44px] items-center justify-center rounded-full px-10 text-sm font-semibold uppercase tracking-wide" style={{ backgroundColor: DD_RED, color: DD_LINEN }}>Xác Nhận</button>
              </div>
            </div>
          </>
        ) : null}

        {mapQuery ? (
          <>
            <DdRedBand red={DD_RED} linen={DD_LINEN}>Tiệc cưới sẽ tổ chức tại</DdRedBand>
            <div className="relative flex w-full flex-col items-center overflow-hidden pb-10" style={{ backgroundColor: DD_LINEN }}>
              <DdTexture posY="70%" />
              <div className="relative z-10 flex w-full flex-col items-center">
                <div className="mt-6 flex w-[92%] max-w-3xl flex-col items-center whitespace-pre-line break-words rounded-lg p-4 text-center text-sm font-medium md:text-base" style={{ backgroundColor: DD_LINEN, color: DD_GRAY, fontFamily: DD_SERIF }}>{venue.address}</div>
                <iframe src={mapEmbedUrl(mapQuery)} title={mapQuery} className="mt-4 h-[350px] w-[92%] max-w-3xl rounded-xl md:h-[450px]" loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
              </div>
            </div>
          </>
        ) : null}

        {schedule.length > 0 ? (
          <div className="relative w-full overflow-hidden" style={{ backgroundColor: DD_LINEN }}>
            <DdTexture posY="75%" />
            <div className="relative z-10 mb-10 mt-10 flex flex-col gap-6 px-4 md:mb-12 md:mt-12 md:gap-8">
              <h2 className="flex flex-col items-center text-center text-[20px] font-bold uppercase tracking-wide md:text-[24px]" style={{ color: DD_RED, fontFamily: DD_TNR }}>LỊCH TRÌNH NGÀY CƯỚI</h2>
              <ol className="relative mx-auto grid w-full max-w-[460px] grid-cols-[minmax(0,1fr)_16px_minmax(0,1fr)] items-center gap-x-6 gap-y-8 md:gap-x-8 md:gap-y-10" style={{ fontFamily: DD_SERIF }}>
                {schedule.map((s, i) => (
                  <li key={`${s.time}-${i}`} className="contents">
                    <span className="pt-0.5 text-right text-[16px] leading-snug tabular-nums tracking-wide md:text-[17px]" style={{ color: DD_RED }}>{s.time}</span>
                    <span aria-hidden="true" className="relative flex items-center justify-center self-stretch">
                      {i > 0 ? <span className="absolute left-1/2 -top-8 h-8 w-px -translate-x-1/2 md:-top-10" style={{ backgroundColor: hexToRgba(DD_RED, 0.4) }} /> : null}
                      <span className="relative block h-2.5 w-2.5 rounded-full" style={{ backgroundColor: DD_RED, boxShadow: `0 0 0 2px ${hexToRgba(DD_RED, 0.13)}` }} />
                      {i < schedule.length - 1 ? <span className="absolute bottom-1/2 left-1/2 top-1/2 w-px -translate-x-1/2 md:-bottom-10" style={{ backgroundColor: hexToRgba(DD_RED, 0.4) }} /> : null}
                    </span>
                    <span className="pt-0.5 text-left text-[17px] font-medium leading-snug md:text-[19px]" style={{ color: DD_GRAY }}>{s.label}</span>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        ) : null}

        <DdRedBand red={DD_RED} linen={DD_LINEN}>Sổ lưu bút</DdRedBand>
        <div className="relative w-full overflow-hidden" style={{ backgroundColor: DD_LINEN }}>
          <DdTexture posY="85%" />
          <div className="relative z-10 px-4 py-10">
            <DoubleDragonWishForm red={DD_RED} />
            {wishes.length > 0 ? (
              <div className="mx-auto mt-8 max-h-[500px] w-full max-w-full space-y-3 overflow-y-auto pr-2 md:max-w-[600px]">
                {wishes.map((w, i) => (
                  <div key={`${w.name}-${i}`} className="rounded-lg border border-gray-100 bg-white p-4 shadow-md">
                    <div className="flex items-start justify-between">
                      <span className="text-lg" style={{ color: DD_RED, fontFamily: DD_TNR }}>{w.name}</span>
                      <span className="text-xs opacity-70" style={{ color: DD_GRAY }}>{formatWishTime(w.time)}</span>
                    </div>
                    <p className="mt-2 leading-relaxed" style={{ color: DD_GRAY }}>{w.text}</p>
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        </div>

        {bankCards.length > 0 ? (
          <>
            <div className="relative z-10 h-[80px] w-full" style={{ backgroundColor: DD_RED }}>
              <div className="absolute inset-0 opacity-40" style={{ backgroundImage: `url("${DD_TEX}")`, backgroundSize: "clamp(300px, 50vw, 500px)" }} />
            </div>
            <div className="relative z-10 flex flex-col items-center justify-center px-4 py-8" style={{ backgroundColor: DD_LINEN }}>
              <h2 className="mb-4 flex flex-col items-center text-[20px] font-bold uppercase tracking-wide md:text-[24px]" style={{ color: DD_RED, fontFamily: DD_SERIF }}>Phong Bao Mừng Cưới</h2>
              <div className="flex flex-row flex-wrap items-start justify-center gap-4 sm:gap-8">
                {bankCards.map((q) => {
                  const qr = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(`${q.bank} ${q.num} ${q.name}`)}`;
                  return (
                    <div key={q.label} className="flex max-w-[200px] flex-1 flex-col items-center">
                      <h3 className="mb-2 line-clamp-2 flex min-h-[2rem] items-start justify-center text-center text-xs font-medium" style={{ color: DD_RED }}>{q.label}</h3>
                      <div className="flex h-32 w-32 items-center justify-center rounded-xl bg-white p-2 shadow-lg sm:h-40 sm:w-40">
                        <img src={qr} alt={`QR - ${q.label}`} className="h-full w-full object-contain" />
                      </div>
                      <p className="mt-2 text-[13px] font-semibold" style={{ color: DD_GRAY }}>{q.bank}</p>
                      <p className="text-[13px]" style={{ color: DD_GRAY }}>{q.num}</p>
                      <p className="text-[13px]" style={{ color: DD_GRAY }}>{q.name}</p>
                      <a href={qr} target="_blank" rel="noreferrer" className="mt-3 rounded-full border px-4 py-1.5 text-[11px] font-semibold uppercase" style={{ borderColor: DD_RED, color: DD_RED }}>Lưu QR</a>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        ) : null}

        <footer className="relative z-10 flex w-full flex-col items-center justify-center px-4 py-6 text-center" style={{ backgroundColor: DD_RED }}>
          <span className="whitespace-pre-line text-[12px] md:text-[15px] lg:text-[18px]" style={{ fontFamily: DD_SERIF, color: DD_LINEN }}>Sự hiện diện của quý khách là niềm vinh hạnh của gia đình chúng tôi!</span>
        </footer>
        <div className="relative z-10 flex items-center justify-center py-3" style={{ backgroundColor: DD_LINEN }}>
          <a href="https://thiepmungonline.com" target="_blank" rel="noopener noreferrer" className="text-xs opacity-50 transition-opacity hover:opacity-70" style={{ color: DD_RED }}>♡ thiepmungonline.com</a>
        </div>
      </div>
    </div>
  );
}

const SLX_GREEN = "#1F3A25";
const SLX_LINEN = "#ECE8D6";
const SLX_GRAY = "#464646";
const SLX_SERIF = 'Baskerville, "Times New Roman", serif';
const SLX_TNR = '"Times New Roman", serif';
const SLX_LUNAR = "(Tức ngày 02/03 năm Bính Ngọ / 음력 02/03 丙午)";
const SLX_AVATARS = {
  groom: "/chungdoi/uploads/double-dragon-green/1de8aeab-1ffe-46a1-8cd6-a0752ba57b99.jpg",
  bride: "/chungdoi/uploads/double-dragon-green/d05db7ea-4eb0-4c23-96fc-89e96b693078.jpg",
};
const KR_DAYS = ["일요일", "월요일", "화요일", "수요일", "목요일", "금요일", "토요일"];
const KR_SCHEDULE: Record<string, string> = {
  "Đón khách": "하객 맞이",
  "Khai tiệc": "피로연",
  "Rót rượu, cắt bánh": "건배 및 케이크 컷팅",
  "Phục vụ món chính": "메인 요리",
  "Kết thúc tiệc": "환송",
};

function shiftTime(hhmm: string, deltaMin: number) {
  const [h, m] = hhmm.split(":").map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return hhmm;
  const total = (h * 60 + m + deltaMin + 1440) % 1440;
  return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
}

function SlxBand({ vi, ko }: { vi: string; ko: string }) {
  return (
    <div className="w-full py-3 md:py-4" style={{ backgroundColor: SLX_GREEN }}>
      <h2 className="flex flex-col items-center gap-0.5 text-center uppercase tracking-wide" style={{ color: SLX_LINEN, fontFamily: SLX_TNR }}>
        <span className="text-[20px] font-bold md:text-[24px]">{vi}</span>
        <span className="text-[12px] font-normal normal-case opacity-80 md:text-[13px]">{ko}</span>
      </h2>
    </div>
  );
}

function SongLongXanhWishForm() {
  const { formProps, pending, state } = useWishFormBinding();

  return (
    <form {...formProps} className="mx-auto mt-6 w-full max-w-full md:max-w-[600px]">
      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-lg">
        <div className="mb-4">
          <input name="name" required maxLength={120} placeholder="Nhập tên của bạn* / 이름" className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-green-700 focus:ring-2 focus:ring-green-200" type="text" />
        </div>
        <textarea name="text" required maxLength={1000} placeholder="Nhập lời chúc của bạn* / 축하 메시지" rows={4} className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-green-700 focus:ring-2 focus:ring-green-200" style={{ resize: "none" }} />
        {state?.error ? <p className="mt-2 text-sm text-red-600">{state.error}</p> : null}
        {state?.ok ? <p className="mt-2 text-sm" style={{ color: SLX_GREEN }}>Cảm ơn lời chúc của bạn!</p> : null}
        <div className="mt-4 flex items-center justify-end text-xs">
          <button type="submit" disabled={pending} className="rounded-full px-4 py-2 text-sm font-medium text-white transition-all duration-200 hover:scale-105 disabled:opacity-60 sm:px-8 sm:py-3 sm:text-base" style={{ backgroundColor: SLX_GREEN }}>{pending ? "Đang gửi..." : "Gửi lời chúc / 축하 보내기"}</button>
        </div>
      </div>
    </form>
  );
}

function SongLongXanhInvitation({ content }: { content: ChungDoiDemoContent }) {
  const { couple, families, venue, schedule, gallery, wishes } = content;
  const reception = formatDate(couple.date);
  const calendar = buildCalendar(couple.date);
  const recDate = parseISODate(couple.date);
  const krWeekday = recDate ? KR_DAYS[recDate.getDay()] : "";
  const galleryShown = gallery.slice(0, 4);
  const galleryExtra = Math.max(0, gallery.length - 4);
  const [lightbox, setLightbox] = useState<number | null>(null);

  useEffect(() => {
    if (lightbox === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLightbox(null);
      else if (e.key === "ArrowLeft") setLightbox((v) => (v === null ? v : (v - 1 + gallery.length) % gallery.length));
      else if (e.key === "ArrowRight") setLightbox((v) => (v === null ? v : (v + 1) % gallery.length));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lightbox, gallery.length]);
  const mapQuery = venue.mapAddress || venue.address.replace(/\n+/g, ", ").trim();
  const banquetTime = venue.banquetTime || couple.time || "11:00";

  const bankCards = ([
    { label: `Chú Rể - ${content.bank.groomAccountName}`, bank: content.bank.groomBankName, num: content.bank.groomAccountNumber, name: content.bank.groomAccountName },
    { label: `Cô Dâu - ${content.bank.brideAccountName}`, bank: content.bank.brideBankName, num: content.bank.brideAccountNumber, name: content.bank.brideAccountName },
  ] as const).filter((q) => q.bank);

  return (
    <div className="flex w-full justify-center overflow-x-clip bg-white">
      <div className="relative flex w-full max-w-[480px] flex-col overflow-hidden md:mx-auto md:max-w-[900px] md:border md:border-[#1F3A2522]" style={{ backgroundColor: SLX_LINEN }}>
        {/* top green band */}
        <div className="relative h-12 w-full sm:h-16 md:h-[128px]" style={{ backgroundColor: SLX_GREEN }} />

        {/* header: 囍 divider + avatars */}
        <div className="relative w-full overflow-hidden px-2 py-6 sm:py-8 md:py-10" style={{ backgroundColor: SLX_LINEN }}>
          <div className="absolute left-0 right-0 top-[66px] z-10 h-[40px] sm:top-[88px] sm:h-[50px] md:top-[125px] md:h-[70px]" style={{ backgroundColor: SLX_GREEN }}>
            <img alt="" src="/images/chu-hy.webp" className="absolute left-1/2 top-1/2 h-[52px] w-[52px] -translate-x-1/2 -translate-y-1/2 sm:h-[70px] sm:w-[70px] md:h-[96px] md:w-[96px]" />
          </div>
          <div className="pointer-events-none relative z-20 flex items-start justify-center gap-2 sm:gap-4">
            <div className="pointer-events-auto flex min-w-0 flex-1 flex-col items-center">
              <img src={SLX_AVATARS.groom} alt={couple.groomShortName} className="h-[120px] w-[120px] rounded-full object-cover sm:h-[160px] sm:w-[160px] md:h-[240px] md:w-[240px]" />
              <div className="mt-2 text-center text-xs font-light sm:mt-3 sm:text-sm md:mt-4 md:text-base" style={{ color: SLX_GRAY }}>{couple.groomBirthOrder || "Trưởng Nam"} / 신랑</div>
              <div className="whitespace-nowrap text-2xl sm:text-3xl md:text-4xl" style={{ color: SLX_GREEN, fontFamily: '"Fz Aghita", cursive' }}>{couple.groomShortName}</div>
            </div>
            <div className="w-[52px] shrink-0 sm:w-[70px] md:w-[96px]" />
            <div className="pointer-events-auto flex min-w-0 flex-1 flex-col items-center">
              <img src={SLX_AVATARS.bride} alt={couple.brideShortName} className="h-[120px] w-[120px] rounded-full object-cover sm:h-[160px] sm:w-[160px] md:h-[240px] md:w-[240px]" />
              <div className="mt-2 text-center text-xs font-light sm:mt-3 sm:text-sm md:mt-4 md:text-base" style={{ color: SLX_GRAY }}>{couple.brideBirthOrder || "Thứ Nữ"} / 신부</div>
              <div className="whitespace-nowrap text-2xl sm:text-3xl md:text-4xl" style={{ color: SLX_GREEN, fontFamily: '"Fz Aghita", cursive' }}>{couple.brideShortName}</div>
            </div>
          </div>
        </div>

        <SlxBand vi="Thông Tin Lễ Cưới" ko="예식 안내" />

        {/* family + báo tin + ceremony */}
        <div className="relative w-full" style={{ backgroundColor: SLX_LINEN }}>
          <div className="mt-6 flex w-full items-start justify-center gap-3 px-2 sm:px-4 md:gap-8" style={{ color: SLX_GREEN, fontFamily: SLX_SERIF }}>
            {[
              { a: families.groomFather, b: families.groomMother, addr: families.groomAddress, title: families.groomParentTitle || "Ông bà" },
              { a: families.brideFather, b: families.brideMother, addr: families.brideAddress, title: families.brideParentTitle || "Ông bà" },
            ].map((f, i) => (
              <div key={i} className="contents">
                {i === 1 ? <div className="h-[60px] w-px self-center" style={{ backgroundColor: SLX_GREEN }} /> : null}
                <div className="flex min-w-0 max-w-[160px] flex-1 flex-col items-center gap-1 text-center md:max-w-[280px]">
                  <span className="text-[14px] md:text-[15px]" style={{ color: SLX_GRAY }}>{f.title} / 부모님</span>
                  <span className="whitespace-nowrap font-semibold" style={{ color: SLX_GREEN, fontSize: 15 }}>{f.a}</span>
                  <span className="whitespace-nowrap font-semibold" style={{ color: SLX_GREEN, fontSize: 15 }}>{f.b}</span>
                  <div className="mt-1 flex flex-col whitespace-pre-line text-[12px] leading-tight md:text-[13px]" style={{ color: SLX_GRAY }}>{f.addr}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 flex flex-col gap-1 px-4 text-center" style={{ color: SLX_GREEN, fontFamily: SLX_SERIF }}>
            <span className="text-[16px] uppercase tracking-wider md:text-[20px]">Trân Trọng Báo Tin{"\n"}Lễ Thành Hôn Của Con Chúng Tôi</span>
            <span className="text-[13px] opacity-80 md:text-[14px]">저희 자녀의 결혼을 알려드립니다</span>
          </div>

          <div className="relative mb-6 mt-4 flex flex-col items-center gap-3 text-center md:gap-4">
            <h3 className="font-qellia flex w-[80%] items-center justify-center whitespace-nowrap leading-[50px] md:leading-[100px]" style={{ fontSize: 64, color: SLX_GREEN }}>{couple.groomFullName}</h3>
            <div className="text-[12px] uppercase tracking-[0.2em] md:text-[13px]" style={{ color: SLX_GRAY, fontFamily: SLX_SERIF }}>{couple.groomBirthOrder || "Trưởng Nam"} / 신랑</div>
            <div className="font-qellia text-[30px] md:text-[35px]" style={{ color: SLX_GRAY }}>&amp;</div>
            <h3 className="font-qellia flex w-[80%] items-center justify-center whitespace-nowrap leading-[50px] md:leading-[100px]" style={{ fontSize: 64, color: SLX_GREEN }}>{couple.brideFullName}</h3>
            <div className="text-[12px] uppercase tracking-[0.2em] md:text-[13px]" style={{ color: SLX_GRAY, fontFamily: SLX_SERIF }}>{couple.brideBirthOrder || "Thứ Nữ"} / 신부</div>
          </div>

          <div className="flex w-full flex-col items-center justify-center px-4 py-8 sm:px-6" style={{ color: SLX_GRAY, fontFamily: SLX_SERIF }}>
            <div className="flex flex-col items-center gap-1" style={{ color: SLX_GREEN }}>
              <span className="flex flex-col items-center whitespace-pre-line text-center text-[16px] leading-relaxed md:text-[20px]">{couple.ceremonyHeader || "LỄ THÀNH HÔN ĐƯỢC CỬ HÀNH TẠI\nTƯ GIA"}</span>
              <span className="text-[13px] opacity-80 md:text-[14px]">결혼식 장소 자택</span>
            </div>
            {couple.ceremonyTime ? <p className="mt-2 text-center text-[14px] uppercase md:text-[15px]" style={{ color: SLX_GRAY }}>Vào lúc / 시간 {couple.ceremonyTime}</p> : null}
            {reception ? (
              <>
                <div className="mt-5 flex items-center justify-center" style={{ color: SLX_GREEN }}>
                  <span className="flex w-[70px] flex-col items-center whitespace-nowrap text-center text-[13px] uppercase md:w-[85px] md:text-[14px]" style={{ color: SLX_GRAY }}>
                    <span>{reception.weekday}</span>
                    <span className="normal-case opacity-80">{krWeekday}</span>
                  </span>
                  <span className="mx-3 h-[34px] w-px self-center opacity-50 md:mx-4" style={{ backgroundColor: SLX_GRAY }} />
                  <span className="text-[32px] md:text-[38px]" style={{ color: SLX_GREEN }}>{reception.day}</span>
                  <span className="mx-3 h-[34px] w-px self-center opacity-50 md:mx-4" style={{ backgroundColor: SLX_GRAY }} />
                  <span className="flex w-[70px] flex-col items-center whitespace-nowrap text-center text-[13px] uppercase md:w-[85px] md:text-[14px]" style={{ color: SLX_GRAY }}>
                    <span>Tháng {reception.month}</span>
                    <span className="normal-case opacity-80">{reception.monthNumber}월</span>
                  </span>
                </div>
                <div className="mt-2 text-center text-[20px] md:text-[22px]" style={{ color: SLX_GRAY }}>{reception.yearNumber}</div>
                <div className="mt-2 text-center text-[13px] uppercase tracking-wide md:text-[14px]" style={{ color: SLX_GRAY }}>{SLX_LUNAR}</div>
              </>
            ) : null}
          </div>
        </div>

        {galleryShown.length > 0 ? (
          <>
            <SlxBand vi="Album Ảnh Cưới" ko="웨딩 앨범" />
            <div className="relative w-full" style={{ backgroundColor: SLX_LINEN }}>
              <div className="mx-auto w-full max-w-lg px-2 py-4 sm:px-4">
                <div className="grid grid-cols-2 gap-4">
                  {galleryShown.map((src, i) => (
                    <button key={src} type="button" onClick={() => setLightbox(i)} className="group relative aspect-square cursor-pointer overflow-hidden rounded-lg">
                      <img src={src} alt={`Wedding photo ${i + 1}`} className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-[1.03]" />
                      {i === galleryShown.length - 1 && galleryExtra > 0 ? (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/60">
                          <span className="text-lg font-semibold text-white">+{galleryExtra}</span>
                        </div>
                      ) : null}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            {lightbox !== null ? (
              <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black/90" onClick={() => setLightbox(null)}>
                <button type="button" aria-label="Đóng" onClick={() => setLightbox(null)} className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center text-2xl text-white/90 transition-opacity hover:opacity-70">✕</button>
                <div className="absolute top-5 text-sm text-white/80">{lightbox + 1} / {gallery.length}</div>
                <button type="button" aria-label="Ảnh trước" onClick={(e) => { e.stopPropagation(); setLightbox((v) => (v === null ? v : (v - 1 + gallery.length) % gallery.length)); }} className="absolute left-3 top-1/2 flex h-12 w-12 -translate-y-1/2 items-center justify-center text-3xl text-white/90 transition-opacity hover:opacity-70 md:left-8">‹</button>
                <img src={gallery[lightbox]} alt={`Wedding photo ${lightbox + 1}`} onClick={(e) => e.stopPropagation()} className="max-h-[78vh] max-w-[92vw] rounded-lg object-contain" />
                <button type="button" aria-label="Ảnh sau" onClick={(e) => { e.stopPropagation(); setLightbox((v) => (v === null ? v : (v + 1) % gallery.length)); }} className="absolute right-3 top-1/2 flex h-12 w-12 -translate-y-1/2 items-center justify-center text-3xl text-white/90 transition-opacity hover:opacity-70 md:right-8">›</button>
                <div className="absolute bottom-4 flex max-w-[92vw] gap-2 overflow-x-auto px-2" onClick={(e) => e.stopPropagation()}>
                  {gallery.map((src, i) => (
                    <button key={src} type="button" onClick={() => setLightbox(i)} className="h-14 w-14 shrink-0 overflow-hidden rounded-md border-2 transition-opacity" style={{ borderColor: i === lightbox ? SLX_LINEN : "transparent", opacity: i === lightbox ? 1 : 0.6 }}>
                      <img src={src} alt={`Thumbnail ${i + 1}`} className="h-full w-full object-cover" />
                    </button>
                  ))}
                </div>
              </div>
            ) : null}
          </>
        ) : null}

        {reception ? (
          <>
            <SlxBand vi="Thông Tin Tiệc Cưới" ko="피로연 안내" />
            <div className="relative w-full" style={{ backgroundColor: SLX_LINEN }}>
              <div className="-mt-[1px] flex w-full flex-col items-center justify-center px-2 pb-8 pt-6 sm:px-4">
                <h3 className="flex flex-col items-center gap-0.5 text-center text-[16px] uppercase md:text-[20px]" style={{ color: SLX_GREEN, fontFamily: SLX_SERIF }}>
                  <span>Tiệc cưới sẽ diễn ra vào lúc:</span>
                  <span className="text-[13px] normal-case opacity-80 md:text-[14px]">피로연 시간:</span>
                </h3>
                <div className="mt-2 text-center text-[20px] font-semibold md:text-[24px]" style={{ color: SLX_GREEN, fontFamily: SLX_SERIF }}>{banquetTime}</div>
                <div className="mt-5 flex items-center justify-center" style={{ fontFamily: SLX_SERIF }}>
                  <span className="flex w-[70px] flex-col items-center whitespace-nowrap text-center text-[13px] uppercase md:w-[85px] md:text-[14px]" style={{ color: SLX_GRAY }}>
                    <span>{reception.weekday}</span>
                    <span className="normal-case opacity-80">{krWeekday}</span>
                  </span>
                  <span className="mx-3 h-[34px] w-px self-center opacity-50 md:mx-4" style={{ backgroundColor: SLX_GRAY }} />
                  <span className="text-[32px] md:text-[38px]" style={{ color: SLX_GREEN }}>{reception.day}</span>
                  <span className="mx-3 h-[34px] w-px self-center opacity-50 md:mx-4" style={{ backgroundColor: SLX_GRAY }} />
                  <span className="flex w-[70px] flex-col items-center whitespace-nowrap text-center text-[13px] uppercase md:w-[85px] md:text-[14px]" style={{ color: SLX_GRAY }}>
                    <span>Tháng {reception.month}</span>
                    <span className="normal-case opacity-80">{reception.monthNumber}월</span>
                  </span>
                </div>
                <div className="mt-2 text-center text-[20px] md:text-[22px]" style={{ color: SLX_GRAY }}>{reception.yearNumber}</div>
                <div className="mt-2 text-center text-[13px] md:text-[14px]" style={{ color: SLX_GRAY }}>{SLX_LUNAR}</div>
                <div className="mt-4 flex items-center justify-center gap-10">
                  {[
                    { vi: "Đón khách", ko: "하객 맞이", time: shiftTime(banquetTime, -30) },
                    { vi: "Khai tiệc", ko: "피로연", time: banquetTime },
                  ].map((r) => (
                    <div key={r.vi} className="flex flex-col items-center">
                      <span className="text-[11px] uppercase" style={{ color: SLX_GRAY, fontFamily: SLX_SERIF }}>{r.vi}</span>
                      <span className="text-[10px] opacity-70" style={{ color: SLX_GRAY }}>{r.ko}</span>
                      <span className="mt-1 text-[20px] font-semibold" style={{ color: SLX_GREEN, fontFamily: SLX_SERIF }}>{r.time}</span>
                    </div>
                  ))}
                </div>
                {calendar ? (
                  <div className="mx-auto mt-4 w-[296px] max-w-full md:w-[352px]">
                    <div className="mx-auto w-full overflow-hidden rounded-lg border" style={{ borderColor: hexToRgba(SLX_GREEN, 0.27), color: SLX_GREEN }}>
                      <div className="border-b py-2.5 text-center text-[13px] font-semibold tracking-wide md:text-[14px]" style={{ borderColor: hexToRgba(SLX_GREEN, 0.27) }}>Tháng {calendar.month} / {calendar.year}</div>
                      <div className="grid grid-cols-7 border-b-2" style={{ borderColor: SLX_GREEN }}>
                        {WEEKDAY_LABELS.map((d) => (<div key={d} className="py-1.5 text-center text-[10px] font-medium opacity-60 md:text-[11px]">{d}</div>))}
                      </div>
                      <div className="grid grid-cols-7 gap-y-0.5 px-1 py-2">
                        {calendar.cells.map((day, i) => (
                          <div key={i} className="flex h-[30px] items-center justify-center md:h-[34px]">
                            {day === calendar.highlight ? (
                              <div className="relative flex h-[24px] w-[26px] items-center justify-center md:h-[28px] md:w-[30px]">
                                <svg viewBox="0 0 24 22" className="absolute inset-0 h-full w-full drop-shadow-sm" fill={SLX_GREEN}>
                                  <path d="M12 21C12 21 1.5 13.5 1.5 7.5C1.5 4.46 3.96 2 7 2C8.76 2 10.35 2.81 11.4 4.09L12 4.8L12.6 4.09C13.65 2.81 15.24 2 17 2C20.04 2 22.5 4.46 22.5 7.5C22.5 13.5 12 21 12 21Z" />
                                </svg>
                                <span className="relative z-10 text-[11px] font-bold md:text-[12px]" style={{ color: "#fff" }}>{day}</span>
                              </div>
                            ) : day ? (<span className="text-[12px] md:text-[13px]">{day}</span>) : null}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : null}
                <a href={googleCalendarUrl(content)} target="_blank" rel="noopener noreferrer" className="mt-4 inline-flex items-center justify-center text-sm tracking-wide underline decoration-1 underline-offset-4 transition-opacity hover:opacity-70" style={{ color: SLX_GREEN, fontFamily: SLX_SERIF }}>Thêm vào lịch / 캘린더에 추가</a>
                <button type="button" className="mt-3 inline-flex min-h-[44px] items-center justify-center rounded-full px-10 text-sm font-semibold uppercase tracking-wide" style={{ backgroundColor: SLX_GREEN, color: SLX_LINEN }}>Xác Nhận / 참석 확인</button>
              </div>
            </div>
          </>
        ) : null}

        {mapQuery ? (
          <>
            <SlxBand vi="Tiệc cưới sẽ tổ chức tại" ko="피로연 장소" />
            <div className="relative flex w-full flex-col items-center pb-10" style={{ backgroundColor: SLX_LINEN }}>
              <div className="mt-6 flex w-[92%] max-w-3xl flex-col items-center whitespace-pre-line break-words rounded-lg p-4 text-center text-sm font-medium md:text-base" style={{ color: SLX_GRAY, fontFamily: SLX_SERIF }}>{venue.address}</div>
              <iframe src={mapEmbedUrl(mapQuery)} title={mapQuery} className="mt-4 h-[350px] w-[92%] max-w-3xl rounded-xl md:h-[450px]" loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
            </div>
          </>
        ) : null}

        {schedule.length > 0 ? (
          <div className="relative w-full" style={{ backgroundColor: SLX_LINEN }}>
            <div className="mb-10 mt-10 flex flex-col gap-6 px-4 md:mb-12 md:mt-12 md:gap-8">
              <h2 className="flex flex-col items-center gap-0.5 text-center uppercase tracking-wide" style={{ color: SLX_GREEN, fontFamily: SLX_TNR }}>
                <span className="text-[20px] font-bold md:text-[24px]">Lịch Trình Ngày Cưới</span>
                <span className="text-[12px] font-normal normal-case opacity-80 md:text-[13px]">웨딩 당일 일정</span>
              </h2>
              <ol className="relative mx-auto grid w-full max-w-[460px] grid-cols-[minmax(0,1fr)_16px_minmax(0,1fr)] items-center gap-x-6 gap-y-8 md:gap-x-8 md:gap-y-10" style={{ fontFamily: SLX_SERIF }}>
                {schedule.map((s, i) => (
                  <li key={`${s.time}-${i}`} className="contents">
                    <span className="pt-0.5 text-right text-[16px] leading-snug tabular-nums tracking-wide md:text-[17px]" style={{ color: SLX_GREEN }}>{s.time}</span>
                    <span aria-hidden="true" className="relative flex items-center justify-center self-stretch">
                      {i > 0 ? <span className="absolute left-1/2 -top-8 h-8 w-px -translate-x-1/2 md:-top-10" style={{ backgroundColor: hexToRgba(SLX_GREEN, 0.4) }} /> : null}
                      <span className="relative block h-2.5 w-2.5 rounded-full" style={{ backgroundColor: SLX_GREEN, boxShadow: `0 0 0 2px ${hexToRgba(SLX_GREEN, 0.13)}` }} />
                      {i < schedule.length - 1 ? <span className="absolute bottom-1/2 left-1/2 top-1/2 w-px -translate-x-1/2 md:-bottom-10" style={{ backgroundColor: hexToRgba(SLX_GREEN, 0.4) }} /> : null}
                    </span>
                    <span className="flex flex-col pt-0.5 text-left leading-snug" style={{ color: SLX_GRAY }}>
                      <span className="text-[17px] font-medium md:text-[19px]">{s.label}</span>
                      {KR_SCHEDULE[s.label] ? <span className="text-[12px] opacity-70 md:text-[13px]">{KR_SCHEDULE[s.label]}</span> : null}
                    </span>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        ) : null}

        <SlxBand vi="Sổ lưu bút" ko="방명록" />
        <div className="relative w-full" style={{ backgroundColor: SLX_LINEN }}>
          <div className="px-4 py-10">
            <SongLongXanhWishForm />
            {wishes.length > 0 ? (
              <div className="mx-auto mt-8 max-h-[500px] w-full max-w-full space-y-3 overflow-y-auto pr-2 md:max-w-[600px]">
                {wishes.map((w, i) => (
                  <div key={`${w.name}-${i}`} className="rounded-lg border border-gray-100 bg-white p-4 shadow-md">
                    <div className="flex items-start justify-between">
                      <span className="text-lg" style={{ color: SLX_GREEN, fontFamily: SLX_TNR }}>{w.name}</span>
                      <span className="text-xs opacity-70" style={{ color: SLX_GRAY }}>{formatWishTime(w.time)}</span>
                    </div>
                    <p className="mt-2 leading-relaxed" style={{ color: SLX_GRAY }}>{w.text}</p>
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        </div>

        {bankCards.length > 0 ? (
          <>
            <div className="relative z-10 h-[80px] w-full" style={{ backgroundColor: SLX_GREEN }} />
            <div className="relative z-10 flex flex-col items-center justify-center px-4 py-8" style={{ backgroundColor: SLX_LINEN }}>
              <h2 className="mb-4 flex flex-col items-center gap-0.5 text-center uppercase tracking-wide" style={{ color: SLX_GREEN, fontFamily: SLX_SERIF }}>
                <span className="text-[20px] font-bold md:text-[24px]">Phong Bao Mừng Cưới</span>
                <span className="text-[12px] font-normal normal-case opacity-80 md:text-[13px]">축의금</span>
              </h2>
              <div className="flex flex-row flex-wrap items-start justify-center gap-4 sm:gap-8">
                {bankCards.map((q) => {
                  const qr = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(`${q.bank} ${q.num} ${q.name}`)}`;
                  return (
                    <div key={q.label} className="flex max-w-[200px] flex-1 flex-col items-center">
                      <h3 className="mb-2 line-clamp-2 flex min-h-[2rem] items-start justify-center text-center text-xs font-medium" style={{ color: SLX_GREEN }}>{q.label}</h3>
                      <div className="flex h-32 w-32 items-center justify-center rounded-xl bg-white p-2 shadow-lg sm:h-40 sm:w-40">
                        <img src={qr} alt={`QR - ${q.label}`} className="h-full w-full object-contain" />
                      </div>
                      <p className="mt-2 text-[13px] font-semibold" style={{ color: SLX_GRAY }}>{q.bank}</p>
                      <p className="text-[13px]" style={{ color: SLX_GRAY }}>{q.num}</p>
                      <p className="text-[13px]" style={{ color: SLX_GRAY }}>{q.name}</p>
                      <a href={qr} target="_blank" rel="noreferrer" className="mt-3 rounded-full border px-4 py-1.5 text-[11px] font-semibold uppercase" style={{ borderColor: SLX_GREEN, color: SLX_GREEN }}>Lưu QR</a>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        ) : null}

        <footer className="relative z-10 flex w-full flex-col items-center justify-center gap-1 px-4 py-6 text-center" style={{ backgroundColor: SLX_GREEN }}>
          <span className="text-[12px] md:text-[15px] lg:text-[18px]" style={{ fontFamily: SLX_SERIF, color: SLX_LINEN }}>Sự hiện diện của quý khách là niềm vinh hạnh của gia đình chúng tôi!</span>
          <span className="text-[11px] opacity-80 md:text-[13px]" style={{ fontFamily: SLX_SERIF, color: SLX_LINEN }}>여러분의 참석은 저희 가족의 큰 영광입니다!</span>
        </footer>
        <div className="relative z-10 flex items-center justify-center py-3" style={{ backgroundColor: SLX_LINEN }}>
          <a href="https://thiepmungonline.com" target="_blank" rel="noopener noreferrer" className="text-xs opacity-50 transition-opacity hover:opacity-70" style={{ color: SLX_GREEN }}>♡ thiepmungonline.com</a>
        </div>
      </div>
    </div>
  );
}

export function ChungDoiDemo({
  template,
  content: contentProp,
  liveForms = null,
}: {
  template: ChungDoiTemplate;
  content?: ChungDoiDemoContent;
  liveForms?: LiveForms;
}) {
  const content = contentProp ?? chungdoiDemoContent[template.slug];

  const [opened, setOpened] = useState(false);
  const [opening, setOpening] = useState(false);
  const [playing, setPlaying] = useState(false);
  const openTimerRef = useRef<number | null>(null);
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
    if (!opened) return;

    const lenis = new Lenis({ syncTouch: true, touchInertiaExponent: 1.7 });
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
  }, [opened]);

  useEffect(() => {
    if (!opened || !autoScrolling) return;
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
  }, [opened, autoScrolling]);

  useEffect(() => {
    return () => {
      if (openTimerRef.current) window.clearTimeout(openTimerRef.current);
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
      setAutoScrolling(true);
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
    <main id="top" className="relative min-h-screen bg-white" onClick={toggleAutoScroll}>
      <audio ref={audioRef} src={content.music ?? DEFAULT_MUSIC} loop preload="auto" />

      {!opened ? (
        content.slug === "nhat-binh-red" ? (
          <NhatBinhCover content={content} tokens={tokens} opening={opening} onOpen={openInvitation} />
        ) : (
          <CoverOverlay content={content} tokens={tokens} opening={opening} onOpen={openInvitation} />
        )
      ) : null}

      {content.slug === "double-phoenix-red" || content.slug === "double-phoenix-green" ? (
        <PhoenixInvitation content={content} />
      ) : content.slug === "song-hy-green" ? (
        <SongHyInvitation content={content} palette={SONG_HY_GREEN} />
      ) : content.slug === "song-hy-red" ? (
        <SongHyInvitation content={content} palette={SONG_HY_RED} />
      ) : content.slug === "nhat-binh-red" ? (
        <NhatBinhInvitation content={content} />
      ) : content.slug === "co-ba-red" ? (
        <CoBaInvitation content={content} />
      ) : content.slug === "dragon-phoenix-red" ? (
        <DragonPhoenixInvitation content={content} />
      ) : content.slug === "double-dragon-red" ? (
        <DoubleDragonInvitation content={content} />
      ) : content.slug === "double-dragon-blue" ? (
        <DoubleDragonInvitation content={content} palette={DD_BLUE_PALETTE} />
      ) : content.slug === "double-dragon-green" ? (
        <SongLongXanhInvitation content={content} />
      ) : (
        <div className="mx-auto max-w-[520px]" style={{ background: tokens.cardBg, minHeight: "100vh" }}>
          <InvitationBody content={content} tokens={tokens} />
        </div>
      )}

      {opened ? (
        <button
          type="button"
          onClick={toggleMusic}
          aria-label={playing ? "Tạm dừng nhạc" : "Phát nhạc"}
          className="fixed bottom-5 right-4 z-40 flex size-12 items-center justify-center rounded-full shadow-lg transition hover:-translate-y-1 sm:right-6"
          style={{ backgroundColor: tokens.buttonBg, color: tokens.buttonText }}
        >
          {playing ? <Pause className="size-5" /> : <Play className="size-5" />}
        </button>
      ) : null}
    </main>
    </LiveFormsProvider>
  );
}

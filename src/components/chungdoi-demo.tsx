"use client";

import Lenis from "lenis";
import { AudioLines, ChevronsDown, Pause, RotateCcw, VolumeX } from "lucide-react";
import { createPortal } from "react-dom";
import dynamic from "next/dynamic";
import { useTranslations } from "next-intl";
import { type CSSProperties, type Dispatch, type SetStateAction, useCallback, useEffect, useMemo, useRef, useState } from "react";

import type { ChungDoiTemplate } from "@/data/chungdoi";
import type { ChungDoiDemoContent } from "@/data/chungdoi-demo-content";
import { chungdoiThemeConfig } from "@/data/chungdoi-theme-config";
import type { ArtOpeningEffect } from "@/data/templates/opening-effect";
import {
  envelopeDecorOverflowForTemplate,
  glassGardenTemplateSlugs,
  type EnvelopeDecorOverflow,
} from "@/components/chungdoi-envelope-decor-policy";
import {
  SINGLE_PANEL_COVER_AWAY_MS,
  coverVariantForTemplate,
} from "@/components/chungdoi-cover-variant-policy";
import { UyenUongCover } from "@/components/chungdoi-uyen-uong-cover";
import { ToHongCover } from "@/components/chungdoi-to-hong-cover";
import { HongVanCover } from "@/components/chungdoi-hong-van-cover";
import { LiveFormsProvider, useLiveForms, useWishFormBinding, type LiveForms } from "@/components/chungdoi-live-forms";
import { envelopeSizingForTemplate } from "@/components/chungdoi-envelope-sizing-policy";
import { fitEnvelopeWidth } from "@/components/chungdoi-envelope-constants";
import { DEFAULT_COVER_3D_ENABLED } from "@/lib/cover-3d";
import { useInvitationCoverReady } from "@/hooks/use-invitation-cover-ready";
import { HeroTypographyScope } from "@/components/hero-typography-provider";
import { PreparedInvitationDetail } from "@/components/prepared-invitation-detail";
import { PublicRsvpDialog } from "@/components/public-rsvp-dialog";
import { PublicGuestMediaDialog } from "@/components/public-guest-media-dialog";
import {
  GuestMediaGalleryProvider,
  PublicGuestMomentsPortal,
} from "@/components/public-guest-moments";
import {
  LightboxZoomControls,
  useLightboxZoom,
  VI_LIGHTBOX_ZOOM_LABELS,
} from "@/components/lightbox-zoom";
import { InvitationMap, MapDirectionsButton } from "@/components/chungdoi-tpl-shared";
import { OpeningEffectArtwork } from "@/components/chungdoi-opening-effect";
import { ZodiacMaskArtwork } from "@/components/zodiac-mask-artwork";
import { GENERATED_TEMPLATE_RENDERERS } from "@/components/generated/template-renderers";
import { LongPhungGatefoldLab } from "@/components/chungdoi-long-phung-gatefold-lab";
import { NguyetAnhSleeveLab } from "@/components/chungdoi-nguyet-anh-sleeve-lab";
import { LongPhungGatefoldInvitation } from "@/components/chungdoi-tpl-long-phung-gatefold";
import { NguyetAnhSleeveInvitation } from "@/components/chungdoi-tpl-nguyet-anh-sleeve";
import { DoraemonDoorInvitation } from "@/components/chungdoi-tpl-doraemon-door";
import {
  type AuditedTemplateSlug,
  type BaseAuditedTemplateSlug,
} from "@/lib/audited-template-renderers";
import { formatVietnameseLunarDate } from "@/lib/vietnamese-lunar-date";
import { DEFAULT_INVITATION_MUSIC } from "@/lib/invitation-music";
import { resolveZodiacCardImages } from "@/lib/zodiac-decor";
import {
  DEFAULT_ZODIAC_ART_COLOR,
  ZODIAC_TEMPLATE_SLUG,
  isZodiacArtworkPath,
} from "@/lib/zodiac";
import {
  invitationCeremonies,
  invitationCeremonyMessage,
  invitationGiftAccounts,
  invitationOpeningMessage,
  orderedCouple,
} from "@/lib/invitation-display";
import {
  templateRendererEntry,
  type TemplateRendererEntry,
} from "@/components/template-renderer-entry";

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
const GlassGardenPinkInvitation = dynamic(() => import("@/components/chungdoi-tpl-glass-garden-pink").then((m) => m.GlassGardenPinkInvitation));
const MinimalismDarkRedInvitation = dynamic(() => import("@/components/chungdoi-tpl-minimalism-dark-red").then((m) => m.MinimalismDarkRedInvitation));
const MinimalismGreenInvitation = dynamic(() => import("@/components/chungdoi-tpl-minimalism-green").then((m) => m.MinimalismGreenInvitation));
const MinimalismBrownInvitation = dynamic(() => import("@/components/chungdoi-tpl-minimalism-brown").then((m) => m.MinimalismBrownInvitation));
const MinimalismJadeInvitation = dynamic(() => import("@/components/chungdoi-tpl-minimalism-dark-red").then((m) => m.MinimalismJadeInvitation));
const MinimalismSkyBlueInvitation = dynamic(() => import("@/components/chungdoi-tpl-minimalism-dark-red").then((m) => m.MinimalismSkyBlueInvitation));
const MinimalismPowderPinkInvitation = dynamic(() => import("@/components/chungdoi-tpl-minimalism-dark-red").then((m) => m.MinimalismPowderPinkInvitation));
const MinimalismPurpleInvitation = dynamic(() => import("@/components/chungdoi-tpl-minimalism-dark-red").then((m) => m.MinimalismPurpleInvitation));
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
const MaroonLoveInvitation = dynamic(() => import("@/components/chungdoi-tpl-maroon-love").then((m) => m.MaroonLoveInvitation));
const LienHoaPinkInvitation = dynamic(() => import("@/components/chungdoi-tpl-lien-hoa-pink").then((m) => m.LienHoaPinkInvitation));
const SunflowerInvitation = dynamic(() => import("@/components/chungdoi-tpl-sunflower").then((m) => m.SunflowerInvitation));

const BASE_AUDITED_TEMPLATE_RENDERERS = {
  "boho-floral-green": templateRendererEntry(BohoFloralGreenInvitation, "post-template"),
  "boho-floral-pink": templateRendererEntry(BohoFloralPinkInvitation, "inline-all"),
  "boho-floral-brown": templateRendererEntry(BohoFloralInvitation, "inline-all"),
  "spring-garden-red": templateRendererEntry(SpringGardenRedInvitation, "post-template"),
  "spring-garden-green": templateRendererEntry(SpringGardenGreenInvitation, "inline-all"),
  "spring-garden-blue": templateRendererEntry(SpringGardenBlueInvitation, "post-template"),
  "elegant-leaf-green": templateRendererEntry(ElegantLeafInvitation, "post-template"),
  "jasmine-white": templateRendererEntry(JasmineWhiteInvitation, "inline-all"),
  "silk-flora-brown": templateRendererEntry(SilkFloraBrownInvitation, "inline-all"),
  "hoa-tinh-red": templateRendererEntry(HoaTinhInvitation, "post-template"),
  "minimalism-red": templateRendererEntry(MinimalismRedInvitation, "inline-all"),
  "minimalism-dark-red": templateRendererEntry(MinimalismDarkRedInvitation, "inline-all"),
  "minimalism-green": templateRendererEntry(MinimalismGreenInvitation, "post-template"),
  "minimalism-brown": templateRendererEntry(MinimalismBrownInvitation, "inline-all"),
  "minimalism-jade": templateRendererEntry(MinimalismJadeInvitation, "inline-all"),
  "minimalism-sky-blue": templateRendererEntry(MinimalismSkyBlueInvitation, "inline-all"),
  "minimalism-powder-pink": templateRendererEntry(MinimalismPowderPinkInvitation, "inline-all"),
  "minimalism-purple": templateRendererEntry(MinimalismPurpleInvitation, "inline-all"),
  "brocade-flower-red": templateRendererEntry(BrocadeFlowerRedInvitation, "post-template"),
  "crystal-floral-blue": templateRendererEntry(CrystalFloralInvitation, "post-template"),
  "baroque-gold": templateRendererEntry(BaroqueGoldInvitation, "post-template"),
  "glass-garden-green": templateRendererEntry(GlassGardenInvitation, "inline-all"),
  "glass-garden-pink": templateRendererEntry(GlassGardenPinkInvitation, "inline-all"),
  "lien-hoa-pink": templateRendererEntry(LienHoaPinkInvitation, "post-template"),
  "sunflower": templateRendererEntry(SunflowerInvitation, "post-template"),
  "chibi-red": templateRendererEntry(ChibiRedInvitation, "inline-all"),
  "cherry-blossom-pink": templateRendererEntry(CherryBlossomInvitation, "post-template"),
} satisfies Record<BaseAuditedTemplateSlug, TemplateRendererEntry>;

// These renderers predate the manifest registry. Their ceremony mode lives
// beside the component so a legacy alias cannot drift from its renderer.
const LEGACY_TEMPLATE_RENDERERS = {
  "double-phoenix-red": templateRendererEntry(PhoenixInvitation, "post-template"),
  "double-phoenix-green": templateRendererEntry(PhoenixInvitation, "post-template"),
  "song-hy-green": templateRendererEntry(SongHyGreenInvitation, "inline-all"),
  "song-hy-red": templateRendererEntry(SongHyRedInvitation, "inline-all"),
  "nhat-binh-red": templateRendererEntry(NhatBinhInvitation, "post-template"),
  "co-ba-red": templateRendererEntry(CoBaInvitation, "post-template"),
  "dragon-phoenix-red": templateRendererEntry(DragonPhoenixRedInvitation, "inline-all"),
  "dragon-phoenix-green": templateRendererEntry(DragonPhoenixGreenInvitation, "inline-all"),
  "dragon-phoenix-blue": templateRendererEntry(DragonPhoenixBlueInvitation, "inline-all"),
  "dragon-phoenix-black": templateRendererEntry(DragonPhoenixBlackInvitation, "inline-all"),
  "double-dragon-red": templateRendererEntry(DoubleDragonRedInvitation, "post-template"),
  "double-dragon-blue": templateRendererEntry(DoubleDragonBlueInvitation, "post-template"),
  "double-dragon-green": templateRendererEntry(SongLongXanhInvitation, "post-template"),
  "royal-red": templateRendererEntry(RoyalRedInvitation, "post-template"),
  "royal-blue": templateRendererEntry(RoyalBlueInvitation, "post-template"),
  "royal-green": templateRendererEntry(RoyalGreenInvitation, "post-template"),
  "maroon-love": templateRendererEntry(MaroonLoveInvitation, "post-template"),
  "chateau-blue": templateRendererEntry(ChateauBlueInvitation, "post-template"),
  "chateau-green": templateRendererEntry(ChateauGreenInvitation, "post-template"),
  "qasr-green": templateRendererEntry(QasrGreenInvitation, "post-template"),
  "qasr-gold": templateRendererEntry(QasrGoldInvitation, "post-template"),
  "dragon-phoenix-v2-red": templateRendererEntry(DragonPhoenixV2Invitation, "post-template"),
  "dragon-phoenix-v3-red": templateRendererEntry(DragonPhoenixV3Invitation, "inline-all"),
} satisfies Record<string, TemplateRendererEntry>;

const AUDITED_TEMPLATE_RENDERERS = {
  ...BASE_AUDITED_TEMPLATE_RENDERERS,
  ...GENERATED_TEMPLATE_RENDERERS,
} satisfies Record<AuditedTemplateSlug, TemplateRendererEntry>;

const TEMPLATE_RENDERERS = {
  ...LEGACY_TEMPLATE_RENDERERS,
  ...AUDITED_TEMPLATE_RENDERERS,
} satisfies Record<string, TemplateRendererEntry>;

const Envelope3D = dynamic(() => import("@/components/chungdoi-envelope-3d"), { ssr: false });
const DoraemonDoorLab = dynamic(
  () => import("@/components/chungdoi-doraemon-door-lab")
    .then((module) => module.DoraemonDoorLab),
  { ssr: false },
);
const DetectiveConanCasebookLab = dynamic(
  () => import("@/components/chungdoi-detective-conan-casebook-lab")
    .then((module) => module.DetectiveConanCasebookLab),
  { ssr: false },
);
const CoiTrauKhamTraiLab = dynamic(
  () => import("@/components/chungdoi-coi-trau-kham-trai-lab")
    .then((module) => module.CoiTrauKhamTraiLab),
  { ssr: false },
);
const VN_DAYS = ["Chủ Nhật", "Thứ Hai", "Thứ Ba", "Thứ Tư", "Thứ Năm", "Thứ Sáu", "Thứ Bảy"];
const WEEKDAY_LABELS = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];

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
  lunar: string;
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
    lunar: formatVietnameseLunarDate(iso),
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

function AdditionalCeremonies({
  content,
  tokens,
}: {
  content: ChungDoiDemoContent;
  tokens: Tokens;
}) {
  const ceremonies = invitationCeremonies(content).slice(1);
  if (!ceremonies.length) return null;

  return (
    <section
      data-additional-ceremonies
      className="px-4 py-12 sm:px-6"
      style={{ background: tokens.cardBg, color: tokens.textPrimary }}
    >
      <div className="mx-auto grid max-w-[760px] gap-5">
        {ceremonies.map((ceremony, index) => {
          const date = formatDate(ceremony.date);
          return (
            <article
              key={`${ceremony.title}-${ceremony.date}-${ceremony.time}-${index}`}
              className="rounded-[2rem] border px-5 py-8 text-center shadow-sm sm:px-8"
              style={{
                background: tokens.guestBoxBg,
                borderColor: tokens.guestBoxBorder,
              }}
            >
              {ceremony.title ? (
                <h2 className="whitespace-pre-line text-xl font-semibold uppercase leading-relaxed sm:text-2xl">
                  {ceremony.title}
                </h2>
              ) : null}
              {ceremony.time || date ? (
                <div className="mt-5 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-sm sm:text-base">
                  {ceremony.time ? <span className="font-semibold">{ceremony.time}</span> : null}
                  {ceremony.time && date ? <span aria-hidden>·</span> : null}
                  {date ? (
                    <span>
                      {date.weekday}, {date.day}/{date.month}/{date.yearNumber}
                    </span>
                  ) : null}
                </div>
              ) : null}
              {date?.lunar ? (
                <p className="mt-2 text-sm" style={{ color: tokens.textSecondary }}>
                  {date.lunar}
                </p>
              ) : null}
            </article>
          );
        })}
      </div>
    </section>
  );
}

function useLightbox(count: number) {
  const [lightbox, setLightbox] = useState<number | null>(null);

  return { lightbox: count > 0 ? lightbox : null, setLightbox };
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

function googleCalendarUrl(content: ChungDoiDemoContent) {
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
  openingEffect?: ArtOpeningEffect;
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
      openingEffect: undefined,
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
    coupleFont: crawledFont ?? cfg.fonts.couple ?? undefined,
    sealType: cfg.sealType,
    cardImages: resolveZodiacCardImages(cfg.decorations.cardImages, content),
    openingEffect: cfg.openingEffect,
  };
}

const PORCELAIN_COVER_TEMPLATE_SLUGS = new Set([
  "porcelain-blue",
  "porcelain-red",
  "porcelain-brown",
  "porcelain-v2-red",
  "porcelain-v2-green",
]);

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

/**
 * Mốc thời gian của chuỗi mở thiệp "cổ điển" (mẫu không có `openingEffect`).
 *
 * Bản gốc chia làm hai pha rời nhau chứ không chạy chồng: niêm phong vỡ xong
 * mới tới lúc bìa bay lên. Chạy tất cả cùng lúc là lý do chuỗi cũ trông rối —
 * bìa đã trôi khỏi màn hình trong khi con dấu còn đang nứt.
 *
 *   0ms    pha "opening": demo-seal-break (500) + demo-seal-ring (600)
 *                         + demo-dragon-fly cho decor (1200)
 *   500ms  pha "away":    demo-particle-burst (1400) + demo-envelope-away (800)
 *   1300ms reveal:        tháo bìa, mount thân thiệp
 *
 * Mẫu art (`openingEffect`) KHÔNG dùng bảng này: keyframe `demo-art-*` của
 * chúng đã tự giữ bìa đứng yên tới 48-70% rồi mới bay, tức đã dàn cảnh sẵn
 * bên trong một pha duy nhất.
 */
const SEAL_BREAK_MS = 500;
const ENVELOPE_AWAY_MS = 800;
const CLASSIC_OPEN_DURATION_MS = SEAL_BREAK_MS + ENVELOPE_AWAY_MS;
/** Giảm chuyển động: CSS đã ép mọi animation về 0.01ms nên chờ theo mốc trên
 *  chỉ là ngồi nhìn bìa đứng im. Cắt còn một nhịp ngắn cho kịp đổi cảnh. */
const REDUCED_MOTION_OPEN_MS = 200;

/**
 * `idle` chưa bấm · `opening` con dấu đang vỡ, bìa còn đứng yên ·
 * `away` bìa đang bay lên.
 */
type OpenPhase = "idle" | "opening" | "away";

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
            ? "demo-seal-break 0.5s cubic-bezier(0.4, 0, 0.2, 1) forwards"
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
                animation: `demo-particle-burst 1.4s cubic-bezier(0.25, 0.46, 0.45, 0.94) ${i * 12}ms forwards`,
              } as React.CSSProperties & Record<string, string>
            }
          />
        );
      })}
    </div>
  );
}

function OpeningFlyDecor({
  tokens,
  size,
}: {
  tokens: Tokens;
  size: { width: number; height: number } | null;
}) {
  const flyingImages = tokens.cardImages.filter((image) => image.flyOnOpen);
  if (!size || flyingImages.length === 0) return null;

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 z-30 flex items-center justify-center"
    >
      <div
        className="relative"
        style={{ width: size.width, height: size.height }}
      >
        {flyingImages.map((image, index) => (
          <div
            key={`${image.src}-${index}`}
            className={`pointer-events-none absolute ${image.className}`}
          >
            <EnvelopeDecorationArtwork
              src={image.src}
              className="block h-auto w-full"
              openingFly
              animateFly
            />
          </div>
        ))}
      </div>
    </div>
  );
}

function mobileCoverDecorSrc(src: string): string | null {
  if (src.endsWith("/phung-cover.webp")) {
    return src.replace("/phung-cover.webp", "/phung-cover-mobile.webp");
  }
  if (src.endsWith("/rong-cover.webp")) {
    return src.replace("/rong-cover.webp", "/rong-cover-mobile.webp");
  }
  return null;
}

function EnvelopeDecorationArtwork({
  src,
  className,
  openingFly = false,
  coverFly = false,
  flySource = false,
  animateFly = false,
  hidden = false,
}: {
  src: string;
  className: string;
  /**
   * Bản sao bay của lớp decor NGOÀI thẻ, chỉ có ở bìa 3D (`OpeningFlyDecor`).
   * Vài test trong templates.spec.ts khoá cứng số lượng
   * `[data-envelope-opening-fly]`, nên đừng gắn thêm ở chỗ khác.
   */
  openingFly?: boolean;
  /**
   * Bản sao bay TRONG thẻ (lớp fly-out của `CoverCard`, dùng cho bìa 2D). Mốc
   * neo riêng để `tests/e2e/opening-fly-decor.spec.ts` đo mà không đụng vào hợp
   * đồng đếm của `data-envelope-opening-fly`.
   */
  coverFly?: boolean;
  /**
   * Ảnh TĨNH của một decor có `flyOnOpen` — tức bản gốc mà bản sao bay ra phải
   * khớp kích thước.
   */
  flySource?: boolean;
  animateFly?: boolean;
  hidden?: boolean;
}) {
  const style: CSSProperties | undefined = animateFly
    ? { animation: "demo-dragon-fly 1.2s ease-in forwards" }
    : hidden
      ? { opacity: 0 }
      : undefined;

  if (isZodiacArtworkPath(src)) {
    return (
      <ZodiacMaskArtwork
        src={src}
        data-envelope-opening-fly={openingFly || undefined}
        data-envelope-cover-fly={coverFly || undefined}
        data-envelope-fly-source={flySource || undefined}
        className={`aspect-[1952/4105] ${className}`}
        style={style}
      />
    );
  }

  const mobileSrc = mobileCoverDecorSrc(src);

  const image = (
    // Asset decor cần giữ kích thước class động của theme khi phóng ra.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt=""
      aria-hidden="true"
      fetchPriority={flySource ? "high" : undefined}
      data-envelope-opening-fly={openingFly || undefined}
      data-envelope-cover-fly={coverFly || undefined}
      data-envelope-fly-source={flySource || undefined}
      className={className}
      style={style}
    />
  );

  if (mobileSrc) {
    return (
      <picture className="contents">
        <source media="(max-width: 767px)" srcSet={mobileSrc} />
        {image}
      </picture>
    );
  }

  return image;
}

/** Chỉ phần thẻ thiệp (không có overlay/particle) — dùng chung cho cover 2D và node chụp texture 3D. */
function CoverCard({
  content,
  tokens,
  onOpen,
  opening = false,
  hideDecor = false,
  contentOnly = false,
  decorOverflow = "visible",
  naturalHeight = false,
}: {
  content: ChungDoiDemoContent;
  tokens: Tokens;
  onOpen: () => void;
  opening?: boolean;
  hideDecor?: boolean;
  contentOnly?: boolean;
  decorOverflow?: EnvelopeDecorOverflow;
  naturalHeight?: boolean;
}) {
  const liveForms = useLiveForms();
  if (content.slug === "uyen-uong") return <UyenUongCover content={content} onOpen={onOpen} />;
  if (content.slug === "hong-van-rose") return <HongVanCover content={content} onOpen={onOpen} />;
  const hyUocCover = content.slug === "hy-uoc";
  const date = formatDate(content.couple.date);
  const names = content.couple.brideFirst
    ? [content.couple.brideShortName, content.couple.groomShortName]
    : [content.couple.groomShortName, content.couple.brideShortName];
  const nameStyle = tokens.coupleFont ? { fontFamily: tokens.coupleFont } : undefined;
  const guestSalutation =
    liveForms?.guest?.role?.trim() ||
    liveForms?.personalizationLabels.salutationDefault ||
    "Thân Mời";
  const guestName = liveForms?.guest?.name.trim() || liveForms?.recipientLabel || "Quý khách";
  const guestMessage =
    liveForms?.guest?.greeting?.trim() ||
    liveForms?.personalizationLabels.messageDefault ||
    "Đến dự buổi tiệc chung vui cùng gia đình";

  return (
    <div
      className={hyUocCover ? "relative rounded-[4px]" : "relative rounded-lg"}
      style={{
        aspectRatio: naturalHeight ? undefined : hyUocCover ? "31 / 54" : "3 / 4.5",
        boxShadow: hyUocCover
          ? "0 22px 48px -18px rgba(52,37,31,0.55)"
          : "0 25px 60px -12px rgba(0,0,0,0.45), 0 8px 24px rgba(0,0,0,0.2)",
      }}
    >
      {/* composited theme layer (behind everything). Content-only capture bỏ
          toàn bộ nền để texture overlay phía trên WebGL giữ alpha trong suốt. */}
      {!contentOnly ? (
        <div
          className="absolute inset-0 overflow-hidden rounded-lg"
          style={{ background: coverCardBackground(tokens), border: `1px solid ${tokens.guestBoxBorder}` }}
        />
      ) : null}

      {/* fly-out layer (không clip): bản gốc phía trên ẩn đi, bản này phóng to bay ra.
          `coverFly` chỉ để gắn `data-envelope-cover-fly` — mốc neo cho
          tests/e2e/opening-fly-decor.spec.ts đo bản sao bay có đúng bằng ảnh tĩnh. */}
      {opening && !contentOnly ? (
        <div className="pointer-events-none absolute inset-0 z-20">
          {tokens.cardImages
            .filter((img) => img.flyOnOpen)
            .map((img, i) => (
              <div key={i} className={`pointer-events-none absolute ${img.className}`}>
                <EnvelopeDecorationArtwork
                  src={img.src}
                  className="block h-auto w-full"
                  coverFly
                  animateFly
                />
              </div>
            ))}
        </div>
      ) : null}

      {/* frosted glass panel: CHỈ cho họ Vườn Kính (xanh/hồng) — card nền trong
          suốt nằm thẳng trên nền floral rối nên cần tấm kính phủ trắng + blur để
          chữ đọc được. Các theme khác card có nền riêng (đặc hoặc rgba ~0.95) đọc
          tốt sẵn; tấm trắng chỉ làm bệt màu nên KHÔNG áp. */}
      {glassGardenTemplateSlugs.has(content.slug) && !contentOnly ? (
        <div
          className="pointer-events-none absolute inset-0 z-[5] rounded-lg"
          style={{
            background: "rgba(255,255,255,0.55)",
            backdropFilter: "blur(6px)",
            WebkitBackdropFilter: "blur(6px)",
            boxShadow: "0 1px 0 rgba(255,255,255,0.6) inset, 0 10px 30px -12px rgba(0,0,0,0.25)",
          }}
        />
      ) : null}

      {/* Các mẫu clip bake decor vào card ở z-6, dưới text/nút z-10. Riêng mẫu
          cho phép vượt mép sẽ bỏ bản này: Envelope3D dùng một plane hoa nguyên
          vẹn và một content overlay trong suốt ở phía trên, nên không có seam. */}
      {tokens.cardImages.length && !hideDecor && !contentOnly ? (
        <div
          className="pointer-events-none absolute inset-0 z-[6] overflow-hidden rounded-lg"
          data-envelope-decor-overflow={decorOverflow}
        >
          {tokens.cardImages.map((img, i) => (
            <EnvelopeDecorationArtwork
              key={i}
              src={img.src}
              className={`pointer-events-none absolute ${img.className}`}
              flySource={img.flyOnOpen}
              hidden={img.flyOnOpen && opening}
            />
          ))}
        </div>
      ) : null}

      {/* Với mode mặc định, text phủ absolute để giữ card 3:4.5. Riêng các mẫu
          opt-in natural height, text tham gia flow và quyết định chiều cao card. */}
      <div
        data-envelope-card-content
        className={naturalHeight
          ? "relative z-10 px-6 pb-14 pt-28 text-center md:pb-8 md:pt-24"
          : hyUocCover
            ? "absolute inset-0 z-10 flex flex-col items-center justify-center px-8 py-7 text-center"
            : "absolute inset-0 z-10 flex flex-col items-center justify-center px-6 text-center"}
      >
        {hyUocCover ? (
          <img
            alt=""
            aria-hidden="true"
            src="/chungdoi/images/themes/hy-uoc/double-happiness-cream.svg"
            className="mb-4 h-12 w-auto sm:h-14"
          />
        ) : null}
        <div className={hyUocCover ? "mb-4 flex flex-col items-center text-3xl leading-tight sm:text-4xl" : "mb-2 flex flex-col items-center text-3xl leading-tight sm:text-4xl"} style={{ color: tokens.textPrimary }}>
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

        {!hyUocCover ? (
          <div className="mb-3 flex items-center justify-center gap-3">
            <span className="h-px w-10" style={{ background: `linear-gradient(to right, ${tokens.dividerFrom}, ${tokens.accent})` }} />
            <span className="text-sm" style={{ color: tokens.accent, opacity: 0.7 }}>
              ❦
            </span>
            <span className="h-px w-10" style={{ background: `linear-gradient(to left, ${tokens.dividerFrom}, ${tokens.accent})` }} />
          </div>
        ) : null}

        {date ? (
          <p className="mb-5 text-[18px]" style={{ color: tokens.textSecondary }}>
            {date.dayNumber} tháng {date.monthNumber}, {date.yearNumber}
          </p>
        ) : null}

        <div className="mb-6">
          <p className="mb-2 text-[16px] font-light" style={{ color: tokens.textSecondary }}>
            {guestSalutation}
          </p>
          {!PORCELAIN_COVER_TEMPLATE_SLUGS.has(content.slug) ? (
            <>
              <div className="mb-2 inline-block rounded-xl px-5 py-2.5" style={{ backgroundColor: tokens.guestBoxBg }}>
                <span className="block text-lg font-semibold sm:text-xl" style={{ color: tokens.textPrimary }}>
                  {guestName}
                </span>
              </div>
              {/* Bìa mobile chỉ rộng 310px (340px từ sm) nên chỉ còn 262/292px cho chữ,
                  trong khi câu mặc định cần 293px ở 15px — rớt dòng. Ba mốc dưới đây
                  khớp đúng ba bậc của responsiveEnvelopeWidth (310 / 340 / 640+), nên
                  desktop giữ nguyên 15px. */}
              <p
                className="mx-auto max-w-xs text-[13px] font-light sm:text-[14px] md:text-[15px]"
                style={{ color: tokens.textSecondary }}
              >
                {guestMessage}
              </p>
            </>
          ) : null}
        </div>

        {/* Bóng nút là một lớp radial-gradient riêng, KHÔNG phải box-shadow: card
            này bị html-to-image chụp thành texture và Safari rasterize box-shadow
            lệch thành vệt ghost bên phải nút. Gradient là background thuần nên ra
            đúng ở mọi engine. Lớp phải nằm NGOÀI button vì button có
            overflow-hidden (để cắt tia sáng) sẽ cắt mất glow. */}
        <span className="relative mx-auto inline-flex justify-center">
          <span
            aria-hidden
            data-open-btn-glow
            className="pointer-events-none absolute left-1/2 top-[58%] h-[148%] w-[114%] -translate-x-1/2 -translate-y-1/2 rounded-[50%]"
            style={{
              background:
                "radial-gradient(closest-side, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.14) 52%, rgba(0,0,0,0) 100%)",
            }}
          />
          <button
            type="button"
            data-open-btn
            onClick={onOpen}
            className="demo-shine relative inline-flex items-center justify-center overflow-hidden whitespace-nowrap rounded-full px-8 py-2.5 text-lg font-semibold transition-all duration-300 hover:-translate-y-1 active:translate-y-0 hover:shadow-[0_20px_50px_-12px_rgba(0,0,0,0.7),0_0_0_1px_rgba(255,255,255,0.25)_inset] active:shadow-[0_6px_24px_-6px_rgba(0,0,0,0.5),0_0_0_1px_rgba(255,255,255,0.15)_inset]"
            style={{
              backgroundColor: tokens.buttonBg,
              color: tokens.buttonText,
              boxShadow: "0 12px 40px -10px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.2) inset, 0 4px 16px -4px rgba(0,0,0,0.4)",
              border: "1px solid rgba(255,255,255,0.15)",
            }}
          >
            Mở thiệp
          </button>
        </span>
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

/**
 * Bìa 2D: thẻ thiệp là DOM thật, không có WebGL và không chụp texture.
 *
 * Đây là đường mặc định (xem `cover3dEnabled` trong AppConfig). Bìa 3D phải tải
 * chunk three.js rồi rasterize DOM→SVG→canvas trước khi hiện được gì; đo trên
 * long-phung-v3-do ở Fast 4G + CPU x4 là ~4,9s so với ~1,5s của bản này, và nhẹ
 * hơn ~700KB JS. Bản này còn SSR được nên thẻ có sẵn trong HTML.
 *
 * Chiều rộng thẻ đi theo `responsiveEnvelopeWidth` bằng CSS breakpoint (SSR được,
 * không cần đọc window), rồi scale lại bằng `fitEnvelopeWidth` để thẻ không tràn
 * khỏi viewport thấp — đúng công thức bản 3D dùng, nên hai bìa cùng cỡ ở mọi
 * breakpoint (đã đo: lệch 0px ở 7 viewport).
 */
function EnvelopeCover2D({
  content,
  tokens,
  onOpen,
  opening,
  reducedMotion,
  decorOverflow,
  naturalHeight,
  openingEffect,
  renderOverflowDecor,
  envelopeAwayAnimation,
  showSeal,
}: {
  content: ChungDoiDemoContent;
  tokens: Tokens;
  onOpen: () => void;
  opening: boolean;
  reducedMotion: boolean;
  decorOverflow: EnvelopeDecorOverflow;
  naturalHeight: boolean;
  openingEffect: ArtOpeningEffect | undefined;
  renderOverflowDecor: boolean;
  /** Chuỗi `animation` cho lúc bìa bay lên, `undefined` khi chưa tới pha đó.
   *  EnvelopeCover dựng sẵn để bìa 2D và 3D bay bằng đúng một công thức. */
  envelopeAwayAnimation: string | undefined;
  /** Bìa liền một mặt không có niêm phong nào để vỡ, nên không vẽ con dấu. */
  showSeal: boolean;
}) {
  const boxRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const box = boxRef.current;
    const card = cardRef.current;
    if (!box || !card) return;

    const measure = () => {
      // offsetWidth/Height là cỡ LAYOUT nên transform ở thẻ cha không ảnh hưởng.
      // Nhờ vậy đo được cỡ tự nhiên mà không phải tháo scale ra, và
      // ResizeObserver theo dõi chính `card` cũng không tự kích lại vòng lặp.
      const naturalWidth = card.offsetWidth;
      const naturalCardHeight = card.offsetHeight;
      if (naturalWidth <= 0 || naturalCardHeight <= 0) return;
      const fitted = fitEnvelopeWidth({
        targetWidth: naturalWidth,
        ratio: naturalCardHeight / naturalWidth,
        viewportWidth: box.clientWidth,
        viewportHeight: box.clientHeight,
      });
      const next = fitted / naturalWidth;
      setScale((current) => (Math.abs(current - next) < 0.001 ? current : next));
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(box);
    observer.observe(card);
    // Font tên cô dâu chú rể về muộn làm đổi chiều cao thẻ → đo lại, không thì
    // tỉ lệ dùng để clamp là tỉ lệ của font fallback.
    if (document.fonts?.ready) void document.fonts.ready.then(measure).catch(() => {});
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={boxRef}
      data-envelope-renderer="2d"
      data-envelope-ready="true"
      className={`absolute inset-0 flex items-center justify-center ${
        opening ? "pointer-events-none" : ""
      }`}
      style={{ animation: envelopeAwayAnimation }}
    >
      <div style={{ transform: `scale(${scale})` }}>
        <div
          ref={cardRef}
          className={content.slug === "hy-uoc" || content.slug === "uyen-uong"
            ? "relative w-[310px] sm:w-[340px] md:w-[400px]"
            : PORCELAIN_COVER_TEMPLATE_SLUGS.has(content.slug)
              ? "relative w-[310px] sm:w-[340px] md:w-[520px] lg:w-[600px]"
              : "relative w-[310px] sm:w-[340px] md:w-[640px] lg:w-[732px]"}
        >
          {/* Hoa vượt khỏi mép thẻ (họ Vườn Kính): lớp này KHÔNG overflow-hidden,
              khác lớp decor mặc định trong CoverCard, nên phải tự dựng và tắt lớp
              trong thẻ đi. Thiếu nó là hoa bị cắt cụt ở mép. */}
          {renderOverflowDecor ? (
            <div
              className="pointer-events-none absolute inset-0 z-[6]"
              data-envelope-decor-overflow={decorOverflow}
            >
              {tokens.cardImages.map((image, index) => (
                <EnvelopeDecorationArtwork
                  key={`${image.src}-${index}`}
                  src={image.src}
                  className={`pointer-events-none absolute ${image.className}`}
                  flySource={image.flyOnOpen}
                  hidden={image.flyOnOpen && opening}
                />
              ))}
            </div>
          ) : null}

          {showSeal ? <Seal tokens={tokens} opening={opening} /> : null}
          <CoverCard
            content={content}
            tokens={tokens}
            onOpen={onOpen}
            opening={opening}
            // Chỉ họ Vườn Kính mới ẩn lớp decor trong thẻ, vì lớp không-clip ở
            // trên đã vẽ thay. Mẫu art KHÔNG được ẩn: `cardImages[0]` của chúng
            // chính là plate artwork (xem art-template-manifest.ts), ẩn đi là mất
            // hẳn phần vẽ chính của bìa. Đây đúng là điều bản 3D làm — nó truyền
            // `hideDecor={renderOverflowDecor}`, không phải renderSeparateDecor.
            hideDecor={renderOverflowDecor}
            decorOverflow={decorOverflow}
            naturalHeight={naturalHeight}
          />

          {/* Artwork mở thiệp của mẫu art nằm TRÊN lớp decor trong thẻ, clip theo
              thẻ. Bản 3D phải tách thành plane tĩnh + lớp animate ở tầng cover
              (định vị theo projectedSize) vì thẻ là texture; ở đây thẻ là DOM nên
              một lớp lo cả trạng thái tĩnh và lúc mở. */}
          {openingEffect ? (
            <div
              className="pointer-events-none absolute inset-0 z-[7] overflow-hidden rounded-lg"
              data-opening-static-clip="card"
            >
              <OpeningEffectArtwork
                effect={openingEffect}
                opening={opening}
                reducedMotion={reducedMotion}
              />
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

/**
 * Cover phong bì. `cover3dEnabled` (công tắc ở /admin/settings) quyết định dùng
 * thẻ 3D WebGL hay thẻ 2D DOM. Khi tắt thì KHÔNG mount Envelope3D, nên chunk
 * three.js/drei/fiber/html-to-image không được tải — đó mới là chỗ tiết kiệm,
 * chứ không phải chỉ ẩn canvas đi.
 *
 * Vẫn giữ một renderer duy nhất cho mỗi lượt tải: không hiện 2D rồi hoán sang 3D.
 */
function EnvelopeCover({
  content,
  tokens,
  onOpen,
  openPhase,
  reducedMotion,
  cover3dEnabled,
  onReady,
}: {
  content: ChungDoiDemoContent;
  tokens: Tokens;
  onOpen: () => void;
  openPhase: OpenPhase;
  reducedMotion: boolean;
  cover3dEnabled: boolean;
  onReady: () => void;
}) {
  const coverRoot = useRef<HTMLDivElement>(null);
  // Con dấu nứt, decor bay và việc chặn tương tác bắt đầu ngay từ pha đầu; chỉ
  // riêng bìa bay lên là phải đợi pha "away".
  const opening = openPhase !== "idle";
  // Ảnh decor bìa nằm trong node chụp của Envelope3D, mà Envelope3D là dynamic
  // ssr:false → trình duyệt chỉ thấy mấy ảnh này SAU khi tải xong chunk three.js
  // rồi mount xong: chunk → mount → mới tải ảnh → mới chụp được, mà bìa chặn màn
  // hình tới hết chuỗi đó. Mấy thẻ <link> dưới được React hoist lên <head> ngay
  // trong HTML SSR nên ảnh tải song song với chunk thay vì xếp hàng sau nó.
  // Dùng thẻ JSX chứ không dùng preload() của react-dom: gọi từ client component
  // thì API đó không phát ra thẻ nào trong HTML (đã thử, <head> trống).
  const decorPreloads = tokens.cardImages
    .map((image) => image.src)
    .filter((src, index, all) => !isZodiacArtworkPath(src) && all.indexOf(src) === index)
    .flatMap<{ href: string; media?: string }>((src) => {
      const mobileSrc = mobileCoverDecorSrc(src);
      return mobileSrc
        ? [
            { href: mobileSrc, media: "(max-width: 767px)" },
            { href: src, media: "(min-width: 768px)" },
          ]
        : [{ href: src, media: undefined }];
    });

  const sizing = envelopeSizingForTemplate(content.slug);
  // Khung nhà kính được vẽ theo tỷ lệ 2:3. Giữ card portrait cố định để artwork
  // phủ trọn bìa thay vì bị co vào giữa card natural-height khổ ngang.
  const naturalHeight = sizing === "responsive-natural"
    && content.slug !== "ban-ve-to-am"
    && content.slug !== "hy-uoc";
  const decorOverflow = envelopeDecorOverflowForTemplate(content.slug);
  const renderOverflowDecor = decorOverflow === "visible" && tokens.cardImages.length > 0;
  // Hồng Vân dùng bìa hoa hồng DOM riêng; không phủ thêm plate/layer art chung
  // lên trên vì sẽ tạo một khung thừa ở phía trên bìa.
  const openingEffect = content.slug === "hong-van-rose" ? undefined : tokens.openingEffect;
  const renderSeparateDecor = renderOverflowDecor || Boolean(openingEffect);
  // Bìa liền một mặt không có con dấu nên không có pha chờ nào phía trước: bấm là
  // trượt. Xem chungdoi-cover-variant-policy.ts.
  const singlePanelCover = coverVariantForTemplate(content.slug) === "single-panel";
  const openingDuration = openingEffect
    ? reducedMotion
      ? openingEffect.reducedMotion.durationMs
      : openingEffect.durationMs
    : singlePanelCover
      ? SINGLE_PANEL_COVER_AWAY_MS
      : ENVELOPE_AWAY_MS;

  // Mẫu art dàn cảnh bên trong keyframe nên bay suốt cả quãng `opening`; mẫu cổ
  // điển phải đợi pha "away", tức đợi con dấu vỡ xong. Bìa liền một mặt cũng bay
  // ngay vì openInvitation() đã cho nó vào thẳng pha "away".
  const flyingAway = openingEffect || singlePanelCover ? opening : openPhase === "away";
  const envelopeAwayAnimation = flyingAway
    ? openingEffect
      ? `demo-art-envelope-away ${openingDuration}ms linear forwards`
      : singlePanelCover
        ? `demo-single-panel-cover-away ${openingDuration}ms cubic-bezier(0.32, 0, 0.67, 0) forwards`
        : `demo-envelope-away ${openingDuration}ms ease-in forwards`
    : undefined;
  const [projectedSize, setProjectedSize] = useState<{ width: number; height: number } | null>(null);
  const [envelopeReady, setEnvelopeReady] = useState(false);
  const handleProjectedSizeChange = useCallback((nextSize: { width: number; height: number }) => {
    setProjectedSize((currentSize) => {
      if (
        currentSize &&
        Math.abs(currentSize.width - nextSize.width) < 0.5 &&
        Math.abs(currentSize.height - nextSize.height) < 0.5
      ) {
        return currentSize;
      }
      return nextSize;
    });
  }, []);
  const handleEnvelopeReadyChange = useCallback((ready: boolean) => {
    setEnvelopeReady(ready);
  }, []);

  // Bìa 2D là DOM thuần nên bấm được ngay từ frame đầu; bìa 3D phải chờ chụp
  // xong texture mới có toạ độ nút để hit-test.
  const coverInteractive = cover3dEnabled ? envelopeReady : true;
  useInvitationCoverReady(coverRoot, coverInteractive, onReady);
  const coverStyle: CSSProperties & { "--zodiac-art-color"?: string } = {
    background: tokens.background,
    // Nền cũng chỉ mờ dần trong pha "away". Trước đây nó mờ ngay từ lúc bấm nút
    // nên thẻ chịu hai lớp fade cùng lúc (fade của nền × fade của
    // demo-envelope-away) và tan biến trước khi kịp bay hết màn hình.
    animation: flyingAway
      ? `${openingEffect ? "demo-art-cover-out" : "demo-cover-out"} ${openingDuration}ms linear forwards`
      : undefined,
    ...(content.slug === ZODIAC_TEMPLATE_SLUG
      ? { "--zodiac-art-color": content.theme.primaryColor || DEFAULT_ZODIAC_ART_COLOR }
      : {}),
  };

  return (
    <div
      ref={coverRoot}
      className="fixed inset-0 z-[90] flex items-center justify-center overflow-hidden p-4"
      style={coverStyle}
    >
      {decorPreloads.map(({ href, media }) => (
        <link
          key={href}
          rel="preload"
          as="image"
          href={href}
          media={media}
          fetchPriority="high"
        />
      ))}
      <button
        type="button"
        data-open-invitation-control
        onClick={onOpen}
        disabled={opening || !coverInteractive}
        className="sr-only focus:fixed focus:bottom-6 focus:left-1/2 focus:z-[100] focus:block focus:h-auto focus:w-auto focus:-translate-x-1/2 focus:overflow-visible focus:rounded-full focus:bg-white focus:px-5 focus:py-3 focus:text-sm focus:font-semibold focus:text-neutral-900 focus:shadow-xl focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:ring-offset-2"
      >
        Mở thiệp
      </button>
      {glassGardenTemplateSlugs.has(content.slug) ? (
        <div
          data-envelope-background-glass
          className="pointer-events-none absolute inset-0 z-0"
          style={{
            background: "rgba(255,255,255,0.12)",
            backdropFilter: "blur(8px) saturate(1.05)",
            WebkitBackdropFilter: "blur(8px) saturate(1.05)",
          }}
        />
      ) : null}
      {content.slug !== "hy-uoc" ? <ParticleField tokens={tokens} /> : null}
      {/* Đợt confetti nổ cùng nhịp bìa bắt đầu bay, không nổ lúc con dấu mới nứt. */}
      {flyingAway && content.slug !== "hy-uoc" ? <BurstParticles tokens={tokens} /> : null}
      {/* Chỉ đường 3D cần hai lớp này ở tầng cover: thẻ là texture nên hoa bay ra
          và artwork mở thiệp phải vẽ ngoài thẻ, định vị theo projectedSize. Bản 2D
          animate ngay trong thẻ DOM (CoverCard tự có lớp fly-out). */}
      {cover3dEnabled && opening && !openingEffect ? (
        <OpeningFlyDecor tokens={tokens} size={projectedSize} />
      ) : null}
      {cover3dEnabled && opening && openingEffect && projectedSize ? (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2"
          style={{ width: projectedSize.width, height: projectedSize.height }}
        >
          <OpeningEffectArtwork
            effect={openingEffect}
            opening
            reducedMotion={reducedMotion}
          />
        </div>
      ) : null}

      {!cover3dEnabled ? (
        <div className="relative z-10 h-full w-full">
          <EnvelopeCover2D
            content={content}
            tokens={tokens}
            onOpen={onOpen}
            opening={opening}
            reducedMotion={reducedMotion}
            decorOverflow={decorOverflow}
            naturalHeight={naturalHeight}
            openingEffect={openingEffect}
            renderOverflowDecor={renderOverflowDecor}
            envelopeAwayAnimation={envelopeAwayAnimation}
            showSeal={!singlePanelCover}
          />
        </div>
      ) : (
      <div
        className={`relative z-10 h-full w-full ${opening ? "pointer-events-none" : ""}`}
        data-envelope-renderer="3d"
        data-envelope-ready={envelopeReady ? "true" : "false"}
        data-envelope-projected-size={projectedSize
          ? `${Math.round(projectedSize.width)}x${Math.round(projectedSize.height)}`
          : undefined}
        style={{ animation: envelopeAwayAnimation }}
      >
        <div className="absolute inset-0">
          <Envelope3D
            sizing={sizing}
            decorVisible={openingEffect ? !opening : true}
            buttonShineEnabled={!reducedMotion}
            onOpen={onOpen}
            onProjectedSizeChange={handleProjectedSizeChange}
            onReadyChange={handleEnvelopeReadyChange}
            paperColor={coverPaperColor(tokens)}
            accentColor={toSolidColor(tokens.accent, "#8C1C13")}
            renderCard={(handleOpen) => (
              <div className="relative">
                <Seal tokens={tokens} opening={opening} />
                <CoverCard
                  content={content}
                  tokens={tokens}
                  onOpen={handleOpen}
                  opening={opening}
                  hideDecor={renderOverflowDecor}
                  decorOverflow={decorOverflow}
                  naturalHeight={naturalHeight}
                />
              </div>
            )}
            renderDecor={
              renderSeparateDecor
                ? () => (
                    <div
                      className={`pointer-events-none absolute inset-0 ${
                        openingEffect ? "overflow-hidden rounded-lg" : ""
                      }`}
                      data-opening-static-clip={openingEffect ? "card" : undefined}
                    >
                      {openingEffect ? (
                        <OpeningEffectArtwork effect={openingEffect} />
                      ) : (
                        tokens.cardImages.map((img, i) => (
                          <EnvelopeDecorationArtwork
                            key={i}
                            src={img.src}
                            className={`pointer-events-none absolute ${img.className}`}
                          />
                        ))
                      )}
                    </div>
                  )
                : undefined
            }
            renderOverlay={
              renderSeparateDecor
                ? () => (
                    <div className="relative">
                      <Seal tokens={tokens} opening={false} />
                      <CoverCard
                        content={content}
                        tokens={tokens}
                        onOpen={onOpen}
                        contentOnly
                        hideDecor
                        decorOverflow={decorOverflow}
                        naturalHeight={naturalHeight}
                      />
                    </div>
                  )
                : undefined
            }
          />
        </div>

        {!opening && envelopeReady ? (
          <p
            className="pointer-events-none absolute inset-x-0 bottom-6 text-center text-sm"
            style={{ color: tokens.accent, opacity: 0.1 }}
          >
            Kéo để xoay · Chụm 2 ngón để zoom
          </p>
        ) : null}
      </div>
      )}
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
  const { couple, families, venue, schedule, gallery, wishes } = content;
  const ceremony = formatDate(couple.ceremonyDate);
  const reception = formatDate(couple.date);
  const calendar = buildCalendar(couple.date);
  const nameStyle = tokens.coupleFont ? { fontFamily: tokens.coupleFont } : undefined;

  const brideBlock = (
    <FamilyBlock title={families.brideParentTitle || "Ông Bà"} father={families.brideFather} mother={families.brideMother} address={families.brideAddress} tokens={tokens} />
  );
  const groomBlock = (
    <FamilyBlock title={families.groomParentTitle || "Ông Bà"} father={families.groomFather} mother={families.groomMother} address={families.groomAddress} tokens={tokens} />
  );

  const orderedBanks = invitationGiftAccounts(content).map((account) => ({
    side: account.side === "bride" ? "Cô Dâu" : "Chú Rể",
    name: account.name,
    bank: account.bank,
    number: account.num,
  }));
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

        <p className="mx-auto mt-10 max-w-sm whitespace-pre-line text-center text-sm font-semibold uppercase leading-6 tracking-wide">
          {invitationOpeningMessage(content)}
        </p>

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
            <p className="whitespace-pre-line text-sm font-semibold uppercase tracking-wide">{invitationCeremonyMessage(content)}</p>
            {couple.ceremonyTime ? <p className="mt-2 text-sm">Vào lúc {couple.ceremonyTime}</p> : null}
            <div className="mt-4 flex items-center justify-center gap-3 text-sm font-semibold uppercase">
              <span>{ceremony.weekday}</span>
              <span>|</span>
              <span className="text-3xl font-bold">{ceremony.day}</span>
              <span>|</span>
              <span>Tháng {ceremony.month}</span>
            </div>
            <p className="mt-2 text-2xl font-bold">{ceremony.yearNumber}</p>
            <p className="mt-2 text-xs leading-5 opacity-75">{ceremony.lunar}</p>
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
          <p className="mt-3 text-4xl font-bold">{couple.time || venue.banquetTime}</p>
          <div className="mt-3 flex items-center justify-center gap-2 text-sm font-semibold uppercase">
            <span>{reception.weekday}</span><span>/</span><span>{reception.day}</span><span>/</span><span>Tháng {reception.month}</span>
          </div>
          <p className="mt-2 text-xs leading-5 opacity-75">{reception.lunar}</p>

          {calendar ? (
            <div className="mx-auto mt-8 max-w-[384px] rounded-2xl border p-5" style={{ borderColor: tokens.guestBoxBorder }}>
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
          <MapDirectionsButton query={mapQuery} style={{ color: tokens.accent }} />
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

      {orderedBanks.length > 0 ? (
        <section className="reveal is-visible mt-16">
          <SectionHeading tokens={tokens}>Mừng Cưới</SectionHeading>
          <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2">
            {orderedBanks.map((item) => (
              <div key={item.side} className="flex flex-col items-center rounded-2xl border p-5 text-center" style={{ borderColor: tokens.guestBoxBorder, backgroundColor: tokens.guestBoxBg }}>
                <h3 className="text-base font-semibold">{item.side} - {item.name}</h3>
                <p className="mt-3 text-sm font-semibold">{item.bank}</p>
                <p className="text-sm">{item.number}</p>
                <p className="text-sm">{item.name}</p>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <section className="reveal is-visible relative z-10 mt-16 pb-6 text-center">
        <p
          className="mx-auto max-w-[85%] rounded-lg px-4 py-3 text-base leading-relaxed backdrop-blur-[2px]"
          style={{ color: tokens.textSecondary, backgroundColor: `color-mix(in srgb, ${tokens.cardBg} 85%, transparent)` }}
        >
          Sự hiện diện của quý khách là niềm vinh hạnh của gia đình chúng tôi!
        </p>
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
  previewMode = false,
  heading,
  cover3dEnabled = DEFAULT_COVER_3D_ENABLED,
}: {
  template: ChungDoiTemplate;
  content: ChungDoiDemoContent;
  liveForms?: LiveForms;
  captureMode?: boolean;
  previewMode?: boolean;
  heading?: string;
  /**
   * Công tắc bìa 3D ở /admin/settings. Server component đọc từ AppConfig rồi
   * truyền vào. Mặc định lấy theo DEFAULT_COVER_3D_ENABLED (tắt): nếu quên truyền
   * ở một call site thì hệ quả là bìa nhanh, không phải bìa nặng.
   */
  cover3dEnabled?: boolean;
}) {
  const gatefoldT = useTranslations("gatefoldLab");
  const sleeveT = useTranslations("sleeveLab");
  const coiTrauT = useTranslations("coiTrauLab");
  const doraemonDoorT = useTranslations("doraemonDoorLab");
  const invitationControlsT = useTranslations("invitationControls");
  const detectiveConanCasebookT = useTranslations(
    "detectiveConanCasebookLab",
  );
  // Every production/editor call site already provides content. Keeping the
  // 190KB all-template fallback map in this client module made every invitation
  // download data for templates it can never render.
  const content = contentProp;
  const isGatefoldExperience = content?.slug === "long-phung-gatefold";
  const isSleeveExperience = content?.slug === "nguyet-anh-sleeve";
  const isCoiTrauExperience = content?.slug === "coi-trau-kham-trai";
  const isDoraemonDoorExperience = content?.slug === "doraemon-door";
  const isDetectiveConanCasebookExperience =
    content?.slug === "detective-conan-casebook";
  const isPaginatedExperience = isDetectiveConanCasebookExperience;
  const usesTwoDimensionalCover = content.slug === "ban-ve-to-am" || content.slug === "hy-uoc" || content.slug === "uyen-uong";
  const rendererEntry = TEMPLATE_RENDERERS[
    content.slug as keyof typeof TEMPLATE_RENDERERS
  ];
  const rendersCeremoniesInsideTemplate =
    rendererEntry?.ceremonyRendering === "inline-all";
  const isPhysicalExperience = isGatefoldExperience
    || isSleeveExperience
    || isCoiTrauExperience
    || isDoraemonDoorExperience
    || isDetectiveConanCasebookExperience;

  const [opened, setOpened] = useState(captureMode || previewMode);
  const [preparedSlug, setPreparedSlug] = useState<string | null>(null);
  const handleCoverReady = useCallback(() => setPreparedSlug(content.slug), [content.slug]);
  const [openPhase, setOpenPhase] = useState<OpenPhase>("idle");
  const [playing, setPlaying] = useState(false);
  const [audioMuted, setAudioMuted] = useState(false);
  const openingRef = useRef(false);
  const openTimerRef = useRef<number | null>(null);
  const awayTimerRef = useRef<number | null>(null);
  const autoScrollTimerRef = useRef<number | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const lenisRef = useRef<Lenis | null>(null);
  const [autoScrolling, setAutoScrolling] = useState(false);
  const [atInvitationEnd, setAtInvitationEnd] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const autoScrollingRef = useRef(false);
  const [physicalReplayVersion, setPhysicalReplayVersion] = useState(0);

  useEffect(() => {
    autoScrollingRef.current = autoScrolling;
  }, [autoScrolling]);

  // Đã cuộn tới cuối thiệp hay chưa — quyết định nút hiện "tự động cuộn" hay "xem lại
  // từ đầu". Chỉ set state ở thời điểm đổi trạng thái nên không gây re-render mỗi frame.
  useEffect(() => {
    if (!opened || captureMode || isPaginatedExperience) return;

    const update = () => {
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      setAtInvitationEnd(maxScroll - window.scrollY <= 2);
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, [captureMode, isPaginatedExperience, opened]);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setPrefersReducedMotion(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  const tokens = useMemo(() => (content ? resolveTokens(content) : null), [content]);

  useEffect(() => {
    if (!content || (opened && !isPaginatedExperience)) return;
    const originalBodyOverflow = document.body.style.overflow;
    const originalRootOverflow = document.documentElement.style.overflow;
    document.body.style.overflow = "hidden";
    if (isPaginatedExperience) {
      document.documentElement.style.overflow = "hidden";
    }
    return () => {
      document.body.style.overflow = originalBodyOverflow;
      document.documentElement.style.overflow = originalRootOverflow;
    };
  }, [content, isPaginatedExperience, opened]);

  useEffect(() => {
    if (
      !opened
      || (!isDoraemonDoorExperience && !isDetectiveConanCasebookExperience && content.slug !== "to-hong")
    ) {
      return;
    }

    const frame = window.requestAnimationFrame(() => {
      const focusTarget = content.slug === "to-hong"
        ? document.querySelector<HTMLElement>("[data-to-hong-focus]")
        : isDetectiveConanCasebookExperience
        ? document.querySelector<HTMLElement>(
          '[data-testid="detective-conan-casebook-reader"] '
          + '[data-position="current"] [data-chapter-heading]',
        )
        : document.querySelector<HTMLElement>(
          "[data-physical-handoff-target]",
        );
      focusTarget?.focus({ preventScroll: true });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [
    content.slug,
    isDetectiveConanCasebookExperience,
    isDoraemonDoorExperience,
    opened,
  ]);

  useEffect(() => {
    if (!opened || captureMode || isPaginatedExperience) return;

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
  }, [captureMode, isPaginatedExperience, opened]);

  useEffect(() => {
    if (
      !opened
      || !autoScrolling
      || captureMode
      || previewMode
      || isPaginatedExperience
    ) {
      return;
    }
    const lenis = lenisRef.current;
    if (!lenis) return;

    const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
    const remaining = maxScroll - lenis.scroll;
    if (remaining <= 1) {
      setAutoScrolling(false);
      return;
    }

    // Tốc độ ~0.08 px/ms như bản cũ → suy ra duration theo quãng còn lại.
    const duration = remaining / 0.08 / 1000;
    lenis.scrollTo(maxScroll, {
      duration,
      easing: (t) => t,
      onComplete: () => setAutoScrolling(false),
    });

    return () => {
      // Huỷ animation scrollTo. Không dùng `scrollTo(lenis.scroll, { immediate: true })`:
      // trong lúc animate programmatic, Lenis liên tục đồng bộ `targetScroll = animatedScroll`,
      // nên `target === this.targetScroll` và scrollTo return sớm — animation vẫn chạy tiếp.
      // `stop()`/`start()` đều gọi `reset()`, vốn gọi `animate.stop()`, nên cắt hẳn animation
      // rồi trả lại quyền cuộn cho user.
      lenis.stop();
      lenis.start();
    };
  }, [
    autoScrolling,
    captureMode,
    isPaginatedExperience,
    opened,
    previewMode,
  ]);

  useEffect(() => {
    return () => {
      if (openTimerRef.current) window.clearTimeout(openTimerRef.current);
      if (awayTimerRef.current) window.clearTimeout(awayTimerRef.current);
      if (autoScrollTimerRef.current) window.clearTimeout(autoScrollTimerRef.current);
    };
  }, []);

  useEffect(() => {
    if (
      !isDetectiveConanCasebookExperience
      || physicalReplayVersion === 0
    ) {
      return;
    }

    const focusOpenButton = () => {
      const button = document.querySelector<HTMLButtonElement>(
        '[data-testid="detective-conan-casebook-open"]',
      );
      if (!button || button.disabled) return false;
      button.focus({ preventScroll: true });
      return true;
    };
    const observer = new MutationObserver(() => {
      if (focusOpenButton()) observer.disconnect();
    });
    observer.observe(document.body, {
      attributeFilter: ["disabled"],
      attributes: true,
      childList: true,
      subtree: true,
    });
    focusOpenButton();

    return () => {
      observer.disconnect();
    };
  }, [isDetectiveConanCasebookExperience, physicalReplayVersion]);

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

  const handlePhysicalExperienceStateChange = useCallback((nextState: "closed" | "opening" | "handoff" | "opened") => {
    if (!isPhysicalExperience || !content) return;

    if (nextState === "closed") {
      openingRef.current = false;
      setOpenPhase("idle");
      return;
    }

    // Mẫu "vật lý" (gatefold/sleeve/cửa Doraemon/sổ Conan) tự dàn cảnh trong Lab
    // riêng và không hề mount EnvelopeCover, nên pha ở đây chỉ cần phân biệt
    // đang-mở với đứng-yên.
    if (nextState === "opening" || nextState === "handoff") {
      if (!openingRef.current) {
        openingRef.current = true;
        setOpenPhase("opening");
        const audio = audioRef.current;
        if (audio) {
          audio.src = content.music ?? DEFAULT_INVITATION_MUSIC;
          audio.play().then(() => {
            setPlaying(true);
            setAudioMuted(false);
          }).catch(() => setPlaying(false));
        }
      }
      return;
    }

    openingRef.current = false;
    setOpenPhase("idle");
    setOpened(true);
    if (!isPaginatedExperience && content.slug !== "hy-uoc") {
      autoScrollTimerRef.current = window.setTimeout(() => {
        if (!previewMode) setAutoScrolling(true);
      }, 2000);
    }
  }, [
    content,
    isPaginatedExperience,
    isPhysicalExperience,
    previewMode,
  ]);

  if (!tokens) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-[#f3e6d0] px-6 text-center">
        <h1 className="text-2xl font-bold text-[#710001]">Demo đang được cập nhật</h1>
        <p className="mt-3 max-w-md text-sm text-[#710001]/80">
          Mẫu thiệp &ldquo;{template.name}&rdquo; hiện chưa có dữ liệu demo. Vui lòng quay lại sau.
        </p>
      </main>
    );
  }

  const semanticHeading = heading ?? (() => {
    const people = orderedCouple(content);
    return `${people[0].shortName} & ${people[1].shortName}`;
  })();
  const AuditedTemplateRenderer = rendererEntry?.component ?? null;
  const autoScrollLabel = autoScrolling
    ? invitationControlsT("stopAutoScroll")
    : atInvitationEnd
      ? invitationControlsT("replayAutoScroll")
      : invitationControlsT("startAutoScroll");

  function getInteractiveAudio() {
    const audio = audioRef.current;
    if (!audio) return null;
    if (!audio.getAttribute("src")) {
      audio.src = content.music ?? DEFAULT_INVITATION_MUSIC;
    }
    return audio;
  }

  function openInvitation() {
    if (openingRef.current || opened) return;
    openingRef.current = true;

    const root = document.documentElement;
    const originalScrollBehavior = root.style.scrollBehavior;
    root.style.scrollBehavior = "auto";
    window.scrollTo(0, 0);
    root.style.scrollBehavior = originalScrollBehavior;

    const openingEffect = tokens?.openingEffect;
    // Bìa liền một mặt: không con dấu, không mảnh nào bay riêng — bấm là cả tấm
    // trượt lên trong một nhịp. Xem chungdoi-cover-variant-policy.ts.
    const singlePanelCover = coverVariantForTemplate(content.slug) === "single-panel";
    const revealDelay = content.slug === "to-hong" ? 0 : openingEffect
      ? prefersReducedMotion
        ? openingEffect.reducedMotion.durationMs
        : openingEffect.durationMs
      : prefersReducedMotion
        ? REDUCED_MOTION_OPEN_MS
        : singlePanelCover
          ? SINGLE_PANEL_COVER_AWAY_MS
          : CLASSIC_OPEN_DURATION_MS;

    // Chỉ mẫu cổ điển ở chuyển động đầy đủ mới cần mốc giữa: dừng ở pha "opening"
    // cho con dấu vỡ xong rồi mới sang "away" cho bìa bay. Mẫu art đã tự giữ nhịp
    // trong keyframe `demo-art-*`, bìa liền một mặt không có pha con dấu, còn giảm
    // chuyển động thì CSS đã ép mọi animation về gần 0ms — tất cả vào thẳng pha
    // bay, chia pha chỉ làm người xem ngồi chờ.
    const stagedOpening = !openingEffect && !singlePanelCover && !prefersReducedMotion;
    setOpenPhase(stagedOpening ? "opening" : "away");
    if (stagedOpening) {
      awayTimerRef.current = window.setTimeout(() => setOpenPhase("away"), SEAL_BREAK_MS);
    }

    openTimerRef.current = window.setTimeout(() => {
      setOpened(true);
      if (content.slug !== "hy-uoc" && content.slug !== "to-hong" && !previewMode) {
        autoScrollTimerRef.current = window.setTimeout(() => {
          setAutoScrolling(true);
        }, 2000);
      }
    }, revealDelay);
    if (content.slug === "to-hong") {
      return;
    }
    const audio = getInteractiveAudio();
    if (audio) {
      audio.play().then(() => {
        setPlaying(true);
        setAudioMuted(false);
      }).catch(() => setPlaying(false));
    }
  }

  function toggleMusic() {
    const audio = getInteractiveAudio();
    if (!audio) return;
    if (audio.paused) {
      audio.play().then(() => {
        setPlaying(true);
        setAudioMuted(false);
      }).catch(() => setPlaying(false));
    } else {
      audio.pause();
      setPlaying(false);
      setAudioMuted(true);
    }
  }

  function replayPhysicalCover() {
    if (!isPhysicalExperience) return;

    if (autoScrollTimerRef.current) {
      window.clearTimeout(autoScrollTimerRef.current);
      autoScrollTimerRef.current = null;
    }
    openingRef.current = false;
    setAutoScrolling(false);
    setOpenPhase("idle");
    setOpened(false);
    if (isDetectiveConanCasebookExperience) {
      setPhysicalReplayVersion((version) => version + 1);
    }
    window.scrollTo({ behavior: "auto", top: 0 });
  }

  function toggleAutoScroll() {
    if (previewMode || !opened || content.slug === "hy-uoc") return;
    if (autoScrollingRef.current) {
      setAutoScrolling(false);
      return;
    }
    // Đã cuộn hết thiệp thì bấm nút nghĩa là muốn xem lại từ đầu.
    const lenis = lenisRef.current;
    if (lenis) {
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      if (maxScroll - lenis.scroll <= 1) lenis.scrollTo(0, { immediate: true });
    }
    setAutoScrolling(true);
  }

  return (
    <LiveFormsProvider value={liveForms}>
    <main
      id="top"
      data-capture-mode={captureMode ? "true" : undefined}
      className={
        isPaginatedExperience
          ? "relative h-[100dvh] overflow-hidden bg-[#111820]"
          : "relative min-h-screen bg-white"
      }
    >
      <h1 className="sr-only">{semanticHeading}</h1>
      {!captureMode ? <audio ref={audioRef} loop preload="none" /> : null}

      {isDetectiveConanCasebookExperience
        && !captureMode
        && !previewMode ? (
          <DetectiveConanCasebookLab
            key={physicalReplayVersion}
            content={content}
            lockDocument={false}
            onStateChange={handlePhysicalExperienceStateChange}
            showControls={false}
            muted={audioMuted}
          />
        ) : !opened && !captureMode ? (
        isGatefoldExperience && !previewMode ? (
          <LongPhungGatefoldLab
            content={content}
            onCoverReady={handleCoverReady}
            onStateChange={handlePhysicalExperienceStateChange}
            renderBody={false}
            showControls={false}
            muted={audioMuted}
          />
        ) : isSleeveExperience && !previewMode ? (
          <NguyetAnhSleeveLab
            content={content}
            onCoverReady={handleCoverReady}
            onStateChange={handlePhysicalExperienceStateChange}
            renderBody={false}
            showControls={false}
            muted={audioMuted}
          />
        ) : isCoiTrauExperience && !previewMode ? (
          <CoiTrauKhamTraiLab
            content={content}
            onCoverReady={handleCoverReady}
            onStateChange={handlePhysicalExperienceStateChange}
            muted={audioMuted}
          />
        ) : isDoraemonDoorExperience && !previewMode ? (
          <DoraemonDoorLab
            content={content}
            onCoverReady={handleCoverReady}
            onStateChange={handlePhysicalExperienceStateChange}
            renderBody={false}
            showControls={false}
            muted={audioMuted}
          />
        ) : (
          content.slug === "to-hong" ? <ToHongCover content={content} onOpen={openInvitation} onReady={handleCoverReady} /> : <EnvelopeCover
            content={content}
            tokens={tokens}
            openPhase={openPhase}
            reducedMotion={prefersReducedMotion}
            onOpen={openInvitation}
            cover3dEnabled={usesTwoDimensionalCover ? false : cover3dEnabled}
            onReady={handleCoverReady}
          />
        )
      ) : null}

      <PreparedInvitationDetail
        prepare={preparedSlug === content.slug || openPhase !== "idle"}
        visible={opened}
      >
        <HeroTypographyScope slug={content.slug} userFont={content.theme.userFontFamily}>
          {isDetectiveConanCasebookExperience
            && !captureMode
            && !previewMode ? null : isGatefoldExperience ? (
        <div className="contents" data-template-renderer={content.slug}>
          <LongPhungGatefoldInvitation content={content} />
        </div>
      ) : isSleeveExperience ? (
        <div className="contents" data-template-renderer={content.slug}>
          <NguyetAnhSleeveInvitation content={content} />
        </div>
      ) : isDoraemonDoorExperience ? (
        <div className="contents" data-template-renderer={content.slug}>
          <DoraemonDoorInvitation content={content} />
        </div>
      ) : AuditedTemplateRenderer ? (
        <div className="contents" data-template-renderer={content.slug}>
          <AuditedTemplateRenderer content={content} />
        </div>
      ) : (
        <div className="mx-auto max-w-[520px]" style={{ background: tokens.cardBg, minHeight: "100vh" }}>
          <InvitationBody content={content} tokens={tokens} />
        </div>
      )}

          {!isPhysicalExperience && !rendersCeremoniesInsideTemplate
            ? <AdditionalCeremonies content={content} tokens={tokens} />
            : null}
          <GuestMediaGalleryProvider>
            <PublicGuestMomentsPortal templateSlug={content.slug} />
            {!captureMode ? <PublicGuestMediaDialog /> : null}
          </GuestMediaGalleryProvider>
        </HeroTypographyScope>
      </PreparedInvitationDetail>

      {opened && !captureMode ? (
        <>
          {content.slug !== "hy-uoc" ? (
            <PublicRsvpDialog
              triggerClassName={
                isPaginatedExperience
                  ? "bottom-auto left-3 top-3 sm:left-4"
                  : undefined
              }
            />
          ) : null}
          <div
            className={
              content.slug === "hy-uoc"
                ? "absolute left-3 top-3 z-40 flex flex-col items-start gap-3"
                : isPaginatedExperience
                  ? "fixed right-3 top-20 z-40 flex flex-col items-end gap-3 sm:right-4"
                  : "fixed bottom-5 right-4 z-40 flex flex-col items-end gap-3 sm:right-6"
            }
          >
            {isPhysicalExperience && !previewMode ? (
              <button
                type="button"
                data-testid={
                  isDetectiveConanCasebookExperience
                    ? "detective-conan-casebook-replay-cover"
                    : isGatefoldExperience
                    ? "long-phung-gatefold-replay-cover"
                    : isSleeveExperience
                      ? "nguyet-anh-sleeve-replay-cover"
                      : isCoiTrauExperience
                        ? "coi-trau-kham-trai-replay-cover"
                        : "doraemon-door-replay-cover"
                }
                onClick={replayPhysicalCover}
                aria-label={
                  isDetectiveConanCasebookExperience
                    ? detectiveConanCasebookT("replayCover")
                    : isGatefoldExperience
                    ? gatefoldT("replayCover")
                    : isSleeveExperience
                      ? sleeveT("replayCover")
                      : isCoiTrauExperience
                        ? coiTrauT("replayCover")
                        : doraemonDoorT("replayCover")
                }
                title={
                  isDetectiveConanCasebookExperience
                    ? detectiveConanCasebookT("replayCover")
                    : isGatefoldExperience
                    ? gatefoldT("replayCover")
                    : isSleeveExperience
                      ? sleeveT("replayCover")
                      : isCoiTrauExperience
                        ? coiTrauT("replayCover")
                        : doraemonDoorT("replayCover")
                }
                className={
                  isDetectiveConanCasebookExperience
                    ? "flex size-12 items-center justify-center rounded-full border border-[#B43A42]/70 bg-[#111820]/92 text-[#F1E9D8] shadow-lg shadow-black/35 transition hover:-translate-y-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B43A42] active:translate-y-px"
                    : isGatefoldExperience
                    ? "flex size-12 items-center justify-center rounded-full border border-[#B58A3A]/55 bg-[#17110F]/88 text-[#EAD9B8] shadow-lg shadow-[#17110F]/35 transition hover:-translate-y-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B58A3A] active:translate-y-px"
                    : isSleeveExperience
                      ? "flex size-12 items-center justify-center border border-[#78C7D7]/70 bg-[#0B1116]/90 text-[#D7E4EA] shadow-lg shadow-black/35 transition hover:-translate-y-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#78C7D7] active:translate-y-px"
                      : isCoiTrauExperience
                        ? "flex size-12 items-center justify-center rounded-full border border-[#D8E3DF]/55 bg-[#32151F]/92 text-[#F1E8D8] shadow-lg shadow-[#180B10]/40 transition hover:-translate-y-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D8E3DF] active:translate-y-px"
                        : "flex size-12 items-center justify-center rounded-full border border-[#B94170]/70 bg-[#E96F9A]/92 text-[#FFF9EE] shadow-lg shadow-[#39BCEB]/25 transition hover:-translate-y-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#17334A] active:translate-y-px"
                }
              >
                <RotateCcw aria-hidden className="size-5" strokeWidth={1.5} />
              </button>
            ) : null}
            {!isPaginatedExperience && !previewMode && content.slug !== "hy-uoc" ? (
              <button
                type="button"
                data-testid="invitation-auto-scroll-toggle"
                onClick={toggleAutoScroll}
                aria-label={autoScrollLabel}
                title={autoScrollLabel}
                aria-pressed={autoScrolling}
                className="flex size-12 items-center justify-center rounded-full shadow-lg transition hover:-translate-y-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                style={{ backgroundColor: tokens.buttonBg, color: tokens.buttonText }}
              >
                {autoScrolling ? (
                  <Pause aria-hidden className="size-5" />
                ) : atInvitationEnd ? (
                  <RotateCcw aria-hidden className="size-5" />
                ) : (
                  <ChevronsDown aria-hidden className="size-5" />
                )}
              </button>
            ) : null}
            <button
              type="button"
              onClick={toggleMusic}
              aria-label={
                playing
                  ? invitationControlsT("pauseMusic")
                  : invitationControlsT("playMusic")
              }
              title={
                playing
                  ? invitationControlsT("pauseMusic")
                  : invitationControlsT("playMusic")
              }
              aria-pressed={playing}
              className="flex size-12 items-center justify-center rounded-full shadow-lg transition hover:-translate-y-1 sm:right-6"
              style={{ backgroundColor: tokens.buttonBg, color: tokens.buttonText }}
            >
              {playing ? (
                <AudioLines aria-hidden className="size-5" />
              ) : (
                <VolumeX aria-hidden className="size-5" />
              )}
            </button>
          </div>
        </>
      ) : null}
    </main>
    </LiveFormsProvider>
  );
}

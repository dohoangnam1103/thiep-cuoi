"use client";

import { ArrowDown, ArrowUpRight } from "lucide-react";
import Image from "next/image";
import NextLink from "next/link";
import { useTranslations } from "next-intl";
import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
} from "react";

import { ContactFab } from "@/components/chungdoi-chrome";
import { loginHref, TEMPLATE_LIST_PATH } from "@/lib/auth-redirects";

import { Home2Footer, Home2Header } from "../chrome";
import { Shell } from "../primitives";
import { useV12Motion } from "./v12-motion";
import "./v12.css";

const SONG_HY_ASSET = "/chungdoi/images/themes/song-hy-red/chu-hy.webp";
const SONG_HY_DECOR = "/chungdoi/images/themes/_decor/song-hy-red/chu-hy.webp";
const SUNBURST_ASSET = "/chungdoi/images/themes/song-hy-red/sunburst.svg";

export type V12MosaicTemplate = {
  slug: string;
  name: string;
  thumbnail: {
    src: string;
    width: number;
    height: number;
  };
};

export type V12GalleryTemplate = {
  slug: string;
  name: string;
  portrait: string;
  demoPath: string;
};

type MosaicPoint = {
  x: number;
  y: number;
  z: number;
  rotation: number;
};

type GalleryPoint = {
  x: number;
  y: number;
  rotation: number;
  scale: number;
};

const GLYPH_ROWS = [
  "..#####..",
  "....#....",
  ".#######.",
  "....#....",
  "..#####..",
  "..#...#..",
  "..#####..",
  "....#....",
  ".#######.",
  "..#...#..",
  "..#####..",
  "..#...#..",
  "..#####..",
] as const;

const MOSAIC_POINTS: MosaicPoint[] = [0, 10]
  .flatMap((columnOffset) => GLYPH_ROWS.flatMap((row, rowIndex) =>
    Array.from(row).flatMap((cell, columnIndex) => {
      if (cell !== "#") return [];
      const index = rowIndex * row.length + columnIndex + columnOffset;
      return [{
        x: columnIndex + columnOffset - 9,
        y: rowIndex - 6,
        z: -((index * 13) % 5) * 5,
        rotation: ((index * 17) % 9) - 4,
      }];
    }),
  ))
  .concat([
    { x: 0, y: -2, z: -8, rotation: -2 },
    { x: 0, y: 3, z: -14, rotation: 3 },
  ]);

const MOBILE_TEMPLATE_INDICES = [
  0, 6, 12, 18, 24, 30, 36, 42, 48, 54, 60, 66, 72, 78, 84, 90,
] as const;

const MOBILE_POINTS = [
  { x: -3, y: -4, rotation: -8 },
  { x: -1, y: -4, rotation: 4 },
  { x: 1, y: -4, rotation: -3 },
  { x: 3, y: -4, rotation: 8 },
  { x: -3, y: -1, rotation: 5 },
  { x: -1, y: -1, rotation: -4 },
  { x: 1, y: -1, rotation: 3 },
  { x: 3, y: -1, rotation: -6 },
  { x: -3, y: 2, rotation: -6 },
  { x: -1, y: 2, rotation: 5 },
  { x: 1, y: 2, rotation: -2 },
  { x: 3, y: 2, rotation: 7 },
  { x: -3, y: 5, rotation: 7 },
  { x: -1, y: 5, rotation: -5 },
  { x: 1, y: 5, rotation: 4 },
  { x: 3, y: 5, rotation: -7 },
] as const;

const mobilePointByTemplateIndex = new Map<
  number,
  (typeof MOBILE_POINTS)[number]
>(
  MOBILE_TEMPLATE_INDICES.map((templateIndex, positionIndex) => [
    templateIndex,
    MOBILE_POINTS[positionIndex],
  ]),
);

const GALLERY_POINTS: GalleryPoint[] = [
  { x: -76, y: 30, rotation: -4, scale: 0.86 },
  { x: -61, y: 68, rotation: 3, scale: 1.04 },
  { x: -46, y: 31, rotation: -2, scale: 0.94 },
  { x: -31, y: 70, rotation: 4, scale: 0.84 },
  { x: -15, y: 32, rotation: -3, scale: 1.06 },
  { x: 1, y: 69, rotation: 2, scale: 0.92 },
  { x: 17, y: 30, rotation: -4, scale: 0.84 },
  { x: 33, y: 68, rotation: 3, scale: 1.08 },
  { x: 49, y: 31, rotation: -2, scale: 0.96 },
  { x: 65, y: 70, rotation: 4, scale: 0.86 },
  { x: 81, y: 30, rotation: -3, scale: 1.02 },
  { x: 97, y: 68, rotation: 2, scale: 0.92 },
];

export function V12Page({
  templateCount,
  mosaicTemplates,
  galleryTemplates,
}: {
  templateCount: number;
  mosaicTemplates: V12MosaicTemplate[];
  galleryTemplates: V12GalleryTemplate[];
}) {
  const t = useTranslations("homeLabV12");
  const rootRef = useRef<HTMLDivElement | null>(null);
  const [loggedIn, setLoggedIn] = useState(false);
  const reducedMotion = useV12Motion(rootRef);
  const focusTemplate = galleryTemplates[0];

  useEffect(() => {
    let active = true;
    fetch("/api/auth/session")
      .then((response) => (response.ok ? response.json() : null))
      .then((data: { loggedIn?: boolean } | null) => {
        if (active && data?.loggedIn) setLoggedIn(true);
      })
      .catch(() => {});

    return () => {
      active = false;
    };
  }, []);

  const createHref = loggedIn ? TEMPLATE_LIST_PATH : loginHref(TEMPLATE_LIST_PATH);

  return (
    <div
      ref={rootRef}
      className="home-editorial hp-v12"
      data-reduced-motion={reducedMotion ? "true" : "false"}
    >
      <LabStrip />
      <Home2Header createHref={createHref} />
      <main>
        <section
          className="v12-hero-track"
          aria-labelledby="v12-hero-title"
          aria-label={t("hero.ariaLabel")}
        >
          <div className="v12-hero-sticky">
            <div className="v12-ambient v12-ambient-one" aria-hidden />
            <div className="v12-ambient v12-ambient-two" aria-hidden />
            <div className="v12-perspective-grid" aria-hidden />
            <div className="v12-orbit v12-orbit-one" aria-hidden />
            <div className="v12-orbit v12-orbit-two" aria-hidden />

            <div className="v12-mosaic" aria-hidden="true">
              <div className="v12-symbol-glow">
                <Image
                  src={SONG_HY_DECOR}
                  alt=""
                  fill
                  priority
                  sizes="(max-width: 899px) 62vw, 32vw"
                />
              </div>
              <div className="v12-mosaic-cards">
                {mosaicTemplates.map((template, index) => {
                  const point = MOSAIC_POINTS[index % MOSAIC_POINTS.length];
                  const mobilePoint = mobilePointByTemplateIndex.get(index);
                  const style = {
                    "--v12-x": point.x,
                    "--v12-y": point.y,
                    "--v12-z": `${point.z}px`,
                    "--v12-r": `${point.rotation}deg`,
                    "--v12-mx": mobilePoint?.x ?? 0,
                    "--v12-my": mobilePoint?.y ?? 0,
                    "--v12-mr": `${mobilePoint?.rotation ?? 0}deg`,
                  } as CSSProperties;

                  return (
                    <div
                      key={template.slug}
                      className="v12-mosaic-card"
                      style={style}
                      data-x={point.x}
                      data-y={point.y}
                      data-z={point.z}
                      data-rotation={point.rotation}
                      data-mobile-visible={mobilePoint ? "true" : "false"}
                      data-mobile-x={mobilePoint?.x ?? 0}
                      data-mobile-y={mobilePoint?.y ?? 0}
                      data-mobile-rotation={mobilePoint?.rotation ?? 0}
                    >
                      <Image
                        src={template.thumbnail.src}
                        alt=""
                        width={template.thumbnail.width}
                        height={template.thumbnail.height}
                        sizes="(max-width: 899px) 18vw, 4vw"
                        loading={index < 12 ? "eager" : "lazy"}
                        unoptimized
                      />
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="v12-hero-copy">
              <p className="v12-kicker">{t("hero.eyebrow")}</p>
              <h1 id="v12-hero-title" className="v12-hero-title hp-display">
                <span>{t("hero.titleLead", { count: templateCount })}</span>
                <em>{t("hero.titleAccent")}</em>
              </h1>
              <p className="v12-hero-note">
                {t("hero.note", { count: templateCount })}
              </p>
            </div>

            {focusTemplate ? (
              <div className="v12-focus-stage">
                <div className="v12-focus-halo" aria-hidden />
                <div className="v12-focus-card">
                  <div className="v12-focus-image">
                    <Image
                      src={focusTemplate.portrait}
                      alt={t("focus.imageAlt", { name: focusTemplate.name })}
                      fill
                      priority
                      sizes="(max-width: 899px) 58vw, 22vw"
                      className="object-cover object-top"
                    />
                  </div>
                  <div className="v12-focus-meta">
                    <span>{t("focus.index", { count: templateCount })}</span>
                    <strong>{focusTemplate.name}</strong>
                  </div>
                </div>
                <div className="v12-focus-copy">
                  <p className="v12-kicker">{t("focus.eyebrow")}</p>
                  <h2 className="hp-display">{t("focus.title")}</h2>
                  <NextLink href={focusTemplate.demoPath} className="v12-text-link">
                    {t("focus.cta")}
                    <ArrowUpRight aria-hidden />
                  </NextLink>
                </div>
              </div>
            ) : null}

            <div className="v12-scroll-cue" aria-hidden="true">
              <span>{t("hero.scrollHint")}</span>
              <ArrowDown />
            </div>
          </div>
        </section>

        <section
          id="cach-hoat-dong"
          className="v12-gallery-section"
          aria-labelledby="v12-gallery-title"
        >
          <div className="v12-gallery-track">
            <div className="v12-gallery-sticky">
              <div className="v12-gallery-light" aria-hidden />
              <div className="v12-gallery-heading">
                <p className="v12-kicker">{t("gallery.eyebrow")}</p>
                <h2 id="v12-gallery-title" className="hp-display">
                  <span>{t("gallery.titleLead")}</span>
                  <em>{t("gallery.titleAccent")}</em>
                </h2>
                <p>{t("gallery.note")}</p>
              </div>

              <div className="v12-gallery-wall">
                {galleryTemplates.map((template, index) => {
                  const point = GALLERY_POINTS[index % GALLERY_POINTS.length];
                  const style = {
                    "--v12-gx": point.x,
                    "--v12-gy": `${point.y}%`,
                    "--v12-gr": `${point.rotation}deg`,
                    "--v12-gs": point.scale,
                  } as CSSProperties;

                  return (
                    <NextLink
                      key={template.slug}
                      href={template.demoPath}
                      className="v12-gallery-card"
                      style={style}
                      aria-label={t("gallery.open", { name: template.name })}
                    >
                      <span className="v12-gallery-image">
                        <Image
                          src={template.portrait}
                          alt={t("gallery.imageAlt", { name: template.name })}
                          fill
                          sizes="(max-width: 899px) 46vw, 17vw"
                          className="object-cover object-top"
                        />
                      </span>
                      <span className="v12-gallery-caption">
                        <span>{String(index + 1).padStart(2, "0")}</span>
                        <strong>{template.name}</strong>
                        <ArrowUpRight aria-hidden />
                      </span>
                    </NextLink>
                  );
                })}
              </div>

              <div className="v12-gallery-progress" aria-hidden="true">
                <span />
              </div>
            </div>
          </div>
        </section>

        <section
          id="khach-moi"
          className="v12-finale"
          aria-labelledby="v12-finale-title"
        >
          <div className="v12-finale-light" aria-hidden />
          <div className="v12-finale-art" aria-hidden="true">
            <div className="v12-final-orbit">
              {mosaicTemplates.slice(0, 8).map((template, index) => (
                <div
                  key={template.slug}
                  className="v12-final-orbit-card"
                  style={{ "--v12-orbit-index": index } as CSSProperties}
                >
                  <Image
                    src={template.thumbnail.src}
                    alt=""
                    width={template.thumbnail.width}
                    height={template.thumbnail.height}
                    sizes="8vw"
                    loading="lazy"
                    unoptimized
                  />
                </div>
              ))}
            </div>
            <div className="v12-final-sunburst">
              <Image src={SUNBURST_ASSET} alt="" fill sizes="42vw" />
            </div>
            <div className="v12-final-card">
              <span>{t("finale.cardKicker")}</span>
              <Image src={SONG_HY_ASSET} alt="" width={180} height={180} />
              <strong className="hp-display">{t("finale.seal")}</strong>
              <small>{t("finale.cardDate")}</small>
            </div>
          </div>

          <Shell className="v12-finale-copy">
            <p className="v12-kicker">{t("finale.eyebrow")}</p>
            <h2 id="v12-finale-title" className="hp-display">
              <span>{t("finale.titleLead")}</span>
              <em>{t("finale.titleAccent")}</em>
            </h2>
            <p className="v12-finale-note">{t("finale.note")}</p>
            <div className="v12-finale-actions">
              <NextLink href={createHref} className="v12-primary-cta">
                {t("finale.primaryCta")}
                <ArrowUpRight aria-hidden />
              </NextLink>
              <NextLink href={TEMPLATE_LIST_PATH} className="v12-secondary-cta">
                {t("finale.secondaryCta", { count: templateCount })}
              </NextLink>
            </div>
          </Shell>
        </section>
      </main>
      <Home2Footer />
      <ContactFab />
    </div>
  );
}

function LabStrip() {
  const t = useTranslations("homeLabV12.labStrip");

  return (
    <div className="v12-lab-strip">
      <Shell className="v12-lab-strip-inner">
        <span>{t("label")}</span>
        <strong>{t("name")}</strong>
        <NextLink href="/home-2/lab">{t("back")}</NextLink>
      </Shell>
    </div>
  );
}

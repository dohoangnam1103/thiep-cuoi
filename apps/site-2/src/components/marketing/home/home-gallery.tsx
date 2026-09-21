"use client";

import { useEffect, useRef, useState, type MouseEvent as ReactMouseEvent } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, ArrowUpRight } from "lucide-react";
import type { Site2ListingItem } from "../../../lib/catalog";
import vi from "@messages/vi.json";
import { HomeArtwork } from "./home-artwork";

/* Keep in sync with --s2-gallery-autoplay in home.css. */
const AUTOPLAY_MS = 6000;
const RAIL_COUNT = 3;

/* Editorial feature: one large invitation left, its story and the next three
 * designs right. Slow autoplay with a progress bar; any hover, focus or
 * manual move pauses it. Reduced-motion users get a fully static panel. */
export function HomeGallery({ templates, totalCount }: { templates: Site2ListingItem[]; totalCount: number }) {
  const items = templates.slice(0, 10);
  const [selection, setSelection] = useState(0);
  const [paused, setPaused] = useState(false);
  const start = useRef<{ x: number; y: number } | null>(null);
  const suppressClick = useRef(false);
  const active = items.length ? selection % items.length : 0;
  const rail = items.length > 1
    ? Array.from({ length: Math.min(RAIL_COUNT, items.length - 1) }, (_, offset) => (active + 1 + offset) % items.length)
    : [];
  const featured = items[active];
  const move = (direction: number) => setSelection((current) => (current + direction + items.length) % items.length);
  /* Pointer clicks release focus (detail > 0) so autoplay resumes once the
   * cursor leaves. Keyboard activation (detail === 0) keeps focus inside and
   * stays paused, which is the correct behaviour for keyboard readers. */
  const releaseFocusOnPointerClick = (event: ReactMouseEvent<HTMLButtonElement>) => {
    if (event.detail > 0) event.currentTarget.blur();
  };

  useEffect(() => {
    if (paused || items.length < 2) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = window.setTimeout(() => {
      setSelection((current) => (current + 1 + items.length) % items.length);
    }, AUTOPLAY_MS);
    return () => window.clearTimeout(id);
  }, [active, paused, items.length]);

  return (
    <section id="bo-suu-tap" className="s2-home-section s2-home-gallery" aria-labelledby="home-gallery-title" data-home-gallery>
      <header className="s2-home-centered">
        <p className="s2-home-small">{vi.home.galleryEyebrow}</p>
        <h2 id="home-gallery-title" className="s2-display s2-home-heading">{vi.home.galleryTitle}</h2>
        <p className="s2-home-intro">{vi.home.collectionNote}</p>
      </header>
      {featured && (
        <div
          className="s2-home-gallery-experience"
          data-theme={active % 5}
          data-paused={paused}
          onPointerEnter={() => setPaused(true)}
          onPointerLeave={() => setPaused(false)}
          onFocus={() => setPaused(true)}
          onBlur={() => setPaused(false)}
        >
          <div className="s2-home-gallery-atmosphere" aria-hidden="true">
            {[0, 1, 2, 3, 4].map((theme) => <div key={theme} className={`s2-home-gallery-color s2-home-gallery-color-${theme}`} data-current={active % 5 === theme} />)}
            <div className="s2-home-gallery-orbit" />
          </div>
          <div
            id="home-gallery-stage"
            className="s2-home-gallery-stage"
            role="region"
            aria-roledescription={vi.home.galleryRole}
            aria-label={vi.home.galleryTitle}
            tabIndex={0}
            onKeyDown={(event) => {
              if (items.length < 2) return;
              if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
                event.preventDefault();
                move(event.key === "ArrowRight" ? 1 : -1);
              }
              if (event.key === "Home" || event.key === "End") {
                event.preventDefault();
                setSelection(event.key === "Home" ? 0 : items.length - 1);
              }
            }}
            onPointerDown={(event) => {
              suppressClick.current = false;
              start.current = event.isPrimary && event.button === 0 ? { x: event.clientX, y: event.clientY } : null;
            }}
            onPointerCancel={() => { start.current = null; }}
            onPointerUp={(event) => {
              const origin = start.current;
              start.current = null;
              if (!origin || items.length < 2) return;
              const dx = event.clientX - origin.x;
              if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(event.clientY - origin.y)) {
                suppressClick.current = true;
                move(dx < 0 ? 1 : -1);
              }
            }}
            onClickCapture={(event) => {
              if (suppressClick.current) {
                event.preventDefault();
                event.stopPropagation();
                suppressClick.current = false;
              }
            }}
          >
            <Link
              key={featured.slug}
              href={`/mau-thiep/${featured.slug}/demo`}
              className="s2-home-gallery-feature"
              data-home-gallery-feature="true"
              aria-label={vi.home.envelopeDemo.replace("{name}", featured.name)}
              draggable={false}
            >
              <div className="s2-home-gallery-image" onDragStart={(event) => event.preventDefault()}>
                <HomeArtwork item={featured} />
              </div>
            </Link>
          </div>
          <div className="s2-home-gallery-side">
            <p className="s2-home-small">{featured.categoryVi}</p>
            <h3 className="s2-display s2-home-gallery-name">{featured.name}</h3>
            <Link href={`/mau-thiep/${featured.slug}/demo`} className="s2-home-button">
              {vi.templates.demoCta}<ArrowUpRight size={18} aria-hidden="true" />
            </Link>
            {rail.length > 0 && (
              <div className="s2-home-gallery-rail" role="group" aria-label={vi.home.railLabel}>
                <p className="s2-home-gallery-rail-label">{vi.home.railLabel}</p>
                <div className="s2-home-gallery-rail-list">
                  {rail.map((index) => (
                    <button
                      key={items[index].slug}
                      type="button"
                      className="s2-home-gallery-thumb"
                      data-home-gallery-thumb="true"
                      aria-label={items[index].name}
                      onClick={(event) => { releaseFocusOnPointerClick(event); setSelection(index); }}
                    >
                      <span className="s2-home-gallery-thumb-art"><HomeArtwork item={items[index]} small /></span>
                      <span className="s2-home-gallery-thumb-copy">
                        <span className="s2-display">{items[index].name}</span>
                        <span>{items[index].categoryVi}</span>
                      </span>
                      <span className="s2-home-gallery-thumb-index" aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
          <div className="s2-home-gallery-navigation">
            {items.length > 1 && <button className="s2-home-gallery-arrow" type="button" onClick={(event) => { releaseFocusOnPointerClick(event); move(-1); }} aria-label={vi.home.galleryPrevious} aria-controls="home-gallery-stage"><ArrowLeft size={20} aria-hidden="true" /></button>}
            <p className="s2-home-gallery-count" aria-live="polite" aria-atomic="true"><span>{String(active + 1).padStart(2, "0")}</span><span aria-hidden="true"> / </span>{String(items.length).padStart(2, "0")}<span className="sr-only"> {featured.name}</span></p>
            {items.length > 1 && <button className="s2-home-gallery-arrow" type="button" onClick={(event) => { releaseFocusOnPointerClick(event); move(1); }} aria-label={vi.home.galleryNext} aria-controls="home-gallery-stage"><ArrowRight size={20} aria-hidden="true" /></button>}
            {items.length > 1 && (
              <div className="s2-home-gallery-progress-track" aria-hidden="true">
                <span key={featured.slug} className="s2-home-gallery-progress" />
              </div>
            )}
          </div>
        </div>
      )}
      <div className="s2-home-gallery-bottom">
        <Link href="/mau-thiep" className="s2-home-link">{vi.home.galleryViewAll.replace("{count}", String(totalCount))}<ArrowUpRight size={18} aria-hidden="true" /></Link>
      </div>
    </section>
  );
}

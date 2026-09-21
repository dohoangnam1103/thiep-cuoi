"use client";

import { useState } from "react";
import Link from "next/link";
import vi from "@messages/vi.json";

export function HomeLivePreview() {
  const [bride, setBride] = useState(vi.home.previewBride);
  const [groom, setGroom] = useState(vi.home.previewGroom);
  const [date, setDate] = useState(vi.home.previewDate);
  const [theme, setTheme] = useState(0);
  const trimmedBride = bride.trim();
  const trimmedGroom = groom.trim();
  const trimmedDate = date.trim();
  const params = new URLSearchParams();
  if (trimmedBride) params.set("bride", trimmedBride);
  if (trimmedGroom) params.set("groom", trimmedGroom);
  if (trimmedDate) params.set("date", trimmedDate);
  const query = params.toString();
  const previewHref = query ? `/mau-thiep?${query}` : "/mau-thiep";

  return (
    <section className="s2-home-section s2-home-preview" aria-labelledby="home-preview-title">
      <div data-home-reveal>
        <p className="s2-home-small">{vi.home.previewEyebrow}</p>
        <h2 id="home-preview-title" className="s2-display s2-home-heading">{vi.home.livePreviewTitle}</h2>
        <p className="s2-home-intro">{vi.home.livePreviewSubtitle}</p>
        <div className="s2-home-theme-options" role="group" aria-label={vi.home.previewThemeLabel}>
          {vi.home.previewThemes.map((label, index) => (
            <button type="button" key={label} className={`s2-home-swatch s2-home-swatch-${index}`} aria-label={label} aria-pressed={theme === index} onClick={() => setTheme(index)} />
          ))}
        </div>
        <div className="s2-home-fields">
          <label>
            <span>{vi.home.livePreviewBrideLabel}</span>
            <input type="text" value={bride} onChange={(event) => setBride(event.target.value)} maxLength={40} />
          </label>
          <label>
            <span>{vi.home.livePreviewGroomLabel}</span>
            <input type="text" value={groom} onChange={(event) => setGroom(event.target.value)} maxLength={40} />
          </label>
          <label>
            <span>{vi.home.livePreviewDateLabel}</span>
            <input type="text" value={date} onChange={(event) => setDate(event.target.value)} maxLength={20} />
          </label>
        </div>
        <p className="s2-home-preview-echo" aria-live="polite">
          <span>{trimmedBride || vi.home.previewEmpty} & {trimmedGroom || vi.home.previewEmpty}</span>
          <span aria-hidden="true"> · </span>
          <span>{trimmedDate || vi.home.previewEmpty}</span>
        </p>
        <Link href={previewHref} className="s2-home-link">{vi.home.previewCta}<span aria-hidden="true">↗</span></Link>
      </div>
      <figure className="s2-home-preview-stage" data-home-reveal>
        <div className={`s2-home-preview-paper s2-home-paper-${theme}`} aria-label={vi.home.previewLabel}>
          <p className="s2-home-small">{vi.home.previewCeremony}</p>
          <p className="s2-display s2-home-preview-names">
            <span>{bride.trim() || vi.home.previewEmpty}</span>
            <span className="s2-home-preview-join">{vi.home.previewJoin}</span>
            <span>{groom.trim() || vi.home.previewEmpty}</span>
          </p>
          <span className="s2-home-envelope-rule" aria-hidden="true" />
          <p className="s2-home-preview-date">{date.trim() || vi.home.previewEmpty}</p>
          <p className="s2-home-preview-invitation">{vi.home.previewInvitation}</p>
        </div>
        <figcaption>{vi.home.previewDisclaimer}</figcaption>
      </figure>
    </section>
  );
}

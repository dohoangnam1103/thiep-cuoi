"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowUpRight, Check, Users, Heart } from "lucide-react";
import vi from "@messages/vi.json";

export function HomeRsvp() {
  const [confirmed, setConfirmed] = useState(false);
  return (
    <section className="s2-home-rsvp s2-home-section" aria-labelledby="home-rsvp-title">
      <div className="s2-home-rsvp-stage" aria-label={vi.home.rsvpDemoLabel}>
        <div className="s2-home-rsvp-invitation">
          <Heart size={24} strokeWidth={1.25} aria-hidden="true" />
          <p className="s2-home-small">{vi.home.envelopeSalutation}</p>
          <p className="s2-display">{vi.home.rsvpGuest}</p>
          <span>{vi.home.rsvpGreeting}</span>
          <button type="button" className="s2-home-button" aria-pressed={confirmed} onClick={() => setConfirmed(!confirmed)}>
            {confirmed ? <Check size={18} aria-hidden="true" /> : <Heart size={18} aria-hidden="true" />}
            {confirmed ? vi.home.rsvpStatus : vi.home.rsvpTry}
          </button>
        </div>
        <div className={`s2-home-rsvp-receipt${confirmed ? " is-confirmed" : ""}`} role="status" aria-live="polite">
          <span className="s2-home-rsvp-avatar"><Users size={20} aria-hidden="true" /></span>
          <span><strong>{vi.home.rsvpGuest}</strong><span>{confirmed ? vi.home.rsvpCount : vi.home.rsvpPending}</span></span>
          {confirmed && <Check size={20} aria-hidden="true" />}
        </div>
        <p className="s2-home-demo-note">{vi.home.rsvpDisclaimer}</p>
      </div>
      <div>
        <p className="s2-home-small">{vi.home.rsvpEyebrow}</p>
        <h2 id="home-rsvp-title" className="s2-display s2-home-heading">{vi.home.rsvpTitle}</h2>
        <p className="s2-home-intro">{vi.home.rsvpBody}</p>
        <Link href="/huong-dan" className="s2-home-link">{vi.home.rsvpCta}<ArrowUpRight size={18} aria-hidden="true" /></Link>
      </div>
    </section>
  );
}

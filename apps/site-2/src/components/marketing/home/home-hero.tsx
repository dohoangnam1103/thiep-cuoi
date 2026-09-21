import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import vi from "@messages/vi.json";

/* Copy-only hero. The invitation artwork lives in the gallery below, so the
 * hero stays text: eyebrow, title, subtitle, one browse action and one anchor
 * into the collection. No props, no images, no duplication. */
export function HomeHero() {
  return (
    <section className="s2-home-hero" aria-labelledby="home-title">
      <div className="s2-home-hero-copy">
        <p className="s2-home-small">{vi.home.heroEyebrow}</p>
        <h1 id="home-title" className="s2-display">{vi.home.heroTitle}<em>{vi.home.heroTitleAccent}</em></h1>
        <p className="s2-home-intro">{vi.home.heroSubtitle}</p>
        <div className="s2-home-actions">
          <Link href="/mau-thiep" className="s2-home-button">{vi.home.browseCta}<ArrowUpRight size={18} aria-hidden="true" /></Link>
          <Link href="#bo-suu-tap" className="s2-home-link">{vi.home.heroSecondaryCta}</Link>
        </div>
        <p className="s2-home-hero-note">{vi.home.heroNote}</p>
      </div>
    </section>
  );
}

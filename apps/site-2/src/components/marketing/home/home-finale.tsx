import Link from "next/link";
import vi from "@messages/vi.json";

export function HomeFinale() {
  return (
    <section className="s2-home-finale" aria-labelledby="home-finale-title">
      <div className="s2-home-finale-mark s2-display" aria-hidden="true">{vi.home.previewJoin}</div>
      <div data-home-reveal>
        <p className="s2-home-small">{vi.home.finalEyebrow}</p>
        <h2 id="home-finale-title" className="s2-display">{vi.home.finalTitle}</h2>
        <p className="s2-home-intro">{vi.home.finalNote}</p>
        <div className="s2-home-actions">
          <Link href="/mau-thiep" className="s2-home-button">{vi.home.finalCta}<span aria-hidden="true">↗</span></Link>
          <Link href="/bang-gia" className="s2-home-link">{vi.home.pricingLink}</Link>
        </div>
      </div>
    </section>
  );
}

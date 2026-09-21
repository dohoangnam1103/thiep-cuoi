import Link from "next/link";
import { ArrowUpRight, Plus, BookOpen } from "lucide-react";
import vi from "@messages/vi.json";

export function HomeDetails() {
  return (
    <section className="s2-home-section s2-home-details" aria-label={vi.home.faqTitle}>
      <aside className="s2-home-support">
        <BookOpen size={30} strokeWidth={1.25} aria-hidden="true" />
        <p className="s2-home-small">{vi.home.supportEyebrow}</p>
        <h2 className="s2-display">{vi.home.supportTitle}</h2>
        <p>{vi.home.supportBody}</p>
        <Link href="/huong-dan" className="s2-home-link">{vi.home.supportCta}<ArrowUpRight size={18} aria-hidden="true" /></Link>
      </aside>
      <div className="s2-home-faq">
        <h2 className="s2-display s2-home-heading">{vi.home.faqTitle}</h2>
        {vi.home.faq.map((item) => (
          <details key={item.q}>
            <summary>{item.q}<Plus size={20} strokeWidth={1.5} aria-hidden="true" /></summary>
            <p>{item.a}</p>
          </details>
        ))}
        <Link href="/bang-gia" className="s2-home-link">{vi.home.pricingLink}<ArrowUpRight size={18} aria-hidden="true" /></Link>
      </div>
    </section>
  );
}

import { Flower2 } from "lucide-react";

import { Marquee } from "../motion/marquee";
import vi from "@messages/vi.json";

/* The single marquee on the homepage: a slow strip of the catalog style
 * labels in Vietnamese. Pure presentation, the catalog stays the filterable
 * source of truth. */
export function CategoryMarquee({ labels }: { labels: readonly string[] }) {
  if (labels.length === 0) return null;
  return (
    <div className="border-y border-[var(--s2-line)] py-5">
      <Marquee label={vi.home.marqueeLabel}>
        {labels.map((label) => (
          <span
            key={label}
            className="s2-display flex items-center gap-12 text-[22px] font-medium tracking-tight whitespace-nowrap text-[var(--s2-muted)] italic md:text-[26px]"
          >
            {label}
            <Flower2
              size={18}
              aria-hidden
              className="shrink-0 text-[var(--s2-accent)] opacity-70"
            />
          </span>
        ))}
      </Marquee>
    </div>
  );
}

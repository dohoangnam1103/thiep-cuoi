import type { ReactNode } from "react";

/* Single allowed marquee per page: a seamless category strip. The track holds
 * two identical groups; the loop, hover pause and reduced-motion fallback
 * all live in marketing.css (.s2-marquee-track), so this wrapper ships no
 * client JavaScript. */
export function Marquee({
  children,
  label,
  duration = 38,
  className,
}: {
  children: ReactNode;
  label: string;
  duration?: number;
  className?: string;
}) {
  return (
    <div aria-label={label} className={`s2-marquee ${className ?? ""}`}>
      <div
        className="s2-marquee-track"
        style={{ animationDuration: `${duration}s` }}
      >
        <div className="s2-marquee-group">{children}</div>
        <div className="s2-marquee-group" aria-hidden>
          {children}
        </div>
      </div>
    </div>
  );
}

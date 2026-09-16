import type { ReactNode } from "react";

/* Scroll-linked parallax without scroll listeners: layers drift apart using
 * the scroll-driven keyframes in marketing.css (.s2-parallax-far/near).
 * Static when scroll animations are unsupported, off under reduced motion. */
export function Parallax({
  children,
  distance = 48,
  className,
}: {
  children: ReactNode;
  distance?: number;
  className?: string;
}) {
  const layer = distance > 40 ? "s2-parallax-near" : "s2-parallax-far";
  return <div className={`${layer} ${className ?? ""}`}>{children}</div>;
}

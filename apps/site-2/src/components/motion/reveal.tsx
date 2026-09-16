import { Children, cloneElement, isValidElement } from "react";
import type { ReactNode } from "react";

/* Scroll reveal for marketing and workspace surfaces. Pure CSS: entry uses
 * the scroll-driven .s2-reveal keyframes in marketing.css (transform and
 * opacity only, static without animation-timeline support, off under
 * reduced motion). Server-rendered and screenshot-deterministic: no client
 * JavaScript, no observers, no scroll listeners. */

export function Reveal({
  children,
  delay = 0,
  className,
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  return (
    <div
      className={`s2-reveal ${className ?? ""}`}
      style={delay ? { animationDelay: `${delay}s` } : undefined}
    >
      {children}
    </div>
  );
}

/* Staggered group: wrap items in <RevealItem> inside <RevealGroup>. Siblings
 * share one scroll trigger and rise in sequence through animation delay. */
export function RevealGroup({
  children,
  className,
  gap = 0.09,
}: {
  children: ReactNode;
  className?: string;
  gap?: number;
}) {
  const items = Children.toArray(children);
  return (
    <div className={className}>
      {items.map((child, index) =>
        isValidElement<RevealItemProps>(child) && child.type === RevealItem
          ? cloneElement(child, {
              delay: (child.props.delay ?? 0) + index * gap,
            })
          : child,
      )}
    </div>
  );
}

type RevealItemProps = {
  children: ReactNode;
  className?: string;
  delay?: number;
};

export function RevealItem({ children, className, delay = 0 }: RevealItemProps) {
  return (
    <div
      className={`s2-reveal ${className ?? ""}`}
      style={delay ? { animationDelay: `${delay}s` } : undefined}
    >
      {children}
    </div>
  );
}

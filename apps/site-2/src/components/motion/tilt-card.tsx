import type { ReactNode } from "react";

/* Pointer tilt for gallery cards: a tactile lift on hover through the shared
 * .s2-tilt transition (transform only). Pure CSS, so touch devices and
 * reduced-motion visitors simply get the static card. */
export function TiltCard({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={`s2-tilt ${className ?? ""}`}>{children}</div>;
}

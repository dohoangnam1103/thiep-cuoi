import type { ComponentPropsWithoutRef, ReactNode } from "react";

/* Liquid Glass primitive: translucent backdrop with highlight border and
 * soft shadow. Three variants control opacity. Falls back to opaque surface
 * when backdrop-filter is unsupported (see marketing.css). */

const VARIANT_CLASS: Record<GlassVariant, string> = {
  default: "s2-glass",
  strong: "s2-glass-strong",
  nav: "s2-glass-nav",
};

export type GlassVariant = "default" | "strong" | "nav";

type GlassProps = ComponentPropsWithoutRef<"div"> & {
  variant?: GlassVariant;
  sheen?: boolean;
};

export function Glass({
  variant = "default",
  sheen = false,
  className,
  children,
  ...props
}: GlassProps) {
  const classes = [VARIANT_CLASS[variant], sheen && "s2-sheen", className]
    .filter(Boolean)
    .join(" ");
  return (
    <div className={classes} {...props}>
      {children}
    </div>
  );
}

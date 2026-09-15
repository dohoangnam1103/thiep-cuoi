import type { ButtonHTMLAttributes } from "react";

type S2ButtonProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, "type"> & {
  variant?: "cta" | "toolbar" | "secondary";
  type?: "button" | "submit" | "reset";
};

const VARIANT_CLASSES = {
  /* Pill for primary calls to action. */
  cta: "rounded-full bg-[var(--s2-accent)] px-7 py-3 text-[15px] font-semibold text-[var(--s2-accent-ink)]",
  /* Compact rounded rectangle for toolbar and editor actions. */
  toolbar:
    "rounded-[var(--s2-input-radius)] bg-[var(--s2-accent)] px-4 py-2 text-sm font-semibold text-[var(--s2-accent-ink)]",
  secondary:
    "rounded-full border border-[var(--s2-line)] bg-[var(--s2-surface)] px-7 py-3 text-[15px] font-semibold text-[var(--s2-ink)]",
} as const;

export function S2Button({
  variant = "cta",
  type = "button",
  className,
  ...rest
}: S2ButtonProps) {
  const classes = [
    "inline-flex items-center justify-center transition-transform active:scale-[0.98]",
    "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--s2-accent)]",
    "disabled:cursor-not-allowed disabled:opacity-60 disabled:active:scale-100",
    VARIANT_CLASSES[variant],
    className,
  ]
    .filter(Boolean)
    .join(" ");
  return <button type={type} className={classes} {...rest} />;
}

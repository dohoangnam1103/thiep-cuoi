"use client";

import { createContext, useContext, type ReactNode } from "react";
import { resolveHeroTypography, type HeroTypography, type HeroTypographyMap } from "@/lib/hero-typography";

const Context = createContext<HeroTypographyMap>({});
const DraftContext = createContext<HeroTypography | undefined>(undefined);
export const HeroTypographyDraft = DraftContext.Provider;
export function HeroTypographyProvider({ value, children }: { value: HeroTypographyMap; children: ReactNode }) {
  return <Context.Provider value={value}>{children}</Context.Provider>;
}
export function useHeroTypographyDefaults(slug: string) { return useContext(Context)[slug]; }
export function HeroTypographyScope({ slug, userFont, children }: { slug: string; userFont?: string | null; children: ReactNode }) {
  const defaults = useHeroTypographyDefaults(slug);
  const draft = useContext(DraftContext);
  // Admin's draft deliberately bypasses the demo's old general font setting.
  const value = draft ?? resolveHeroTypography(defaults, userFont);
  return <div className="contents" data-hero-font={value.fontFamily || undefined} data-hero-bold={value.bold ?? undefined} data-hero-italic={value.italic ?? undefined}>{children}</div>;
}

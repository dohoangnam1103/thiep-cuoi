import type { ReactNode } from "react";
import { getHeroTypography } from "@/lib/hero-typography-config";
import { HeroTypographyProvider } from "@/components/hero-typography-provider";

export async function HeroTypographyDefaults({ children }: { children: ReactNode }) {
  return <HeroTypographyProvider value={await getHeroTypography()}>{children}</HeroTypographyProvider>;
}

"use client";

import { useTranslations } from "next-intl";
import type { ChungDoiDemoContent } from "@/data/chungdoi-demo-content";
import { ArtInvitation, type ArtInvitationConfig, type InvitationTranslationKey } from "@/components/chungdoi-tpl-art-invitation";

const config = {
  layout: "dark-stage",
  artwork: "/chungdoi/images/themes/_decor/aurora-glass-dark/artwork.webp",
  pageClass: "bg-[#111a1b]",
  heroClass: "bg-[#111a1b]",
  surfaceClass: "bg-[#162324]/75 shadow-[inset_0_1px_0_rgb(255_255_255_/_0.12)]",
  sectionClass: "border-t border-[#9cc7c2]/24 pt-10",
  inkClass: "text-[#edf3ef]",
  mutedClass: "text-[#edf3ef]/60",
  accentTextClass: "text-[#a7d4ce]",
  accentBgClass: "bg-[#a7d4ce]",
  borderClass: "border-white/15",
  buttonClass: "bg-[#d8c5a2] text-[#142021]",
  displayFontClass: "font-art-alex",
  coupleClass: "text-[clamp(4rem,13vw,8rem)] font-normal leading-[0.78] tracking-normal",
  headingClass: "text-4xl font-normal leading-none md:text-6xl",
  imageClass: "contrast-[1.05]",
  radiusClass: "rounded-[2rem]",
  accentHex: "#a7d4ce",
  inkHex: "#edf3ef",
} satisfies ArtInvitationConfig;

export function AuroraGlassDarkInvitation({ content }: { content: ChungDoiDemoContent }) {
  const t = useTranslations("invitationTemplate");
  const translate = (key: InvitationTranslationKey, values?: Record<string, string | number>) => t(key, values);
  return <ArtInvitation content={content} config={config} t={translate} />;
}

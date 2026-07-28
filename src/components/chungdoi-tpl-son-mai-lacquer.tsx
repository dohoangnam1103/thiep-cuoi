"use client";

import { useTranslations } from "next-intl";
import type { ChungDoiDemoContent } from "@/data/chungdoi-demo-content";
import { ArtInvitation, type ArtInvitationConfig, type InvitationTranslationKey } from "@/components/chungdoi-tpl-art-invitation";

const config = {
  layout: "dark-stage",
  artwork: "/chungdoi/images/themes/_decor/son-mai-lacquer/artwork.webp",
  pageClass: "bg-[#080706]",
  heroClass: "bg-[#080706]",
  surfaceClass: "bg-[#100d09]/90",
  sectionClass: "border-t border-[#d5a643]/35 pt-10",
  inkClass: "text-[#f3e4bd]",
  mutedClass: "text-[#f3e4bd]/65",
  accentTextClass: "text-[#d5a643]",
  accentBgClass: "bg-[#d5a643]",
  borderClass: "border-[#d5a643]/35",
  buttonClass: "bg-[#d5a643] text-[#100d09]",
  displayFontClass: "font-art-new-eddy",
  coupleClass: "text-[clamp(3rem,10vw,7rem)] font-normal leading-[0.88] tracking-[-0.025em]",
  headingClass: "text-3xl font-normal leading-tight md:text-5xl",
  imageClass: "contrast-[1.06]",
  radiusClass: "rounded-[2px]",
  accentHex: "#d5a643",
  inkHex: "#f3e4bd",
} satisfies ArtInvitationConfig;

export function SonMaiLacquerInvitation({ content }: { content: ChungDoiDemoContent }) {
  const t = useTranslations("invitationTemplate");
  const translate = (key: InvitationTranslationKey, values?: Record<string, string | number>) => t(key, values);
  return <ArtInvitation content={content} config={config} t={translate} />;
}

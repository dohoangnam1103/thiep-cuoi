"use client";

import { useTranslations } from "next-intl";
import type { ChungDoiDemoContent } from "@/data/chungdoi-demo-content";
import { ArtInvitation, type ArtInvitationConfig, type InvitationTranslationKey } from "@/components/chungdoi-tpl-art-invitation";

const config = {
  layout: "quiet",
  artwork: "/chungdoi/images/themes/_decor/truc-chi-minimal/artwork.webp",
  pageClass: "bg-[#d9c29a]",
  heroClass: "bg-[#d6b980]",
  surfaceClass: "bg-[#f2dfb8]",
  sectionClass: "border-t border-[#5b4429]/20 pt-10",
  inkClass: "text-[#4a3825]",
  mutedClass: "text-[#4a3825]/58",
  accentTextClass: "text-[#7a4b21]",
  accentBgClass: "bg-[#7a4b21]",
  borderClass: "border-[#5b4429]/22",
  buttonClass: "bg-[#65401f] text-[#fff1ce]",
  displayFontClass: "font-art-lora",
  coupleClass: "text-[clamp(3rem,10vw,6.2rem)] font-normal leading-[0.95] tracking-[-0.02em]",
  headingClass: "text-3xl font-normal leading-tight md:text-5xl",
  imageClass: "brightness-[1.02]",
  radiusClass: "rounded-[2rem]",
  accentHex: "#7a4b21",
  inkHex: "#4a3825",
} satisfies ArtInvitationConfig;

export function TrucChiMinimalInvitation({ content }: { content: ChungDoiDemoContent }) {
  const t = useTranslations("invitationTemplate");
  const translate = (key: InvitationTranslationKey, values?: Record<string, string | number>) => t(key, values);
  return <ArtInvitation content={content} config={config} t={translate} />;
}

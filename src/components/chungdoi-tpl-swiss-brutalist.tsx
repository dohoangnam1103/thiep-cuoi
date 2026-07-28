"use client";

import { useTranslations } from "next-intl";
import type { ChungDoiDemoContent } from "@/data/chungdoi-demo-content";
import { ArtInvitation, type ArtInvitationConfig, type InvitationTranslationKey } from "@/components/chungdoi-tpl-art-invitation";

const config = {
  layout: "poster",
  artwork: "/chungdoi/images/themes/_decor/swiss-brutalist/artwork.webp",
  pageClass: "bg-[#efeee9]",
  heroClass: "bg-[#efeee9]",
  surfaceClass: "bg-[#efeee9]/94",
  sectionClass: "border-t-4 border-[#1e1e1c] pt-8",
  inkClass: "text-[#1e1e1c]",
  mutedClass: "text-[#1e1e1c]/58",
  accentTextClass: "text-[#dc241f]",
  accentBgClass: "bg-[#dc241f]",
  borderClass: "border-[#1e1e1c]",
  buttonClass: "bg-[#dc241f] text-[#efeee9]",
  displayFontClass: "font-art-helvetica",
  coupleClass: "text-[clamp(3rem,12vw,8rem)] font-light uppercase leading-[0.78] tracking-[-0.055em]",
  headingClass: "text-4xl font-light uppercase leading-[0.9] tracking-[-0.04em] md:text-6xl",
  imageClass: "contrast-[1.08]",
  radiusClass: "rounded-none",
  accentHex: "#dc241f",
  inkHex: "#1e1e1c",
} satisfies ArtInvitationConfig;

export function SwissBrutalistInvitation({ content }: { content: ChungDoiDemoContent }) {
  const t = useTranslations("invitationTemplate");
  const translate = (key: InvitationTranslationKey, values?: Record<string, string | number>) => t(key, values);
  return <ArtInvitation content={content} config={config} t={translate} />;
}

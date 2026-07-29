"use client";

import { useTranslations } from "next-intl";
import type { ChungDoiDemoContent } from "@/data/chungdoi-demo-content";
import { ArtInvitation, type ArtInvitationConfig, type InvitationTranslationKey } from "@/components/chungdoi-tpl-art-invitation";

const config = {
  layout: "split",
  artwork: "/chungdoi/images/themes/_decor/chim-lac-ivory/artwork.webp",
  pageClass: "bg-[#e4d9c1]",
  heroClass: "bg-[#efe4cd]",
  surfaceClass: "bg-[#f4ecda]",
  sectionClass: "border-t border-[#3a2a1e]/18 pt-10",
  inkClass: "text-[#3a2a1e]",
  mutedClass: "text-[#3a2a1e]/60",
  accentTextClass: "text-[#a8341f]",
  accentBgClass: "bg-[#a8341f]",
  borderClass: "border-[#3a2a1e]/20",
  buttonClass: "bg-[#a8341f] text-[#f8f1e1]",
  displayFontClass: "font-art-qellia",
  coupleClass: "text-[clamp(3.1rem,10vw,6.8rem)] font-normal leading-[0.9] tracking-normal",
  headingClass: "text-3xl font-normal leading-tight md:text-5xl",
  imageClass: "saturate-[0.92]",
  radiusClass: "rounded-[999px]",
  accentHex: "#a8341f",
  inkHex: "#3a2a1e",
} satisfies ArtInvitationConfig;

export function ChimLacIvoryInvitation({ content }: { content: ChungDoiDemoContent }) {
  const t = useTranslations("invitationTemplate");
  const translate = (key: InvitationTranslationKey, values?: Record<string, string | number>) => t(key, values);
  return <ArtInvitation content={content} config={config} t={translate} />;
}

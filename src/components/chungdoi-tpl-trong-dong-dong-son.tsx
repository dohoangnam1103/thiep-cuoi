"use client";

import { useTranslations } from "next-intl";
import type { ChungDoiDemoContent } from "@/data/chungdoi-demo-content";
import { ArtInvitation, type ArtInvitationConfig, type InvitationTranslationKey } from "@/components/chungdoi-tpl-art-invitation";

const config = {
  layout: "folk",
  artwork: "/chungdoi/images/themes/_decor/trong-dong-dong-son/artwork.webp",
  pageClass: "bg-[#0b211f]",
  heroClass: "bg-[#0b211f]",
  surfaceClass: "bg-[#123430]/88",
  sectionClass: "border-t border-[#cba14a]/34 pt-10",
  inkClass: "text-[#f2e6c8]",
  mutedClass: "text-[#f2e6c8]/62",
  accentTextClass: "text-[#cba14a]",
  accentBgClass: "bg-[#cba14a]",
  borderClass: "border-[#cba14a]/34",
  buttonClass: "bg-[#cba14a] text-[#10302c]",
  displayFontClass: "font-art-uni",
  coupleClass: "text-[clamp(2.9rem,9.5vw,6.4rem)] font-normal leading-[0.92] tracking-[0.01em]",
  headingClass: "text-3xl font-normal leading-tight md:text-5xl",
  imageClass: "saturate-[0.94] contrast-[1.04]",
  radiusClass: "rounded-full",
  accentHex: "#cba14a",
  inkHex: "#f2e6c8",
} satisfies ArtInvitationConfig;

export function TrongDongDongSonInvitation({ content }: { content: ChungDoiDemoContent }) {
  const t = useTranslations("invitationTemplate");
  const translate = (key: InvitationTranslationKey, values?: Record<string, string | number>) => t(key, values);
  return <ArtInvitation content={content} config={config} t={translate} />;
}

"use client";

import { useTranslations } from "next-intl";
import { ArtInvitation, type ArtInvitationConfig, type InvitationTranslationKey } from "@/components/chungdoi-tpl-art-invitation";
import type { ChungDoiDemoContent } from "@/data/chungdoi-demo-content";

const config = {
  layout: "split",
  artwork: "/chungdoi/images/themes/_decor/hoa-thu-do-ruou-vang/artwork.webp",
  pageClass: "bg-[#f4e7e0]",
  heroClass: "bg-[#f9efe9]",
  surfaceClass: "bg-[#fdf8f4]",
  sectionClass: "border-t border-[#7b2b3a]/22 pt-10",
  inkClass: "text-[#3a1d24]",
  mutedClass: "text-[#3a1d24]/60",
  accentTextClass: "text-[#7b2b3a]",
  accentBgClass: "bg-[#7b2b3a]",
  borderClass: "border-[#7b2b3a]/28",
  buttonClass: "bg-[#7b2b3a] text-[#fdf8f4]",
  displayFontClass: "font-art-qellia",
  coupleClass: "text-[clamp(3.2rem,10vw,6.2rem)] font-normal leading-[0.9] tracking-tight",
  headingClass: "text-3xl font-normal leading-tight md:text-5xl",
  imageClass: "saturate-[0.96] contrast-[1.02]",
  radiusClass: "rounded-full",
  accentHex: "#7b2b3a",
  inkHex: "#3a1d24",
} satisfies ArtInvitationConfig;

export function HoaThuDoRuouVangInvitation({ content }: { content: ChungDoiDemoContent }) {
  const t = useTranslations("invitationTemplate");
  const translate = (key: InvitationTranslationKey, values?: Record<string, string | number>) => t(key, values);
  return <ArtInvitation content={content} config={config} t={translate} />;
}

"use client";

import { useTranslations } from "next-intl";
import { ArtInvitation, type ArtInvitationConfig, type InvitationTranslationKey } from "@/components/chungdoi-tpl-art-invitation";
import type { ChungDoiDemoContent } from "@/data/chungdoi-demo-content";

const config = {
  layout: "quiet",
  artwork: "/chungdoi/images/themes/_decor/phong-thu-do-pastel/artwork.webp",
  pageClass: "bg-[#f6e6e1]",
  heroClass: "bg-[#faeeea]",
  surfaceClass: "bg-[#fdf8f6]",
  sectionClass: "border-t border-[#4d2a26]/16 pt-10",
  inkClass: "text-[#4d2a26]",
  mutedClass: "text-[#4d2a26]/60",
  accentTextClass: "text-[#b5695f]",
  accentBgClass: "bg-[#b5695f]",
  borderClass: "border-[#4d2a26]/18",
  buttonClass: "bg-[#b5695f] text-[#fdf8f6]",
  displayFontClass: "font-art-signora",
  coupleClass: "text-[clamp(3.4rem,10vw,6.4rem)] font-normal leading-[0.9] tracking-normal",
  headingClass: "text-3xl font-normal leading-tight md:text-5xl",
  imageClass: "saturate-[0.96]",
  radiusClass: "rounded-full",
  accentHex: "#b5695f",
  inkHex: "#4d2a26",
} satisfies ArtInvitationConfig;

export function PhongThuDoPastelInvitation({ content }: { content: ChungDoiDemoContent }) {
  const t = useTranslations("invitationTemplate");
  const translate = (key: InvitationTranslationKey, values?: Record<string, string | number>) => t(key, values);
  return <ArtInvitation content={content} config={config} t={translate} />;
}

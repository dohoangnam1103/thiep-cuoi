"use client";

import { useTranslations } from "next-intl";
import { ArtInvitation, type ArtInvitationConfig, type InvitationTranslationKey } from "@/components/chungdoi-tpl-art-invitation";
import type { ChungDoiDemoContent } from "@/data/chungdoi-demo-content";

const config = {
  layout: "quiet",
  artwork: "/chungdoi/images/themes/_decor/phong-thu-luc-pastel/artwork.webp",
  pageClass: "bg-[#eaf1e8]",
  heroClass: "bg-[#f1f6ef]",
  surfaceClass: "bg-[#fbfcf9]",
  sectionClass: "border-t border-[#2f4238]/16 pt-10",
  inkClass: "text-[#2f4238]",
  mutedClass: "text-[#2f4238]/60",
  accentTextClass: "text-[#6f8f76]",
  accentBgClass: "bg-[#6f8f76]",
  borderClass: "border-[#2f4238]/18",
  buttonClass: "bg-[#6f8f76] text-[#fbfcf9]",
  displayFontClass: "font-art-lora",
  coupleClass: "text-[clamp(3rem,9vw,5.6rem)] font-normal leading-[0.94] tracking-tight",
  headingClass: "text-3xl font-normal leading-tight md:text-5xl",
  imageClass: "saturate-[0.94]",
  radiusClass: "rounded-full",
  accentHex: "#6f8f76",
  inkHex: "#2f4238",
} satisfies ArtInvitationConfig;

export function PhongThuLucPastelInvitation({ content }: { content: ChungDoiDemoContent }) {
  const t = useTranslations("invitationTemplate");
  const translate = (key: InvitationTranslationKey, values?: Record<string, string | number>) => t(key, values);
  return <ArtInvitation content={content} config={config} t={translate} />;
}

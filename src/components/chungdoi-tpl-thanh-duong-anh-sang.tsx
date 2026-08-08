"use client";

import { useTranslations } from "next-intl";
import type { ChungDoiDemoContent } from "@/data/chungdoi-demo-content";
import { ArtInvitation, type ArtInvitationConfig, type InvitationTranslationKey } from "@/components/chungdoi-tpl-art-invitation";

const config = {
  layout: "split",
  artwork: "/chungdoi/images/themes/_decor/thanh-duong-anh-sang/artwork.webp",
  pageClass: "bg-[#f2ede0]",
  heroClass: "bg-[#f4f0e4]",
  surfaceClass: "bg-[#f9f6ef]",
  sectionClass: "border-t border-[#1e3a5f]/16 pt-10",
  inkClass: "text-[#1e3a5f]",
  mutedClass: "text-[#1e3a5f]/55",
  accentTextClass: "text-[#c9922f]",
  accentBgClass: "bg-[#c9922f]",
  borderClass: "border-[#1e3a5f]/18",
  buttonClass: "bg-[#c9922f] text-[#f9f6ef]",
  displayFontClass: "font-art-qellia",
  coupleClass: "text-[clamp(3.4rem,11vw,7rem)] font-normal leading-[0.84] tracking-wide",
  headingClass: "text-4xl font-normal leading-none md:text-6xl",
  imageClass: "saturate-[0.94]",
  radiusClass: "rounded-[999px]",
  giftLayout: "flip",
  accentHex: "#c9922f",
  inkHex: "#1e3a5f",
} satisfies ArtInvitationConfig;

export function ThanhDuongAnhSangInvitation({ content }: { content: ChungDoiDemoContent }) {
  const t = useTranslations("invitationTemplate");
  const translate = (key: InvitationTranslationKey, values?: Record<string, string | number>) => t(key, values);
  return <ArtInvitation content={content} config={config} t={translate} />;
}

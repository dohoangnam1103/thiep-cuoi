"use client";

import { useTranslations } from "next-intl";
import { ArtInvitation, type ArtInvitationConfig, type InvitationTranslationKey } from "@/components/chungdoi-tpl-art-invitation";
import type { ChungDoiDemoContent } from "@/data/chungdoi-demo-content";

const config = {
  layout: "split",
  artwork: "/chungdoi/images/themes/_decor/hoa-thu-xanh-duong/artwork.webp",
  pageClass: "bg-[#e5ecf5]",
  heroClass: "bg-[#eef3f9]",
  surfaceClass: "bg-[#f8fafd]",
  sectionClass: "border-t border-[#33567f]/22 pt-10",
  inkClass: "text-[#1e2c3f]",
  mutedClass: "text-[#1e2c3f]/60",
  accentTextClass: "text-[#33567f]",
  accentBgClass: "bg-[#33567f]",
  borderClass: "border-[#33567f]/28",
  buttonClass: "bg-[#33567f] text-[#f8fafd]",
  displayFontClass: "font-art-qellia",
  coupleClass: "text-[clamp(3.2rem,10vw,6.2rem)] font-normal leading-[0.9] tracking-tight",
  headingClass: "text-3xl font-normal leading-tight md:text-5xl",
  imageClass: "saturate-[0.94] contrast-[1.02]",
  radiusClass: "rounded-full",
  accentHex: "#33567f",
  inkHex: "#1e2c3f",
} satisfies ArtInvitationConfig;

export function HoaThuXanhDuongInvitation({ content }: { content: ChungDoiDemoContent }) {
  const t = useTranslations("invitationTemplate");
  const translate = (key: InvitationTranslationKey, values?: Record<string, string | number>) => t(key, values);
  return <ArtInvitation content={content} config={config} t={translate} />;
}

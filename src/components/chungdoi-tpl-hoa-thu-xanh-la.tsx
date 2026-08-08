"use client";

import { useTranslations } from "next-intl";
import { ArtInvitation, type ArtInvitationConfig, type InvitationTranslationKey } from "@/components/chungdoi-tpl-art-invitation";
import type { ChungDoiDemoContent } from "@/data/chungdoi-demo-content";

const config = {
  layout: "split",
  artwork: "/chungdoi/images/themes/_decor/hoa-thu-xanh-la/artwork.webp",
  pageClass: "bg-[#e9efe4]",
  heroClass: "bg-[#f1f6ec]",
  surfaceClass: "bg-[#fbfcf8]",
  sectionClass: "border-t border-[#3f6b4f]/22 pt-10",
  inkClass: "text-[#22321f]",
  mutedClass: "text-[#22321f]/60",
  accentTextClass: "text-[#3f6b4f]",
  accentBgClass: "bg-[#3f6b4f]",
  borderClass: "border-[#3f6b4f]/28",
  buttonClass: "bg-[#3f6b4f] text-[#fbfcf8]",
  displayFontClass: "font-art-qellia",
  coupleClass: "text-[clamp(3.2rem,10vw,6.2rem)] font-normal leading-[0.9] tracking-tight",
  headingClass: "text-3xl font-normal leading-tight md:text-5xl",
  imageClass: "saturate-[0.94] contrast-[1.02]",
  radiusClass: "rounded-full",
  accentHex: "#3f6b4f",
  inkHex: "#22321f",
} satisfies ArtInvitationConfig;

export function HoaThuXanhLaInvitation({ content }: { content: ChungDoiDemoContent }) {
  const t = useTranslations("invitationTemplate");
  const translate = (key: InvitationTranslationKey, values?: Record<string, string | number>) => t(key, values);
  return <ArtInvitation content={content} config={config} t={translate} />;
}

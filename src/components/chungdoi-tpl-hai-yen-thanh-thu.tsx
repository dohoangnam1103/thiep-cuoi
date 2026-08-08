"use client";

import { useTranslations } from "next-intl";
import type { ChungDoiDemoContent } from "@/data/chungdoi-demo-content";
import { ArtInvitation, type ArtInvitationConfig, type InvitationTranslationKey } from "@/components/chungdoi-tpl-art-invitation";

const config = {
  layout: "split",
  artwork: "/chungdoi/images/themes/_decor/hai-yen-thanh-thu/artwork.webp",
  pageClass: "bg-[#f4f3ef]",
  heroClass: "bg-[#f8f7f2]",
  surfaceClass: "bg-[#fdfbf7]",
  sectionClass: "border-t border-[#123a52]/16 pt-10",
  inkClass: "text-[#123a52]",
  mutedClass: "text-[#123a52]/60",
  accentTextClass: "text-[#2d8fbe]",
  accentBgClass: "bg-[#2d8fbe]",
  borderClass: "border-[#123a52]/18",
  buttonClass: "bg-[#2d8fbe] text-[#fdfbf7]",
  displayFontClass: "font-art-alex",
  coupleClass: "text-[clamp(3.6rem,12vw,7.4rem)] font-normal leading-[0.82] tracking-normal",
  headingClass: "text-4xl font-normal leading-none md:text-6xl",
  imageClass: "saturate-[0.96]",
  radiusClass: "rounded-[999px]",
  giftLayout: "flip",
  accentHex: "#2d8fbe",
  inkHex: "#123a52",
} satisfies ArtInvitationConfig;

export function HaiYenThanhThuInvitation({ content }: { content: ChungDoiDemoContent }) {
  const t = useTranslations("invitationTemplate");
  const translate = (key: InvitationTranslationKey, values?: Record<string, string | number>) => t(key, values);
  return <ArtInvitation content={content} config={config} t={translate} />;
}

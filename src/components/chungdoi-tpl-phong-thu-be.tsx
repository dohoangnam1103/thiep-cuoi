"use client";

import { useTranslations } from "next-intl";
import { ArtInvitation, type ArtInvitationConfig, type InvitationTranslationKey } from "@/components/chungdoi-tpl-art-invitation";
import type { ChungDoiDemoContent } from "@/data/chungdoi-demo-content";

const config = {
  layout: "quiet",
  artwork: "/chungdoi/images/themes/_decor/phong-thu-be/artwork.webp",
  pageClass: "bg-[#f2ebdd]",
  heroClass: "bg-[#f6f0e4]",
  surfaceClass: "bg-[#fdfaf4]",
  sectionClass: "border-t border-[#b08d5f]/32 pt-10",
  inkClass: "text-[#4a3a29]",
  mutedClass: "text-[#4a3a29]/60",
  accentTextClass: "text-[#b08d5f]",
  accentBgClass: "bg-[#b08d5f]",
  borderClass: "border-[#b08d5f]/40",
  buttonClass: "bg-[#b08d5f] text-[#fdfaf4]",
  displayFontClass: "font-art-nautigal",
  coupleClass: "text-[clamp(3.4rem,11vw,7rem)] font-normal leading-[0.88] tracking-normal",
  headingClass: "text-3xl font-normal leading-tight md:text-5xl",
  imageClass: "saturate-[0.94]",
  radiusClass: "rounded-full",
  accentHex: "#b08d5f",
  inkHex: "#4a3a29",
} satisfies ArtInvitationConfig;

export function PhongThuBeInvitation({ content }: { content: ChungDoiDemoContent }) {
  const t = useTranslations("invitationTemplate");
  const translate = (key: InvitationTranslationKey, values?: Record<string, string | number>) => t(key, values);
  return <ArtInvitation content={content} config={config} t={translate} />;
}

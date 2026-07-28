"use client";

import { useTranslations } from "next-intl";
import type { ChungDoiDemoContent } from "@/data/chungdoi-demo-content";
import { ArtInvitation, type ArtInvitationConfig, type InvitationTranslationKey } from "@/components/chungdoi-tpl-art-invitation";

const config = {
  layout: "folk",
  artwork: "/chungdoi/images/themes/_decor/dong-ho-folk/artwork.webp",
  pageClass: "bg-[#ead9b2]",
  heroClass: "bg-[#d9c18e]",
  surfaceClass: "bg-[#f1ddb0]",
  sectionClass: "border-t border-[#263221]/30 pt-10",
  inkClass: "text-[#263221]",
  mutedClass: "text-[#263221]/65",
  accentTextClass: "text-[#9d261e]",
  accentBgClass: "bg-[#9d261e]",
  borderClass: "border-[#263221]/30",
  buttonClass: "bg-[#9d261e] text-[#fff4dc]",
  displayFontClass: "font-art-uni",
  coupleClass: "text-[clamp(3rem,11vw,7rem)] font-normal uppercase leading-[0.82] tracking-[-0.035em]",
  headingClass: "text-3xl font-normal uppercase leading-tight md:text-5xl",
  imageClass: "saturate-[0.92]",
  radiusClass: "rounded-none",
  accentHex: "#9d261e",
  inkHex: "#263221",
} satisfies ArtInvitationConfig;

export function DongHoFolkInvitation({ content }: { content: ChungDoiDemoContent }) {
  const t = useTranslations("invitationTemplate");
  const translate = (key: InvitationTranslationKey, values?: Record<string, string | number>) => t(key, values);
  return <ArtInvitation content={content} config={config} t={translate} />;
}

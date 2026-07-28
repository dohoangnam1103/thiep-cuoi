"use client";

import { useTranslations } from "next-intl";
import type { ChungDoiDemoContent } from "@/data/chungdoi-demo-content";
import { ArtInvitation, type ArtInvitationConfig, type InvitationTranslationKey } from "@/components/chungdoi-tpl-art-invitation";

const config = {
  layout: "poster",
  artwork: "/chungdoi/images/themes/_decor/riso-duotone/artwork.webp",
  pageClass: "bg-[#deded7]",
  heroClass: "bg-[#deded7]",
  surfaceClass: "bg-[#e9e8df]/94",
  sectionClass: "border-t-2 border-[#0b6e73] pt-9",
  inkClass: "text-[#12383a]",
  mutedClass: "text-[#12383a]/62",
  accentTextClass: "text-[#f04f3d]",
  accentBgClass: "bg-[#f04f3d]",
  borderClass: "border-[#0b6e73]/45",
  buttonClass: "bg-[#f04f3d] text-[#f6f2e8]",
  displayFontClass: "font-art-marvin",
  coupleClass: "text-[clamp(3rem,10vw,6.7rem)] font-normal uppercase leading-[0.84] tracking-[-0.02em]",
  headingClass: "text-3xl font-normal uppercase leading-none tracking-[0.02em] md:text-5xl",
  imageClass: "contrast-[1.08] saturate-[0.95]",
  radiusClass: "rounded-none",
  accentHex: "#f04f3d",
  inkHex: "#12383a",
} satisfies ArtInvitationConfig;

export function RisoDuotoneInvitation({ content }: { content: ChungDoiDemoContent }) {
  const t = useTranslations("invitationTemplate");
  const translate = (key: InvitationTranslationKey, values?: Record<string, string | number>) => t(key, values);
  return <ArtInvitation content={content} config={config} t={translate} />;
}

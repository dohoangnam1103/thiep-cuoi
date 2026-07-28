"use client";

import { useTranslations } from "next-intl";
import type { ChungDoiDemoContent } from "@/data/chungdoi-demo-content";
import { ArtInvitation, type ArtInvitationConfig, type InvitationTranslationKey } from "@/components/chungdoi-tpl-art-invitation";

const config = {
  layout: "poster",
  artwork: "/chungdoi/images/themes/_decor/long-phung-deco/artwork.webp",
  pageClass: "bg-[#3e0208]",
  heroClass: "bg-[#420308]",
  surfaceClass: "bg-[#390106]/92",
  sectionClass: "border-t border-[#d4a83f]/35 pt-10",
  inkClass: "text-[#f6e5b6]",
  mutedClass: "text-[#f6e5b6]/64",
  accentTextClass: "text-[#d4a83f]",
  accentBgClass: "bg-[#d4a83f]",
  borderClass: "border-[#d4a83f]/40",
  buttonClass: "bg-[#d4a83f] text-[#390106]",
  displayFontClass: "font-art-aghita",
  coupleClass: "text-[clamp(3.6rem,11vw,7.2rem)] font-normal normal-case leading-[0.82] tracking-normal",
  headingClass: "text-4xl font-normal normal-case leading-tight md:text-6xl",
  imageClass: "contrast-[1.05]",
  radiusClass: "rounded-none",
  accentHex: "#d4a83f",
  inkHex: "#f6e5b6",
} satisfies ArtInvitationConfig;

export function LongPhungDecoInvitation({ content }: { content: ChungDoiDemoContent }) {
  const t = useTranslations("invitationTemplate");
  const translate = (key: InvitationTranslationKey, values?: Record<string, string | number>) => t(key, values);
  return <ArtInvitation content={content} config={config} t={translate} />;
}

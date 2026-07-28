"use client";

import { useTranslations } from "next-intl";
import type { ChungDoiDemoContent } from "@/data/chungdoi-demo-content";
import { ArtInvitation, type ArtInvitationConfig, type InvitationTranslationKey } from "@/components/chungdoi-tpl-art-invitation";

const config = {
  layout: "dark-stage",
  artwork: "/chungdoi/images/themes/_decor/cinema-credit/artwork.webp",
  pageClass: "bg-[#130f0d]",
  heroClass: "bg-[#130f0d]",
  surfaceClass: "bg-[#17110f]/88",
  sectionClass: "border-t border-[#d49b5b]/30 pt-10",
  inkClass: "text-[#eee4d9]",
  mutedClass: "text-[#eee4d9]/60",
  accentTextClass: "text-[#d49b5b]",
  accentBgClass: "bg-[#d49b5b]",
  borderClass: "border-[#d49b5b]/34",
  buttonClass: "bg-[#d49b5b] text-[#17110f]",
  displayFontClass: "font-art-lora",
  coupleClass: "text-[clamp(2.6rem,9vw,5.8rem)] font-normal uppercase leading-[0.9] tracking-[0.12em]",
  headingClass: "text-3xl font-normal uppercase leading-tight tracking-[0.1em] md:text-5xl",
  imageClass: "contrast-[1.08]",
  radiusClass: "rounded-[3px]",
  accentHex: "#d49b5b",
  inkHex: "#eee4d9",
} satisfies ArtInvitationConfig;

export function CinemaCreditInvitation({ content }: { content: ChungDoiDemoContent }) {
  const t = useTranslations("invitationTemplate");
  const translate = (key: InvitationTranslationKey, values?: Record<string, string | number>) => t(key, values);
  return <ArtInvitation content={content} config={config} t={translate} />;
}

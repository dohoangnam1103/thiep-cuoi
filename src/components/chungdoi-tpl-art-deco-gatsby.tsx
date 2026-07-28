"use client";

import { useTranslations } from "next-intl";
import type { ChungDoiDemoContent } from "@/data/chungdoi-demo-content";
import { ArtInvitation, type ArtInvitationConfig, type InvitationTranslationKey } from "@/components/chungdoi-tpl-art-invitation";

const config = {
  layout: "poster",
  artwork: "/chungdoi/images/themes/_decor/art-deco-gatsby/artwork.webp",
  pageClass: "bg-[#11110f]",
  heroClass: "bg-[#11110f]",
  surfaceClass: "bg-[#11110f]/92",
  sectionClass: "border-t border-[#d9b86c]/35 pt-10",
  inkClass: "text-[#f1e7d0]",
  mutedClass: "text-[#f1e7d0]/62",
  accentTextClass: "text-[#d9b86c]",
  accentBgClass: "bg-[#d9b86c]",
  borderClass: "border-[#d9b86c]/40",
  buttonClass: "bg-[#d9b86c] text-[#11110f]",
  displayFontClass: "font-art-built",
  coupleClass: "text-[clamp(2.8rem,10vw,6.8rem)] font-normal uppercase leading-[0.84] tracking-[0.04em]",
  headingClass: "text-3xl font-normal uppercase leading-none tracking-[0.06em] md:text-5xl",
  imageClass: "contrast-[1.04]",
  radiusClass: "rounded-none",
  accentHex: "#d9b86c",
  inkHex: "#f1e7d0",
} satisfies ArtInvitationConfig;

export function ArtDecoGatsbyInvitation({ content }: { content: ChungDoiDemoContent }) {
  const t = useTranslations("invitationTemplate");
  const translate = (key: InvitationTranslationKey, values?: Record<string, string | number>) => t(key, values);
  return <ArtInvitation content={content} config={config} t={translate} />;
}

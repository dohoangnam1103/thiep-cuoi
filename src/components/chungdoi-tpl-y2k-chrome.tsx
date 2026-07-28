"use client";

import { useTranslations } from "next-intl";
import type { ChungDoiDemoContent } from "@/data/chungdoi-demo-content";
import { ArtInvitation, type ArtInvitationConfig, type InvitationTranslationKey } from "@/components/chungdoi-tpl-art-invitation";

const config = {
  layout: "chrome",
  artwork: "/chungdoi/images/themes/_decor/y2k-chrome/artwork.webp",
  pageClass: "bg-[#cfd0d6]",
  heroClass: "bg-[#bfc2ca]",
  surfaceClass: "bg-[#e3e4e9]",
  sectionClass: "border-t-2 border-[#23252b] pt-9",
  inkClass: "text-[#23252b]",
  mutedClass: "text-[#23252b]/58",
  accentTextClass: "text-[#006e9c]",
  accentBgClass: "bg-[#006e9c]",
  borderClass: "border-[#23252b]/28",
  buttonClass: "bg-[#23252b] text-[#f3f4f6]",
  displayFontClass: "font-art-marvin",
  coupleClass: "text-[clamp(3rem,11vw,7.5rem)] font-normal uppercase leading-[0.82] tracking-[0.04em]",
  headingClass: "text-4xl font-normal uppercase leading-[0.9] tracking-[0.05em] md:text-6xl",
  imageClass: "contrast-[1.08] saturate-[1.08]",
  radiusClass: "rounded-[999px]",
  accentHex: "#006e9c",
  inkHex: "#23252b",
} satisfies ArtInvitationConfig;

export function Y2kChromeInvitation({ content }: { content: ChungDoiDemoContent }) {
  const t = useTranslations("invitationTemplate");
  const translate = (key: InvitationTranslationKey, values?: Record<string, string | number>) => t(key, values);
  return <ArtInvitation content={content} config={config} t={translate} />;
}

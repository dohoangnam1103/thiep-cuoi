"use client";

import { useTranslations } from "next-intl";
import type { ChungDoiDemoContent } from "@/data/chungdoi-demo-content";
import { ArtInvitation, type ArtInvitationConfig, type InvitationTranslationKey } from "@/components/chungdoi-tpl-art-invitation";

const config = {
  layout: "quiet",
  artwork: "/chungdoi/images/themes/_decor/sen-monoline/artwork.webp",
  pageClass: "bg-[#ebece7]",
  heroClass: "bg-[#f3f1ea]",
  surfaceClass: "bg-[#f4f3ed]",
  sectionClass: "border-t border-[#28342e]/20 pt-10",
  inkClass: "text-[#28342e]",
  mutedClass: "text-[#28342e]/58",
  accentTextClass: "text-[#a13d2d]",
  accentBgClass: "bg-[#a13d2d]",
  borderClass: "border-[#28342e]/20",
  buttonClass: "bg-[#a13d2d] text-[#f4f3ed]",
  displayFontClass: "font-art-signora",
  coupleClass: "text-[clamp(3.3rem,11vw,7rem)] font-normal leading-[0.88] tracking-normal",
  headingClass: "text-4xl font-normal leading-tight md:text-6xl",
  imageClass: "opacity-90",
  radiusClass: "rounded-none",
  accentHex: "#a13d2d",
  inkHex: "#28342e",
} satisfies ArtInvitationConfig;

export function SenMonolineInvitation({ content }: { content: ChungDoiDemoContent }) {
  const t = useTranslations("invitationTemplate");
  const translate = (key: InvitationTranslationKey, values?: Record<string, string | number>) => t(key, values);
  return <ArtInvitation content={content} config={config} t={translate} />;
}

"use client";

import { useTranslations } from "next-intl";
import type { ChungDoiDemoContent } from "@/data/chungdoi-demo-content";
import { ArtInvitation, type ArtInvitationConfig, type InvitationTranslationKey } from "@/components/chungdoi-tpl-art-invitation";

const config = {
  layout: "split",
  artwork: "/chungdoi/images/themes/_decor/tho-cam-highland/artwork.webp",
  pageClass: "bg-[#071b2b]",
  heroClass: "bg-[#071b2b]",
  surfaceClass: "bg-[#0d2940]",
  sectionClass: "border-t border-[#f0c56b]/30 pt-10",
  inkClass: "text-[#f7ead1]",
  mutedClass: "text-[#f7ead1]/65",
  accentTextClass: "text-[#f0c56b]",
  accentBgClass: "bg-[#f0c56b]",
  borderClass: "border-[#f0c56b]/30",
  buttonClass: "bg-[#f0c56b] text-[#0d2940]",
  displayFontClass: "font-art-haydon",
  coupleClass: "text-[clamp(3.4rem,10vw,6.4rem)] font-normal normal-case leading-[0.88] tracking-normal",
  headingClass: "text-4xl font-normal normal-case leading-tight md:text-6xl",
  imageClass: "contrast-[1.04]",
  radiusClass: "rounded-none",
  accentHex: "#f0c56b",
  inkHex: "#f7ead1",
} satisfies ArtInvitationConfig;

export function ThoCamHighlandInvitation({ content }: { content: ChungDoiDemoContent }) {
  const t = useTranslations("invitationTemplate");
  const translate = (key: InvitationTranslationKey, values?: Record<string, string | number>) => t(key, values);
  return <ArtInvitation content={content} config={config} t={translate} />;
}

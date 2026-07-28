"use client";

import { useTranslations } from "next-intl";
import type { ChungDoiDemoContent } from "@/data/chungdoi-demo-content";
import { ArtInvitation, type ArtInvitationConfig, type InvitationTranslationKey } from "@/components/chungdoi-tpl-art-invitation";

const config = {
  layout: "quiet",
  artwork: "/chungdoi/images/themes/_decor/botanical-lavender/artwork.webp",
  pageClass: "bg-[#e5e0ee]",
  heroClass: "bg-[#ece9f2]",
  surfaceClass: "bg-[#f0edf4]",
  sectionClass: "border-t border-[#57405e]/22 pt-10",
  inkClass: "text-[#49334f]",
  mutedClass: "text-[#49334f]/58",
  accentTextClass: "text-[#a67c18]",
  accentBgClass: "bg-[#a67c18]",
  borderClass: "border-[#57405e]/24",
  buttonClass: "bg-[#57405e] text-[#f4eff7]",
  displayFontClass: "font-art-signora",
  coupleClass: "text-[clamp(3.5rem,11vw,7.2rem)] font-normal leading-[0.86] tracking-normal",
  headingClass: "text-4xl font-normal leading-tight md:text-6xl",
  imageClass: "saturate-[0.9]",
  radiusClass: "rounded-[1.5rem]",
  accentHex: "#a67c18",
  inkHex: "#49334f",
} satisfies ArtInvitationConfig;

export function BotanicalLavenderInvitation({ content }: { content: ChungDoiDemoContent }) {
  const t = useTranslations("invitationTemplate");
  const translate = (key: InvitationTranslationKey, values?: Record<string, string | number>) => t(key, values);
  return <ArtInvitation content={content} config={config} t={translate} />;
}

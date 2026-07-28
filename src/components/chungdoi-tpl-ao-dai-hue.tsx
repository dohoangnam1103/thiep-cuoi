"use client";

import { useTranslations } from "next-intl";
import type { ChungDoiDemoContent } from "@/data/chungdoi-demo-content";
import { ArtInvitation, type ArtInvitationConfig, type InvitationTranslationKey } from "@/components/chungdoi-tpl-art-invitation";

const config = {
  layout: "split",
  artwork: "/chungdoi/images/themes/_decor/ao-dai-hue/artwork.webp",
  pageClass: "bg-[#2e1730]",
  heroClass: "bg-[#2e1730]",
  surfaceClass: "bg-[#3b1c3d]",
  sectionClass: "border-t border-[#d9ad73]/30 pt-10",
  inkClass: "text-[#fae6cf]",
  mutedClass: "text-[#fae6cf]/64",
  accentTextClass: "text-[#d9ad73]",
  accentBgClass: "bg-[#d9ad73]",
  borderClass: "border-[#d9ad73]/32",
  buttonClass: "bg-[#d9ad73] text-[#2e1730]",
  displayFontClass: "font-art-nautigal",
  coupleClass: "text-[clamp(4rem,13vw,8rem)] font-normal leading-[0.78] tracking-normal",
  headingClass: "text-4xl font-normal leading-none md:text-6xl",
  imageClass: "saturate-[0.9]",
  radiusClass: "rounded-[1.5rem]",
  accentHex: "#d9ad73",
  inkHex: "#fae6cf",
} satisfies ArtInvitationConfig;

export function AoDaiHueInvitation({ content }: { content: ChungDoiDemoContent }) {
  const t = useTranslations("invitationTemplate");
  const translate = (key: InvitationTranslationKey, values?: Record<string, string | number>) => t(key, values);
  return <ArtInvitation content={content} config={config} t={translate} />;
}

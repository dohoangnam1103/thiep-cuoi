"use client";

import { useTranslations } from "next-intl";
import { ArtInvitation, type ArtInvitationConfig, type InvitationTranslationKey } from "@/components/chungdoi-tpl-art-invitation";
import type { ChungDoiDemoContent } from "@/data/chungdoi-demo-content";

const config = {
  layout: "split",
  artwork: "/chungdoi/images/themes/_decor/ivory-signature/artwork.webp",
  pageClass: "bg-[#f4f0e8]",
  heroClass: "bg-[#f4f0e8]",
  surfaceClass: "bg-[#fbf8f0]",
  sectionClass: "border-t border-[#b6a074]/35 pt-10",
  inkClass: "text-[#172437]",
  mutedClass: "text-[#172437]/60",
  accentTextClass: "text-[#66705a]",
  accentBgClass: "bg-[#66705a]",
  borderClass: "border-[#b6a074]/45",
  buttonClass: "bg-[#66705a] text-[#fbf8f0]",
  displayFontClass: "font-art-signora",
  coupleClass: "text-[clamp(3.6rem,11vw,7.4rem)] font-normal leading-[0.86] tracking-normal",
  headingClass: "text-3xl font-normal leading-tight md:text-5xl",
  imageClass: "saturate-[0.88] contrast-[1.02]",
  radiusClass: "rounded-full",
  accentHex: "#66705a",
  inkHex: "#172437",
} satisfies ArtInvitationConfig;

export function IvorySignatureInvitation({ content }: { content: ChungDoiDemoContent }) {
  const t = useTranslations("invitationTemplate");
  const translate = (key: InvitationTranslationKey, values?: Record<string, string | number>) => t(key, values);
  return <ArtInvitation content={content} config={config} t={translate} />;
}

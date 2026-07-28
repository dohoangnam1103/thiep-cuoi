"use client";

import { useTranslations } from "next-intl";
import type { ChungDoiDemoContent } from "@/data/chungdoi-demo-content";
import { ArtInvitation, type ArtInvitationConfig, type InvitationTranslationKey } from "@/components/chungdoi-tpl-art-invitation";

const config = {
  layout: "dark-stage",
  artwork: "/chungdoi/images/themes/_decor/celestial-map/artwork.webp",
  pageClass: "bg-[#07192c]",
  heroClass: "bg-[#07192c]",
  surfaceClass: "bg-[#07192c]/86",
  sectionClass: "border-t border-[#bdc8d8]/28 pt-10",
  inkClass: "text-[#ecf0f5]",
  mutedClass: "text-[#ecf0f5]/62",
  accentTextClass: "text-[#d2b28c]",
  accentBgClass: "bg-[#d2b28c]",
  borderClass: "border-[#bdc8d8]/30",
  buttonClass: "bg-[#d2b28c] text-[#07192c]",
  displayFontClass: "font-art-alex",
  coupleClass: "text-[clamp(4rem,13vw,8rem)] font-normal leading-[0.78] tracking-normal",
  headingClass: "text-4xl font-normal leading-none md:text-6xl",
  imageClass: "contrast-[1.05]",
  radiusClass: "rounded-[999px]",
  accentHex: "#d2b28c",
  inkHex: "#ecf0f5",
} satisfies ArtInvitationConfig;

export function CelestialMapInvitation({ content }: { content: ChungDoiDemoContent }) {
  const t = useTranslations("invitationTemplate");
  const translate = (key: InvitationTranslationKey, values?: Record<string, string | number>) => t(key, values);
  return <ArtInvitation content={content} config={config} t={translate} />;
}

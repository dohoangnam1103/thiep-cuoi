"use client";

import { useTranslations } from "next-intl";
import { ArtInvitation, type ArtInvitationConfig, type InvitationTranslationKey } from "@/components/chungdoi-tpl-art-invitation";
import type { ChungDoiDemoContent } from "@/data/chungdoi-demo-content";

const config = {
  layout: "split",
  artwork: "/chungdoi/images/themes/_decor/hoa-thu-hong/artwork.webp",
  pageClass: "bg-[#f6e5ea]",
  heroClass: "bg-[#faeef2]",
  surfaceClass: "bg-[#fdf8fa]",
  sectionClass: "border-t border-[#b8607a]/24 pt-10",
  inkClass: "text-[#452431]",
  mutedClass: "text-[#452431]/60",
  accentTextClass: "text-[#b8607a]",
  accentBgClass: "bg-[#b8607a]",
  borderClass: "border-[#b8607a]/30",
  buttonClass: "bg-[#b8607a] text-[#fdf8fa]",
  displayFontClass: "font-art-qellia",
  coupleClass: "text-[clamp(3.2rem,10vw,6.2rem)] font-normal leading-[0.9] tracking-tight",
  headingClass: "text-3xl font-normal leading-tight md:text-5xl",
  imageClass: "saturate-[0.98] contrast-[1.02]",
  radiusClass: "rounded-full",
  accentHex: "#b8607a",
  inkHex: "#452431",
} satisfies ArtInvitationConfig;

export function HoaThuHongInvitation({ content }: { content: ChungDoiDemoContent }) {
  const t = useTranslations("invitationTemplate");
  const translate = (key: InvitationTranslationKey, values?: Record<string, string | number>) => t(key, values);
  return <ArtInvitation content={content} config={config} t={translate} />;
}

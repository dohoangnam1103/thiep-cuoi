"use client";

import { useTranslations } from "next-intl";
import { ArtInvitation, type ArtInvitationConfig, type InvitationTranslationKey } from "@/components/chungdoi-tpl-art-invitation";
import type { ChungDoiDemoContent } from "@/data/chungdoi-demo-content";

const config = {
  layout: "quiet",
  artwork: "/chungdoi/images/themes/_decor/phong-thu-hong-pastel/artwork.webp",
  pageClass: "bg-[#f7e8ee]",
  heroClass: "bg-[#faeff3]",
  surfaceClass: "bg-[#fdf8fa]",
  sectionClass: "border-t border-[#4a2b36]/16 pt-10",
  inkClass: "text-[#4a2b36]",
  mutedClass: "text-[#4a2b36]/60",
  accentTextClass: "text-[#b8748c]",
  accentBgClass: "bg-[#b8748c]",
  borderClass: "border-[#4a2b36]/18",
  buttonClass: "bg-[#b8748c] text-[#fdf8fa]",
  displayFontClass: "font-art-aghita",
  coupleClass: "text-[clamp(3.4rem,10vw,6.6rem)] font-normal leading-[0.88] tracking-normal",
  headingClass: "text-3xl font-normal leading-tight md:text-5xl",
  imageClass: "saturate-[0.98]",
  radiusClass: "rounded-full",
  accentHex: "#b8748c",
  inkHex: "#4a2b36",
} satisfies ArtInvitationConfig;

export function PhongThuHongPastelInvitation({ content }: { content: ChungDoiDemoContent }) {
  const t = useTranslations("invitationTemplate");
  const translate = (key: InvitationTranslationKey, values?: Record<string, string | number>) => t(key, values);
  return <ArtInvitation content={content} config={config} t={translate} />;
}

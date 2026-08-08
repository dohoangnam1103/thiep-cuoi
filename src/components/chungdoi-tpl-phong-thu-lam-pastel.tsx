"use client";

import { useTranslations } from "next-intl";
import { ArtInvitation, type ArtInvitationConfig, type InvitationTranslationKey } from "@/components/chungdoi-tpl-art-invitation";
import type { ChungDoiDemoContent } from "@/data/chungdoi-demo-content";

const config = {
  layout: "quiet",
  artwork: "/chungdoi/images/themes/_decor/phong-thu-lam-pastel/artwork.webp",
  pageClass: "bg-[#e7eef6]",
  heroClass: "bg-[#eff4fa]",
  surfaceClass: "bg-[#f9fbfd]",
  sectionClass: "border-t border-[#27364a]/16 pt-10",
  inkClass: "text-[#27364a]",
  mutedClass: "text-[#27364a]/60",
  accentTextClass: "text-[#6382a6]",
  accentBgClass: "bg-[#6382a6]",
  borderClass: "border-[#27364a]/18",
  buttonClass: "bg-[#6382a6] text-[#f9fbfd]",
  displayFontClass: "font-art-alex",
  coupleClass: "text-[clamp(3.6rem,11vw,7rem)] font-normal leading-[0.86] tracking-normal",
  headingClass: "text-3xl font-normal leading-tight md:text-5xl",
  imageClass: "saturate-[0.94]",
  radiusClass: "rounded-full",
  accentHex: "#6382a6",
  inkHex: "#27364a",
} satisfies ArtInvitationConfig;

export function PhongThuLamPastelInvitation({ content }: { content: ChungDoiDemoContent }) {
  const t = useTranslations("invitationTemplate");
  const translate = (key: InvitationTranslationKey, values?: Record<string, string | number>) => t(key, values);
  return <ArtInvitation content={content} config={config} t={translate} />;
}

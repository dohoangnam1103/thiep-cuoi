"use client";

import { useTranslations } from "next-intl";
import type { ChungDoiDemoContent } from "@/data/chungdoi-demo-content";
import { ArtInvitation, type ArtInvitationConfig, type InvitationTranslationKey } from "@/components/chungdoi-tpl-art-invitation";

const config = {
  layout: "split",
  artwork: "/chungdoi/images/themes/_decor/coastal-mediterranean/artwork.webp",
  pageClass: "bg-[#f0eee6]",
  heroClass: "bg-[#f0eee6]",
  surfaceClass: "bg-[#faf8f1]",
  sectionClass: "border-t border-[#174da1]/24 pt-10",
  inkClass: "text-[#173a5c]",
  mutedClass: "text-[#173a5c]/60",
  accentTextClass: "text-[#174da1]",
  accentBgClass: "bg-[#174da1]",
  borderClass: "border-[#174da1]/25",
  buttonClass: "bg-[#174da1] text-[#faf8f1]",
  displayFontClass: "font-art-pacifico",
  coupleClass: "text-[clamp(3.2rem,10vw,6.5rem)] font-normal normal-case leading-[0.88] tracking-normal",
  headingClass: "text-3xl font-normal normal-case leading-tight md:text-5xl",
  imageClass: "saturate-[1.04]",
  radiusClass: "rounded-[2rem]",
  accentHex: "#174da1",
  inkHex: "#173a5c",
} satisfies ArtInvitationConfig;

export function CoastalMediterraneanInvitation({ content }: { content: ChungDoiDemoContent }) {
  const t = useTranslations("invitationTemplate");
  const translate = (key: InvitationTranslationKey, values?: Record<string, string | number>) => t(key, values);
  return <ArtInvitation content={content} config={config} t={translate} />;
}

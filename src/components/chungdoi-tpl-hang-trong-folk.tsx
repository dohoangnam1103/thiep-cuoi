"use client";

import { useTranslations } from "next-intl";
import type { ChungDoiDemoContent } from "@/data/chungdoi-demo-content";
import { ArtInvitation, type ArtInvitationConfig, type InvitationTranslationKey } from "@/components/chungdoi-tpl-art-invitation";

const config = {
  layout: "folk",
  artwork: "/chungdoi/images/themes/_decor/hang-trong-folk/artwork.webp",
  pageClass: "bg-[#f2e5cf]",
  heroClass: "bg-[#ead8bd]",
  surfaceClass: "bg-[#f7ecd9]",
  sectionClass: "border-t border-[#9d275d]/25 pt-10",
  inkClass: "text-[#173a42]",
  mutedClass: "text-[#173a42]/62",
  accentTextClass: "text-[#9d275d]",
  accentBgClass: "bg-[#9d275d]",
  borderClass: "border-[#9d275d]/28",
  buttonClass: "bg-[#9d275d] text-[#fff5e4]",
  displayFontClass: "font-art-pattaya",
  coupleClass: "text-[clamp(3rem,10vw,6.8rem)] font-normal leading-[0.9] tracking-normal",
  headingClass: "text-3xl font-normal leading-tight md:text-5xl",
  imageClass: "saturate-[0.92]",
  radiusClass: "rounded-[1.25rem]",
  accentHex: "#9d275d",
  inkHex: "#173a42",
} satisfies ArtInvitationConfig;

export function HangTrongFolkInvitation({ content }: { content: ChungDoiDemoContent }) {
  const t = useTranslations("invitationTemplate");
  const translate = (key: InvitationTranslationKey, values?: Record<string, string | number>) => t(key, values);
  return <ArtInvitation content={content} config={config} t={translate} />;
}

"use client";

import { useTranslations } from "next-intl";
import type { ChungDoiDemoContent } from "@/data/chungdoi-demo-content";
import {
  ArtInvitation,
  type ArtInvitationConfig,
  type InvitationTranslationKey,
} from "@/components/chungdoi-tpl-art-invitation";

const config = {
  layout: "quiet",
  artwork: "/chungdoi/images/themes/_decor/nguyet-bach/artwork.webp",
  pageClass: "bg-[#e9e4dc]",
  heroClass: "bg-[#f1ebe2]",
  surfaceClass: "bg-[#f6f1e8]",
  sectionClass: "border-t border-[#292724]/12 pt-12",
  inkClass: "text-[#292724]",
  mutedClass: "text-[#292724]/66",
  accentTextClass: "text-[#a2864f]",
  accentBgClass: "bg-[#b89b67]",
  borderClass: "border-[#292724]/14",
  buttonClass: "bg-[#292724] text-[#f6f1e8]",
  displayFontClass: "font-art-lora",
  coupleClass: "text-[clamp(2.9rem,9vw,5.6rem)] font-normal leading-[1] tracking-[0.02em]",
  headingClass: "text-2xl font-normal leading-tight tracking-[0.04em] md:text-4xl",
  imageClass: "brightness-[1.01]",
  radiusClass: "rounded-[1.25rem]",
  accentHex: "#b89b67",
  inkHex: "#292724",
} satisfies ArtInvitationConfig;

export function NguyetBachInvitation({ content }: { content: ChungDoiDemoContent }) {
  const t = useTranslations("invitationTemplate");
  const translate = (key: InvitationTranslationKey, values?: Record<string, string | number>) =>
    t(key, values);
  return <ArtInvitation content={content} config={config} t={translate} />;
}

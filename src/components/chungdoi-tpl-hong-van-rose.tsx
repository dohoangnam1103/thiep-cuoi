"use client";

import { useTranslations } from "next-intl";
import { ArtInvitation, type ArtInvitationConfig, type InvitationTranslationKey } from "@/components/chungdoi-tpl-art-invitation";
import styles from "./chungdoi-hong-van-detail.module.css";
import type { ChungDoiDemoContent } from "@/data/chungdoi-demo-content";

const config = {
  layout: "split",
  artwork: "/chungdoi/images/themes/_decor/brocade-flower-red/hoa-hong.webp",
  detailArtwork: "/chungdoi/images/themes/hong-van-rose/rose-bouquet.webp",
  parallaxArtwork: false,
  heroArtwork: false,
  heroHeightClass: "min-h-[clamp(560px,78svh,760px)]",
  portraitClass: "aspect-[3/4] w-[52%] max-w-[360px] sm:w-[56%]",
  portraitFrameArtwork: "/chungdoi/images/themes/hong-van-rose/portrait-rose-frame-v4.webp",
  coupleRules: false,
  portraitBorder: false,
  pageClass: styles.page,
  columnClass: styles.column,
  sectionArtwork: "/chungdoi/images/themes/hong-van-rose/rose-bouquet-round.webp",
  sectionArtworkBouquet: true,
  sectionArtworkVariants: [
    "/chungdoi/images/themes/hong-van-rose/rose-bouquet-cascade.webp",
    "/chungdoi/images/themes/hong-van-rose/rose-bouquet.webp",
  ],
  formSubmitTextColor: "#5b1019",
  heroClass: "bg-transparent",
  surfaceClass: styles.surface,
  sectionClass: "pt-10",
  inkClass: "text-[#fff4df]",
  mutedClass: "text-[#eed3bd]",
  accentTextClass: "text-[#edc77e]",
  accentBgClass: "bg-[#edc77e]",
  borderClass: "border-[#edc77e]/30",
  buttonClass: "border border-[#edc77e]/60 bg-[#a82432] text-[#fff7eb]",
  displayFontClass: "font-art-qellia",
  coupleClass: "text-[clamp(3rem,10vw,6rem)] font-normal leading-[0.92] tracking-tight",
  headingClass: "text-3xl font-normal leading-tight md:text-5xl",
  imageClass: "saturate-[1.08] contrast-[1.04]",
  radiusClass: "rounded-full",
  accentHex: "#edc77e",
  inkHex: "#fff4df",
  giftLayout: "flip",
  giftFrontArtwork: "/chungdoi/images/envelope/crystal_floral_red.webp",
} satisfies ArtInvitationConfig;

export function HongVanRoseInvitation({ content }: { content: ChungDoiDemoContent }) {
  const t = useTranslations("invitationTemplate");
  const translate = (key: InvitationTranslationKey, values?: Record<string, string | number>) => t(key, values);
  return <ArtInvitation content={content} config={config} t={translate} />;
}

"use client";

import { useTranslations } from "next-intl";
import type { ChungDoiDemoContent } from "@/data/chungdoi-demo-content";
import { ArtInvitation, type ArtInvitationConfig, type InvitationTranslationKey } from "@/components/chungdoi-tpl-art-invitation";

const config = {
  layout: "folk",
  artwork: "/chungdoi/images/themes/_decor/bat-trang-blue/artwork.webp",
  pageClass: "bg-[#f0eee7]",
  heroClass: "bg-[#e8e4da]",
  surfaceClass: "bg-[#f7f5ef]",
  sectionClass: "border-t border-[#164a8a]/25 pt-10",
  inkClass: "text-[#123d73]",
  mutedClass: "text-[#123d73]/62",
  accentTextClass: "text-[#164a8a]",
  accentBgClass: "bg-[#164a8a]",
  borderClass: "border-[#164a8a]/25",
  buttonClass: "bg-[#164a8a] text-[#f7f5ef]",
  displayFontClass: "font-art-qellia",
  coupleClass: "text-[clamp(3rem,10vw,6.8rem)] font-normal leading-[0.9] tracking-[-0.02em]",
  headingClass: "text-3xl font-normal leading-tight md:text-5xl",
  imageClass: "contrast-[1.02]",
  radiusClass: "rounded-[999px]",
  accentHex: "#164a8a",
  inkHex: "#123d73",
} satisfies ArtInvitationConfig;

export function BatTrangBlueInvitation({ content }: { content: ChungDoiDemoContent }) {
  const t = useTranslations("invitationTemplate");
  const translate = (key: InvitationTranslationKey, values?: Record<string, string | number>) => t(key, values);
  return <ArtInvitation content={content} config={config} t={translate} />;
}

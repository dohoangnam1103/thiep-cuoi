"use client";

import { useTranslations } from "next-intl";
import type { ChungDoiDemoContent } from "@/data/chungdoi-demo-content";
import {
  ArtInvitation,
  type ArtInvitationConfig,
  type InvitationTranslationKey,
} from "@/components/chungdoi-tpl-art-invitation";

const config = {
  layout: "folk",
  giftLayout: "flip",
  artwork: "/chungdoi/images/themes/_decor/cong-la-dua-mien-tay/artwork.webp",
  pageClass: "bg-[#eef4e8]",
  heroClass: "bg-[#eef4e8]",
  surfaceClass: "bg-white/94",
  sectionClass: "border-t border-[#b6c9ac] pt-8",
  inkClass: "text-[#26402b]",
  mutedClass: "text-[#26402b]/62",
  accentTextClass: "text-[#d98f3d]",
  accentBgClass: "bg-[#d98f3d]",
  borderClass: "border-[#b6c9ac]",
  buttonClass: "bg-[#d98f3d] text-white",
  displayFontClass: "font-art-signora",
  coupleClass: "text-[clamp(2.75rem,10vw,5.5rem)] leading-[0.92] tracking-[0.01em]",
  headingClass: "text-3xl leading-[1.1] tracking-[0.02em] md:text-5xl",
  imageClass: "saturate-[1.04]",
  radiusClass: "rounded-[1.5rem]",
  accentHex: "#d98f3d",
  inkHex: "#26402b",
} satisfies ArtInvitationConfig;

export function CongLaDuaMienTayInvitation({ content }: { content: ChungDoiDemoContent }) {
  const t = useTranslations("invitationTemplate");
  const translate = (key: InvitationTranslationKey, values?: Record<string, string | number>) =>
    t(key, values);
  return <ArtInvitation content={content} config={config} t={translate} />;
}

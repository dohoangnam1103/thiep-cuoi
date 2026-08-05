"use client";

import type { ChungDoiDemoContent } from "@/data/chungdoi-demo-content";
import { PhoenixInvitation } from "@/components/chungdoi-tpl-phoenix";
import { resolveZodiacInvitationArtwork } from "@/lib/zodiac-invitation-artwork";
import { DEFAULT_ZODIAC_ART_COLOR } from "@/lib/zodiac";

const INVITATION_RED = "#710001";

export function ThapNhiChiInvitation({ content }: { content: ChungDoiDemoContent }) {
  const artwork = resolveZodiacInvitationArtwork(content.couple);
  return (
    <PhoenixInvitation
      content={content}
      artwork={artwork}
      artworkColor={content.theme.primaryColor || DEFAULT_ZODIAC_ART_COLOR}
      invitationColor={INVITATION_RED}
    />
  );
}

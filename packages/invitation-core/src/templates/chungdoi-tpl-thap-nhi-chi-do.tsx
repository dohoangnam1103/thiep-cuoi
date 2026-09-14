"use client";

import type { ChungDoiDemoContent } from "../signature/types";
import { PhoenixInvitation } from "./chungdoi-tpl-phoenix";
import { resolveZodiacInvitationArtwork } from "../support/zodiac-invitation-artwork";
import { DEFAULT_ZODIAC_ART_COLOR } from "../support/zodiac";

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

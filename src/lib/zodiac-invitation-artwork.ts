import { orderByBrideFirst } from "@/lib/invitation-display";
import {
  isZodiacId,
  zodiacArtworkPath,
  type ZodiacArtworkId,
} from "@/lib/zodiac";

export type ZodiacInvitationArtwork = {
  heroLeft: string;
  heroRight: string;
  parallaxLeft: string;
  parallaxRight: string;
};

type ZodiacCoupleArtwork = {
  brideZodiac?: string;
  groomZodiac?: string;
  brideFirst: boolean;
};

export function resolveZodiacInvitationArtwork(
  couple: ZodiacCoupleArtwork,
): ZodiacInvitationArtwork {
  const bride: ZodiacArtworkId = isZodiacId(couple.brideZodiac)
    ? couple.brideZodiac
    : "phuong";
  const groom: ZodiacArtworkId = isZodiacId(couple.groomZodiac)
    ? couple.groomZodiac
    : "rong";
  const [first, second] = orderByBrideFirst(bride, groom, couple.brideFirst);

  return {
    heroLeft: zodiacArtworkPath(first),
    heroRight: zodiacArtworkPath(second),
    parallaxLeft: zodiacArtworkPath(second, "line"),
    parallaxRight: zodiacArtworkPath(first, "line"),
  };
}

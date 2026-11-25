import { isGoogleMapsShortUrl, isGoogleMapsUrl, mapLocationQuery } from "@/lib/google-maps";
import { capitalizeVietnameseSentences } from "@/lib/text-case";

export const MAX_VENUE_ADDRESS_LENGTH = 200;

export function normalizeVenueAddress(value: string): string {
  return isGoogleMapsUrl(value) ? value.trim() : capitalizeVietnameseSentences(value);
}

/** Shared renderers keep their existing combined venue text, including legacy invitations. */
export function venueDisplayAddress(name: string | null | undefined, address: string | null | undefined): string {
  return [name?.trim(), address?.trim()].filter(Boolean).join("\n");
}

/** A pin override is optional; the street address is the default map query. */
export function venueMapQuery(name: string | null | undefined, address: string | null | undefined, mapOverride?: string | null): string {
  const override = mapOverride?.trim() ?? "";
  if (override && !isGoogleMapsShortUrl(override) && (!/^https?:\/\//i.test(override) || isGoogleMapsUrl(override))) return override;
  return mapLocationQuery(address) || name?.trim() || "";
}

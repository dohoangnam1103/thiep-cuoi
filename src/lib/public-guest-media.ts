export type PublicGuestMedia = {
  id: string;
  contributorName: string;
  originalName: string;
  mimeType: string;
  kind: "image" | "video";
  size: number;
  createdAt: string;
  url: string;
};

export type GuestMediaApiPayload = {
  media?: PublicGuestMedia[];
  error?: string;
};

export function guestMediaPreview<T>(media: readonly T[], limit = 4) {
  const items = media.slice(0, limit);
  return {
    items,
    extraCount: Math.max(0, media.length - items.length),
  };
}

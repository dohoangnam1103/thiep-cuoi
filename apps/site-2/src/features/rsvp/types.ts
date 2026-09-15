export type RsvpListItem = {
  id: string;
  guestName: string;
  attending: boolean;
  partySize: number;
  message: string | null;
  createdAt: Date;
};

export type RsvpSummary = {
  attendingGuests: number;
  declinedGuests: number;
  pendingGuests: number;
  responses: readonly RsvpListItem[];
};

export type RsvpAnswerInput = {
  questionId: string;
  value: string;
};

export type PublicRsvpInput = {
  slug: string;
  token?: string;
  name: string;
  attending: boolean;
  partySize: number;
  side?: string;
  message?: string;
  shuttle?: boolean;
  dietary?: string;
  songRequest?: string;
  answers?: RsvpAnswerInput[];
};

export type PublicWishInput = {
  slug: string;
  name: string;
  text: string;
};

export type GuestPrefill = {
  token: string;
  name: string;
  side: string | null;
  role: string | null;
  greeting: string | null;
  maxGuests: number;
} | null;

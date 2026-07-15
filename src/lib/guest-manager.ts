export type GuestImportRow = {
  name: string;
  side: string;
  role: string;
  groupName: string;
  tableName: string;
  phone: string;
  email: string;
  greeting: string;
  maxGuests: number;
  giftAmount: number | null;
  note: string;
};

export type GuestRsvpSummary = {
  attending: boolean;
  guests: number;
  createdAt: string;
} | null;

export type GuestRow = GuestImportRow & {
  id: string;
  token: string;
  responded: boolean;
  latestRsvp: GuestRsvpSummary;
};

export type RsvpQuestionRow = {
  id: string;
  label: string;
  type: "text" | "boolean" | "select";
  required: boolean;
  options: string[];
  sortOrder: number;
};

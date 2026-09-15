export type GuestAttendance = "unknown" | "attending" | "declined";

export type GuestListItem = {
  id: string;
  name: string;
  group: string | null;
  phone: string | null;
  attendance: GuestAttendance;
  personalUrl: string;
};

export type GuestInput = {
  name: string;
  group?: string;
  phone?: string;
};

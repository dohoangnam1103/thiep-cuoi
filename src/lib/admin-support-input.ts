import { completedTemplateSlugs } from "@/data/chungdoi";

export const SYSTEM_EMAIL = "system@demo.local";

export function parseUserSearch(value: string | undefined): string {
  return value?.trim().toLowerCase().slice(0, 120) ?? "";
}

export function isAllowedCustomerEmail(email: string | null): boolean {
  return email !== SYSTEM_EMAIL;
}

export function parseAdminTemplateId(value: FormDataEntryValue | null): string | null {
  if (typeof value !== "string" || !completedTemplateSlugs.has(value)) return null;
  return value;
}

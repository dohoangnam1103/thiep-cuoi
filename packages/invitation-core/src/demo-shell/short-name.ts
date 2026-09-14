export function shortNameFromFullName(fullName: string): string {
  return fullName.trim().split(/\s+/).filter(Boolean).slice(-2).join(" ");
}

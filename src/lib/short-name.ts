export function shortNameFromFullName(fullName: string): string {
  return fullName.trim().split(/\s+/).filter(Boolean).slice(-2).join(" ");
}

/** Explicit short names may contain more than two words and must stay intact. */
export function displayShortName(fullName: string, shortName?: string | null): string {
  return shortName?.trim() || shortNameFromFullName(fullName);
}

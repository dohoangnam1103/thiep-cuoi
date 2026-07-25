const VIETNAMESE_LOCALE = "vi";

export function titleCaseVietnameseName(value: string): string {
  return value
    .normalize("NFC")
    .trim()
    .replace(/\s+/gu, " ")
    .toLocaleLowerCase(VIETNAMESE_LOCALE)
    .replace(
      /(^|[\s'’\-‐‑–—])(\p{L})/gu,
      (_, prefix: string, letter: string) =>
        `${prefix}${letter.toLocaleUpperCase(VIETNAMESE_LOCALE)}`,
    );
}

export function capitalizeVietnameseSentences(value: string): string {
  return value.normalize("NFC").trim().replace(
    /(^|[.!?…]\s+|\n+\s*)([“”"'‘’([{]*)(\p{L})/gu,
    (_, prefix: string, punctuation: string, letter: string) =>
      `${prefix}${punctuation}${letter.toLocaleUpperCase(VIETNAMESE_LOCALE)}`,
  );
}

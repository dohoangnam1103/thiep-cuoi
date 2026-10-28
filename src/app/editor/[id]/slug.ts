export type SlugSource = {
  brideFullName?: string | null;
  groomFullName?: string | null;
  brideShortName?: string | null;
  groomShortName?: string | null;
  brideFirst?: boolean | null;
  date?: string | null;
};

export function slugify(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[đĐ]/g, "d")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function slugifyInput(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[đĐ]/g, "d")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+/, "");
}

export function slugFromFormFields(source: SlugSource): string {
  const bride = (source.brideShortName || source.brideFullName || "").trim();
  const groom = (source.groomShortName || source.groomFullName || "").trim();
  if (!bride && !groom) return "";
  const order = source.brideFirst ?? true ? [bride, groom] : [groom, bride];
  const parts = order.filter(Boolean);
  const dateSlug = dateToSlug(source.date);
  if (dateSlug) parts.push(dateSlug);
  return slugify(parts.join(" "));
}

function dateToSlug(date?: string | null): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec((date ?? "").trim());
  if (!match) return "";
  const [, year, month, day] = match;
  return `${day}${month}${year}`;
}

const SLUG_MAX_LENGTH = 180;

function fitSlug(base: string, suffix = ""): string {
  const tail = suffix ? `-${suffix}` : "";
  const stem = base.slice(0, Math.max(0, SLUG_MAX_LENGTH - tail.length)).replace(/-+$/g, "");
  return `${stem}${tail}`;
}

function dateTimeToSlug(date: Date): string {
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${pad(date.getDate())}${pad(date.getMonth() + 1)}${date.getFullYear()}-${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}`;
}

/**
 * Names first. A taken names-only slug gains the wedding day; a still-taken slug
 * gains the current date and time. `isTaken` must exclude the invitation being
 * published so republishing keeps its existing slug.
 */
export async function uniqueSlugFromFormFields(
  source: SlugSource,
  isTaken: (slug: string) => Promise<boolean>,
  now = new Date(),
): Promise<string> {
  const names = slugFromFormFields({ ...source, date: null }) || "thiep-cuoi";
  const base = fitSlug(names);
  if (!await isTaken(base)) return base;

  const eventDay = dateToSlug(source.date);
  const withEventDay = eventDay ? fitSlug(base, eventDay) : "";
  if (withEventDay && !await isTaken(withEventDay)) return withEventDay;

  const stamp = dateTimeToSlug(now);
  let candidate = fitSlug(base, stamp);
  for (let counter = 1; counter <= 50; counter += 1) {
    if (!await isTaken(candidate)) return candidate;
    candidate = fitSlug(base, `${stamp}-${counter}`);
  }
  return candidate;
}

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

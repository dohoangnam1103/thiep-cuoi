export type SlugSource = {
  brideFullName?: string | null;
  groomFullName?: string | null;
  brideShortName?: string | null;
  groomShortName?: string | null;
  brideFirst?: boolean | null;
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
  return slugify(order.filter(Boolean).join(" "));
}

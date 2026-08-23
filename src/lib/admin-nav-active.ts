export type AdminLocation = {
  pathname: string;
  tab: string | null;
};

function splitHref(href: string): { href: string; path: string; tab: string | null } {
  const [path, query = ""] = href.split("?");
  return { href, path, tab: new URLSearchParams(query).get("tab") };
}

/**
 * Which nav entry the current admin route belongs to, or null when none does —
 * `/admin/invitations/<id>/edit` is only reachable from a table, so nothing
 * should light up there.
 *
 * Three rules, applied in order:
 * - Two entries may share a pathname and differ only by `?tab` (Thiệp demo vs
 *   Thumbnail mobile), so an exact pathname hit is decided by the tab. An
 *   unrecognised tab falls back to the entry without one, which is how
 *   `/admin/demos` itself treats anything that is not "mobile-thumbnail".
 * - Otherwise a detail page lights up its section: `/admin/users/<id>` belongs
 *   to `/admin/users`. The longest matching section wins.
 * - `/admin` never matches as a section. Being a prefix of every admin route,
 *   it would otherwise stay lit on every page.
 */
export function activeAdminNavHref(
  hrefs: string[],
  current: AdminLocation,
): string | null {
  const entries = hrefs.map(splitHref);

  const samePath = entries.filter((entry) => entry.path === current.pathname);
  if (samePath.length > 0) {
    return (
      samePath.find((entry) => entry.tab === current.tab)?.href ??
      samePath.find((entry) => entry.tab === null)?.href ??
      null
    );
  }

  const sections = entries
    .filter(
      (entry) =>
        entry.path !== "/admin" && current.pathname.startsWith(`${entry.path}/`),
    )
    .sort((a, b) => b.path.length - a.path.length);

  return sections[0]?.href ?? null;
}

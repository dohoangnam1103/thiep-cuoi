"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

import { activeAdminNavHref } from "@/lib/admin-nav-active";

export type AdminNavItem = { href: string; label: string };

type AdminNavProps = {
  items: AdminNavItem[];
  /**
   * The sidebar is hidden below `lg`, where the same list is rendered as a
   * scrollable strip instead. Both are always in the DOM, so the styling has to
   * come from a prop rather than a breakpoint inside one class string.
   */
  orientation: "vertical" | "horizontal";
};

const CONTAINER = {
  vertical: "flex flex-col gap-1 text-sm",
  horizontal: "flex items-center gap-1 overflow-x-auto text-sm",
} as const;

const ITEM = {
  vertical: "block rounded-lg px-3 py-2",
  horizontal: "shrink-0 whitespace-nowrap rounded-lg px-3 py-1.5",
} as const;

/**
 * Client-side because the active entry depends on the current URL, which a
 * server layout has no access to. The item list stays in the layout so it is
 * still the one place the nav is defined.
 */
export function AdminNav({ items, orientation }: AdminNavProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const activeHref = activeAdminNavHref(
    items.map((item) => item.href),
    { pathname, tab: searchParams.get("tab") },
  );

  return (
    <nav aria-label="Điều hướng quản trị" className={CONTAINER[orientation]}>
      {items.map((item) => {
        const isActive = item.href === activeHref;
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={isActive ? "page" : undefined}
            className={`${ITEM[orientation]} transition ${
              isActive
                ? "bg-primary/10 font-semibold text-primary"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

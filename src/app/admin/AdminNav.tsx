"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

import { activeAdminNavHref } from "@/lib/admin-nav-active";

export type AdminNavItem = { href: string; label: string };

/**
 * Client-side because the active entry depends on the current URL, which a
 * server layout has no access to. The item list stays in the layout so it is
 * still the one place the nav is defined.
 */
export function AdminNav({ items }: { items: AdminNavItem[] }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const activeHref = activeAdminNavHref(
    items.map((item) => item.href),
    { pathname, tab: searchParams.get("tab") },
  );

  return (
    <nav className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
      {items.map((item) => {
        const isActive = item.href === activeHref;
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={isActive ? "page" : undefined}
            className={
              isActive
                ? "font-semibold text-primary"
                : "text-muted-foreground hover:text-foreground"
            }
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
